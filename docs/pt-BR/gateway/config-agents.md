---
read_when:
    - Ajuste dos padrões do agente (modelos, raciocínio, espaço de trabalho, Heartbeat, mídia, Skills)
    - Configuração de roteamento e vinculações multiagente
    - Ajustando o comportamento de sessão, entrega de mensagens e modo de conversa
summary: Configuração de padrões do agente, roteamento multiagente, sessão, mensagens e conversa
title: Configuração — agentes
x-i18n:
    generated_at: "2026-07-12T15:13:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do Gateway e outras
chaves de nível superior, consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões dos agentes

### `agents.defaults.workspace`

Padrão: `OPENCLAW_WORKSPACE_DIR` quando definida; caso contrário, `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido como um perfil não padrão).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Um valor explícito de `agents.defaults.workspace` tem precedência sobre
`OPENCLAW_WORKSPACE_DIR`. Use a variável de ambiente para direcionar os agentes padrão
a um espaço de trabalho montado quando não quiser gravar esse caminho na configuração.

### `agents.defaults.repoRoot`

Raiz opcional do repositório exibida na linha Runtime do prompt do sistema. Se não for definida, o OpenClaw a detectará automaticamente percorrendo os diretórios acima a partir do espaço de trabalho.

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

- Omita `agents.defaults.skills` para permitir Skills sem restrições por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para não permitir nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final desse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desativa a criação automática dos arquivos de bootstrap do espaço de trabalho (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignora a criação de arquivos opcionais selecionados do espaço de trabalho, mas ainda grava os arquivos de bootstrap obrigatórios (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla quando os arquivos de bootstrap do espaço de trabalho são injetados no prompt do sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos seguros de continuação (após uma resposta concluída do assistente) ignoram a reinjeção do bootstrap do espaço de trabalho, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas após Compaction ainda reconstroem o contexto.
- `"never"`: desativa a injeção do bootstrap do espaço de trabalho e dos arquivos de contexto em todos os turnos. Use essa opção somente para agentes que controlam totalmente o ciclo de vida do próprio prompt (mecanismos de contexto personalizados, runtimes nativos que criam o próprio contexto ou fluxos de trabalho especializados sem bootstrap). Turnos de Heartbeat e de recuperação após Compaction também ignoram a injeção.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Substituição por agente: `agents.list[].contextInjection`. Valores omitidos herdam
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Número máximo de caracteres por arquivo de bootstrap do espaço de trabalho antes do truncamento. Padrão: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Substituição por agente: `agents.list[].bootstrapMaxChars`. Valores omitidos herdam
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Número máximo total de caracteres injetados em todos os arquivos de bootstrap do espaço de trabalho. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Substituição por agente: `agents.list[].bootstrapTotalMaxChars`. Valores omitidos
herdam `agents.defaults.bootstrapTotalMaxChars`.

### Substituições do perfil de bootstrap por agente

Use substituições do perfil de bootstrap por agente quando um agente precisar de um comportamento
de injeção de prompt diferente dos padrões compartilhados. Os campos omitidos herdam de
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

- `"off"`: nunca injeta o texto do aviso de truncamento no prompt do sistema.
- `"once"`: injeta um aviso conciso uma vez por assinatura de truncamento exclusiva.
- `"always"`: injeta um aviso conciso em cada execução quando há truncamento (recomendado).

Contagens brutas/injetadas detalhadas e campos de ajuste da configuração permanecem nos diagnósticos,
como relatórios de contexto/status e logs; o contexto rotineiro de usuário/runtime do WebChat recebe
apenas o aviso conciso de recuperação.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de responsabilidade dos orçamentos de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
intencionalmente divididos por subsistema, em vez de todos passarem por um único
controle genérico.

| Orçamento                                                      | Abrange                                                                                                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Injeção normal do bootstrap do espaço de trabalho                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Prelúdio único da execução do modelo na redefinição/inicialização, incluindo arquivos `memory/*.md` diários recentes. `/new` e `/reset` isolados no chat são confirmados sem invocar o modelo |
| `skills.limits.*`                                              | A lista compacta de Skills injetada no prompt do sistema                                                                                                                     |
| `agents.defaults.contextLimits.*`                              | Trechos limitados do runtime e blocos injetados pertencentes ao runtime                                                                                                      |
| `memory.qmd.limits.*`                                          | Dimensionamento do trecho de pesquisa na memória indexada e da injeção                                                                                                       |

Substituições correspondentes por agente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado nas execuções do modelo após redefinição/inicialização.
Os comandos isolados `/new` e `/reset` no chat confirmam a redefinição sem invocar
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

Padrões compartilhados para superfícies limitadas de contexto do runtime.

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

- `memoryGetMaxChars`: limite padrão do trecho de `memory_get` antes da adição
  dos metadados de truncamento e do aviso de continuação.
- `memoryGetDefaultLines`: janela padrão de linhas de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite avançado para resultados de ferramentas em tempo real, usado em resultados
  persistidos e na recuperação de estouro. Deixe sem definir para usar o limite automático do contexto do modelo:
  `16000` caracteres abaixo de 100K tokens, `32000` caracteres a partir de 100K tokens e `64000`
  caracteres a partir de 200K tokens. Valores explícitos de até `1000000` são aceitos para
  modelos de contexto longo, mas o limite efetivo ainda é restringido a cerca de 30% da
  janela de contexto do modelo. `openclaw doctor --deep` exibe o limite efetivo,
  e o doctor alerta somente quando uma substituição explícita está obsoleta ou não tem efeito.
- `postCompactionMaxChars`: limite do trecho de AGENTS.md usado durante a
  injeção de atualização após Compaction.

#### `agents.list[].contextLimits`

Substituição por agente para os controles compartilhados de `contextLimits`. Campos omitidos herdam
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // limite avançado para este agente
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite global para a lista compacta de Skills injetada no prompt do sistema. Isso
não afeta a leitura dos arquivos `SKILL.md` sob demanda.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Substituição por agente para o orçamento de prompt das Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels para o maior lado da imagem em blocos de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho da carga da solicitação em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferência de compactação/detalhamento da ferramenta de imagem para imagens carregadas de caminhos de arquivo, URLs e referências de mídia.
Padrão: `auto`.

O OpenClaw adapta a escala de redimensionamento ao modelo de imagem selecionado. Por exemplo, Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL e modelos de visão Llama 4 hospedados podem usar imagens maiores do que caminhos de visão de alto detalhamento mais antigos/padrão, enquanto turnos com várias imagens são compactados de forma mais agressiva no modo `auto` para controlar o custo de tokens e a latência.

Valores:

- `auto`: adapta-se aos limites do modelo e à quantidade de imagens.
- `efficient`: prioriza imagens menores para reduzir o uso de tokens e bytes.
- `balanced`: usa a escala intermediária padrão.
- `high`: preserva mais detalhes em capturas de tela, diagramas e imagens de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para os carimbos de data e hora das mensagens). Usa o fuso horário do host como alternativa.

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // parâmetros globais padrão do provedor
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - A forma de string define apenas o modelo principal.
  - A forma de objeto define o modelo principal mais os modelos de failover ordenados.
- `utilityModel`: referência ou alias opcional de `provider/model` para tarefas internas curtas. Atualmente, ele é usado para títulos gerados de sessões da interface de controle, títulos de tópicos de mensagens diretas do Telegram, títulos automáticos de threads do Discord e [narração de rascunhos de progresso](/pt-BR/concepts/progress-drafts#narrated-status). Quando não definido, o OpenClaw deriva o padrão declarado de modelo pequeno do provedor principal, quando houver um (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); caso contrário, as tarefas de título usam como fallback o modelo principal do agente, e a narração permanece desativada. Defina `utilityModel: ""` para desativar completamente o roteamento de utilitários. `agents.list[].utilityModel` substitui o padrão (um valor vazio por agente o desativa para esse agente), e uma substituição de modelo específica da operação tem precedência sobre ambos. As tarefas utilitárias fazem chamadas de modelo separadas e enviam conteúdo específico da tarefa ao provedor do modelo selecionado. A geração de títulos do painel envia no máximo os primeiros 1.000 caracteres da primeira mensagem que não seja um comando; a narração envia a solicitação recebida mais resumos compactos e expurgados das ferramentas. Escolha um provedor que atenda aos seus requisitos de custo e tratamento de dados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como configuração do modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não pode aceitar entrada de imagem.
  - Prefira referências explícitas de `provider/model`. IDs sem provedor são aceitos por compatibilidade; se um ID sem provedor corresponder de forma exclusiva a uma entrada configurada com suporte a imagens em `models.providers.*.models`, o OpenClaw o qualifica com esse provedor. Correspondências configuradas ambíguas exigem um prefixo de provedor explícito.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo recurso compartilhado de geração de imagens e por qualquer futura superfície de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração de imagens nativa do Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images ou `openai/gpt-image-1.5` para saída PNG/WebP da OpenAI com fundo transparente.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação correspondente do provedor (por exemplo, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OAuth do OpenAI Codex para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação configurada. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de imagens registrados, em ordem de ID do provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo recurso compartilhado de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação configurada. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de música registrados, em ordem de ID do provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo recurso compartilhado de geração de vídeos e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação configurada. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de vídeos registrados, em ordem de ID do provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API correspondente do provedor.
  - O plugin oficial de geração de vídeos do Qwen oferece suporte a até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções `size`, `aspectRatio`, `resolution`, `audio` e `watermark` no nível do provedor.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta de PDF usa como fallback `imageModel` e, depois, o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é informado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível de detalhamento padrão dos agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `toolProgressDetail`: modo de detalhamento dos resumos de ferramentas de `/verbose` e das linhas de ferramentas dos rascunhos de progresso. Valores: `"explain"` (padrão, rótulos compactos legíveis por humanos) ou `"raw"` (acrescenta o comando/detalhe bruto quando disponível). `agents.list[].toolProgressDetail` por agente substitui esse padrão.
- `reasoningDefault`: visibilidade padrão do raciocínio para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente substitui esse padrão. Os padrões de raciocínio configurados são aplicados somente a proprietários, remetentes autorizados ou contextos de administrador-operador do Gateway quando nenhuma substituição de raciocínio por mensagem ou sessão está definida.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo, `openai/gpt-5.6-sol` para acesso via OAuth do Codex). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência exclusiva entre os provedores configurados para esse ID exato de modelo e, somente então, usa como fallback o provedor padrão configurado (comportamento de compatibilidade obsoleto; portanto, prefira `provider/model` explícito). Se esse provedor não disponibilizar mais o modelo padrão configurado, o OpenClaw usa como fallback o primeiro provedor/modelo configurado, em vez de expor um padrão obsoleto de um provedor removido.
- `models`: catálogo de modelos configurado e lista de permissões de `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, roteamento `provider` do OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Use entradas `provider/*`, como `"openai/*": {}` ou `"vllm/*": {}`, para mostrar todos os modelos descobertos dos provedores selecionados sem listar manualmente cada ID de modelo.
  - Adicione `agentRuntime` a uma entrada `provider/*` quando todos os modelos descobertos dinamicamente desse provedor precisarem usar o mesmo runtime. A política de runtime exata de `provider/model` ainda tem precedência sobre o curinga.
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você informe `--replace`.
  - Os fluxos de configuração/integração específicos de provedor mesclam os modelos selecionados do provedor nesse mapa e preservam os provedores não relacionados já configurados.
  - Para modelos diretos do OpenAI Responses, a Compaction no lado do servidor é ativada automaticamente. Use `params.responsesServerCompaction: false` para interromper a injeção de `context_management` ou `params.responsesCompactThreshold` para substituir o limite. Consulte [Compaction no lado do servidor da OpenAI](/pt-BR/providers/openai#advanced-configuration).
- `params`: parâmetros globais padrão do provedor aplicados a todos os modelos. Defina-os em `agents.defaults.params` (por exemplo, `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo) e, depois, `agents.list[].params` (ID de agente correspondente) substitui por chave. Consulte [Cache de prompts](/pt-BR/reference/prompt-caching) para obter detalhes.
- `models.providers.openrouter.params.provider`: política padrão de roteamento de provedores em todo o OpenRouter. O OpenClaw encaminha isso ao objeto `provider` da solicitação do OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo e os parâmetros do agente substituem por chave. Consulte [Roteamento de provedores do OpenRouter](/pt-BR/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avançado de passagem direta, mesclado aos corpos das solicitações `api: "openai-completions"` para proxies compatíveis com a OpenAI. Se houver conflito com chaves geradas da solicitação, o corpo extra tem precedência; as rotas de completions não nativas ainda removem depois o campo `store`, exclusivo da OpenAI.
- `params.chat_template_kwargs`: argumentos de modelo de chat compatíveis com vLLM/OpenAI, mesclados aos corpos de nível superior das solicitações `api: "openai-completions"`. Para `vllm/nemotron-3-*` com o raciocínio desativado, o plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícito substitui os padrões gerados, e `extra_body.chat_template_kwargs` ainda tem a precedência final. Os modelos de raciocínio Qwen e Nemotron configurados no vLLM expõem opções binárias de `/think` (`off`, `on`) em vez da escala de esforço com vários níveis.
- `compat.thinkingFormat`: estilo de payload de raciocínio compatível com a OpenAI. Use `"together"` para `reasoning.enabled` no estilo Together, `"qwen"` para `enable_thinking` de nível superior no estilo Qwen ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em backends da família Qwen que aceitam kwargs de modelo de chat no nível da solicitação, como o vLLM. O OpenClaw mapeia o raciocínio desativado para `false` e o ativado para `true`, e os modelos Qwen configurados no vLLM expõem opções binárias de `/think` para esses formatos.
- `compat.supportedReasoningEfforts`: lista de níveis de esforço de raciocínio compatível com a OpenAI por modelo. Inclua `"xhigh"` para endpoints personalizados que realmente o aceitem; então, o OpenClaw expõe `/think xhigh` nos menus de comandos, nas linhas de sessão do Gateway, na validação de patches de sessão, na validação da CLI do agente e na validação de `llm-task` para esse provedor/modelo configurado. Use `compat.reasoningEffortMap` quando o backend exigir um valor específico do provedor para um nível canônico.
- `params.preserveThinking`: opção exclusiva da Z.AI para preservar o raciocínio. Quando ativada e o raciocínio está habilitado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz o `reasoning_content` anterior; consulte [Raciocínio e preservação de raciocínio da Z.AI](/pt-BR/providers/zai#advanced-configuration).
- `localService`: gerenciador opcional de processos no nível do provedor para servidores de modelos locais/auto-hospedados. Quando o modelo selecionado pertence a esse provedor, o OpenClaw verifica `healthUrl` (ou `baseUrl + "/models"`), inicia `command` com `args` se o endpoint estiver indisponível, aguarda até `readyTimeoutMs` e, em seguida, envia a solicitação do modelo. `command` deve ser um caminho absoluto. `idleStopMs: 0` mantém o processo ativo até o encerramento do OpenClaw; um valor positivo encerra o processo iniciado pelo OpenClaw após essa quantidade de milissegundos de inatividade. Consulte [Serviços de modelos locais](/pt-BR/gateway/local-model-services).
- A política de runtime pertence aos provedores ou modelos, não a `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para regras aplicáveis a todo o provedor ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para regras específicas de modelo. Um prefixo de provedor/modelo isolado nunca seleciona um harness. Com o runtime indefinido ou definido como `auto`, a OpenAI pode selecionar implicitamente o Codex somente para uma rota oficial HTTPS exata de Platform Responses ou ChatGPT Responses, sem substituição de solicitação definida pelo autor. Consulte [Runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).
- Gravadores de configuração que alteram esses campos (por exemplo, `/models set`, `/models set-image` e comandos para adicionar/remover fallbacks) salvam a forma de objeto canônica e preservam as listas de fallback existentes quando possível.
- `maxConcurrent`: número máximo de execuções paralelas de agentes entre sessões (cada sessão continua serializada). Padrão: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, um id de harness de Plugin registrado ou um alias de backend de CLI compatível. O Plugin Codex incluído registra `codex`; o Plugin Anthropic incluído fornece o backend de CLI `claude-cli`.
- `id: "auto"` permite que harnesses de Plugin registrados assumam rotas efetivas que declarem ou atendam de outra forma ao seu contrato de compatibilidade e usa o OpenClaw quando nenhum harness corresponde. Um runtime de Plugin explícito, como `id: "codex"`, exige esse harness e uma rota efetiva compatível; ele falha de forma fechada se qualquer um deles estiver indisponível ou se a execução falhar.
- `id: "pi"` é aceito apenas como um alias obsoleto de `openclaw` para preservar configurações distribuídas na v2026.5.22 e em versões anteriores. Novas configurações devem usar `openclaw`.
- A precedência de runtime é: primeiro, a política de modelo exata (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`); depois, `agents.list[]` / `agents.defaults.models["provider/*"]`; por fim, a política geral do provedor em `models.providers.<provider>.agentRuntime`.
- As chaves de runtime do agente inteiro são legadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, as fixações de runtime da sessão e `OPENCLAW_AGENT_RUNTIME` são ignoradas pela seleção de runtime. Execute `openclaw doctor --fix` para remover valores obsoletos.
- Rotas oficiais HTTPS qualificadas e exatas do OpenAI Responses/ChatGPT, sem substituição de solicitação definida pelo autor, podem usar implicitamente o harness Codex. `agentRuntime.id: "codex"` do provedor/modelo torna o Codex um requisito com falha fechada, mas não torna compatível uma rota incompatível.
- Para implantações do Claude CLI, prefira `model: "anthropic/claude-opus-4-8"` junto com `agentRuntime.id: "claude-cli"` no escopo do modelo. Referências legadas `claude-cli/<model>` ainda funcionam para compatibilidade, mas novas configurações devem manter canônica a seleção de provedor/modelo e colocar o backend de execução na política de runtime do provedor/modelo.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Abreviações de aliases integrados** (aplicam-se somente quando o modelo está em `agents.defaults.models`):

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

Seus aliases configurados sempre têm precedência sobre os padrões.

Os modelos Z.AI GLM-4.x ativam automaticamente o modo de raciocínio, a menos que você defina `--thinking off` ou configure `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Os modelos Z.AI ativam `tool_stream` por padrão para o streaming de chamadas de ferramentas. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
O Anthropic Claude Opus 4.8 mantém o raciocínio desativado por padrão no OpenClaw; quando o raciocínio adaptativo é ativado explicitamente, o padrão de esforço controlado pelo provedor Anthropic é `high`. Os modelos Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de raciocínio é definido.

### `agents.defaults.cliBackends`

Backends de CLI opcionais para execuções alternativas somente de texto (sem chamadas de ferramentas). Úteis como reserva quando os provedores de API falham.

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

- Os backends de CLI priorizam texto; as ferramentas ficam sempre desativadas.
- Há suporte a sessões quando `sessionArg` está definido.
- Há suporte ao repasse de imagens quando `imageArg` aceita caminhos de arquivos.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que um backend recupere sessões
  invalidadas seguras a partir de uma parte final limitada da transcrição bruta do OpenClaw antes que
  exista o primeiro resumo de Compaction. Alterações no perfil de autenticação ou na época das credenciais
  ainda nunca fazem nova semeadura bruta.

### `agents.defaults.promptOverlays`

Sobreposições de prompt independentes de provedor aplicadas por família de modelos às superfícies de prompt montadas pelo OpenClaw. Os ids de modelos da família GPT-5 recebem o contrato de comportamento compartilhado entre as rotas do OpenClaw/provedor; `personality` controla somente a camada de estilo de interação amigável. As rotas nativas do servidor de aplicativos Codex mantêm as instruções básicas/de modelo controladas pelo Codex em vez dessa sobreposição GPT-5 do OpenClaw, e o OpenClaw desativa a personalidade integrada do Codex para threads nativas.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // amigável | ativado | desativado
        },
      },
    },
  },
}
```

- `"friendly"` (padrão) e `"on"` ativam a camada de estilo de interação amigável.
- `"off"` desativa somente a camada amigável; o contrato de comportamento GPT-5 identificado por tag permanece ativado.
- O valor legado `plugins.entries.openai.config.personality` ainda é lido quando essa configuração compartilhada não está definida.

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
        includeSystemPromptSection: true, // padrão: true; false omite a seção Heartbeat do prompt de sistema
        lightContext: false, // padrão: false; true mantém somente HEARTBEAT.md dos arquivos de inicialização do espaço de trabalho
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma nova sessão (sem histórico da conversa)
        skipWhenBusy: false, // padrão: false; true também aguarda as pistas de subagentes/aninhadas deste agente
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (padrão) | block
        target: "none", // padrão: none | opções: last | whatsapp | telegram | discord | ...
        prompt: "Leia HEARTBEAT.md se ele existir...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação por chave de API) ou `1h` (autenticação OAuth). Defina como `0m` para desativar.
- `includeSystemPromptSection`: quando é false, omite a seção Heartbeat do prompt de sistema e ignora a injeção de `HEARTBEAT.md` no contexto de inicialização. Padrão: `true`.
- `suppressToolErrorWarnings`: quando é true, suprime cargas de avisos de erro de ferramentas durante execuções de Heartbeat.
- `timeoutSeconds`: tempo máximo permitido, em segundos, para um turno de agente de Heartbeat antes que ele seja abortado. Deixe sem definir para usar `agents.defaults.timeoutSeconds` quando configurado; caso contrário, usa a cadência de Heartbeat limitada a 600 segundos.
- `directPolicy`: política de entrega direta/por DM. `allow` (padrão) permite a entrega a um destino direto. `block` suprime a entrega a um destino direto e emite `reason=dm-blocked`.
- `lightContext`: quando é true, as execuções de Heartbeat usam um contexto de inicialização leve e mantêm somente `HEARTBEAT.md` dos arquivos de inicialização do espaço de trabalho.
- `isolatedSession`: quando é true, cada Heartbeat é executado em uma nova sessão sem histórico anterior da conversa. Segue o mesmo padrão de isolamento do Cron `sessionTarget: "isolated"`. Reduz o custo de tokens por Heartbeat de ~100K para ~2-5K tokens.
- `skipWhenBusy`: quando é true, as execuções de Heartbeat são adiadas nas pistas adicionais ocupadas desse agente: o trabalho de subagente associado à própria chave de sessão ou de comandos aninhados. As pistas de Cron sempre adiam Heartbeats, mesmo sem essa flag.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam Heartbeats.
- Heartbeats executam turnos completos do agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // padrão | proteção
        provider: "my-provider", // id de um Plugin de provedor de Compaction registrado (opcional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // estrita | desativada | personalizada
        identifierInstructions: "Preserve exatamente os IDs de implantação, IDs de tíquetes e pares host:porta.", // usado quando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // verificação opcional da pressão do ciclo de ferramentas
        postIndexSync: "async", // desativada | assíncrona | aguardar
        postCompactionSections: ["Session Startup", "Red Lines"], // aceite explícito da reinjeção de seções de AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // substituição opcional de modelo somente para Compaction
        truncateAfterCompaction: true, // alterna para um JSONL sucessor menor após a Compaction
        maxActiveTranscriptBytes: "20mb", // gatilho opcional de Compaction local na verificação preliminar
        notifyUser: true, // avisos quando a Compaction começa/termina e em caso de degradação da descarga de memória (padrão: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // substituição opcional de modelo somente para descarga de memória
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "A sessão está se aproximando da Compaction. Armazene memórias duradouras agora.",
          prompt: "Grave quaisquer notas duradouras em memory/YYYY-MM-DD.md; responda com o token silencioso exato NO_REPLY se não houver nada para armazenar.",
        },
      },
    },
  },
}
```

- `mode`: `default` ou `safeguard` (resumo em partes para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: id de um plugin de provedor de Compaction registrado. Quando definido, o método `summarize()` do provedor é chamado em vez do resumo integrado por LLM. Em caso de falha, recorre ao recurso integrado. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de Compaction antes que o OpenClaw a interrompa. Padrão: `180`.
- `reserveTokens`: margem de tokens mantida disponível para a saída do modelo e futuros resultados de ferramentas após a Compaction. Quando a janela de contexto do modelo é conhecida, o OpenClaw limita a reserva efetiva para que ela não consuma o orçamento do prompt.
- `reserveTokensFloor`: reserva mínima imposta pelo runtime incorporado. Defina como `0` para desativar o limite mínimo. O limite mínimo continua sujeito ao limite ativo da janela de contexto.
- `keepRecentTokens`: orçamento do ponto de corte do agente para manter literalmente a parte mais recente da transcrição. O comando manual `/compact` respeita essa configuração quando ela é definida explicitamente; caso contrário, a Compaction manual é um ponto de verificação rígido.
- `recentTurnsPreserve`: número de turnos mais recentes de usuário/assistente mantidos literalmente fora do resumo de proteção. Padrão: `3`.
- `maxHistoryShare`: fração máxima do orçamento total de contexto permitida para o histórico retido após a Compaction (intervalo de `0.1` a `0.9`).
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` adiciona ao início orientações integradas para retenção de identificadores opacos durante o resumo da Compaction.
- `identifierInstructions`: texto personalizado opcional para preservação de identificadores, usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações que repetem a tentativa em caso de saída malformada nos resumos de proteção. Ativadas por padrão no modo de proteção; defina `enabled: false` para ignorar a auditoria.
- `midTurnPrecheck`: verificação opcional de pressão no loop de ferramentas. Quando `enabled: true`, o OpenClaw verifica a pressão de contexto após anexar os resultados das ferramentas e antes da próxima chamada ao modelo. Se o contexto não couber mais, ele interrompe a tentativa atual antes de enviar o prompt e reutiliza o caminho de recuperação existente da pré-verificação para truncar os resultados das ferramentas ou executar a Compaction e tentar novamente. Funciona com os modos de Compaction `default` e `safeguard`. Padrão: desativado.
- `postIndexSync`: modo de reindexação da memória da sessão após a Compaction. Padrão: `"async"`. Use `"await"` para obter a maior atualização possível, `"async"` para reduzir a latência da Compaction ou `"off"` somente quando a sincronização da memória da sessão for tratada em outro lugar.
- `postCompactionSections`: nomes opcionais de seções H2/H3 do AGENTS.md a serem reinjetadas após a Compaction. A reinjeção fica desativada quando a opção não é definida ou é definida como `[]`. Definir explicitamente `["Session Startup", "Red Lines"]` ativa esse par e preserva o fallback legado `Every Session`/`Safety`. Ative isso somente quando o contexto adicional compensar o risco de duplicar orientações do projeto já capturadas no resumo da Compaction.
- `model`: `provider/model-id` opcional ou alias simples de `agents.defaults.models`, usado somente para o resumo da Compaction. Os aliases simples são resolvidos antes do envio; em caso de colisão, os IDs literais de modelo configurados têm precedência. Use esta opção quando a sessão principal precisar manter um modelo, mas os resumos da Compaction devam ser executados em outro; quando não definida, a Compaction usa o modelo principal da sessão.
- `truncateAfterCompaction`: alterna a transcrição ativa da sessão após a Compaction para que os turnos futuros carreguem somente o resumo e a parte não resumida, enquanto a transcrição completa anterior permanece arquivada. Evita o crescimento ilimitado da transcrição ativa em sessões de longa duração. Padrão: `false`.
- `maxActiveTranscriptBytes`: limite opcional em bytes (`number` ou strings como `"20mb"`) que aciona a Compaction local normal antes de uma execução quando o histórico da transcrição ultrapassa esse limite. Exige `truncateAfterCompaction` para que uma Compaction bem-sucedida possa alternar para uma transcrição sucessora menor. Desativado quando não definido ou definido como `0`.
- `notifyUser`: quando `true`, envia ao usuário avisos breves de manutenção do contexto: quando a Compaction começa e termina (por exemplo, "Compactando o contexto..." e "Compaction concluída") e quando uma descarga de memória anterior à Compaction se esgota, fazendo com que a resposta continue em estado degradado (por exemplo, "A manutenção da memória falhou temporariamente; continuando sua resposta."). Desativado por padrão para manter esses avisos silenciosos.
- `memoryFlush`: turno agêntico silencioso antes da Compaction automática para armazenar memórias duráveis. Defina `model` como um provedor/modelo exato, como `ollama/qwen3:8b`, quando esse turno de manutenção precisar permanecer em um modelo local; a substituição não herda a cadeia de fallback da sessão ativa. `forceFlushTranscriptBytes` força a descarga quando o tamanho da transcrição atinge o limite, mesmo que os contadores de tokens estejam desatualizados. Ignorado quando o espaço de trabalho é somente leitura.

### `agents.defaults.runRetries`

Limites de iterações de repetição do loop externo de execução para o runtime incorporado do agente, a fim de evitar loops de execução infinitos durante a recuperação de falhas. Essa configuração se aplica somente ao runtime incorporado do agente, não aos runtimes ACP ou CLI.

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
        runRetries: { max: 50 }, // substituições opcionais por agente
      },
    ],
  },
}
```

- `base`: número base de iterações de repetição da execução para o loop externo de execução. Padrão: `24`.
- `perProfile`: iterações adicionais de repetição da execução concedidas por candidato a perfil de fallback. Padrão: `8`.
- `min`: limite mínimo absoluto de iterações de repetição da execução. Padrão: `32`.
- `max`: limite máximo absoluto de iterações de repetição da execução para evitar execução descontrolada. Padrão: `160`.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviá-lo à LLM. **Não** modifica o histórico da sessão no disco. Desativado por padrão; defina `mode: "cache-ttl"` para ativar.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // desativado (padrão) | cache-ttl
        ttl: "1h", // duração (ms/s/m/h), unidade padrão: minutos; padrão: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Conteúdo antigo do resultado da ferramenta removido]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento do modo cache-ttl">

- `mode: "cache-ttl"` ativa as passagens de remoção.
- `ttl` controla com que frequência a remoção pode ser executada novamente (após o último acesso ao cache). Padrão: `5m`.
- A remoção primeiro reduz parcialmente os resultados de ferramentas grandes demais e, depois, remove por completo os resultados de ferramentas mais antigos, se necessário.
- `softTrimRatio` e `hardClearRatio` aceitam valores de `0.0` a `1.0`; a validação da configuração rejeita valores fora desse intervalo.

A **redução parcial** mantém o início e o fim e insere `...` no meio.

A **remoção completa** substitui todo o resultado da ferramenta pelo texto de substituição.

Observações:

- Blocos de imagem nunca são reduzidos nem removidos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se houver menos de `keepLastAssistants` mensagens do assistente, a remoção será ignorada.

</Accordion>

Consulte [Remoção de sessões](/pt-BR/concepts/session-pruning) para obter detalhes sobre o comportamento.

### Streaming em blocos

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (padrão) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Canais que não sejam do Telegram exigem `*.blockStreaming: true` explícito para ativar respostas em blocos.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Discord, Google Chat, Mattermost, MS Teams, Signal e Slack usam por padrão `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: limite preferencial do bloco (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: pausa aleatória entre respostas em blocos. Padrão: `off`. `natural` = 800-2500ms. `custom` usa `minMs`/`maxMs` (recorre ao intervalo natural para qualquer limite não definido). Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para obter detalhes sobre o comportamento e a divisão em blocos.

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
- Padrão de `typingIntervalSeconds`: `6`.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Indicadores de digitação](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Isolamento opcional para o agente incorporado. Consulte [Isolamento](/pt-BR/gateway/sandboxing) para ver o guia completo.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (padrão) | non-main | all
        backend: "docker", // docker (padrão) | ssh | openshell
        scope: "agent", // session | agent (padrão) | shared
        workspaceAccess: "none", // none (padrão) | ro | rw
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
          gpus: "all",
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
          // Conteúdos de SecretRefs / embutidos também são compatíveis:
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

Os padrões mostrados acima (imagem `off`/`docker`/`agent`/`none`/`bookworm-slim`, rede `none` etc.) são os padrões reais do OpenClaw, não apenas valores ilustrativos.

<Accordion title="Detalhes do sandbox">

**Backend:**

- `docker`: runtime local do Docker (padrão)
- `ssh`: runtime remoto genérico baseado em SSH
- `openshell`: runtime do OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime são movidas para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para espaços de trabalho por escopo (padrão: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdo embutido ou SecretRefs que o OpenClaw materializa em arquivos temporários durante o runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chaves de host do OpenSSH (ambos têm `true` como padrão)

**Precedência da autenticação SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Os valores `*Data` baseados em SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes do início da sessão de sandbox

**Comportamento do backend SSH:**

- inicializa o espaço de trabalho remoto uma vez após a criação ou recriação
- depois mantém o espaço de trabalho SSH remoto como canônico
- encaminha `exec`, ferramentas de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente as alterações remotas de volta ao host
- não oferece suporte a contêineres de navegador do sandbox

**Acesso ao espaço de trabalho:**

- `none`: espaço de trabalho do sandbox por escopo em `~/.openclaw/sandboxes` (padrão)
- `ro`: espaço de trabalho do sandbox em `/workspace`, com o espaço de trabalho do agente montado como somente leitura em `/agent`
- `rw`: espaço de trabalho do agente montado para leitura/gravação em `/workspace`

**Escopo:**

- `session`: contêiner + espaço de trabalho por sessão
- `agent`: um contêiner + espaço de trabalho por agente (padrão)
- `shared`: contêiner e espaço de trabalho compartilhados (sem isolamento entre sessões)

**Configuração do Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // espelho (padrão) | remoto
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional da política do OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo do OpenShell:**

- `mirror`: inicializa o remoto a partir do local antes da execução e sincroniza de volta após a execução; o espaço de trabalho local permanece canônico
- `remote`: inicializa o remoto uma vez quando o sandbox é criado e depois mantém o espaço de trabalho remoto como canônico

No modo `remote`, as edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente com o sandbox após a etapa de inicialização.
O transporte é feito por SSH para o sandbox do OpenShell, mas o Plugin gerencia o ciclo de vida do sandbox e a sincronização espelhada opcional.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Requer saída de rede, raiz gravável e usuário root.

**Por padrão, os contêineres usam `network: "none"`** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso externo.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (uso emergencial).
As interações do servidor de aplicativos Codex em um sandbox ativo do OpenClaw usam essa mesma configuração de saída para o acesso à rede nativo do modo de código.

**Anexos recebidos** são preparados em `media/inbound/*` no espaço de trabalho ativo.

**`docker.binds`** monta diretórios adicionais do host; as montagens globais e por agente são mescladas.

**Navegador em sandbox** (`sandbox.browser.enabled`, padrão `false`): Chromium + CDP em um contêiner. A URL do noVNC é injetada no prompt do sistema. Não requer `browser.enabled` em `openclaw.json`.
Por padrão, o acesso de observador do noVNC usa autenticação VNC, e o OpenClaw emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) impede que sessões em sandbox controlem o navegador do host.
- `network` usa `openclaw-sandbox-browser` como padrão (rede bridge dedicada). Defina como `bridge` somente quando quiser explicitamente conectividade global pela bridge. `"host"` também é bloqueado aqui.
- `cdpSourceRange` restringe opcionalmente a entrada do CDP na borda do contêiner a um intervalo CIDR (por exemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do navegador do sandbox. Quando definido (inclusive como `[]`), substitui `docker.binds` para o contêiner do navegador.
- O Chromium do contêiner do navegador do sandbox sempre é iniciado com `--no-sandbox --disable-setuid-sandbox` (os contêineres não têm os recursos primitivos do kernel necessários para o próprio sandbox do Chrome); não há opção de configuração para isso.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts de contêiner:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` e `--disable-software-rasterizer` são
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `--disable-extensions` (habilitado por padrão); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    reabilita as extensões se o seu fluxo de trabalho depender delas.
  - `--renderer-process-limit=2` por padrão; altere com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processos padrão do Chromium.
  - `--headless=new` somente quando `headless` está habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem personalizada do navegador com um
    ponto de entrada personalizado para alterar os padrões do contêiner.

</Accordion>

O isolamento do navegador em sandbox e `sandbox.docker.binds` são exclusivos do Docker.

Compile as imagens (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do navegador
```

Para instalações via npm sem um checkout do código-fonte, consulte [Sandbox § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para obter comandos `docker build` embutidos.

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para atribuir a um agente seu próprio provedor de TTS, voz, modelo,
estilo ou modo de TTS automático. O bloco do agente é mesclado recursivamente sobre
`messages.tts`, portanto as credenciais compartilhadas podem permanecer em um único local, enquanto agentes
individuais substituem apenas os campos de voz ou provedor de que precisam. A substituição do agente ativo
se aplica a respostas faladas automáticas, `/tts audio`, `/tts status` e
à ferramenta de agente `tts`. Consulte [Conversão de texto em fala](/pt-BR/tools/tts#per-agent-voice-overrides)
para ver exemplos de provedores e a precedência.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Agente principal",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // substituição do nível de pensamento por agente
        reasoningDefault: "on", // substituição da visibilidade do raciocínio por agente
        fastModeDefault: false, // substituição do modo rápido por agente
        params: { cacheRetention: "none" }, // substitui por chave os parâmetros correspondentes de defaults.models
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // substitui agents.defaults.skills quando definido
        identity: {
          name: "Samantha",
          theme: "preguiça prestativa",
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
            mode: "persistent", // persistente | execução única
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
- `default`: quando vários estão definidos, o primeiro prevalece (um aviso é registrado). Se nenhum estiver definido, a primeira entrada da lista será o padrão.
- `model`: a forma de string define um modelo primário estrito por agente, sem fallback de modelo; a forma de objeto `{ primary }` também é estrita, a menos que você adicione `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar fallback para esse agente ou `{ primary, fallbacks: [] }` para tornar explícito o comportamento estrito. Tarefas Cron que substituem apenas `primary` ainda herdam os fallbacks padrão, a menos que você defina `fallbacks: []`.
- `utilityModel`: substituição opcional por agente para tarefas internas curtas, como títulos gerados de sessões e threads. Usa como fallback `agents.defaults.utilityModel`, depois o modelo pequeno padrão declarado pelo provedor primário e, por fim, o modelo primário desse agente. Uma string vazia desabilita o roteamento de utilidade para esse agente.
- `params`: parâmetros de fluxo por agente mesclados sobre a entrada do modelo selecionado em `agents.defaults.models`. Use isso para substituições específicas do agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `tts`: substituições opcionais de conversão de texto em fala por agente. O bloco é mesclado recursivamente sobre `messages.tts`; portanto, mantenha as credenciais compartilhadas do provedor e a política de fallback em `messages.tts` e defina aqui apenas valores específicos da persona, como provedor, voz, modelo, estilo ou modo automático.
- `skills`: lista de permissões opcional de Skills por agente. Se omitida, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclá-los, e `[]` significa nenhuma Skill.
- `thinkingDefault`: nível de pensamento padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para esse agente quando nenhuma substituição por mensagem ou sessão estiver definida. O perfil de provedor/modelo selecionado controla quais valores são válidos; para o Google Gemini, `adaptive` mantém o pensamento dinâmico controlado pelo provedor (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade padrão opcional do raciocínio por agente (`on | off | stream`). Substitui `agents.defaults.reasoningDefault` para esse agente quando nenhuma substituição de raciocínio por mensagem ou sessão estiver definida.
- `fastModeDefault`: padrão opcional por agente para o modo rápido (`"auto" | true | false`). Aplica-se quando nenhuma substituição do modo rápido por mensagem ou sessão estiver definida.
- `models`: substituições opcionais do catálogo de modelos/runtime por agente, indexadas por ids completos `provider/model`. Use `models["provider/model"].agentRuntime` para exceções de runtime por agente.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com os padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões do harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- Arquivos de imagem locais de `identity.avatar` relativos ao workspace são limitados a 2 MB. URLs `http(s)` e URIs `data:` não são verificadas em relação ao limite de tamanho de arquivo local.
- `identity` deriva os padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: lista de permissões de ids de agentes configurados para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = qualquer destino configurado; padrão: somente o mesmo agente). Inclua o id do solicitante quando chamadas de `agentId` direcionadas a si próprio devam ser permitidas. Entradas obsoletas cuja configuração de agente foi excluída são rejeitadas por `sessions_spawn` e omitidas de `agents_list`; execute `openclaw doctor --fix` para removê-las ou adicione uma entrada mínima em `agents.list[]` caso esse destino deva continuar podendo ser iniciado enquanto herda os padrões.
- Proteção de herança do sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeitará destinos que seriam executados fora do sandbox.
- `subagents.requireAgentId`: quando verdadeiro, bloqueia chamadas de `sessions_spawn` que omitam `agentId` (força a seleção explícita do perfil; padrão: falso).
- `subagents.maxConcurrent`: máximo de execuções simultâneas de agentes filhos em toda a execução de subagentes. Padrão: `8`.
- `subagents.maxChildrenPerAgent`: máximo de filhos ativos que uma única sessão de agente pode iniciar. Padrão: `5`.
- `subagents.maxSpawnDepth`: profundidade máxima de aninhamento para iniciar subagentes (`1`-`5`). Padrão: `1` (sem aninhamento).
- `subagents.archiveAfterMinutes`: tempo antes que o estado concluído do subagente seja arquivado. Padrão: `60`.

---

## Roteamento multiagente

Execute vários agentes isolados dentro de um único Gateway. Consulte [Multiagente](/pt-BR/concepts/multi-agent).

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

### Campos de correspondência da vinculação

- `type` (opcional): `route` para roteamento normal (a ausência do tipo usa route como padrão), `acp` para vinculações persistentes de conversas ACP.
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

Dentro de cada nível, a primeira entrada correspondente de `bindings` prevalece.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem dos níveis de vinculação de rota acima.

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

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para obter detalhes sobre a precedência.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (padrão) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // orçamento rígido opcional
      highWaterBytes: "400mb", // meta opcional de limpeza
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // remoção automática padrão do foco após inatividade, em horas (`0` desabilita)
      maxAgeHours: 0, // idade máxima rígida padrão, em horas (`0` desabilita)
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

<Accordion title="Detalhes dos campos da sessão">

- **`scope`**: estratégia base de agrupamento de sessões para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use somente quando o contexto compartilhado for intencional).
- **`dmScope`**: como as mensagens diretas são agrupadas.
  - `main`: todas as mensagens diretas compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada com vários usuários).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para várias contas).
- **`identityLinks`**: mapeia ids canônicos para pares prefixados pelo provedor para compartilhamento de sessões entre canais. Comandos de acoplamento, como `/dock_discord`, usam o mesmo mapa para alternar a rota de resposta da sessão ativa para outro par de canal vinculado; consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking).
- **`reset`**: política principal de redefinição. `daily` redefine no horário local indicado por `atHour`; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, prevalece o que expirar primeiro. A validade da redefinição diária usa o `sessionStartedAt` da linha da sessão; a validade da redefinição por inatividade usa `lastInteractionAt`. Gravações de eventos em segundo plano/do sistema, como Heartbeat, ativações de Cron, notificações de execução e manutenção de registros do Gateway, podem atualizar `updatedAt`, mas não mantêm válidas as sessões diárias/por inatividade.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O `dm` legado é aceito como alias de `direct`.
- **`resetByChannel`**: substituições de redefinição por canal, indexadas pelo id do provedor/canal. Quando o canal da sessão tem uma entrada correspondente, ela prevalece integralmente sobre `resetByType`/`reset` para essa sessão. Use somente quando um canal precisar de um comportamento de redefinição diferente da política por tipo.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o agrupamento principal de chats diretos.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas entre agentes (inteiro, intervalo: `0`-`20`, padrão: `5`). `0` desativa o encadeamento de pingue-pongue.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com o alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação prevalece.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `enforce` aplica a limpeza e é o padrão; `warn` apenas emite avisos.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas de sessão no SQLite (padrão `500`). As gravações do runtime executam a limpeza em lote com uma pequena margem acima do limite para limites compatíveis com produção; `openclaw sessions cleanup --enforce` aplica o limite imediatamente.
  - Sessões efêmeras de sondagem de execução de modelo do Gateway usam uma retenção fixa de `24h`, mas a limpeza é condicionada à pressão: ela remove linhas obsoletas de sondagens estritas de execução de modelo somente quando a pressão de manutenção/limite de entradas de sessão é atingida. Somente chaves explícitas e estritas de sondagem correspondentes a `agent:*:explicit:model-run-<uuid>` são elegíveis; sessões normais diretas, de grupo, thread, Cron, hook, Heartbeat, ACP e subagentes não herdam essa retenção de 24h. Quando a limpeza de execuções de modelo é realizada, ela ocorre antes da limpeza mais ampla de entradas obsoletas de `pruneAfter` e do limite `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` o remove de configurações antigas.
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. O padrão é `pruneAfter`; defina como `false` para desativar.
  - `maxDiskBytes`: orçamento de disco opcional para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: meta opcional após a limpeza do orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`writeLock`**: controles de bloqueio de gravação da transcrição da sessão. Ajuste somente quando a preparação legítima de transcrições, limpeza, Compaction ou espelhamento disputar o bloqueio por mais tempo que as políticas padrão.
  - `acquireTimeoutMs`: milissegundos de espera durante a aquisição de um bloqueio antes de relatar a sessão como ocupada. Padrão: `60000`; substituição por variável de ambiente `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: milissegundos até que um bloqueio existente seja considerado obsoleto e recuperado. Padrão: `1800000`; substituição por variável de ambiente `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: milissegundos durante os quais um bloqueio mantido no processo pode permanecer retido antes que o mecanismo de monitoramento o libere. Padrão: `300000`; substituição por variável de ambiente `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a threads.
  - `enabled`: opção mestre padrão (os provedores podem substituir; o Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desfoco automático padrão após inatividade, em horas (`0` desativa; os provedores podem substituir)
  - `maxAgeHours`: idade máxima absoluta padrão, em horas (`0` desativa; os provedores podem substituir)
  - `spawnSessions`: controle padrão para criar sessões de trabalho vinculadas a threads por meio de `sessions_spawn` e inicializações de threads ACP. O padrão é `true` quando os vínculos de thread estão ativados; provedores/contas podem substituir.
  - `defaultSpawnContext`: contexto nativo padrão do subagente para inicializações vinculadas a threads (`"fork"` ou `"isolated"`). O padrão é `"fork"`.

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (padrão) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (padrão)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Resolução (a mais específica prevalece): conta → canal → global. `""` desativa e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de modelo:**

| Variável          | Descrição                    | Exemplo                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo         | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor             | `anthropic`                 |
| `{thinkingLevel}` | Nível de raciocínio atual    | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias de `{thinkingLevel}`.

### Reação de confirmação

- O padrão é `identity.emoji` do agente ativo ou, caso contrário, `"👀"`. Defina como `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → alternativa da identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all` ou `off`/`none` (desativa completamente as reações de confirmação).
- `removeAckAfterReply`: remove a confirmação após a resposta em canais compatíveis com reações, como Slack, Discord, Signal, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: ativa reações de status do ciclo de vida no Slack, Discord, Signal, Telegram e WhatsApp.
  No Discord, quando não definido, mantém as reações de status ativadas se as reações de confirmação estiverem ativas.
  No Slack, Signal, Telegram e WhatsApp, defina-o explicitamente como `true` para ativar as reações de status do ciclo de vida.
  Por padrão, o Slack usa seu status nativo de thread do assistente e mensagens rotativas de carregamento para indicar o progresso, enquanto mantém estática a reação de confirmação configurada.
- `messages.statusReactions.emojis`: substitui as chaves de emoji do ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` e `stallHard`.
  O Telegram permite apenas um conjunto fixo de reações; portanto, emojis configurados sem suporte usam como alternativa
  a variante de status compatível mais próxima para esse chat.

### Fila

- `mode`: estratégia de fila para mensagens recebidas enquanto uma execução de sessão está ativa. Padrão: `"steer"`.
  - `steer`: injeta o novo prompt na execução ativa.
  - `followup`: executa o novo prompt após a conclusão da execução ativa.
  - `collect`: agrupa mensagens compatíveis e as executa juntas posteriormente.
  - `interrupt`: interrompe a execução ativa antes de iniciar o prompt mais recente.
- `debounceMs`: atraso antes de despachar uma mensagem enfileirada/direcionada. Padrão: `500`.
- `cap`: número máximo de mensagens enfileiradas antes da aplicação da política de descarte. Padrão: `20`.
- `drop`: estratégia quando o limite é excedido. `"summarize"` (padrão) descarta as entradas mais antigas, mas mantém resumos compactos; `"old"` descarta as mais antigas sem resumos; `"new"` rejeita o item mais recente.
- `byChannel`: substituições de `mode` por canal, indexadas pelo id do provedor.
- `debounceMsByChannel`: substituições de `debounceMs` por canal, indexadas pelo id do provedor.

### Agrupamento de entrada

Agrupa mensagens rápidas contendo somente texto do mesmo remetente em um único turno do agente. Mídias/anexos provocam o envio imediato. Comandos de controle ignoram o agrupamento. `debounceMs` padrão: `2000`.

### Outras chaves de mensagens

- `messages.messagePrefix`: texto de prefixo adicionado às mensagens recebidas dos usuários antes de chegarem ao runtime do agente. Use com moderação para marcadores de contexto do canal.
- `messages.visibleReplies`: controla respostas de origem visíveis em conversas diretas, de grupo e de canal (`"message_tool"` exige `message(action=send)` para saída visível; `"automatic"` publica respostas normais como antes).
- `messages.usageTemplate` / `messages.responseUsage`: modelo personalizado de rodapé de `/usage` e modo padrão de uso por resposta (`off | tokens | full`, além do alias legado `on` para `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: acionadores de menção em mensagens de grupo e dimensionamento da janela de histórico.
- `messages.suppressToolErrors`: quando `true`, suprime os avisos `⚠️` de erro de ferramenta exibidos ao usuário (o agente ainda vê os erros no contexto e pode tentar novamente). Padrão: `false`.

### TTS (texto para fala)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (padrão) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` controla o modo padrão de TTS automático: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir as preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para o resumo automático.
- `modelOverrides` fica habilitado por padrão (`enabled !== false`); `modelOverrides.allowProvider` é opcional.
- As chaves de API usam como alternativa `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- Os provedores de fala incluídos são gerenciados por plugins. Se `plugins.allow` estiver definido, inclua cada plugin de provedor de TTS que você quiser usar, por exemplo, `microsoft` para o Edge TTS. O ID de provedor legado `edge` é aceito como alias de `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint de TTS da OpenAI. A ordem de resolução é: configuração, depois `OPENAI_TTS_BASE_URL` e, por fim, `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor de TTS compatível com a OpenAI e flexibiliza a validação de modelo/voz.

---

## Conversação

Padrões do modo Conversação (macOS/iOS/Android e a interface de controle no navegador).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Fale de forma acolhedora e mantenha as respostas breves.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores de Talk estiverem configurados.
- As chaves planas legadas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) servem apenas para compatibilidade. Execute `openclaw doctor --fix` para reescrever a configuração persistida em `talk.providers.<provider>`.
- Os IDs de voz usam `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` como fallback (comportamento do cliente Talk do macOS).
- `providers.*.apiKey` aceita strings de texto simples ou objetos SecretRef.
- O fallback de `ELEVENLABS_API_KEY` só se aplica quando nenhuma chave de API de Talk está configurada.
- `providers.*.voiceAliases` permite que as diretivas de Talk usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório do Hugging Face usado pelo auxiliar MLX local do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução via MLX no macOS é executada pelo auxiliar `openclaw-mlx-tts` incluído, quando presente, ou por um executável em `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do auxiliar para desenvolvimento.
- `consultThinkingLevel` controla o nível de raciocínio da execução completa do agente OpenClaw por trás das chamadas `openclaw_agent_consult` em tempo real do Talk da Control UI. Deixe sem definir para preservar o comportamento normal da sessão e do modelo.
- `consultFastMode` define uma substituição pontual do modo rápido para consultas em tempo real do Talk da Control UI sem alterar a configuração normal do modo rápido da sessão.
- `speechLocale` define o ID de localidade BCP 47 usado pelo reconhecimento de fala do Talk no iOS/macOS. Deixe sem definir para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla por quanto tempo o modo Talk aguarda após o silêncio do usuário antes de enviar a transcrição. Quando não definido, mantém a janela de pausa padrão da plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` acrescenta instruções de sistema voltadas ao provedor ao prompt integrado em tempo real do OpenClaw, permitindo configurar o estilo de voz sem perder as orientações padrão de `openclaw_agent_consult`.
- `realtime.vadThreshold` define o limiar de atividade de voz do provedor de `0` (mais sensível) a `1` (menos sensível). Quando não definido, mantém o padrão do provedor.
- `realtime.silenceDurationMs` define a janela de silêncio como um número inteiro positivo antes que o provedor confirme um turno do usuário em tempo real. Quando não definido, mantém o padrão do provedor.
- `realtime.prefixPaddingMs` define, como um número inteiro não negativo, a quantidade de áudio retida antes do início da fala detectada. Quando não definido, mantém o padrão do provedor.
- `realtime.reasoningEffort` define o nível de raciocínio específico do provedor para sessões em tempo real. Quando não definido, mantém o padrão do provedor.
- `realtime.consultRouting`: `"provider-direct"` (padrão) preserva as respostas diretas do provedor quando o provedor em tempo real produz uma transcrição final do usuário sem `openclaw_agent_consult`. `"force-agent-consult"` encaminha a solicitação finalizada pelo OpenClaw.

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

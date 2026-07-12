---
read_when:
    - Você precisa da semântica exata ou dos valores padrão de cada campo de configuração
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para as principais chaves do OpenClaw, valores padrão e links para referências de subsistemas específicos
title: Referência de configuração
x-i18n:
    generated_at: "2026-07-12T15:11:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8a9141db733a6513778a7218933ee5989c62db11472ec6e1e70bd8bf3fcbac8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referência em nível de campo para `~/.openclaw/openclaw.json`: chaves, valores padrão e links para páginas mais detalhadas dos subsistemas. Para orientações de configuração voltadas a tarefas, consulte [Configuração](/pt-BR/gateway/configuration). Catálogos de comandos pertencentes a canais e plugins, bem como opções avançadas de memória/QMD, ficam em suas próprias páginas, não aqui.

O formato da configuração é **JSON5** (comentários e vírgulas finais são permitidos). Todos os campos são opcionais; o OpenClaw usa valores padrão seguros quando eles são omitidos.

O código prevalece sobre esta página:

- `openclaw config schema` exibe o JSON Schema ativo usado para validação e pela Control UI, com os metadados de pacotes integrados/plugins/canais mesclados.
- Os agentes devem chamar a ação `config.schema.lookup` da ferramenta `gateway` para obter um único nó exato do esquema, limitado ao caminho, antes de editar a configuração.
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de referência desta documentação em relação à superfície atual do esquema.

Referências detalhadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e a configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`.
- [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados e incluídos no pacote.
- Páginas dos respectivos canais/plugins para superfícies de comandos específicas de cada canal.

---

## Canais

As chaves de configuração específicas de cada canal ficam em [Configuração - canais](/pt-BR/gateway/config-channels): `channels.*` para Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros canais incluídos (autenticação, controle de acesso, múltiplas contas, exigência de menção).

## Padrões do agente, múltiplos agentes, sessões e mensagens

Consulte [Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (espaço de trabalho, modelo, raciocínio, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e vinculações de múltiplos agentes)
- `session.*` (ciclo de vida da sessão, Compaction, limpeza)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: substituição do nível de raciocínio para toda a execução do agente OpenClaw por trás das consultas em tempo real do Talk na interface de controle
  - `talk.consultFastMode`: substituição pontual do modo rápido para consultas em tempo real do Talk na interface de controle
  - `talk.speechLocale`: ID de localidade BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback de retransmissão do Gateway para transcrições em tempo real finalizadas do Talk que ignoram `openclaw_agent_consult`

## Ferramentas e provedores personalizados

A política de ferramentas, as opções experimentais, a configuração de ferramentas fornecidas por provedores e a configuração de provedores personalizados/URLs base estão disponíveis em
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Modelos

As definições de provedores, as listas de modelos permitidos e a configuração de provedores personalizados ficam em
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls).
A raiz `models` também controla o comportamento global do catálogo de modelos.

```json5
{
  models: {
    // Opcional. Padrão: true. Exige a reinicialização do Gateway quando alterado.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados indexado pelo ID do provedor.
- `models.providers.*.localService`: gerenciador opcional de processos sob demanda para
  servidores de modelos locais. O OpenClaw verifica o endpoint de integridade configurado, inicia
  o `command` absoluto quando necessário, aguarda até que esteja pronto e então envia a solicitação
  ao modelo. Consulte [Serviços de modelos locais](/pt-BR/gateway/local-model-services).
- `models.pricing.enabled`: controla a inicialização de preços em segundo plano que
  começa depois que os processos auxiliares e canais alcançam o caminho de prontidão do Gateway. Quando definido como `false`,
  o Gateway ignora as buscas dos catálogos de preços do OpenRouter e do LiteLLM; os valores
  configurados em `models.providers.*.models[].cost` continuam funcionando para estimativas locais de custo.

## MCP

As definições de servidores MCP gerenciados pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo OpenClaw incorporado e por outros adaptadores de runtime. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam esse bloco sem se conectar ao
servidor de destino durante as edições da configuração.

```json5
{
  mcp: {
    // Opcional. Padrão: 600000 ms (10 minutos). Defina como 0 para desativar a remoção por inatividade.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Controles opcionais de projeção do servidor de aplicativo do Codex.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definições nomeadas de servidores MCP stdio ou remotos para runtimes que
  expõem as ferramentas MCP configuradas.
  As entradas remotas usam `transport: "streamable-http"` ou `transport: "sse"`;
  `type: "http"` é um alias nativo da CLI que `openclaw mcp set` e
  `openclaw doctor --fix` normalizam para o campo canônico `transport`.
- `mcp.servers.<name>.enabled`: defina como `false` para manter salva uma definição de servidor
  enquanto a exclui da descoberta de MCP e da projeção de ferramentas do OpenClaw incorporado.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: tempo limite por servidor para solicitações
  MCP, em segundos ou milissegundos.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: tempo limite por servidor
  para conexão, em segundos ou milissegundos.
- `mcp.servers.<name>.supportsParallelToolCalls`: indicação opcional de concorrência para
  adaptadores que podem escolher se devem emitir chamadas paralelas de ferramentas MCP.
- `mcp.servers.<name>.auth`: defina como `"oauth"` para servidores MCP HTTP que exigem
  OAuth. Execute `openclaw mcp login <name>` para armazenar tokens no estado do OpenClaw.
- `mcp.servers.<name>.oauth`: substituições opcionais de escopo OAuth, URL de redirecionamento e URL
  de metadados do cliente.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controles TLS HTTP
  para endpoints privados e TLS mútuo.
- `mcp.servers.<name>.toolFilter`: seleção opcional de ferramentas por servidor. `include`
  limita as ferramentas MCP descobertas aos nomes correspondentes; `exclude` oculta os nomes
  correspondentes. As entradas são nomes exatos de ferramentas MCP ou padrões glob simples com `*`. Servidores com
  recursos ou prompts também geram nomes de ferramentas utilitárias (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), e esses nomes usam o
  mesmo filtro.
- `mcp.servers.<name>.codex`: controles opcionais de projeção do servidor de aplicativo do Codex.
  Esse bloco é composto por metadados do OpenClaw somente para threads do servidor de aplicativo do Codex; ele não
  afeta sessões ACP, a configuração genérica do harness do Codex nem outros adaptadores de runtime.
  Um `codex.agents` não vazio limita o servidor aos IDs de agentes do OpenClaw listados.
  Listas de agentes com escopo vazias, em branco ou inválidas são rejeitadas pela validação da configuração
  e omitidas pelo caminho de projeção do runtime, em vez de se tornarem globais.
  `codex.defaultToolsApprovalMode` emite o
  `default_tools_approval_mode` nativo do Codex para esse servidor. O OpenClaw remove o bloco `codex`
  antes de passar a configuração nativa `mcp_servers` ao Codex. Omita o bloco para
  manter o servidor projetado para todos os agentes do servidor de aplicativo do Codex com o
  comportamento padrão de aprovação de MCP do Codex.
- `mcp.sessionIdleTtlMs`: TTL de inatividade para runtimes MCP incluídos com escopo de sessão.
  Execuções incorporadas únicas solicitam limpeza ao final da execução; esse TTL é a salvaguarda para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas dinamicamente, descartando os runtimes MCP de sessão armazenados em cache.
  A próxima descoberta ou utilização de ferramentas os recria com base na nova configuração, portanto as entradas
  removidas de `mcp.servers` são eliminadas imediatamente, em vez de aguardar o TTL de inatividade.
- A descoberta no runtime também respeita notificações de alteração da lista de ferramentas MCP, descartando
  o catálogo armazenado em cache para essa sessão. Servidores que anunciam recursos ou
  prompts recebem ferramentas utilitárias para listar/ler recursos e listar/buscar
  prompts. Falhas repetidas em chamadas de ferramentas pausam brevemente o servidor afetado antes
  de outra tentativa de chamada.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[backends da CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para ver o comportamento do runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string de texto simples
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista opcional de permissões somente para Skills incluídas (Skills gerenciadas/do espaço de trabalho não são afetadas).
- `load.extraDirs`: raízes adicionais de Skills compartilhadas (menor precedência).
- `load.allowSymlinkTargets`: raízes de destino reais e confiáveis que os links simbólicos de Skills podem
  resolver quando o link está fora da raiz de origem configurada.
- `workshop.allowSymlinkTargetWrites`: permite que a aplicação do Skill Workshop grave
  por meio de destinos de links simbólicos já confiáveis (padrão: false).
- `install.preferBrew`: quando verdadeiro, prioriza instaladores do Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador do Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes confiáveis `operator.admin` do Gateway
  instalem arquivos zip privados preparados por meio de `skills.upload.*`
  (padrão: false). Isso habilita apenas o caminho de arquivos enviados; instalações normais do ClawHub
  não exigem essa opção.
- `entries.<skillKey>.enabled: false` desativa uma Skill mesmo que esteja incluída/instalada.
- `entries.<skillKey>.apiKey`: recurso de conveniência para Skills que declaram uma variável de ambiente principal (string de texto simples ou objeto SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: limitam a descoberta de Skills e o prompt de Skills apresentado ao modelo.
- As configurações de autonomia/aprovação do Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) estão documentadas em [Configuração de Skills](/pt-BR/tools/skills-config).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados de diretórios de pacotes ou bundles em `~/.openclaw/extensions` e `<workspace>/.openclaw/extensions`, além de arquivos ou diretórios listados em `plugins.load.paths`.
- Coloque arquivos de Plugin independentes em `plugins.load.paths`; as raízes de extensões descobertas automaticamente ignoram arquivos `.js`, `.mjs` e `.ts` no nível superior, para que scripts auxiliares nessas raízes não bloqueiem a inicialização.
- A descoberta aceita plugins nativos do OpenClaw, além de bundles compatíveis do Codex e do Claude, incluindo bundles do Claude sem manifesto que usam o layout padrão.
- **Alterações de configuração exigem a reinicialização do Gateway.**
- `allow`: lista de permissões opcional (somente os plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência para chave de API no nível do Plugin (quando compatível com o Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que modificam o prompt do `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de plugins nativos e a diretórios de hooks fornecidos por bundles compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugins confiáveis não incluídos no bundle podem ler o conteúdo bruto da conversa por meio de hooks tipados, como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições de `provider` e `model` por execução em execuções de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permissões opcional de destinos canônicos `provider/model` para substituições confiáveis de subagentes. Use `"*"` somente quando quiser permitir intencionalmente qualquer modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permissões opcional de destinos canônicos `provider/model` para substituições confiáveis de conclusão de LLM do Plugin. Use `"*"` somente quando quiser permitir intencionalmente qualquer modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confia explicitamente neste Plugin para executar `api.runtime.llm.complete` usando um id de agente diferente do padrão.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo Plugin (validado pelo esquema de Plugin nativo do OpenClaw quando disponível).
- As configurações de conta/execução do Plugin de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do Plugin proprietário, não por um registro central de opções do OpenClaw.

### Configuração do Plugin do harness do Codex

O Plugin `codex` incluído no bundle é responsável pelas configurações nativas do
harness do servidor de aplicativos do Codex em `plugins.entries.codex.config`. Consulte a
[referência do harness do Codex](/pt-BR/plugins/codex-harness-reference) para ver toda a superfície de
configuração e [Harness do Codex](/pt-BR/plugins/codex-harness) para ver o modelo de execução.

`codexPlugins` aplica-se somente às sessões que selecionam o harness nativo do Codex.
Ele não habilita plugins do Codex para execuções de provedores do OpenClaw, vínculos de
conversa ACP nem qualquer harness que não seja do Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: habilita o suporte nativo a
  plugins/aplicativos do Codex para o harness do Codex. Padrão: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: expõe todos os
  aplicativos acessíveis no momento conectados à conta autenticada do Codex em
  cada nova thread nativa do Codex. Padrão: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política padrão de ações destrutivas para solicitações de aplicativos de plugins configurados.
  Use `true` para aceitar esquemas seguros de aprovação do Codex sem solicitar confirmação, `false`
  para recusá-los, `"auto"` para encaminhar aprovações exigidas pelo Codex pelas
  aprovações de plugins do OpenClaw ou `"ask"` para solicitar confirmação para cada ação de
  gravação/destrutiva do Plugin sem aprovação persistente. O modo `"ask"` limpa as
  substituições persistentes de aprovação por ferramenta do Codex para o aplicativo afetado e seleciona
  o revisor humano de aprovações desse aplicativo antes do início da thread do Codex.
  Padrão: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita uma
  entrada de Plugin configurada quando `codexPlugins.enabled` global também é verdadeiro.
  Padrão: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidade estável do marketplace, obrigatória com `pluginName` para cada entrada
  resolvida. Compatível com `"openai-curated"` e `"workspace-directory"`. Entradas
  sem um dos campos de identidade são ignoradas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidade
  estável do Plugin do Codex, obrigatória com `marketplaceName`. Uma entrada
  `workspace-directory` deve usar o `summary.id` exato, qualificado pelo marketplace,
  retornado por `plugin/list`, por exemplo,
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  substituição da ação destrutiva por Plugin. Quando omitida, o valor global
  `allow_destructive_actions` é usado. O valor por Plugin aceita as
  mesmas políticas `true`, `false`, `"auto"` ou `"ask"`.

Cada aplicativo de Plugin admitido que usa `"ask"` encaminha as solicitações de aprovação
desse aplicativo ao revisor humano. Outros aplicativos e aprovações de threads que não sejam de
aplicativos mantêm seu revisor configurado, portanto políticas mistas de plugins não herdam
o comportamento de `"ask"`.

`codexPlugins.enabled` é a diretiva global de habilitação. Entradas explícitas de plugins
gravadas pela migração constituem o conjunto persistente de elegibilidade para instalação
selecionada e reparo. Entradas `workspace-directory` configuradas manualmente já devem
estar instaladas e habilitadas, e os aplicativos pertencentes a elas devem estar acessíveis; o OpenClaw
não as instala nem autentica. Se o Codex rejeitar a solicitação explícita do catálogo do workspace,
as entradas habilitadas do workspace falham de forma fechada com
`marketplace_missing`, enquanto as entradas selecionadas do catálogo padrão permanecem
disponíveis. `plugins["*"]` não é compatível, não há uma opção `install` e
valores locais de `marketplacePath` não são intencionalmente campos de configuração porque são
específicos do host. Consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins) para ver os requisitos de versão e
prontidão do servidor de aplicativos.

As verificações de prontidão de `app/list` ficam em cache por uma hora e são atualizadas
de forma assíncrona quando obsoletas. A configuração de aplicativos da thread do Codex é calculada ao
estabelecer a sessão do harness do Codex, não a cada turno; use `/new`, `/reset` ou reinicie o
Gateway após alterar a configuração de plugins nativos.

`codexPlugins.allow_all_plugins` captura todos os aplicativos da conta acessíveis no momento
em cada nova thread nativa do Codex. Ele não instala plugins nem aplicativos, e
aplicativos inacessíveis continuam excluídos. Os aplicativos da conta usam a política global
`codexPlugins.allow_destructive_actions`. Entradas explícitas de plugins têm
precedência quando o mesmo aplicativo está presente nos dois caminhos. Se `app/list` não puder ser
lido, a exposição em toda a conta falha de forma fechada.

- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca de conteúdo web do Firecrawl.
  - `apiKey`: chave de API opcional do Firecrawl para limites maiores (aceita SecretRef). Usa como alternativas `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL-base da API do Firecrawl (padrão: `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados/internos).
  - `onlyMainContent`: extrai somente o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de extração em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (pesquisa web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo do Grok a ser usado na pesquisa (por exemplo, `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para ver fases e limites.
  - `enabled`: opção principal de Dreaming (padrão `false`).
  - `frequency`: cadência Cron de cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - `model`: substituição opcional do modelo de subagente do Diário de Sonhos. Exige `plugins.entries.memory-core.subagent.allowModelOverride: true`; combine com `allowedModels` para restringir os destinos. Erros de modelo indisponível repetem a tentativa uma vez com o modelo padrão da sessão; falhas de confiança ou da lista de permissões não usam alternativas silenciosamente.
  - a política de fases e os limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória está na [referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins habilitados de bundles do Claude também podem contribuir com padrões incorporados do OpenClaw por meio de `settings.json`; o OpenClaw aplica esses valores como configurações de agente sanitizadas, não como patches brutos da configuração do OpenClaw.
- `plugins.slots.memory`: selecione o id do Plugin de memória ativo ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: selecione o id do Plugin do mecanismo de contexto ativo; o padrão é `"legacy"`, a menos que você instale e selecione outro mecanismo.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Compromissos

`commitments` controla a memória de acompanhamentos inferidos: o OpenClaw pode detectar verificações futuras nos turnos da conversa e entregá-las por meio de execuções de Heartbeat.

- `commitments.enabled`: habilita a extração oculta por LLM, o armazenamento e a entrega por Heartbeat de compromissos de acompanhamento inferidos. Padrão: `false`.
- `commitments.maxPerDay`: número máximo de compromissos de acompanhamento inferidos entregues por sessão de agente em um período móvel de um dia. Padrão: `3`.

Consulte [Compromissos inferidos](/pt-BR/concepts/commitments).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilite somente para acesso confiável à rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desativa `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera as abas rastreadas do agente principal após um período de inatividade ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desativar individualmente esses modos de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, portanto a navegação do navegador permanece restrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em redes privadas.
- No modo restrito, os endpoints de perfis CDP remotos (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de redes privadas durante as verificações de acessibilidade e descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua sendo compatível como um alias legado.
- No modo restrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Os perfis remotos permitem apenas anexação (iniciar/parar/redefinir ficam desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam à acessibilidade CDP remota e
  `attachOnly`, além das solicitações de abertura de abas. Os perfis gerenciados de loopback
  mantêm os padrões locais do CDP. A enumeração persistente de abas remotas do Playwright
  usa o maior valor como prazo limite da operação.
- Se um serviço CDP gerenciado externamente estiver acessível por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw tratará a porta de loopback como um
  perfil de navegador gerenciado localmente e poderá relatar erros de propriedade da porta local.
- Os perfis `existing-session` usam o Chrome MCP em vez do CDP e podem se conectar
  no host selecionado ou por meio de um Node de navegador conectado.
- Os perfis `existing-session` podem definir `userDataDir` para usar um perfil específico
  de navegador baseado no Chromium, como Brave ou Edge.
- Os perfis `existing-session` podem definir `cdpUrl` quando o Chrome já estiver em execução
  por trás de um endpoint de descoberta HTTP(S) do DevTools ou de um endpoint WS(S) direto. Nesse
  modo, o OpenClaw passa o endpoint para o Chrome MCP em vez de usar a conexão automática;
  `userDataDir` é ignorado nos argumentos de inicialização do Chrome MCP.
- Os perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas por snapshots/referências em vez de direcionamento por seletores CSS, ganchos
  de upload de um único arquivo, nenhuma substituição do tempo limite de diálogos, nenhum `wait --load networkidle`
  e nenhuma ação de `responsebody`, exportação para PDF, interceptação de downloads ou em lote.
- Os perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente somente para perfis CDP remotos ou conexão a endpoints de sessões existentes.
- Os perfis locais gerenciados podem definir `executablePath` para substituir o
  `browser.executablePath` global nesse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Os perfis locais gerenciados usam `browser.localLaunchTimeoutMs` para a descoberta HTTP
  do CDP do Chrome após o início do processo e `browser.localCdpReadyTimeoutMs` para
  verificar a disponibilidade do WebSocket do CDP após a inicialização. Aumente esses valores em hosts mais lentos nos quais o Chrome
  é iniciado corretamente, mas as verificações de disponibilidade entram em conflito com a inicialização. Ambos os valores devem ser
  inteiros positivos de até `120000` ms; valores de configuração inválidos são rejeitados.
- Ordem de detecção automática: navegador padrão, se baseado no Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath`
  aceitam `~` e `~/...` para representar o diretório inicial do seu sistema operacional antes da inicialização do Chromium.
  O til também é expandido em `userDataDir` por perfil nos perfis `existing-session`.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta opções de inicialização adicionais à inicialização local do Chromium (por exemplo,
  `--disable-gpu`, dimensionamento da janela ou opções de depuração).

---

## Interface

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto curto, URL de imagem ou URI de dados
    },
  },
}
```

- `seamColor`: cor de destaque dos elementos visuais da interface nativa do aplicativo (tonalidade do balão do Modo de Conversa etc.).
- `assistant`: substituição da identidade da Interface de Controle. Usa como alternativa a identidade do agente ativo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remoto
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // nenhum | token | senha | proxy confiável
      token: "your-token",
      // password: "your-password", // ou OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; consulte /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // desativado | disponibilizar | funil
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // habilita títulos de finalidade gerados por IA para chamadas de ferramentas (consome tokens do modelo utilitário)
      // embedSandbox: "scripts", // restrito | scripts | confiável
      // allowExternalEmbedUrls: false, // perigoso: permite URLs http(s) externas absolutas para incorporação
      // chatMessageMaxWidth: "min(1280px, 82%)", // largura máxima opcional e centralizada da transcrição do chat
      // allowedOrigins: ["https://control.example.com"], // obrigatório para a Interface de Controle fora do loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de origem alternativa baseado no cabeçalho Host
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direto
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Padrão: false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Por padrão, não definido/desativado.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Aprovação automática verificada por SSH. Padrão: ativada (true).
        // Defina como false para desativar somente a verificação por SSH; isso não afeta
        // autoApproveCidrs acima. Para emparelhamento de Nodes exclusivamente manual, defina como false E
        // remova autoApproveCidrs. Passe um objeto para ajustar: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Bloqueios HTTP adicionais para /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista padrão de bloqueios HTTP para chamadores proprietários/administradores
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do Gateway">

- `mode`: `local` (executar o gateway) ou `remote` (conectar a um gateway remoto). O Gateway se recusa a iniciar, a menos que seja `local`.
- `port`: porta única multiplexada para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (IPv4 do Tailscale quando disponível; caso contrário, loopback) ou `custom` (um endereço IPv4). Um endereço `tailnet` resolvido e qualquer endereço `custom` diferente de `127.0.0.1` ou `0.0.0.0` exigem `127.0.0.1` na mesma porta para clientes no mesmo host; a inicialização falha se qualquer um dos listeners não conseguir fazer bind. A exposição fora do loopback permanece limitada à interface selecionada.
- **Aliases legados de bind**: use os valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com a rede bridge do Docker (`-p 18789:18789`), o tráfego chega por `eth0`, portanto o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: obrigatória por padrão. Binds fora do loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`. O assistente de integração gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use somente em configurações locais confiáveis de loopback; ele não é oferecido intencionalmente pelas solicitações do assistente de integração.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação do navegador/usuário a um proxy reverso com reconhecimento de identidade e confia nos cabeçalhos de identidade provenientes de `gateway.trustedProxies` (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Por padrão, esse modo espera uma origem de proxy **fora do loopback**; proxies reversos de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito. Chamadores internos no mesmo host podem usar `gateway.auth.password` como fallback local direto; `gateway.auth.token` permanece mutuamente exclusivo com o modo de proxy confiável.
- `gateway.auth.allowTailscale`: quando `true`, os cabeçalhos de identidade do Tailscale Serve podem atender à autenticação da Control UI/WebSocket (verificados por `tailscale whois`). Os endpoints da API HTTP **não** usam essa autenticação por cabeçalho do Tailscale; em vez disso, seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP de cliente e por escopo de autenticação (segredo compartilhado e token de dispositivo são rastreados de forma independente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI pelo Tailscale Serve, as tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Portanto, tentativas incorretas simultâneas do mesmo cliente podem acionar o limitador na segunda solicitação, em vez de ambas passarem em uma corrida como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem `true` como padrão; defina `false` quando quiser intencionalmente que o tráfego de localhost também seja limitado por taxa (para configurações de teste ou implantações de proxy rigorosas).
- As tentativas de autenticação WS originadas no navegador sempre são limitadas, sem isenção de loopback (defesa em profundidade contra força bruta no localhost pelo navegador).
- No loopback, esses bloqueios originados no navegador são isolados por valor normalizado de `Origin`,
  portanto, falhas repetidas de uma origem no localhost não bloqueiam automaticamente
  uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind de loopback) ou `funnel` (público, exige autenticação).
- `tailscale.serviceName`: nome opcional de Serviço do Tailscale para o modo Serve, como
  `svc:openclaw`. Quando definido, o OpenClaw o transmite para `tailscale serve
--service`, permitindo que a Control UI seja exposta por meio de um Serviço nomeado em vez
  do nome de host do dispositivo. O valor deve usar o formato de nome de Serviço `svc:<dns-label>`
  do Tailscale; a inicialização informa a URL de Serviço derivada.
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, o OpenClaw
  verifica `tailscale funnel status` antes de reaplicar o Serve na inicialização e ignora
  essa etapa se uma rota do Funnel configurada externamente já abranger a porta do gateway.
  O padrão é `false`.
- `controlUi.allowedOrigins`: lista explícita de origens de navegador permitidas para conexões WebSocket do Gateway. Obrigatória para origens públicas de navegador fora do loopback. Carregamentos privados da UI na mesma origem em LAN/Tailnet provenientes de hosts loopback, RFC1918/link-local, `.local`, `.ts.net` ou CGNAT do Tailscale são aceitos sem habilitar o fallback de cabeçalho Host.
- `controlUi.toolTitles`: habilita títulos de finalidade gerados por IA para chamadas de ferramentas no chat da Control UI. Padrão: `false` (a renderização de ferramentas permanece totalmente determinística, sem chamadas de modelo em segundo plano). Quando habilitado, o método `chat.toolTitles` rotula chamadas complexas por meio do roteamento padrão de modelos utilitários — o `utilityModel` do agente (uma decisão do operador que pode enviar argumentos limitados de ferramentas ao provedor escolhido, como em qualquer tarefa utilitária) ou o padrão declarado de modelo pequeno do provedor da sessão (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) — e armazena os resultados em cache no banco de dados de estado por agente, para que visualizações repetidas nunca gerem nova cobrança. `utilityModel: \"\"` desabilita os títulos, como em qualquer outra tarefa utilitária; os títulos nunca recorrem ao modelo principal como fallback.
- `controlUi.chatMessageMaxWidth`: largura máxima opcional para a transcrição centralizada do chat da Control UI. Aceita valores restritos de largura CSS, como `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita o fallback de origem por cabeçalho Host para implantações que dependem intencionalmente da política de origem por cabeçalho Host.
- `terminal.enabled`: habilita o terminal do operador com escopo administrativo. Padrão: `false`. O terminal inicia um PTY do host no workspace do agente selecionado, herda o ambiente do processo do Gateway e é recusado para agentes com `sandbox.mode: "all"`. Habilite-o somente em implantações com operadores confiáveis; alterá-lo reinicia o Gateway e atualiza a política de segurança de conteúdo da Control UI.
- `terminal.shell`: executável de shell opcional. Quando não definido, o OpenClaw usa `$SHELL` no Unix e `%ComSpec%` no Windows.
- `terminal.detachedSessionTimeoutSeconds`: tempo durante o qual uma sessão de terminal sobrevive após a queda da conexão (recarregamento da página, suspensão do laptop), permanecendo disponível para reconexão por meio de `terminal.attach`, com a saída recente reproduzida. Padrão: `300`. Defina `0` para encerrar as sessões no momento em que a conexão cair. Sessões desconectadas continuam executando seus comandos, portanto reduza esse valor em hosts compartilhados ou expostos.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve usar `wss://` em hosts públicos; `ws://` sem criptografia é aceito somente para hosts loopback, LAN, link-local, `.local`, `.ts.net` e CGNAT do Tailscale.
- `remote.remotePort`: porta do gateway no host SSH remoto. O padrão é `18789`; use-a quando a porta local do túnel for diferente da porta do gateway remoto.
- `remote.sshHostKeyPolicy`: política de chave de host do túnel SSH no macOS. `strict` é o padrão e exige uma chave já confiável. `openssh` é uma adesão explícita à configuração efetiva do OpenSSH para aliases gerenciados; revise as configurações SSH correspondentes do usuário e do sistema antes de usá-la. O aplicativo do macOS e `configure-remote` redefinem essa política como `strict` ao alterar destinos, a menos que haja nova adesão explícita.
- `gateway.remote.token` / `.password` são campos de credenciais do cliente remoto. Eles não configuram a autenticação do gateway por si sós.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base do relay APNs externo usado depois que builds do iOS respaldados por relay publicam registros no gateway. Builds públicos da App Store usam o relay hospedado do OpenClaw. URLs de relay personalizadas devem corresponder a um caminho de build/implantação do iOS deliberadamente separado cuja URL de relay aponte para esse relay.
- `gateway.push.apns.relay.timeoutMs`: tempo limite de envio do gateway ao relay em milissegundos. O padrão é `10000`.
- Registros respaldados por relay são delegados a uma identidade específica do gateway. O aplicativo iOS pareado obtém `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha uma concessão de envio com escopo de registro ao gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por variáveis de ambiente para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: mecanismo de escape exclusivo para desenvolvimento para URLs HTTP de relay em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.handshakeTimeoutMs`: tempo limite, em milissegundos, do handshake WebSocket pré-autenticação do Gateway. Padrão: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tem precedência quando definido. Aumente esse valor em hosts sobrecarregados ou de baixo desempenho nos quais os clientes locais conseguem se conectar enquanto o aquecimento da inicialização ainda está terminando.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade dos canais em minutos. Defina `0` para desabilitar globalmente as reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha esse valor maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações pelo monitor de integridade por canal/conta em uma janela móvel de uma hora. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativação por canal das reinicializações do monitor de integridade, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com várias contas. Quando definida, tem precedência sobre a substituição no nível do canal.
- Os caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente por SecretRef e não for resolvido, a resolução falhará de forma fechada (sem fallback remoto para mascarar a falha).
- `trustedProxies`: IPs de proxies reversos que encerram TLS ou injetam cabeçalhos de cliente encaminhado. Liste somente proxies que você controla. Entradas de loopback continuam válidas para configurações de proxy/detecção local no mesmo host (por exemplo, Tailscale Serve ou um proxy reverso local), mas **não** tornam solicitações de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. O padrão é `false` para comportamento de falha fechada.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de CIDRs/IPs permitidos para aprovar automaticamente o primeiro pareamento de dispositivo Node sem escopos solicitados. Fica desabilitada quando não definida. Isso não aprova automaticamente o pareamento de operador/navegador/Control UI/WebChat nem aprova automaticamente atualizações de função, escopo, metadados ou chave pública.
- `gateway.nodes.pairing.sshVerify`: aprovação automática verificada por SSH para o primeiro pareamento de dispositivo Node (padrão: habilitada). O gateway se conecta por SSH de volta ao host de pareamento (BatchMode, chaves de host estritas) e só aprova quando há uma correspondência exata da chave do dispositivo em `openclaw node identity`. Mesmo requisito mínimo de elegibilidade que `autoApproveCidrs`; as sondagens são limitadas a endereços de origem privados/CGNAT, a menos que `cidrs` os substitua. Defina `false` para desabilitar ou `{ user, identity, timeoutMs, cidrs }` para ajustar. Consulte [Pareamento de Node](/pt-BR/gateway/pairing#ssh-verified-device-auto-approval-default).
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: configuração global de permissões/negações para comandos declarados do Node após o emparelhamento e a avaliação da lista de permissões da plataforma. Use `allowCommands` para habilitar comandos perigosos do Node, como `camera.snap`, `camera.clip`, `screen.record`, `sms.search` e `sms.send`; `denyCommands` remove um comando mesmo que um padrão da plataforma ou uma permissão explícita o incluísse de outra forma. A permissão de SMS do Android e a autorização de comandos do Gateway são independentes. Depois que um Node alterar sua lista de comandos declarados, rejeite e aprove novamente o emparelhamento desse dispositivo para que o Gateway armazene o snapshot de comandos atualizado.
  - `gateway.tools.deny`: nomes adicionais de ferramentas bloqueados para a solicitação HTTP `POST /tools/invoke` (estende a lista de negações padrão).
  - `gateway.tools.allow`: remove nomes de ferramentas da lista de negações HTTP padrão para
  chamadores proprietários/administradores. Isso não eleva chamadores `operator.write`
  portadores de identidade ao acesso de proprietário/administrador; `cron`, `gateway` e `nodes` permanecem
  indisponíveis para chamadores que não sejam proprietários, mesmo quando incluídos na lista de permissões.

</Accordion>

### Endpoints compatíveis com a OpenAI

- RPC HTTP administrativo: desativado por padrão como o plugin `admin-http-rpc`. Ative o plugin para registrar `POST /api/v1/admin/rpc`. Consulte [RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc).
- Chat Completions: desativado por padrão. Ative com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Proteção da entrada de URL do Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Listas de permissões vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de proteção de respostas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina somente para origens HTTPS sob seu controle; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários gateways em um host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Vários Gateways](/pt-BR/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: ativa a terminação TLS no listener do Gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; somente para uso local/desenvolvimento.
- `certPath`: caminho no sistema de arquivos para o arquivo do certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo da chave privada TLS; mantenha as permissões restritas.
- `caPath`: caminho opcional para o pacote de CAs usado na verificação de clientes ou em cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla como as edições de configuração são aplicadas durante a execução.
  - `"off"`: ignora edições em tempo real; as alterações exigem uma reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do Gateway quando a configuração é alterada.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta primeiro o recarregamento a quente; recorre à reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes da aplicação das alterações de configuração (inteiro não negativo; padrão: `300`).
- `deferralTimeoutMs`: tempo máximo opcional, em ms, para aguardar operações em andamento antes de forçar uma reinicialização ou o recarregamento a quente do canal. Omita para usar a espera limitada padrão (`300000`); defina como `0` para aguardar indefinidamente e registrar periodicamente avisos de operações ainda pendentes.

---

## Ambientes de workers na nuvem

Os workers na nuvem são opcionais. Se `cloudWorkers` estiver ausente ou `profiles` estiver vazio, o OpenClaw não aceitará a criação de novos workers. Os registros duráveis criados anteriormente ainda serão reconciliados e permanecerão visíveis; a projeção existente de Gateway/Node não será alterada.

Cada provedor de worker deve retornar um `hostKey` SSH proveniente de uma saída de provisionamento confiável exatamente no formato `algorithm base64`, sem nome de host nem comentário. O bootstrap grava essa chave em um arquivo `known_hosts` isolado, usa `StrictHostKeyChecking=yes` e falha antes de abrir uma conexão quando o provedor a omite. Não há fallback de confiança no primeiro uso.

A configuração do túnel ocorre sob demanda, em vez de fazer parte do provisionamento. Quando iniciado, o Gateway encaminha reversamente um socket Unix local do worker para seu endpoint WebSocket de loopback. O socket fica em um diretório remoto alocado aleatoriamente e acessível somente pelo proprietário; ao contrário de uma porta TCP de loopback, ele não pode ser acessado por outras contas em um worker multiusuário nem colidir com a porta de outro ambiente. Keepalives SSH e o recuo de reconexão limitado são executados somente enquanto o proprietário do túnel continuar sendo o atual. A interrupção do túnel bloqueia as reconexões antes de encerrar o processo SSH.

O tráfego de controle e a transferência do workspace usam conexões SSH separadas. Ambos reutilizam a mesma identidade resolvida e o arquivo `known_hosts` fixado e isolado, mas a transferência do workspace não compartilha a multiplexação da conexão SSH com o túnel de longa duração; portanto, o rsync não pode bloquear o tráfego de controle.

### Perfil do Crabbox

O provedor `crabbox` incluído provisiona uma concessão compatível com SSH por meio da CLI local do Crabbox. O `settings.provider` interno seleciona o backend do Crabbox; ele é separado do id externo do provedor do OpenClaw.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Padrão; use "npm" somente para uma versão lançada do Gateway.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Caminho absoluto opcional. Padrão: ../crabbox/bin/crabbox no diretório irmão e, depois, PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (obrigatório): backend do Crabbox repassado por `--provider`. Use um backend cuja saída de inspeção inclua um endpoint SSH; `aws` seleciona o backend direto da AWS.
- `settings.class` (obrigatório): classe de máquina do Crabbox repassada para `--class`.
- `settings.ttl` e `settings.idleTimeout` (obrigatórios): strings positivas de duração do Go repassadas para `--ttl` e `--idle-timeout`. Esses mecanismos de segurança do lado do provedor são diferentes da política `lifetime` armazenada pelo OpenClaw abaixo.
- `settings.binary`: caminho absoluto opcional para o executável do Crabbox. Sem ele, o OpenClaw verifica o checkout irmão do Crabbox, depois as entradas executáveis em `PATH` e, por fim, invoca `crabbox`, para que a ausência da CLI continue sendo um erro visível do provedor.

Configurações desconhecidas são rejeitadas. As credenciais do Crabbox e a configuração de conta específica do backend continuam sob responsabilidade do Crabbox; não as coloque em `settings`. O OpenClaw invoca somente a CLI local, e este plugin não faz chamadas de rede ao provedor. O provisionamento sempre passa `--keep=true`; o OpenClaw controla o ciclo de vida externo e destrói a concessão com `crabbox stop`.

<Warning>
  O OpenClaw resolve o caminho `sshKey` local da concessão do Crabbox por meio do resolvedor de segredos pertencente ao provedor. A saída atual de `crabbox inspect --json` não expõe um `sshHostKey` provisionado; portanto, os workers baseados em Crabbox ainda falham de forma segura antes do bootstrap ou da configuração do túnel. O Crabbox deve provisionar uma chave de host autoritativa por concessão e retornar `sshHostKey` exatamente no formato `algorithm base64`, sem nome de host nem comentário. Seu cache `known_hosts` local da concessão atual não é material de confiança de provisionamento.
</Warning>

### Perfil de desenvolvimento SSH estático

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: perfis nomeados de workers com ids não vazios e sem espaços em branco nas extremidades. Cada perfil seleciona um provedor registrado por um plugin.
- `provider`: id não vazio do provedor de worker. Os exemplos usam o provedor `crabbox` incluído e o provedor `static-ssh` do QA Lab.
- `install`: método de instalação do worker. `"bundle"` (padrão) transfere um pacote com hash de conteúdo da compilação instalada do Gateway e oferece suporte a versões lançadas, de desenvolvimento e não lançadas. `"npm"` é uma otimização opcional para uma versão empacotada não modificada; ele instala `openclaw@<exact gateway version>` do registro npm público e nunca instala `latest`.
- Os plugins de provedores incluídos são selecionados automaticamente quando configurados, mas desativações explícitas e `plugins.allow` continuam sendo aplicadas. Inclua o id do provedor (por exemplo, `crabbox`) quando houver uma lista de permissões configurada. Plugins de provedores externos também devem ser instalados e ativados explicitamente.
- `settings`: JSON limitado pertencente ao provedor. O plugin selecionado define e valida suas chaves; use [objetos SecretRef](/pt-BR/gateway/secrets) para valores que contêm segredos. O provedor SSH estático exige `host`, `user`, `hostKey` e `keyRef`; o padrão de `port` é `22`. `hostKey` deve ser uma linha de chave pública de host OpenSSH (`algorithm base64`) obtida do host conhecido ou de outro canal confiável, sem prefixo de opções.
- `lifetime.idleTimeoutMinutes`: minutos inteiros positivos armazenados para a política posterior de recuperação por inatividade.
- `lifetime.maxLifetimeMinutes`: minutos inteiros positivos armazenados para a política posterior de ciclo de vida.

Um runtime Node compatível (22.19+, 23.11+ ou 24+) já deve estar instalado no worker. O método opcional `"npm"` também exige `npm` e acesso HTTPS de saída ao registro npm público. A configuração de toolchains em rede é uma política do provedor; o bootstrap informa um erro acionável em vez de instalar toolchains por conta própria.

Essa base instala e verifica a compilação do Gateway e fornece o ciclo de vida de início/interrupção do túnel, mas não inicia a CLI geral do OpenClaw. O ponto de entrada autossuficiente do worker e o loop serão incluídos no próximo marco de workers na nuvem.

Cada registro durável de ambiente mantém suas configurações validadas do provedor, o método de instalação resolvido e a política de ciclo de vida em um snapshot do perfil no momento da criação. Alterar ou remover um perfil nomeado afeta novas criações; os registros existentes continuam a reconciliação do ciclo de vida com esse snapshot, desde que o plugin proprietário continue disponível.

Os valores de ciclo de vida são apenas dados na primeira versão de workers na nuvem; a aplicação automática será incluída em um trabalho posterior de ciclo de vida. Alterações de perfil exigem a reinicialização do Gateway.

<Warning>
  O provedor `static-ssh` é uma infraestrutura de desenvolvimento do QA Lab na árvore de código-fonte e não está incluído nas distribuições empacotadas. Um worker executado em seu host compartilhado pode ler dados não relacionados do host; portanto, não use esse provedor como limite de isolamento de produção.
  Seu operador deve fornecer o `hostKey` esperado; o OpenClaw não aprenderá nem aceitará uma chave na primeira conexão.
  Destruir sua concessão apenas libera o registro lógico do OpenClaw; isso não interrompe nem limpa o host.
</Warning>

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "De: {{messages[0].from}}\nAssunto: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticação: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de hook na string de consulta são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` requer um `hooks.token` não vazio.
- `hooks.token` deve ser diferente da autenticação por segredo compartilhado ativa do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); na inicialização, é registrado um aviso de segurança não fatal quando a reutilização é detectada.
- `openclaw security audit` sinaliza a reutilização da autenticação de hook/Gateway como uma constatação crítica, incluindo a autenticação por senha do Gateway fornecida somente no momento da auditoria (`--auth password --password <password>`). Execute `openclaw doctor --fix` para rotacionar um `hooks.token` persistido e reutilizado e, em seguida, atualize os emissores externos de hooks para usarem o novo token de hook.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Se um mapeamento ou predefinição usar um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapeamento não exigem essa adesão explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - O `sessionKey` da carga útil da solicitação é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido por meio de `hooks.mappings`
  - Valores de `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo da carga útil para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem dados da carga útil.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessias são rejeitados).
  - Mantenha `hooks.transformsDir` em `~/.openclaw/hooks/transforms`; diretórios de Skills do espaço de trabalho são rejeitados. Se `openclaw doctor` informar que esse caminho é inválido, mova o módulo de transformação para o diretório de transformações de hooks ou remova `hooks.transformsDir`.
- `agentId` encaminha para um agente específico; IDs desconhecidos usam o agente padrão como alternativa.
- `allowedAgentIds`: restringe o encaminhamento efetivo de agentes, incluindo o caminho do agente padrão quando `agentId` é omitido (`*` ou omitido = permitir todos, `[]` = negar todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamentos orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: lista de permissões de prefixos opcional para valores explícitos de `sessionKey` (solicitação + mapeamento), por exemplo, `["hook:"]`. Torna-se obrigatória quando qualquer mapeamento ou predefinição usa um `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; o padrão de `channel` é `last`.
- `model` substitui o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com o Gmail

- A predefinição integrada do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse encaminhamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo, `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, substitua a predefinição usando um `sessionKey` estático no lugar do padrão com template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- O Gateway inicia automaticamente `gog gmail watch serve` durante a inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.
- Não execute uma instância separada de `gog gmail watch serve` junto com o Gateway.

---

## Host do plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // ou OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Disponibiliza HTML/CSS/JS editáveis pelo agente e A2UI por HTTP na porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Vinculações fora do loopback: as rotas do Canvas exigem autenticação do Gateway (token/senha/proxy confiável), assim como outras superfícies HTTP do Gateway.
- As WebViews do Node normalmente não enviam cabeçalhos de autenticação; depois que um Node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo do Node para acesso ao Canvas/A2UI.
- As URLs de capacidade são vinculadas à sessão WS ativa do Node e expiram rapidamente. A alternativa baseada em IP não é usada.
- Injeta o cliente de recarregamento ao vivo no HTML disponibilizado.
- Cria automaticamente um `index.html` inicial quando o diretório está vazio.
- Também disponibiliza o A2UI em `/__openclaw__/a2ui/`.
- As alterações exigem a reinicialização do Gateway.
- Desative o recarregamento ao vivo para diretórios grandes ou erros `EMFILE`.

---

## Descoberta

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`; a divulgação por multicast na LAN ainda exige que o plugin `bonjour` integrado esteja habilitado.
- `off`: suprime a divulgação por multicast na LAN sem alterar a habilitação do plugin.
- O plugin `bonjour` integrado é iniciado automaticamente em hosts macOS e requer adesão explícita no Linux, Windows e em implantações conteinerizadas do Gateway.
- O nome do host usa como padrão o nome do host do sistema quando ele é um rótulo DNS válido e, caso contrário, usa `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` desativa completamente a divulgação mDNS, substituindo `discovery.mdns.mode`.

### Área ampla (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine-a com um servidor DNS (CoreDNS recomendado) + DNS dividido do Tailscale.

Configuração: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variáveis de ambiente embutidas)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- As variáveis de ambiente embutidas são aplicadas somente se a variável não estiver presente no ambiente do processo.
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum deles substitui variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Consulte [Ambiente](/pt-BR/help/environment) para ver a precedência completa.

### Substituição de variáveis de ambiente

Faça referência a variáveis de ambiente em qualquer string de configuração usando `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Somente nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram um erro ao carregar a configuração.
- Use `$${VAR}` como escape para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

As referências de segredo são aditivas: valores em texto simples continuam funcionando.

### `SecretRef`

Use um destes formatos de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de ID para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID para `source: "file"`: ponteiro JSON absoluto (por exemplo, `"/providers/openai/apiKey"`)
- Padrão de ID para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (oferece suporte a seletores no estilo da AWS `secret#json_key`)
- IDs de `source: "exec"` não devem conter segmentos de caminho `.` ou `..` delimitados por barras (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos de credenciais compatíveis do `openclaw.json`.
- As referências de `auth-profiles.json` são incluídas na resolução em tempo de execução e na cobertura da auditoria.

### Configuração de provedores de segredo

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provedor de ambiente explícito opcional
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Observações:

- O provedor `file` oferece suporte a `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Os caminhos dos provedores file e exec falham de modo fechado quando a verificação de ACLs do Windows não está disponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não podem ser verificados.
- O provedor `exec` exige um caminho `command` absoluto e usa cargas úteis de protocolo em stdin/stdout.
- Por padrão, caminhos de comando que são links simbólicos são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos de links simbólicos enquanto valida o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- Por padrão, o ambiente do processo filho de `exec` é mínimo; passe explicitamente as variáveis necessárias com `passEnv`.
- As referências de segredo são resolvidas no momento da ativação em um snapshot na memória; depois, os caminhos de solicitação leem somente esse snapshot.
- A filtragem de superfícies ativas é aplicada durante a ativação: referências não resolvidas em superfícies habilitadas causam falha na inicialização/recarga, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de autenticação

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Os perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` oferece suporte a referências no nível do valor (`keyRef` para `api_key`, `tokenRef` para `token`) em modos de credenciais estáticas.
- Mapas planos legados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, não são um formato de tempo de execução; `openclaw doctor --fix` os reescreve como perfis canônicos de chave de API `provider:default`, com um backup `.legacy-flat.*.bak`.
- Perfis no modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação baseadas em SecretRef.
- As credenciais estáticas de tempo de execução vêm de snapshots resolvidos na memória; entradas estáticas legadas de `auth.json` são removidas quando detectadas.
- Importações legadas de OAuth vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento de segredos em tempo de execução e ferramentas `audit/configure/apply`: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: recuo base, em horas, quando um perfil falha devido a erros reais de
  faturamento/crédito insuficiente (padrão: `5`). Textos explícitos de faturamento ainda podem
  ser classificados aqui mesmo em respostas `401`/`403`, mas os comparadores de texto específicos
  do provedor permanecem restritos ao provedor que os possui (por exemplo, o OpenRouter
  `Key limit exceeded`). Mensagens HTTP `402` retentáveis sobre janela de uso ou
  limite de gastos da organização/do espaço de trabalho permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para as horas de recuo de faturamento.
- `billingMaxHours`: limite, em horas, para o crescimento exponencial do recuo de faturamento (padrão: `24`).
- `authPermanentBackoffMinutes`: recuo base, em minutos, para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite, em minutos, para o crescimento do recuo de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel, em horas, usada para os contadores de recuo (padrão: `24`).
- `overloadedProfileRotations`: número máximo de rotações de perfil de autenticação no mesmo provedor para erros de sobrecarga antes de mudar para o fallback de modelo (padrão: `1`). Formatos que indicam provedor ocupado, como `ModelNotReadyException`, são classificados aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: número máximo de rotações de perfil de autenticação no mesmo provedor para erros de limite de taxa antes de mudar para o fallback de modelo (padrão: `1`). Esse grupo de limite de taxa inclui textos específicos do provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Auditoria

```json5
{
  audit: {
    enabled: true,
    messages: "off", // desativado | direto | todos
  },
}
```

O Gateway registra eventos de auditoria **somente de metadados** para execuções do agente e
ações de ferramentas no banco de dados de estado compartilhado. Os metadados do ciclo de vida
das mensagens são uma opção separada. O registro armazena identidade, horários, nomes de ferramentas
e resultados normalizados, mas nunca prompts, corpos de mensagens, argumentos de ferramentas,
resultados ou texto bruto de erros. As linhas de mensagens não armazenam IDs brutos de conta da
plataforma, conversa, mensagem e destino. As chaves de sessão de execução/ferramenta permanecem
disponíveis para correlação e podem conter IDs de conta da plataforma ou de pares. Os registros
expiram após 30 dias, e o registro é limitado a 100.000 linhas. Consulte-os com
[`openclaw audit`](/cli/audit) ou com a RPC do Gateway
[`audit.activity.list`](/pt-BR/gateway/protocol#audit-ledger-rpc). Consulte
[Histórico de auditoria](/gateway/audit) para ver o modelo de dados completo, a semântica de
privacidade e os limites de cobertura.

- `enabled`: registra novos eventos de auditoria (padrão: `true`). O registro fica ativado por
  padrão porque uma trilha de auditoria habilitada somente após um incidente não pode explicar
  o incidente. Definir como `false` interrompe novas inserções de eventos após a reinicialização do Gateway;
  os registros existentes permanecem legíveis até expirarem. Reativá-lo retoma o
  registro a partir desse ponto — a lacuna não é preenchida retroativamente.
- `messages`: escopo dos metadados de mensagens (padrão: `"off"`). `"direct"` registra
  somente conversas diretas conhecidas. `"all"` também registra grupos, canais e
  tipos de conversa desconhecidos. Ambos os modos permanecem sem conteúdo e substituem
  identificadores brutos por pseudônimos com chave locais da instalação quando há
  correlação disponível. Eles auxiliam na correlação, mas não constituem anonimização; o banco
  de dados de estado armazena a chave de derivação, mas as exportações via RPC e CLI não.

O Gateway em execução captura `audit.enabled` e `audit.messages` na inicialização;
reinicie-o após alterar qualquer uma das configurações. Atualmente, a cobertura de mensagens inclui
mensagens de entrada aceitas que chegam ao despacho principal e uma linha terminal por
payload lógico original de resposta de saída que chega à entrega durável compartilhada.
Caminhos locais de Plugin e de envio direto que ignoram esses limites compartilhados ainda não
são cobertos. O gravador em segundo plano com capacidade limitada opera pelo princípio do melhor
esforço, não como um arquivo de conformidade sem perdas.

---

## Registro em log

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // elegante | compacto | json
    redactSensitive: "tools", // desativado | ferramentas
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para obter um caminho estável.
- `consoleLevel` muda para `debug` quando `--verbose` é usado.
- `maxFileBytes`: tamanho máximo, em bytes, do arquivo de log ativo antes da rotação (inteiro positivo; padrão: `104857600` = 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo.
- `redactSensitive` / `redactPatterns`: mascaramento de melhor esforço para saída do console, arquivos de log, registros de log OTLP e texto persistido da transcrição da sessão. `redactSensitive: "off"` desativa somente essa política geral de logs/transcrições; as superfícies de segurança da interface, das ferramentas e de diagnóstico ainda ocultam segredos antes da emissão.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: controle principal da saída de instrumentação (padrão: `true`).
- `flags`: matriz de strings de sinalizadores que habilitam a saída de logs direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de tempo sem progresso, em ms, para classificar sessões de processamento de longa duração como `session.long_running`, `session.stalled` ou `session.stuck` (padrão: `120000`). O progresso de resposta, ferramenta, status, bloco e ACP reinicia o temporizador; diagnósticos `session.stuck` repetidos aumentam o intervalo de recuo enquanto não houver alterações.
- `stuckSessionAbortMs`: limite de tempo sem progresso, em ms, antes que trabalhos ativos paralisados elegíveis possam ser drenados com cancelamento para recuperação. Quando não definido, o OpenClaw usa a janela estendida mais segura para execuções incorporadas, de pelo menos 5 minutos e 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: captura um instantâneo de estabilidade ocultando dados sensíveis antes de uma falha por falta de memória quando a pressão de memória atinge `critical` (padrão: `false`). Defina como `true` para adicionar a varredura/gravação do arquivo do pacote de estabilidade, mantendo os eventos normais de pressão de memória.
- `otel.enabled`: habilita o pipeline de exportação do OpenTelemetry (padrão: `false`). Para ver a configuração completa, o catálogo de sinais e o modelo de privacidade, consulte [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação do OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` somente para o sinal correspondente.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos adicionais de metadados HTTP/gRPC enviados com as solicitações de exportação do OTel.
- `otel.serviceName`: nome do serviço para os atributos do recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitam a exportação de rastreamentos, métricas ou logs.
- `otel.logsExporter`: destino da exportação de logs: `"otlp"` (padrão), `"stdout"` para um objeto JSON por linha da saída padrão ou `"both"`.
- `otel.sampleRate`: taxa de amostragem de rastreamentos de `0` a `1`.
- `otel.flushIntervalMs`: intervalo periódico, em ms, para descarregar a telemetria.
- `otel.captureContent`: captura opcional de conteúdo bruto nos atributos de spans do OTEL. Desativada por padrão. O booleano `true` captura o conteúdo de mensagens/ferramentas que não seja do sistema; a forma de objeto permite habilitar explicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` e `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: controle de ambiente para o formato experimental mais recente de spans de inferência GenAI, incluindo nomes de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` e `gen_ai.provider.name` em vez do legado `gen_ai.system`. Por padrão, os spans mantêm `openclaw.model.call` e `gen_ai.system` para compatibilidade; as métricas de GenAI usam atributos semânticos limitados.
- `OPENCLAW_OTEL_PRELOADED=1`: controle de ambiente para hosts que já registraram um SDK global do OpenTelemetry. Nesse caso, o OpenClaw ignora a inicialização/desativação do SDK pertencente ao Plugin, mantendo os listeners de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de configuração correspondente não está definida.
- `cacheTrace.enabled`: registra instantâneos de rastreamento de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída do rastreamento de cache em JSONL (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída do rastreamento de cache (todos com padrão: `true`).

---

## Atualização

```json5
{
  update: {
    channel: "stable", // estável | estável estendida | beta | desenvolvimento
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de lançamento — `"stable"`, `"extended-stable"`, `"beta"` ou `"dev"`. O canal extended-stable é exclusivo para pacotes: os comandos em primeiro plano controlam a instalação, enquanto o Gateway pode emitir avisos de atualização somente leitura.
- `checkOnStart`: verifica atualizações do npm quando o Gateway é iniciado (padrão: `true`). Seleções extended-stable armazenadas usam o mesmo aviso somente leitura e a programação de avisos a cada 24 horas.
- `auto.enabled`: habilita a atualização automática em segundo plano para instalações de pacotes dos canais estável e beta (padrão: `false`). O canal extended-stable nunca é aplicado automaticamente.
- `auto.stableDelayHours`: atraso mínimo, em horas, antes da aplicação automática no canal estável (padrão: `6`; máximo: `168`).
- `auto.stableJitterHours`: janela adicional, em horas, para distribuir a implantação no canal estável (padrão: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frequência, em horas, das verificações do canal beta (padrão: `1`; máximo: `24`). As configurações de atraso/variação do canal estável e de sondagem do canal beta não se aplicam ao canal extended-stable.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // ao vivo | somente final
      hiddenBoundarySeparator: "paragraph", // nenhum | espaço | nova linha | parágrafo
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: controle global do recurso ACP (padrão: `true`; defina como `false` para ocultar os recursos de despacho e criação do ACP).
- `dispatch.enabled`: controle independente para o despacho de turnos de sessões ACP (padrão: `true`). Defina como `false` para manter os comandos ACP disponíveis e bloquear a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um plugin de runtime ACP registrado).
  Instale primeiro o plugin de backend e, se `plugins.allow` estiver definido, inclua o id do plugin de backend (por exemplo, `acpx`), caso contrário o backend ACP não será carregado.
- `fallbacks`: lista ordenada de ids de backends ACP alternativos testados quando o backend principal falha antecipadamente com um erro aparentemente transitório (indisponível, com limite de requisições atingido, cota esgotada ou sobrecarregado), antes de produzir qualquer saída. Cada entrada deve corresponder ao backend de um plugin de runtime ACP registrado.
- `defaultAgent`: id do agente ACP alternativo de destino quando as criações não especificam um destino explícito.
- `allowedAgents`: lista de permissões de ids de agentes autorizados para sessões de runtime ACP; vazia significa que não há restrição adicional.
- `maxConcurrentSessions`: número máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de liberação por inatividade, em ms, para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo do bloco antes de dividir a projeção do bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` armazena em buffer até os eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos ocultos de ferramentas (padrão: `"paragraph"`).
- `stream.maxOutputChars`: número máximo de caracteres da saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: número máximo de caracteres para linhas projetadas de status/atualização do ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade de eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inatividade, em minutos, para workers de sessão ACP antes de se tornarem elegíveis para limpeza.
- `runtime.installCommand`: comando de instalação opcional a ser executado ao inicializar um ambiente de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla o estilo do slogan do banner:
  - `"random"` (padrão): slogans divertidos/sazonais alternados.
  - `"default"`: slogan neutro fixo (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de slogan (o título/a versão do banner ainda são exibidos).
- Para ocultar o banner inteiro (não apenas os slogans), defina a variável de ambiente `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente de configuração

Metadados gravados pelos fluxos de configuração guiada da CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identidade

Consulte os campos de identidade de `agents.list` em [Padrões dos agentes](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As versões atuais não incluem mais o bridge TCP. Os Nodes se conectam pelo WebSocket do Gateway. As chaves `bridge.*` não fazem mais parte do esquema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada do bridge (referência histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // padrão; despacho do cron + execução isolada do turno do agente de cron
    webhook: "https://example.invalid/legacy", // fallback obsoleto para trabalhos armazenados com notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticação do webhook de saída
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão: 2_000_000 bytes
      keepLines: 2000, // padrão: 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter as sessões concluídas de execuções isoladas do cron antes de remover as linhas de sessão do SQLite. Também controla a limpeza de transcrições arquivadas de cron excluídas. Padrão: `24h`; defina como `false` para desativar.
- `runLog.maxBytes`: aceito para compatibilidade com logs antigos de execução do cron baseados em arquivos. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes do histórico de execuções do SQLite mantidas por trabalho. Padrão: `2000`.
- `webhookToken`: token bearer usado para a entrega POST do Webhook do cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação será enviado.
- `webhook`: URL de Webhook de fallback legado e obsoleto (http/https), usada por `openclaw doctor --fix` para migrar trabalhos armazenados que ainda tenham `notify: true`; a entrega em tempo de execução usa `delivery.mode="webhook"` por trabalho junto com `delivery.to`, ou `delivery.completionDestination` ao preservar a entrega de anúncio.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: número máximo de novas tentativas para trabalhos cron em caso de erros transitórios (padrão: `3`; intervalo: `0`-`10`).
- `backoffMs`: matriz de atrasos de recuo em ms para cada nova tentativa (padrão: `[30000, 60000, 300000]`; 1-10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente em todos os tipos transitórios.

Os trabalhos de execução única permanecem habilitados até que as tentativas se esgotem e, em seguida, são desabilitados, mantendo o estado de erro final. Os trabalhos recorrentes usam a mesma política de novas tentativas para erros transitórios, a fim de executar novamente após o recuo antes do próximo horário agendado; erros permanentes ou tentativas transitórias esgotadas retornam à programação recorrente normal com recuo por erro.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de falha para trabalhos cron (padrão: `false`).
- `after`: número de falhas consecutivas antes que um alerta seja disparado (inteiro positivo, mín.: `1`).
- `cooldownMs`: intervalo mínimo, em milissegundos, entre alertas repetidos para o mesmo trabalho (inteiro não negativo).
- `includeSkipped`: contabiliza execuções consecutivas ignoradas para o limite do alerta (padrão: `false`). As execuções ignoradas são monitoradas separadamente e não afetam o recuo por erro de execução.
- `mode`: modo de entrega — `"announce"` envia por meio de uma mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: conta ou id de canal opcional para delimitar a entrega de alertas.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino padrão das notificações de falha de cron para todos os trabalhos.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando há dados de destino suficientes.
- `channel`: substituição do canal para entrega de anúncios. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito do anúncio ou URL do Webhook. Obrigatório para o modo Webhook.
- `accountId`: substituição opcional da conta para entrega.
- `delivery.failureDestination` por trabalho substitui este padrão global.
- Quando nenhum destino de falha global nem por trabalho está definido, os trabalhos que já fazem entregas por `announce` recorrem ao destino principal desse anúncio em caso de falha.
- `delivery.failureDestination` é compatível apenas com trabalhos `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do trabalho seja `"webhook"`.

Consulte [Trabalhos cron](/pt-BR/automation/cron-jobs). As execuções cron isoladas são monitoradas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de modelo de mídia

Espaços reservados de modelo expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida               |
| `{{RawBody}}`      | Corpo bruto (sem invólucros de histórico/remetente) |
| `{{BodyStripped}}` | Corpo sem menções ao grupo                         |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador do destino                          |
| `{{MessageSid}}`   | Id da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                       |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)           |
| `{{Transcript}}`   | Transcrição do áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Número máximo resolvido de caracteres de saída para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Indicação do provedor (whatsapp, telegram, discord etc.) |

---

## Inclusões de configuração (`$include`)

Divida a configuração em vários arquivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento da mesclagem:**

- Arquivo único: substitui o objeto que o contém.
- Matriz de arquivos: mesclagem profunda na ordem indicada (os posteriores substituem os anteriores).
- Chaves irmãs: mescladas após as inclusões (substituem os valores incluídos).
- Inclusões aninhadas: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que faz a inclusão, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas somente quando ainda são resolvidas dentro desse limite. Defina `OPENCLAW_INCLUDE_ROOTS` (caminhos absolutos) para permitir raízes adicionais fora do diretório de configuração.
- Limites: os caminhos não devem conter bytes nulos e devem ter estritamente menos de 4096 caracteres antes e depois da resolução; cada arquivo incluído é limitado a 2 MB.
- Gravações feitas pelo OpenClaw que alteram apenas uma seção de nível superior apoiada por uma inclusão de arquivo único são direcionadas para esse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e mantém `openclaw.json` intacto.
- Inclusões na raiz, matrizes de inclusões e inclusões com substituições por chaves irmãs são somente leitura para gravações feitas pelo OpenClaw; essas gravações falham de forma fechada em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise, inclusões circulares, formato de caminho inválido e comprimento excessivo.

---

## Relacionados

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
- [Doctor](/pt-BR/gateway/doctor)

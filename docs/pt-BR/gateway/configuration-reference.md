---
read_when:
    - Você precisa da semântica exata de configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves centrais do OpenClaw, valores padrão e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-05-12T00:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referência de configuração central para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Cobre as principais superfícies de configuração do OpenClaw e aponta links quando um subsistema tem sua própria referência mais aprofundada. Catálogos de comandos de propriedade de canais e plugins e opções avançadas de memória/QMD ficam em suas próprias páginas, em vez desta.

Verdade do código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e a UI de Controle, com metadados de pacotes/plugins/canais mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de esquema com escopo por caminho para ferramentas de detalhamento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash da linha de base da documentação de configuração em relação à superfície atual do esquema

Caminho de consulta do agente: use a ação da ferramenta `gateway` `config.schema.lookup` para
documentação e restrições exatas em nível de campo antes de editar. Use
[Configuração](/pt-BR/gateway/configuration) para orientação orientada a tarefas e esta página
para o mapa de campos mais amplo, padrões e links para referências de subsistemas.

Referências avançadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + incluídos no pacote
- páginas dos canais/plugins proprietários para superfícies de comandos específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais - o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada - consulte
[Configuração - canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos no pacote (autenticação, controle de acesso, múltiplas contas, bloqueio por menção).

## Padrões de agentes, multiagente, sessões e mensagens

Movido para uma página dedicada - consulte
[Configuração - agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, raciocínio, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e vínculos multiagente)
- `session.*` (ciclo de vida da sessão, Compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.consultThinkingLevel`: substituição do nível de raciocínio para a execução completa do agente OpenClaw por trás das consultas em tempo real do Talk da UI de Controle
  - `talk.consultFastMode`: substituição única de modo rápido para consultas em tempo real do Talk da UI de Controle
  - `talk.speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas respaldada por provedor e configuração de provedor personalizado / URL base foram movidas para uma página dedicada - consulte
[Configuração - ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Modelos

Definições de provedores, listas de permissão de modelos e configuração de provedores personalizados ficam em
[Configuração - ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls).
A raiz `models` também controla o comportamento global do catálogo de modelos.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
- `models.providers`: mapa de provedores personalizados indexado por id de provedor.
- `models.providers.*.localService`: gerenciador de processos sob demanda opcional para
  servidores de modelo locais. O OpenClaw verifica o endpoint de integridade configurado, inicia
  o `command` absoluto quando necessário, aguarda a prontidão e então envia a solicitação
  do modelo. Consulte [Serviços de modelo locais](/pt-BR/gateway/local-model-services).
- `models.pricing.enabled`: controla a inicialização de preços em segundo plano que
  começa depois que sidecars e canais alcançam o caminho pronto do Gateway. Quando `false`,
  o Gateway ignora buscas de catálogos de preços do OpenRouter e LiteLLM; valores configurados em
  `models.providers.*.models[].cost` ainda funcionam para estimativas de custo locais.

## MCP

Definições de servidores MCP gerenciados pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo Pi incorporado e outros adaptadores de runtime. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam esse bloco sem se conectar ao
servidor de destino durante edições de configuração.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definições nomeadas de servidores MCP stdio ou remotos para runtimes que
  expõem ferramentas MCP configuradas.
  Entradas remotas usam `transport: "streamable-http"` ou `transport: "sse"`;
  `type: "http"` é um alias nativo da CLI que `openclaw mcp set` e
  `openclaw doctor --fix` normalizam para o campo canônico `transport`.
- `mcp.sessionIdleTtlMs`: TTL ocioso para runtimes MCP incluídos no pacote e com escopo de sessão.
  Execuções incorporadas únicas solicitam limpeza no fim da execução; este TTL é a proteção final para
  sessões de longa duração e chamadores futuros.
- Alterações em `mcp.*` são aplicadas a quente descartando runtimes MCP de sessão em cache.
  A próxima descoberta/uso de ferramenta os recria a partir da nova configuração, portanto entradas
  removidas de `mcp.servers` são coletadas imediatamente em vez de aguardar o TTL ocioso.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends de CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento de runtime.

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
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permissão opcional apenas para Skills incluídas no pacote (Skills gerenciadas/workspace não afetadas).
- `load.extraDirs`: raízes extras compartilhadas de Skills (menor precedência).
- `load.allowSymlinkTargets`: raízes de destino reais confiáveis para as quais symlinks de Skills podem
  resolver quando o link fica fora da raiz de origem configurada.
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: permite que clientes Gateway confiáveis `operator.admin`
  instalem arquivos zip privados preparados por meio de `skills.upload.*`
  (padrão: false). Isso só habilita o caminho de arquivos enviados; instalações normais do ClawHub
  não exigem isso.
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo se ela estiver incluída no pacote/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente primária (string em texto claro ou objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, além de `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw, além de pacotes compatíveis do Codex e pacotes do Claude, incluindo pacotes Claude sem manifesto com layout padrão.
- **Alterações de configuração exigem uma reinicialização do gateway.**
- `allow`: lista de permissão opcional (somente os plugins listados são carregados). `deny` prevalece.
- `bundledDiscovery`: o padrão é `"allowlist"` para novas configurações, então um
  `plugins.allow` não vazio também controla plugins de provedor incluídos no pacote, incluindo provedores de runtime
  de busca na web. O Doctor grava `"compat"` para configurações migradas de lista de permissão legada
  para preservar o comportamento existente de provedores incluídos no pacote até você optar por entrar.
- `plugins.entries.<id>.apiKey`: campo de conveniência para chave de API em nível de plugin (quando compatível com o plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos que modificam prompts do `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de plugins nativos e diretórios de hooks fornecidos por pacotes compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugins não incluídos no pacote e confiáveis podem ler o conteúdo bruto da conversa a partir de hooks tipados como `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições de `provider` e `model` por execução para execuções de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permissão opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` somente quando você intencionalmente quiser permitir qualquer modelo.
- `plugins.entries.<id>.llm.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições de modelo para `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: lista de permissão opcional de destinos canônicos `provider/model` para substituições confiáveis de conclusão LLM de plugin. Use `"*"` somente quando você intencionalmente quiser permitir qualquer modelo.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: confia explicitamente neste plugin para executar `api.runtime.llm.complete` contra um id de agente não padrão.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo esquema de plugin nativo do OpenClaw quando disponível).
- Configurações de conta/runtime de plugin de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do plugin proprietário, não por um registro central de opções do OpenClaw.

### Configuração do plugin de harness do Codex

O plugin `codex` incluído no pacote controla configurações nativas de harness de servidor de app do Codex em
`plugins.entries.codex.config`. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference) para a superfície completa de configuração
e [Harness do Codex](/pt-BR/plugins/codex-harness) para o modelo de runtime.

`codexPlugins` se aplica somente a sessões que selecionam o harness nativo do Codex.
Ele não habilita plugins do Codex para Pi, execuções normais do provedor OpenAI, vínculos de conversa
ACP ou qualquer harness que não seja do Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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
  plugin/app Codex para o harness Codex. Padrão: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  política padrão de ação destrutiva para elicitações de app de plugin migradas.
  Padrão: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: habilita uma
  entrada de plugin migrada quando `codexPlugins.enabled` global também é true.
  Padrão: `true` para entradas explícitas.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identidade estável do marketplace. A V1 só oferece suporte a `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identidade estável
  de plugin Codex a partir da migração, por exemplo `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  substituição de ação destrutiva por plugin. Quando omitido, o valor global
  de `allow_destructive_actions` é usado.

`codexPlugins.enabled` é a diretiva global de habilitação. Entradas explícitas de plugin
gravadas pela migração são o conjunto durável de instalação e elegibilidade para reparo.
`plugins["*"]` não é compatível, não há alternância `install`, e valores locais de
`marketplacePath` intencionalmente não são campos de configuração porque são
específicos do host.

As verificações de prontidão de `app/list` são armazenadas em cache por uma hora e atualizadas
de forma assíncrona quando ficam obsoletas. A configuração de app de thread Codex é calculada
no estabelecimento da sessão do harness Codex, não em cada turno; use `/new`, `/reset` ou uma reinicialização do gateway
após alterar a configuração nativa de plugin.

- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Recorre a `plugins.entries.firecrawl.config.webSearch.apiKey`, ao legado `tools.web.fetch.firecrawl.apiKey` ou à variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados/internos).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de scrape em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (busca web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar para busca (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: alternância mestre de dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de dreaming (`"0 3 * * *"` por padrão).
  - `model`: substituição opcional do modelo do subagente Dream Diary. Requer `plugins.entries.memory-core.subagent.allowModelOverride: true`; combine com `allowedModels` para restringir destinos. Erros de modelo indisponível tentam novamente uma vez com o modelo padrão da sessão; falhas de confiança ou allowlist não recorrem silenciosamente.
  - a política e os limites de fase são detalhes de implementação (não chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins do pacote Claude habilitados também podem contribuir padrões Pi incorporados de `settings.json`; o OpenClaw aplica esses valores como configurações sanitizadas de agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do plugin de mecanismo de contexto ativo; o padrão é `"legacy"`, a menos que você instale e selecione outro mecanismo.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Compromissos

`commitments` controla a memória inferida de acompanhamento: o OpenClaw pode detectar check-ins a partir de turnos de conversa e entregá-los por meio de execuções de heartbeat.

- `commitments.enabled`: habilita extração oculta por LLM, armazenamento e entrega por heartbeat para compromissos inferidos de acompanhamento. Padrão: `false`.
- `commitments.maxPerDay`: número máximo de compromissos inferidos de acompanhamento entregues por sessão de agente em um dia móvel. Padrão: `3`.

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
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
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

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera abas rastreadas do agente primário após tempo ocioso ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desabilitar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado quando não definido, portanto a navegação do navegador permanece rigorosa por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` apenas quando você confiar intencionalmente na navegação de navegador em rede privada.
- No modo rigoroso, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo rigoroso, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente anexação (iniciar/parar/redefinir desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL direta de WebSocket do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam a solicitações de alcance CDP remoto e
  `attachOnly`, além de abertura de abas. Perfis gerenciados de loopback
  mantêm os padrões locais de CDP.
- Se um serviço CDP gerenciado externamente for acessível por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw trata a porta de loopback como um
  perfil de navegador gerenciado local e pode relatar erros de propriedade de porta local.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se anexar no
  host selecionado ou por meio de um nó de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil específico
  de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais da rota Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks de upload
  de um arquivo, sem substituições de tempo limite de diálogo, sem `wait --load networkidle`, e sem
  `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` gerenciados localmente atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Perfis gerenciados localmente podem definir `executablePath` para substituir o
  `browser.executablePath` global desse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis gerenciados localmente usam `browser.localLaunchTimeoutMs` para descoberta HTTP
  do CDP do Chrome após o início do processo e `browser.localCdpReadyTimeoutMs` para
  prontidão do websocket CDP pós-inicialização. Aumente-os em hosts mais lentos em que o Chrome
  inicia com sucesso, mas as verificações de prontidão disputam com a inicialização. Ambos os valores devem ser
  inteiros positivos de até `120000` ms; valores de configuração inválidos são rejeitados.
- Ordem de detecção automática: navegador padrão se baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` aceitam
  `~` e `~/...` para o diretório inicial do seu SO antes da inicialização do Chromium.
  `userDataDir` por perfil em perfis `existing-session` também é expandido com til.
- Serviço de controle: apenas loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização à inicialização local do Chromium (por exemplo
  `--disable-gpu`, dimensionamento de janela ou flags de depuração).

---

## IU

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: cor de destaque para o chrome da IU do app nativo (tom do balão do Modo de Conversa etc.).
- `assistant`: substituição da identidade da IU de controle. Recorre à identidade do agente ativo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

- `mode`: `local` (executar Gateway) ou `remote` (conectar a Gateway remoto). O Gateway se recusa a iniciar a menos que seja `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases de bind legados**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o Gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigido por padrão. Binds que não são loopback exigem auth do Gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso ciente de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem auth. Use somente para configurações local loopback confiáveis; isso não é oferecido intencionalmente pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a auth de navegador/usuário a um proxy reverso ciente de identidade e confia em cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Auth de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **não loopback** por padrão; proxies reversos loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito. Chamadores internos no mesmo host podem usar `gateway.auth.password` como fallback direto local; `gateway.auth.token` continua mutuamente exclusivo com o modo trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a auth da Control UI/WebSocket (verificados via `tailscale whois`). Endpoints da API HTTP **não** usam essa auth por cabeçalho do Tailscale; eles seguem o modo normal de auth HTTP do Gateway. Esse fluxo sem token pressupõe que o host do Gateway é confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de auth. Aplica-se por IP de cliente e por escopo de auth (shared-secret e device-token são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Portanto, tentativas ruins concorrentes do mesmo cliente podem acionar o limitador na segunda solicitação em vez de ambas passarem como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` assume `true` por padrão; defina `false` quando você quiser intencionalmente limitar também o tráfego localhost (para configurações de teste ou implantações rígidas com proxy).
- Tentativas de auth WS originadas do navegador são sempre limitadas com a isenção de loopback desativada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios originados do navegador são isolados por valor
  `Origin` normalizado, então falhas repetidas de uma origem localhost não
  bloqueiam automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind loopback) ou `funnel` (público, exige auth).
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, o OpenClaw
  verifica `tailscale funnel status` antes de reaplicar Serve na inicialização e ignora
  isso se uma rota Funnel configurada externamente já cobrir a porta do Gateway.
  Padrão `false`.
- `controlUi.allowedOrigins`: lista de permissões explícita de origens de navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados de origens não loopback.
- `controlUi.chatMessageMaxWidth`: largura máxima opcional para mensagens de chat agrupadas da Control UI. Aceita valores restritos de largura CSS, como `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que dependem intencionalmente de política de origem por cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição de emergência no
  ambiente de processo do lado do cliente que permite `ws://` em texto claro para IPs
  de rede privada confiáveis; o padrão continua sendo somente loopback para texto claro.
  Não há equivalente em `openclaw.json`, e configurações de rede privada do navegador,
  como `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afetam clientes
  WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credenciais de cliente remoto. Eles não configuram auth do Gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para o relay externo de APNs usado por builds oficiais/TestFlight do iOS depois que publicam registros baseados em relay no Gateway. Essa URL deve corresponder à URL do relay compilada no build do iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio do Gateway para o relay em milissegundos. Padrão `10000`.
- Registros baseados em relay são delegados a uma identidade específica do Gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha uma concessão de envio com escopo de registro para o Gateway. Outro Gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente de desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.handshakeTimeoutMs`: timeout do handshake WebSocket pré-auth do Gateway em milissegundos. Padrão: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tem precedência quando definido. Aumente isso em hosts carregados ou de baixa potência em que clientes locais conseguem se conectar enquanto o aquecimento da inicialização ainda está estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canais em minutos. Defina `0` para desativar globalmente reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicializações do monitor de integridade por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opção por canal para desativar reinicializações do monitor de integridade mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com várias contas. Quando definido, tem precedência sobre a substituição em nível de canal.
- Caminhos de chamada do Gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas loopback continuam válidas para configurações de proxy/detecção local no mesmo host (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam solicitações loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o Gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: lista de permissões CIDR/IP opcional para aprovar automaticamente o primeiro pareamento de dispositivo de node sem escopos solicitados. Fica desativada quando não definida. Isso não aprova automaticamente pareamento de operador/navegador/Control UI/WebChat e não aprova automaticamente upgrades de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: moldagem global de allow/deny para comandos de node declarados após pareamento e avaliação da lista de permissões da plataforma. Use `allowCommands` para optar por comandos perigosos de node, como `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` remove um comando mesmo que um padrão de plataforma ou permissão explícita o incluísse. Depois que um node altera sua lista de comandos declarados, rejeite e reaprove o pareamento desse dispositivo para que o Gateway armazene o snapshot de comandos atualizado.
- `gateway.tools.deny`: nomes de ferramentas adicionais bloqueados para HTTP `POST /tools/invoke` (estende a lista de negação padrão).
- `gateway.tools.allow`: remove nomes de ferramentas da lista de negação HTTP padrão.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desativado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Proteção reforçada de entrada por URL da Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Listas de permissões vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de proteção reforçada de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina somente para origens HTTPS que você controla; consulte [Auth de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários gateways em um host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Múltiplos Gateways](/pt-BR/gateway/multiple-gateways).

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

- `enabled`: habilita a terminação TLS no listener do Gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par cert/key local autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho do sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho do sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissão restrita.
- `caPath`: caminho opcional do bundle de CA para verificação de cliente ou cadeias de confiança personalizadas.

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

- `mode`: controla como edições de configuração são aplicadas em runtime.
  - `"off"`: ignora edições ao vivo; mudanças exigem uma reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do Gateway ao mudar a configuração.
  - `"hot"`: aplica mudanças no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; recorre à reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes que mudanças de configuração sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para aguardar operações em andamento antes de forçar uma reinicialização ou hot reload de canal. Omita para usar a espera limitada padrão (`300000`); defina `0` para aguardar indefinidamente e registrar avisos periódicos de ainda pendente.

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
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticação: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de hook em query strings são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Se um mapeamento ou preset usar um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves de mapeamento estáticas não exigem essa adesão.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da solicitação é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem a partir do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanece dentro de `hooks.transformsDir` (caminhos absolutos e travessia são rejeitados).
  - Mantenha `hooks.transformsDir` em `~/.openclaw/hooks/transforms`; diretórios de Skills do workspace são rejeitados. Se `openclaw doctor` relatar esse caminho como inválido, mova o módulo de transformação para o diretório de transformações de hooks ou remova `hooks.transformsDir`.
- `agentId` roteia para um agente específico; IDs desconhecidos retornam ao padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamento orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (solicitação + mapeamento), por exemplo `["hook:"]`. Ela se torna obrigatória quando qualquer mapeamento ou preset usa um `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` por padrão.
- `model` substitui o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset integrado do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, substitua o preset por um `sessionKey` estático em vez do padrão com template.

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

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desabilitar.
- Não execute um `gog gmail watch serve` separado junto com o Gateway.

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
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Serve HTML/CSS/JS editável por agente e A2UI via HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds não loopback: rotas do canvas exigem autenticação do Gateway (token/senha/proxy confiável), igual a outras superfícies HTTP do Gateway.
- Node WebViews normalmente não enviam cabeçalhos de autenticação; depois que um node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de node para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta o cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem uma reinicialização do gateway.
- Desabilite live reload para diretórios grandes ou erros `EMFILE`.

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

- `minimal` (padrão quando o plugin `bonjour` integrado está habilitado): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`; a publicidade multicast na LAN ainda exige que o plugin `bonjour` integrado esteja habilitado.
- `off`: suprime a publicidade multicast na LAN sem alterar a habilitação do plugin.
- O plugin `bonjour` integrado inicia automaticamente em hosts macOS e é opcional em implantações do Gateway em Linux, Windows e containers.
- O nome do host usa o nome de host do sistema por padrão quando ele é um rótulo DNS válido, com fallback para `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Área ampla (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + DNS dividido do Tailscale.

Configuração: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variáveis de ambiente inline)

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

- Variáveis de ambiente inline só são aplicadas se o ambiente do processo não tiver a chave.
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum sobrescreve variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Consulte [Ambiente](/pt-BR/help/environment) para a precedência completa.

### Substituição de variáveis de ambiente

Referencie variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Somente nomes em maiúsculas correspondem: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram um erro no carregamento da configuração.
- Escape com `$${VAR}` para um literal `${VAR}`.
- Funciona com `$include`.

---

## Segredos

Referências a segredos são aditivas: valores em texto claro ainda funcionam.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de id de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id de `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Ids de `source: "exec"` não devem conter segmentos de caminho delimitados por barras `.` ou `..` (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- Os destinos de `secrets apply` oferecem suporte a caminhos de credenciais de `openclaw.json`.
- Referências de `auth-profiles.json` são incluídas na resolução de runtime e na cobertura de auditoria.

### Configuração dos provedores de segredo

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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
- Caminhos dos provedores file e exec falham fechados quando a verificação de ACL do Windows está indisponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não podem ser verificados.
- O provedor `exec` exige um caminho de `command` absoluto e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos com symlink enquanto valida o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe variáveis necessárias explicitamente com `passEnv`.
- Referências a segredos são resolvidas no momento da ativação em um snapshot em memória; depois, caminhos de requisição leem apenas o snapshot.
- A filtragem de superfícies ativas se aplica durante a ativação: referências não resolvidas em superfícies habilitadas fazem a inicialização/recarregamento falhar, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de autenticação

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` oferece suporte a referências em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) em modos de credenciais estáticas.
- Mapas planos legados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, não são um formato de runtime; `openclaw doctor --fix` os reescreve para perfis de chave de API canônicos `provider:default` com um backup `.legacy-flat.*.bak`.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação baseadas em SecretRef.
- Credenciais estáticas de runtime vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são limpas quando descobertas.
- Importações OAuth legadas vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento de runtime de segredos e ferramentas `audit/configure/apply`: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

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

- `billingBackoffHours`: backoff base em horas quando um perfil falha devido a erros reais de
  cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas correspondedores de texto específicos
  do provedor permanecem limitados ao provedor que os possui (por exemplo, OpenRouter
  `Key limit exceeded`). Mensagens HTTP `402` repetíveis de janela de uso ou
  limite de gastos de organização/workspace permanecem no caminho `rate_limit`
  em vez disso.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de backoff de cobrança.
- `billingMaxHours`: limite em horas para crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para o crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela contínua em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de perfis de autenticação do mesmo provedor para erros de sobrecarga antes de alternar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado, como `ModelNotReadyException`, caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de perfis de autenticação do mesmo provedor para erros de limite de taxa antes de alternar para fallback de modelo (padrão: `1`). Esse agrupamento de limite de taxa inclui textos no formato do provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registro em log

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para um caminho estável.
- `consoleLevel` aumenta para `debug` quando `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log ativo em bytes antes da rotação (inteiro positivo; padrão: `104857600` = 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo.
- `redactSensitive` / `redactPatterns`: mascaramento de melhor esforço para saída do console, logs em arquivo, registros de log OTLP e texto persistido da transcrição da sessão. `redactSensitive: "off"` desativa apenas esta política geral de log/transcrição; superfícies de segurança de UI/ferramentas/diagnóstico ainda redigem segredos antes da emissão.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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

- `enabled`: alternância mestre para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flags que habilitam saída de log direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade sem progresso em ms para classificar sessões de processamento de longa duração como `session.long_running`, `session.stalled` ou `session.stuck`. Resposta, ferramenta, status, bloco e progresso ACP reiniciam o temporizador; diagnósticos `session.stuck` repetidos fazem backoff enquanto não houver mudança.
- `stuckSessionAbortMs`: limite de idade sem progresso em ms antes que trabalho ativo travado elegível possa ser abortado e drenado para recuperação. Quando não definido, o OpenClaw usa a janela embarcada estendida mais segura de pelo menos 10 minutos e 5x `stuckSessionWarnMs`.
- `otel.enabled`: habilita o pipeline de exportação OpenTelemetry (padrão: `false`). Para a configuração completa, catálogo de sinais e modelo de privacidade, consulte [exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` apenas para esse sinal.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita exportação de traces, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`-`1`.
- `otel.flushIntervalMs`: intervalo periódico de envio de telemetria em ms.
- `otel.captureContent`: captura opcional de conteúdo bruto para atributos de span OTEL. Desativada por padrão. Booleano `true` captura conteúdo de mensagens/ferramentas que não seja do sistema; a forma de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt` explicitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: alternância de ambiente para os atributos experimentais mais recentes do provedor de spans GenAI. Por padrão, spans mantêm o atributo legado `gen_ai.system` por compatibilidade; métricas GenAI usam atributos semânticos limitados.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância de ambiente para hosts que já registraram um SDK OpenTelemetry global. O OpenClaw então pula a inicialização/desligamento do SDK pertencente ao Plugin enquanto mantém listeners de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de configuração correspondente não está definida.
- `cacheTrace.enabled`: registra snapshots de trace de cache para execuções embarcadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de trace de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de trace de cache (todos padrão: `true`).

---

## Atualização

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
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

- `channel`: canal de lançamento para instalações npm/git - `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: habilita atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máximo: `168`).
- `auto.stableJitterHours`: janela extra em horas para distribuir o rollout no canal estável (padrão: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frequência em horas das verificações do canal beta (padrão: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate global do recurso ACP (padrão: `true`; defina `false` para ocultar dispatch ACP e opções de spawn).
- `dispatch.enabled`: gate independente para dispatch de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
  Instale primeiro o Plugin de backend e, se `plugins.allow` estiver definido, inclua o id do Plugin de backend (por exemplo, `acpx`) ou o backend ACP não será carregado.
- `defaultAgent`: id do agente alvo ACP de fallback quando spawns não especificam um alvo explícito.
- `allowedAgents`: lista de permissão de ids de agentes permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: número máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de envio ocioso em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo de chunk antes de dividir a projeção de bloco transmitido.
- `stream.repeatSuppression`: suprime linhas de status/ferramenta repetidas por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` mantém em buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos de ferramenta ocultos (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de ficarem elegíveis para limpeza.
- `runtime.installCommand`: comando de instalação opcional a executar ao inicializar um ambiente de runtime ACP.

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

- `cli.banner.taglineMode` controla o estilo da frase do banner:
  - `"random"` (padrão): frases rotativas engraçadas/sazonais.
  - `"default"`: frase neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de frase (título/versão do banner ainda são exibidos).
- Para ocultar o banner inteiro (não apenas as frases), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente

Metadados gravados por fluxos guiados de configuração da CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidade

Veja os campos de identidade de `agents.list` em [Padrões do agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Ponte (legado, removida)

As builds atuais não incluem mais a ponte TCP. Nodes conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do esquema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada da ponte (referência histórica)">

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções cron isoladas antes de podá-las de `sessions.json`. Também controla a limpeza de transcrições cron arquivadas e excluídas. Padrão: `24h`; defina como `false` para desabilitar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da poda. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes mantidas quando a poda do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega de POST de Webhook do cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook legado preterido de fallback (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: número máximo de novas tentativas para jobs de execução única em erros transitórios (padrão: `3`; intervalo: `0`-`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa de repetição (padrão: `[30000, 60000, 300000]`; 1 a 10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente todos os tipos transitórios.

Aplica-se apenas a jobs cron de execução única. Jobs recorrentes usam tratamento de falhas separado.

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

- `enabled`: habilita alertas de falha para jobs cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta disparar (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `includeSkipped`: conta execuções ignoradas consecutivas para o limite do alerta (padrão: `false`). Execuções ignoradas são rastreadas separadamente e não afetam o backoff de erro de execução.
- `mode`: modo de entrega - `"announce"` envia por meio de uma mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: id opcional de conta ou canal para delimitar o escopo da entrega do alerta.

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

- Destino padrão para notificações de falha de cron em todos os jobs.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega por anúncio. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito de anúncio ou URL de Webhook. Obrigatório para o modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por job substitui esse padrão global.
- Quando nenhum destino de falha global nem por job é definido, jobs que já entregam via `announce` usam esse destino principal de anúncio como fallback em caso de falha.
- `delivery.failureDestination` só é compatível com jobs `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do job seja `"webhook"`.

Consulte [Jobs Cron](/pt-BR/automation/cron-jobs). Execuções cron isoladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template do modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida               |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador do destino                          |
| `{{MessageSid}}`   | id da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                      |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | Transcrição de áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Máx. de caracteres de saída resolvido para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica do provedor (whatsapp, telegram, discord etc.) |

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

**Comportamento de mesclagem:**

- Arquivo único: substitui o objeto contêiner.
- Array de arquivos: mesclado profundamente em ordem (posteriores substituem anteriores).
- Chaves irmãs: mescladas após as inclusões (substituem valores incluídos).
- Inclusões aninhadas: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda são resolvidas dentro desse limite.
- Escritas de propriedade do OpenClaw que alteram apenas uma seção de nível superior apoiada por uma inclusão de arquivo único escrevem diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Inclusões raiz, arrays de inclusão e inclusões com substituições irmãs são somente leitura para escritas de propriedade do OpenClaw; essas escritas falham de modo fechado em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise e inclusões circulares.

---

_Relacionados: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionados

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

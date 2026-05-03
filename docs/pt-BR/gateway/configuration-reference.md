---
read_when:
    - Você precisa de semântica ou padrões exatos de configuração no nível dos campos
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves centrais do OpenClaw, valores padrão e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-05-03T21:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52fa15e85a41ed5ed39102fb641bd33f0aec2e8f244c9d7b3d12b3a1b6dc62a9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referência da configuração principal para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Abrange as principais superfícies de configuração do OpenClaw e aponta para outras referências quando um subsistema tem sua própria referência mais aprofundada. Catálogos de comandos pertencentes a canais e plugins e ajustes avançados de memória/QMD ficam em suas próprias páginas, não nesta.

Verdade do código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e Control UI, com metadados de bundles/plugins/canais mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de schema com escopo de caminho para ferramentas de detalhamento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície de schema atual

Caminho de consulta do agente: use a ação de ferramenta `config.schema.lookup` do `gateway` para
documentação e restrições exatas em nível de campo antes de editar. Use
[Configuração](/pt-BR/gateway/configuration) para orientação orientada a tarefas e esta página
para o mapa de campos mais amplo, padrões e links para referências de subsistemas.

Referências aprofundadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + em bundle
- páginas dos canais/plugins proprietários para superfícies de comandos específicas de canais

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuração — canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais em bundle (autenticação, controle de acesso, várias contas, controle de menções).

## Padrões de agente, multiagente, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, raciocínio, heartbeat, memória, mídia, skills, sandbox)
- `multiAgent.*` (roteamento e vinculações multiagente)
- `session.*` (ciclo de vida da sessão, compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização markdown)
- `talk.*` (modo Talk)
  - `talk.speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas apoiadas por provedores e configuração de
provedor personalizado / URL base foram movidas para uma página dedicada — consulte
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Modelos

Definições de provedores, allowlists de modelos e configuração de provedor personalizado ficam em
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.pricing.enabled`: controla a inicialização de preços em segundo plano que
  começa depois que sidecars e canais chegam ao caminho pronto do Gateway. Quando `false`,
  o Gateway ignora buscas de catálogo de preços do OpenRouter e LiteLLM; valores
  `models.providers.*.models[].cost` configurados ainda funcionam para estimativas locais de custo.

## MCP

Definições de servidores MCP gerenciados pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo Pi incorporado e outros adaptadores de runtime. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam este bloco sem se conectar ao
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
- `mcp.sessionIdleTtlMs`: TTL ocioso para runtimes MCP em bundle com escopo de sessão.
  Execuções incorporadas pontuais solicitam limpeza ao fim da execução; este TTL é o recurso de segurança para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas a quente ao descartar runtimes MCP de sessão em cache.
  A próxima descoberta/uso de ferramenta os recria a partir da nova configuração, então entradas
  `mcp.servers` removidas são coletadas imediatamente em vez de aguardar o TTL ocioso.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends de CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento em runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: allowlist opcional apenas para Skills em bundle (Skills gerenciadas/de workspace não são afetadas).
- `load.extraDirs`: raízes extras de Skills compartilhadas (menor precedência).
- `install.preferBrew`: quando verdadeiro, prefere instaladores Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desativa uma Skill mesmo que esteja em bundle/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente primária (string em texto puro ou objeto SecretRef).

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

- Carregado de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, além de `plugins.load.paths`.
- A descoberta aceita Plugins nativos do OpenClaw mais bundles Codex compatíveis e bundles Claude, incluindo bundles Claude sem manifesto com layout padrão.
- **Alterações de configuração exigem reinicialização do gateway.**
- `allow`: allowlist opcional (apenas plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API em nível de Plugin (quando suportado pelo Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo de Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos que alteram prompts de `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de Plugin nativos e diretórios de hooks fornecidos por bundles compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, Plugins não incluídos em bundle e confiáveis podem ler conteúdo bruto de conversas de hooks tipados como `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confie explicitamente neste Plugin para solicitar substituições de `provider` e `model` por execução em execuções de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` apenas quando você intencionalmente quiser permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo Plugin (validado pelo schema nativo de Plugin do OpenClaw quando disponível).
- Configurações de conta/runtime de Plugin de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do Plugin proprietário, não por um registro central de opções do OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web Firecrawl.
  - `apiKey`: chave de API Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API Firecrawl (padrão: `https://api.firecrawl.dev`; substituições self-hosted devem apontar para endpoints privados/internos).
  - `onlyMainContent`: extrair apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de scrape em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (busca web Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar para busca (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limiares.
  - `enabled`: chave mestre de dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de dreaming (`"0 3 * * *"` por padrão).
  - `model`: substituição opcional de modelo do subagente Dream Diary. Requer `plugins.entries.memory-core.subagent.allowModelOverride: true`; combine com `allowedModels` para restringir destinos. Erros de modelo indisponível tentam novamente uma vez com o modelo padrão da sessão; falhas de confiança ou allowlist não fazem fallback silenciosamente.
  - política de fases e limiares são detalhes de implementação (não chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de bundle Claude habilitados também podem contribuir padrões incorporados do Pi a partir de `settings.json`; o OpenClaw aplica isso como configurações sanitizadas de agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolha o id do Plugin de memória ativo, ou `"none"` para desativar Plugins de memória.
- `plugins.slots.contextEngine`: escolha o id do Plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Compromissos

`commitments` controla memória de acompanhamento inferida: o OpenClaw pode detectar check-ins a partir de turnos de conversa e entregá-los por execuções de heartbeat.

- `commitments.enabled`: habilita extração LLM oculta, armazenamento e entrega por heartbeat para compromissos de acompanhamento inferidos. Padrão: `false`.
- `commitments.maxPerDay`: máximo de compromissos de acompanhamento inferidos entregues por sessão de agente em um dia contínuo. Padrão: `3`.

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

- `evaluateEnabled: false` desativa `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera abas rastreadas do agente principal após tempo ocioso ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desativar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, então a navegação do navegador permanece restrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo restrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de acessibilidade/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo restrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente anexação (iniciar/parar/redefinir desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam à acessibilidade CDP remota e
  `attachOnly`, além de solicitações de abertura de abas. Perfis local loopback
  gerenciados mantêm os padrões locais de CDP.
- Se um serviço CDP gerenciado externamente estiver acessível por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw trata a porta loopback como um
  perfil de navegador local gerenciado e pode relatar erros de propriedade de porta local.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se anexar no
  host selecionado ou por meio de um nó de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para apontar para um perfil
  específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais da rota Chrome MCP:
  ações orientadas por snapshot/ref em vez de segmentação por seletor CSS, hooks de upload
  de arquivo único, sem substituições de tempo limite de diálogo, sem `wait --load networkidle` e sem
  `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` locais gerenciados atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente somente para CDP remoto.
- Perfis locais gerenciados podem definir `executablePath` para substituir o
  `browser.executablePath` global desse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis locais gerenciados usam `browser.localLaunchTimeoutMs` para descoberta HTTP do Chrome CDP
  após o início do processo e `browser.localCdpReadyTimeoutMs` para
  prontidão do websocket CDP pós-inicialização. Aumente-os em hosts mais lentos nos quais o Chrome
  inicia com sucesso, mas as verificações de prontidão disputam com a inicialização. Ambos os valores devem ser
  inteiros positivos até `120000` ms; valores de configuração inválidos são rejeitados.
- Ordem de detecção automática: navegador padrão se baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` aceitam
  `~` e `~/...` para o diretório inicial do seu SO antes da inicialização do Chromium.
  `userDataDir` por perfil em perfis `existing-session` também passa por expansão de til.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao startup local do Chromium (por exemplo
  `--disable-gpu`, dimensionamento de janela ou flags de depuração).

---

## Interface de usuário

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

- `seamColor`: cor de destaque para a moldura da interface do usuário do app nativo (matiz do balão do Modo de conversa etc.).
- `assistant`: substituição da identidade da Interface de controle. Usa como fallback a identidade do agente ativo.

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

- `mode`: `local` (executar o Gateway) ou `remote` (conectar-se ao Gateway remoto). O Gateway se recusa a iniciar a menos que seja `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o Gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigida por padrão. Binds que não são loopback exigem autenticação do Gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e de instalação/reparo de serviço falham quando ambos estão configurados e o modo não foi definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações confiáveis de local loopback; isso não é oferecido intencionalmente pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação do navegador/usuário a um proxy reverso com reconhecimento de identidade e confia nos cabeçalhos de identidade de `gateway.trustedProxies` (veja [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **não loopback** por padrão; proxies reversos de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explicitamente. Chamadores internos no mesmo host podem usar `gateway.auth.password` como fallback direto local; `gateway.auth.token` permanece mutuamente exclusivo com o modo trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da UI de Controle/WebSocket (verificada via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação de cabeçalho do Tailscale; em vez disso, seguem o modo normal de autenticação HTTP do Gateway. Esse fluxo sem token assume que o host do Gateway é confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP de cliente e por escopo de autenticação (shared-secret e device-token são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da UI de Controle do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Tentativas incorretas simultâneas do mesmo cliente podem, portanto, acionar o limitador na segunda solicitação, em vez de ambas passarem em corrida como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem `true` como padrão; defina `false` quando você quiser intencionalmente limitar também o tráfego de localhost (para configurações de teste ou implantações estritas de proxy).
- Tentativas de autenticação WS com origem em navegador são sempre limitadas, com isenção de loopback desativada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios com origem em navegador são isolados por valor
  normalizado de `Origin`, então falhas repetidas de uma origem localhost não
  bloqueiam automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind de loopback) ou `funnel` (público, exige autenticação).
- `controlUi.allowedOrigins`: allowlist explícita de origens de navegador para conexões WebSocket do Gateway. Exigida quando clientes de navegador são esperados de origens não loopback.
- `controlUi.chatMessageMaxWidth`: largura máxima opcional para mensagens de chat agrupadas da UI de Controle. Aceita valores de largura CSS restritos, como `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que dependem intencionalmente de política de origem por cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição de emergência no ambiente do processo
  do lado do cliente que permite `ws://` em texto claro para IPs confiáveis de rede privada;
  o padrão continua sendo somente loopback para texto claro. Não há equivalente em
  `openclaw.json`, e configurações de rede privada do navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afetam clientes WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credenciais de cliente remoto. Eles não configuram a autenticação do Gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para o relay externo de APNs usado por builds oficiais/TestFlight de iOS depois que publicam registros apoiados por relay no Gateway. Essa URL deve corresponder à URL do relay compilada no build de iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio do Gateway para o relay em milissegundos. O padrão é `10000`.
- Registros apoiados por relay são delegados a uma identidade específica do Gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao Gateway uma concessão de envio com escopo de registro. Outro Gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias de env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.handshakeTimeoutMs`: timeout de handshake WebSocket do Gateway antes da autenticação, em milissegundos. Padrão: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tem precedência quando definido. Aumente isso em hosts carregados ou de baixa potência onde clientes locais conseguem conectar enquanto o aquecimento de inicialização ainda está estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canais em minutos. Defina `0` para desativar reinicializações do monitor de integridade globalmente. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicializações do monitor de integridade por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de integridade, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com várias contas. Quando definida, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamadas do Gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` for configurado explicitamente via SecretRef e não for resolvido, a resolução falha de forma fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que encerram TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas de loopback ainda são válidas para configurações de proxy/detecção local no mesmo host (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam solicitações de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o Gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opcional para aprovar automaticamente o pareamento inicial de dispositivo de Node sem escopos solicitados. Fica desativada quando não definida. Isso não aprova automaticamente o pareamento de operador/navegador/UI de Controle/WebChat, e não aprova automaticamente upgrades de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelagem global de allow/deny para comandos de Node declarados após o pareamento e a avaliação da allowlist da plataforma. Use `allowCommands` para optar por comandos de Node perigosos, como `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` remove um comando mesmo que um padrão da plataforma ou uma permissão explícita o incluísse de outra forma. Depois que um Node altera sua lista de comandos declarados, rejeite e aprove novamente esse pareamento de dispositivo para que o Gateway armazene o snapshot de comandos atualizado.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueadas para HTTP `POST /tools/invoke` (estende a lista deny padrão).
- `gateway.tools.allow`: remove nomes de ferramentas da lista deny HTTP padrão.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada por URL de Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; veja [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de várias instâncias

Execute vários Gateways em um host com portas e diretórios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Veja [Vários Gateways](/pt-BR/gateway/multiple-gateways).

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

- `enabled`: habilita terminação TLS no listener do Gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho do sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho do sistema de arquivos para o arquivo de chave privada TLS; mantenha permissões restritas.
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

- `mode`: controla como edições de configuração são aplicadas em tempo de execução.
  - `"off"`: ignora edições ao vivo; alterações exigem uma reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do Gateway em alterações de configuração.
  - `"hot"`: aplica alterações dentro do processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; recorre a reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes de as alterações de configuração serem aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para aguardar operações em andamento antes de forçar uma reinicialização. Omita para usar a espera limitada padrão (`300000`); defina `0` para aguardar indefinidamente e registrar avisos periódicos de ainda pendente.

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
Tokens de hook na string de consulta são rejeitados.

Notas de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Se um mapeamento ou preset usa um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves de mapeamento estáticas não exigem essa opção explícita.

**Pontos de extremidade:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da solicitação é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanece dentro de `hooks.transformsDir` (caminhos absolutos e travessia são rejeitados).
  - Mantenha `hooks.transformsDir` em `~/.openclaw/hooks/transforms`; diretórios de Skills do workspace são rejeitados. Se `openclaw doctor` relatar esse caminho como inválido, mova o módulo de transformação para o diretório de transforms de hooks ou remova `hooks.transformsDir`.
- `agentId` roteia para um agente específico; IDs desconhecidos retornam ao padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permitir todos, `[]` = negar todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamento baseadas em template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: lista opcional de prefixos permitidos para valores explícitos de `sessionKey` (solicitação + mapeamento), por exemplo, `["hook:"]`. Ela se torna obrigatória quando qualquer mapeamento ou preset usa um `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` por padrão.
- `model` substitui o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset integrado do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo, `["hook:", "hook:gmail:"]`.
- Se precisar de `hooks.allowRequestSessionKey: false`, substitua o preset por um `sessionKey` estático em vez do padrão com template.

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

## Host de canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editáveis por agentes e A2UI via HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds sem loopback: rotas de canvas exigem autenticação do Gateway (token/senha/proxy confiável), igual a outras superfícies HTTP do Gateway.
- WebViews do Node normalmente não enviam cabeçalhos de autenticação; depois que um nó é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo do nó para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do nó e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de recarregamento ao vivo no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do Gateway.
- Desabilite o recarregamento ao vivo para diretórios grandes ou erros `EMFILE`.

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

- `minimal` (padrão quando o Plugin `bonjour` integrado está habilitado): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`; a publicidade multicast em LAN ainda exige que o Plugin `bonjour` integrado esteja habilitado.
- `off`: suprime a publicidade multicast em LAN sem alterar a habilitação do Plugin.
- O Plugin `bonjour` integrado inicia automaticamente em hosts macOS e é opcional em implantações do Gateway em Linux, Windows e containers.
- O hostname usa por padrão o hostname do sistema quando ele é um rótulo DNS válido, com fallback para `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

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

- Variáveis de ambiente inline são aplicadas somente se a variável de ambiente do processo não tiver a chave.
- Arquivos `.env`: `.env` no CWD + `~/.openclaw/.env` (nenhum deles substitui variáveis existentes).
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
- Variáveis ausentes/vazias geram um erro ao carregar a configuração.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

Referências de segredo são aditivas: valores em texto simples ainda funcionam.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- Padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho delimitados por barras `.` ou `..` (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de Credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` direciona caminhos de credenciais compatíveis em `openclaw.json`.
- Referências de `auth-profiles.json` são incluídas na resolução em tempo de execução e na cobertura de auditoria.

### Configuração de provedores de segredos

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
- Caminhos dos provedores file e exec falham em modo fechado quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não possam ser verificados.
- O provedor `exec` exige um caminho absoluto de `command` e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando por symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos por symlink enquanto valida o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe variáveis necessárias explicitamente com `passEnv`.
- Referências de segredo são resolvidas no momento da ativação em um snapshot em memória; depois, os caminhos de solicitação leem somente o snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: referências não resolvidas em superfícies habilitadas fazem a inicialização/recarga falhar, enquanto superfícies inativas são ignoradas com diagnósticos.

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
- `auth-profiles.json` oferece suporte a referências no nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciais estáticas.
- Mapas simples legados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, não são um formato de tempo de execução; `openclaw doctor --fix` os reescreve para perfis canônicos de chave de API `provider:default` com um backup `.legacy-flat.*.bak`.
- Perfis no modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação baseadas em SecretRef.
- Credenciais estáticas de tempo de execução vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são removidas quando descobertas.
- Importações OAuth legadas vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento em tempo de execução de segredos e ferramentas `audit/configure/apply`: [Gerenciamento de Segredos](/pt-BR/gateway/secrets).

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

- `billingBackoffHours`: backoff base em horas quando um perfil falha devido a erros reais de cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode chegar aqui mesmo em respostas `401`/`403`, mas os correspondentes de texto específicos de provedor permanecem restritos ao provedor que os possui (por exemplo, OpenRouter `Key limit exceeded`). Mensagens retentáveis de HTTP `402` de janela de uso ou limite de gastos de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de backoff de cobrança.
- `billingMaxHours`: limite em horas para o crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para o crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de perfis de autenticação do mesmo provedor para erros de sobrecarga antes de alternar para o fallback de modelo (padrão: `1`). Formatos de provedor ocupado, como `ModelNotReadyException`, chegam aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de perfis de autenticação do mesmo provedor para erros de limite de taxa antes de alternar para o fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui textos no formato do provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` sobe para `debug` quando `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log ativo em bytes antes da rotação (inteiro positivo; padrão: `104857600` = 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo.
- `redactSensitive` / `redactPatterns`: mascaramento de melhor esforço para saída do console, logs de arquivo, registros de log OTLP e texto persistido de transcrição da sessão. `redactSensitive: "off"` desativa apenas essa política geral de log/transcrição; superfícies de segurança de UI/ferramenta/diagnóstico ainda redigem segredos antes da emissão.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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

- `enabled`: alternância principal para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flags que habilitam saída de log direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade sem progresso em ms para classificar sessões de processamento de longa duração como `session.long_running`, `session.stalled` ou `session.stuck`. Resposta, ferramenta, status, bloco e progresso de ACP reiniciam o temporizador; diagnósticos `session.stuck` repetidos recuam enquanto não houver alterações.
- `otel.enabled`: habilita o pipeline de exportação do OpenTelemetry (padrão: `false`). Para a configuração completa, catálogo de sinais e modelo de privacidade, consulte [exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` apenas para esse sinal.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitam exportação de traces, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `otel.captureContent`: captura opcional de conteúdo bruto para atributos de span OTEL. O padrão é desativado. O booleano `true` captura conteúdo de mensagem/ferramenta que não seja do sistema; o formato de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt` explicitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: alternância de ambiente para os atributos experimentais mais recentes de provedor de span GenAI. Por padrão, spans mantêm o atributo legado `gen_ai.system` para compatibilidade; métricas GenAI usam atributos semânticos limitados.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância de ambiente para hosts que já registraram um SDK global do OpenTelemetry. Então o OpenClaw ignora a inicialização/desligamento do SDK pertencente ao Plugin, mantendo os listeners de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de configuração correspondente não está definida.
- `cacheTrace.enabled`: registra snapshots de trace de cache para execuções embutidas (padrão: `false`).
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

- `channel`: canal de lançamento para instalações npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: habilita atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máx.: `168`).
- `auto.stableJitterHours`: janela extra de distribuição de rollout do canal estável em horas (padrão: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: frequência em horas das verificações do canal beta (padrão: `1`; máx.: `24`).

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

- `enabled`: gate global do recurso ACP (padrão: `true`; defina `false` para ocultar envio ACP e affordances de spawn).
- `dispatch.enabled`: gate independente para envio de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
  Instale primeiro o Plugin de backend e, se `plugins.allow` estiver definido, inclua o id do Plugin de backend (por exemplo, `acpx`) ou o backend ACP não será carregado.
- `defaultAgent`: id do agente de destino ACP de fallback quando spawns não especificam um destino explícito.
- `allowedAgents`: lista de permissões de ids de agentes permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ociosa em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo do chunk antes de dividir a projeção de bloco transmitida.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` armazena em buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de serem elegíveis para limpeza.
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

- `cli.banner.taglineMode` controla o estilo da tagline do banner:
  - `"random"` (padrão): taglines engraçadas/sazonais rotativas.
  - `"default"`: tagline neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de tagline (título/versão do banner ainda são exibidos).
- Para ocultar o banner inteiro (não apenas as taglines), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente

Metadados gravados por fluxos de configuração guiada da CLI (`onboard`, `configure`, `doctor`):

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

Consulte os campos de identidade de `agents.list` em [Padrões de agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As builds atuais não incluem mais a bridge TCP. Nodes se conectam pelo WebSocket do Gateway. As chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada da bridge (referência histórica)">

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

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções cron isoladas antes de removê-las de `sessions.json`. Também controla a limpeza de transcrições cron arquivadas e excluídas. Padrão: `24h`; defina `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da remoção. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes retidas quando a remoção de logs de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de webhook cron (`delivery.mode = "webhook"`), se omitido nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL legada de fallback de Webhook (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: máximo de novas tentativas para tarefas de execução única em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa de repetição (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para repetir todos os tipos transitórios.

Aplica-se somente a tarefas Cron de execução única. Tarefas recorrentes usam tratamento de falhas separado.

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

- `enabled`: habilita alertas de falha para tarefas Cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para a mesma tarefa (inteiro não negativo).
- `includeSkipped`: contabiliza execuções ignoradas consecutivas para o limite de alerta (padrão: `false`). Execuções ignoradas são rastreadas separadamente e não afetam o backoff de erros de execução.
- `mode`: modo de entrega — `"announce"` envia por meio de uma mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: ID opcional de conta ou canal para delimitar a entrega de alertas.

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

- Destino padrão para notificações de falha do Cron em todas as tarefas.
- `mode`: `"announce"` ou `"webhook"`; usa `"announce"` como padrão quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega por anúncio. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino de anúncio explícito ou URL de Webhook. Obrigatório no modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por tarefa substitui esse padrão global.
- Quando nem o destino de falha global nem o por tarefa está definido, tarefas que já entregam via `announce` recorrem a esse destino principal de anúncio em caso de falha.
- `delivery.failureDestination` só é compatível com tarefas `sessionTarget="isolated"`, a menos que o `delivery.mode` principal da tarefa seja `"webhook"`.

Veja [Tarefas Cron](/pt-BR/automation/cron-jobs). Execuções Cron isoladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de modelo para template de mídia

Espaços reservados de modelo expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida               |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador do destino                          |
| `{{MessageSid}}`   | ID da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                      |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | Transcrição do áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Máximo resolvido de caracteres de saída para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica de provedor (whatsapp, telegram, discord, etc.) |

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

- Arquivo único: substitui o objeto que o contém.
- Array de arquivos: mesclado profundamente em ordem (os posteriores substituem os anteriores).
- Chaves irmãs: mescladas após as inclusões (substituem valores incluídos).
- Inclusões aninhadas: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que faz a inclusão, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda resolvem dentro desse limite.
- Gravações de propriedade do OpenClaw que alteram apenas uma seção de nível superior apoiada por uma inclusão de arquivo único gravam nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Inclusões raiz, arrays de inclusão e inclusões com substituições por chaves irmãs são somente leitura para gravações de propriedade do OpenClaw; essas gravações falham de forma fechada em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise e inclusões circulares.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

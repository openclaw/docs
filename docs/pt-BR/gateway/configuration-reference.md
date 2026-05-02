---
read_when:
    - Você precisa da semântica exata de configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, valores padrão e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-05-02T05:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a5820cac79161975cb4ab4ba8171df3d29366cbee2913d093374e2aa8b604a1
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Referência da configuração principal para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Abrange as principais superfícies de configuração do OpenClaw e aponta para outras páginas quando um subsistema tem uma referência própria mais aprofundada. Catálogos de comandos pertencentes a canais e plugins, além de ajustes avançados de memória/QMD, ficam em páginas próprias em vez desta.

Verdade no código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e para a UI de Controle, com metadados de bundles/plugins/canais mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de esquema com escopo por caminho para ferramentas de inspeção detalhada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de base da documentação de configuração contra a superfície de esquema atual

Caminho de consulta do agente: use a ação da ferramenta `gateway` `config.schema.lookup` para
documentação e restrições exatas em nível de campo antes de editar. Use
[Configuração](/pt-BR/gateway/configuration) para orientação orientada a tarefas e esta página
para o mapa de campos mais amplo, padrões e links para referências de subsistemas.

Referências avançadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + em bundle
- páginas dos canais/plugins proprietários para superfícies de comandos específicas de canais

O formato da configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuração — canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais em bundle (autenticação, controle de acesso, múltiplas contas, controle de menções).

## Padrões de agente, multiagente, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, raciocínio, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e associações multiagente)
- `session.*` (ciclo de vida da sessão, Compaction, pruning)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.speechLocale`: ID de localidade BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas apoiadas por provedores e configuração de
provedor personalizado / URL base foram movidas para uma página dedicada — consulte
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Modelos

Definições de provedores, listas de permissão de modelos e configuração de provedor personalizado ficam em
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
- `models.providers`: mapa de provedores personalizados indexado por ID de provedor.
- `models.pricing.enabled`: controla o bootstrap de preços em segundo plano. Quando
  `false`, a inicialização do Gateway ignora buscas dos catálogos de preços do OpenRouter e LiteLLM;
  valores configurados em `models.providers.*.models[].cost` continuam funcionando para estimativas de custo locais.

## MCP

As definições de servidores MCP gerenciadas pelo OpenClaw ficam em `mcp.servers` e são
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
- `mcp.sessionIdleTtlMs`: TTL de inatividade para runtimes MCP em bundle com escopo de sessão.
  Execuções incorporadas únicas solicitam limpeza ao final da execução; este TTL é a proteção final para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas a quente ao descartar runtimes MCP de sessão em cache.
  A próxima descoberta/uso de ferramenta os recria a partir da nova configuração, então entradas removidas de
  `mcp.servers` são coletadas imediatamente em vez de esperar pelo TTL de inatividade.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends da CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento de runtime.

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

- `allowBundled`: lista de permissão opcional apenas para Skills em bundle (Skills gerenciadas/de workspace não são afetadas).
- `load.extraDirs`: raízes extras de Skills compartilhadas (menor precedência).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` estiver
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo se estiver em bundle/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente primária (string de texto simples ou objeto SecretRef).

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

- Carregado de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, mais `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw, além de bundles compatíveis do Codex e bundles do Claude, incluindo bundles de layout padrão do Claude sem manifesto.
- **Alterações de configuração exigem uma reinicialização do gateway.**
- `allow`: lista de permissão opcional (somente plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API em nível de plugin (quando suportado pelo plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo de plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que alteram prompt do `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de plugins nativos e a diretórios de hooks fornecidos por bundles com suporte.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugins confiáveis que não estão em bundle podem ler conteúdo bruto da conversa em hooks tipados como `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições de `provider` e `model` por execução para execuções de subagentes em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permissão opcional de destinos canônicos `provider/model` para substituições confiáveis de subagentes. Use `"*"` somente quando você quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo esquema de plugin nativo do OpenClaw quando disponível).
- Configurações de conta/runtime de plugins de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do plugin proprietário, não por um registro central de opções do OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`; substituições auto-hospedadas devem apontar para endpoints privados/internos).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (busca web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar para busca (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: alternância mestre de dreaming (padrão `false`).
  - `frequency`: cadência cron para cada varredura completa de dreaming (`"0 3 * * *"` por padrão).
  - `model`: substituição opcional do modelo de subagente Dream Diary. Exige `plugins.entries.memory-core.subagent.allowModelOverride: true`; combine com `allowedModels` para restringir destinos. Erros de modelo indisponível tentam novamente uma vez com o modelo padrão da sessão; falhas de confiança ou lista de permissão não fazem fallback silencioso.
  - política de fase e limites são detalhes de implementação (não chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de bundle do Claude habilitados também podem contribuir padrões incorporados do Pi a partir de `settings.json`; o OpenClaw aplica isso como configurações sanitizadas de agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o ID do plugin de memória ativo, ou `"none"` para desabilitar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o ID do plugin de motor de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro motor.

Consulte [Plugins](/pt-BR/tools/plugin).

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
- `tabCleanup` recupera abas rastreadas do agente primário após tempo ocioso ou quando uma sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para desativar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, portanto a navegação do navegador permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de acessibilidade/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente anexação (iniciar/parar/redefinir desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam à acessibilidade CDP remota e `attachOnly`, além de solicitações de abertura de abas. Perfis gerenciados de loopback mantêm os padrões locais do CDP.
- Se um serviço CDP gerenciado externamente estiver acessível por loopback, defina `attachOnly: true` nesse perfil; caso contrário, o OpenClaw trata a porta de loopback como um perfil de navegador local gerenciado e pode relatar erros de propriedade de porta local.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se anexar no host selecionado ou por meio de um nó de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para apontar para um perfil específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas por snapshot/ref em vez de seleção por CSS-selector, hooks de upload de um arquivo, sem substituições de tempo limite de diálogo, sem `wait --load networkidle` e sem `responsebody`, exportação de PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` gerenciados localmente atribuem automaticamente `cdpPort` e `cdpUrl`; defina `cdpUrl` explicitamente somente para CDP remoto.
- Perfis gerenciados localmente podem definir `executablePath` para substituir o `browser.executablePath` global desse perfil. Use isso para executar um perfil no Chrome e outro no Brave.
- Perfis gerenciados localmente usam `browser.localLaunchTimeoutMs` para descoberta HTTP do CDP do Chrome após o início do processo e `browser.localCdpReadyTimeoutMs` para prontidão do websocket CDP após a inicialização. Aumente-os em hosts mais lentos nos quais o Chrome inicia com sucesso, mas as verificações de prontidão competem com a inicialização. Ambos os valores devem ser inteiros positivos de até `120000` ms; valores de configuração inválidos são rejeitados.
- Ordem de detecção automática: navegador padrão, se baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` aceitam `~` e `~/...` para o diretório inicial do seu SO antes da inicialização do Chromium.
  `userDataDir` por perfil em perfis `existing-session` também é expandido com til.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao início local do Chromium (por exemplo, `--disable-gpu`, dimensionamento de janela ou flags de depuração).

---

## Interface do Usuário

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

- `seamColor`: cor de destaque para o chrome da interface do app nativo (tom da bolha do Talk Mode etc.).
- `assistant`: substituição de identidade da Interface de Controle. Recorre à identidade do agente ativo.

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

<Accordion title="Gateway field details">

- `mode`: `local` (executa o gateway) ou `remote` (conecta-se ao gateway remoto). O Gateway se recusa a iniciar a menos que seja `local`.
- `port`: porta única multiplexada para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: obrigatória por padrão. Binds que não sejam loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso ciente de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e de instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use somente para configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação do navegador/usuário a um proxy reverso ciente de identidade e confia nos cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera, por padrão, uma origem de proxy **não loopback**; proxies reversos local loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito. Chamadores internos no mesmo host podem usar `gateway.auth.password` como fallback direto local; `gateway.auth.token` continua sendo mutuamente exclusivo com o modo trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da Control UI/WebSocket (verificada via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por cabeçalho do Tailscale; em vez disso, seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway é confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP de cliente e por escopo de autenticação (shared-secret e device-token são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Tentativas ruins simultâneas do mesmo cliente podem, portanto, acionar o limitador na segunda solicitação em vez de ambas passarem em corrida como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` por padrão; defina `false` quando você quiser intencionalmente que o tráfego localhost também seja limitado por taxa (para configurações de teste ou implantações rígidas de proxy).
- Tentativas de autenticação WS com origem em navegador são sempre limitadas por taxa com a isenção de loopback desativada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios com origem em navegador são isolados por valor `Origin`
  normalizado, portanto falhas repetidas de uma origem localhost não bloqueiam automaticamente
  uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind loopback) ou `funnel` (público, exige autenticação).
- `controlUi.allowedOrigins`: lista de permissões explícita de origens de navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados de origens que não sejam loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que dependem intencionalmente de política de origem por cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição emergencial no ambiente de processo
  do lado do cliente que permite `ws://` em texto claro para IPs confiáveis de rede privada;
  o padrão continua sendo somente loopback para texto claro. Não há equivalente em `openclaw.json`,
  e configurações de rede privada de navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afetam clientes WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credenciais de cliente remoto. Eles não configuram a autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para o relay APNs externo usado por builds oficiais/TestFlight do iOS depois que publicam registros apoiados por relay no gateway. Essa URL deve corresponder à URL do relay compilada no build do iOS.
- `gateway.push.apns.relay.timeoutMs`: tempo limite de envio do gateway para o relay em milissegundos. O padrão é `10000`.
- Registros apoiados por relay são delegados a uma identidade específica do gateway. O app iOS emparelhado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao gateway uma concessão de envio com escopo de registro. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.handshakeTimeoutMs`: tempo limite de handshake WebSocket pré-autenticação do Gateway em milissegundos. Padrão: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` tem precedência quando definido. Aumente isso em hosts carregados ou de baixa potência nos quais clientes locais conseguem se conectar enquanto o aquecimento de inicialização ainda está se estabilizando.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canal em minutos. Defina `0` para desativar globalmente as reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha este valor maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações do monitor de integridade por canal/conta em uma hora contínua. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativação por canal para reinicializações do monitor de integridade, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais de múltiplas contas. Quando definida, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente via SecretRef e não for resolvido, a resolução falha fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que encerram TLS ou injetam cabeçalhos de cliente encaminhado. Liste somente proxies que você controla. Entradas de loopback ainda são válidas para configurações de proxy/detecção local no mesmo host (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam solicitações de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento de falha fechada.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de permissões de CIDR/IP para aprovar automaticamente emparelhamento de dispositivo Node pela primeira vez sem escopos solicitados. Fica desativada quando não definida. Isso não aprova automaticamente emparelhamento de operador/navegador/Control UI/WebChat, nem aprova automaticamente upgrades de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelagem global de permissão/negação para comandos Node declarados após o emparelhamento e a avaliação da lista de permissões da plataforma. Use `allowCommands` para optar por comandos Node perigosos, como `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` remove um comando mesmo que um padrão da plataforma ou uma permissão explícita o incluísse. Depois que um Node altera sua lista de comandos declarados, rejeite e aprove novamente esse emparelhamento de dispositivo para que o gateway armazene o snapshot de comandos atualizado.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueados para HTTP `POST /tools/invoke` (estende a lista de negação padrão).
- `gateway.tools.allow`: remove nomes de ferramentas da lista de negação HTTP padrão.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desativado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Reforço de URL de entrada da Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Listas de permissões vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca de URL.
- Cabeçalho opcional de reforço de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina somente para origens HTTPS que você controla; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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

- `enabled`: habilita a terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do pacote de CA para verificação de cliente ou cadeias de confiança personalizadas.

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
  - `"off"`: ignora edições ao vivo; alterações exigem uma reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do gateway em caso de alteração de configuração.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta primeiro hot reload; recorre à reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes de aplicar alterações de configuração (inteiro não negativo).
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
Tokens de hook em query-string são rejeitados.

Notas de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser **diferente** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo, `["hook:"]`).
- Se um mapeamento ou preset usar um `sessionKey` baseado em template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves de mapeamento estáticas não exigem essa adesão.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho depois de `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanece dentro de `hooks.transformsDir` (caminhos absolutos e travessia de diretórios são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos retornam ao padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permitir todos, `[]` = negar todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamento orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: lista de permissões opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapeamento), por exemplo, `["hook:"]`. Torna-se obrigatória quando qualquer mapeamento ou preset usa um `sessionKey` baseado em template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` por padrão.
- `model` substitui o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset integrado do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo, `["hook:", "hook:gmail:"]`.
- Se precisar de `hooks.allowRequestSessionKey: false`, substitua o preset por um `sessionKey` estático em vez do padrão baseado em template.

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

- Serve HTML/CSS/JS editável por agente e A2UI via HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Vínculos não loopback: rotas de canvas exigem autenticação do Gateway (token/senha/proxy confiável), igual a outras superfícies HTTP do Gateway.
- Node WebViews normalmente não enviam cabeçalhos de autenticação; depois que um nó é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de nó para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do nó e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de recarregamento ao vivo no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do gateway.
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

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`.
- O nome de host usa o nome de host do sistema por padrão quando ele é um rótulo DNS válido, recorrendo a `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

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
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum substitui variáveis existentes).
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
- Padrão de id de `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id de `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- Padrão de id de `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho delimitados por barra `.` ou `..` (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos de credenciais compatíveis em `openclaw.json`.
- Referências de `auth-profiles.json` são incluídas na resolução em runtime e na cobertura de auditoria.

### Configuração de provedores de segredo

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

- O provedor `file` é compatível com `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de provedores file e exec falham de forma segura quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não podem ser verificados.
- O provedor `exec` exige um caminho absoluto de `command` e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos de symlink enquanto valida o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe variáveis exigidas explicitamente com `passEnv`.
- Referências de segredo são resolvidas no momento da ativação em um snapshot em memória; depois, os caminhos de requisição leem somente o snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: referências não resolvidas em superfícies habilitadas impedem a inicialização/recarga, enquanto superfícies inativas são ignoradas com diagnósticos.

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
- `auth-profiles.json` é compatível com referências no nível do valor (`keyRef` para `api_key`, `tokenRef` para `token`) em modos de credenciais estáticas.
- Mapas planos legados de `auth-profiles.json`, como `{ "provider": { "apiKey": "..." } }`, não são um formato de runtime; `openclaw doctor --fix` os reescreve para perfis de chave de API canônicos `provider:default` com um backup `.legacy-flat.*.bak`.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não são compatíveis com credenciais de perfil de autenticação baseadas em SecretRef.
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

- `billingBackoffHours`: backoff base em horas quando um perfil falha por erros verdadeiros de
  cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas de provedor
  permanecem restritas ao provedor que as possui (por exemplo, OpenRouter
  `Key limit exceeded`). Mensagens recuperáveis de HTTP `402` de janela de uso ou
  limite de gasto da organização/workspace permanecem no caminho `rate_limit`
  em vez disso.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de backoff de cobrança.
- `billingMaxHours`: limite em horas para crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para crescimento do backoff `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: número máximo de rotações de perfis de autenticação do mesmo provedor para erros de sobrecarga antes de alternar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado, como `ModelNotReadyException`, caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: número máximo de rotações de perfis de autenticação do mesmo provedor para erros de limite de taxa antes de alternar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui textos no formato de provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registro de logs

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
- `redactSensitive` / `redactPatterns`: mascaramento em melhor esforço para saída do console, logs em arquivo, registros de log OTLP e texto persistido de transcrição de sessão. `redactSensitive: "off"` desativa apenas esta política geral de log/transcrição; superfícies de segurança de UI/ferramenta/diagnóstico ainda ocultam segredos antes da emissão.

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
- `flags`: array de strings de sinalizadores que habilitam saída de log direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade sem progresso em ms para classificar sessões de processamento de longa duração como `session.long_running`, `session.stalled` ou `session.stuck`. Resposta, ferramenta, status, bloco e progresso ACP reiniciam o temporizador; diagnósticos `session.stuck` repetidos recuam enquanto não houver alteração.
- `otel.enabled`: habilita o pipeline de exportação OpenTelemetry (padrão: `false`). Para a configuração completa, o catálogo de sinais e o modelo de privacidade, consulte [exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` apenas para esse sinal.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitam exportação de rastreamentos, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de rastreamento `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de envio de telemetria em ms.
- `otel.captureContent`: captura opcional de conteúdo bruto para atributos de span OTEL. Desativado por padrão. O booleano `true` captura conteúdo de mensagens/ferramentas que não seja do sistema; a forma de objeto permite habilitar `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt` explicitamente.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: alternância de ambiente para os atributos experimentais mais recentes de provedor de span GenAI. Por padrão, spans mantêm o atributo legado `gen_ai.system` para compatibilidade; métricas GenAI usam atributos semânticos limitados.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância de ambiente para hosts que já registraram um SDK OpenTelemetry global. O OpenClaw então ignora a inicialização/encerramento do SDK pertencente ao Plugin enquanto mantém ouvintes de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de configuração correspondente não está definida.
- `cacheTrace.enabled`: registra snapshots de rastreamento de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de rastreamento de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de rastreamento de cache (todos padrão: `true`).

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
- `auto.stableJitterHours`: janela extra em horas para espalhamento de implantação no canal estável (padrão: `12`; máx.: `168`).
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

- `enabled`: gate global do recurso ACP (padrão: `true`; defina como `false` para ocultar despacho ACP e affordances de geração).
- `dispatch.enabled`: gate independente para despacho de turno de sessão ACP (padrão: `true`). Defina como `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
  Se `plugins.allow` estiver definido, inclua o id do Plugin de backend (por exemplo, `acpx`) ou o Plugin padrão incluído não será carregado.
- `defaultAgent`: id do agente ACP de fallback quando gerações não especificam um destino explícito.
- `allowedAgents`: lista de permissões de ids de agentes permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de envio ocioso em ms para texto transmitido em streaming.
- `stream.maxChunkChars`: tamanho máximo do bloco antes de dividir a projeção de bloco transmitido em streaming.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` armazena em buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes de texto visível após eventos de ferramenta ocultos (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos em streaming.
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

- `cli.banner.taglineMode` controla o estilo da tagline do banner:
  - `"random"` (padrão): taglines engraçadas/sazonais rotativas.
  - `"default"`: tagline neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de tagline (título/versão do banner ainda são mostrados).
- Para ocultar o banner inteiro (não apenas taglines), defina a env `OPENCLAW_HIDE_BANNER=1`.

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

Consulte os campos de identidade `agents.list` em [Padrões do agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Ponte (legado, removido)

As compilações atuais não incluem mais a ponte TCP. Nodes se conectam pelo WebSocket do Gateway. As chaves `bridge.*` não fazem mais parte do esquema de configuração (a validação falha até serem removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções cron isoladas antes de removê-las de `sessions.json`. Também controla a limpeza de transcrições cron excluídas arquivadas. Padrão: `24h`; defina como `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da remoção. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes retidas quando a remoção de log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook do Cron (`delivery.mode = "webhook"`), se omitido nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook de fallback legado obsoleta (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: máximo de novas tentativas para jobs de execução única em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente todos os tipos transitórios.

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
- `after`: falhas consecutivas antes que um alerta seja disparado (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `includeSkipped`: conta execuções ignoradas consecutivas para o limite de alerta (padrão: `false`). Execuções ignoradas são rastreadas separadamente e não afetam o backoff de erro de execução.
- `mode`: modo de entrega — `"announce"` envia por mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: id opcional de conta ou canal para escopar a entrega de alertas.

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
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando há dados suficientes do destino.
- `channel`: substituição de canal para entrega por announce. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino de announce explícito ou URL de Webhook. Obrigatório no modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por tarefa substitui esse padrão global.
- Quando nenhum destino de falha global nem por tarefa está definido, as tarefas que já entregam via `announce` voltam a usar esse destino principal de announce em caso de falha.
- `delivery.failureDestination` só é compatível com tarefas `sessionTarget="isolated"`, a menos que o `delivery.mode` principal da tarefa seja `"webhook"`.

Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs). Execuções isoladas de Cron são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de modelo de mídia

Placeholders de modelo expandidos em `tools.media.models[].args`:

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
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/...)        |
| `{{Transcript}}`   | Transcrição de áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Máximo de caracteres de saída resolvido para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica do provedor (whatsapp, telegram, discord, etc.) |

---

## Includes de configuração (`$include`)

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
- Chaves irmãs: mescladas após includes (substituem valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que faz o include, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas somente quando ainda resolvem dentro desse limite.
- Escritas pertencentes ao OpenClaw que alteram apenas uma seção de nível superior apoiada por um include de arquivo único gravam diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes raiz, arrays de includes e includes com substituições por chaves irmãs são somente leitura para escritas pertencentes ao OpenClaw; essas escritas falham de forma fechada em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise e includes circulares.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

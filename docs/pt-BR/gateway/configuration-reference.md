---
read_when:
    - Você precisa da semântica exata de configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-25T18:18:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7e904455845a9559a0a8ed67b217597819f4a8abc38e6c8ecb69b6481528e8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referência principal de configuração para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuration](/pt-BR/gateway/configuration).

Abrange as principais superfícies de configuração do OpenClaw e aponta para links quando um subsistema tem sua própria referência mais detalhada. Catálogos de comandos controlados por canal e Plugin, além de ajustes profundos de memória/QMD, ficam em suas próprias páginas em vez desta.

Fonte da verdade no código:

- `openclaw config schema` imprime o JSON Schema em tempo real usado para validação e para a Control UI, com metadados incluídos de Plugins/canais/itens incluídos mesclados quando disponíveis
- `config.schema.lookup` retorna um único nó de schema com escopo de caminho para ferramentas de inspeção detalhada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície atual do schema

Referências detalhadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos internos + incluídos
- páginas do canal/Plugin proprietário para superfícies de comando específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando eles são omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuration — channels](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos (autenticação, controle de acesso, múltiplas contas, controle por menção).

## Padrões de agente, multiagente, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuration — agents](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, thinking, heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e associações de multiagente)
- `session.*` (ciclo de vida da sessão, compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: quando não definido, o modo Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas com suporte de provedor e configuração de provedor personalizado / URL base foram movidas para uma página dedicada — consulte
[Configuration — tools and custom providers](/pt-BR/gateway/config-tools).

## MCP

As definições de servidor MCP gerenciadas pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo Pi incorporado e outros adaptadores de tempo de execução. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam esse bloco sem se conectar ao
servidor de destino durante edições de configuração.

```json5
{
  mcp: {
    // Opcional. Padrão: 600000 ms (10 minutos). Defina 0 para desativar a remoção por inatividade.
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

- `mcp.servers`: definições nomeadas de servidores MCP stdio ou remotos para tempos de execução que
  expõem ferramentas MCP configuradas.
- `mcp.sessionIdleTtlMs`: TTL de inatividade para tempos de execução MCP incluídos com escopo de sessão.
  Execuções incorporadas de uso único solicitam limpeza no fim da execução; este TTL é a proteção final para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas a quente ao descartar tempos de execução MCP de sessão em cache.
  A próxima descoberta/uso de ferramenta os recria a partir da nova configuração, então entradas removidas de
  `mcp.servers` são eliminadas imediatamente em vez de esperar o TTL de inatividade.

Consulte [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends da CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento em tempo de execução.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills incluídas (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: raízes compartilhadas extras de Skills (menor precedência).
- `install.preferBrew`: quando `true`, prefere instaladores Homebrew quando `brew` está
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desativa uma Skill mesmo que ela esteja incluída/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente principal (string em texto simples ou objeto SecretRef).

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
- A descoberta aceita Plugins nativos do OpenClaw, além de pacotes compatíveis com Codex e Claude, incluindo pacotes Claude sem manifesto com layout padrão.
- **Alterações de configuração exigem reinicialização do gateway.**
- `allow`: allowlist opcional (somente os Plugins listados carregam). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API em nível de Plugin (quando compatível com o Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que alteram prompt de `before_agent_start` legado, enquanto preserva `modelOverride` e `providerOverride` legados. Aplica-se a hooks nativos de Plugin e a diretórios de hooks fornecidos por pacotes compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, Plugins confiáveis não incluídos podem ler conteúdo bruto de conversa de hooks tipados como `llm_input`, `llm_output` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições de `provider` e `model` por execução para execuções de subagente em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` somente quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo Plugin (validado pelo schema de Plugin nativo do OpenClaw quando disponível).
- Configurações de conta/tempo de execução de Plugins de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do Plugin proprietário, não por um registro central de opções do OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web do Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legado, ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrair apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima de cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da solicitação de raspagem em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do X Search do xAI (busca web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a usar para busca (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestre de Dreaming (padrão `false`).
  - `frequency`: cadência Cron para cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - política de fases e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória está em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de pacote Claude habilitados também podem contribuir com padrões incorporados do Pi de `settings.json`; o OpenClaw os aplica como configurações saneadas de agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do Plugin de memória ativo, ou `"none"` para desativar Plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do Plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI em vez de edições manuais.

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
      // dangerouslyAllowPrivateNetwork: true, // habilite somente para acesso confiável a rede privada
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

- `evaluateEnabled: false` desabilita `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera abas rastreadas do agente principal após tempo ocioso ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desativar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado quando não definido, então a navegação do navegador permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente de conexão (`start`/`stop`/`reset` desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam ao alcance remoto e
  de CDP `attachOnly`, além de solicitações de abertura de abas. Perfis de loopback
  gerenciados mantêm os padrões locais de CDP.
- Se um serviço CDP gerenciado externamente puder ser alcançado por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw tratará a porta de loopback como um
  perfil de navegador local gerenciado e poderá relatar erros locais de propriedade de porta.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se conectar no
  host selecionado ou por meio de um Node de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil específico de
  navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks
  de upload de um único arquivo, sem substituições de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação em PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` locais gerenciados atribuem automaticamente `cdpPort` e `cdpUrl`; só
  defina `cdpUrl` explicitamente para CDP remoto.
- Perfis locais gerenciados podem definir `executablePath` para sobrescrever o
  `browser.executablePath` global para esse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis locais gerenciados usam `browser.localLaunchTimeoutMs` para descoberta HTTP do Chrome CDP
  após o início do processo e `browser.localCdpReadyTimeoutMs` para prontidão do websocket CDP
  após a inicialização. Aumente esses valores em hosts mais lentos, onde o Chrome
  inicia com sucesso, mas as verificações de prontidão disputam com a inicialização.
- Ordem de detecção automática: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` aceita `~` para o diretório home do seu sistema operacional.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização à inicialização local do Chromium (por exemplo,
  `--disable-gpu`, dimensionamento de janela ou flags de depuração).

---

## UI

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

- `seamColor`: cor de destaque para o chrome da UI do app nativo (tom da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da Control UI. Usa a identidade do agente ativo como fallback.

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
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // perigoso: permite URLs absolutas externas http(s) para embed
      // allowedOrigins: ["https://control.example.com"], // obrigatório para Control UI fora de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem via Host header
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
    // Opcional. Padrão false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Padrão não definido/desabilitado.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Negações HTTP adicionais de /tools/invoke
      deny: ["browser"],
      // Remove ferramentas da lista padrão de negação HTTP
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

- `mode`: `local` (executa o gateway) ou `remote` (conecta a um gateway remoto). O gateway se recusa a iniciar, a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: obrigatória por padrão. Binds fora de loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações confiáveis de local loopback; isso intencionalmente não é oferecido nos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um proxy reverso com reconhecimento de identidade e confia em cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos de loopback no mesmo host não satisfazem a autenticação `trusted-proxy`.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da Control UI/WebSocket (verificados via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por cabeçalho do Tailscale; eles seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP do cliente e por escopo de autenticação (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, falhas para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Assim, tentativas inválidas concorrentes do mesmo cliente podem disparar o limitador na segunda solicitação em vez de ambas passarem em paralelo como incompatibilidades simples.
  - `gateway.auth.rateLimit.exemptLoopback` tem como padrão `true`; defina `false` quando quiser intencionalmente que o tráfego localhost também seja limitado por taxa (para ambientes de teste ou implantações estritas com proxy).
- Tentativas de autenticação WS originadas do navegador sempre são limitadas por taxa com a isenção de loopback desabilitada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios de origem do navegador são isolados por valor `Origin`
  normalizado, para que falhas repetidas de uma origem localhost não
  bloqueiem automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind em loopback) ou `funnel` (público, exige auth).
- `controlUi.allowedOrigins`: allowlist explícita de origem de navegador para conexões WebSocket do Gateway. Obrigatória quando se espera clientes de navegador vindos de origens fora de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que dependem intencionalmente de política de origem baseada em cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição de último recurso no ambiente de processo do lado do cliente
  que permite `ws://` em texto simples para IPs confiáveis de rede privada;
  o padrão continua sendo apenas loopback para texto simples. Não há equivalente em `openclaw.json`,
  e configurações de rede privada do navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afetam clientes
  WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credenciais do cliente remoto. Eles não configuram a autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para o relay APNs externo usado por builds oficiais/TestFlight do iOS depois que publicam registros com suporte de relay no gateway. Essa URL deve corresponder à URL do relay compilada no build do iOS.
- `gateway.push.apns.relay.timeoutMs`: tempo limite de envio do gateway para o relay em milissegundos. O padrão é `10000`.
- Registros com suporte de relay são delegados a uma identidade específica do gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha uma permissão de envio com escopo de registro ao gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs HTTP de relay em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canal em minutos. Defina `0` para desabilitar globalmente reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: máximo de reinicializações do monitor de integridade por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de integridade, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição no nível do canal.
- Caminhos locais de chamada do gateway podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução falha de forma segura (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxies reversos que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas de loopback ainda são válidas para configurações de proxy no mesmo host/detecção local (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam solicitações de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento de falha segura.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist opcional de CIDR/IP para autoaprovar o primeiro pareamento de dispositivo Node sem escopos solicitados. Fica desabilitada quando não definida. Isso não autoaprova pareamento de operador/navegador/Control UI/WebChat e não autoaprova upgrades de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelagem global de permissão/negação para comandos declarados do Node após avaliação de pareamento e allowlist.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de negação).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de negação HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada de URL do Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desabilitar busca de URL.
- Cabeçalho opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários gateways em um único host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Multiple Gateways](/pt-BR/gateway/multiple-gateways).

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

- `enabled`: habilita terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; somente para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do pacote de CAs para verificação de cliente ou cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: controla como edições de configuração são aplicadas em tempo de execução.
  - `"off"`: ignora edições ao vivo; alterações exigem reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do gateway em caso de mudança de configuração.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; recorre a reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes que alterações de configuração sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para aguardar operações em andamento antes de forçar reinicialização. Omita ou defina `0` para aguardar indefinidamente e registrar avisos periódicos de ainda pendente.

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

Auth: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de hook em query string são rejeitados.

Observações sobre validação e segurança:

- `hooks.enabled=true` exige `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapeamento ou preset usar `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapeamento não exigem essa adesão.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da solicitação é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores de `sessionKey` renderizados por template no mapeamento são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessia de diretórios são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos usam o padrão como fallback.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamento orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (solicitação + mapeamento), por exemplo `["hook:"]`. Ela se torna obrigatória quando qualquer mapeamento ou preset usa `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` como padrão.
- `model` sobrescreve o LLM para esta execução de hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset interno do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, sobrescreva o preset com um `sessionKey` estático em vez do padrão com template.

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

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.
- Não execute um `gog gmail watch serve` separado junto com o Gateway.

---

## Host de Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // ou OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editáveis por agente e A2UI por HTTP na porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds fora de loopback: rotas de canvas exigem auth do Gateway (token/senha/trusted-proxy), igual às outras superfícies HTTP do Gateway.
- WebViews de Node normalmente não enviam cabeçalhos de auth; depois que um node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de node para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do gateway.
- Desative o live reload para diretórios grandes ou erros `EMFILE`.

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
- O hostname usa `openclaw` como padrão. Sobrescreva com `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

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
- Arquivos `.env`: `.env` do diretório de trabalho atual + `~/.openclaw/.env` (nenhum sobrescreve variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Consulte [Environment](/pt-BR/help/environment) para a precedência completa.

### Substituição de variável de ambiente

Referencie variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Somente nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro no carregamento da configuração.
- Escape com `$${VAR}` para um literal `${VAR}`.
- Funciona com `$include`.

---

## Secrets

Refs de Secret são aditivas: valores em texto simples continuam funcionando.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho `/` delimitados como `.` ou `..` (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de Credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos de credenciais compatíveis em `openclaw.json`.
- Refs em `auth-profiles.json` estão incluídas na resolução em tempo de execução e na cobertura de auditoria.

### Configuração de provedores de Secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provedor env explícito opcional
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

- O provedor `file` aceita `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de provedores file e exec falham de forma segura quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` somente para caminhos confiáveis que não possam ser verificados.
- O provedor `exec` exige um caminho absoluto em `command` e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos com symlink enquanto valida o caminho do destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho do destino resolvido.
- O ambiente do processo filho `exec` é mínimo por padrão; passe variáveis necessárias explicitamente com `passEnv`.
- Refs de Secret são resolvidas no momento da ativação em um snapshot em memória, e depois os caminhos de solicitação leem somente esse snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: refs não resolvidas em superfícies habilitadas falham na inicialização/reload, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de auth

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
- `auth-profiles.json` aceita refs em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos estáticos de credenciais.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não aceitam credenciais de perfil de auth com suporte de SecretRef.
- Credenciais estáticas de tempo de execução vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são limpas quando descobertas.
- Importações OAuth legadas de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento de tempo de execução de Secrets e ferramentas `audit/configure/apply`: [Gerenciamento de Secrets](/pt-BR/gateway/secrets).

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

- `billingBackoffHours`: recuo base em horas quando um perfil falha por erros reais de
  cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas do provedor
  permanecem restritas ao provedor ao qual pertencem (por exemplo OpenRouter
  `Key limit exceeded`). Mensagens repetíveis de janela de uso HTTP `402` ou
  limite de gastos de organização/workspace permanecem no caminho `rate_limit`
  em vez disso.
- `billingBackoffHoursByProvider`: sobrescritas opcionais por provedor para horas de recuo de cobrança.
- `billingMaxHours`: limite em horas para o crescimento exponencial do recuo de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: recuo base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para o crescimento do recuo de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de recuo (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de perfil de auth do mesmo provedor para erros de sobrecarga antes de alternar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado como `ModelNotReadyException` entram aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de perfil de auth do mesmo provedor para erros de limite de taxa antes de alternar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto moldado pelo provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Logging

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
- `maxFileBytes`: tamanho máximo do arquivo de log em bytes antes que gravações sejam suprimidas (inteiro positivo; padrão: `524288000` = 500 MB). Use rotação externa de logs para implantações de produção.

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

- `enabled`: chave mestre para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flag que habilita saída de log direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: habilita o pipeline de exportação OpenTelemetry (padrão: `false`).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilita exportação de traces, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `otel.captureContent`: captura opcional de conteúdo bruto para atributos de span do OTEL. Desativado por padrão. O booleano `true` captura conteúdo de mensagem/ferramenta não do sistema; o formato de objeto permite habilitar explicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância de ambiente para hosts que já registraram um SDK OpenTelemetry global. O OpenClaw então ignora a inicialização/finalização do SDK pertencente ao Plugin, mantendo os listeners de diagnóstico ativos.
- `cacheTrace.enabled`: registra snapshots de rastreamento de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para o JSONL de rastreamento de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de rastreamento de cache (todos com padrão: `true`).

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
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máximo: `168`).
- `auto.stableJitterHours`: janela extra de distribuição de implantação do canal estável em horas (padrão: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frequência em que verificações do canal beta são executadas em horas (padrão: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: chave global de recurso do ACP (padrão: `false`).
- `dispatch.enabled`: chave independente para despacho de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id do backend de tempo de execução ACP padrão (deve corresponder a um Plugin de tempo de execução ACP registrado).
- `defaultAgent`: id do agente ACP de fallback quando spawns não especificam um destino explícito.
- `allowedAgents`: allowlist de ids de agente permitidos para sessões de tempo de execução ACP; vazio significa sem restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ocioso em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo de chunk antes de dividir a projeção de bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` acumula até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes de texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de elegíveis para limpeza.
- `runtime.installCommand`: comando opcional de instalação a executar ao inicializar um ambiente de tempo de execução ACP.

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
  - `"random"` (padrão): taglines rotativas engraçadas/sazonais.
  - `"default"`: tagline neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de tagline (o título/versão do banner ainda é exibido).
- Para ocultar o banner inteiro (não apenas as taglines), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

Consulte os campos de identidade de `agents.list` em [Padrões de agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As compilações atuais não incluem mais a bridge TCP. Nodes se conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até serem removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada de bridge (referência histórica)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback obsoleto para jobs armazenados com notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para auth de Webhook de saída
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções Cron isoladas antes de podar de `sessions.json`. Também controla a limpeza de transcrições arquivadas excluídas de Cron. Padrão: `24h`; defina `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da poda. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes mantidas quando a poda do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST do Webhook do Cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de auth é enviado.
- `webhook`: URL de Webhook de fallback legado obsoleto (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: máximo de tentativas para jobs únicos em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de recuo em ms para cada tentativa de repetição (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam repetição — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para repetir em todos os tipos transitórios.

Aplica-se somente a jobs Cron de execução única. Jobs recorrentes usam tratamento de falha separado.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de falha para jobs Cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín: `1`).
- `cooldownMs`: milissegundos mínimos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `mode`: modo de entrega — `"announce"` envia por uma mensagem de canal; `"webhook"` faz POST para o Webhook configurado.
- `accountId`: conta ou id de canal opcional para delimitar a entrega do alerta.

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

- Destino padrão para notificações de falha de Cron em todos os jobs.
- `mode`: `"announce"` ou `"webhook"`; usa `"announce"` como padrão quando existem dados de destino suficientes.
- `channel`: sobrescrita de canal para entrega announce. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito de announce ou URL de Webhook. Obrigatório para modo Webhook.
- `accountId`: sobrescrita opcional de conta para entrega.
- `delivery.failureDestination` por job sobrescreve esse padrão global.
- Quando nem o destino global nem o destino de falha por job estiver definido, jobs que já entregam via `announce` usam como fallback esse destino primário de announce em caso de falha.
- `delivery.failureDestination` só é compatível para jobs `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do job seja `"webhook"`.

Consulte [Jobs Cron](/pt-BR/automation/cron-jobs). Execuções Cron isoladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template do modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida               |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador de destino                          |
| `{{MessageSid}}`   | id da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | pseudo-URL da mídia recebida                      |
| `{{MediaPath}}`    | caminho local da mídia                            |
| `{{MediaType}}`    | tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | transcrição do áudio                              |
| `{{Prompt}}`       | prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | máximo de caracteres resolvido para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | dica do provedor (whatsapp, telegram, discord etc.) |

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

- Arquivo único: substitui o objeto contêiner.
- Array de arquivos: mesclado profundamente em ordem (os posteriores sobrescrevem os anteriores).
- Chaves irmãs: mescladas após os includes (sobrescrevem valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formatos absolutos/`../` são permitidos somente quando ainda se resolvem dentro desse limite.
- Gravações controladas pelo OpenClaw que alteram apenas uma seção de nível superior com suporte de include de arquivo único gravam nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes na raiz, arrays de include e includes com sobrescritas irmãs são somente leitura para gravações controladas pelo OpenClaw; essas gravações falham de forma segura em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de análise e includes circulares.

---

_Relacionado: [Configuration](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuration](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

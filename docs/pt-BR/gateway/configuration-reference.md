---
read_when:
    - Você precisa da semântica exata de configuração no nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-25T13:45:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referência principal de configuração para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuration](/pt-BR/gateway/configuration).

Cobre as principais superfícies de configuração do OpenClaw e faz links quando um subsistema tem sua própria referência mais aprofundada. Catálogos de comandos controlados por canal e plugin e ajustes profundos de memory/QMD ficam em suas próprias páginas, e não nesta.

Fonte da verdade no código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e para a Control UI, com metadados integrados/de plugin/de canal mesclados quando disponíveis
- `config.schema.lookup` retorna um nó do schema com escopo de caminho para ferramentas de drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície atual do schema

Referências aprofundadas dedicadas:

- [Referência de configuração de Memory](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos com barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + incluídos
- páginas do canal/plugin proprietário para superfícies de comando específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando são omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuration — channels](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos (autenticação, controle de acesso, múltiplas contas, controle por menção).

## Padrões do agente, múltiplos agentes, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuration — agents](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, thinking, Heartbeat, memory, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e vinculações com múltiplos agentes)
- `session.*` (ciclo de vida da sessão, Compaction, pruning)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas com suporte de provedor e configuração de provedor / URL base personalizados foram movidas para uma página dedicada — consulte
[Configuration — tools and custom providers](/pt-BR/gateway/config-tools).

## MCP

Definições de servidor MCP gerenciadas pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo Pi incorporado e outros adaptadores de runtime. Os comandos `openclaw mcp list`,
`show`, `set` e `unset` gerenciam esse bloco sem se conectar ao
servidor de destino durante edições de configuração.

```json5
{
  mcp: {
    // Opcional. Padrão: 600000 ms (10 minutos). Defina 0 para desabilitar a remoção por inatividade.
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

- `mcp.servers`: definições nomeadas de servidor MCP stdio ou remoto para runtimes que
  expõem ferramentas MCP configuradas.
- `mcp.sessionIdleTtlMs`: TTL de inatividade para runtimes MCP incluídos com escopo de sessão.
  Execuções incorporadas de uso único solicitam limpeza ao fim da execução; este TTL é o mecanismo de segurança para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas a quente descartando runtimes MCP de sessão em cache.
  A próxima descoberta/uso da ferramenta os recria a partir da nova configuração, então entradas
  removidas de `mcp.servers` são recolhidas imediatamente em vez de esperar o TTL de inatividade.

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
- `load.extraDirs`: raízes extras compartilhadas de Skills (precedência mais baixa).
- `install.preferBrew`: quando `true`, prefere instaladores do Homebrew quando `brew`
  estiver disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desabilita uma Skill mesmo que esteja incluída/instalada.
- `entries.<skillKey>.apiKey`: campo de conveniência para Skills que declaram uma variável de ambiente principal (string em texto simples ou objeto SecretRef).

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

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` e `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw, além de bundles compatíveis do Codex e bundles do Claude, incluindo bundles do Claude sem manifesto com layout padrão.
- **Alterações na configuração exigem reinício do Gateway.**
- `allow`: allowlist opcional (apenas os plugins listados são carregados). `deny` tem prioridade.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API no nível do plugin (quando suportado pelo plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que alteram prompt do legado `before_agent_start`, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks nativos de plugin e diretórios de hooks fornecidos por bundle compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugins confiáveis não incluídos podem ler conteúdo bruto de conversa de hooks tipados como `llm_input`, `llm_output` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições por execução de `provider` e `model` para execuções de subagente em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` apenas quando você realmente quiser permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema do plugin nativo do OpenClaw quando disponível).
- Configurações de conta/runtime de plugins de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do plugin proprietário, não por um registro central de opções do OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da requisição de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do xAI X Search (pesquisa web do Grok).
  - `enabled`: habilita o provedor X Search.
  - `model`: modelo Grok a ser usado para pesquisa (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming de memory. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestra de Dreaming (padrão `false`).
  - `frequency`: cadência Cron para cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - política de fase e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memory está em [Referência de configuração de Memory](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins Claude bundle habilitados também podem contribuir com padrões incorporados do Pi a partir de `settings.json`; o OpenClaw os aplica como configurações de agente sanitizadas, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do plugin de memory ativo, ou `"none"` para desabilitar plugins de memory.
- `plugins.slots.contextEngine`: escolhe o id do plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.
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
      // dangerouslyAllowPrivateNetwork: true, // ative apenas para acesso confiável a rede privada
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
- `tabCleanup` recupera abas rastreadas do agente principal após tempo de inatividade ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desabilitar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado quando não definido, então a navegação do navegador permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` somente quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints de perfil CDP remotos (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente attach (start/stop/reset desabilitados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se conectar
  no host selecionado ou por meio de um browser Node conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil específico
  de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais da rota Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks
  de upload de um arquivo, sem substituições de timeout de diálogo, sem `wait --load networkidle`,
  e sem `responsebody`, exportação em PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` gerenciados localmente atribuem automaticamente `cdpPort` e `cdpUrl`; só
  defina `cdpUrl` explicitamente para CDP remoto.
- Perfis gerenciados localmente podem definir `executablePath` para substituir o
  `browser.executablePath` global para esse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis gerenciados localmente usam `browser.localLaunchTimeoutMs` para descoberta HTTP do Chrome CDP local
  após o início do processo e `browser.localCdpReadyTimeoutMs` para prontidão do websocket CDP
  após a inicialização. Aumente-os em hosts mais lentos onde o Chrome
  inicia com sucesso, mas as verificações de prontidão competem com a inicialização.
- Ordem de detecção automática: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` aceita `~` para o diretório home do seu sistema operacional.
- Serviço de controle: apenas loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao Chromium local (por exemplo,
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

- `seamColor`: cor de destaque para o chrome da UI do aplicativo nativo (tonalidade do balão do modo Talk etc.).
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
      // allowExternalEmbedUrls: false, // perigoso: permitir URLs de embed http(s) externas absolutas
      // allowedOrigins: ["https://control.example.com"], // obrigatório para Control UI fora de loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem por cabeçalho Host
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

- `mode`: `local` (executar Gateway) ou `remote` (conectar a um Gateway remoto). O Gateway se recusa a iniciar, a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind padrão `loopback` escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o Gateway fica inacessível. Use `--network host`, ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: obrigatória por padrão. Binds fora de loopback exigem autenticação do Gateway. Na prática isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Os fluxos de inicialização e instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações confiáveis de loopback local; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um proxy reverso com reconhecimento de identidade e confia nos cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos de loopback no mesmo host não satisfazem a autenticação por trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da Control UI/WebSocket (verificados por `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por cabeçalho do Tailscale; eles seguem o modo normal de autenticação HTTP do Gateway. Esse fluxo sem token pressupõe que o host do Gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional para falhas de autenticação. Aplica-se por IP do cliente e por escopo de autenticação (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da Control UI do Tailscale Serve, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Tentativas ruins concorrentes do mesmo cliente podem, portanto, acionar o limitador na segunda requisição em vez de ambas passarem em disputa como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` usa `true` por padrão; defina `false` quando você quiser intencionalmente que o tráfego de localhost também seja limitado por taxa (para configurações de teste ou implantações estritas com proxy).
- Tentativas de autenticação WS com origem de navegador são sempre limitadas por taxa com a isenção de loopback desabilitada (defesa em profundidade contra força bruta de localhost baseada em navegador).
- Em loopback, esses bloqueios por origem de navegador são isolados por valor `Origin`
  normalizado, de modo que falhas repetidas de uma origem localhost não bloqueiem automaticamente
  outra origem.
- `tailscale.mode`: `serve` (apenas tailnet, bind em loopback) ou `funnel` (público, exige autenticação).
- `controlUi.allowedOrigins`: allowlist explícita de origens de navegador para conexões WebSocket com o Gateway. Obrigatória quando clientes de navegador são esperados a partir de origens fora de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que habilita fallback de origem por cabeçalho Host para implantações que dependem intencionalmente da política de origem baseada em cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição emergencial no ambiente do processo do lado do cliente que permite `ws://` em texto simples para
  IPs confiáveis de rede privada; o padrão continua sendo somente loopback para texto simples. Não existe equivalente em `openclaw.json`, e configurações de rede privada do navegador como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` não afetam clientes WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credencial de cliente remoto. Eles não configuram a autenticação do Gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para o relay APNs externo usado por compilações oficiais/TestFlight do iOS depois que publicam registros com suporte de relay no Gateway. Essa URL deve corresponder à URL do relay compilada na build do iOS.
- `gateway.push.apns.relay.timeoutMs`: tempo limite de envio do Gateway para o relay em milissegundos. O padrão é `10000`.
- Registros com suporte de relay são delegados a uma identidade específica do Gateway. O app iOS emparelhado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao Gateway uma concessão de envio com escopo de registro. Outro Gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por variável de ambiente para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch apenas para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de saúde do canal em minutos. Defina `0` para desabilitar globalmente reinicializações do monitor de saúde. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de soquete obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações do monitor de saúde por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de saúde, mantendo o monitor global habilitado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamada do Gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado por SecretRef e não resolvido, a resolução falha de forma fail-closed (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas de loopback ainda são válidas para configurações no mesmo host com detecção local/proxy (por exemplo Tailscale Serve ou um proxy reverso local), mas elas **não** tornam requisições de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o Gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist opcional de CIDR/IP para aprovar automaticamente o primeiro emparelhamento de dispositivo de Node sem escopos solicitados. Fica desabilitado quando não definido. Isso não aprova automaticamente emparelhamento de operator/browser/Control UI/WebChat, nem aprova automaticamente atualizações de função, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelagem global de allow/deny para comandos de Node declarados após emparelhamento e avaliação de allowlist.
- `gateway.tools.deny`: nomes extras de ferramenta bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de bloqueio).
- `gateway.tools.allow`: remove nomes de ferramenta da lista padrão de bloqueio HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desabilitado por padrão. Habilite com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada por URL em Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desabilitar a busca por URL.
- Cabeçalho opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários Gateways em um host com portas e diretórios de estado únicos:

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

- `enabled`: habilita terminação TLS no listener do Gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; apenas para uso local/desenvolvimento.
- `certPath`: caminho no sistema de arquivos para o arquivo do certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo da chave privada TLS; mantenha-o com permissões restritas.
- `caPath`: caminho opcional para bundle de CA para verificação de cliente ou cadeias de confiança personalizadas.

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

- `mode`: controla como as edições de configuração são aplicadas em runtime.
  - `"off"`: ignora edições ao vivo; alterações exigem um reinício explícito.
  - `"restart"`: sempre reinicia o processo do Gateway quando a configuração muda.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; recorre a reinício se necessário.
- `debounceMs`: janela de debounce em ms antes que alterações de configuração sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para esperar operações em andamento antes de forçar um reinício. Omita-o ou defina `0` para esperar indefinidamente e registrar avisos periódicos de pendência.

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
Tokens de hook na query string são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapeamento ou preset usar um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapeamento não exigem esse opt-in.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição só é aceito quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido por `hooks.mappings`
  - Valores `sessionKey` de mapeamento renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem a partir do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessia de diretórios são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos usam o padrão como fallback.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente via hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves `sessionKey` de mapeamento orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapeamento), por exemplo `["hook:"]`. Ela se torna obrigatória quando qualquer mapeamento ou preset usa um `sessionKey` com template.
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

## Host do canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // ou OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editáveis pelo agente e A2UI por HTTP sob a porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Apenas local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds fora de loopback: rotas de canvas exigem autenticação do Gateway (token/senha/trusted-proxy), assim como outras superfícies HTTP do Gateway.
- WebViews de Node normalmente não enviam cabeçalhos de autenticação; depois que um Node é emparelhado e conectado, o Gateway anuncia URLs de capacidade com escopo de Node para acesso a canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do Node e expiram rapidamente. Não é usado fallback baseado em IP.
- Injeta cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando está vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinício do Gateway.
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

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`.
- O hostname usa `openclaw` por padrão. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona unicast DNS-SD em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + DNS dividido do Tailscale.

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

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro ao carregar a configuração.
- Escape com `$${VAR}` para um literal `${VAR}`.
- Funciona com `$include`.

---

## Segredos

Referências de segredo são aditivas: valores em texto simples continuam funcionando.

### `SecretRef`

Use um único formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho `.` ou `..` separados por barra (por exemplo `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos compatíveis de credenciais em `openclaw.json`.
- Referências em `auth-profiles.json` são incluídas na resolução em runtime e na cobertura de auditoria.

### Configuração de provedores de segredo

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

- O provedor `file` oferece suporte a `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de provedores file e exec falham de forma fail-closed quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` apenas para caminhos confiáveis que não possam ser verificados.
- O provedor `exec` exige um caminho absoluto em `command` e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando por symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos com symlink enquanto valida o caminho real resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho real resolvido.
- O ambiente do processo filho de `exec` é mínimo por padrão; passe explicitamente as variáveis necessárias com `passEnv`.
- Referências de segredo são resolvidas no momento da ativação em um snapshot em memória, e então os caminhos de requisição leem apenas esse snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: referências não resolvidas em superfícies habilitadas falham na inicialização/reload, enquanto superfícies inativas são ignoradas com diagnóstico.

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
- `auth-profiles.json` oferece suporte a referências no nível do valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos estáticos de credencial.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação com suporte de SecretRef.
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
  cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas do provedor
  permanecem restritas ao provedor que as possui (por exemplo OpenRouter
  `Key limit exceeded`). Mensagens de janela de uso retryable HTTP `402` ou
  de limite de gasto de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de backoff de cobrança.
- `billingMaxHours`: limite máximo em horas para o crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite máximo em minutos para o crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: número máximo de rotações de perfil de autenticação do mesmo provedor para erros de sobrecarga antes de trocar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado como `ModelNotReadyException` caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: número máximo de rotações de perfil de autenticação do mesmo provedor para erros de limite de taxa antes de trocar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto moldado pelo provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` sobe para `debug` com `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log em bytes antes que as gravações sejam suprimidas (inteiro positivo; padrão: `524288000` = 500 MB). Use rotação de logs externa para implantações de produção.

---

## Diagnóstico

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

- `enabled`: chave mestra para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flag que habilitam saída de log segmentada (oferece suporte a curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: habilita o pipeline de exportação OpenTelemetry (padrão: `false`).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com requisições de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitam exportação de trace, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `otel.captureContent`: captura opcional de conteúdo bruto para atributos de span do OTEL. Desativada por padrão. O booleano `true` captura conteúdo não sistêmico de mensagens/ferramentas; a forma de objeto permite habilitar explicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1`: alternância por variável de ambiente para hosts que já registraram um SDK global do OpenTelemetry. O OpenClaw então pula a inicialização/finalização do SDK controlado por plugin, mantendo ativos os listeners de diagnóstico.
- `cacheTrace.enabled`: registra snapshots de rastreamento de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de rastreamento de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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

- `channel`: canal de release para instalações npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o Gateway inicia (padrão: `true`).
- `auto.enabled`: habilita atualização automática em segundo plano para instalações por pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal stable (padrão: `6`; máximo: `168`).
- `auto.stableJitterHours`: janela extra de distribuição da implantação do canal stable em horas (padrão: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frequência, em horas, das verificações do canal beta (padrão: `1`; máximo: `24`).

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

- `enabled`: chave global do recurso ACP (padrão: `false`).
- `dispatch.enabled`: chave independente para despacho de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um plugin de runtime ACP registrado).
- `defaultAgent`: id do agente ACP de fallback quando inicializações não especificam um alvo explícito.
- `allowedAgents`: allowlist de ids de agentes permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush por inatividade em ms para texto em streaming.
- `stream.maxChunkChars`: tamanho máximo de bloco antes de dividir a projeção do bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` faz buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL de inatividade em minutos para workers de sessão ACP antes de se tornarem elegíveis para limpeza.
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

- `cli.banner.taglineMode` controla o estilo do slogan do banner:
  - `"random"` (padrão): slogans rotativos engraçados/sazonais.
  - `"default"`: slogan neutro fixo (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de slogan (o título/versão do banner ainda é mostrado).
- Para ocultar o banner inteiro (não apenas os slogans), defina a variável de ambiente `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente

Metadados gravados pelos fluxos guiados de configuração da CLI (`onboard`, `configure`, `doctor`):

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

Consulte os campos de identidade de `agents.list` em [Padrões do agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As builds atuais não incluem mais o TCP bridge. Nodes se conectam pelo Gateway WebSocket. Chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback legado obsoleto para jobs armazenados com notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticação de saída do Webhook
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execução isolada de Cron antes da remoção de `sessions.json`. Também controla a limpeza de transcrições arquivadas de Cron excluídas. Padrão: `24h`; defina `false` para desabilitar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da poda. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes retidas quando a poda do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST por Webhook do Cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook legada obsoleta (http/https) usada apenas para jobs armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: máximo de tentativas de repetição para jobs de execução única em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa de repetição (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam repetição — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para repetir em todos os tipos transitórios.

Aplica-se apenas a jobs Cron de execução única. Jobs recorrentes usam tratamento de falha separado.

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
- `after`: falhas consecutivas antes que um alerta seja disparado (inteiro positivo, mín: `1`).
- `cooldownMs`: milissegundos mínimos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `mode`: modo de entrega — `"announce"` envia por mensagem de canal; `"webhook"` faz POST para o Webhook configurado.
- `accountId`: id opcional de conta ou canal para delimitar a entrega do alerta.

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
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega por announce. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: alvo explícito de announce ou URL do Webhook. Obrigatório para modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por job substitui esse padrão global.
- Quando nem o destino global nem o por job está definido, jobs que já entregam via `announce` usam como fallback esse alvo principal de announce em caso de falha.
- `delivery.failureDestination` só é compatível para jobs com `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do job seja `"webhook"`.

Consulte [Jobs de Cron](/pt-BR/automation/cron-jobs). Execuções isoladas de Cron são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template de modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                       |
| ------------------ | ----------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem de entrada           |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas            |
| `{{From}}`         | Identificador do remetente                      |
| `{{To}}`           | Identificador de destino                        |
| `{{MessageSid}}`   | ID da mensagem do canal                         |
| `{{SessionId}}`    | UUID da sessão atual                            |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada        |
| `{{MediaUrl}}`     | Pseudo-URL de mídia de entrada                  |
| `{{MediaPath}}`    | Caminho local da mídia                          |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)        |
| `{{Transcript}}`   | Transcrição de áudio                            |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas de CLI  |
| `{{MaxChars}}`     | Máximo de caracteres de saída resolvido para entradas de CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                         |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)               |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)    |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)  |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço) |
| `{{Provider}}`     | Dica do provedor (whatsapp, telegram, discord etc.) |

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
- Chaves irmãs: mescladas após os includes (substituem os valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda são resolvidas dentro desse limite.
- Gravações controladas pelo OpenClaw que alteram apenas uma seção de nível superior apoiada por um include de arquivo único gravam diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes na raiz, arrays de include e includes com substituições por chaves irmãs são somente leitura para gravações controladas pelo OpenClaw; essas gravações falham de forma fail-closed em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de parsing e includes circulares.

---

_Relacionado: [Configuration](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuration](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

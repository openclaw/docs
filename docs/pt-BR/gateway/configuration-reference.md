---
read_when:
    - Você precisa da semântica exata no nível de campo ou dos valores padrão de configuração
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-26T11:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referência principal de configuração para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, veja [Configuração](/pt-BR/gateway/configuration).

Abrange as principais superfícies de configuração do OpenClaw e fornece links externos quando um subsistema tem sua própria referência mais aprofundada. Catálogos de comandos específicos de canal e Plugin, além de ajustes profundos de memória/QMD, ficam em suas próprias páginas em vez desta.

Fonte da verdade no código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e Control UI, com metadados de bundle/Plugin/canal mesclados quando disponíveis
- `config.schema.lookup` retorna um nó de schema com escopo de caminho para ferramentas de drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície atual do schema

Caminho de consulta do agente: use a ação da ferramenta `gateway` `config.schema.lookup` para
documentação e restrições exatas no nível de campo antes de editar. Use
[Configuração](/pt-BR/gateway/configuration) para orientação orientada a tarefas e esta página
para o mapa mais amplo de campos, padrões e links para referências de subsistemas.

Referências dedicadas e detalhadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos slash](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + incluídos no pacote
- páginas do canal/Plugin responsável para superfícies de comando específicas do canal/Plugin

O formato da config é **JSON5** (comentários + vírgulas finais permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — veja
[Configuração — canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos no pacote (autenticação, controle de acesso, várias contas, controle por menção).

## Padrões de agente, vários agentes, sessões e mensagens

Movido para uma página dedicada — veja
[Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, thinking, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e bindings de vários agentes)
- `session.*` (ciclo de vida da sessão, Compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização de markdown)
- `talk.*` (modo Talk)
  - `talk.speechLocale`: id de locale BCP 47 opcional para reconhecimento de fala do Talk no iOS/macOS
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela padrão de pausa da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)

## Ferramentas e providers personalizados

Política de ferramentas, toggles experimentais, configuração de ferramentas com
providers e configuração de providers personalizados / URL base foram movidas para uma página dedicada — veja
[Configuração — ferramentas e providers personalizados](/pt-BR/gateway/config-tools).

## MCP

Definições de servidor MCP gerenciadas pelo OpenClaw ficam em `mcp.servers` e são
consumidas pelo Pi incorporado e outros adaptadores de runtime. Os comandos `openclaw mcp list`,
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

- `mcp.servers`: definições nomeadas de servidores MCP stdio ou remotos para runtimes que
  expõem ferramentas MCP configuradas.
- `mcp.sessionIdleTtlMs`: TTL de inatividade para runtimes MCP incluídos no pacote com escopo de sessão.
  Execuções incorporadas de uso único solicitam limpeza ao fim da execução; esse TTL é o respaldo para
  sessões de longa duração e futuros chamadores.
- Alterações em `mcp.*` são aplicadas dinamicamente ao descartar runtimes MCP em cache da sessão.
  A próxima descoberta/uso de ferramenta os recria a partir da nova config, então entradas removidas de
  `mcp.servers` são coletadas imediatamente em vez de esperar o TTL de inatividade.

Veja [MCP](/pt-BR/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backends da CLI](/pt-BR/gateway/cli-backends#bundle-mcp-overlays) para o comportamento em runtime.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills incluídos no pacote (Skills gerenciados/do workspace não são afetados).
- `load.extraDirs`: raízes extras compartilhadas de Skills (menor precedência).
- `install.preferBrew`: quando `true`, prefere instaladores Homebrew quando `brew` está
  disponível antes de fazer fallback para outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desativa um Skill mesmo se estiver incluído no pacote/instalado.
- `entries.<skillKey>.apiKey`: campo de conveniência de chave de API para Skills que declaram uma variável env principal (string plaintext ou objeto SecretRef).

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

- Carregado de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` e `plugins.load.paths`.
- A descoberta aceita plugins OpenClaw nativos mais bundles compatíveis de Codex e Claude, incluindo bundles Claude sem manifesto no layout padrão.
- **Alterações de config exigem reinicialização do Gateway.**
- `allow`: allowlist opcional (somente Plugins listados são carregados). `deny` tem prioridade.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API no nível do Plugin (quando compatível com o Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos que mutam prompt do legado `before_agent_start`, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks de Plugin nativos e diretórios de hook fornecidos por bundle compatíveis.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugins confiáveis não incluídos no pacote podem ler conteúdo bruto de conversa de hooks tipados como `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições por execução de `provider` e `model` para execuções em segundo plano de subagente.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de alvos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` somente quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de config definido pelo Plugin (validado pelo schema do Plugin OpenClaw nativo quando disponível).
- Configurações de conta/runtime de Plugin de canal ficam em `channels.<id>` e devem ser descritas pelos metadados `channelConfigs` do manifesto do Plugin responsável, não por um registro central de opções do OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configurações do provider de busca web Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Faz fallback para `plugins.entries.firecrawl.config.webSearch.apiKey`, legado `tools.web.fetch.firecrawl.apiKey` ou variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrair apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da solicitação de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do X Search do xAI (busca web do Grok).
  - `enabled`: ativa o provider X Search.
  - `model`: modelo Grok a usar na busca (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de dreaming da memória. Veja [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestre de dreaming (padrão `false`).
  - `frequency`: cadência Cron para cada varredura completa de dreaming (padrão `"0 3 * * *"`).
  - política de fase e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins Claude bundle ativados também podem contribuir com padrões embutidos de Pi a partir de `settings.json`; o OpenClaw os aplica como configurações sanitizadas de agente, não como patches brutos de config do OpenClaw.
- `plugins.slots.memory`: escolhe o id do Plugin de memória ativo, ou `"none"` para desativar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do Plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.

Veja [Plugins](/pt-BR/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ative explicitamente apenas para acesso confiável de rede privada
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
- `tabCleanup` recupera abas primárias rastreadas do agente após tempo ocioso ou quando uma
  sessão excede seu limite. Defina `idleMinutes: 0` ou `maxTabsPerSession: 0` para
  desativar esses modos individuais de limpeza.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, então a navegação do Browser permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` apenas quando você confiar intencionalmente na navegação de Browser em rede privada.
- No modo estrito, endpoints de perfil CDP remoto (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente de conexão (start/stop/reset desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provider fornecer uma URL WebSocket direta do DevTools.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` se aplicam a alcance CDP remoto e
  `attachOnly`, além de solicitações de abertura de aba. Perfis gerenciados de loopback
  mantêm padrões locais de CDP.
- Se um serviço CDP gerenciado externamente estiver acessível por loopback, defina
  `attachOnly: true` nesse perfil; caso contrário, o OpenClaw trata a porta de
  loopback como um perfil de Browser local gerenciado e pode relatar erros de propriedade de porta local.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se conectar no
  host selecionado ou por meio de um node de Browser conectado.
- Perfis `existing-session` podem definir `userDataDir` para apontar para um
  perfil específico de Browser baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas por snapshot/ref em vez de direcionamento por seletor CSS, hooks
  de upload de um único arquivo, sem substituições de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação PDF, interceptação de download
  ou ações em lote.
- Perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Perfis locais gerenciados podem definir `executablePath` para substituir o valor global
  `browser.executablePath` nesse perfil. Use isso para executar um perfil no
  Chrome e outro no Brave.
- Perfis locais gerenciados usam `browser.localLaunchTimeoutMs` para descoberta
  HTTP do Chrome CDP após o início do processo e `browser.localCdpReadyTimeoutMs` para
  prontidão do websocket CDP após a inicialização. Aumente-os em hosts mais lentos
  em que o Chrome inicia com sucesso, mas as verificações de prontidão competem com a inicialização.
  Ambos os valores devem ser inteiros positivos de até `120000` ms; valores de config inválidos são rejeitados.
- Ordem de detecção automática: Browser padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` ambos
  aceitam `~` e `~/...` para o diretório home do seu sistema operacional antes do início do Chromium.
  `userDataDir` por perfil em perfis `existing-session` também expande til.
- Serviço de controle: apenas loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização à execução local do Chromium (por exemplo
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

- `seamColor`: cor de destaque para o chrome da UI do app nativo (matiz da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da Control UI. Faz fallback para a identidade do agente ativo.

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; veja /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // perigoso: permitir URLs absolutas externas http(s) de incorporação
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
        // Opcional. Padrão não definido/desativado.
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

- `mode`: `local` (executa o Gateway) ou `remote` (conecta a um Gateway remoto). O Gateway se recusa a iniciar, a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o Gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: obrigatória por padrão. Binds fora de loopback exigem autenticação do Gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. A inicialização e os fluxos de instalação/reparo do serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um proxy reverso com reconhecimento de identidade e confia em cabeçalhos de identidade vindos de `gateway.trustedProxies` (veja [Autenticação de Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos em loopback no mesmo host não satisfazem a autenticação trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da Control UI/WebSocket (verificados via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por cabeçalho do Tailscale; eles seguem o modo normal de autenticação HTTP do Gateway. Esse fluxo sem token pressupõe que o host do Gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP do cliente e por escopo de autenticação (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono do Tailscale Serve da Control UI, tentativas com falha para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Portanto, tentativas ruins simultâneas do mesmo cliente podem acionar o limitador na segunda requisição em vez de ambas passarem em corrida como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem padrão `true`; defina como `false` quando quiser intencionalmente que o tráfego localhost também seja limitado (para configurações de teste ou implantações estritas com proxy).
- Tentativas de autenticação WS originadas do navegador são sempre limitadas com a isenção de loopback desativada (defesa em profundidade contra força bruta de localhost baseada em navegador).
- Em loopback, esses bloqueios de origem do navegador são isolados por valor `Origin`
  normalizado, então falhas repetidas de uma origem localhost não bloqueiam
  automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (apenas tailnet, bind loopback) ou `funnel` (público, requer autenticação).
- `controlUi.allowedOrigins`: allowlist explícita de origem do navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados a partir de origens fora de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que ativa fallback de origem por cabeçalho Host para implantações que dependem intencionalmente de política de origem por cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição emergencial por ambiente de processo do lado do cliente
  que permite `ws://` em texto simples para IPs confiáveis de rede privada;
  o padrão continua sendo texto simples apenas para loopback. Não há equivalente em `openclaw.json`,
  e configuração de rede privada do Browser, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afeta clientes
  WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credencial do cliente remoto. Eles não configuram a autenticação do Gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para o relay APNs externo usado por builds oficiais/TestFlight do iOS após publicarem registros suportados por relay no Gateway. Essa URL deve corresponder à URL do relay compilada na build do iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio Gateway-para-relay em milissegundos. O padrão é `10000`.
- Registros suportados por relay são delegados a uma identidade específica do Gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha uma concessão de envio com escopo de registro para o Gateway. Outro Gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias via env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch apenas para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de saúde de canal em minutos. Defina `0` para desativar globalmente reinicializações do monitor de saúde. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações do monitor de saúde por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de saúde, mantendo o monitor global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com várias contas. Quando definido, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamada do Gateway local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado por SecretRef e não resolvido, a resolução falha de forma fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas de loopback continuam válidas para configurações de proxy no mesmo host/detecção local (por exemplo Tailscale Serve ou um proxy reverso local), mas **não** tornam solicitações em loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o Gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist opcional de CIDR/IP para aprovar automaticamente o pareamento inicial de dispositivos node sem escopos solicitados. Fica desativado quando não definido. Isso não aprova automaticamente pareamento de operator/browser/Control UI/WebChat, nem aprova automaticamente upgrades de role, escopo, metadados ou chave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: definição global de allow/deny para comandos declarados de node após avaliação de pareamento e allowlist.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de negação).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de negação HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desativado por padrão. Ative com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Hardening de entrada de URL em Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de hardening de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; veja [Autenticação de Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de várias instâncias

Execute vários Gateways em um host com portas e diretórios de estado exclusivos:

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

- `enabled`: ativa terminação TLS no listener do Gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; apenas para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
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

- `mode`: controla como edições de config são aplicadas em runtime.
  - `"off"`: ignora edições ao vivo; alterações exigem reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do Gateway quando a config muda.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; faz fallback para reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes que mudanças de config sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo opcional em ms para aguardar operações em andamento antes de forçar uma reinicialização. Omita ou defina `0` para aguardar indefinidamente e registrar avisos periódicos de ainda pendente.

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
Tokens de hook em query string são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapeamento ou preset usar `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapeamento não exigem essa ativação explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição é aceito apenas quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido por `hooks.mappings`
  - Valores de `sessionKey` renderizados por template em mappings são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapping">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanece dentro de `hooks.transformsDir` (caminhos absolutos e travessia de diretório são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos fazem fallback para o padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente por hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapping orientadas por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapping), por exemplo `["hook:"]`. Torna-se obrigatória quando qualquer mapping ou preset usa `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` tem padrão `last`.
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

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.
- Não execute um `gog gmail watch serve` separado junto com o Gateway.

---

## Host Canvas

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
- Binds fora de loopback: rotas Canvas exigem autenticação do Gateway (token/senha/trusted-proxy), igual às outras superfícies HTTP do Gateway.
- WebViews de node normalmente não enviam cabeçalhos de autenticação; depois que um node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de node para acesso Canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando está vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do Gateway.
- Desative live reload para diretórios grandes ou erros `EMFILE`.

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
- O hostname tem padrão `openclaw`. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

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

- Variáveis de ambiente inline só são aplicadas se a env do processo não tiver a chave.
- Arquivos `.env`: `.env` do CWD + `~/.openclaw/.env` (nenhum substitui variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Veja [Ambiente](/pt-BR/help/environment) para a precedência completa.

### Substituição de variáveis de ambiente

Referencie variáveis de ambiente em qualquer string de config com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro no carregamento da config.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

Refs de segredo são aditivos: valores plaintext continuam funcionando.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id para `source: "file"`: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho `.` ou `..` separados por barra (por exemplo `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais de SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos de credenciais compatíveis em `openclaw.json`.
- Refs em `auth-profiles.json` são incluídos na resolução em runtime e na cobertura de auditoria.

### Config de providers de segredos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider env explícito opcional
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

- O provider `file` é compatível com `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de providers `file` e `exec` falham de forma fechada quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` apenas para caminhos confiáveis que não possam ser verificados.
- O provider `exec` exige um caminho `command` absoluto e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando symlink são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos symlink enquanto valida o caminho do destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho do destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe variáveis necessárias explicitamente com `passEnv`.
- Refs de segredo são resolvidos no momento da ativação em um snapshot em memória, e então os caminhos de requisição leem apenas o snapshot.
- A filtragem de superfícies ativas se aplica durante a ativação: refs não resolvidos em superfícies ativadas falham na inicialização/reload, enquanto superfícies inativas são ignoradas com diagnósticos.

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
- `auth-profiles.json` oferece suporte a refs em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credencial estática.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de autenticação baseadas em SecretRef.
- Credenciais estáticas de runtime vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são removidas quando descobertas.
- Importações legadas de OAuth de `~/.openclaw/credentials/oauth.json`.
- Veja [OAuth](/pt-BR/concepts/oauth).
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

- `billingBackoffHours`: recuo base em horas quando um perfil falha devido a erros reais de faturamento/crédito insuficiente (padrão: `5`). Texto explícito de faturamento ainda pode cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas do provider continuam limitadas ao provider a que pertencem (por exemplo OpenRouter `Key limit exceeded`). Mensagens repetíveis de janela de uso HTTP `402` ou limite de gasto de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provider para horas de recuo de faturamento.
- `billingMaxHours`: limite máximo em horas para crescimento exponencial do recuo de faturamento (padrão: `24`).
- `authPermanentBackoffMinutes`: recuo base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite máximo em minutos para crescimento do recuo `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de recuo (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de perfil de autenticação no mesmo provider para erros de sobrecarga antes de trocar para fallback de modelo (padrão: `1`). Formas de provider ocupado, como `ModelNotReadyException`, caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provider/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de perfil de autenticação no mesmo provider para erros de limite de taxa antes de trocar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto moldado pelo provider, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `maxFileBytes`: tamanho máximo do arquivo de log ativo em bytes antes da rotação (inteiro positivo; padrão: `104857600` = 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo.

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

- `enabled`: toggle mestre para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flag que ativam saída de log direcionada (oferece suporte a curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: ativa o pipeline de exportação do OpenTelemetry (padrão: `false`). Para a configuração completa, catálogo de sinais e modelo de privacidade, veja [exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoints OTLP opcionais específicos por sinal. Quando definidos, substituem `otel.endpoint` apenas para esse sinal.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com solicitações de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: ativam exportação de traces, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico em ms para flush de telemetria.
- `otel.captureContent`: captura opcional explícita de conteúdo bruto para atributos de span OTEL. Desativada por padrão. O booleano `true` captura conteúdo de mensagens/ferramentas não sistêmico; o formato de objeto permite ativar explicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: toggle de ambiente para os atributos mais recentes experimentais de provider de span GenAI. Por padrão, os spans mantêm o atributo legado `gen_ai.system` por compatibilidade; métricas GenAI usam atributos semânticos limitados.
- `OPENCLAW_OTEL_PRELOADED=1`: toggle de ambiente para hosts que já registraram um SDK global do OpenTelemetry. O OpenClaw então ignora inicialização/finalização de SDK de propriedade de Plugin enquanto mantém listeners de diagnóstico ativos.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variáveis de ambiente de endpoint específicas por sinal usadas quando a chave de config correspondente não está definida.
- `cacheTrace.enabled`: registra snapshots de trace de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de trace de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída do trace de cache (todos com padrão `true`).

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
- `checkOnStart`: verifica atualizações npm quando o Gateway inicia (padrão: `true`).
- `auto.enabled`: ativa atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máx.: `168`).
- `auto.stableJitterHours`: janela extra em horas para espalhamento de rollout no canal estável (padrão: `12`; máx.: `168`).
- `auto.betaCheckIntervalHours`: com que frequência as verificações do canal beta são executadas em horas (padrão: `1`; máx.: `24`).

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

- `enabled`: gate global do recurso ACP (padrão: `true`; defina `false` para ocultar affordances de dispatch e spawn do ACP).
- `dispatch.enabled`: gate independente para dispatch de turno de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão de backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
  Se `plugins.allow` estiver definido, inclua o id do Plugin de backend (por exemplo `acpx`) ou o Plugin padrão incluído no pacote não será carregado.
- `defaultAgent`: id do agente ACP de fallback quando spawns não especificam um alvo explícito.
- `allowedAgents`: allowlist de ids de agente permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ocioso em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo do fragmento antes de dividir a projeção do bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` faz buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes de texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tag para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de estarem elegíveis para limpeza.
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
  - `"random"` (padrão): taglines rotativas engraçadas/sazonais.
  - `"default"`: tagline neutra fixa (`All your chats, one OpenClaw.`).
  - `"off"`: sem texto de tagline (título/versão do banner ainda são exibidos).
- Para ocultar o banner inteiro (não apenas as taglines), defina a env `OPENCLAW_HIDE_BANNER=1`.

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

Veja os campos de identidade em `agents.list` em [Padrões de agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As builds atuais não incluem mais a bridge TCP. Nodes se conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do schema de config (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Config legada de bridge (referência histórica)">

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
    webhook: "https://example.invalid/legacy", // fallback obsoleto para trabalhos armazenados notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticação outbound do Webhook
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções Cron isoladas antes da poda de `sessions.json`. Também controla a limpeza de transcrições Cron excluídas arquivadas. Padrão: `24h`; defina `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da poda. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes retidas quando a poda do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook do Cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook legada obsoleta de fallback (http/https) usada apenas para trabalhos armazenados que ainda têm `notify: true`.

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

- `maxAttempts`: máximo de repetições para trabalhos de execução única em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de recuo em ms para cada tentativa de repetição (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam repetições — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para repetir em todos os tipos transitórios.

Aplica-se apenas a trabalhos Cron de execução única. Trabalhos recorrentes usam um tratamento de falha separado.

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

- `enabled`: ativa alertas de falha para trabalhos Cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín.: `1`).
- `cooldownMs`: mínimo de milissegundos entre alertas repetidos para o mesmo trabalho (inteiro não negativo).
- `mode`: modo de entrega — `"announce"` envia por mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: id opcional de conta ou canal para definir o escopo da entrega do alerta.

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

- Destino padrão para notificações de falha do Cron em todos os trabalhos.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando há dados de destino suficientes.
- `channel`: substituição de canal para entrega de anúncio. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: alvo explícito de anúncio ou URL de Webhook. Obrigatório para modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por trabalho substitui esse padrão global.
- Quando nem o destino global nem o por trabalho estão definidos, trabalhos que já entregam via `announce` fazem fallback para esse alvo principal de anúncio em caso de falha.
- `delivery.failureDestination` só é compatível com trabalhos `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do trabalho seja `"webhook"`.

Veja [Trabalhos Cron](/pt-BR/automation/cron-jobs). Execuções Cron isoladas são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template de modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem recebida               |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador do destino                          |
| `{{MessageSid}}`   | Id da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                      |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | Transcrição de áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas CLI       |
| `{{MaxChars}}`     | Máximo de caracteres de saída resolvido para entradas CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (best effort)                    |
| `{{GroupMembers}}` | Prévia dos membros do grupo (best effort)         |
| `{{SenderName}}`   | Nome de exibição do remetente (best effort)       |
| `{{SenderE164}}`   | Número de telefone do remetente (best effort)     |
| `{{Provider}}`     | Dica de provider (whatsapp, telegram, discord, etc.) |

---

## Includes de config (`$include`)

Divida a config em vários arquivos:

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
- Chaves irmãs: mescladas após os includes (substituem valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de config de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` só são permitidas quando ainda resolvem dentro desse limite.
- Gravações de propriedade do OpenClaw que mudam apenas uma seção de nível superior respaldada por um include de arquivo único escrevem diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes de raiz, arrays de include e includes com substituições por chaves irmãs são somente leitura para gravações de propriedade do OpenClaw; essas gravações falham de forma fechada em vez de achatar a config.
- Erros: mensagens claras para arquivos ausentes, erros de parsing e includes circulares.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

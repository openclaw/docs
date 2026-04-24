---
read_when:
    - Você precisa da semântica exata em nível de campo ou dos valores padrão de configuração
    - Você está validando blocos de configuração de canal, modelo, gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-24T05:50:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dc3b920ada38951086908713e9347141d8b11faa007df23a90a2532ac6f3bb2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referência principal de configuração para `~/.openclaw/openclaw.json`. Para uma visão orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Esta página cobre as principais superfícies de configuração do OpenClaw e aponta links quando um subsistema tem sua própria referência mais aprofundada. Ela **não** tenta incorporar em uma única página todos os catálogos de comandos de canais/plugins nem todos os ajustes profundos de memória/QMD.

Fonte de verdade no código:

- `openclaw config schema` imprime o JSON Schema ativo usado para validação e para a interface do Control, com metadados de bundles/plugins/canais mesclados quando disponíveis
- `config.schema.lookup` retorna um nó do schema com escopo de caminho para ferramentas de drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash da baseline da documentação de configuração em relação à superfície atual do schema

Referências aprofundadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + empacotados
- páginas do canal/plugin proprietário para superfícies de comandos específicas do canal

O formato de configuração é **JSON5** (comentários + vírgulas finais são permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando são omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuração — canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais empacotados (autenticação, controle de acesso, múltiplas contas, bloqueio por menção).

## Padrões de agente, múltiplos agentes, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, raciocínio, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e vinculações de múltiplos agentes)
- `session.*` (ciclo de vida da sessão, Compaction, pruning)
- `messages.*` (entrega de mensagens, TTS, renderização Markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)

## Ferramentas e providers personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas com suporte de provider e configuração
de provider / URL base personalizados foram movidas para uma página dedicada — consulte
[Configuração — ferramentas e providers personalizados](/pt-BR/gateway/config-tools).

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

- `allowBundled`: allowlist opcional apenas para Skills empacotadas (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: raízes extras de Skills compartilhadas (menor precedência).
- `install.preferBrew`: quando true, prefere instaladores Homebrew quando `brew` estiver
  disponível antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desativa uma Skill mesmo que ela esteja empacotada/instalada.
- `entries.<skillKey>.apiKey`: campo de conveniência para Skills que declaram uma variável env principal (string em texto simples ou objeto SecretRef).

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

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, mais `plugins.load.paths`.
- A descoberta aceita plugins nativos do OpenClaw mais bundles compatíveis do Codex e bundles do Claude, incluindo bundles do Claude sem manifesto no layout padrão.
- **Mudanças de configuração exigem reinicialização do gateway.**
- `allow`: allowlist opcional (apenas os plugins listados são carregados). `deny` prevalece.
- `plugins.entries.<id>.apiKey`: campo de conveniência de chave de API no nível do plugin (quando compatível com o plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o core bloqueia `before_prompt_build` e ignora campos que alteram prompt de `before_agent_start` legado, preservando `modelOverride` e `providerOverride` legados. Aplica-se a hooks nativos de plugin e a diretórios de hook fornecidos por bundle compatíveis.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste plugin para solicitar substituições por execução de `provider` e `model` para execuções em segundo plano de subagentes.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de destinos canônicos `provider/model` para substituições confiáveis de subagentes. Use `"*"` apenas quando quiser intencionalmente permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo plugin (validado pelo schema nativo do plugin OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provider de busca web Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legado ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API do Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: timeout da solicitação de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do X Search da xAI (pesquisa web do Grok).
  - `enabled`: ativa o provider X Search.
  - `model`: modelo Grok a usar para pesquisa (por exemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: alternância mestre de Dreaming (padrão `false`).
  - `frequency`: cadência Cron para cada varredura completa de Dreaming (`"0 3 * * *"` por padrão).
  - política de fases e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória fica em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de bundle Claude ativados também podem contribuir com padrões Pi embutidos de `settings.json`; o OpenClaw os aplica como configurações saneadas do agente, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do plugin de memória ativo, ou `"none"` para desativar plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do plugin de mecanismo de contexto ativo; o padrão é `"legacy"`, a menos que você instale e selecione outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI a edições manuais.

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
      // dangerouslyAllowPrivateNetwork: true, // ative apenas para acesso confiável em rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, então a navegação do navegador permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` apenas quando confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente attach (start/stop/reset desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provider fornecer uma URL WebSocket DevTools direta.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se conectar
  no host selecionado ou por um browser node conectado.
- Perfis `existing-session` podem definir `userDataDir` para apontar para um perfil
  específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações orientadas a snapshot/ref em vez de seleção por CSS, hooks de upload de um arquivo,
  sem substituições de timeout de diálogo, sem `wait --load networkidle`, e sem
  `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis locais gerenciados `openclaw` atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Ordem de detecção automática: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: somente loopback (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização ao Chromium local (por exemplo
  `--disable-gpu`, tamanho de janela ou flags de depuração).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto curto, URL de imagem ou data URI
    },
  },
}
```

- `seamColor`: cor de destaque para a interface nativa do app (matiz da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da interface do Control. Usa como fallback a identidade do agente ativo.

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
      // allowExternalEmbedUrls: false, // perigoso: permitir URLs absolutas externas http(s) de embed
      // allowedOrigins: ["https://control.example.com"], // obrigatório para Control UI sem loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo perigoso de fallback de origem pelo cabeçalho Host
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
    tools: {
      // Negações HTTP adicionais para /tools/invoke
      deny: ["browser"],
      // Remover ferramentas da lista padrão de negação HTTP
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

- `mode`: `local` (executar gateway) ou `remote` (conectar a gateway remoto). O gateway se recusa a iniciar, a menos que seja `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (apenas IP Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Autenticação**: obrigatória por padrão. Binds sem loopback exigem autenticação do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e de instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem autenticação. Use apenas para configurações locais confiáveis em loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega a autenticação a um proxy reverso com reconhecimento de identidade e confia em cabeçalhos de identidade de `gateway.trustedProxies` (consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **sem loopback**; proxies reversos em loopback no mesmo host não atendem à autenticação trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a autenticação da interface do Control/WebSocket (verificada via `tailscale whois`). Endpoints da API HTTP **não** usam essa autenticação por cabeçalho Tailscale; eles seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway é confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de autenticação. Aplica-se por IP do cliente e por escopo de autenticação (segredo compartilhado e token de dispositivo são rastreados independentemente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da interface do Control via Tailscale Serve, tentativas falhas para o mesmo `{scope, clientIp}` são serializadas antes da gravação da falha. Portanto, tentativas inválidas concorrentes do mesmo cliente podem acionar o limitador já na segunda requisição, em vez de ambas passarem concorrendo como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem padrão `true`; defina `false` quando quiser intencionalmente que o tráfego localhost também seja limitado por taxa (para ambientes de teste ou implantações estritas com proxy).
- Tentativas de autenticação WS com origem de navegador sempre sofrem throttling com a isenção de loopback desativada (defesa em profundidade contra brute force em localhost baseado em navegador).
- Em loopback, esses bloqueios de origem de navegador são isolados por valor
  `Origin` normalizado, então falhas repetidas de uma origem localhost não
  bloqueiam automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind em loopback) ou `funnel` (público, exige autenticação).
- `controlUi.allowedOrigins`: allowlist explícita de origens de navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados a partir de origens sem loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que ativa fallback de origem pelo cabeçalho Host para implantações que intencionalmente dependem da política de origem baseada no cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` deve ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição emergencial no lado do cliente que permite `ws://` em texto simples para IPs confiáveis de rede privada; o padrão continua sendo somente loopback para texto simples.
- `gateway.remote.token` / `.password` são campos de credenciais do cliente remoto. Eles não configuram a autenticação do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS do relay APNs externo usado por builds oficiais/TestFlight de iOS depois que publicam registros com suporte a relay no gateway. Essa URL deve corresponder à URL do relay compilada no build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout de envio do gateway para o relay em milissegundos. O padrão é `10000`.
- Registros com suporte a relay são delegados a uma identidade específica do gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha uma permissão de envio com escopo de registro ao gateway. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade de canais em minutos. Defina `0` para desativar globalmente reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha isso maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações do monitor de integridade por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out por canal para reinicializações do monitor de integridade, mantendo o monitor global ativado.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição no nível do canal.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha de forma fechada (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxy reverso que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies que você controla. Entradas de loopback ainda são válidas para configurações de proxy local/detecção local (por exemplo, Tailscale Serve ou um proxy reverso local), mas elas **não** tornam requisições de loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueadas para HTTP `POST /tools/invoke` (estende a lista padrão de negação).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de negação HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desativado por padrão. Ative com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Reforço de segurança para entrada por URL em Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de reforço de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS que você controla; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute múltiplos gateways em um host com portas e diretórios de estado exclusivos:

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

- `enabled`: ativa terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; apenas para uso local/dev.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para o arquivo de chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do bundle CA para verificação de cliente ou cadeias de confiança personalizadas.

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
  - `"off"`: ignora edições ao vivo; alterações exigem reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do gateway em caso de mudança de configuração.
  - `"hot"`: aplica mudanças no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; usa fallback para reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes de aplicar mudanças de configuração (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo em ms para aguardar operações em andamento antes de forçar uma reinicialização (padrão: `300000` = 5 minutos).

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

Observações sobre validação e segurança:

- `hooks.enabled=true` exige `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapping ou preset usar `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapping não exigem essa adesão.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` do payload da requisição é aceito apenas quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores `sessionKey` de mapping renderizados por template são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes de mapping">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo do payload para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem do payload.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessia são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos usam fallback para o padrão.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente de hook sem `sessionKey` explícita.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mappings dirigidos por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapping), por exemplo `["hook:"]`. Torna-se obrigatória quando qualquer mapping ou preset usa `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` como padrão.
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

## Canvas host

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
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds sem loopback: rotas de canvas exigem autenticação do Gateway (token/senha/trusted-proxy), assim como outras superfícies HTTP do Gateway.
- WebViews de Node normalmente não enviam cabeçalhos de autenticação; depois que um node é pareado e conectado, o Gateway anuncia URLs de recursos com escopo de node para acesso a canvas/A2UI.
- URLs de recursos são vinculadas à sessão WS ativa do node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do gateway.
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
- O hostname usa `openclaw` por padrão. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + Tailscale split DNS.

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

- Variáveis de ambiente inline são aplicadas apenas se o env do processo não tiver a chave.
- Arquivos `.env`: `.env` do diretório atual + `~/.openclaw/.env` (nenhum deles sobrescreve variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Consulte [Ambiente](/pt-BR/help/environment) para a precedência completa.

### Substituição por variável de ambiente

Referencie variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Apenas nomes em maiúsculas são correspondidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro no carregamento da configuração.
- Escape com `$${VAR}` para um `${VAR}` literal.
- Funciona com `$include`.

---

## Segredos

Refs de segredos são aditivas: valores em texto simples continuam funcionando.

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
- ids de `source: "exec"` não devem conter segmentos de caminho delimitados por `/` como `.` ou `..` (por exemplo `a/../b` é rejeitado)

### Superfície de credenciais compatível

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos compatíveis de credenciais em `openclaw.json`.
- Refs em `auth-profiles.json` estão incluídas na resolução em runtime e na cobertura de auditoria.

### Configuração de providers de segredos

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

- O provider `file` aceita `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de providers file e exec falham de forma fechada quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` apenas para caminhos confiáveis que não possam ser verificados.
- O provider `exec` exige um `command` com caminho absoluto e usa payloads de protocolo em stdin/stdout.
- Por padrão, caminhos de comando com links simbólicos são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos com links simbólicos, validando o caminho de destino resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho de destino resolvido.
- O ambiente filho de `exec` é mínimo por padrão; passe variáveis necessárias explicitamente com `passEnv`.
- Refs de segredos são resolvidas no momento da ativação em um snapshot em memória; depois disso, caminhos de requisição leem apenas o snapshot.
- A filtragem de superfície ativa se aplica durante a ativação: refs não resolvidas em superfícies ativadas falham na inicialização/reload, enquanto superfícies inativas são ignoradas com diagnósticos.

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
- `auth-profiles.json` aceita refs em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos estáticos de credencial.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não aceitam credenciais de perfil de autenticação com suporte de SecretRef.
- Credenciais estáticas de runtime vêm de snapshots resolvidos em memória; entradas estáticas legadas em `auth.json` são limpas quando descobertas.
- Importações legadas de OAuth vêm de `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: backoff base em horas quando um perfil falha por erros reais de
  cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode
  cair aqui mesmo em respostas `401`/`403`, mas matchers de texto específicos de provider
  permanecem restritos ao provider ao qual pertencem (por exemplo OpenRouter
  `Key limit exceeded`). Mensagens recuperáveis de janela de uso `402` HTTP ou
  de limite de gasto de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provider para horas de backoff de cobrança.
- `billingMaxHours`: limite em horas para crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite em minutos para crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela deslizante em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: máximo de rotações de auth-profile no mesmo provider para erros de sobrecarga antes de alternar para fallback de modelo (padrão: `1`). Formatos de provider ocupado como `ModelNotReadyException` caem aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provider/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: máximo de rotações de auth-profile no mesmo provider para erros de limite de taxa antes de alternar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto em formato de provider, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `maxFileBytes`: tamanho máximo do arquivo de log em bytes antes que as gravações sejam suprimidas (inteiro positivo; padrão: `524288000` = 500 MB). Use rotação externa de logs para implantações em produção.

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
- `flags`: array de strings de flag que ativam saída de log direcionada (aceita curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: ativa o pipeline de exportação OpenTelemetry (padrão: `false`).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com requisições de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: ativam exportação de traces, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de trace `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de flush de telemetria em ms.
- `cacheTrace.enabled`: registra snapshots de trace de cache para execuções incorporadas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para JSONL de trace de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de trace de cache (todos com padrão `true`).

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

- `channel`: canal de versão para instalações npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: ativa atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máx: `168`).
- `auto.stableJitterHours`: janela extra de distribuição de rollout do canal estável em horas (padrão: `12`; máx: `168`).
- `auto.betaCheckIntervalHours`: frequência em horas das verificações no canal beta (padrão: `1`; máx: `24`).

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

- `enabled`: gate global do recurso ACP (padrão: `false`).
- `dispatch.enabled`: gate independente para despacho de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um plugin de runtime ACP registrado).
- `defaultAgent`: id do agente ACP de fallback quando spawns não especificam um destino explícito.
- `allowedAgents`: allowlist de ids de agente permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ocioso em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo de chunk antes da divisão da projeção de bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` faz buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de ficarem elegíveis para limpeza.
- `runtime.installCommand`: comando opcional de instalação a executar ao inicializar um ambiente de runtime ACP.

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
  - `"off"`: sem texto de slogan (título/versão do banner ainda são mostrados).
- Para ocultar o banner inteiro (não apenas os slogans), defina a env `OPENCLAW_HIDE_BANNER=1`.

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

Consulte os campos de identidade em `agents.list` em [Padrões de agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As versões atuais não incluem mais o bridge TCP. Nodes se conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até serem removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

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
    webhook: "https://example.invalid/legacy", // fallback obsoleto para tarefas armazenadas com notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticação de Webhook de saída
    sessionRetention: "24h", // string de duração ou false
    runLog: {
      maxBytes: "2mb", // padrão 2_000_000 bytes
      keepLines: 2000, // padrão 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execução isolada do cron antes de removê-las de `sessions.json`. Também controla a limpeza de transcrições arquivadas de cron excluído. Padrão: `24h`; defina `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes do pruning. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes retidas quando o pruning do log de execução é acionado. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook do cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de autenticação é enviado.
- `webhook`: URL de Webhook legada e obsoleta (http/https) usada apenas para tarefas armazenadas que ainda têm `notify: true`.

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
- `backoffMs`: array de atrasos de backoff em ms para cada nova tentativa (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que acionam novas tentativas — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente em todos os tipos transitórios.

Aplica-se apenas a tarefas de cron de execução única. Tarefas recorrentes usam tratamento separado de falhas.

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

- `enabled`: ativa alertas de falha para tarefas de cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín: `1`).
- `cooldownMs`: milissegundos mínimos entre alertas repetidos para a mesma tarefa (inteiro não negativo).
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

- Destino padrão para notificações de falha de cron em todas as tarefas.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega `announce`. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito de `announce` ou URL de Webhook. Obrigatório para o modo Webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por tarefa substitui esse padrão global.
- Quando nenhum destino global nem por tarefa de falha estiver definido, tarefas que já entregam via `announce` usam esse destino principal de `announce` como fallback em falha.
- `delivery.failureDestination` é compatível apenas para tarefas com `sessionTarget="isolated"`, a menos que o `delivery.mode` principal da tarefa seja `"webhook"`.

Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs). Execuções isoladas de cron são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

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
| `{{MessageSid}}`   | ID da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia recebida                      |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (image/audio/document/…)            |
| `{{Transcript}}`   | Transcrição do áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas de CLI    |
| `{{MaxChars}}`     | Máximo de caracteres de saída resolvido para entradas de CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia de membros do grupo (melhor esforço)       |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica de provider (whatsapp, telegram, discord etc.) |

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
- Array de arquivos: mesclado profundamente em ordem (os posteriores sobrescrevem os anteriores).
- Chaves irmãs: mescladas após os includes (sobrescrevem valores incluídos).
- Includes aninhados: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda resolvem dentro desse limite.
- Gravações de propriedade do OpenClaw que alteram apenas uma seção de nível superior suportada por um include de arquivo único gravam diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Includes na raiz, arrays de include e includes com substituições por chaves irmãs são somente leitura para gravações de propriedade do OpenClaw; essas gravações falham de forma fechada em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de parse e includes circulares.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

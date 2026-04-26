---
read_when:
    - Adicionando automação de navegador controlada por agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do navegador no app do macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

O OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por meio de um pequeno
serviço de controle local dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nisso como um **navegador separado, apenas para agentes**.
- O perfil `openclaw` **não** interfere no seu perfil pessoal do navegador.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil integrado `user` se conecta à sua sessão real do Chrome já autenticada via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Uma Skill incluída `browser-automation` que ensina agentes sobre o loop de
  recuperação de snapshot, aba estável, referência obsoleta e bloqueador manual quando o
  plugin de navegador está habilitado.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador do dia a dia. É uma superfície segura e isolada para
automação e verificação por agentes.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle do Plugin

A ferramenta `browser` padrão é um plugin incluído. Desative-a para substituí-la por outro plugin que registre o mesmo nome de ferramenta `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Os padrões precisam de `plugins.entries.browser.enabled` **e** `browser.enabled=true`. Desabilitar apenas o plugin remove a CLI `openclaw browser`, o método de gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem reinicialização do Gateway para que o plugin possa registrar novamente seu serviço.

## Orientação para agentes

Observação sobre perfil de ferramentas: `tools.profile: "coding"` inclui `web_search` e
`web_fetch`, mas não inclui a ferramenta completa `browser`. Se o agente ou um
subagente iniciado precisar usar automação do navegador, adicione browser na etapa do perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para um único agente, use `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` sozinho não é suficiente porque a política de subagentes
é aplicada após a filtragem do perfil.

O plugin de navegador oferece dois níveis de orientação para agentes:

- A descrição da ferramenta `browser` traz o contrato compacto sempre ativo: escolha
  o perfil certo, mantenha referências na mesma aba, use `tabId`/rótulos para direcionamento de abas
  e carregue a Skill do navegador para trabalhos em várias etapas.
- A Skill incluída `browser-automation` traz o loop operacional mais longo:
  verifique status/abas primeiro, rotule as abas da tarefa, faça snapshot antes de agir, faça
  novo snapshot após mudanças na UI, recupere referências obsoletas uma vez e relate login/2FA/captcha ou
  bloqueios de câmera/microfone como ação manual em vez de adivinhar.

Skills incluídas por plugins aparecem nas Skills disponíveis do agente quando o
plugin está habilitado. As instruções completas da Skill são carregadas sob demanda, então turnos
rotineiros não pagam todo o custo em tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após uma atualização, `browser.request` estiver ausente, ou o agente informar que a ferramenta de navegador não está disponível, a causa usual é uma lista `plugins.allow` que omite `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem a associação à allowlist — a allowlist controla o carregamento do plugin, e a política de ferramentas só é executada após o carregamento. Remover `plugins.allow` por completo também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (nenhuma extensão é necessária).
- `user`: perfil integrado de conexão do Chrome MCP para sua **sessão real do Chrome já autenticada**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões já autenticadas importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado como padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ative apenas para acesso confiável à rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // tempo limite HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tempo limite do handshake WebSocket do CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tempo limite de descoberta do Chrome gerenciado local (ms)
    localCdpReadyTimeoutMs: 8000, // tempo limite local de prontidão do CDP após inicialização (ms)
    actionTimeoutMs: 60000, // tempo limite padrão para ações do navegador (ms)
    tabCleanup: {
      enabled: true, // padrão: true
      idleMinutes: 120, // defina 0 para desabilitar a limpeza por inatividade
      maxTabsPerSession: 8, // defina 0 para desabilitar o limite por sessão
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Portas e alcance">

- O serviço de controle se vincula ao loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Substituir `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas dentro da mesma família.
- Perfis locais `openclaw` atribuem `cdpPort`/`cdpUrl` automaticamente; defina esses valores apenas para CDP remoto. `cdpUrl` assume por padrão a porta CDP local gerenciada quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance HTTP de CDP remoto e `attachOnly` e a solicitações HTTP de abertura de abas; `remoteCdpHandshakeTimeoutMs` se aplica aos handshakes CDP WebSocket correspondentes.
- `localLaunchTimeoutMs` é o orçamento para um processo local do Chrome gerenciado expor seu endpoint HTTP de CDP. `localCdpReadyTimeoutMs` é o orçamento de acompanhamento para a prontidão do websocket CDP após o processo ser descoberto.
  Aumente esses valores em Raspberry Pi, VPS de baixo desempenho ou hardware mais antigo onde o Chromium
  inicia lentamente. Os valores devem ser inteiros positivos de até `120000` ms; valores de configuração inválidos são rejeitados.
- `actionTimeoutMs` é o orçamento padrão para solicitações `act` do navegador quando o chamador não passa `timeoutMs`. O transporte do cliente adiciona uma pequena margem para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza por melhor esforço para abas abertas por sessões de navegador do agente principal. A limpeza de ciclo de vida de subagente, Cron e ACP ainda fecha suas abas rastreadas explícitas no fim da sessão; sessões principais mantêm abas ativas reutilizáveis e depois fecham abas rastreadas ociosas ou excedentes em segundo plano.

</Accordion>

<Accordion title="Política de SSRF">

- A navegação do navegador e a abertura de abas são protegidas contra SSRF antes da navegação e verificadas novamente, por melhor esforço, no URL final `http(s)` depois.
- No modo estrito de SSRF, a descoberta de endpoint CDP remoto e as sondagens de `/json/version` (`cdpUrl`) também são verificadas.
- As variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não direcionam automaticamente o navegador gerenciado pelo OpenClaw por proxy. O Chrome gerenciado inicia diretamente por padrão para que configurações de proxy do provedor não enfraqueçam as verificações de SSRF do navegador.
- Para aplicar proxy ao navegador gerenciado em si, passe sinalizadores explícitos de proxy do Chrome por `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo estrito de SSRF bloqueia roteamento explícito do navegador por proxy, a menos que o acesso do navegador à rede privada seja habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vem desabilitado por padrão; habilite-o apenas quando o acesso do navegador à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua com suporte como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas conectar se um já estiver em execução.
- `headless` pode ser definido globalmente ou por perfil gerenciado local. Valores por perfil substituem `browser.headless`, então um perfil iniciado localmente pode permanecer headless enquanto outro continua visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam uma
  inicialização headless única para perfis gerenciados locais sem reescrever
  `browser.headless` ou a configuração do perfil. Perfis de sessão existente, somente conexão e
  CDP remoto rejeitam a substituição porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis gerenciados locais
  entram automaticamente em modo headless por padrão quando nem o ambiente nem a configuração
  do perfil/global escolhem explicitamente o modo com interface. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inicializações gerenciadas locais em modo headless para o
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força o modo com interface para inicializações normais e retorna um erro acionável em hosts Linux sem servidor de exibição;
  uma solicitação explícita `start --headless` ainda prevalece para aquela única inicialização.
- `executablePath` pode ser definido globalmente ou por perfil gerenciado local. Valores por perfil substituem `browser.executablePath`, então perfis gerenciados diferentes podem iniciar navegadores diferentes baseados em Chromium. Ambas as formas aceitam `~` para o diretório home do seu sistema operacional.
- `color` (nível superior e por perfil) colore a UI do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (gerenciado e independente). Use `defaultProfile: "user"` para optar pelo navegador do usuário já autenticado.
- Ordem de detecção automática: navegador padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil de sessão existente precisar se conectar a um perfil de usuário Chromium não padrão (Brave, Edge etc.). Esse caminho também aceita `~` para o diretório home do seu sistema operacional.

</Accordion>

</AccordionGroup>

## Usar Brave (ou outro navegador baseado em Chromium)

Se o seu navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para substituir a
detecção automática. Valores `executablePath` de nível superior e por perfil aceitam `~`
para o diretório home do seu sistema operacional:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou defina isso na configuração, por plataforma:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` por perfil afeta apenas perfis gerenciados locais que o OpenClaw
inicia. Perfis `existing-session` se conectam a um navegador já em execução,
enquanto perfis CDP remotos usam o navegador por trás de `cdpUrl`.

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (host de nó):** execute um host de nó na máquina que tem o navegador; o Gateway faz proxy das ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- Para serviços CDP gerenciados externamente em loopback (por exemplo, Browserless em
  Docker publicado em `127.0.0.1`), defina também `attachOnly: true`. CDP em loopback
  sem `attachOnly` é tratado como um perfil de navegador local gerenciado pelo OpenClaw.
- `headless` afeta apenas perfis gerenciados locais que o OpenClaw inicia. Ele não reinicia nem altera navegadores de sessão existente ou CDP remoto.
- `executablePath` segue a mesma regra de perfis gerenciados locais. Alterá-lo em um
  perfil gerenciado local em execução marca esse perfil para reinicialização/reconciliação, para que a
  próxima inicialização use o novo binário.

O comportamento de parada difere por modo de perfil:

- perfis gerenciados locais: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis somente conexão e CDP remoto: `openclaw browser stop` encerra a
  sessão de controle ativa e libera substituições de emulação Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estados semelhantes), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens de query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens, em vez de gravá-los em arquivos de configuração.

## Proxy de navegador de nó (padrão sem configuração)

Se você executar um **host de nó** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de navegador para esse nó sem nenhuma configuração extra de navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host de nó expõe seu servidor local de controle do navegador por meio de um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do nó (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe-o vazio para o comportamento legado/padrão: todos os perfis configurados permanecem acessíveis pelo proxy, incluindo rotas de criar/excluir perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw trata isso como um limite de menor privilégio: apenas perfis na allowlist podem ser direcionados, e rotas persistentes de criar/excluir perfil são bloqueadas na superfície do proxy.
- Desabilite se não quiser isso:
  - No nó: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço hospedado de Chromium que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer formato, mas
para um perfil de navegador remoto a opção mais simples é a URL WebSocket direta
da documentação de conexão do Browserless.

Exemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Observações:

- Substitua `<BROWSERLESS_API_KEY>` pelo seu token real do Browserless.
- Escolha o endpoint de região que corresponda à sua conta Browserless (veja a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

### Browserless Docker no mesmo host

Quando o Browserless é auto-hospedado em Docker e o OpenClaw é executado no host, trate
o Browserless como um serviço CDP gerenciado externamente:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

O endereço em `browser.profiles.browserless.cdpUrl` deve ser alcançável a partir do
processo do OpenClaw. O Browserless também deve anunciar um endpoint correspondente alcançável;
defina `EXTERNAL` no Browserless para essa mesma base WebSocket pública-para-OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou um endereço privado estável da
rede Docker. Se `/json/version` retornar `webSocketDebuggerUrl` apontando para
um endereço que o OpenClaw não consegue alcançar, o HTTP do CDP pode parecer saudável enquanto a
conexão WebSocket ainda falha.

Não deixe `attachOnly` indefinido para um perfil Browserless em loopback. Sem
`attachOnly`, o OpenClaw trata a porta loopback como um perfil de navegador local
gerenciado e pode informar que a porta está em uso, mas não pertence ao OpenClaw.

## Provedores CDP WebSocket diretos

Alguns serviços de navegador hospedados expõem um endpoint **WebSocket direto** em vez
da descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  totalmente `/json/version`.
- **Raízes WebSocket sem caminho** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  em `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz sem caminho. Se o endpoint WebSocket
  anunciado rejeitar o handshake CDP, mas a raiz sem caminho configurada
  o aceitar, o OpenClaw também recorre a essa raiz. Isso permite que um `ws://` sem caminho
  apontando para um Chrome local ainda se conecte, já que o Chrome só aceita upgrades
  WebSocket no caminho específico por alvo vindo de `/json/version`, enquanto provedores
  hospedados ainda podem usar seu endpoint WebSocket raiz quando seu endpoint de descoberta
  anuncia uma URL de curta duração que não é adequada para o CDP do Playwright.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução integrada de CAPTCHA, modo stealth e proxies
residenciais.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Observações:

- [Cadastre-se](https://www.browserbase.com/sign-up) e copie sua **API Key**
  do [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua API key real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador na conexão WebSocket, então
  nenhuma etapa manual de criação de sessão é necessária.
- O plano gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Veja [pricing](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa da API,
  guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente loopback; o acesso flui pela autenticação do Gateway ou pelo pareamento de nó.
- A API HTTP independente do navegador em loopback usa **apenas autenticação por segredo compartilhado**:
  autenticação bearer por token do gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha de gateway configurada.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam essa API independente de navegador em loopback.
- Se o controle do navegador estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera esse token automaticamente quando `gateway.auth.mode` já estiver em
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de nó em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remotos como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (múltiplos navegadores)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo OpenClaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (navegador baseado em Chromium executando em outro lugar)
- **sessão existente**: seu perfil existente do Chrome via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão a sessão existente via Chrome MCP.
- Perfis de sessão existente são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium em execução por meio do
servidor MCP oficial do Chrome DevTools. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do navegador diferente.

Comportamento padrão:

- O perfil integrado `user` usa conexão automática do Chrome MCP, que tem como alvo o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil do Chrome que não seja o padrão.
`~` é expandido para o diretório home do seu sistema operacional:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Depois, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Habilite a depuração remota.
3. Mantenha o navegador em execução e aprove o prompt de conexão quando o OpenClaw se conectar.

Páginas de inspeção comuns:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Teste rápido de conexão ao vivo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Como é o sucesso:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista as abas do navegador que você já tinha abertas
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador de destino baseado em Chromium está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador exibiu, e você aceitou, o prompt de consentimento de conexão
- `openclaw doctor` migra configurações antigas de navegador baseadas em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não pode
  habilitar a depuração remota no lado do navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador autenticado do usuário.
- Se você usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha esse modo apenas quando o usuário estiver no computador para aprovar o prompt
  de conexão.
- o Gateway ou host de nó pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho é de maior risco que o perfil isolado `openclaw` porque pode
  agir dentro da sua sessão de navegador já autenticada.
- O OpenClaw não inicia o navegador para esse driver; ele apenas se conecta.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para direcionar esse diretório de dados de usuário.
- Sessão existente pode se conectar no host selecionado ou por meio de um
  nó de navegador conectado. Se o Chrome estiver em outro lugar e nenhum nó de navegador estiver conectado, use
  CDP remoto ou um host de nó.

### Inicialização personalizada do Chrome MCP

Substitua, por perfil, o servidor Chrome DevTools MCP iniciado quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for o que você deseja (hosts offline,
versões fixadas, binários vendorizados):

| Campo        | O que faz                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a iniciar no lugar de `npx`. Resolvido como está; caminhos absolutos são respeitados.                         |
| `mcpArgs`    | Array de argumentos passado literalmente para `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` está definido em um perfil de sessão existente, o OpenClaw ignora
`--autoConnect` e encaminha automaticamente o endpoint para o Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descoberta HTTP do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

Sinalizadores de endpoint e `userDataDir` não podem ser combinados: quando `cdpUrl` está definido,
`userDataDir` é ignorado na inicialização do Chrome MCP, já que o Chrome MCP se conecta ao
navegador em execução por trás do endpoint, em vez de abrir um diretório
de perfil.

<Accordion title="Limitações de recursos da sessão existente">

Comparados ao perfil gerenciado `openclaw`, drivers de sessão existente têm mais restrições:

- **Capturas de tela** — capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` ou `--element`. O Playwright não é necessário para capturas de página ou de elemento baseadas em ref.
- **Ações** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis da viewport e não exige ref de snapshot. `click` é apenas com botão esquerdo. `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não oferecem suporte a tempos limite por chamada. `select` aceita um único valor.
- **Wait / upload / dialog** — `wait --url` oferece suporte a padrões exatos, por substring e glob; `wait --load networkidle` não é compatível. Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem CSS `element`. Hooks de diálogo não oferecem suporte a substituições de tempo limite.
- **Recursos exclusivos do modo gerenciado** — ações em lote, exportação de PDF, interceptação de download e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca interfere no seu perfil pessoal do navegador.
- **Portas dedicadas**: evita `9222` para prevenir colisões com fluxos de trabalho de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna `suggestedTargetId` primeiro, depois
  identificadores estáveis `tabId` como `t1`, rótulos opcionais e o `targetId` bruto.
  Agentes devem reutilizar `suggestedTargetId`; ids brutos continuam disponíveis para
  depuração e compatibilidade.

## Seleção de navegador

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir isso com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: verifica locais comuns de Chrome/Brave/Edge/Chromium em `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Para scripts e depuração, o Gateway expõe uma pequena **API HTTP de controle somente loopback**
mais uma CLI correspondente `openclaw browser` (snapshots, refs, melhorias de wait,
saída JSON, fluxos de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium via snap), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações divididas com Gateway no WSL2 + Chrome no Windows, consulte
[Solução de problemas do WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha na inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes diferentes de falha, e apontam para caminhos de código diferentes.

- **Falha na inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está íntegro, mas um destino de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha na inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando um
    serviço CDP externo em loopback está configurado sem `attachOnly: true`
- Bloqueio SSRF de navegação:
  - fluxos de `open`, `navigate`, snapshot ou abertura de abas falham com um erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro solucione a prontidão do CDP.
- Se `start` funcionar, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falharem, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` funcionarem, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes do comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local em loopback `openclaw`, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcance SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido em `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** flexibilize a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis onde o acesso do navegador à rede privada seja necessário e revisado.

## Ferramentas de agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso funciona:

- `browser snapshot` retorna uma árvore de UI estável (AI ou ARIA).
- `browser act` usa os ids `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotulados).
- `browser doctor` verifica prontidão do Gateway, plugin, perfil, navegador e aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões com sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões sem sandbox usam `host` por padrão.
  - Se um nó com capacidade de navegador estiver conectado, a ferramenta poderá ser roteada automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral de ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do navegador em ambientes com sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e hardening do controle do navegador

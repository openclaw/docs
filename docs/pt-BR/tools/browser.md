---
read_when:
    - Adicionando automação de navegador controlada por agente
    - Depurando por que o OpenClaw está interferindo no seu próprio Chrome
    - Implementando configurações do navegador + ciclo de vida no aplicativo para macOS
summary: Serviço de controle do navegador integrado + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-05-10T19:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por um pequeno serviço de
controle local dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, exclusivo para o agente**.
- O perfil `openclaw` **não** toca no perfil do seu navegador pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil `user` integrado se conecta à sua sessão real do Chrome já autenticada via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (acento laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Uma skill `browser-automation` incluída que ensina aos agentes o loop de recuperação de snapshot,
  aba estável, referência obsoleta e bloqueador manual quando o Plugin de navegador
  está habilitado.
- Suporte opcional a múltiplos perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é seu navegador diário. Ele é uma superfície segura e isolada para
automação e verificação pelo agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber "Browser disabled", habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de navegador
está indisponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle de Plugin

A ferramenta `browser` padrão é um Plugin incluído. Desabilite-o para substituí-lo por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões precisam de `plugins.entries.browser.enabled` **e** `browser.enabled=true`. Desabilitar apenas o Plugin remove a CLI `openclaw browser`, o método `browser.request` do Gateway, a ferramenta do agente e o serviço de controle como uma unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem a reinicialização do Gateway para que o Plugin possa registrar novamente seu serviço.

## Orientação para o agente

Observação sobre perfil de ferramentas: `tools.profile: "coding"` inclui `web_search` e
`web_fetch`, mas não inclui a ferramenta `browser` completa. Se o agente ou um
subagente criado precisar usar automação de navegador, adicione o navegador na etapa de
perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para um único agente, use `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` sozinho não é suficiente porque a política de subagente
é aplicada depois da filtragem por perfil.

O Plugin de navegador vem com dois níveis de orientação para o agente:

- A descrição da ferramenta `browser` carrega o contrato compacto sempre ativo: escolha
  o perfil correto, mantenha refs na mesma aba, use `tabId`/rótulos para direcionamento
  de abas e carregue a skill de navegador para trabalho em várias etapas.
- A skill `browser-automation` incluída carrega o loop operacional mais longo:
  verifique status/abas primeiro, rotule abas da tarefa, faça snapshot antes de agir, faça novo snapshot
  após mudanças na UI, recupere refs obsoletas uma vez e relate login/2FA/captcha ou
  bloqueadores de câmera/microfone como ação manual em vez de adivinhar.

Skills incluídas por Plugin são listadas nas Skills disponíveis do agente quando o
Plugin está habilitado. As instruções completas da skill são carregadas sob demanda, então turnos de rotina
não pagam o custo completo em tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após uma atualização, `browser.request` estiver ausente ou o agente relatar que a ferramenta de navegador está indisponível, a causa comum é uma lista `plugins.allow` que omite `browser` e não existe nenhum bloco raiz de configuração `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Um bloco raiz explícito `browser`, por exemplo `browser.enabled=true` ou `browser.profiles.<name>`, ativa o Plugin de navegador incluído mesmo sob um `plugins.allow` restritivo, correspondendo ao comportamento de configuração de canais. `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem por si só a participação na lista de permissões. Remover `plugins.allow` por completo também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (nenhuma extensão necessária).
- `user`: perfil integrado de conexão do Chrome MCP para sua sessão **real do Chrome já autenticada**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões autenticadas existentes forem importantes e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo de navegador específico.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

<Accordion title="Portas e acessibilidade">

- O serviço de controle se vincula ao loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Sobrescrever `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas na mesma família.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina-os apenas para CDP remoto. `cdpUrl` usa por padrão a porta CDP local gerenciada quando não definida.
- `remoteCdpTimeoutMs` se aplica a verificações de acessibilidade HTTP de CDP remoto e `attachOnly`
  e a solicitações HTTP de abertura de abas; `remoteCdpHandshakeTimeoutMs` se aplica aos
  handshakes CDP WebSocket deles.
- `localLaunchTimeoutMs` é o orçamento para um processo gerenciado do Chrome iniciado localmente
  expor seu endpoint HTTP CDP. `localCdpReadyTimeoutMs` é o orçamento
  seguinte para prontidão do websocket CDP depois que o processo é descoberto.
  Aumente esses valores no Raspberry Pi, VPS de baixo custo ou hardware mais antigo em que o Chromium
  inicia lentamente. Os valores devem ser inteiros positivos até `120000` ms; valores
  de configuração inválidos são rejeitados.
- Falhas repetidas de inicialização/prontidão do Chrome gerenciado são protegidas por circuit breaker por
  perfil. Após várias falhas consecutivas, o OpenClaw pausa brevemente novas tentativas
  de inicialização em vez de iniciar Chromium em toda chamada de ferramenta de navegador. Corrija
  o problema de inicialização, desabilite o navegador se ele não for necessário ou reinicie o
  Gateway após o reparo.
- `actionTimeoutMs` é o orçamento padrão para solicitações `act` do navegador quando o chamador não passa `timeoutMs`. O transporte do cliente adiciona uma pequena janela de folga para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza de melhor esforço para abas abertas por sessões de navegador do agente principal. A limpeza de ciclo de vida de subagente, cron e ACP ainda fecha suas abas rastreadas explícitas no fim da sessão; sessões principais mantêm abas ativas reutilizáveis e depois fecham abas rastreadas ociosas ou excedentes em segundo plano.

</Accordion>

<Accordion title="Política de SSRF">

- A navegação do navegador e a abertura de abas são protegidas contra SSRF antes da navegação e, em melhor esforço, verificadas novamente na URL `http(s)` final depois.
- No modo SSRF estrito, a descoberta de endpoint CDP remoto e sondagens `/json/version` (`cdpUrl`) também são verificadas.
- As variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não aplicam proxy automaticamente ao navegador gerenciado pelo OpenClaw. O Chrome gerenciado é iniciado diretamente por padrão para que as configurações de proxy do provedor não enfraqueçam as verificações SSRF do navegador.
- Para aplicar proxy ao próprio navegador gerenciado, passe flags explícitas de proxy do Chrome por meio de `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo SSRF estrito bloqueia roteamento explícito de proxy do navegador, a menos que o acesso do navegador à rede privada esteja habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado por padrão; habilite apenas quando o acesso do navegador à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas anexar se já houver um em execução.
- `headless` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil substituem `browser.headless`, então um perfil iniciado localmente pode permanecer headless enquanto outro continua visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam um
  início headless de uso único para perfis locais gerenciados sem reescrever
  `browser.headless` ou a configuração do perfil. Perfis de sessão existente, somente anexação e
  CDP remoto rejeitam a substituição porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis locais gerenciados
  passam automaticamente para headless por padrão quando nem o ambiente nem a configuração
  de perfil/global escolhem explicitamente o modo com interface. `openclaw browser status --json`
  relata `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inícios locais gerenciados em modo headless para o
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força o modo com interface para inícios
  comuns e retorna um erro acionável em hosts Linux sem um servidor de exibição;
  uma solicitação explícita `start --headless` ainda prevalece para esse início único.
- `executablePath` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil substituem `browser.executablePath`, então diferentes perfis gerenciados podem iniciar diferentes navegadores baseados em Chromium. Ambas as formas aceitam `~` para o diretório inicial do seu SO.
- `color` (no nível superior e por perfil) tinge a interface do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (autônomo gerenciado). Use `defaultProfile: "user"` para optar pelo navegador do usuário autenticado.
- Ordem de detecção automática: navegador padrão do sistema se for baseado em Chromium; caso contrário, Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil de sessão existente deve se anexar a um perfil de usuário Chromium não padrão (Brave, Edge etc.). Esse caminho também aceita `~` para o diretório inicial do seu SO.

</Accordion>

</AccordionGroup>

## Usar Brave ou outro navegador baseado em Chromium

Se o navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para substituir
a detecção automática. Valores `executablePath` de nível superior e por perfil aceitam `~`
para o diretório inicial do seu SO:

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

`executablePath` por perfil afeta apenas perfis locais gerenciados que o OpenClaw
inicia. Perfis `existing-session` se anexam a um navegador já em execução
em vez disso, e perfis CDP remotos usam o navegador por trás de `cdpUrl`.

## Controle local vs. remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle local loopback e pode iniciar um navegador local.
- **Controle remoto (host Node):** execute um host Node na máquina que tem o navegador; o Gateway encaminha ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se anexar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- Para serviços CDP gerenciados externamente em loopback (por exemplo, Browserless em
  Docker publicado em `127.0.0.1`), defina também `attachOnly: true`. CDP em loopback
  sem `attachOnly` é tratado como um perfil de navegador local gerenciado pelo OpenClaw.
- `headless` afeta apenas perfis locais gerenciados que o OpenClaw inicia. Ele não reinicia nem altera navegadores de sessão existente ou CDP remoto.
- `executablePath` segue a mesma regra de perfil local gerenciado. Alterá-lo em um
  perfil local gerenciado em execução marca esse perfil para reinício/reconciliação para que o
  próximo início use o novo binário.

O comportamento de parada difere pelo modo do perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis somente anexação e CDP remoto: `openclaw browser stop` fecha a sessão de controle
  ativa e libera substituições de emulação Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens de consulta (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de registrá-los em arquivos de configuração.

## Proxy de navegador Node (padrão sem configuração)

Se você executa um **host Node** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas de ferramentas de navegador para esse Node sem nenhuma configuração extra de navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host Node expõe seu servidor local de controle de navegador por meio de um **comando de proxy**.
- Perfis vêm da própria configuração `browser.profiles` do Node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe-o vazio para o comportamento legado/padrão: todos os perfis configurados permanecem acessíveis por meio do proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de privilégio mínimo: apenas perfis em lista de permissões podem ser direcionados, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se não quiser isso:
  - No Node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer uma das formas, mas
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

Quando o Browserless é auto-hospedado no Docker e o OpenClaw é executado no host, trate
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

O endereço em `browser.profiles.browserless.cdpUrl` deve ser acessível pelo
processo do OpenClaw. O Browserless também deve anunciar um endpoint acessível correspondente;
defina `EXTERNAL` do Browserless para a mesma base WebSocket pública para o OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou um endereço de rede Docker
privada estável. Se `/json/version` retornar `webSocketDebuggerUrl` apontando para
um endereço que o OpenClaw não consegue acessar, o HTTP CDP pode parecer saudável enquanto o anexo
WebSocket ainda falha.

Não deixe `attachOnly` indefinido para um perfil Browserless em loopback. Sem
`attachOnly`, o OpenClaw trata a porta de loopback como um perfil de navegador
local gerenciado e pode relatar que a porta está em uso, mas não pertence ao OpenClaw.

## Provedores CDP WebSocket diretos

Alguns serviços de navegador hospedados expõem um endpoint **WebSocket direto** em vez
da descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe a estratégia de conexão correta automaticamente:

- **Descoberta HTTP(S)** - `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback WebSocket.
- **Endpoints WebSocket diretos** - `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por meio de um handshake WebSocket e ignora
  `/json/version` completamente.
- **Raízes WebSocket simples** - `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele é usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Se o endpoint
  WebSocket anunciado rejeitar o handshake CDP, mas a raiz simples configurada
  aceitá-lo, o OpenClaw também recorre a essa raiz. Isso permite que uma raiz simples `ws://`
  apontada para um Chrome local ainda conecte, já que o Chrome só aceita upgrades WebSocket
  no caminho específico por alvo de `/json/version`, enquanto provedores hospedados
  ainda podem usar seu endpoint WebSocket raiz quando o endpoint de descoberta
  anuncia uma URL de curta duração que não é adequada para CDP do Playwright.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução de CAPTCHA integrada, modo furtivo e proxies
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

- [Inscreva-se](https://www.browserbase.com/sign-up) e copie sua **API Key**
  do [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador na conexão WebSocket, então nenhuma
  etapa manual de criação de sessão é necessária.
- O nível gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Veja [preços](https://www.browserbase.com/pricing) para limites de planos pagos.
- Veja a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa da API,
  guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente por loopback; os fluxos de acesso passam pela autenticação do Gateway ou pelo pareamento de node.
- A API HTTP autônoma do navegador por loopback usa **somente autenticação por segredo compartilhado**:
  autenticação bearer por token do gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha do gateway configurada.
- Os cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` não
  **autenticam** esta API autônoma do navegador por loopback.
- Se o controle do navegador estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gerará um token de gateway apenas em runtime para essa inicialização. Configure
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou
  `OPENCLAW_GATEWAY_PASSWORD` explicitamente se os clientes precisarem de um segredo estável entre
  reinicializações.
- O OpenClaw **não** gera esse token automaticamente quando `gateway.auth.mode` já é
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (vários navegadores)

O OpenClaw aceita vários perfis nomeados (configurações de roteamento). Perfis podem ser:

- **openclaw-managed**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados do usuário + porta CDP
- **remote**: uma URL CDP explícita (navegador baseado em Chromium em execução em outro lugar)
- **existing session**: seu perfil existente do Chrome via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para anexação a uma sessão existente do Chrome MCP.
- Perfis de sessão existente são opcionais além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas de **18800-18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se anexar a um perfil de navegador baseado em Chromium em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do navegador diferente.

Comportamento padrão:

- O perfil integrado `user` usa a conexão automática do Chrome MCP, que mira o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil do Chrome não padrão.
`~` expande para o diretório inicial do seu sistema operacional:

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

Então, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Habilite a depuração remota.
3. Mantenha o navegador em execução e aprove o prompt de conexão quando o OpenClaw se anexar.

Páginas de inspeção comuns:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Teste smoke de anexação ao vivo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Como o sucesso se parece:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista as abas do navegador que já estão abertas
- `snapshot` retorna refs da aba ao vivo selecionada

O que verificar se a anexação não funcionar:

- o navegador de destino baseado em Chromium está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador exibiu e você aceitou o prompt de consentimento de anexação
- `openclaw doctor` migra configurações antigas de navegador baseadas em plugin e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não consegue
  habilitar a depuração remota no lado do navegador para você

Uso por agentes:

- Use `profile="user"` quando precisar do estado de navegador com login do usuário.
- Se usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha este modo somente quando o usuário estiver no computador para aprovar o prompt de
  anexação.
- o Gateway ou host de node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Este caminho tem risco maior do que o perfil isolado `openclaw`, porque pode
  agir dentro da sua sessão de navegador autenticada.
- O OpenClaw não inicia o navegador para este driver; ele apenas se anexa.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para mirar esse diretório de dados do usuário.
- A sessão existente pode se anexar no host selecionado ou por meio de um node de
  navegador conectado. Se o Chrome estiver em outro lugar e nenhum node de navegador estiver conectado, use
  CDP remoto ou um host de node em vez disso.

### Inicialização personalizada do Chrome MCP

Substitua o servidor Chrome DevTools MCP iniciado por perfil quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for o que você quer (hosts offline,
versões fixadas, binários fornecidos no vendor):

| Campo        | O que ele faz                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a iniciar em vez de `npx`. Resolvido como informado; caminhos absolutos são respeitados.                                          |
| `mcpArgs`    | Array de argumentos passado literalmente para `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` é definido em um perfil de sessão existente, o OpenClaw ignora
`--autoConnect` e encaminha o endpoint ao Chrome MCP automaticamente:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descoberta HTTP do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

Flags de endpoint e `userDataDir` não podem ser combinados: quando `cdpUrl` é definido,
`userDataDir` é ignorado para a inicialização do Chrome MCP, pois o Chrome MCP se anexa ao
navegador em execução por trás do endpoint em vez de abrir um diretório de
perfil.

<Accordion title="Limitações do recurso de sessão existente">

Em comparação com o perfil gerenciado `openclaw`, drivers de sessão existente são mais restritos:

- **Capturas de tela** - capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` ou `--element`. Playwright não é necessário para capturas de tela de página ou de elemento baseado em ref.
- **Ações** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis da viewport e não exige ref de snapshot. `click` usa somente o botão esquerdo. `type` não aceita `slowly=true`; use `fill` ou `press`. `press` não aceita `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não aceitam timeouts por chamada. `select` aceita um único valor.
- **Espera / upload / diálogo** - `wait --url` aceita padrões exatos, de substring e glob; `wait --load networkidle` não é aceito. Ganchos de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Ganchos de diálogo não aceitam substituições de timeout.
- **Recursos somente gerenciados** - ações em lote, exportação para PDF, interceptação de downloads e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório dedicado de dados do usuário**: nunca toca no seu perfil pessoal do navegador.
- **Portas dedicadas**: evita `9222` para impedir colisões com fluxos de trabalho de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna `suggestedTargetId` primeiro, depois
  handles `tabId` estáveis como `t1`, rótulos opcionais e o `targetId` bruto.
  Agentes devem reutilizar `suggestedTargetId`; ids brutos permanecem disponíveis para
  depuração e compatibilidade.

## Seleção do navegador

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: verifica locais comuns do Chrome/Brave/Edge/Chromium em `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`, além do Chromium gerenciado pelo Playwright em
  `PLAYWRIGHT_BROWSERS_PATH` ou `~/.cache/ms-playwright`.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Para scripts e depuração, o Gateway expõe uma pequena **API HTTP de controle
somente por loopback**, além de uma CLI `openclaw browser` correspondente (snapshots, refs, melhorias de espera, saída
JSON, fluxos de trabalho de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium snap), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações com Gateway no WSL2 + Chrome no Windows em hosts separados, consulte
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Estas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está íntegro, mas um destino de navegação de página é rejeitado por política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando um
    serviço CDP externo por loopback é configurado sem `attachOnly: true`
- Bloqueio SSRF de navegação:
  - fluxos de `open`, `navigate`, snapshot ou abertura de abas falham com um erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como ler os resultados:

- Se `start` falhar com `not reachable after start`, investigue primeiro a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes de comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado `openclaw` de local loopback, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcance SSRF do navegador para o plano de controle local próprio do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** afrouxe a política de SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis nos quais o acesso do navegador à rede privada é necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso é mapeado:

- `browser snapshot` retorna uma árvore de IU estável (IA ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotuladas).
- `browser doctor` verifica a prontidão do Gateway, Plugin, perfil, navegador e aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador fica.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões sem sandbox usam `host` por padrão.
  - Se um nó com suporte a navegador estiver conectado, a ferramenta poderá rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) - controle do navegador em ambientes em sandbox
- [Segurança](/pt-BR/gateway/security) - riscos e endurecimento do controle do navegador

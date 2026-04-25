---
read_when:
    - Adicionar automação de navegador controlada pelo agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do navegador no app do macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Browser (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

O OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por um pequeno
serviço de controle local dentro do Gateway (apenas loopback).

Visão para iniciantes:

- Pense nisso como um **navegador separado, apenas para o agente**.
- O perfil `openclaw` **não** interfere no perfil do seu navegador pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em um ambiente seguro.
- O perfil `user` integrado se conecta à sua sessão real do Chrome com login via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Uma skill `browser-automation` incluída que ensina agentes a usar o loop de recuperação de snapshot,
  aba estável, referência obsoleta e bloqueador manual quando o
  Plugin de navegador está habilitado.
- Suporte opcional a múltiplos perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador do dia a dia. Ele é uma superfície segura e isolada para
automação e verificação por agentes.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se aparecer “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver completamente ausente, ou se o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle do Plugin

A ferramenta `browser` padrão é um Plugin incluído. Desative-a para substituí-la por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões exigem tanto `plugins.entries.browser.enabled` **quanto** `browser.enabled=true`. Desativar apenas o Plugin remove a CLI `openclaw browser`, o método de gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma única unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem reiniciar o Gateway para que o Plugin possa registrar novamente seu serviço.

## Orientação para agentes

O Plugin de navegador fornece dois níveis de orientação para o agente:

- A descrição da ferramenta `browser` traz o contrato compacto sempre ativo: escolher
  o perfil correto, manter referências na mesma aba, usar `tabId`/rótulos para
  direcionamento de abas e carregar a skill de navegador para trabalhos em várias etapas.
- A skill `browser-automation` incluída traz o loop operacional mais longo:
  verificar primeiro status/abas, rotular as abas da tarefa, fazer snapshot antes de agir, refazer snapshot
  após mudanças na interface, recuperar referências obsoletas uma vez e relatar bloqueios de login/2FA/captcha ou
  câmera/microfone como ação manual em vez de adivinhar.

As Skills incluídas pelo Plugin são listadas nas skills disponíveis do agente quando o
Plugin está habilitado. As instruções completas da skill são carregadas sob demanda, então
interações rotineiras não pagam o custo total de tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após uma atualização, `browser.request` estiver ausente, ou o agente informar que a ferramenta de navegador não está disponível, a causa mais comum é uma lista `plugins.allow` que omite `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem a presença na allowlist — a allowlist controla o carregamento do Plugin, e a política de ferramentas só é executada após o carregamento. Remover `plugins.allow` completamente também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (não requer extensão).
- `user`: perfil integrado de conexão ao Chrome MCP para sua **sessão real do Chrome com login**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões já autenticadas forem importantes e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilite apenas para acesso confiável à rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // tempo limite HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tempo limite do handshake WebSocket do CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tempo limite para descoberta local do Chrome gerenciado (ms)
    localCdpReadyTimeoutMs: 8000, // tempo limite local para prontidão do CDP após iniciar (ms)
    actionTimeoutMs: 60000, // tempo limite padrão para ações do navegador (ms)
    tabCleanup: {
      enabled: true, // padrão: true
      idleMinutes: 120, // defina 0 para desativar a limpeza por inatividade
      maxTabsPerSession: 8, // defina 0 para desativar o limite por sessão
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
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses valores apenas para CDP remoto. `cdpUrl` usa por padrão a porta CDP local gerenciada quando não está definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance HTTP do CDP remoto (não loopback); `remoteCdpHandshakeTimeoutMs` se aplica a handshakes WebSocket do CDP remoto.
- `localLaunchTimeoutMs` é o orçamento para um processo local de Chrome gerenciado iniciado localmente
  expor seu endpoint HTTP de CDP. `localCdpReadyTimeoutMs` é o
  orçamento de acompanhamento para prontidão do websocket CDP após o processo ser descoberto.
  Aumente esses valores em Raspberry Pi, VPSs de baixo custo ou hardware mais antigo onde o Chromium
  inicia lentamente. Os valores são limitados a 120000 ms.
- `actionTimeoutMs` é o orçamento padrão para requisições `act` do navegador quando o chamador não passa `timeoutMs`. O transporte do cliente adiciona uma pequena margem para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza por melhor esforço para abas abertas por sessões de navegador do agente principal. A limpeza de ciclo de vida de subagente, Cron e ACP ainda fecha suas abas rastreadas explicitamente no fim da sessão; as sessões principais mantêm abas ativas reutilizáveis e depois fecham abas rastreadas ociosas ou em excesso em segundo plano.

</Accordion>

<Accordion title="Política de SSRF">

- Navegação do navegador e abertura de aba são protegidas contra SSRF antes da navegação e verificadas novamente, por melhor esforço, na URL final `http(s)` depois.
- No modo estrito de SSRF, a descoberta de endpoint CDP remoto e sondagens `/json/version` (`cdpUrl`) também são verificadas.
- Variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não aplicam proxy automaticamente ao navegador gerenciado pelo OpenClaw. O Chrome gerenciado inicia com conexão direta por padrão para que as configurações de proxy do provedor não enfraqueçam as verificações SSRF do navegador.
- Para aplicar proxy ao próprio navegador gerenciado, passe flags explícitas de proxy do Chrome por `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo estrito de SSRF bloqueia roteamento explícito de proxy do navegador, a menos que o acesso do navegador à rede privada tenha sido intencionalmente habilitado.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vem desativado por padrão; habilite apenas quando o acesso do navegador à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua sendo compatível como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas conectar se um já estiver em execução.
- `headless` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil substituem `browser.headless`, então um perfil iniciado localmente pode permanecer headless enquanto outro continua visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam um
  início headless único para perfis locais gerenciados sem reescrever
  `browser.headless` ou a configuração do perfil. Perfis de sessão existente, somente conexão e
  CDP remoto rejeitam essa substituição porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis locais gerenciados
  passam a usar headless por padrão automaticamente quando nem o ambiente nem a configuração
  do perfil/global escolhem explicitamente o modo com interface. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inícios locais gerenciados em headless para o
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força o modo com interface para inícios comuns e retorna um erro acionável em hosts Linux sem servidor de exibição;
  uma solicitação explícita `start --headless` ainda prevalece para aquele início específico.
- `executablePath` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil substituem `browser.executablePath`, então diferentes perfis gerenciados podem iniciar diferentes navegadores baseados em Chromium.
- `color` (no nível superior e por perfil) colore a interface do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (gerenciado e independente). Use `defaultProfile: "user"` para optar pelo navegador do usuário autenticado.
- Ordem de detecção automática: navegador padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil de sessão existente precisar se conectar a um perfil de usuário Chromium não padrão (Brave, Edge etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (ou outro navegador baseado em Chromium)

Se o seu navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para substituir a
detecção automática. `~` se expande para o diretório home do seu sistema operacional:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou defina-o na configuração, por plataforma:

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

O `executablePath` por perfil afeta apenas perfis locais gerenciados que o OpenClaw
inicia. Perfis `existing-session` se conectam a um navegador já em execução,
e perfis CDP remotos usam o navegador por trás de `cdpUrl`.

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (host de node):** execute um host de node na máquina que tem o navegador; o Gateway encaminha as ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- `headless` afeta apenas perfis locais gerenciados que o OpenClaw inicia. Ele não reinicia nem altera navegadores de perfis `existing-session` ou CDP remotos.
- `executablePath` segue a mesma regra de perfis locais gerenciados. Alterá-lo em um
  perfil local gerenciado em execução marca esse perfil para reinício/reconciliação para que o
  próximo início use o novo binário.

O comportamento de parada difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis somente conexão e CDP remotos: `openclaw browser stop` fecha a sessão ativa
  de controle e libera as substituições de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs de CDP remoto podem incluir autenticação:

- Tokens na query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket do CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de confirmá-los em arquivos de configuração.

## Proxy de navegador de node (padrão sem configuração)

Se você executar um **host de node** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de navegador para esse node sem nenhuma configuração extra do navegador.
Este é o caminho padrão para gateways remotos.

Observações:

- O host de node expõe seu servidor local de controle do navegador por meio de um **comando de proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do node (a mesma do local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe-o vazio para o comportamento legado/padrão: todos os perfis configurados permanecem acessíveis pelo proxy, incluindo rotas de criar/excluir perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de privilégio mínimo: apenas perfis na allowlist podem ser direcionados, e rotas persistentes de criar/excluir perfil são bloqueadas na superfície do proxy.
- Desative se não quiser:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer um dos formatos, mas
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
- Escolha o endpoint de região que corresponde à sua conta do Browserless (veja a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Provedores CDP WebSocket diretos

Alguns serviços de navegador hospedados expõem um endpoint **WebSocket direto** em vez da
descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL WebSocket do depurador e depois
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  `/json/version` completamente.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele é usado; caso contrário, o OpenClaw
  faz fallback para um handshake WebSocket direto na raiz simples. Isso permite que um
  `ws://` simples apontando para um Chrome local ainda se conecte, já que o Chrome só
  aceita upgrades WebSocket no caminho específico por alvo retornado por
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução integrada de CAPTCHA, modo furtivo e
proxies residenciais.

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
- Veja a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa
  da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é apenas por loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento do node.
- A API HTTP autônoma do navegador em loopback usa **apenas autenticação por segredo compartilhado**:
  auth bearer por token do gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha do gateway configurada.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não** autenticam esta API autônoma do navegador em loopback.
- Se o controle do navegador estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já é
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remotos como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (múltiplos navegadores)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciado pelo openclaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (navegador baseado em Chromium em execução em outro lugar)
- **sessão existente**: seu perfil Chrome existente via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão de sessão existente do Chrome MCP.
- Perfis de sessão existente são opcionais além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium já em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README do Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do navegador diferente.

Comportamento padrão:

- O perfil `user` integrado usa conexão automática do Chrome MCP, que direciona o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil Chrome não padrão:

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

Teste rápido de conexão em tempo real:

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
- `tabs` lista as abas do navegador que já estão abertas
- `snapshot` retorna referências da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador baseado em Chromium de destino está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador exibiu e você aceitou o prompt de consentimento de conexão
- `openclaw doctor` migra a configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não pode
  habilitar a depuração remota no navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado de navegador autenticado do usuário.
- Se você usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Só escolha esse modo quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou host de node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho tem risco mais alto do que o perfil isolado `openclaw` porque pode
  agir dentro da sua sessão de navegador autenticada.
- O OpenClaw não inicia o navegador para esse driver; ele apenas se conecta.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para direcionar esse diretório de dados de usuário.
- Sessão existente pode se conectar no host selecionado ou por meio de um
  node de navegador conectado. Se o Chrome estiver em outro lugar e nenhum node de navegador estiver conectado, use
  CDP remoto ou um host de node.

### Inicialização personalizada do Chrome MCP

Substitua o servidor Chrome DevTools MCP iniciado por perfil quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for o que você deseja (hosts offline,
versões fixadas, binários vendorizados):

| Campo        | O que faz                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a ser iniciado no lugar de `npx`. Resolvido como está; caminhos absolutos são respeitados.                      |
| `mcpArgs`    | Array de argumentos passado literalmente para `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` é definido em um perfil de sessão existente, o OpenClaw ignora
`--autoConnect` e encaminha automaticamente o endpoint para o Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descoberta HTTP do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

Flags de endpoint e `userDataDir` não podem ser combinados: quando `cdpUrl` está definido,
`userDataDir` é ignorado na inicialização do Chrome MCP, já que o Chrome MCP se conecta ao
navegador em execução por trás do endpoint em vez de abrir um diretório
de perfil.

<Accordion title="Limitações do recurso de sessão existente">

Em comparação com o perfil gerenciado `openclaw`, drivers de sessão existente têm mais restrições:

- **Capturas de tela** — capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` ou `--element`. O Playwright não é necessário para capturas de tela de página ou de elemento baseadas em ref.
- **Ações** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis da viewport e não exige ref de snapshot. `click` é apenas com botão esquerdo. `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não oferecem suporte a tempos limite por chamada. `select` aceita um único valor.
- **Espera / upload / diálogo** — `wait --url` oferece suporte a padrões exatos, de substring e glob; `wait --load networkidle` não é compatível. Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Hooks de diálogo não oferecem suporte a substituições de tempo limite.
- **Recursos somente gerenciados** — ações em lote, exportação de PDF, interceptação de download e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório dedicado de dados de usuário**: nunca toca no perfil do seu navegador pessoal.
- **Portas dedicadas**: evita `9222` para prevenir colisões com fluxos de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna primeiro `suggestedTargetId`, depois
  identificadores estáveis `tabId`, como `t1`, rótulos opcionais e o `targetId` bruto.
  Agentes devem reutilizar `suggestedTargetId`; ids brutos continuam disponíveis para
  depuração e compatibilidade.

## Seleção do navegador

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

Para automação por script e depuração, o Gateway expõe uma pequena **API HTTP de controle
apenas por loopback** além de uma CLI `openclaw browser` correspondente (snapshots, refs, wait
aprimorado, saída JSON, fluxos de depuração). Veja
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium via snap), veja
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações divididas com Gateway no WSL2 + Chrome no Windows em hosts diferentes, veja
[Solução de problemas de WSL2 + Windows + Chrome remoto via CDP](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha na inicialização do CDP vs bloqueio SSRF de navegação

Estas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha na inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está saudável.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está saudável, mas um destino de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha na inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou abertura de aba falham com um erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro investigue a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está saudável. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falharem, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está saudável.

Detalhes importantes do comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local `openclaw` em loopback, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcance SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis em que o acesso do navegador à rede privada é necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso se mapeia:

- `browser snapshot` retorna uma árvore estável da interface (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotuladas).
- `browser doctor` verifica a prontidão do Gateway, Plugin, perfil, navegador e aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão, sessões sem sandbox usam `host` por padrão.
  - Se um node com capacidade de navegador estiver conectado, a ferramenta pode ser roteada automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do navegador em ambientes com sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e endurecimento do controle do navegador

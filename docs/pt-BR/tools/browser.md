---
read_when:
    - Adicionando automação de navegador controlada por agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do navegador no app para macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-25T18:22:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

O OpenClaw pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por um pequeno serviço local de
controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nisso como um **navegador separado, só para o agente**.
- O perfil `openclaw` **não** toca no perfil do seu navegador pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma via segura.
- O perfil interno `user` se conecta à sua sessão real do Chrome com login via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Uma Skill incluída `browser-automation` que ensina agentes sobre o loop de recuperação de snapshot,
  aba estável, stale-ref e bloqueador manual quando o Plugin de navegador está habilitado.
- Suporte opcional a múltiplos perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador principal do dia a dia. Ele é uma superfície
segura e isolada para automação e verificação por agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver ausente por completo, ou o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle por Plugin

A ferramenta padrão `browser` é um Plugin incluído. Desative-a para substituí-la por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões exigem `plugins.entries.browser.enabled` **e** `browser.enabled=true`. Desabilitar apenas o Plugin remove a CLI `openclaw browser`, o método de gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma única unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem uma reinicialização do Gateway para que o Plugin possa registrar novamente seu serviço.

## Orientação para agente

Observação sobre perfil de ferramenta: `tools.profile: "coding"` inclui `web_search` e
`web_fetch`, mas não inclui a ferramenta completa `browser`. Se o agente ou um
subagente gerado precisar usar automação de navegador, adicione browser na fase de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para um único agente, use `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` sozinho não é suficiente porque a
política de subagente é aplicada após a filtragem do perfil.

O Plugin de navegador fornece dois níveis de orientação para agente:

- A descrição da ferramenta `browser` traz o contrato compacto sempre ativo: escolha
  o perfil certo, mantenha refs na mesma aba, use `tabId`/rótulos para direcionamento
  de abas e carregue a Skill do navegador para trabalhos em várias etapas.
- A Skill incluída `browser-automation` traz o loop operacional mais longo:
  verifique status/abas primeiro, rotule abas da tarefa, faça snapshot antes de agir,
  refaça snapshot após mudanças na UI, recupere stale refs uma vez e informe bloqueios
  de login/2FA/captcha ou câmera/microfone como ação manual em vez de adivinhar.

Skills incluídas pelo Plugin são listadas nas Skills disponíveis do agente quando o
Plugin está habilitado. As instruções completas da Skill são carregadas sob demanda, então
turnos rotineiros não pagam o custo total em tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após um upgrade, `browser.request` estiver ausente, ou o agente relatar que a ferramenta de navegador não está disponível, a causa usual é uma lista `plugins.allow` que omite `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem a associação à allowlist — a allowlist controla o carregamento do Plugin, e a política de ferramenta só é executada após o carregamento. Remover `plugins.allow` por completo também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (não exige extensão).
- `user`: perfil interno de conexão do Chrome MCP à sua **sessão real do Chrome com login**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões já autenticadas importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a sobrescrita explícita quando você quer um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado como padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilite somente para acesso confiável a rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // sobrescrita legada de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout de handshake WebSocket do CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // timeout de descoberta local do Chrome gerenciado (ms)
    localCdpReadyTimeoutMs: 8000, // timeout local de prontidão do CDP após inicialização (ms)
    actionTimeoutMs: 60000, // timeout padrão para ações do navegador (ms)
    tabCleanup: {
      enabled: true, // padrão: true
      idleMinutes: 120, // defina 0 para desabilitar limpeza por ociosidade
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

- O serviço de controle faz bind em loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Sobrescrever `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas na mesma família.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina-os apenas para CDP remoto. `cdpUrl` usa por padrão a porta local de CDP gerenciado quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance HTTP do CDP remoto e de `attachOnly`
  e a solicitações HTTP de abertura de abas; `remoteCdpHandshakeTimeoutMs` se aplica a
  seus handshakes WebSocket do CDP.
- `localLaunchTimeoutMs` é o orçamento para um processo local gerenciado de Chrome
  expor seu endpoint HTTP de CDP. `localCdpReadyTimeoutMs` é o
  orçamento subsequente para prontidão do websocket CDP após o processo ser descoberto.
  Aumente esses valores em Raspberry Pi, VPS de baixo custo ou hardware mais antigo em que o Chromium
  inicia lentamente. Os valores são limitados a 120000 ms.
- `actionTimeoutMs` é o orçamento padrão para solicitações `act` do navegador quando o chamador não informa `timeoutMs`. O transporte do cliente adiciona uma pequena folga para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza de melhor esforço para abas abertas por sessões de navegador do agente principal. A limpeza de ciclo de vida de subagente, Cron e ACP ainda fecha suas abas rastreadas explícitas ao final da sessão; sessões principais mantêm abas ativas reutilizáveis e depois fecham em segundo plano abas rastreadas ociosas ou excedentes.

</Accordion>

<Accordion title="Política de SSRF">

- Navegação do navegador e open-tab são protegidos contra SSRF antes da navegação e verificados novamente de forma aproximada na URL final `http(s)` depois.
- No modo estrito de SSRF, a descoberta de endpoint CDP remoto e as sondas `/json/version` (`cdpUrl`) também são verificadas.
- Variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não fazem proxy automaticamente do navegador gerenciado pelo OpenClaw. Inicializações gerenciadas do Chrome usam conexão direta por padrão para que configurações de proxy do provedor não enfraqueçam as verificações de SSRF do navegador.
- Para usar proxy no próprio navegador gerenciado, passe flags explícitas de proxy do Chrome por `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo estrito de SSRF bloqueia roteamento explícito de proxy do navegador, a menos que o acesso do navegador a rede privada esteja intencionalmente habilitado.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vem desativado por padrão; habilite somente quando o acesso do navegador a rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas conectar se um já estiver em execução.
- `headless` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil sobrescrevem `browser.headless`, para que um perfil iniciado localmente possa permanecer headless enquanto outro continua visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam uma
  inicialização headless única para perfis locais gerenciados sem regravar
  `browser.headless` nem a configuração do perfil. Perfis existing-session, attach-only e
  CDP remoto rejeitam a sobrescrita porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis locais gerenciados
  usam headless por padrão automaticamente quando nem o ambiente nem a
  configuração do perfil/global escolhem explicitamente o modo com interface. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inicializações locais gerenciadas em modo headless para o
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força modo com interface para inicializações comuns
  e retorna um erro acionável em hosts Linux sem servidor de exibição;
  uma solicitação explícita `start --headless` ainda prevalece para aquela inicialização.
- `executablePath` pode ser definido globalmente ou por perfil local gerenciado. Valores por perfil sobrescrevem `browser.executablePath`, para que diferentes perfis gerenciados possam iniciar diferentes navegadores baseados em Chromium.
- `color` (nível superior e por perfil) colore a UI do navegador para que você veja qual perfil está ativo.
- O perfil padrão é `openclaw` (gerenciado e independente). Use `defaultProfile: "user"` para optar pelo navegador do usuário autenticado.
- Ordem de detecção automática: navegador padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session precisar se conectar a um perfil de usuário Chromium não padrão (Brave, Edge etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (ou outro navegador baseado em Chromium)

Se o seu navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usará automaticamente. Defina `browser.executablePath` para sobrescrever a
detecção automática. `~` expande para o diretório home do seu sistema operacional:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Ou defina na configuração, por plataforma:

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
inicia. Perfis `existing-session` se conectam a um navegador já em execução,
e perfis CDP remotos usam o navegador por trás de `cdpUrl`.

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (host Node):** execute um host Node na máquina que tem o navegador; o Gateway encaminha ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- Para serviços CDP gerenciados externamente em loopback (por exemplo Browserless em
  Docker publicado em `127.0.0.1`), também defina `attachOnly: true`. CDP em loopback
  sem `attachOnly` é tratado como um perfil de navegador local gerenciado pelo OpenClaw.
- `headless` afeta apenas perfis locais gerenciados que o OpenClaw inicia. Ele não reinicia nem altera navegadores existing-session ou CDP remotos.
- `executablePath` segue a mesma regra dos perfis locais gerenciados. Alterá-lo em um
  perfil local gerenciado em execução marca esse perfil para reinício/reconciliação para que a
  próxima inicialização use o novo binário.

O comportamento de parada difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis attach-only e CDP remotos: `openclaw browser stop` fecha a sessão de controle ativa
  e libera sobrescritas de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir auth:

- Tokens em query string (por exemplo, `https://provider.example?token=<token>`)
- Auth HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a auth ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket do CDP. Prefira variáveis de ambiente ou gerenciadores de Secrets para
tokens em vez de gravá-los em arquivos de configuração.

## Proxy de navegador do Node (padrão sem configuração)

Se você executar um **host Node** na máquina que tem o navegador, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de navegador para esse Node sem nenhuma configuração extra de navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host Node expõe seu servidor local de controle do navegador por um **comando de proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw trata isso como um limite de privilégio mínimo: somente perfis na allowlist podem ser direcionados, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se você não quiser isso:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço hospedado de Chromium que expõe
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
- Escolha o endpoint regional que corresponda à sua conta do Browserless (consulte a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar que o OpenClaw
  descubra `/json/version`.

### Browserless Docker no mesmo host

Quando o Browserless é hospedado em Docker e o OpenClaw é executado no host, trate
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

O endereço em `browser.profiles.browserless.cdpUrl` deve estar acessível a partir do
processo do OpenClaw. O Browserless também deve anunciar um endpoint correspondente e acessível;
defina `EXTERNAL` do Browserless para essa mesma base WebSocket pública para o OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou um endereço privado estável da rede Docker.
Se `/json/version` retornar `webSocketDebuggerUrl` apontando para
um endereço que o OpenClaw não consegue acessar, o CDP HTTP pode parecer saudável enquanto a
conexão WebSocket ainda falha.

Não deixe `attachOnly` sem definição para um perfil Browserless em loopback. Sem
`attachOnly`, o OpenClaw trata a porta de loopback como um perfil de navegador local gerenciado
e pode informar que a porta está em uso, mas não pertence ao OpenClaw.

## Provedores CDP diretos por WebSocket

Alguns serviços hospedados de navegador expõem um endpoint **WebSocket direto** em vez
da descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Não há fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  `/json/version` completamente.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele é usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Se o endpoint WebSocket anunciado
  rejeitar o handshake CDP, mas a raiz simples configurada
  aceitá-lo, o OpenClaw também recorre a essa raiz. Isso permite que um `ws://` simples
  apontado para um Chrome local ainda se conecte, já que o Chrome só aceita upgrades de WebSocket
  no caminho específico por alvo de `/json/version`, enquanto provedores hospedados
  ainda podem usar seu endpoint WebSocket de raiz quando seu endpoint de descoberta
  anuncia uma URL de curta duração que não é adequada para o Playwright CDP.

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

- [Cadastre-se](https://www.browserbase.com/sign-up) e copie sua **API Key**
  no [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador na conexão WebSocket, então
  não é necessário criar sessão manualmente.
- O plano gratuito permite uma sessão concorrente e uma hora de navegador por mês.
  Consulte [preços](https://www.browserbase.com/pricing) para limites de planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa
  da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente loopback; o acesso flui pela auth do Gateway ou pelo pareamento de node.
- A API HTTP autônoma do navegador em loopback usa **somente auth por segredo compartilhado**:
  auth bearer por token do gateway, `x-openclaw-password` ou auth HTTP Basic com a
  senha configurada do gateway.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` não
  autenticam essa API autônoma de navegador em loopback.
- Se o controle do navegador estiver habilitado e nenhuma auth por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já está em
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts Node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens CDP remotos como Secrets; prefira variáveis de ambiente ou um gerenciador de Secrets.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (multinavegador)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo OpenClaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados do usuário + porta CDP
- **remotos**: uma URL CDP explícita (navegador baseado em Chromium em outro lugar)
- **sessão existente**: seu perfil existente do Chrome via conexão automática pelo Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é interno para conexão existing-session do Chrome MCP.
- Perfis existing-session são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas em **18800–18899** por padrão.
- Excluir um perfil move seu diretório local de dados para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium já em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil interno:

- `user`

Opcional: crie seu próprio perfil customizado existing-session se quiser um
nome, cor ou diretório de dados do navegador diferente.

Comportamento padrão:

- O perfil interno `user` usa conexão automática do Chrome MCP, que aponta para o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil não padrão do Chrome:

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

Como é um resultado bem-sucedido:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista as abas do navegador que você já tem abertas
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador baseado em Chromium de destino está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador exibiu o prompt de consentimento de conexão e você o aceitou
- `openclaw doctor` migra a configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não pode
  habilitar a depuração remota no lado do navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador autenticado do usuário.
- Se usar um perfil existing-session customizado, informe explicitamente esse nome de perfil.
- Escolha esse modo somente quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou host Node pode executar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho é de risco mais alto do que o perfil isolado `openclaw` porque ele pode
  agir dentro da sua sessão autenticada do navegador.
- O OpenClaw não inicia o navegador para esse driver; ele apenas se conecta.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para direcionar esse diretório de dados do usuário.
- Existing-session pode se conectar no host selecionado ou por meio de um
  Node de navegador conectado. Se o Chrome estiver em outro lugar e nenhum browser node estiver conectado, use
  CDP remoto ou um host Node.

### Inicialização customizada do Chrome MCP

Sobrescreva o servidor Chrome DevTools MCP iniciado por perfil quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for o que você deseja (hosts offline,
versões fixadas, binários vendorizados):

| Campo        | O que faz                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a ser iniciado em vez de `npx`. Resolvido como está; caminhos absolutos são respeitados.                         |
| `mcpArgs`    | Array de argumentos passada literalmente para `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` estiver definido em um perfil existing-session, o OpenClaw ignora
`--autoConnect` e encaminha automaticamente o endpoint para o Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descoberta HTTP do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

Flags de endpoint e `userDataDir` não podem ser combinados: quando `cdpUrl` está definido,
`userDataDir` é ignorado na inicialização do Chrome MCP, já que o Chrome MCP se conecta ao
navegador em execução por trás do endpoint em vez de abrir um diretório de
perfil.

<Accordion title="Limitações de recursos de existing-session">

Em comparação com o perfil gerenciado `openclaw`, drivers existing-session são mais limitados:

- **Capturas de tela** — capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` nem `--element`. O Playwright não é necessário para capturas de tela de página ou de elementos baseados em ref.
- **Ações** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis da viewport e não exige ref de snapshot. `click` é apenas com botão esquerdo. `type` não aceita `slowly=true`; use `fill` ou `press`. `press` não aceita `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não aceitam timeouts por chamada. `select` aceita um único valor.
- **Wait / upload / dialog** — `wait --url` aceita padrões exatos, de substring e glob; `wait --load networkidle` não é compatível. Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem CSS `element`. Hooks de diálogo não aceitam sobrescritas de timeout.
- **Recursos exclusivos do modo gerenciado** — ações em lote, exportação em PDF, interceptação de download e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório dedicado de dados do usuário**: nunca toca no perfil do seu navegador pessoal.
- **Portas dedicadas**: evita `9222` para prevenir colisões com fluxos de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna primeiro `suggestedTargetId`, depois
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

Você pode sobrescrever com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: verifica locais comuns de Chrome/Brave/Edge/Chromium em `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Para scripts e depuração, o Gateway expõe uma pequena **API HTTP de controle
somente em loopback** mais uma CLI correspondente `openclaw browser` (snapshots, refs, melhorias de wait,
saída JSON, fluxos de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos de Linux (especialmente Chromium via snap), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para ambientes WSL2 Gateway + Windows Chrome em hosts separados, consulte
[Solução de problemas de WSL2 + Windows + Chrome remoto por CDP](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está saudável.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está saudável, mas um destino de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando um
    serviço CDP externo em loopback é configurado sem `attachOnly: true`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou de abertura de abas falham com erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro solucione a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está saudável. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falharem, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está saudável.

Detalhes importantes do comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF de falha segura mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local em loopback `openclaw`, verificações de integridade do CDP ignoram intencionalmente a aplicação de alcance SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` somente em ambientes intencionalmente confiáveis em que o acesso do navegador à rede privada seja necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso se mapeia:

- `browser snapshot` retorna uma árvore estável da UI (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotulados).
- `browser doctor` verifica prontidão do Gateway, Plugin, perfil, navegador e aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões fora de sandbox usam `host`.
  - Se um Node com capacidade de navegador estiver conectado, a ferramenta pode rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle de navegador em ambientes em sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e endurecimento do controle de navegador

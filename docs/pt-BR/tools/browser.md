---
read_when:
    - Adicionando automação de browser controlada pelo agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do browser no app macOS
summary: Serviço integrado de controle do browser + comandos de ação
title: Browser (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-24T06:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

O OpenClaw pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu browser pessoal e é gerenciado por um pequeno
serviço local de controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nisso como um **browser separado, só para o agente**.
- O perfil `openclaw` **não** mexe no seu perfil pessoal do browser.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil integrado `user` se conecta à sua sessão real do Chrome autenticada via Chrome MCP.

## O que você ganha

- Um perfil de browser separado chamado **openclaw** (destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (click/type/drag/select), snapshots, screenshots, PDFs.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este browser **não** é seu navegador do dia a dia. É uma superfície segura e isolada para
automação e verificação pelo agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de browser
não está disponível, vá para [Missing browser command or tool](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle do Plugin

A ferramenta padrão `browser` é um Plugin empacotado. Desabilite-o para substituí-lo por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões exigem `plugins.entries.browser.enabled` **e** `browser.enabled=true`. Desabilitar apenas o Plugin remove a CLI `openclaw browser`, o método de gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma única unidade; sua configuração `browser.*` permanece intacta para um substituto.

Mudanças de configuração do browser exigem reinício do Gateway para que o Plugin possa registrar novamente seu serviço.

## Comando ou ferramenta de browser ausente

Se `openclaw browser` estiver desconhecido após uma atualização, `browser.request` estiver ausente ou o agente informar que a ferramenta de browser não está disponível, a causa usual é uma lista `plugins.allow` que omite `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem a presença na allowlist — a allowlist controla o carregamento do Plugin, e a política de ferramenta só roda depois do carregamento. Remover `plugins.allow` completamente também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: browser gerenciado e isolado (não requer extensão).
- `user`: perfil integrado de conexão ao Chrome MCP para sua sessão **real do Chrome autenticada**.

Para chamadas da ferramenta de browser do agente:

- Padrão: use o browser isolado `openclaw`.
- Prefira `profile="user"` quando sessões autenticadas existentes importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a sobrescrita explícita quando você quer um modo específico de browser.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do browser ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // aderir apenas para acesso confiável a rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // sobrescrita legada de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP remoto de CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout de handshake WebSocket remoto de CDP (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

- O serviço de controle faz bind em loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Sobrescrever `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas da mesma família.
- Perfis locais `openclaw` atribuem `cdpPort`/`cdpUrl` automaticamente; defina-os apenas para CDP remoto. `cdpUrl` usa por padrão a porta CDP local gerenciada quando não está definido.
- `remoteCdpTimeoutMs` se aplica a verificações HTTP de acessibilidade de CDP remoto (sem loopback); `remoteCdpHandshakeTimeoutMs` se aplica a handshakes WebSocket de CDP remoto.

</Accordion>

<Accordion title="Política de SSRF">

- Navegação de browser e open-tab são protegidos contra SSRF antes da navegação e verificados novamente com melhor esforço na URL final `http(s)` depois.
- No modo estrito de SSRF, descoberta de endpoint remoto de CDP e sondas `/json/version` (`cdpUrl`) também são verificadas.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desabilitado por padrão; habilite apenas quando o acesso do browser à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado.

</Accordion>

<Accordion title="Comportamento de perfil">

- `attachOnly: true` significa nunca iniciar um browser local; apenas conectar se um já estiver em execução.
- `color` (nível superior e por perfil) colore a UI do browser para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (gerenciado e independente). Use `defaultProfile: "user"` para aderir ao browser autenticado do usuário.
- Ordem de autodetecção: browser padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session precisar se conectar a um perfil de usuário Chromium que não seja o padrão (Brave, Edge etc.).

</Accordion>

</AccordionGroup>

## Use Brave (ou outro browser baseado em Chromium)

Se o **browser padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para sobrescrever
a autodetecção:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um browser local.
- **Controle remoto (host de node):** execute um host de node na máquina que tem o browser; o Gateway faz proxy das ações do browser para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  conectar a um browser remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um browser local.

O comportamento de parada difere por modo de perfil:

- perfis gerenciados locais: `openclaw browser stop` interrompe o processo do browser que
  o OpenClaw iniciou
- perfis attach-only e CDP remoto: `openclaw browser stop` fecha a sessão ativa
  de controle e libera sobrescritas de emulação de Playwright/CDP (viewport,
  esquema de cores, locale, timezone, modo offline e estados semelhantes), mesmo
  que nenhum processo de browser tenha sido iniciado pelo OpenClaw

URLs remotas de CDP podem incluir autenticação:

- Tokens de query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket de CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de fazer commit deles em arquivos de configuração.

## Proxy de browser de node (zero-config padrão)

Se você executar um **host de node** na máquina que tem o browser, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de browser para esse node sem nenhuma configuração extra de browser.
Este é o caminho padrão para gateways remotos.

Observações:

- O host de node expõe seu servidor local de controle do browser por um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de privilégio mínimo: apenas perfis na allowlist podem ser usados como alvo, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desabilite se não quiser isso:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer uma das formas, mas
para um perfil remoto de browser a opção mais simples é a URL WebSocket direta
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
- Escolha o endpoint de região que corresponda à sua conta do Browserless (consulte a documentação deles).
- Se o Browserless fornecer uma base URL HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Provedores CDP WebSocket diretos

Alguns serviços de browser hospedado expõem um endpoint **WebSocket direto** em vez da
descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL de CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL WebSocket do depurador e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  `/json/version` completamente.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a
  descoberta HTTP `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele é usado; caso contrário o OpenClaw
  usa fallback para um handshake WebSocket direto na raiz simples. Isso permite que um
  `ws://` simples apontado para um Chrome local ainda se conecte, já que o Chrome só
  aceita upgrades WebSocket no caminho específico por alvo retornado por
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
browsers headless com resolução integrada de CAPTCHA, modo stealth e
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
  no [dashboard Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de browser ao conectar por WebSocket, então não
  é necessária nenhuma etapa manual de criação de sessão.
- O plano gratuito permite uma sessão simultânea e uma hora de browser por mês.
  Consulte [pricing](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa da
  API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do browser é apenas em loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento de node.
- A API HTTP autônoma do browser em loopback usa **apenas autenticação por segredo compartilhado**:
  autenticação bearer por token do gateway, `x-openclaw-password` ou HTTP Basic auth com a
  senha configurada do gateway.
- Headers de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API autônoma de browser em loopback.
- Se o controle do browser estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já está
  como `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite embutir tokens de longa duração diretamente em arquivos de configuração.

## Perfis (multi-browser)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciado pelo OpenClaw**: uma instância dedicada de browser baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (browser baseado em Chromium executando em outro lugar)
- **sessão existente**: seu perfil existente do Chrome por conexão automática com Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão existing-session via Chrome MCP.
- Perfis existing-session são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Existing-session via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil já em execução de browser baseado em Chromium por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos naquele perfil de browser.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado existing-session se quiser um
nome, cor ou diretório de dados de browser diferentes.

Comportamento padrão:

- O perfil integrado `user` usa conexão automática do Chrome MCP, que tem como alvo o
  perfil padrão local do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil Chrome que não seja o padrão:

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

Depois, no browser correspondente:

1. Abra a página de inspeção desse browser para depuração remota.
2. Habilite a depuração remota.
3. Mantenha o browser em execução e aprove o prompt de conexão quando o OpenClaw se conectar.

Páginas comuns de inspeção:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test de conexão ao vivo:

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
- `tabs` lista as abas já abertas no seu browser
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o browser baseado em Chromium de destino é versão `144+`
- a depuração remota está habilitada na página de inspeção desse browser
- o browser exibiu e você aceitou o prompt de consentimento de conexão
- `openclaw doctor` migra configuração antiga de browser baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não consegue
  habilitar a depuração remota no lado do browser por você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado autenticado do browser do usuário.
- Se usar um perfil existing-session personalizado, passe esse nome de perfil explícito.
- Escolha esse modo apenas quando o usuário estiver no computador para aprovar o prompt
  de conexão.
- o Gateway ou host de node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho tem risco maior do que o perfil isolado `openclaw`, porque ele pode
  agir dentro da sua sessão autenticada do browser.
- O OpenClaw não inicia o browser para esse driver; ele apenas se conecta.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para direcionar aquele diretório de dados do usuário.
- Existing-session pode se conectar no host selecionado ou por meio de um
  browser node conectado. Se o Chrome estiver em outro lugar e nenhum browser node estiver conectado, use
  CDP remoto ou um host de node.

<Accordion title="Limitações de recurso do existing-session">

Comparados ao perfil gerenciado `openclaw`, drivers existing-session são mais limitados:

- **Screenshots** — capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não funcionam. `--full-page` não pode ser combinado com `--ref` ou `--element`. Playwright não é necessário para screenshots de página ou elemento baseadas em ref.
- **Ações** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click` é apenas com botão esquerdo. `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não oferecem suporte a timeouts por chamada. `select` aceita um único valor.
- **Wait / upload / dialog** — `wait --url` oferece suporte a padrões exatos, substring e glob; `wait --load networkidle` não é compatível. Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Hooks de dialog não oferecem suporte a sobrescritas de timeout.
- **Recursos apenas gerenciados** — ações em lote, exportação PDF, interceptação de download e `responsebody` ainda exigem o caminho de browser gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca toca no seu perfil pessoal do browser.
- **Portas dedicadas**: evita `9222` para prevenir conflitos com fluxos de desenvolvimento.
- **Controle determinístico de abas**: direciona abas por `targetId`, não por “última aba”.

## Seleção de browser

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode sobrescrever com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura `google-chrome`, `brave`, `microsoft-edge`, `chromium` etc.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Para scripting e depuração, o Gateway expõe uma pequena **API HTTP somente loopback**
mais uma CLI correspondente `openclaw browser` (snapshots, refs, recursos extras de wait,
saída JSON, fluxos de depuração). Consulte
[Browser control API](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente Chromium via snap), consulte
[Browser troubleshooting](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações com Gateway no WSL2 + Chrome no Windows em hosts separados, consulte
[WSL2 + Windows + remote Chrome CDP troubleshooting](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do browser está saudável.
- **Bloqueio SSRF de navegação** significa que o plano de controle do browser está saudável, mas um alvo de navegação de página foi rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou abertura de aba falham com um erro de política de browser/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, depure primeiro a prontidão do CDP.
- Se `start` tiver sucesso mas `tabs` falhar, o plano de controle ainda está inválido. Trate isso como um problema de acessibilidade de CDP, não de navegação de página.
- Se `start` e `tabs` tiverem sucesso mas `open` ou `navigate` falhar, o plano de controle do browser está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do browser gerenciado está saudável.

Detalhes importantes do comportamento:

- A configuração do browser usa por padrão um objeto de política SSRF fail-closed, mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local `openclaw` em loopback, verificações de saúde do CDP ignoram intencionalmente a aplicação de acessibilidade SSRF do browser para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um alvo posterior de `open` ou `navigate` será permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do browser por padrão.
- Prefira exceções estreitas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis onde o acesso do browser à rede privada seja necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como ela se mapeia:

- `browser snapshot` retorna uma árvore de UI estável (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para click/type/drag/select.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de browser nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o browser vive.
  - Em sessões com sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões com sandbox usam por padrão `sandbox`, sessões sem sandbox usam por padrão `host`.
  - Se um node com capacidade de browser estiver conectado, a ferramenta pode rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Tools Overview](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle de browser em ambientes com sandbox
- [Security](/pt-BR/gateway/security) — riscos e hardening do controle de browser

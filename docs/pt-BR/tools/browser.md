---
read_when:
    - Adicionando automação de navegador controlada por agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações do navegador + ciclo de vida no app macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:13:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e gerenciado por um pequeno serviço local
de controle dentro do Gateway (apenas loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, exclusivo do agente**.
- O perfil `openclaw` **não** toca no seu perfil pessoal do navegador.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma via segura.
- O perfil integrado `user` se conecta à sua sessão real do Chrome com login via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (acento laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Uma skill `browser-automation` incluída que ensina aos agentes o loop de recuperação de snapshot,
  aba estável, ref obsoleta e bloqueador manual quando o Plugin de navegador
  está habilitado.
- Suporte opcional a múltiplos perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é seu navegador diário. Ele é uma superfície segura e isolada para
automação e verificação por agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber "Navegador desabilitado", habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de navegador
está indisponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle do Plugin

A ferramenta `browser` padrão é um Plugin incluído. Desabilite-a para substituí-la por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões precisam de `plugins.entries.browser.enabled` **e** `browser.enabled=true`. Desabilitar apenas o Plugin remove a CLI `openclaw browser`, o método Gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem uma reinicialização do Gateway para que o Plugin possa registrar novamente seu serviço.

## Orientação do agente

Observação sobre perfil de ferramenta: `tools.profile: "coding"` inclui `web_search` e
`web_fetch`, mas não inclui a ferramenta `browser` completa. Se o agente ou um
subagente gerado deve usar automação de navegador, adicione o navegador na etapa
de perfil:

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
é aplicada após a filtragem de perfil.

O Plugin de navegador fornece dois níveis de orientação ao agente:

- A descrição da ferramenta `browser` carrega o contrato compacto sempre ativo: escolher
  o perfil certo, manter refs na mesma aba, usar `tabId`/rótulos para direcionamento de abas
  e carregar a skill de navegador para trabalho em várias etapas.
- A skill `browser-automation` incluída carrega o loop operacional mais longo:
  verificar status/abas primeiro, rotular abas da tarefa, fazer snapshot antes de agir, refazer snapshot
  após mudanças na UI, recuperar refs obsoletas uma vez e relatar login/2FA/captcha ou
  bloqueadores de câmera/microfone como ação manual em vez de adivinhar.

Skills incluídas pelo Plugin são listadas nas Skills disponíveis do agente quando o
Plugin está habilitado. As instruções completas da skill são carregadas sob demanda, portanto turnos
rotineiros não pagam o custo total de tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após uma atualização, `browser.request` estiver ausente, ou o agente relatar que a ferramenta de navegador está indisponível, a causa usual é uma lista `plugins.allow` que omite `browser` e não existe nenhum bloco raiz de configuração `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Um bloco raiz explícito `browser`, por exemplo `browser.enabled=true` ou `browser.profiles.<name>`, ativa o Plugin de navegador incluído mesmo sob um `plugins.allow` restritivo, correspondendo ao comportamento de configuração de canais. `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem por si só a participação na lista de permissões. Remover `plugins.allow` totalmente também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (nenhuma extensão exigida).
- `user`: perfil integrado de conexão Chrome MCP para sua sessão **real do Chrome com login**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões existentes com login importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo específico de navegador.

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

### Visão de captura de tela (suporte a modelo somente texto)

Quando o modelo principal é somente texto (sem suporte a visão/multimodal), capturas de tela
do navegador retornam blocos de imagem que o modelo não consegue ler. Capturas de tela do navegador
reutilizam a configuração existente de compreensão de imagens, para que um modelo de imagem
configurado para compreensão de mídia possa descrever capturas de tela como texto sem nenhuma
configuração de modelo específica para navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Como funciona:**

1. O agente chama `browser screenshot` → a imagem é capturada em disco como de costume.
2. A ferramenta de navegador pergunta ao runtime existente de compreensão de imagens se ele
   pode descrever a captura de tela usando modelos de imagem de mídia configurados, modelos de mídia
   compartilhados, padrões de modelos de imagem ou um provedor de imagem com autenticação.
3. O modelo de visão retorna uma descrição textual, que é encapsulada com
   `wrapExternalContent` (proteção contra injeção de prompt) e retornada ao agente
   como um bloco de texto em vez de um bloco de imagem.
4. Se a compreensão de imagem estiver indisponível, for ignorada ou falhar, o navegador volta
   a retornar o bloco de imagem original.

Use os campos existentes `tools.media.image` / `tools.media.models` para fallbacks de modelo,
timeouts, limites de bytes, perfis e configurações de requisição do provedor.

Se o modelo principal ativo já oferecer suporte a visão e nenhum modelo explícito de
compreensão de imagem estiver configurado, o OpenClaw mantém o resultado normal de imagem para que o
modelo principal possa ler a captura de tela diretamente.

<AccordionGroup>

<Accordion title="Portas e acessibilidade">

- O serviço de controle se vincula ao loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Substituir `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas na mesma família.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses apenas para
  perfis CDP remotos ou conexão de endpoint de sessão existente. `cdpUrl` usa por padrão
  a porta CDP local gerenciada quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de acessibilidade HTTP CDP remotas e `attachOnly`
  e a requisições HTTP de abertura de abas; `remoteCdpHandshakeTimeoutMs` se aplica aos
  handshakes WebSocket CDP delas.
- `localLaunchTimeoutMs` é o orçamento para um processo Chrome gerenciado iniciado localmente
  expor seu endpoint HTTP CDP. `localCdpReadyTimeoutMs` é o
  orçamento seguinte para prontidão do websocket CDP depois que o processo é descoberto.
  Aumente esses valores no Raspberry Pi, VPS de baixo custo ou hardware mais antigo onde o Chromium
  inicia lentamente. Os valores devem ser inteiros positivos até `120000` ms; valores de
  configuração inválidos são rejeitados.
- Falhas repetidas de inicialização/prontidão do Chrome gerenciado são interrompidas por circuito por
  perfil. Após várias falhas consecutivas, o OpenClaw pausa brevemente novas tentativas de
  inicialização em vez de gerar o Chromium em cada chamada de ferramenta de navegador. Corrija
  o problema de inicialização, desabilite o navegador se ele não for necessário ou reinicie o
  Gateway após o reparo.
- `actionTimeoutMs` é o orçamento padrão para requisições `act` do navegador quando o chamador não passa `timeoutMs`. O transporte cliente adiciona uma pequena janela de folga para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza de melhor esforço para abas abertas por sessões de navegador do agente primário. A limpeza de ciclo de vida de subagente, Cron e ACP ainda fecha suas abas rastreadas explicitamente ao fim da sessão; sessões primárias mantêm abas ativas reutilizáveis e depois fecham abas rastreadas ociosas ou excedentes em segundo plano.

</Accordion>

<Accordion title="Política SSRF">

- A navegação do navegador e a abertura de abas são protegidas contra SSRF antes da navegação e verificadas novamente com melhor esforço na URL `http(s)` final depois.
- No modo SSRF estrito, a descoberta de endpoint CDP remoto e as sondagens de `/json/version` (`cdpUrl`) também são verificadas.
- As variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não aplicam proxy automaticamente ao navegador gerenciado pelo OpenClaw. O Chrome gerenciado inicia diretamente por padrão, para que as configurações de proxy do provedor não enfraqueçam as verificações de SSRF do navegador.
- As sondagens de prontidão CDP local gerenciadas pelo OpenClaw e as conexões WebSocket do DevTools ignoram o proxy de rede gerenciado para o endpoint local loopback exato iniciado, então `openclaw browser start` ainda funciona quando um proxy de operador bloqueia a saída de loopback.
- Para aplicar proxy ao próprio navegador gerenciado, passe flags explícitas de proxy do Chrome por `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo SSRF estrito bloqueia o roteamento de proxy explícito do navegador, a menos que o acesso do navegador à rede privada seja habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado por padrão; habilite apenas quando o acesso do navegador à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua com suporte como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas anexar se já houver um em execução.
- `headless` pode ser definido globalmente ou por perfil gerenciado local. Valores por perfil substituem `browser.headless`, então um perfil iniciado localmente pode permanecer headless enquanto outro continua visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam uma
  inicialização headless única para perfis gerenciados locais sem reescrever
  `browser.headless` ou a configuração do perfil. Sessões existentes, attach-only e
  perfis CDP remotos rejeitam a substituição porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, perfis gerenciados locais
  passam automaticamente para headless quando nem o ambiente nem a configuração
  de perfil/global escolhem explicitamente o modo com interface. `openclaw browser status --json`
  relata `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inicializações gerenciadas locais em headless para o
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força o modo com interface para inicializações
  comuns e retorna um erro acionável em hosts Linux sem servidor de display;
  uma solicitação explícita `start --headless` ainda prevalece para essa inicialização.
- `executablePath` pode ser definido globalmente ou por perfil gerenciado local. Valores por perfil substituem `browser.executablePath`, então diferentes perfis gerenciados podem iniciar diferentes navegadores baseados em Chromium. Ambas as formas aceitam `~` para o diretório inicial do seu SO.
- `color` (nível superior e por perfil) tinge a UI do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (standalone gerenciado). Use `defaultProfile: "user"` para optar pelo navegador do usuário com sessão iniciada.
- Ordem de detecção automática: navegador padrão do sistema se for baseado em Chromium; caso contrário, Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa o MCP do Chrome DevTools em vez de CDP bruto. Ele pode anexar por conexão automática do Chrome MCP ou por `cdpUrl` quando você já tem um endpoint DevTools para o navegador em execução.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session deve se anexar a um perfil de usuário Chromium não padrão (Brave, Edge etc.). Esse caminho também aceita `~` para o diretório inicial do seu SO.

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

`executablePath` por perfil afeta apenas perfis gerenciados locais que o OpenClaw
inicia. Perfis `existing-session` se anexam a um navegador já em execução
em vez disso, e perfis CDP remotos usam o navegador por trás de `cdpUrl`.

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle de loopback e pode iniciar um navegador local.
- **Controle remoto (host de nó):** execute um host de nó na máquina que tem o navegador; o Gateway encaminha ações do navegador para ele por proxy.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  anexar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- Para serviços CDP gerenciados externamente em loopback (por exemplo, Browserless em
  Docker publicado em `127.0.0.1`), defina também `attachOnly: true`. CDP em loopback
  sem `attachOnly` é tratado como um perfil de navegador gerenciado localmente pelo OpenClaw.
- `headless` afeta apenas perfis gerenciados locais que o OpenClaw inicia. Ele não reinicia nem altera navegadores existing-session ou CDP remotos.
- `executablePath` segue a mesma regra de perfil gerenciado local. Alterá-lo em um
  perfil gerenciado local em execução marca esse perfil para reinicialização/reconciliação, para que a
  próxima inicialização use o novo binário.

O comportamento de parada difere por modo de perfil:

- perfis gerenciados locais: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis attach-only e CDP remotos: `openclaw browser stop` fecha a sessão de
  controle ativa e libera substituições de emulação Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens de consulta (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de confirmá-los em arquivos de configuração.

## Proxy de navegador do Node (padrão sem configuração)

Se você executa um **host de nó** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas de ferramentas do navegador para esse nó sem qualquer configuração extra do navegador.
Este é o caminho padrão para gateways remotos.

Observações:

- O host de nó expõe seu servidor local de controle de navegador por um **comando de proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do nó (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy, incluindo rotas de criação/exclusão de perfis.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de menor privilégio: apenas perfis na lista de permissões podem ser alvo, e rotas persistentes de criação/exclusão de perfis são bloqueadas na superfície de proxy.
- Desabilite se não quiser:
  - No nó: `nodeHost.browserProxy.enabled=false`
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
- Escolha o endpoint de região que corresponde à sua conta Browserless (consulte a documentação deles).
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

O endereço em `browser.profiles.browserless.cdpUrl` deve ser acessível pelo
processo OpenClaw. O Browserless também deve anunciar um endpoint acessível correspondente;
defina `EXTERNAL` do Browserless para a mesma base WebSocket pública para o OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` ou um endereço estável de rede Docker
privada. Se `/json/version` retornar `webSocketDebuggerUrl` apontando para
um endereço que o OpenClaw não consegue alcançar, o HTTP CDP pode parecer saudável enquanto o anexo
WebSocket ainda falha.

Não deixe `attachOnly` indefinido para um perfil Browserless em loopback. Sem
`attachOnly`, o OpenClaw trata a porta de loopback como um perfil de navegador
gerenciado localmente e pode relatar que a porta está em uso, mas não pertence ao OpenClaw.

## Provedores CDP WebSocket diretos

Alguns serviços de navegador hospedados expõem um endpoint **WebSocket direto** em vez de
descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** - `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** - `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  `/json/version` por completo.
- **Raízes WebSocket simples** - `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  de `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Se o endpoint
  WebSocket anunciado rejeitar o handshake CDP, mas a raiz simples configurada
  aceitá-lo, o OpenClaw também recorre a essa raiz. Isso permite que uma raiz `ws://`
  apontada para um Chrome local ainda se conecte, já que o Chrome só aceita upgrades WebSocket
  no caminho específico por destino de `/json/version`, enquanto provedores hospedados
  ainda podem usar seu endpoint WebSocket raiz quando seu endpoint de descoberta
  anuncia uma URL de curta duração que não é adequada para CDP do Playwright.

`openclaw browser doctor` usa a mesma lógica de descoberta primeiro e fallback
para WebSocket que o anexo em runtime, então uma URL de raiz simples que se conecta com sucesso não é
relatada como inacessível pelos diagnósticos.

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
- O Browserbase cria automaticamente uma sessão de navegador na conexão WebSocket, então nenhuma
  etapa manual de criação de sessão é necessária.
- O nível gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Consulte [preços](https://www.browserbase.com/pricing) para ver os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa da API,
  guias de SDK e exemplos de integração.

### Notte

[Notte](https://www.notte.cc) é uma plataforma em nuvem para executar navegadores
headless com stealth integrado, proxies residenciais e um Gateway WebSocket
nativo de CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Observações:

- [Cadastre-se](https://console.notte.cc) e copie sua **API Key** na
  página de configurações do console.
- Substitua `<NOTTE_API_KEY>` pela sua chave de API real do Notte.
- O Notte cria automaticamente uma sessão de navegador na conexão WebSocket, então nenhuma etapa
  manual de criação de sessão é necessária. A sessão é destruída quando o
  WebSocket se desconecta.
- O nível gratuito permite cinco sessões simultâneas e 100 horas vitalícias de
  navegador. Consulte [preços](https://www.notte.cc/#pricing) para ver os limites dos planos pagos.
- Consulte a [documentação do Notte](https://docs.notte.cc) para a referência completa da API, guias de SDK
  e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente local loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento de Node.
- A API HTTP autônoma de navegador local loopback usa **somente autenticação por segredo compartilhado**:
  autenticação bearer por token do Gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha configurada do Gateway.
- Os cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API autônoma de navegador local loopback.
- Se o controle do navegador estiver ativado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gerará um token de Gateway somente de runtime para essa inicialização. Configure
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou
  `OPENCLAW_GATEWAY_PASSWORD` explicitamente se os clientes precisarem de um segredo estável entre
  reinicializações.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já é
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de Node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração sempre que possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (vários navegadores)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo OpenClaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remotos**: uma URL CDP explícita (navegador baseado em Chromium em execução em outro lugar)
- **sessão existente**: seu perfil existente do Chrome via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para anexação a sessão existente do Chrome MCP.
- Perfis de sessão existente são opcionais além de `user`; crie-os com `--driver existing-session`.
- As portas CDP locais são alocadas de **18800-18899** por padrão.
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
nome, cor ou diretório de dados de navegador diferente.

Comportamento padrão:

- O perfil integrado `user` usa a conexão automática do Chrome MCP, que aponta para o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil não padrão do Chrome.
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

Depois, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Ative a depuração remota.
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
- `tabs` lista suas abas de navegador já abertas
- `snapshot` retorna refs da aba ao vivo selecionada

O que verificar se a anexação não funcionar:

- o navegador de destino baseado em Chromium está na versão `144+`
- a depuração remota está ativada na página de inspeção desse navegador
- o navegador mostrou e você aceitou o prompt de consentimento de anexação
- se o Chrome foi iniciado com um `--remote-debugging-port` explícito, defina
  `browser.profiles.<name>.cdpUrl` para esse endpoint DevTools em vez de depender
  da conexão automática do Chrome MCP
- `openclaw doctor` migra a configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não consegue
  ativar a depuração remota no lado do navegador para você

Uso por agente:

- Use `profile="user"` quando precisar do estado de navegador autenticado do usuário.
- Se você usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha este modo apenas quando o usuário estiver no computador para aprovar o prompt
  de anexação.
- o Gateway ou host de Node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Este caminho tem risco maior do que o perfil isolado `openclaw`, porque pode
  agir dentro da sua sessão de navegador autenticada.
- O OpenClaw não inicia o navegador para este driver; ele apenas se anexa.
- O OpenClaw usa o fluxo oficial `--autoConnect` do Chrome DevTools MCP aqui. Se
  `userDataDir` estiver definido, ele será repassado para apontar para esse diretório de dados de usuário.
- Sessão existente pode se anexar no host selecionado ou por meio de um
  Node de navegador conectado. Se o Chrome estiver em outro lugar e nenhum Node de navegador estiver conectado, use
  CDP remoto ou um host de Node em vez disso.

### Inicialização personalizada do Chrome MCP

Substitua o servidor Chrome DevTools MCP iniciado por perfil quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for o que você quer (hosts offline,
versões fixadas, binários vendorizados):

| Campo        | O que faz                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a iniciar em vez de `npx`. Resolvido como está; caminhos absolutos são respeitados.                                          |
| `mcpArgs`    | Array de argumentos passado literalmente para `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` é definido em um perfil de sessão existente, o OpenClaw ignora
`--autoConnect` e encaminha o endpoint para o Chrome MCP automaticamente:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descoberta HTTP do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

Flags de endpoint e `userDataDir` não podem ser combinados: quando `cdpUrl` está definido,
`userDataDir` é ignorado para a inicialização do Chrome MCP, pois o Chrome MCP se anexa ao
navegador em execução por trás do endpoint em vez de abrir um diretório de
perfil.

<Accordion title="Limitações do recurso de sessão existente">

Em comparação com o perfil gerenciado `openclaw`, drivers de sessão existente são mais restritos:

- **Capturas de tela** - capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` ou `--element`. Playwright não é necessário para capturas de tela de página ou de elemento baseadas em ref.
- **Ações** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis do viewport e não exige uma ref de snapshot. `click` é apenas com o botão esquerdo. `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não oferecem suporte a timeouts por chamada. `select` aceita um único valor.
- **Espera / upload / diálogo** - `wait --url` oferece suporte a padrões exatos, de substring e glob; `wait --load networkidle` não é compatível com perfis de sessão existente (funciona em perfis gerenciados e CDP bruto/remoto). Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Hooks de diálogo não oferecem suporte a substituições de timeout nem a `dialogId`.
- **Visibilidade de diálogo** - Respostas de ação de navegador gerenciado incluem `blockedByDialog` e `browserState.dialogs.pending` quando uma ação abre uma caixa de diálogo modal; snapshots também incluem estado de diálogo pendente. Responda com `browser dialog --accept/--dismiss --dialog-id <id>` enquanto um diálogo estiver pendente. Diálogos tratados fora do OpenClaw aparecem em `browserState.dialogs.recent`.
- **Recursos somente gerenciados** - ações em lote, exportação de PDF, interceptação de download e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca toca no seu perfil pessoal de navegador.
- **Portas dedicadas**: evita `9222` para impedir colisões com fluxos de trabalho de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna `suggestedTargetId` primeiro, depois
  identificadores `tabId` estáveis, como `t1`, rótulos opcionais e o `targetId` bruto.
  Agentes devem reutilizar `suggestedTargetId`; ids brutos permanecem disponíveis para
  depuração e compatibilidade.

## Seleção de navegador

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

Para scripting e depuração, o Gateway expõe uma pequena **API HTTP de controle
somente local loopback**, além de uma CLI `openclaw browser` correspondente (snapshots, refs, power-ups de espera,
saída JSON, fluxos de trabalho de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente snap Chromium), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações WSL2 Gateway + Windows Chrome com hosts separados, consulte
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio de SSRF de navegação

Estas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio de SSRF de navegação** significa que o plano de controle do navegador está íntegro, mas um destino de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando um
    serviço CDP externo de local loopback está configurado sem `attachOnly: true`
- Bloqueio de SSRF de navegação:
  - Fluxos de `open`, `navigate`, snapshot ou abertura de abas falham com um erro de política do navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, solucione primeiro a prontidão do CDP.
- Se `start` tiver êxito, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de alcançabilidade do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem êxito, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem êxito, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes de comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed, mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado `openclaw` de local loopback, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcançabilidade SSRF do navegador para o plano de controle local próprio do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** flexibilize a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis onde o acesso do navegador à rede privada seja necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como ela é mapeada:

- `browser snapshot` retorna uma árvore de UI estável (IA ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotulados).
- `browser doctor` verifica a prontidão de Gateway, Plugin, perfil, navegador e aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador reside.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões sem sandbox usam `host` por padrão.
  - Se um nó compatível com navegador estiver conectado, a ferramenta poderá rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) - controle do navegador em ambientes em sandbox
- [Segurança](/pt-BR/gateway/security) - riscos e hardening do controle do navegador

---
read_when:
    - Adicionando automação de navegador controlada pelo agente
    - Depurando por que o OpenClaw está interferindo no seu próprio Chrome
    - Implementação das configurações e do ciclo de vida do navegador no aplicativo para macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-07-12T15:43:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

O OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** controlado pelo agente. Ele é executado por meio de um pequeno serviço de controle local dentro do Gateway (somente loopback) e fica isolado do seu navegador pessoal.

- Pense nele como um **navegador separado, exclusivo para o agente**. O perfil `openclaw` nunca acessa o perfil do seu navegador pessoal.
- O agente abre abas, lê páginas, clica e digita nesse ambiente isolado.
- Em vez disso, o perfil integrado `user` se conecta à sua sessão real do Chrome já autenticada, por meio do Chrome DevTools MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela e PDFs.
- Perfis baseados no Playwright salvam navegações diretas para anexos no diretório gerenciado de downloads e retornam metadados `{ url, suggestedFilename, path }` após a validação da política da URL final.
- Ações do agente baseadas no Playwright retornam um array `downloads` com os mesmos metadados gerenciados quando a ação inicia imediatamente um ou mais downloads.
- Uma skill `browser-automation` incluída que ensina aos agentes o ciclo de recuperação de snapshot,
  aba estável, referência obsoleta e bloqueio manual quando o Plugin de navegador
  está habilitado.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é seu navegador de uso diário. Ele é um ambiente seguro e isolado para
automação e verificação pelo agente.

No macOS, você pode copiar explicitamente cookies de um perfil de sistema da família Chrome para um perfil gerenciado separado. O navegador gerenciado ainda usa seu próprio diretório de dados do usuário; somente os cookies selecionados são copiados, enquanto o armazenamento local e o IndexedDB não são copiados. Consulte [Perfis](#profiles-multi-browser) ou a [referência da CLI `openclaw browser`](/pt-BR/cli/browser) para ver os comandos de importação e as limitações.

## Início rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Navegador desabilitado" significa que o Plugin ou `browser.enabled` está desativado; consulte
[Configuração](#configuration) e [Controle do Plugin](#plugin-control).

Se `openclaw browser` estiver totalmente ausente ou o agente informar que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](#missing-browser-command-or-tool).

## Controle do Plugin

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

Os padrões precisam tanto de `plugins.entries.browser.enabled` **quanto de** `browser.enabled=true`. Desabilitar apenas o Plugin remove a CLI `openclaw browser`, o método `browser.request` do Gateway, a ferramenta do agente e o serviço de controle como uma única unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Alterações na configuração do navegador exigem a reinicialização do Gateway para que o Plugin possa registrar novamente seu serviço.

## Orientações para o agente

Observação sobre o perfil de ferramentas: `tools.profile: "coding"` inclui `web_search` e
`web_fetch`, mas não a ferramenta `browser` completa. Para permitir que o agente ou um
subagente criado use a automação do navegador, adicione o navegador na etapa do
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
`tools.subagents.tools.allow: ["browser"]` por si só não é suficiente, pois a política do subagente
é aplicada após a filtragem do perfil.

O Plugin de navegador fornece dois níveis de orientação para o agente:

- A descrição da ferramenta `browser` contém o contrato compacto sempre ativo: escolha
  o perfil correto, mantenha as referências na mesma aba, use `tabId`/rótulos para direcionar
  a aba e carregue a skill de navegador para trabalhos com várias etapas.
- A skill `browser-automation` incluída contém o ciclo operacional mais detalhado:
  verifique primeiro o status/as abas, rotule as abas da tarefa, gere um snapshot antes de agir, gere outro snapshot
  após alterações na interface, recupere referências obsoletas uma vez e informe bloqueios de login/2FA/captcha ou
  câmera/microfone como uma ação manual, em vez de tentar adivinhar.

As skills incluídas no Plugin aparecem nas skills disponíveis do agente quando o
Plugin está habilitado. As instruções completas da skill são carregadas sob demanda, portanto as interações
rotineiras não pagam o custo total de tokens.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` não for reconhecido após uma atualização, `browser.request` estiver ausente ou o agente informar que a ferramenta de navegador não está disponível, a causa habitual é uma lista `plugins.allow` que omite `browser` e a ausência de um bloco raiz de configuração `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Um bloco raiz explícito `browser` (qualquer chave em `browser`, como
`browser.enabled=true` ou `browser.profiles.<name>`) ativa o Plugin de navegador
incluído mesmo com uma configuração restritiva de `plugins.allow`, correspondendo ao comportamento da configuração
dos canais incluídos. `plugins.entries.browser.enabled=true` e
`tools.alsoAllow: ["browser"]` não substituem, por si só, a inclusão na lista de permissões.
Remover completamente `plugins.allow` também restaura o padrão.

## Perfis: `openclaw`, `user`, `chrome`

- `openclaw`: navegador gerenciado e isolado (nenhuma extensão necessária).
- `user`: perfil integrado de conexão do Chrome DevTools MCP para sua sessão **real
  e autenticada do Chrome**. O Chrome exibe uma solicitação bloqueante "Allow remote debugging?"
  na primeira vez que o OpenClaw se conecta, portanto alguém precisa estar diante do computador.
- `chrome`: perfil integrado da [extensão do Chrome](/tools/chrome-extension) para
  sua sessão **real e autenticada do Chrome**. Funciona a partir de um celular sem ninguém diante do
  computador, pois controla as abas por meio da extensão de navegador do OpenClaw em vez da
  porta de depuração remota, portanto não há solicitação "Allow remote debugging?".

Para chamadas da ferramenta de navegador pelo agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="chrome"` (extensão) quando as sessões autenticadas existentes forem importantes
  e o usuário estiver **longe do computador** (Telegram, WhatsApp etc.).
- Prefira `profile="user"` (Chrome MCP) quando as sessões autenticadas existentes forem importantes
  e o usuário estiver **diante do computador** para aprovar a solicitação de conexão.
- `profile` é a substituição explícita quando você deseja um modo de navegador específico.

Defina `browser.defaultProfile: "openclaw"` se quiser usar o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    evaluateEnabled: true, // padrão: true; false desabilita act:evaluate (JS arbitrário)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilite apenas para acesso confiável à rede privada
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada para perfil único
    remoteCdpTimeoutMs: 1500, // tempo limite HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tempo limite do handshake WebSocket do CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tempo limite da descoberta local do Chrome gerenciado (ms)
    localCdpReadyTimeoutMs: 8000, // tempo limite de prontidão do CDP local após a inicialização gerenciada (ms)
    actionTimeoutMs: 60000, // tempo limite padrão da ação do navegador (ms)
    tabCleanup: {
      enabled: true, // padrão: true
      idleMinutes: 120, // defina como 0 para desabilitar a limpeza por inatividade
      maxTabsPerSession: 8, // defina como 0 para desabilitar o limite por sessão
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // modo padrão de snapshot quando o chamador omite um
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

`browser.snapshotDefaults.mode: "efficient"` altera o modo de extração padrão de `snapshot`
quando um chamador não fornece um `snapshotFormat` ou `mode` explícito; consulte a
[API de controle do navegador](/pt-BR/tools/browser-control) para ver as opções de snapshot por chamada.

### Visão de capturas de tela (suporte a modelos somente de texto)

Quando o modelo principal é somente de texto (sem suporte a visão/multimodal), as
capturas de tela do navegador retornam blocos de imagem que o modelo não consegue ler. As capturas de tela do navegador
reutilizam a configuração existente de compreensão de imagens, portanto um modelo de imagem
configurado para compreensão de mídia pode descrever as capturas de tela como texto sem nenhuma
configuração de modelo específica do navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Adicione candidatos de fallback; o primeiro sucesso prevalece
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Modelos de mídia compartilhados também funcionam quando marcados para suporte a imagens.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Os padrões existentes do modelo de imagem também são respeitados.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Como funciona:**

1. O agente chama `browser screenshot` e uma imagem é capturada no disco como de costume.
2. A ferramenta de navegador pergunta ao runtime existente de compreensão de imagens se ele
   pode descrever a captura de tela usando modelos de imagem de mídia configurados, modelos de mídia
   compartilhados, padrões de modelo de imagem ou um provedor de imagens respaldado por autenticação.
3. O modelo de visão retorna uma descrição em texto, que é encapsulada com
   `wrapExternalContent` (proteção contra injeção de prompt) e retornada ao agente
   como um bloco de texto em vez de um bloco de imagem.
4. Se a compreensão de imagens não estiver disponível, for ignorada ou falhar, o navegador
   volta a retornar o bloco de imagem original.

Os blocos de imagem das capturas de tela são resultados privados da ferramenta: o agente pode inspecioná-los,
mas o OpenClaw não os anexa automaticamente às respostas dos canais. Para compartilhar uma
captura de tela, peça ao agente que a envie explicitamente com a ferramenta de mensagens.

Use os campos existentes `tools.media.image` / `tools.media.models` para fallbacks de
modelos, tempos limite, limites de bytes, perfis e configurações de solicitação do provedor.

Se o modelo principal ativo já oferecer suporte a visão e nenhum modelo explícito de
compreensão de imagens estiver configurado, o OpenClaw mantém o resultado de imagem normal para que o
modelo principal possa ler a captura de tela diretamente.

<AccordionGroup>

<Accordion title="Portas e acessibilidade">

- O serviço de controle é vinculado à interface de loopback em uma porta derivada de `gateway.port` (padrão `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` tem prioridade sobre `gateway.port`; qualquer um deles desloca as portas derivadas na mesma família.
- Os perfis locais do `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl` a partir de um intervalo que começa 9 portas acima da porta de controle (por padrão, `18800`-`18899`); defina-os somente para
  perfis CDP remotos ou conexão a um endpoint de sessão existente. Quando não definido, `cdpUrl` usa como padrão
  a porta CDP local gerenciada.
- `remoteCdpTimeoutMs` aplica-se às verificações de acessibilidade HTTP do CDP
  remoto e de `attachOnly`, bem como às solicitações HTTP de abertura de abas; `remoteCdpHandshakeTimeoutMs` aplica-se
  aos respectivos handshakes de WebSocket CDP. A enumeração persistente de abas remotas pelo Playwright
  usa o maior dos dois como prazo da operação.
- `localLaunchTimeoutMs` é o limite de tempo para que um processo gerenciado do Chrome
  iniciado localmente exponha seu endpoint HTTP CDP. `localCdpReadyTimeoutMs` é o
  limite de tempo subsequente para a prontidão do WebSocket CDP após a descoberta do processo.
  Aumente esses valores no Raspberry Pi, em VPS de baixo desempenho ou em hardware mais antigo, nos quais o Chromium
  inicia lentamente. Os valores devem ser inteiros positivos de até `120000` ms; valores
  de configuração inválidos são rejeitados.
- Falhas repetidas de inicialização/prontidão do Chrome gerenciado acionam um disjuntor por
  perfil. Após várias falhas consecutivas, o OpenClaw pausa brevemente novas tentativas
  de inicialização em vez de iniciar o Chromium a cada chamada da ferramenta de navegador. Corrija
  o problema de inicialização, desative o navegador se ele não for necessário ou reinicie o
  Gateway após o reparo.
- `actionTimeoutMs` é o limite de tempo padrão para solicitações `act` do navegador quando o chamador não fornece `timeoutMs`. O transporte do cliente adiciona uma pequena margem de tempo para que esperas longas possam terminar em vez de expirar no limite HTTP.
- `tabCleanup` é uma limpeza de melhor esforço para abas abertas por sessões de navegador do agente principal. A limpeza do ciclo de vida de subagentes, Cron e ACP ainda fecha suas abas explicitamente rastreadas no fim da sessão; as sessões principais mantêm as abas ativas reutilizáveis e depois fecham, em segundo plano, as abas rastreadas ociosas ou excedentes.

</Accordion>

<Accordion title="Política de SSRF">

- As solicitações de navegação do navegador e de abertura de abas passam por uma verificação prévia. Durante a ação e por um período de tolerância limitado após a ação, as interações protegidas do Playwright (clique, clique por coordenadas, passagem do cursor, arrastar, rolar, selecionar, pressionar, digitar, preencher formulário e avaliar) interceptam carregamentos de documentos de nível superior e de subquadros negados pela política antes do envio dos bytes da solicitação HTTP e, depois, verificam novamente, mediante melhor esforço, a URL `http(s)` final.
- Antes de cada nova inicialização do Chrome gerenciado pelo OpenClaw, o OpenClaw desativa, mediante melhor esforço, a previsão de rede, suprimindo a pré-conexão especulativa observada do Chromium para esses carregamentos negados. Essa é uma defesa em profundidade, não um limite de política: um navegador reutilizado após a reinicialização do serviço de controle e outros backends de navegador podem não compartilhar esse reforço. O roteamento do Playwright ainda não é um firewall de rede e não intercepta saltos de redirecionamento, a primeira solicitação de uma janela pop-up, o tráfego de Service Worker, o código da página executado após o período de proteção limitado nem todos os caminhos de segundo plano/sub-recursos. O isolamento completo do tráfego de saída requer isolamento no lado do proprietário ou um proxy que aplique políticas.
- No modo SSRF estrito, a descoberta de endpoints CDP remotos e as sondagens de `/json/version` (`cdpUrl`) também são verificadas.
- As variáveis de ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` do Gateway/provedor não encaminham automaticamente o navegador gerenciado pelo OpenClaw por proxy. Por padrão, o Chrome gerenciado é iniciado com conexão direta para que as configurações de proxy do provedor não enfraqueçam as verificações de SSRF do navegador.
- As sondagens de prontidão do CDP local gerenciado pelo OpenClaw e as conexões WebSocket do DevTools ignoram o proxy de rede gerenciado para o endpoint de loopback exato iniciado, de modo que `openclaw browser start` continue funcionando quando um proxy do operador bloqueia o tráfego de saída por loopback.
- Para encaminhar o próprio navegador gerenciado por proxy, forneça flags explícitas de proxy do Chrome por meio de `browser.extraArgs`, como `--proxy-server=...` ou `--proxy-pac-url=...`. O modo SSRF estrito bloqueia o roteamento explícito do navegador por proxy, a menos que o acesso do navegador à rede privada seja habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado por padrão; habilite-o somente quando o acesso do navegador à rede privada for intencionalmente considerado confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua sendo compatível como um alias legado.

</Accordion>

<Accordion title="Comportamento dos perfis">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas conectar-se caso um já esteja em execução.
- `headless` pode ser definido globalmente ou por perfil local gerenciado. Os valores por perfil substituem `browser.headless`, portanto um perfil iniciado localmente pode permanecer sem interface gráfica enquanto outro permanece visível.
- `POST /start?headless=true` e `openclaw browser start --headless` solicitam uma
  inicialização avulsa sem interface gráfica para perfis locais gerenciados, sem reescrever
  `browser.headless` nem a configuração do perfil. Perfis de sessão existente, somente conexão e
  CDP remoto rejeitam a substituição porque o OpenClaw não inicia esses
  processos de navegador.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, os perfis locais gerenciados
  usam automaticamente o modo sem interface gráfica por padrão quando nem o ambiente nem a configuração
  global/do perfil escolhem explicitamente o modo com interface gráfica. Use a forma inequívoca no nível do navegador
  `openclaw browser --json status`; a forma `openclaw browser status --json`
  também funciona porque `status` não define seu próprio `--json`. O comando informa
  `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` ou `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` força inicializações locais gerenciadas sem interface gráfica no
  processo atual. `OPENCLAW_BROWSER_HEADLESS=0` força o modo com interface gráfica nas inicializações
  comuns e retorna um erro acionável em hosts Linux sem um servidor de exibição;
  uma solicitação explícita `start --headless` ainda prevalece nessa inicialização específica.
- A rota de controle do navegador e o cliente programático mantêm o `error`
  legível por humanos referente à ausência de servidor de exibição e expõem o motivo estável
  `no_display_for_headed_profile`. Seus `details` contêm somente `profile`,
  `requestedHeadless`, `headlessSource` e `displayPresent`, para que clientes da API possam
  escolher a correção adequada sem comparar o texto da mensagem.
- Para um perfil local gerenciado em execução, o status e o doctor consultam o
  endpoint CDP no nível do navegador do Chrome para obter o renderizador, o backend, o dispositivo/driver, o status
  dos recursos, as soluções alternativas do driver e os recursos de vídeo acelerado. O resultado é
  armazenado em cache para esse processo do navegador e exposto integralmente por
  `openclaw browser --json status`. Uma chamada passiva de status não inicia o Chrome.
  Navegadores de sessão existente, de extensão, CDP remotos e em sandbox permanecem separados
  e não são inspecionados por esse caminho de host gerenciado.
- O Chrome gerenciado sem interface gráfica ainda usa o padrão conservador `--disable-gpu`.
  O diagnóstico não habilita aceleração, não adiciona uma configuração global de aceleração
  nem concede ao navegador em sandbox acesso a dispositivos.
- `executablePath` pode ser definido globalmente ou por perfil local gerenciado. Os valores por perfil substituem `browser.executablePath`, portanto diferentes perfis gerenciados podem iniciar diferentes navegadores baseados no Chromium. Ambas as formas aceitam `~` para o diretório pessoal do sistema operacional.
- `color` (no nível superior e por perfil) colore a interface do navegador para que você possa identificar qual perfil está ativo.
- O perfil padrão é `openclaw` (autônomo gerenciado). Use `defaultProfile: "user"` para optar pelo navegador do usuário com sessão iniciada.
- Ordem de detecção automática: navegador padrão do sistema, se for baseado no Chromium; caso contrário, Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` usa o Chrome DevTools MCP em vez do CDP bruto. Ele pode se conectar por meio da conexão automática do Chrome MCP ou por meio de `cdpUrl` quando você já tem um endpoint do DevTools para o navegador em execução.
- `driver: "extension"` controla o Chrome com sua sessão iniciada por meio da [extensão do Chrome do OpenClaw](/tools/chrome-extension). O relay é proprietário do endpoint de loopback, portanto esses perfis não aceitam `cdpUrl`. Esse é o único modo de navegador com sessão iniciada que funciona sem ninguém no computador.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil de sessão existente precisar se conectar a um perfil de usuário não padrão do Chromium (Brave, Edge etc.). Esse caminho também aceita `~` para o diretório pessoal do sistema operacional.

</Accordion>

</AccordionGroup>

## Usar o Brave ou outro navegador baseado no Chromium

Se o navegador **padrão do sistema** for baseado no Chromium (Chrome/Brave/Edge/etc.),
o OpenClaw o usará automaticamente. Defina `browser.executablePath` para substituir
a detecção automática. Os valores de `executablePath` no nível superior e por perfil aceitam `~`
para o diretório pessoal do sistema operacional:

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

O `executablePath` por perfil afeta somente os perfis locais gerenciados que o OpenClaw
inicia. Em vez disso, os perfis `existing-session` conectam-se a um navegador já em execução,
e os perfis CDP remotos usam o navegador associado a `cdpUrl`.

## Controle local em comparação com remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (host Node):** execute um host Node na máquina que contém o navegador; o Gateway encaminha as ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  conectar-se a um navegador remoto baseado no Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.
- Para serviços CDP gerenciados externamente em loopback (por exemplo, Browserless no
  Docker publicado em `127.0.0.1`), defina também `attachOnly: true`. Um CDP em loopback
  sem `attachOnly` é tratado como um perfil de navegador local gerenciado pelo OpenClaw.
- `headless` afeta somente os perfis locais gerenciados que o OpenClaw inicia. Ele não reinicia nem altera navegadores de sessão existente ou CDP remotos.
- `executablePath` segue a mesma regra dos perfis locais gerenciados. Alterá-lo em um
  perfil local gerenciado em execução marca esse perfil para reinicialização/reconciliação, para que a
  próxima inicialização use o novo binário.

O comportamento de interrupção varia conforme o modo do perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador
  iniciado pelo OpenClaw
- perfis somente conexão e CDP remotos: `openclaw browser stop` encerra a sessão
  de controle ativa e libera as substituições de emulação do Playwright/CDP (janela de visualização,
  esquema de cores, localidade, fuso horário, modo offline e estados semelhantes), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

As URLs de CDP remoto podem incluir autenticação:

- Tokens de consulta (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens, em vez de adicioná-los a arquivos de configuração.

## Proxy de navegador do Node (padrão sem configuração)

Se você executar um **host Node** na máquina que contém o navegador, o OpenClaw poderá
rotear automaticamente as chamadas da ferramenta de navegador para esse Node sem nenhuma configuração adicional do navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host do Node expõe seu servidor local de controle do navegador por meio de um **comando de proxy**.
- Os perfis vêm da configuração `browser.profiles` do próprio Node (a mesma que a local).
- O comando de proxy nunca permite mutações persistentes de perfil (`create-profile`, `delete-profile`, `reset-profile`), independentemente de `allowProfiles`; faça essas alterações diretamente no Node.
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe-o vazio para manter o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o tratará como um limite de privilégio mínimo que restringe os nomes de perfil que o proxy poderá usar como destino.
- Desative-o se não quiser usá-lo:
  - No Node: `nodeHost.browserProxy.enabled=false`
  - No Gateway: `gateway.nodes.browser.mode="off"` (também aceita `"auto"` para escolher um único Node de navegador conectado ou `"manual"` para exigir um parâmetro de Node explícito)

## Browserless (CDP remoto hospedado)

O [Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer uma das
formas, mas, para um perfil de navegador remoto, a opção mais simples é a URL
WebSocket direta da documentação de conexão do Browserless.

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
- Escolha o endpoint de região correspondente à sua conta do Browserless (consulte a documentação).
- Se o Browserless fornecer uma URL base HTTPS, você poderá convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e permitir que o
  OpenClaw descubra `/json/version`.

### Browserless em Docker no mesmo host

Quando o Browserless estiver auto-hospedado no Docker e o OpenClaw for executado
no host, trate o Browserless como um serviço CDP gerenciado externamente:

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

O endereço em `browser.profiles.browserless.cdpUrl` deve estar acessível pelo
processo do OpenClaw. O Browserless também deve anunciar um endpoint acessível
correspondente; defina `EXTERNAL` do Browserless com a mesma base WebSocket
pública para o OpenClaw, como `ws://127.0.0.1:3000`, `ws://browserless:3000` ou
um endereço estável de rede privada do Docker. Se `/json/version` retornar
`webSocketDebuggerUrl` apontando para um endereço que o OpenClaw não consegue
acessar, o CDP HTTP poderá parecer íntegro, embora a conexão WebSocket ainda
falhe.

Não deixe `attachOnly` indefinido para um perfil do Browserless em loopback. Sem
`attachOnly`, o OpenClaw trata a porta de loopback como um perfil de navegador
local gerenciado e pode informar que a porta está em uso, mas não pertence ao
OpenClaw.

## Provedores de CDP WebSocket direto

Alguns serviços de navegador hospedados expõem um endpoint de **WebSocket direto**
em vez da descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw
aceita três formatos de URL CDP e escolhe automaticamente a estratégia de
conexão correta:

- **Descoberta HTTP(S)** - `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL WebSocket do depurador e,
  em seguida, conecta-se. Não há fallback para WebSocket.
- **Endpoints WebSocket diretos** - `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw conecta-se diretamente por meio de um handshake WebSocket e ignora
  `/json/version` por completo.
- **Raízes WebSocket simples** - `ws://host[:port]` ou `wss://host[:port]` sem um
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io) e
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a
  descoberta HTTP em `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso
  contrário, o OpenClaw recorrerá a um handshake WebSocket direto na raiz
  simples. Se o endpoint WebSocket anunciado rejeitar o handshake CDP, mas a raiz
  simples configurada o aceitar, o OpenClaw também recorrerá a essa raiz. Isso
  permite que uma URL `ws://` simples apontada para um Chrome local ainda se
  conecte, pois o Chrome aceita upgrades de WebSocket somente no caminho específico
  por destino fornecido por `/json/version`, enquanto provedores hospedados ainda
  podem usar seu endpoint WebSocket raiz quando o endpoint de descoberta anuncia
  uma URL de curta duração que não é adequada ao CDP do Playwright.

`openclaw browser doctor` usa a mesma lógica de descoberta primeiro e fallback
para WebSocket que a conexão em tempo de execução; portanto, uma URL de raiz
simples que se conecta com sucesso não é informada como inacessível pelos
diagnósticos.

### Browserbase

O [Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para
executar navegadores headless com resolução de CAPTCHA integrada, modo furtivo e
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
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador ao estabelecer a
  conexão WebSocket, portanto não é necessária uma etapa de criação manual da
  sessão.
- Consulte os [preços](https://www.browserbase.com/pricing) para conhecer os limites atuais do nível gratuito e os planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para
  obter a referência completa da API, guias de SDK e exemplos de integração.

### Notte

O [Notte](https://www.notte.cc) é uma plataforma em nuvem para executar
navegadores headless com modo furtivo integrado, proxies residenciais e um
Gateway WebSocket nativo de CDP.

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

- [Cadastre-se](https://console.notte.cc) e copie sua **API Key** da página de
  configurações do console.
- Substitua `<NOTTE_API_KEY>` pela sua chave de API real do Notte.
- O Notte cria automaticamente uma sessão de navegador ao estabelecer a conexão
  WebSocket, portanto não é necessária uma etapa de criação manual da sessão. A
  sessão é destruída quando o WebSocket é desconectado.
- Consulte os [preços](https://www.notte.cc/#pricing) para conhecer os limites atuais do nível gratuito e os planos pagos.
- Consulte a [documentação do Notte](https://docs.notte.cc) para obter a
  referência completa da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador está disponível somente em loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento do Node.
- A API HTTP independente do navegador em loopback usa **somente autenticação por segredo compartilhado**:
  autenticação bearer com o token do Gateway, `x-openclaw-password` ou autenticação
  HTTP Basic com a senha configurada do Gateway.
- Os cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"`
  **não** autenticam essa API independente do navegador em loopback.
- Se o controle do navegador estiver ativado e nenhuma autenticação por segredo
  compartilhado estiver configurada, o OpenClaw gerará automaticamente e
  persistirá uma credencial de controle do navegador na inicialização:
  um token quando `gateway.auth.mode` for `none` ou uma senha quando for
  `trusted-proxy` (persistida por meio de `gateway.auth.password` para que clientes
  de loopback externos ao processo possam resolvê-la). A geração automática será
  ignorada quando uma credencial de string explícita já estiver configurada para
  esse modo ou quando `gateway.auth.mode` for `password`.
- Configure explicitamente `gateway.auth.token`, `gateway.auth.password`,
  `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` se quiser um segredo
  estável sob seu controle em vez do segredo gerado.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração sempre que possível.
- Evite incorporar tokens de longa duração diretamente nos arquivos de configuração.
- Mantenha o Gateway e todos os hosts de Node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

## Perfis (vários navegadores)

O OpenClaw aceita vários perfis nomeados (configurações de roteamento). Os perfis
podem ser:

- **gerenciado pelo OpenClaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados do usuário + porta CDP
- **remoto**: uma URL CDP explícita (navegador baseado em Chromium executado em outro local)
- **sessão existente**: seu perfil existente do Chrome por meio da conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` será criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão com uma sessão existente pelo Chrome MCP.
- Perfis de sessão existente além de `user` são opcionais; crie-os com `--driver existing-session`.
- Por padrão, as portas CDP locais são alocadas no intervalo **18800-18899**.
- A exclusão de um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa
`--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium
em execução por meio do servidor oficial Chrome DevTools MCP. Isso reutiliza as
abas e o estado de login já abertos nesse perfil do navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README do Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado: `user`. Crie seu próprio perfil personalizado de sessão
existente se quiser outro nome, cor ou diretório de dados do navegador.

Por padrão, o perfil integrado `user` usa a conexão automática do Chrome MCP,
que tem como destino o perfil local padrão do Google Chrome. Use `userDataDir`
para Brave, Edge, Chromium ou um perfil não padrão do Chrome. `~` é expandido
para o diretório inicial do seu sistema operacional:

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

Em seguida, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Ative a depuração remota.
3. Mantenha o navegador em execução e aprove a solicitação de conexão quando o OpenClaw se conectar.

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

Como identificar o sucesso:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista as abas do navegador que já estão abertas
- `snapshot` retorna referências da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador de destino baseado em Chromium está na versão `144+`
- a depuração remota está ativada na página de inspeção desse navegador
- o navegador exibiu a solicitação de consentimento para conexão e você a aceitou
- se o Chrome tiver sido iniciado com uma `--remote-debugging-port` explícita,
  defina `browser.profiles.<name>.cdpUrl` como esse endpoint do DevTools em vez de
  depender da conexão automática do Chrome MCP
- `openclaw doctor` migra configurações antigas de navegador baseadas em extensão
  e verifica se o Chrome está instalado localmente para perfis padrão com conexão
  automática, mas não pode ativar a depuração remota no navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador com a sessão do usuário iniciada.
- Se usar um perfil personalizado de sessão existente, informe explicitamente o nome desse perfil.
- Escolha esse modo somente quando o usuário estiver no computador para aprovar a solicitação de
  anexação.
- O host do Gateway ou do Node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`.

Observações:

- Esse caminho apresenta mais riscos que o perfil isolado `openclaw`, pois pode
  atuar dentro da sessão iniciada no navegador.
- O OpenClaw não inicia o navegador para esse driver; ele apenas se anexa.
- Aqui, o OpenClaw usa o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele será repassado para direcionar esse diretório de dados do usuário.
- A sessão existente pode se anexar no host selecionado ou por meio de um
  Node de navegador conectado. Se o Chrome estiver em outro local e nenhum Node de navegador estiver conectado, use
  CDP remoto ou um host de Node.
- Os destinos do Chrome MCP e as refs de snapshot têm escopo de um único subprocesso MCP. Após
  a reinicialização desse processo, execute `browser tabs` novamente, selecione explicitamente um novo
  destino antes de realizar um trabalho específico do destino e obtenha um novo snapshot antes de usar as refs.
  Cada ref é válida somente para seu destino e snapshot mais recente. Os aliases antigos não são
  transferidos para uma aba substituta, mesmo quando a URL corresponde.
- Atualmente, o Chrome DevTools MCP encaminha as ferramentas de página por um ID numérico de página
  local ao processo. Identificadores com escopo de processo impedem a reutilização após a substituição do subprocesso, mas uma
  substituição de contexto do navegador dentro do processo entre chamadas de ferramenta adjacentes ainda pode
  redirecionar uma ação. Um encaminhamento totalmente atômico exige suporte upstream das ferramentas de página
  a IDs de destino estáveis.

### Inicialização personalizada do Chrome MCP

Substitua, por perfil, o servidor Chrome DevTools MCP iniciado quando o fluxo padrão
`npx chrome-devtools-mcp@latest` não for adequado (hosts offline,
versões fixadas, binários fornecidos localmente):

| Campo        | O que faz                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executável a iniciar em vez de `npx`. Resolvido sem alterações; caminhos absolutos são respeitados.                         |
| `mcpArgs`    | Array de argumentos repassado literalmente a `mcpCommand`. Substitui os argumentos padrão `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` é definido em um perfil de sessão existente, o OpenClaw ignora
`--autoConnect` e encaminha automaticamente o endpoint ao Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint HTTP de descoberta do DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP direto).

As flags de endpoint e `userDataDir` não podem ser combinadas: quando `cdpUrl` está definido,
`userDataDir` é ignorado na inicialização do Chrome MCP, pois o Chrome MCP se anexa ao
navegador em execução por trás do endpoint em vez de abrir um diretório de
perfil.

<Accordion title="Limitações do recurso de sessão existente">

Em comparação com o perfil gerenciado `openclaw`, os drivers de sessão existente têm mais restrições:

- **Capturas de tela** - as capturas de página e de elementos com `--ref` funcionam; seletores CSS com `--element` não. O Playwright não é necessário para capturas de tela da página nem de elementos baseadas em refs. (`--full-page` não pode ser combinado com `--ref` ou `--element` em nenhum perfil, não apenas em sessões existentes.)
- **Ações** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click-coords` clica em coordenadas visíveis da viewport e não exige uma ref de snapshot. `click` usa apenas o botão esquerdo (sem substituição de botão ou modificadores). `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` e `fill` não oferecem suporte a substituições de `timeoutMs` por chamada; `evaluate` oferece. `select` aceita um único valor. `batch` não é compatível; envie as ações individualmente.
- **Espera / upload / diálogo** - `wait --url` oferece suporte a padrões exatos, por substring e glob (igual ao perfil gerenciado); `wait --load networkidle` não é compatível com perfis de sessão existente (funciona em perfis gerenciados e de CDP bruto/remoto). Ganchos de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Ganchos de diálogo não oferecem suporte a substituições de tempo limite nem a `dialogId`.
- **Visibilidade de diálogos** - as respostas de ações do navegador gerenciado incluem `blockedByDialog` e `browserState.dialogs.pending` quando uma ação abre um diálogo modal; os snapshots também incluem o estado de diálogo pendente. Responda com `browser dialog --accept/--dismiss --dialog-id <id>` enquanto houver um diálogo pendente. Os diálogos tratados fora do OpenClaw aparecem em `browserState.dialogs.recent`.
- **Recursos exclusivos do modo gerenciado** - a exportação para PDF, a interceptação de downloads e `responsebody` ainda exigem o caminho do navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório dedicado de dados do usuário**: nunca acessa seu perfil pessoal do navegador.
- **Portas dedicadas**: evita `9222` para impedir conflitos com fluxos de desenvolvimento.
- **Controle determinístico de abas**: `tabs` retorna primeiro `suggestedTargetId`, seguido por
  identificadores `tabId` estáveis, como `t1`, rótulos opcionais e o `targetId` bruto.
  Os agentes devem reutilizar `suggestedTargetId`; os IDs brutos continuam disponíveis para
  depuração e compatibilidade.

## Seleção do navegador

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir essa escolha com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: verifica locais comuns do Chrome/Brave/Edge/Chromium em `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`, além do Chromium gerenciado pelo Playwright em
  `PLAYWRIGHT_BROWSERS_PATH` ou `~/.cache/ms-playwright`.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Para scripts e depuração, o Gateway expõe uma pequena **API HTTP de controle
somente em loopback**, além de uma CLI `openclaw browser` correspondente (snapshots, refs, recursos
avançados de espera, saída JSON e fluxos de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para obter a referência completa.

## Solução de problemas

Para problemas específicos do Linux (especialmente com Chromium via snap), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações com Gateway no WSL2 e Chrome no Windows em hosts separados, consulte
[Solução de problemas de CDP remoto com WSL2 + Windows + Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha na inicialização do CDP versus bloqueio de SSRF na navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha na inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio de SSRF na navegação** significa que o plano de controle do navegador está íntegro, mas um destino de navegação de página foi rejeitado pela política.

Exemplos comuns:

- Falha na inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando um
    serviço CDP externo em loopback está configurado sem `attachOnly: true`
- Bloqueio de SSRF na navegação:
  - Os fluxos de `open`, `navigate`, snapshot ou abertura de abas falham com um erro de política do navegador/rede, enquanto `start` e `tabs` continuam funcionando

Use esta sequência mínima para distinguir os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro solucione os problemas de prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de acessibilidade do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes do comportamento:

- Por padrão, a configuração do navegador usa um objeto de política SSRF que falha de forma fechada, mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local em loopback `openclaw`, as verificações de integridade do CDP ignoram intencionalmente a imposição de acessibilidade SSRF do navegador para o plano de controle local do próprio OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um destino posterior de `open` ou `navigate` seja permitido.

Orientações de segurança:

- **Não** flexibilize a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` somente em ambientes intencionalmente confiáveis nos quais o acesso do navegador à rede privada seja necessário e tenha sido revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como funciona o mapeamento:

- `browser snapshot` retorna uma árvore de IU estável (IA ou ARIA).
- `browser act` usa os IDs de `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira, elemento ou refs rotuladas).
- `browser doctor` verifica a prontidão do Gateway, do Plugin, do perfil, do navegador e da aba.
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões fora da sandbox usam `host` por padrão.
  - Se um Node compatível com navegador estiver conectado, a ferramenta poderá encaminhar automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas disponíveis para agentes
- [Sandboxing](/pt-BR/gateway/sandboxing) - controle do navegador em ambientes em sandbox
- [Segurança](/pt-BR/gateway/security) - riscos e reforço de segurança do controle do navegador

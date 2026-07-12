---
read_when:
    - Você usa `openclaw browser` e quer exemplos de tarefas comuns
    - Você quer controlar um navegador em execução em outra máquina por meio de um host Node
    - Você quer se conectar ao Chrome local no qual já iniciou sessão via Chrome MCP
summary: Referência da CLI para `openclaw browser` (ciclo de vida, perfis, abas, ações, estado e depuração)
title: Navegador
x-i18n:
    generated_at: "2026-07-12T14:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gerencie a superfície de controle do navegador do OpenClaw e execute ações no navegador: ciclo de vida, perfis, abas, snapshots, capturas de tela, navegação, entrada, emulação de estado e depuração.

Relacionado: [Ferramenta de navegador](/pt-BR/tools/browser)

## Opções comuns

- `--url <gatewayWsUrl>`: URL WebSocket do Gateway (o padrão vem da configuração).
- `--token <token>`: token do Gateway (se necessário).
- `--timeout <ms>`: tempo limite da solicitação em ms (padrão: `30000`).
- `--expect-final`: aguarda uma resposta final do Gateway.
- `--browser-profile <name>`: escolhe um perfil de navegador (padrão: `openclaw` ou `browser.defaultProfile`).
- `--json`: saída legível por máquina (quando compatível). Essa é uma opção no nível do navegador, portanto
  coloque-a antes do subcomando para obter uma forma inequívoca, como
  `openclaw browser --json status`. O posicionamento ao final, como
  `openclaw browser status --json`, também funciona quando o comando filho selecionado não
  define sua própria opção `--json`.

## Início rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Os agentes podem executar a mesma verificação de prontidão com `browser({ action: "doctor" })`.

## Solução rápida de problemas

Se `start` falhar com `not reachable after start`, solucione primeiro os problemas de prontidão do CDP. Se `start` e `tabs` funcionarem, mas `open` ou `navigate` falhar, o plano de controle do navegador estará íntegro e a falha geralmente será um bloqueio da política SSRF de navegação.

Sequência mínima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientações detalhadas: [Solução de problemas do navegador](/pt-BR/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` adiciona uma sondagem de snapshot em tempo real: útil quando a prontidão básica do CDP está normal, mas você quer comprovar que a aba atual pode ser inspecionada.
- Para um perfil local gerenciado em execução, `status` e `doctor` relatam diagnósticos
  gráficos armazenados em cache pelo Chrome: classificação de hardware/software, renderizador,
  backend, dispositivo/driver, detalhes de recursos e status desativados, além de recursos
  de vídeo acelerado. `openclaw browser --json status` retorna a carga útil estruturada completa.
  O status passivo nunca inicia o Chrome apenas para coletar esses dados.
- `stop` fecha a sessão de controle ativa e limpa substituições temporárias de emulação, inclusive em perfis `attachOnly` e CDP remotos nos quais o OpenClaw não iniciou o processo do navegador. Para perfis locais gerenciados, `stop` também encerra o processo do navegador iniciado.
- `start --headless` aplica-se apenas a essa solicitação de inicialização e somente quando o OpenClaw inicia um navegador local gerenciado. Ele não reescreve `browser.headless` nem a configuração do perfil e não tem efeito em um navegador que já esteja em execução.
- Em hosts Linux sem `DISPLAY` ou `WAYLAND_DISPLAY`, os perfis locais gerenciados são executados automaticamente em modo headless, a menos que `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` ou `browser.profiles.<name>.headless=false` solicite explicitamente um navegador visível.

## Se o comando estiver ausente

Se `openclaw browser` for um comando desconhecido, verifique `plugins.allow` em `~/.openclaw/openclaw.json`. Quando `plugins.allow` estiver presente, liste explicitamente o plugin de navegador incluído, a menos que a configuração já tenha um bloco `browser` na raiz:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Um bloco `browser` explícito na raiz (por exemplo, `browser.enabled=true` ou `browser.profiles.<name>`) também ativa o plugin de navegador incluído sob uma lista restritiva de plugins permitidos.

Relacionado: [Ferramenta de navegador](/pt-BR/tools/browser#missing-browser-command-or-tool)

## Perfis

Perfis são configurações nomeadas de roteamento do navegador:

- `openclaw` (padrão): inicia ou se conecta a uma instância dedicada do Chrome gerenciada pelo OpenClaw (diretório isolado de dados do usuário).
- `user`: controla sua sessão existente do Chrome com login efetuado por meio do Chrome DevTools MCP.
- perfis CDP personalizados: apontam para um endpoint CDP local ou remoto.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Use um perfil específico com `--browser-profile <name>` em qualquer subcomando, por exemplo, `openclaw browser --browser-profile work tabs`.

No macOS, `system-profiles` lista os perfis reais do Chrome, Brave, Edge ou Chromium disponíveis no host. `import-profile` descriptografa os cookies após uma solicitação de consentimento do Chaves do macOS/Touch ID e os injeta em um novo perfil gerenciado pelo OpenClaw. Ele importa apenas cookies; o armazenamento local e o IndexedDB permanecem inalterados. Algumas sessões do Google usam credenciais de sessão vinculadas ao dispositivo (DBSC) e ainda podem exigir nova autenticação após a importação.

Quando o aplicativo para macOS usa um Gateway local, ele pode oferecer essa importação uma vez e tornar o perfil importado isolado o padrão para a navegação do agente. A importação sempre exige um clique explícito; a importação bem-sucedida ou a dispensa suprime solicitações automáticas posteriores, e **Settings → General → Browser login** permanece disponível para uma nova importação.

A importação de perfis do sistema é habilitada por padrão. Defina `browser.allowSystemProfileImport=false` para desabilitar tanto as importações pela CLI quanto as acionadas por agentes. A importação é local ao host e não pode ser executada pelo proxy do Node do navegador.

## Abas

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` retorna primeiro `suggestedTargetId`, depois o `tabId` estável (como `t1`), o rótulo opcional e o `targetId` bruto. Passe `suggestedTargetId` novamente para `focus`, `close`, snapshots e ações. Atribua um rótulo com `open --label`, `tab new --label` ou `tab label`; rótulos, IDs de abas, IDs de destino brutos e prefixos exclusivos de IDs de destino são todos aceitos. O campo da solicitação ainda se chama `targetId` por compatibilidade, mas aceita qualquer uma dessas referências de aba.

IDs de destino brutos são identificadores voláteis de diagnóstico, não memória durável do agente: quando o Chromium substitui o destino bruto subjacente durante uma navegação ou o envio de um formulário, o OpenClaw mantém o `tabId`/rótulo estável associado à aba substituta quando consegue comprovar a correspondência. Prefira `suggestedTargetId`.

## Snapshot / captura de tela / ações

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Captura de tela:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` destina-se apenas a capturas de página; não pode ser combinado com `--ref` nem `--element`.
- Os perfis `existing-session` / `user` são compatíveis com capturas de tela da página e capturas `--ref` da saída do snapshot, mas não com capturas CSS `--element`.
- `--labels` sobrepõe as referências do snapshot atual na captura de tela. Em perfis baseados no Playwright, funciona com `--full-page` (sobreposição de página inteira), `--ref` (sobreposição de recorte do elemento por referência ARIA) e `--element` (sobreposição de recorte do elemento por seletor CSS); nos modos de recorte de elemento, os rótulos são projetados em relação ao elemento. A resposta também inclui uma matriz `annotations` (omitida quando vazia) com a caixa delimitadora de cada referência: `ref`, `number`, `role`, `name` opcional e `box: {x, y, width, height}` no espaço de coordenadas da imagem capturada (viewport / fullpage / relativo ao elemento).
  Os perfis `existing-session` renderizam uma sobreposição do chrome-mcp nas capturas de tela da página, mas não usam o auxiliar de projeção do Playwright nem incluem `annotations`; capturas CSS `--element` não são compatíveis nesses perfis. Sem Playwright ou chrome-mcp, capturas de tela com rótulos não estão disponíveis.
- `snapshot --urls` acrescenta os destinos de links descobertos aos snapshots de IA para que os agentes possam escolher destinos de navegação direta em vez de adivinhar apenas pelo texto do link.

Navegar/clicar/digitar (automação de interface baseada em referências):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` aceita o código-fonte de uma função, uma expressão ou um corpo de instruções. Os corpos de instruções são encapsulados como funções assíncronas; portanto, use `return` para o valor que deseja receber. Use `--timeout-ms` quando a função executada na página puder precisar de mais tempo do que o limite padrão de avaliação. `browser.evaluateEnabled=false` (padrão: `true`) desabilita tanto `evaluate` quanto `wait --fn`.

As respostas das ações retornam o `targetId` bruto atual após a substituição de página acionada pela ação quando o OpenClaw consegue comprovar a aba substituta. Os scripts ainda devem armazenar e passar `suggestedTargetId`/rótulos para fluxos de trabalho de longa duração.

Auxiliares de arquivos e caixas de diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Os perfis gerenciados do Chrome salvam downloads comuns acionados por cliques no diretório de downloads do OpenClaw (`/tmp/openclaw/downloads` por padrão ou a raiz temporária configurada). Use `waitfordownload` ou `download` quando o agente precisar aguardar um arquivo específico e retornar seu caminho; esses mecanismos explícitos de espera assumem o próximo download. Os uploads aceitam arquivos da raiz temporária de uploads do OpenClaw e de mídias de entrada gerenciadas pelo OpenClaw, incluindo referências `media://inbound/<id>` e `media/inbound/<id>` relativas ao sandbox. Referências de mídia aninhadas, travessia de diretórios e caminhos locais arbitrários são rejeitados.

Quando uma ação abre uma caixa de diálogo modal, a resposta da ação retorna `blockedByDialog` com `browserState.dialogs.pending`; passe `--dialog-id` para respondê-la diretamente. Caixas de diálogo tratadas fora do OpenClaw aparecem em `browserState.dialogs.recent`.

## Estado e armazenamento

Viewport + emulação:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + armazenamento:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Depuração

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existente via MCP

Use o perfil `user` integrado ou crie seu próprio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

O caminho padrão de existing-session é a conexão automática do Chrome MCP somente no host. Se o navegador já estiver em execução com um endpoint do DevTools, passe `--cdp-url` para que o Chrome MCP se conecte a esse endpoint. Para Docker, Browserless ou outras configurações remotas em que a semântica do Chrome MCP não seja necessária, use um perfil CDP.

Limitações atuais de existing-session:

- As ações orientadas por snapshots usam refs, não seletores CSS.
- `browser.actionTimeoutMs` define como padrão 60000 ms para solicitações `act` compatíveis quando os chamadores omitem `timeoutMs`; o `timeoutMs` por chamada ainda tem precedência.
- `click` aceita apenas o clique com o botão esquerdo.
- `type` não aceita `slowly=true`.
- `press` não aceita `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` e `fill` rejeitam substituições de tempo limite por chamada; `evaluate` aceita `--timeout-ms`.
- `select` aceita apenas um valor.
- `wait --load networkidle` não é compatível (funciona em perfis CDP gerenciados e brutos/remotos).
- Os uploads de arquivos exigem `--ref` / `--input-ref`, não aceitam o `--element` CSS e permitem um arquivo por vez.
- Os hooks de diálogos não aceitam `--timeout`.
- As capturas de tela permitem capturas da página e `--ref`, mas não o `--element` CSS.
- `responsebody`, a interceptação de downloads, a exportação para PDF e as ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

## Controle remoto do navegador (proxy do host Node)

Se o Gateway for executado em uma máquina diferente daquela do navegador, execute um **host Node** na máquina que contém o Chrome/Brave/Edge/Chromium. O Gateway encaminha as ações do navegador por proxy para esse Node; não é necessário um servidor separado de controle do navegador.

Use `gateway.nodes.browser.mode` para controlar o roteamento automático e `gateway.nodes.browser.node` para fixar um Node específico caso vários estejam conectados.

Segurança + configuração remota: [Ferramenta de navegador](/pt-BR/tools/browser), [Acesso remoto](/pt-BR/gateway/remote), [Tailscale](/pt-BR/gateway/tailscale), [Segurança](/pt-BR/gateway/security)

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Navegador](/pt-BR/tools/browser)

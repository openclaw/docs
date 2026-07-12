---
read_when:
    - Automação por scripts ou depuração do navegador do agente por meio da API de controle local
    - Procurando a referência da CLI `openclaw browser`
    - Adicionando automação personalizada do navegador com snapshots e refs
summary: API de controle do navegador do OpenClaw, referência da CLI e ações de script
title: API de controle do navegador
x-i18n:
    generated_at: "2026-07-12T15:47:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Para instalação, configuração e solução de problemas, consulte [Navegador](/pt-BR/tools/browser).
Esta página é a referência para a API HTTP de controle local, a CLI
`openclaw browser` e padrões de criação de scripts (snapshots, refs, esperas, fluxos de depuração).

## API de controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP de loopback.
Este servidor independente é opcional — defina a variável de ambiente
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` no ambiente do serviço do Gateway
e reinicie o Gateway antes que os endpoints HTTP fiquem disponíveis. Sem
essa variável, o runtime de controle do navegador ainda funciona por meio da CLI e das
ferramentas do agente, mas nada escuta na porta de controle de loopback.

- Status/início/parada: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Perfis: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/captura de tela: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Permissões: `POST /permissions/grant`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` é a forma em lote que a CLI usa internamente para os
subcomandos de `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
ao criar scripts diretamente, prefira as rotas de aba de finalidade única acima.

Todos os endpoints aceitam `?profile=<name>`. `POST /start?headless=true` solicita uma
inicialização headless de uso único para perfis locais gerenciados sem alterar a
configuração persistida do navegador; perfis somente para anexação, de CDP remoto e de sessão existente rejeitam
essa substituição porque o OpenClaw não inicia esses processos de navegador.

Para endpoints de abas, `targetId` é o nome do campo de compatibilidade. Prefira passar
`suggestedTargetId` de `GET /tabs` ou `POST /tabs/open`; rótulos e identificadores
`tabId`, como `t1`, também são aceitos. IDs de destino CDP brutos e prefixos exclusivos de
IDs de destino brutos ainda funcionam, mas são identificadores voláteis de diagnóstico.

Se a autenticação do Gateway por segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API independente de navegador em loopback **não** utiliza cabeçalhos de identidade
  de proxy confiável ou do Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de navegador em
  loopback não herdarão esses modos baseados em identidade; mantenha-as restritas ao loopback.

### Contrato de erros de `/act`

`POST /act` usa uma resposta de erro estruturada para validações no nível da rota e
falhas de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação sem suporte.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desativado pela configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): o `targetId` de nível superior ou em lote conflita com o destino da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navegação/ação/snapshot de IA/snapshot por função, capturas de tela de elementos,
PDF) exigem o Playwright. Se o Playwright não estiver instalado, esses endpoints retornarão
um erro 501 claro.

O que ainda funciona sem o Playwright:

- Snapshots ARIA
- Snapshots de acessibilidade no estilo de função (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando um WebSocket CDP por aba está disponível. Isso é
  uma alternativa para inspeção e descoberta de refs; o Playwright continua sendo o principal
  mecanismo de ações.
- Capturas de tela da página para o navegador `openclaw` gerenciado quando um WebSocket
  CDP por aba está disponível
- Capturas de tela da página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em refs de `existing-session` (`--ref`) a partir da saída do snapshot

O que ainda exige o Playwright:

- `navigate`
- `act`
- Snapshots de IA que dependem do formato de snapshot de IA nativo do Playwright
- Capturas de tela de elementos por seletor CSS (`--element`)
- Exportação completa do navegador para PDF

Capturas de tela de elementos também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, o
Gateway empacotado não possui a dependência principal do runtime do navegador. Reinstale ou atualize
o OpenClaw e reinicie o Gateway. Para Docker, instale também os binários do navegador
Chromium conforme mostrado abaixo.

#### Instalação do Playwright no Docker

Se o seu Gateway for executado no Docker, evite `npx playwright` (conflitos de substituição do npm).
Para imagens personalizadas, inclua o Chromium na imagem durante a criação:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para uma imagem existente, faça a instalação pela CLI incluída:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir os downloads do navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido por meio de
`OPENCLAW_HOME_VOLUME` ou de uma montagem vinculada. O OpenClaw detecta automaticamente o
Chromium persistido no Linux. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Um pequeno servidor de controle em loopback aceita solicitações HTTP e se conecta a navegadores baseados no Chromium via CDP. Ações avançadas (clique/digitação/snapshot/PDF) passam pelo Playwright sobre o CDP; quando o Playwright está ausente, apenas operações que não dependem dele ficam disponíveis. O agente vê uma única interface estável enquanto navegadores e perfis locais/remotos são alternados livremente nos bastidores.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar um perfil específico e `--json` para uma saída legível por máquina.

<AccordionGroup>

<Accordion title="Noções básicas: status, abas, abrir/focar/fechar">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # adiciona uma sondagem de snapshot ao vivo
openclaw browser start
openclaw browser start --headless # inicialização headless gerenciada local de uso único
openclaw browser stop            # também limpa a emulação em CDP somente para anexação/remoto
openclaw browser reset-profile   # move os dados do navegador do perfil para a Lixeira
openclaw browser tabs
openclaw browser tab             # atalho para a aba atual
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Perfis: listar, criar, excluir">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspeção: captura de tela, snapshot, console, erros, solicitações">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # ou --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Ações: navegar, clicar, digitar, arrastar, aguardar, avaliar">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # ou e12 para refs de função
openclaw browser click-coords 120 340        # coordenadas da janela de visualização
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Estado: cookies, armazenamento, modo offline, cabeçalhos, localização, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear para remover
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Observações:

- A ferramenta `browser` voltada para o agente expõe `action=download` (`ref` e
  `path` obrigatórios) e `action=waitfordownload` (`path` opcional). Ambas retornam
  a URL do download salvo, o nome de arquivo sugerido e o caminho local protegido. A
  interceptação explícita de downloads está disponível para perfis gerenciados do
  Playwright; perfis de sessão existente retornam um erro de operação não compatível.
- Prefira uploads atômicos pelo seletor de arquivos: passe o `--ref` do acionador junto com o upload para que o OpenClaw prepare e clique em uma única solicitação. O `upload` somente com caminhos continua compatível quando um acionamento posterior é intencional. Use `--input-ref` ou `--element` para definir diretamente uma entrada de arquivo. `dialog` é uma chamada de preparação; execute-a antes do clique/pressionamento que aciona a caixa de diálogo. Se uma ação abrir uma janela modal, a resposta da ação incluirá `blockedByDialog` e `browserState.dialogs.pending`; passe esse `dialogId` para responder diretamente. Caixas de diálogo tratadas fora do OpenClaw aparecem em `browserState.dialogs.recent`.
- `click`/`type`/etc. exigem um `ref` de `snapshot` (`12` numérico, referência de função `e12` ou referência ARIA acionável `ax12`). Seletores CSS intencionalmente não são compatíveis com ações. Use `click-coords` quando a posição na área de visualização visível for o único alvo confiável.
- Os caminhos de download e rastreamento são restritos às raízes temporárias do OpenClaw: `/tmp/openclaw{,/downloads}` (alternativa: `${os.tmpdir()}/openclaw/...`).
- `upload` aceita arquivos da raiz temporária de uploads do OpenClaw e
  mídias de entrada gerenciadas pelo OpenClaw. As mídias de entrada gerenciadas podem ser referenciadas como
  `media://inbound/<id>`, `media/inbound/<id>` relativo ao sandbox ou como um
  caminho resolvido dentro do diretório gerenciado de mídias de entrada. Referências de mídia aninhadas,
  travessia de diretórios, links simbólicos, links físicos e caminhos locais arbitrários continuam sendo rejeitados.
- `upload` também pode definir entradas de arquivo diretamente por meio de `--input-ref` ou `--element`.

IDs e rótulos estáveis de abas sobrevivem à substituição de alvos brutos do Chromium quando o OpenClaw
consegue comprovar qual é a aba substituta, como um par antigo/novo exclusivo para a mesma URL ou
uma única aba antiga tornando-se uma única aba nova após o envio de um formulário. Substituições
ambíguas com URLs duplicadas recebem novos identificadores. Os IDs brutos dos alvos continuam
voláteis; prefira o `suggestedTargetId` de `tabs` em scripts.

Resumo das opções de snapshot:

- `--format ai` (padrão com Playwright): snapshot para IA com referências numéricas (`aria-ref="<n>"`).
- `--format aria`: árvore de acessibilidade com referências `axN`. Quando o Playwright está disponível, o OpenClaw vincula as referências à página ativa por meio de IDs do DOM de back-end, permitindo que ações subsequentes as utilizem; caso contrário, trate a saída apenas como inspeção.
- `--efficient` (ou `--mode efficient`): predefinição compacta de snapshot de funções. Defina `browser.snapshotDefaults.mode: "efficient"` para torná-la o padrão (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forçam um snapshot de funções com referências `ref=e12`. `--frame "<iframe>"` restringe os snapshots de funções a um iframe.
- Com o Playwright, `--labels` adiciona uma captura de tela com rótulos de referência sobrepostos
  (imprime `MEDIA:<path>`), além de um array `annotations` com a caixa delimitadora
  de cada referência. Em `screenshot`, os rótulos fornecidos pelo Playwright funcionam com `--full-page`,
  `--ref` e `--element`; em `snapshot`, a captura de tela associada continua
  limitada à área de visualização. Perfis existing-session/chrome-mcp renderizam rótulos sobrepostos nas
  capturas de tela da página, mas não retornam `annotations` nem usam o auxiliar de projeção
  de página inteira/referência/elemento do Playwright. Sem Playwright ou chrome-mcp,
  capturas de tela com rótulos não estão disponíveis.
- `--urls` acrescenta os destinos de links descobertos aos snapshots para IA.

## Snapshots e referências

O OpenClaw oferece dois estilos de "snapshot":

- **Snapshot para IA (referências numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot textual que inclui referências numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a referência é resolvida pelo `aria-ref` do Playwright.

- **Snapshot de funções (referências de função como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em funções com `[ref=e12]` (e `[nth=1]` opcional).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a referência é resolvida por `getByRole(...)` (além de `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela com rótulos `e12` sobrepostos. Em
    perfis baseados no Playwright, isso também retorna metadados da caixa delimitadora de cada referência
    (`annotations[]`).
  - Adicione `--urls` quando o texto do link for ambíguo e o agente precisar de
    destinos concretos de navegação.

- **Snapshot ARIA (referências ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Saída: a árvore de acessibilidade como nós estruturados.
  - Ações: `openclaw browser click ax12` funciona quando o caminho do snapshot consegue vincular
    a referência por meio do Playwright e dos IDs do DOM de back-end do Chrome.
- Se o Playwright não estiver disponível, os snapshots ARIA ainda podem ser úteis para
  inspeção, mas talvez as referências não sejam acionáveis. Gere outro snapshot com `--format ai`
  ou `--interactive` quando precisar de referências de ação.
- Comprovação via Docker para o caminho alternativo de CDP bruto: `pnpm test:docker:browser-cdp-snapshot`
  inicia o Chromium com CDP, executa `browser doctor --deep` e verifica se os snapshots de funções
  incluem URLs de links, elementos clicáveis promovidos pelo cursor e metadados de iframe.

Comportamento das referências:

- As referências **não permanecem estáveis entre navegações**; se algo falhar, execute novamente `snapshot` e use uma nova referência.
- `/act` retorna o `targetId` bruto atual após uma substituição acionada por uma ação
  quando consegue comprovar qual é a aba substituta. Continue usando IDs/rótulos estáveis de abas nos
  comandos subsequentes.
- Se o snapshot de funções tiver sido obtido com `--frame`, as referências de função ficam restritas a esse iframe até o próximo snapshot de funções.
- Referências `axN` desconhecidas ou obsoletas falham imediatamente, em vez de recorrer ao
  seletor `aria-ref` do Playwright. Quando isso acontecer, gere um novo snapshot na mesma aba.

## Recursos avançados de espera

Você pode aguardar mais do que apenas tempo/texto:

- Aguardar uma URL (padrões glob compatíveis com o Playwright):
  - `openclaw browser wait --url "**/dash"`
- Aguardar um estado de carregamento:
  - `openclaw browser wait --load networkidle`
  - Compatível com perfis CDP gerenciados `openclaw` e brutos/remotos. Perfis que usam o driver `existing-session` (incluindo o perfil padrão `user`) rejeitam `networkidle`; neles, use esperas com `--url`, `--text`, um seletor ou `--fn`.
- Aguardar um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Aguardar até que um seletor fique visível:
  - `openclaw browser wait "#main"`

Essas opções podem ser combinadas:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Fluxos de depuração

Quando uma ação falhar (por exemplo, "não visível", "violação do modo estrito", "coberto"):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira referências de função no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver qual elemento o Playwright está selecionando
4. Se a página apresentar um comportamento estranho:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração aprofundada, grave um rastreamento:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` é destinado a scripts e ferramentas estruturadas.

Exemplos:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Os snapshots de funções em JSON incluem `refs`, além de um pequeno bloco `stats` (linhas/caracteres/referências/interativos), para que as ferramentas possam avaliar o tamanho e a densidade da carga útil.

## Controles de estado e ambiente

Estes recursos são úteis para fluxos do tipo "faça o site se comportar como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Armazenamento: `storage local|session get|set|clear`
- Modo offline: `set offline on|off`
- Cabeçalhos: `set headers --headers-json '{"X-Debug":"1"}'` (ou a forma posicional `set headers '{"X-Debug":"1"}'`)
- Autenticação HTTP básica: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / área de visualização:
  - `set device "iPhone 14"` (predefinições de dispositivos do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de navegador do openclaw pode conter sessões autenticadas; trate-o como confidencial.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Uma injeção de prompt pode direcionar
  essa execução. Desative-a com `browser.evaluateEnabled=false` se não precisar dela.
- `openclaw browser evaluate --fn` aceita o código-fonte de uma função, uma expressão ou
  o corpo de uma instrução. Corpos de instruções são encapsulados como funções assíncronas, portanto use
  `return` para o valor que deseja receber. Use `--timeout-ms <ms>` quando a
  função executada na página puder precisar de mais tempo do que o limite de avaliação padrão.
- Para observações sobre login e mecanismos antibot (X/Twitter etc.), consulte [Login no navegador + publicação no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o host do Gateway/node privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; proteja-os e acesse-os por túnel.

Exemplo de modo estrito (bloqueia destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // permissão exata opcional
    },
  },
}
```

## Relacionado

- [Navegador](/pt-BR/tools/browser) - visão geral, configuração, perfis, segurança
- [Login no navegador](/pt-BR/tools/browser-login) - autenticação em sites
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

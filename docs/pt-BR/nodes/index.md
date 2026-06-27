---
read_when:
    - Pareando nós iOS/Android a um gateway
    - Usando canvas/câmera do Node para contexto do agente
    - Adicionando novos comandos Node ou auxiliares de CLI
summary: 'Nós: pareamento, capacidades, permissões e auxiliares de CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nós
x-i18n:
    generated_at: "2026-06-27T17:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Um **Node** é um dispositivo companion (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [protocolo Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para Nodes atuais).

O macOS também pode executar em **modo Node**: o aplicativo da barra de menus se conecta ao servidor
WS do Gateway e expõe seus comandos locais de canvas/câmera como um Node (para que
`openclaw nodes …` funcione contra este Mac). No modo de gateway remoto, a automação
do navegador é tratada pelo host Node da CLI (`openclaw node run` ou o
serviço Node instalado), não pelo Node do aplicativo nativo.

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço Gateway.
- Mensagens do Telegram/WhatsApp/etc. chegam ao **gateway**, não aos Nodes.
- Runbook de solução de problemas: [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)

## Pareamento + status

**Nodes WS usam pareamento de dispositivo.** Nodes apresentam uma identidade de dispositivo durante `connect`; o Gateway
cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove pela CLI de dispositivos (ou pela UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se um Node tentar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação
pendente anterior será substituída e um novo `requestId` será criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um Node como **pareado** quando sua função de pareamento de dispositivo inclui `node`.
- O registro de pareamento de dispositivo é o contrato durável de função aprovada. A rotação
  de token permanece dentro desse contrato; ela não pode atualizar um Node pareado para uma
  função diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) é um armazenamento de pareamento de Node separado, pertencente ao gateway;
  ele **não** controla o handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` remove um pareamento de Node. Para um
  Node com base em dispositivo, ele revoga a função `node` do dispositivo em `devices/paired.json`
  e desconecta as sessões de função Node desse dispositivo — um dispositivo com funções mistas mantém
  sua linha e perde apenas a função `node`, enquanto uma linha de dispositivo somente Node é
  excluída. Ele também limpa qualquer entrada correspondente do armazenamento separado de pareamento de Node
  pertencente ao gateway. `operator.pairing` pode remover linhas de Node que não sejam de operador; um
  chamador com token de dispositivo revogando sua própria função Node em um dispositivo com funções mistas
  também precisa de `operator.admin`.
- O escopo de aprovação segue os comandos declarados da solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de Node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host Node remoto (system.run)

Use um **host Node** quando seu Gateway roda em uma máquina e você quer que comandos
sejam executados em outra. O modelo ainda fala com o **gateway**; o gateway
encaminha chamadas `exec` ao **host Node** quando `host=node` é selecionado.

### O que executa onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramentas.
- **Host Node**: executa `system.run`/`system.which` na máquina Node.
- **Aprovações**: aplicadas no host Node via `~/.openclaw/exec-approvals.json`.

Observação de aprovação:

- Execuções de Node com base em aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de shell/runtime de arquivos, o OpenClaw também vincula, em melhor esforço, um operando de arquivo local
  concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução com base em aprovação será negada em vez de fingir cobertura completa do runtime. Use sandboxing,
  hosts separados ou uma allowlist confiável explícita/fluxo de trabalho completo para semânticas mais amplas de interpretador.

### Iniciar um host Node (primeiro plano)

Na máquina Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (vínculo de loopback)

Se o Gateway se vincular ao loopback (`gateway.bind=loopback`, padrão no modo local),
hosts Node remotos não conseguem se conectar diretamente. Crie um túnel SSH e aponte o
host Node para a extremidade local do túnel.

Exemplo (host Node -> host do gateway):

```bash
# Terminal A (mantenha em execução): encaminha local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporte o token do gateway e conecte pelo túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` aceita autenticação por token ou senha.
- Variáveis de ambiente são preferidas: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- O fallback de configuração é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host Node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis conforme as regras de precedência remota.
- Se SecretRefs `gateway.auth.*` locais ativos estiverem configurados, mas não resolvidos, a autenticação do host Node falhará fechada.
- A resolução de autenticação do host Node honra apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host Node (serviço)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Parear + nomear

No host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se o Node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list`
e aprove o `requestId` atual.

Opções de nomeação:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição no gateway).

### Colocar os comandos na allowlist

Aprovações de exec são **por host Node**. Adicione entradas de allowlist pelo gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host Node em `~/.openclaw/exec-approvals.json`.

### Apontar exec para o Node

Configure padrões (configuração do gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Depois de configurada, qualquer chamada `exec` com `host=node` executa no host Node (sujeita à
allowlist/aprovações do Node).

`host=auto` não escolherá implicitamente o Node por conta própria, mas uma solicitação explícita por chamada `host=node` é permitida a partir de `auto`. Se quiser que exec no Node seja o padrão da sessão, defina `tools.exec.host=node` ou `/exec host=node ...` explicitamente.

Relacionado:

- [CLI de host Node](/pt-BR/cli/node)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)

## Invocando comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Há helpers de nível mais alto para os fluxos de trabalho comuns de "dar ao agente um anexo MEDIA".

## Política de comandos

Comandos de Node precisam passar por dois controles antes de poderem ser invocados:

1. O Node deve declarar o comando em sua lista `connect.commands` do WebSocket.
2. A política de plataforma do gateway deve permitir o comando declarado.

Nodes companion do Windows e macOS permitem por padrão comandos declarados seguros, como
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot`.
Nodes confiáveis que anunciam a capacidade `talk` ou declaram comandos `talk.*`
também permitem por padrão comandos push-to-talk declarados (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), independentemente do rótulo da plataforma.
Comandos perigosos ou sensíveis à privacidade, como `camera.snap`, `camera.clip` e
`screen.record`, ainda exigem adesão explícita com
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` sempre prevalece sobre
padrões e entradas extras de allowlist.

Comandos de Node pertencentes a Plugins podem adicionar uma política de node-invoke do Gateway. Essa política
executa depois da verificação da allowlist e antes do encaminhamento ao Node, portanto o
`node.invoke` bruto, helpers de CLI e ferramentas de agente dedicadas compartilham o mesmo limite de permissão
do Plugin. Comandos de Node perigosos de Plugins ainda exigem adesão explícita em
`gateway.nodes.allowCommands`.

Depois que um Node alterar sua lista de comandos declarados, rejeite o pareamento de dispositivo antigo
e aprove a nova solicitação para que o gateway armazene o snapshot de comandos atualizado.

## Configuração (`openclaw.json`)

Configurações relacionadas a Node ficam em `gateway.nodes` e `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Use nomes exatos de comandos de Node. `denyCommands` remove um comando mesmo quando um
padrão de plataforma ou entrada `allowCommands` o permitiria de outra forma. Consulte a
[referência de configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway-field-details)
para detalhes dos campos de pareamento de Node do gateway e de política de comandos.

Substituição de Node exec por agente:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Capturas de tela (snapshots de canvas)

Se o Node estiver mostrando o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Helper de CLI (grava em um arquivo temporário e imprime o caminho salvo):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles do Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Observações:

- `canvas present` aceita URLs ou caminhos de arquivos locais (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Nodes móveis usam uma página A2UI empacotada pertencente ao aplicativo para renderização com ações.
- Somente A2UI v0.8 JSONL é compatível (v0.9/createSurface é rejeitado).
- iOS e Android renderizam páginas remotas do Gateway Canvas, mas ações de botões A2UI são despachadas apenas a partir da página A2UI empacotada pertencente ao aplicativo. Páginas A2UI HTTP/HTTPS hospedadas pelo Gateway são somente renderização nesses clientes móveis.

## Fotos + vídeos (câmera do Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O nó deve estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 grandes demais.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nós)

Nós compatíveis expõem `screen.record` (mp4). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do nó.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa a captura do microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando várias telas estiverem disponíveis.

## Localização (nós)

Nós expõem `location.get` quando Localização está habilitada nas configurações.

Auxiliar da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- Localização fica **desativada por padrão**.
- "Sempre" requer permissão do sistema; a busca em segundo plano é feita com melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e carimbo de data/hora.

## SMS (nós Android)

Nós Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- A solicitação de permissão deve ser aceita no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos somente Wi-Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nós Android podem anunciar famílias adicionais de comandos quando as capacidades correspondentes estão habilitadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` quando o compartilhamento de apps instalados está habilitado nas Configurações do Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invocações:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- `device.apps` é opt-in e retorna, por padrão, apps visíveis no lançador.
- Comandos de movimento são controlados por capacidade com base nos sensores disponíveis.

## Comandos do sistema (host de Node / nó Mac)

O nó macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de nó headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície RPC direta para comandos explícitos de nó.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o Gateway encaminha esse plano armazenado, não quaisquer campos
  command/cwd/session editados posteriormente pelo chamador.
- `system.notify` respeita o estado de permissão de notificações no app macOS.
- Metadados de `platform` / `deviceFamily` de nó não reconhecidos usam uma lista de permissões padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de requisição são reduzidos a uma lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo de lista de permissões, wrappers de despacho conhecidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem os caminhos dos executáveis internos em vez dos caminhos dos wrappers. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões será persistida automaticamente.
- Em hosts de nó Windows no modo de lista de permissões, execuções de wrapper de shell via `cmd.exe /c` exigem aprovação (a entrada na lista de permissões por si só não permite automaticamente a forma de wrapper).
- `system.notify` oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de Node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Se você precisar de entradas extras de PATH, configure o ambiente do serviço do host de nó (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo de nó macOS, `system.run` é controlado por aprovações de exec no app macOS (Ajustes → Aprovações de exec).
  Perguntar/lista de permissões/completo se comportam da mesma forma que o host de nó headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de nó headless, `system.run` é controlado por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Vinculação de nó exec

Quando vários nós estão disponíveis, você pode vincular exec a um nó específico.
Isso define o nó padrão para `exec host=node` (e pode ser substituído por agente).

Padrão global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Substituição por agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Remova a definição para permitir qualquer Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa de permissões

Os Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado pelo nome da permissão (por exemplo, `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de Node sem interface (multiplataforma)

O OpenClaw pode executar um **host de Node sem interface** (sem UI) que se conecta ao WebSocket do Gateway e expõe `system.run` / `system.which`. Isso é útil no Linux/Windows ou para executar um Node mínimo junto a um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é obrigatório (o Gateway mostrará um prompt de pareamento de dispositivo).
- O host de Node armazena o id do Node, o token, o nome de exibição e as informações de conexão do Gateway em `~/.openclaw/node.json`.
- As aprovações de exec são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Aprovações de exec](/pt-BR/tools/exec-approvals)).
- No macOS, o host de Node sem interface executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de exec do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de modo fechado se ele estiver indisponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo de Node no Mac

- O app de barra de menus do macOS se conecta ao servidor WS do Gateway como um Node (portanto, `openclaw nodes …` funciona com este Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

---
read_when:
    - Pareando Nodes iOS/Android a um Gateway
    - Usando canvas/câmera do Node para contexto do agente
    - Adicionando novos comandos de Node ou helpers da CLI
summary: 'Nodes: pareamento, capacidades, permissões e helpers da CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nodes
x-i18n:
    generated_at: "2026-04-26T11:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Um **Node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operators) com `role: "node"` e expõe uma superfície de comandos (por exemplo `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [Protocolo Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para os Nodes atuais).

O macOS também pode ser executado em **modo Node**: o app de barra de menus se conecta ao
servidor WS do Gateway e expõe seus comandos locais de canvas/câmera como um Node (assim
`openclaw nodes …` funciona contra este Mac). No modo de Gateway remoto, a automação
de navegador é tratada pelo host CLI do Node (`openclaw node run` ou o serviço de Node
instalado), não pelo Node do app nativo.

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de Gateway.
- Mensagens de Telegram/WhatsApp/etc. chegam ao **Gateway**, não aos Nodes.
- Runbook de solução de problemas: [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)

## Pareamento + status

**Nodes WS usam pareamento de dispositivo.** Os Nodes apresentam uma identidade de dispositivo durante `connect`; o Gateway
cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove via CLI de devices (ou UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se um Node tentar novamente com detalhes de auth alterados (role/scopes/public key), a solicitação
pendente anterior será substituída e um novo `requestId` será criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um Node como **paired** quando o role de pareamento de dispositivo inclui `node`.
- O registro de pareamento de dispositivo é o contrato durável de roles aprovados. A
  rotação de token permanece dentro desse contrato; ela não pode elevar um Node pareado para um
  role diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) é um armazenamento separado
  de pareamento de Node controlado pelo Gateway; ele **não** controla o handshake WS de `connect`.
- O escopo de aprovação segue os comandos declarados da solicitação pendente:
  - solicitação sem comando: `operator.pairing`
  - comandos de Node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de Node remoto (system.run)

Use um **host de Node** quando seu Gateway estiver em uma máquina e você quiser que comandos
sejam executados em outra. O model ainda fala com o **Gateway**; o Gateway
encaminha chamadas `exec` para o **host de Node** quando `host=node` é selecionado.

### O que executa onde

- **Host do Gateway**: recebe mensagens, executa o model, roteia chamadas de ferramenta.
- **Host de Node**: executa `system.run`/`system.which` na máquina do Node.
- **Aprovações**: aplicadas no host de Node por meio de `~/.openclaw/exec-approvals.json`.

Observação sobre aprovações:

- Execuções de Node com suporte de aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de shell/runtime de arquivos, o OpenClaw também vincula, no melhor esforço, um operando
  local concreto de arquivo e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não puder identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução com suporte de aprovação será negada em vez de fingir cobertura completa do runtime. Use sandboxing,
  hosts separados ou uma lista de permissões confiável/fluxo completo explícito para semânticas mais amplas de interpretador.

### Iniciar um host de Node (foreground)

Na máquina do Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind loopback)

Se o Gateway usar bind em loopback (`gateway.bind=loopback`, padrão no modo local),
hosts de Node remotos não podem se conectar diretamente. Crie um túnel SSH e aponte o
host de Node para a ponta local do túnel.

Exemplo (host de Node -> host do Gateway):

```bash
# Terminal A (mantenha em execução): encaminha a porta local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporte o token do gateway e conecte-se pelo túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` oferece suporte a auth por token ou senha.
- Variáveis de ambiente são preferidas: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- O fallback da config é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de Node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis conforme as regras de precedência remota.
- Se SecretRefs ativos de `gateway.auth.*` estiverem configurados, mas não resolvidos, o auth do host de Node falha de forma fechada.
- A resolução de auth do host de Node só considera variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host de Node (serviço)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Parear + nomear

No host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se o Node tentar novamente com detalhes de auth alterados, execute novamente `openclaw devices list`
e aprove o `requestId` atual.

Opções de nome:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição no Gateway).

### Adicionar comandos à lista de permissões

Aprovações de exec são **por host de Node**. Adicione entradas à lista de permissões a partir do Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host de Node em `~/.openclaw/exec-approvals.json`.

### Direcionar exec para o Node

Configure padrões (config do Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Depois de definido, qualquer chamada `exec` com `host=node` será executada no host de Node (sujeita à
lista de permissões/aprovações do Node).

`host=auto` não escolherá implicitamente o Node por conta própria, mas uma solicitação explícita por chamada com `host=node` é permitida a partir de `auto`. Se você quiser que exec no Node seja o padrão da sessão, defina `tools.exec.host=node` ou `/exec host=node ...` explicitamente.

Relacionado:

- [CLI de host de Node](/pt-BR/cli/node)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)

## Chamando comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem helpers de nível mais alto para os fluxos de trabalho comuns de “dar ao agente um anexo MEDIA”.

## Capturas de tela (snapshots de canvas)

Se o Node estiver exibindo o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Helper da CLI (grava em um arquivo temporário e imprime `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles de Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Observações:

- `canvas present` aceita URLs ou caminhos de arquivo locais (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Apenas A2UI v0.8 JSONL é compatível (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # padrão: ambos os lados (2 linhas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O Node precisa estar em **foreground** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar cargas base64 grandes demais.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (Nodes)

Nodes compatíveis expõem `screen.record` (`mp4`). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do Node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa captura de microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando houver várias disponíveis.

## Localização (Nodes)

Nodes expõem `location.get` quando Location está ativado nas configurações.

Helper da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- A localização fica **desativada por padrão**.
- “Always” exige permissão do sistema; a busca em segundo plano é no melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (Nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Chamada de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- O prompt de permissão precisa ser aceito no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos apenas com Wi‑Fi e sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nodes Android podem anunciar famílias adicionais de comandos quando as capacidades correspondentes estiverem ativadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemplos de chamadas:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- Comandos de movimento são controlados por capacidade com base nos sensores disponíveis.

## Comandos de sistema (host de Node / Node mac)

O Node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de Node headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída na carga.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície direta de RPC para comandos explícitos de Node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho `exec`.
- O caminho `exec` prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o Gateway encaminha esse plano armazenado, não qualquer campo de comando/cwd/sessão editado depois pelo chamador.
- `system.notify` respeita o estado de permissão de notificações no app do macOS.
- Metadados não reconhecidos de `platform` / `deviceFamily` do Node usam uma lista de permissões conservadora padrão que exclui `system.run` e `system.which`. Se você realmente precisar desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de solicitação são reduzidos a uma lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo de lista de permissões, wrappers conhecidos de despacho (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez dos caminhos do wrapper. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões é persistida automaticamente.
- Em hosts de Node Windows no modo de lista de permissões, execuções com wrapper de shell via `cmd.exe /c` exigem aprovação (uma entrada de lista de permissões sozinha não permite automaticamente a forma com wrapper).
- `system.notify` oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de Node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas extras em PATH, configure o ambiente do serviço do host de Node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo Node do macOS, `system.run` é controlado por aprovações de exec no app do macOS (Settings → Exec approvals).
  Ask/allowlist/full se comportam da mesma forma que no host de Node headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de Node headless, `system.run` é controlado por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Binding de exec em Node

Quando vários Nodes estão disponíveis, você pode vincular exec a um Node específico.
Isso define o Node padrão para `exec host=node` (e pode ser substituído por agente).

Padrão global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Substituição por agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Remova para permitir qualquer Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado por nome de permissão (por exemplo `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de Node headless (multiplataforma)

O OpenClaw pode executar um **host de Node headless** (sem UI) que se conecta ao WebSocket do Gateway
e expõe `system.run` / `system.which`. Isso é útil em Linux/Windows
ou para executar um Node mínimo junto com um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é necessário (o Gateway mostrará um prompt de pareamento de dispositivo).
- O host de Node armazena seu id de Node, token, nome de exibição e informações de conexão do Gateway em `~/.openclaw/node.json`.
- Aprovações de exec são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (veja [Aprovações de exec](/pt-BR/tools/exec-approvals)).
- No macOS, o host de Node headless executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host exec do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de forma fechada se ele não estiver disponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo Node no Mac

- O app de barra de menus do macOS se conecta ao servidor WS do Gateway como um Node (assim `openclaw nodes …` funciona contra este Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

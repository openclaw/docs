---
read_when:
    - Pareando nodes iOS/Android com um gateway
    - Usando canvas/camera do node para contexto do agente
    - Adicionando novos comandos de node ou helpers de CLI
summary: 'Nodes: pareamento, capacidades, permissões e helpers de CLI para canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T05:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Um **node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [Gateway protocol](/pt-BR/gateway/protocol).

Transporte legado: [Bridge protocol](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para nodes atuais).

O macOS também pode executar em **modo node**: o app da barra de menus se conecta ao servidor WS do Gateway e expõe seus comandos locais de canvas/camera como um node (então `openclaw nodes …` funciona neste Mac).

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de gateway.
- Mensagens de Telegram/WhatsApp/etc. chegam ao **gateway**, não aos nodes.
- Runbook de solução de problemas: [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)

## Pareamento + status

**Nodes WS usam pareamento de dispositivo.** Nodes apresentam uma identidade de dispositivo durante `connect`; o Gateway
cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove via CLI de dispositivos (ou UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se um node tentar novamente com detalhes de autenticação alterados (role/scopes/chave pública), a solicitação
pendente anterior é substituída e um novo `requestId` é criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um node como **paired** quando o papel de pareamento do dispositivo inclui `node`.
- O registro de pareamento do dispositivo é o contrato durável de papéis aprovados. A
  rotação de token permanece dentro desse contrato; ela não pode promover um node pareado para um
  papel diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) é um armazenamento separado de
  pareamento de node controlado pelo gateway; ele **não** controla o handshake de `connect` do WS.
- O escopo de aprovação segue os comandos declarados da solicitação pendente:
  - solicitação sem comando: `operator.pairing`
  - comandos de node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (`system.run`)

Use um **host de node** quando seu Gateway roda em uma máquina e você quer que comandos
sejam executados em outra. O modelo ainda fala com o **gateway**; o gateway
encaminha chamadas `exec` para o **host de node** quando `host=node` é selecionado.

### O que roda onde

- **Host do gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramenta.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.openclaw/exec-approvals.json`.

Observação sobre aprovações:

- Execuções de node com aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de shell/arquivo de runtime, o OpenClaw também faz o melhor esforço para vincular um operando local de
  arquivo concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução com aprovação é negada em vez de fingir cobertura completa de runtime. Use sandboxing,
  hosts separados ou uma allowlist explícita confiável/fluxo completo para semânticas mais amplas de interpretador.

### Iniciar um host de node (foreground)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind loopback)

Se o Gateway estiver vinculado a loopback (`gateway.bind=loopback`, padrão no modo local),
hosts remotos de node não conseguem se conectar diretamente. Crie um túnel SSH e aponte o
host de node para a extremidade local do túnel.

Exemplo (host de node -> host do gateway):

```bash
# Terminal A (mantenha em execução): encaminhar 18790 local -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exportar o token do gateway e conectar pelo túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` oferece suporte a autenticação por token ou senha.
- Variáveis de ambiente são preferíveis: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- O fallback de configuração é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis segundo as regras de precedência remota.
- Se SecretRefs ativos de `gateway.auth.*` locais estiverem configurados, mas não resolvidos, a autenticação do host de node falha de forma segura.
- A resolução de autenticação do host de node só respeita variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host de node (serviço)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Parear + nomear

No host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se o node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list`
e aprove o `requestId` atual.

Opções de nome:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sobrescrita pelo gateway).

### Colocar os comandos na allowlist

Aprovações de execução são **por host de node**. Adicione entradas à allowlist a partir do gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host de node em `~/.openclaw/exec-approvals.json`.

### Apontar exec para o node

Configurar padrões (configuração do gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```
/exec host=node security=allowlist node=<id-or-name>
```

Depois de definido, qualquer chamada `exec` com `host=node` roda no host de node (sujeita à
allowlist/aprovações do node).

`host=auto` não escolherá implicitamente o node por conta própria, mas uma solicitação explícita por chamada `host=node` é permitida a partir de `auto`. Se você quiser que exec em node seja o padrão da sessão, defina `tools.exec.host=node` ou `/exec host=node ...` explicitamente.

Relacionados:

- [Node host CLI](/pt-BR/cli/node)
- [Exec tool](/pt-BR/tools/exec)
- [Exec approvals](/pt-BR/tools/exec-approvals)

## Invocando comandos

Nível baixo (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem helpers de nível mais alto para os fluxos comuns de “dar ao agente um anexo MEDIA”.

## Screenshots (snapshots de canvas)

Se o node estiver mostrando o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Helper de CLI (grava em um arquivo temporário e imprime `MEDIA:<path>`):

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

- `canvas present` aceita URLs ou caminhos de arquivo local (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Apenas JSONL A2UI v0.8 é compatível (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # padrão: ambas as orientações (2 linhas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O node deve estar em **foreground** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 grandes demais.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nodes)

Nodes compatíveis expõem `screen.record` (`mp4`). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desabilita captura de microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando houver várias.

## Localização (nodes)

Nodes expõem `location.get` quando Location está habilitado nas configurações.

Helper de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- Localização fica **desligada por padrão**.
- “Always” exige permissão do sistema; busca em segundo plano é best-effort.
- A resposta inclui latitude/longitude, precisão (metros) e timestamp.

## SMS (nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Invoke de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- O prompt de permissão deve ser aceito no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos apenas Wi‑Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nodes Android podem anunciar famílias adicionais de comandos quando as capacidades correspondentes estão habilitadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- Comandos de motion são controlados por capacidade conforme sensores disponíveis.

## Comandos de sistema (host de node / node mac)

O node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de node headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície direta de RPC para comandos explícitos de node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Uma vez que a
  aprovação é concedida, o gateway encaminha esse plano armazenado, não qualquer
  campo de command/cwd/session editado posteriormente pelo chamador.
- `system.notify` respeita o estado de permissão de notificações no app macOS.
- Metadados não reconhecidos de node `platform` / `deviceFamily` usam uma allowlist padrão conservadora que exclui `system.run` e `system.which`. Se você realmente precisar desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de solicitação são reduzidos a uma allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões allow-always no modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos internos do executável em vez de caminhos do wrapper. Se o unwrapping não for seguro, nenhuma entrada de allowlist é persistida automaticamente.
- Em hosts de node Windows no modo allowlist, execuções com wrapper de shell via `cmd.exe /c` exigem aprovação (apenas a entrada na allowlist não libera automaticamente a forma com wrapper).
- `system.notify` oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de node ignoram sobrescritas de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas extras no PATH, configure o ambiente do serviço do host de node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo node do macOS, `system.run` é controlado por aprovações de execução no app macOS (Settings → Exec approvals).
  Ask/allowlist/full se comportam da mesma forma que no host de node headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de node headless, `system.run` é controlado por aprovações de execução (`~/.openclaw/exec-approvals.json`).

## Binding de node para exec

Quando vários nodes estão disponíveis, você pode vincular exec a um node específico.
Isso define o node padrão para `exec host=node` (e pode ser sobrescrito por agente).

Padrão global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sobrescrita por agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Remova a definição para permitir qualquer node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado por nome de permissão (por exemplo `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de node headless (cross-platform)

O OpenClaw pode executar um **host de node headless** (sem UI) que se conecta ao WebSocket do Gateway
e expõe `system.run` / `system.which`. Isso é útil em Linux/Windows
ou para executar um node mínimo ao lado de um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento continua sendo necessário (o Gateway mostrará um prompt de pareamento de dispositivo).
- O host de node armazena seu ID de node, token, nome de exibição e informações de conexão com o gateway em `~/.openclaw/node.json`.
- Aprovações de execução são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Exec approvals](/pt-BR/tools/exec-approvals)).
- No macOS, o host de node headless executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de execução do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de forma segura se ele estiver indisponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo node no Mac

- O app da barra de menus do macOS se conecta ao servidor WS do Gateway como um node (então `openclaw nodes …` funciona neste Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

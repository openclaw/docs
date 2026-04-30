---
read_when:
    - Emparelhamento de nós iOS/Android a um Gateway
    - Usando canvas/câmera do Node para contexto do agente
    - Adicionar novos comandos do Node ou auxiliares da CLI
summary: 'Nós: pareamento, capacidades, permissões e auxiliares da CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nós
x-i18n:
    generated_at: "2026-04-30T09:56:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Um **node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [protocolo de Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para os nodes atuais).

O macOS também pode ser executado em **modo node**: o app da barra de menus se conecta ao servidor
WS do Gateway e expõe seus comandos locais de canvas/câmera como um node (assim
`openclaw nodes …` funciona contra este Mac). No modo de gateway remoto, a automação
do navegador é tratada pelo host de node da CLI (`openclaw node run` ou o
serviço de node instalado), não pelo node do app nativo.

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de gateway.
- Mensagens do Telegram/WhatsApp/etc. chegam ao **gateway**, não aos nodes.
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

Se um node tentar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação
pendente anterior é substituída e um novo `requestId` é criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um node como **pareado** quando sua função de pareamento de dispositivo inclui `node`.
- O registro de pareamento de dispositivo é o contrato durável de função aprovada. A rotação
  de token permanece dentro desse contrato; ela não pode promover um node pareado a uma
  função diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) é um armazenamento separado
  de pareamento de nodes pertencente ao gateway; ele **não** bloqueia o handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` exclui entradas obsoletas desse
  armazenamento separado de pareamento de nodes pertencente ao gateway.
- O escopo de aprovação segue os comandos declarados pela solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (system.run)

Use um **host de node** quando seu Gateway é executado em uma máquina e você quer que comandos
sejam executados em outra. O modelo ainda conversa com o **gateway**; o gateway
encaminha chamadas `exec` ao **host de node** quando `host=node` é selecionado.

### O que roda onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramentas.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.openclaw/exec-approvals.json`.

Observação sobre aprovação:

- Execuções de node baseadas em aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de arquivos de shell/runtime, o OpenClaw também faz o melhor esforço para vincular um operando de arquivo local
  concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução baseada em aprovação é negada em vez de fingir cobertura completa de runtime. Use sandboxing,
  hosts separados ou uma allowlist/workflow completo confiável explícito para semânticas mais amplas de interpretador.

### Iniciar um host de node (primeiro plano)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind de loopback)

Se o Gateway fizer bind ao loopback (`gateway.bind=loopback`, padrão no modo local),
hosts de node remotos não podem se conectar diretamente. Crie um túnel SSH e aponte o
host de node para a extremidade local do túnel.

Exemplo (host de node -> host do gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` oferece suporte a autenticação por token ou senha.
- Variáveis de ambiente são preferidas: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- O fallback de configuração é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis conforme as regras de precedência remota.
- Se SecretRefs `gateway.auth.*` locais ativos estiverem configurados, mas não resolvidos, a autenticação do host de node falha fechada.
- A resolução de autenticação do host de node honra apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host de node (serviço)

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

Se o node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list`
e aprove o `requestId` atual.

Opções de nomenclatura:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição pelo gateway).

### Colocar os comandos na allowlist

Aprovações de exec são **por host de node**. Adicione entradas de allowlist a partir do gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host de node em `~/.openclaw/exec-approvals.json`.

### Apontar exec para o node

Configure os padrões (configuração do gateway):

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

Relacionado:

- [CLI do host de node](/pt-BR/cli/node)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)

## Invocando comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem auxiliares de nível mais alto para os workflows comuns de “dar ao agente um anexo MEDIA”.

## Política de comandos

Comandos de node precisam passar por dois controles antes que possam ser invocados:

1. O node deve declarar o comando na lista `connect.commands` do WebSocket.
2. A política de plataforma do gateway deve permitir o comando declarado.

Nodes complementares Windows e macOS permitem comandos declarados seguros, como
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot` por padrão.
Comandos perigosos ou com alto impacto de privacidade, como `camera.snap`, `camera.clip` e
`screen.record`, ainda exigem opt-in explícito com
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` sempre prevalece sobre
padrões e entradas extras de allowlist.

Comandos de node pertencentes a Plugins podem adicionar uma política de node-invoke do Gateway. Essa política
roda depois da verificação de allowlist e antes do encaminhamento para o node, então RPC bruto
`node.invoke`, auxiliares da CLI e ferramentas de agente dedicadas compartilham o mesmo limite de permissão
do Plugin. Comandos de node perigosos de Plugin ainda exigem opt-in explícito de
`gateway.nodes.allowCommands`.

Depois que um node alterar sua lista de comandos declarados, rejeite o pareamento de dispositivo antigo
e aprove a nova solicitação para que o gateway armazene o snapshot de comandos atualizado.

## Capturas de tela (snapshots de canvas)

Se o node estiver exibindo o Canvas (WebView), `canvas.snapshot` retorna `{ format, base64 }`.

Auxiliar da CLI (grava em um arquivo temporário e imprime `MEDIA:<path>`):

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

- Apenas A2UI v0.8 JSONL é compatível (v0.9/createSurface é rejeitado).

## Fotos + vídeos (câmera do node)

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

- O node deve estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 grandes demais.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (nodes)

Nodes compatíveis expõem `screen.record` (mp4). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa a captura do microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando várias telas estiverem disponíveis.

## Localização (nodes)

Nodes expõem `location.get` quando Localização está habilitada nas configurações.

Auxiliar da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- Localização fica **desativada por padrão**.
- “Sempre” exige permissão do sistema; busca em segundo plano é feita em melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- O prompt de permissão deve ser aceito no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos somente Wi-Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nodes Android podem anunciar famílias de comandos adicionais quando as capacidades correspondentes estão habilitadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemplos de invocação:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- Comandos de movimento são controlados por capacidade conforme os sensores disponíveis.

## Comandos do sistema (host de Node / Node Mac)

O Node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de Node sem interface gráfica expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície RPC direta para comandos explícitos de Node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o Gateway encaminha esse plano armazenado, não quaisquer campos de comando/cwd/sessão editados posteriormente pelo chamador.
- `system.notify` respeita o estado de permissão de notificações no aplicativo macOS.
- Metadados de Node `platform` / `deviceFamily` não reconhecidos usam uma lista de permissões padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de solicitação são reduzidos a uma lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de sempre permitir no modo de lista de permissões, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem os caminhos dos executáveis internos em vez dos caminhos dos wrappers. Se o desempacotamento não for seguro, nenhuma entrada de lista de permissões será persistida automaticamente.
- Em hosts de Node Windows no modo de lista de permissões, execuções de wrapper de shell via `cmd.exe /c` exigem aprovação (a entrada de lista de permissões sozinha não permite automaticamente a forma com wrapper).
- `system.notify` oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de Node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas extras em PATH, configure o ambiente de serviço do host de Node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo de Node macOS, `system.run` é controlado por aprovações de exec no aplicativo macOS (Ajustes → Aprovações de exec).
  Solicitar/lista de permissões/completo se comportam da mesma forma que no host de Node sem interface gráfica; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de Node sem interface gráfica, `system.run` é controlado por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Vinculação de Node de exec

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

Remova a configuração para permitir qualquer Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado pelo nome da permissão (por exemplo, `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de Node sem interface (multiplataforma)

O OpenClaw pode executar um **host de Node sem interface** (sem UI) que se conecta ao WebSocket do Gateway e expõe `system.run` / `system.which`. Isso é útil no Linux/Windows ou para executar um Node mínimo junto a um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é obrigatório (o Gateway exibirá um prompt de pareamento de dispositivo).
- O host de Node armazena seu ID do Node, token, nome de exibição e informações de conexão com o Gateway em `~/.openclaw/node.json`.
- As aprovações de execução são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Aprovações de execução](/pt-BR/tools/exec-approvals)).
- No macOS, o host de Node sem interface executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de execução do app companion; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar de forma fechada se ele estiver indisponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo de Node no Mac

- O app de barra de menus do macOS se conecta ao servidor WS do Gateway como um Node (para que `openclaw nodes …` funcione com este Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

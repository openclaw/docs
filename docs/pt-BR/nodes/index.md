---
read_when:
    - Emparelhando nós iOS/Android a um Gateway
    - Usando canvas/câmera do node para contexto do agente
    - Adicionando novos comandos Node ou auxiliares de CLI
summary: 'Nós: pareamento, capacidades, permissões e auxiliares de CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nós
x-i18n:
    generated_at: "2026-07-03T09:28:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Um **node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [protocolo Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para nodes atuais).

O macOS também pode executar em **modo node**: o app da barra de menus se conecta ao
servidor WS do Gateway e expõe seus comandos locais de canvas/câmera como um node (para que
`openclaw nodes …` funcione contra este Mac). No modo de gateway remoto, a automação de
navegador é tratada pelo host de node da CLI (`openclaw node run` ou o
serviço de node instalado), não pelo node do app nativo.

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de gateway.
- Mensagens de Telegram/WhatsApp/etc. chegam ao **gateway**, não aos nodes.
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

Se um node tentar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação
pendente anterior será substituída e um novo `requestId` será criado. Execute novamente
`openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um node como **pareado** quando a função de pareamento do dispositivo inclui `node`.
- O registro de pareamento do dispositivo é o contrato durável de função aprovada. A rotação de
  tokens permanece dentro desse contrato; ela não pode promover um node pareado para uma
  função diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) é um armazenamento separado de
  pareamento de nodes pertencente ao gateway; ele **não** controla o handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` remove um pareamento de node. Para um
  node respaldado por dispositivo, ele revoga a função `node` do dispositivo em `devices/paired.json`
  e desconecta as sessões desse dispositivo com função de node — um dispositivo de função mista mantém
  sua linha e perde apenas a função `node`, enquanto uma linha de dispositivo apenas node é
  excluída. Ele também limpa qualquer entrada correspondente do armazenamento separado de pareamento de nodes
  pertencente ao gateway. `operator.pairing` pode remover linhas de node que não sejam de operador; um
  chamador com token de dispositivo que revoga sua própria função de node em um dispositivo de função mista
  também precisa de `operator.admin`.
- O escopo de aprovação segue os comandos declarados da solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de node não exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (system.run)

Use um **host de node** quando seu Gateway roda em uma máquina e você quer que comandos
sejam executados em outra. O modelo ainda conversa com o **gateway**; o gateway
encaminha chamadas `exec` para o **host de node** quando `host=node` é selecionado.

### O que roda onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramenta.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.openclaw/exec-approvals.json`.

Observação sobre aprovação:

- Execuções de node respaldadas por aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de arquivos por shell/runtime, o OpenClaw também tenta vincular um operando de arquivo local
  concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime,
  a execução respaldada por aprovação será negada em vez de simular cobertura completa do runtime. Use sandboxing,
  hosts separados ou uma allowlist confiável explícita/fluxo completo para semânticas mais amplas de interpretador.

### Iniciar um host de node (primeiro plano)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind de loopback)

Se o Gateway fizer bind em loopback (`gateway.bind=loopback`, padrão no modo local),
hosts de node remotos não conseguirão se conectar diretamente. Crie um túnel SSH e aponte o
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
- Se SecretRefs locais ativos `gateway.auth.*` estiverem configurados, mas não resolvidos, a autenticação do host de node falhará fechada.
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

Opções de nomeação:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição no gateway).

### Colocar os comandos na allowlist

Aprovações de exec são **por host de node**. Adicione entradas de allowlist pelo gateway:

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

Depois de configurada, qualquer chamada `exec` com `host=node` roda no host de node (sujeita à
allowlist/aprovações do node).

`host=auto` não escolherá implicitamente o node por conta própria, mas uma solicitação explícita por chamada `host=node` é permitida a partir de `auto`. Se quiser que exec em node seja o padrão da sessão, defina explicitamente `tools.exec.host=node` ou `/exec host=node ...`.

Relacionado:

- [CLI do host de node](/pt-BR/cli/node)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)

### Inferência local de modelo

Um node desktop ou servidor pode expor modelos compatíveis com chat de um servidor Ollama
em execução nesse node. Agentes usam a ferramenta `node_inference` do Plugin Ollama para
descobrir modelos instalados e executar um prompt limitado remotamente; o Gateway
não precisa de acesso direto de rede ao Ollama. Consulte [inferência local de node do Ollama](/pt-BR/providers/ollama#node-local-inference)
para configuração, filtragem de modelos e comandos de verificação direta.

## Invocar comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem helpers de nível mais alto para os fluxos de trabalho comuns de "dar ao agente um anexo MEDIA".

## Política de comandos

Comandos de node precisam passar por dois controles antes de poderem ser invocados:

1. O node precisa declarar o comando em sua lista WebSocket `connect.commands`.
2. A política de plataforma do gateway precisa permitir o comando declarado.

Nodes complementares de Windows e macOS permitem comandos declarados seguros como
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot` por padrão.
Nodes confiáveis que anunciam a capacidade `talk` ou declaram comandos `talk.*`
também permitem comandos declarados de push-to-talk (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) por padrão, independentemente do rótulo de plataforma.
Comandos perigosos ou com alto impacto de privacidade, como `camera.snap`, `camera.clip` e
`screen.record`, ainda exigem opt-in explícito com
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` sempre prevalece sobre
padrões e entradas adicionais da allowlist.

Comandos de node pertencentes a Plugins podem adicionar uma política de node-invoke do Gateway. Essa política
roda após a verificação da allowlist e antes do encaminhamento ao node, então o
`node.invoke` bruto, os helpers da CLI e ferramentas dedicadas de agente compartilham o mesmo
limite de permissão do Plugin. Comandos perigosos de node de Plugin ainda exigem opt-in explícito em
`gateway.nodes.allowCommands`.

Depois que um node altera sua lista de comandos declarados, rejeite o pareamento de dispositivo antigo
e aprove a nova solicitação para que o gateway armazene o snapshot de comandos atualizado.

## Configuração (`openclaw.json`)

Configurações relacionadas a nodes ficam em `gateway.nodes` e `tools.exec`:

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

Use nomes exatos de comandos de node. `denyCommands` remove um comando mesmo quando um
padrão de plataforma ou entrada `allowCommands` o permitiria de outra forma. Consulte a
[referência de configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway-field-details)
para detalhes dos campos de pareamento de nodes do gateway e política de comandos.

Substituição de node exec por agente:

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

## Capturas de tela (snapshots do canvas)

Se o node estiver exibindo o Canvas (WebView), `canvas.snapshot` retornará `{ format, base64 }`.

Helper da CLI (grava em um arquivo temporário e imprime o caminho salvo):

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

- `canvas present` aceita URLs ou caminhos de arquivos locais (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS inline (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Nodes móveis usam uma página A2UI agrupada e pertencente ao app para renderização com suporte a ações.
- Somente A2UI v0.8 JSONL é compatível (v0.9/createSurface é rejeitado).
- iOS e Android renderizam páginas remotas do Gateway Canvas, mas ações de botão A2UI são despachadas somente a partir da página A2UI agrupada e pertencente ao app. Páginas A2UI HTTP/HTTPS hospedadas pelo Gateway são somente renderização nesses clientes móveis.

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

- O Node deve estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 grandes demais.
- O Android solicitará permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas falham com `*_PERMISSION_REQUIRED`.

## Gravações de tela (Nodes)

Nodes compatíveis expõem `screen.record` (mp4). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do Node.
- Gravações de tela são limitadas a `<= 60s`.
- `--no-audio` desativa a captura do microfone em plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando várias telas estiverem disponíveis.

## Localização (Nodes)

Nodes expõem `location.get` quando Localização está habilitada nas configurações.

Auxiliar da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- Localização fica **desativada por padrão**.
- "Sempre" requer permissão do sistema; a busca em segundo plano é feita por melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e timestamp.

## SMS (Nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- A solicitação de permissão deve ser aceita no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos somente Wi-Fi sem telefonia não anunciarão `sms.send`.

## Comandos de dispositivo Android + dados pessoais

Nodes Android podem anunciar famílias de comandos adicionais quando as capacidades correspondentes estão habilitadas.

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

- `device.apps` é opt-in e retorna apps visíveis no launcher por padrão.
- Comandos de movimento são protegidos por capacidade conforme os sensores disponíveis.

## Comandos do sistema (host do Node / Node Mac)

O Node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host Node sem interface expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície RPC direta para comandos explícitos de Node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem somente no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o Gateway encaminha esse plano armazenado, não quaisquer campos
  command/cwd/session editados posteriormente pelo chamador.
- `system.notify` respeita o estado da permissão de notificação no app macOS.
- Metadados de Node `platform` / `deviceFamily` não reconhecidos usam uma allowlist padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` aceita `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de requisição são reduzidos a uma allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo allowlist, wrappers de despacho conhecidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executáveis internos em vez de caminhos de wrapper. Se o desembrulhamento não for seguro, nenhuma entrada de allowlist será persistida automaticamente.
- Em hosts Node Windows no modo allowlist, execuções de wrapper de shell via `cmd.exe /c` exigem aprovação (a entrada de allowlist sozinha não permite automaticamente a forma de wrapper).
- `system.notify` aceita `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts Node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Se você precisar de entradas extras em PATH, configure o ambiente do serviço do host Node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo Node do macOS, `system.run` é protegido por aprovações de exec no app macOS (Configurações → Aprovações de exec).
  Ask/allowlist/full se comportam da mesma forma que o host Node sem interface; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host Node sem interface, `system.run` é protegido por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Vinculação de Node para exec

Quando vários Nodes estão disponíveis, você pode vincular exec a um Node específico.
Isso define o Node padrão para `exec host=node` (e pode ser substituído por agente).

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

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado por nome de permissão (por exemplo, `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host Node sem interface (multiplataforma)

O OpenClaw pode executar um **host Node sem interface** (sem UI) que se conecta ao WebSocket
do Gateway e expõe `system.run` / `system.which`. Isso é útil no Linux/Windows
ou para executar um Node mínimo junto a um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é necessário (o Gateway mostrará uma solicitação de pareamento de dispositivo).
- O host Node armazena seu ID de Node, token, nome de exibição e informações de conexão do Gateway em `~/.openclaw/node.json`.
- Aprovações de exec são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Aprovações de exec](/pt-BR/tools/exec-approvals)).
- No macOS, o host Node sem interface executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de exec do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar fechado se ele estiver indisponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo Node do Mac

- O app de barra de menu do macOS se conecta ao servidor WS do Gateway como um Node (então `openclaw nodes …` funciona contra este Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

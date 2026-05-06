---
read_when:
    - Emparelhamento de nós iOS/Android com um Gateway
    - Usando canvas/câmera do Node para contexto do agente
    - Adicionando novos comandos Node ou auxiliares da CLI
summary: 'Nós: emparelhamento, capacidades, permissões e auxiliares da CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nodes
x-i18n:
    generated_at: "2026-05-06T06:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Um **node** é um dispositivo complementar (macOS/iOS/Android/headless) que se conecta ao **WebSocket** do Gateway (mesma porta dos operadores) com `role: "node"` e expõe uma superfície de comandos (por exemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Detalhes do protocolo: [protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [protocolo Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL;
apenas histórico para os nodes atuais).

O macOS também pode ser executado em **modo node**: o app da barra de menus se conecta ao servidor WS do Gateway e expõe seus comandos locais de canvas/câmera como um node (então `openclaw nodes …` funciona contra este Mac). No modo de gateway remoto, a automação de navegador é tratada pelo host de node da CLI (`openclaw node run` ou o serviço de node instalado), não pelo node do app nativo.

Observações:

- Nodes são **periféricos**, não gateways. Eles não executam o serviço de gateway.
- Mensagens do Telegram/WhatsApp/etc. chegam ao **gateway**, não aos nodes.
- Runbook de solução de problemas: [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)

## Pareamento + status

**Nodes WS usam pareamento de dispositivo.** Nodes apresentam uma identidade de dispositivo durante `connect`; o Gateway cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove pela CLI de dispositivos (ou pela UI).

CLI rápida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se um node tentar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute novamente `openclaw devices list` antes de aprovar.

Observações:

- `nodes status` marca um node como **pareado** quando sua função de pareamento de dispositivo inclui `node`.
- O registro de pareamento de dispositivo é o contrato durável de função aprovada. A rotação de token permanece dentro desse contrato; ela não pode promover um node pareado para uma função diferente que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) é um armazenamento de pareamento de node separado, pertencente ao gateway; ele **não** controla o handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` exclui entradas obsoletas desse armazenamento separado de pareamento de node pertencente ao gateway.
- O escopo de aprovação segue os comandos declarados pela solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de node sem exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host de node remoto (system.run)

Use um **host de node** quando seu Gateway for executado em uma máquina e você quiser que comandos sejam executados em outra. O modelo ainda conversa com o **gateway**; o gateway encaminha chamadas `exec` para o **host de node** quando `host=node` é selecionado.

### O que roda onde

- **Host do Gateway**: recebe mensagens, executa o modelo, roteia chamadas de ferramentas.
- **Host de node**: executa `system.run`/`system.which` na máquina do node.
- **Aprovações**: aplicadas no host de node via `~/.openclaw/exec-approvals.json`.

Observação sobre aprovação:

- Execuções de node respaldadas por aprovação vinculam o contexto exato da solicitação.
- Para execuções diretas de arquivos por shell/runtime, o OpenClaw também tenta, em regime de melhor esforço, vincular um operando de arquivo local concreto e nega a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime, a execução respaldada por aprovação será negada em vez de simular cobertura completa de runtime. Use sandboxing, hosts separados ou uma allowlist/workflow completo explicitamente confiável para semânticas mais amplas de interpretador.

### Iniciar um host de node (primeiro plano)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via túnel SSH (bind de loopback)

Se o Gateway fizer bind ao loopback (`gateway.bind=loopback`, padrão no modo local), hosts de node remotos não conseguem se conectar diretamente. Crie um túnel SSH e aponte o host de node para a extremidade local do túnel.

Exemplo (host de node -> host do gateway):

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
- No modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` são elegíveis conforme as regras de precedência remota.
- Se SecretRefs locais ativos `gateway.auth.*` estiverem configurados, mas não resolvidos, a autenticação do host de node falha fechada.
- A resolução de autenticação do host de node considera apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

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

Se o node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list` e aprove o `requestId` atual.

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

Depois de definido, qualquer chamada `exec` com `host=node` é executada no host de node (sujeita à allowlist/aprovações do node).

`host=auto` não escolherá implicitamente o node por conta própria, mas uma solicitação explícita por chamada `host=node` é permitida a partir de `auto`. Se você quiser que exec no node seja o padrão da sessão, defina `tools.exec.host=node` ou `/exec host=node ...` explicitamente.

Relacionado:

- [CLI do host de node](/pt-BR/cli/node)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)

## Invocando comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Existem auxiliares de nível mais alto para os workflows comuns de "dar ao agente um anexo MEDIA".

## Política de comandos

Comandos de node devem passar por duas barreiras antes de poderem ser invocados:

1. O node deve declarar o comando em sua lista `connect.commands` do WebSocket.
2. A política de plataforma do gateway deve permitir o comando declarado.

Nodes complementares do Windows e macOS permitem, por padrão, comandos declarados seguros como `canvas.*`, `camera.list`, `location.get` e `screen.snapshot`. Nodes confiáveis que anunciam a capacidade `talk` ou declaram comandos `talk.*` também permitem, por padrão, comandos push-to-talk declarados (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), independentemente do rótulo de plataforma. Comandos perigosos ou com grande impacto de privacidade, como `camera.snap`, `camera.clip` e `screen.record`, ainda exigem opt-in explícito com `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` sempre prevalece sobre os padrões e entradas extras de allowlist.

Comandos de node pertencentes a Plugins podem adicionar uma política de node-invoke do Gateway. Essa política é executada após a verificação da allowlist e antes do encaminhamento para o node, então `node.invoke` bruto, auxiliares de CLI e ferramentas dedicadas de agente compartilham o mesmo limite de permissão do Plugin. Comandos de node perigosos de Plugin ainda exigem opt-in explícito em `gateway.nodes.allowCommands`.

Depois que um node alterar sua lista de comandos declarados, rejeite o pareamento de dispositivo antigo e aprove a nova solicitação para que o gateway armazene o snapshot de comandos atualizado.

## Capturas de tela (snapshots do canvas)

Se o node estiver mostrando o Canvas (WebView), `canvas.snapshot` retornará `{ format, base64 }`.

Auxiliar de CLI (grava em um arquivo temporário e imprime `MEDIA:<path>`):

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
openclaw nodes camera snap --node <idOrNameOrIp>            # padrão: ambas as orientações (2 linhas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O node deve estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- A duração do clipe é limitada (atualmente `<= 60s`) para evitar payloads base64 muito grandes.
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

Nodes expõem `location.get` quando Localização está ativada nas configurações.

Auxiliar de CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- Localização fica **desativada por padrão**.
- "Sempre" requer permissão do sistema; busca em segundo plano é feita em regime de melhor esforço.
- A resposta inclui lat/lon, precisão (metros) e carimbo de data/hora.

## SMS (nodes Android)

Nodes Android podem expor `sms.send` quando o usuário concede permissão de **SMS** e o dispositivo oferece suporte a telefonia.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- A solicitação de permissão deve ser aceita no dispositivo Android antes que a capacidade seja anunciada.
- Dispositivos somente Wi-Fi sem telefonia não anunciarão `sms.send`.

## Dispositivo Android + comandos de dados pessoais

Nodes Android podem anunciar famílias adicionais de comandos quando as capacidades correspondentes estão ativadas.

Famílias disponíveis:

- `device.status`, `device.info`, `device.permissions`, `device.health`
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
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Observações:

- Os comandos de movimento são controlados por capacidade, conforme os sensores disponíveis.

## Comandos do sistema (host de Node / Node Mac)

O Node macOS expõe `system.run`, `system.notify` e `system.execApprovals.get/set`.
O host de Node headless expõe `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução de shell agora passa pela ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície de RPC direto para comandos explícitos de Node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem apenas no caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Depois que uma
  aprovação é concedida, o Gateway encaminha esse plano armazenado, não quaisquer campos
  command/cwd/session editados posteriormente pelo chamador.
- `system.notify` respeita o estado de permissão de notificações no app macOS.
- Metadados de Node `platform` / `deviceFamily` não reconhecidos usam uma allowlist padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente via `gateway.nodes.allowCommands`.
- `system.run` aceita `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), valores `--env` com escopo de requisição são reduzidos a uma allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de sempre permitir em modo allowlist, wrappers de despacho conhecidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executáveis internos em vez de caminhos de wrappers. Se desembrulhar não for seguro, nenhuma entrada de allowlist será persistida automaticamente.
- Em hosts de Node Windows no modo allowlist, execuções de wrapper de shell via `cmd.exe /c` exigem aprovação (a entrada de allowlist sozinha não permite automaticamente o formato de wrapper).
- `system.notify` aceita `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Hosts de Node ignoram substituições de `PATH` e removem chaves perigosas de inicialização/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se você precisar de entradas extras em PATH, configure o ambiente do serviço do host de Node (ou instale ferramentas em locais padrão) em vez de passar `PATH` via `--env`.
- No modo Node macOS, `system.run` é controlado por aprovações de exec no app macOS (Ajustes → Aprovações de exec).
  Ask/allowlist/full se comportam da mesma forma que o host de Node headless; prompts negados retornam `SYSTEM_RUN_DENIED`.
- No host de Node headless, `system.run` é controlado por aprovações de exec (`~/.openclaw/exec-approvals.json`).

## Vinculação de Node exec

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

Remova a definição para permitir qualquer Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mapa de permissões

Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado pelo nome da permissão (por exemplo, `screenRecording`, `accessibility`) com valores booleanos (`true` = concedida).

## Host de Node headless (multiplataforma)

O OpenClaw pode executar um **host de Node headless** (sem UI) que se conecta ao WebSocket do Gateway
e expõe `system.run` / `system.which`. Isso é útil no Linux/Windows
ou para executar um Node mínimo junto de um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é obrigatório (o Gateway mostrará um prompt de pareamento de dispositivo).
- O host de Node armazena seu id de Node, token, nome de exibição e informações de conexão do Gateway em `~/.openclaw/node.json`.
- Aprovações de exec são aplicadas localmente via `~/.openclaw/exec-approvals.json`
  (consulte [Aprovações de exec](/pt-BR/tools/exec-approvals)).
- No macOS, o host de Node headless executa `system.run` localmente por padrão. Defina
  `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de exec do app complementar; adicione
  `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do app e falhar fechado se ele não estiver disponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo Node Mac

- O app de barra de menus do macOS se conecta ao servidor WS do Gateway como um Node (então `openclaw nodes …` funciona nesse Mac).
- No modo remoto, o app abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.

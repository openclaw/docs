---
read_when:
    - Implementando ou atualizando clientes WS do gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-24T05:53:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do Gateway (WebSocket)

O protocolo WS do Gateway é o **único plano de controle + transporte de node** do
OpenClaw. Todos os clientes (CLI, interface web, app macOS, nodes iOS/Android, nodes
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser um request `connect`.
- Frames pré-conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos habilitados,
  frames de entrada grandes demais e buffers lentos de saída emitem eventos `payload.large`
  antes de o gateway fechar ou descartar o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o
  corpo da mensagem, conteúdo de anexos, corpo bruto do frame, tokens, cookies ou valores secretos.

## Handshake (connect)

Gateway → Cliente (desafio pré-conexão):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Cliente → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Cliente:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` é opcional. `auth`
informa o papel/escopos negociados quando disponíveis, e inclui `deviceToken`
quando o gateway emite um.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` ainda pode informar as
permissões negociadas:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Quando um token de dispositivo é emitido, `hello-ok` também inclui:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante o handoff confiável de bootstrap, `hello-ok.auth` também pode incluir entradas
adicionais de papel limitadas em `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Para o fluxo integrado de bootstrap de node/operator, o token primário de node permanece com
`scopes: []` e qualquer token de operador transferido permanece limitado à
allowlist do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap permanecem
prefixadas por papel: entradas de operador satisfazem apenas requests de operador, e papéis que não sejam de operador
ainda precisam de escopos sob o prefixo do próprio papel.

### Exemplo de node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Enquadramento

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **idempotency keys** (consulte o schema).

## Papéis + escopos

### Papéis

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Escopos (operator)

Escopos comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC do gateway registrados por Plugin podem solicitar seu próprio escopo de operator, mas
prefixos reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos para `operator.admin`.

O escopo do método é apenas o primeiro controle. Alguns comandos slash alcançados por
`chat.send` aplicam verificações mais rígidas no nível do comando além disso. Por exemplo,
gravações persistentes de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- requests sem comando: `operator.pairing`
- requests com comandos de node sem exec: `operator.pairing` + `operator.write`
- requests que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declaram reivindicações de capacidade no momento do connect:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: controles granulares (por exemplo `screen.record`, `camera.capture`).

O Gateway trata isso como **claims** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que interfaces possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node**.

## Escopo de eventos de broadcast

Eventos de broadcast enviados pelo servidor por WebSocket são controlados por escopo para que sessões com escopo apenas de pareamento ou apenas de node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos e resultados de chamada de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses frames por completo.
- **Broadcasts `plugin.*` definidos por Plugin** são controlados por `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de connect/disconnect etc.) permanecem sem restrição para que a saúde do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por escopo por padrão (fail-closed), a menos que um manipulador registrado explicitamente alivie isso.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem ordenação monotônica nesse socket, mesmo quando clientes diferentes veem subconjuntos diferentes do fluxo de eventos filtrados por escopo.

## Famílias comuns de métodos RPC

A superfície pública de WS é mais ampla do que os exemplos de handshake/autenticação acima. Isso
não é um dump gerado — `hello-ok.features.methods` é uma lista conservadora
de descoberta construída a partir de `src/gateway/server-methods-list.ts` mais exports de métodos carregados de plugin/canal. Trate isso como descoberta de recursos, não como enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de saúde do gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o registrador recente e limitado de estabilidade de diagnóstico. Ele mantém metadados operacionais como nomes de evento, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/plugin e IDs de sessão. Ele não mantém texto de chat, corpos de Webhook, saídas de ferramenta, corpos brutos de request ou response, tokens, cookies ou valores secretos. Requer escopo operator read.
    - `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operator com escopo admin.
    - `gateway.identity.get` retorna a identidade de dispositivo do gateway usada por fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot atual de presença para dispositivos operator/node conectados.
    - `system-event` anexa um evento de sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeats no gateway.
  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitidos em runtime.
    - `usage.status` retorna janelas de uso de provedor/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão de memória vetorial / embedding para o workspace do agente padrão ativo.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna série temporal de uso para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.
  </Accordion>

  <Accordion title="Canais e helpers de login">
    - `channels.status` retorna resumos de status de canal/plugin integrados + empacotados.
    - `channels.logout` faz logout de um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login QR/web para o provedor atual de canal web com suporte a QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um node iOS registrado.
    - `voicewake.get` retorna os gatilhos de wake-word armazenados.
    - `voicewake.set` atualiza gatilhos de wake-word e transmite a mudança.
  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC de entrega direta de saída para envios direcionados por canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o tail configurado do log de arquivo do gateway com controles de cursor/limite e bytes máximos.
  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza fala pelo provedor ativo de fala do Talk.
    - `tts.status` retorna estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
    - `tts.setProvider` atualiza o provedor TTS preferido.
    - `tts.convert` executa conversão pontual de texto para fala.
  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado secreto de runtime apenas em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredo direcionadas por comando para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e o hash atuais da configuração.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload do schema de configuração ativo usado pela Control UI e pelas ferramentas da CLI: schema, `uiHints`, versão e metadados de geração, incluindo metadados de schema de plugin + canal quando o runtime consegue carregá-los. O schema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e textos de ajuda usados pela UI, incluindo ramificações de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de busca com escopo de caminho para um caminho de configuração: caminho normalizado, nó superficial de schema, dica correspondente + `hintPath` e resumos imediatos de filhos para drill-down de UI/CLI. Nós de schema de lookup mantêm a documentação voltada para o usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do gateway e agenda um reinício apenas quando a própria atualização foi bem-sucedida.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por RPC WS.
  </Accordion>

  <Accordion title="Helpers de agente e workspace">
    - `agents.list` retorna entradas de agentes configurados.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agente e ligação de workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de bootstrap de workspace expostos para um agente.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.
  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice atual de sessões.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de mudança de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão específicas.
    - `sessions.resolve` resolve ou canoniza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interrupção e direcionamento para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo de uma sessão.
    - `sessions.patch` atualiza metadados/sobrescritas de sessão.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa armazenada da sessão.
    - A execução de chat continua usando `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição em clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e tokens de controle do modelo em ASCII/largura total vazados são removidos, linhas puras do assistente com token silencioso, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.
  </Accordion>

  <Accordion title="Pareamento de dispositivo e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivo.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites aprovados de papel e escopo.
    - `device.token.revoke` revoga um token de dispositivo pareado.
  </Accordion>

  <Accordion title="Pareamento de node, invoke e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` cobrem pareamento de node e verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de nodes conhecidos/conectados.
    - `node.rename` atualiza um rótulo de node pareado.
    - `node.invoke` encaminha um comando para um node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invoke.
    - `node.event` transporta eventos originados do node de volta para o gateway.
    - `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para nodes offline/desconectados.
  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações pontuais de aprovação de execução, além de busca/replay de aprovação pendente.
    - `exec.approval.waitDecision` espera por uma aprovação de execução pendente e retorna a decisão final (ou `null` em caso de timeout).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de execução do gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local de aprovação de execução do node por comandos de relay do node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por Plugin.
  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de ativação; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros
  eventos de chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: índice ou metadados de sessão alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / liveness.
- `health`: atualização de snapshot de saúde do gateway.
- `heartbeat`: atualização de fluxo de eventos de Heartbeat.
- `cron`: evento de mudança de execução/tarefa de Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento de node.
- `node.invoke.request`: broadcast de solicitação de invoke de node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de gatilho de wake-word alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida
  da aprovação de execução.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida
  da aprovação de Plugin.

### Métodos helper de node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skill
  para verificações de permissão automática.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário
  de comandos em runtime de um agente.
  - `agentId` é opcional; omita para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` primário tem como alvo:
    - `text` retorna o token primário de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor
      quando disponíveis
  - `textAliases` carrega aliases slash exatos como `/model` e `/m`.
  - `nativeName` carrega o nome nativo consciente do provedor quando ele existe.
  - `provider` é opcional e afeta apenas nomenclatura nativa mais disponibilidade de
    comandos nativos de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário
  efetivo em runtime de ferramentas para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime da sessão no lado do servidor em vez de aceitar
    contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar neste momento,
    incluindo ferramentas de core, plugin e canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills de um agente.
  - `agentId` é opcional; omita para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções sanitizadas de instalação sem expor valores secretos brutos.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada de `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo Config aplica patch em valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de execução

- Quando uma solicitação de execução precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (requer escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (metadados canônicos de `argv`/`cwd`/`rawCommand`/sessão). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de command/cwd/session.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o
  gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Requests `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução apenas na sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo sessões internas/webchat ou configurações ambíguas com vários canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis em todo o protocolo v3 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                               | Fonte                                                      |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout de request (por RPC)              | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout de preauth / connect-challenge    | `10_000` ms                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão              | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexão               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nova tentativa rápida após fechamento por device-token | `250` ms                               | `src/gateway/client.ts`                                    |
| Grace de force-stop antes de `terminate()` | `250` ms                                            | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout padrão de `stopAndWait()`         | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                    |
| Fechamento por timeout de tick            | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

O servidor anuncia `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` efetivos em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões anteriores ao handshake.

## Autenticação

- A autenticação compartilhada por segredo do gateway usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` sem loopback, satisfazem a verificação de autenticação do connect a partir de
  headers do request em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` em ingressos privados pula completamente a autenticação compartilhada por segredo do connect; não exponha esse modo em ingressos públicos/não confiáveis.
- Após o pareamento, o Gateway emite um **device token** com escopo para o
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  connect bem-sucedido.
- Reconectar com esse **device token armazenado** também deve reutilizar o conjunto armazenado
  de escopos aprovados para esse token. Isso preserva acesso de leitura/sondagem/status
  já concedido e evita colapsar silenciosamente reconexões para um
  escopo implícito mais estreito apenas de admin.
- Montagem de autenticação de connect no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro token compartilhado explícito,
    depois `deviceToken` explícito, depois um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhum dos itens acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer device token resolvido o suprime.
  - A autopromoção de um device token armazenado na nova tentativa pontual
    `AUTH_TOKEN_MISMATCH` é limitada apenas a **endpoints confiáveis** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- Entradas adicionais de `hello-ok.auth.deviceTokens` são tokens de handoff de bootstrap.
  Persista-os apenas quando o connect usar autenticação de bootstrap em um transporte confiável
  como `wss://` ou loopback/pareamento local.
- Se um cliente fornecer `deviceToken` ou `scopes` **explícitos**, esse conjunto de escopos solicitado pelo chamador
  permanece autoritativo; escopos em cache só são reutilizados quando o cliente está reutilizando o device token armazenado por dispositivo.
- Device tokens podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer escopo `operator.pairing`).
- Emissão/rotação de token permanece limitada ao conjunto aprovado de papéis registrado
  na entrada de pareamento desse dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de pareamento nunca concedeu.
- Para sessões com token de dispositivo pareado, o gerenciamento de dispositivo tem escopo próprio, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin só podem remover/revogar/rotacionar
  sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto solicitado de escopos de operator em relação aos
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para
  um conjunto mais amplo de escopos de operator do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token em cache por dispositivo.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientação de ação para o operador.

## Identidade do dispositivo + pareamento

- Nodes devem incluir uma identidade estável de dispositivo (`device.id`) derivada da fingerprint
  de um par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são obrigatórias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas locais por loopback.
- O OpenClaw também tem um caminho estreito de self-connect local de backend/contêiner para fluxos helper
  confiáveis com segredo compartilhado.
- Conexões na mesma tailnet ou LAN no mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante o `connect` (operator + node).
  A Control UI pode omiti-la apenas nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro apenas em localhost.
  - autenticação bem-sucedida de operator Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergência, downgrade severo de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam comportamento de assinatura anterior ao challenge, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code`, com `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                         |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou vazio).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da tolerância permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à fingerprint da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonização da chave pública falhou.      |

Alvo da migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além de campos de device/client/role/scopes/token/nonce.
- Assinaturas legadas `v2` continuam sendo aceitas por compatibilidade, mas a fixação de metadados
  do dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Clientes podem opcionalmente fixar a fingerprint do certificado do gateway (consulte a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionados

- [Bridge protocol](/pt-BR/gateway/bridge-protocol)
- [Gateway runbook](/pt-BR/gateway)

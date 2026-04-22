---
read_when:
    - Implementando ou atualizando clientes WS do gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos de protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do Gateway (WebSocket)

O protocolo WS do Gateway é o **plano de controle único + transporte de Node** do
OpenClaw. Todos os clientes (CLI, UI web, app macOS, Nodes iOS/Android, Nodes
headless) se conectam via WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com cargas JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.

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
informa o papel/escopos negociados quando disponíveis e inclui `deviceToken`
quando o gateway emite um.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` ainda pode informar
as permissões negociadas:

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

Durante o handoff confiável de bootstrap, `hello-ok.auth` também pode incluir
entradas adicionais de papel limitado em `deviceTokens`:

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

Para o fluxo integrado de bootstrap de Node/operator, o token principal do Node permanece com
`scopes: []` e qualquer token de operator transferido permanece limitado à allowlist do operator de bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap permanecem
prefixadas por papel: entradas de operator satisfazem apenas solicitações de operator, e papéis que não são operator
ainda precisam de escopos sob seu próprio prefixo de papel.

### Exemplo de Node

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

- **Solicitação**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (consulte o schema).

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

Métodos RPC de gateway registrados por Plugin podem solicitar seu próprio escopo de operator, mas
prefixos reservados de administração do core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos para `operator.admin`.

O escopo do método é apenas o primeiro controle. Alguns comandos de barra acessados por
`chat.send` aplicam verificações mais rígidas no nível do comando por cima disso. Por exemplo, escritas persistentes de
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de Node que não sejam de exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- As entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node**.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor usam controle por escopo, para que sessões com escopo de pairing ou somente Node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` em streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram completamente esses frames.
- **Broadcasts `plugin.*` definidos por Plugin** usam controle `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de connect/disconnect etc.) permanecem irrestritos, para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** usam controle por escopo por padrão (fail-closed), a menos que um handler registrado relaxe isso explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente, para que broadcasts preservem a ordenação monotônica naquele socket, mesmo quando clientes diferentes veem subconjuntos diferentes do fluxo de eventos filtrados por escopo.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície pública de WS é mais ampla
do que os exemplos de handshake/auth acima. Estas são as principais famílias de métodos que o
Gateway expõe hoje.

`hello-ok.features.methods` é uma lista conservadora de descoberta, construída a partir de
`src/gateway/server-methods-list.ts` mais exportações carregadas de métodos de plugin/channel.
Trate isso como descoberta de recursos, não como um dump gerado de todos os helpers chamáveis
implementados em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o instantâneo de integridade do gateway em cache ou recém-sondado.
- `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são
  incluídos apenas para clientes operator com escopo admin.
- `gateway.identity.get` retorna a identidade do dispositivo do gateway usada por relay e
  fluxos de pairing.
- `system-presence` retorna o instantâneo atual de presença de dispositivos
  operator/node conectados.
- `system-event` acrescenta um evento do sistema e pode atualizar/transmitir
  contexto de presença.
- `last-heartbeat` retorna o evento Heartbeat persistido mais recente.
- `set-heartbeats` alterna o processamento de Heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em runtime.
- `usage.status` retorna janelas de uso do provedor/resumos de cota restante.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna a prontidão de memória vetorial / embedding para o
  workspace ativo do agente padrão.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canais/plugins integrados + bundled.
- `channels.logout` faz logout de um canal/conta específico onde o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login QR/web para o provedor de canal web
  atual compatível com QR.
- `web.login.wait` aguarda a conclusão desse fluxo de login QR/web e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um Node iOS registrado.
- `voicewake.get` retorna os gatilhos de wake-word armazenados.
- `voicewake.set` atualiza os gatilhos de wake-word e transmite a alteração.

### Mensagens e logs

- `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread
  fora do executor de chat.
- `logs.tail` retorna o tail de log de arquivo configurado do gateway com cursor/limit e
  controles de bytes máximos.

### Talk e TTS

- `talk.config` retorna a carga efetiva de configuração do Talk; `includeSecrets`
  exige `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes da
  WebChat/Control UI.
- `talk.speak` sintetiza fala por meio do provedor de fala ativo do Talk.
- `tts.status` retorna o estado habilitado do TTS, provedor ativo, provedores de fallback
  e estado de configuração do provedor.
- `tts.providers` retorna o inventário visível de provedores de TTS.
- `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
- `tts.setProvider` atualiza o provedor preferido de TTS.
- `tts.convert` executa uma conversão pontual de texto para fala.

### Segredos, configuração, atualização e wizard

- `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredo em runtime
  apenas em caso de sucesso completo.
- `secrets.resolve` resolve atribuições de segredos de destino de comando para um conjunto específico
  de comando/destino.
- `config.get` retorna o instantâneo e hash da configuração atual.
- `config.set` grava uma carga de configuração validada.
- `config.patch` mescla uma atualização parcial de configuração.
- `config.apply` valida + substitui a carga completa de configuração.
- `config.schema` retorna a carga do schema ativo de configuração usada pela Control UI e
  pelas ferramentas de CLI: schema, `uiHints`, versão e metadados de geração, incluindo
  metadados de schema de plugin + channel quando o runtime consegue carregá-los. O schema
  inclui metadados de campo `title` / `description` derivados dos mesmos rótulos
  e texto de ajuda usados pela UI, incluindo ramificações aninhadas de objeto, curinga, item de array
  e composição `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
- `config.schema.lookup` retorna uma carga de lookup com escopo de caminho para um caminho de configuração:
  caminho normalizado, um nó superficial do schema, hint correspondente + `hintPath` e
  resumos imediatos dos filhos para drill-down de UI/CLI.
  - Nós de schema de lookup mantêm a documentação voltada ao usuário e campos comuns de validação:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além de `hint` / `hintPath` correspondentes.
- `update.run` executa o fluxo de atualização do gateway e agenda um reinício apenas quando
  a própria atualização foi bem-sucedida.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  wizard de onboarding por WS RPC.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agentes configuradas.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e
  a conexão de workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos de workspace de bootstrap expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda a conclusão de uma execução e retorna o instantâneo terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos
  de alteração de sessão para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  assinaturas de eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna visualizações de transcrição limitadas para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canonicaliza um destino de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
- `sessions.abort` aborta trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições da sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção
  de sessão.
- `sessions.get` retorna a linha completa armazenada da sessão.
- a execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, cargas XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle de modelo ASCII/largura total vazados
  são removidos, linhas de assistente compostas apenas por tokens silenciosos como `NO_REPLY` /
  `no_reply` exatos são omitidas, e linhas superdimensionadas podem ser substituídas por placeholders.

#### Pareamento de dispositivo e tokens de dispositivo

- `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de pareamento de dispositivo.
- `device.token.rotate` rotaciona um token de dispositivo pareado dentro de seus limites aprovados de papel
  e escopo.
- `device.token.revoke` revoga um token de dispositivo pareado.

#### Pareamento de Node, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem o pareamento de Node e a
  verificação de bootstrap.
- `node.list` e `node.describe` retornam o estado conhecido/conectado do Node.
- `node.rename` atualiza um rótulo de Node pareado.
- `node.invoke` encaminha um comando para um Node conectado.
- `node.invoke.result` retorna o resultado de uma solicitação de invoke.
- `node.event` leva eventos originados do Node de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para Nodes offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` cobrem solicitações pontuais de aprovação de exec mais
  lookup/replay de aprovação pendente.
- `exec.approval.waitDecision` aguarda uma aprovação pendente de exec e retorna
  a decisão final (ou `null` em timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam instantâneos de política
  de aprovação de exec do gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam política local de aprovação de exec
  do Node por meio de comandos de relay de Node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem
  fluxos de aprovação definidos por Plugin.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção de texto wake imediata ou no próximo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  somente de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: o índice ou os metadados da sessão mudaram.
- `presence`: atualizações do instantâneo de presença do sistema.
- `tick`: evento periódico de keepalive / verificação de atividade.
- `health`: atualização do instantâneo de integridade do gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/job de Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de Node.
- `node.invoke.request`: broadcast de solicitação de invoke de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: a configuração de gatilho de wake-word mudou.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da
  aprovação de Plugin.

### Métodos helper de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de skill
  para verificações de auto-allow.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em runtime de um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` principal segmenta:
    - `text` retorna o token principal de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos com reconhecimento de provedor
      quando disponíveis
  - `textAliases` carrega aliases exatos com barra, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo com reconhecimento de provedor quando ele existe.
  - `provider` é opcional e afeta apenas a nomenclatura nativa mais a disponibilidade de comandos nativos de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do Plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de Plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  de uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto confiável de runtime da sessão no lado do servidor em vez de aceitar
    contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas de core, Plugin e canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores brutos de segredo.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo Config aplica patch em valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/cwd/sessão.
- Se um chamador modificar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o prepare e o encaminhamento final aprovado de `system.run`, o
  gateway rejeitará a execução em vez de confiar na carga modificada.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente de sessão quando nenhuma rota externa entregável pode ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas com vários canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis no protocolo v3 e são a linha de base esperada para clientes de terceiros.

| Constante                                  | Padrão                                               | Origem                                                     |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout de solicitação (por RPC)           | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout de pré-autenticação / desafio connect | `10_000` ms                                       | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão               | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexão                | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de tentativa rápida após fechamento por device-token | `250` ms                          | `src/gateway/client.ts`                                    |
| Período de tolerância de parada forçada antes de `terminate()` | `250` ms                     | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout padrão de `stopAndWait()`          | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo padrão de tick (pré `hello-ok`)  | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Fechamento por timeout de tick             | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões pré-handshake.

## Autenticação

- A autenticação do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  fora de loopback, satisfazem a verificação de autenticação de connect a partir dos
  headers da solicitação em vez de `connect.params.auth.*`.
- O ingresso privado `gateway.auth.mode: "none"` ignora completamente a autenticação de connect por segredo compartilhado; não exponha esse modo em ingresso público/não confiável.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo para o
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  connect bem-sucedido.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto de escopos aprovados armazenado para esse token. Isso preserva o acesso de leitura/sondagem/status
  que já foi concedido e evita reduzir silenciosamente reconexões para um
  escopo implícito mais restrito somente de admin.
- Montagem da autenticação de connect no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e é sempre encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro token compartilhado explícito,
    depois um `deviceToken` explícito e, em seguida, um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhuma das opções acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A autopromoção de um token de dispositivo armazenado na tentativa única de retry de
    `AUTH_TOKEN_MISMATCH` é limitada a **endpoints confiáveis apenas** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público
    sem pinning não se qualifica.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de handoff de bootstrap.
  Persista-as apenas quando o connect tiver usado autenticação de bootstrap em um transporte confiável,
  como `wss://` ou loopback/pareamento local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige escopo `operator.pairing`).
- A emissão/rotação de token permanece limitada ao conjunto aprovado de papéis registrado na
  entrada de pareamento daquele dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivo tem escopo próprio, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin podem remover/revogar/rotacionar
  apenas sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operator solicitado em relação aos
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para
  um conjunto mais amplo de escopos de operator do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar um retry limitado com um token armazenado por dispositivo em cache.
  - Se esse retry falhar, os clientes devem interromper loops automáticos de reconexão e apresentar orientação de ação ao operator.

## Identidade do dispositivo + pareamento

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de keypair.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são obrigatórias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões locais diretas por loopback.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/container para fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões na mesma tailnet ou LAN do mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A Control UI só pode omiti-la nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade insegura de HTTP somente localhost.
  - autenticação bem-sucedida de operator da Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, forte redução de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam comportamento de assinatura pré-desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                     | details.code                     | details.reason           | Significado                                          |
| ---------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou vazio).   |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com nonce desatualizado/incorreto. |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | A carga da assinatura não corresponde à carga v2.    |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora do skew permitido.    |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão da chave pública. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou.   |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine a carga v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- A carga de assinatura preferida é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas para compatibilidade, mas o pinning de metadados
  de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Clientes podem opcionalmente fixar a impressão digital do certificado do gateway (consulte a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

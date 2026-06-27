---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket do Gateway: negociação, quadros, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de Node** para
OpenClaw. Todos os clientes (CLI, interface web, app para macOS, nodes iOS/Android, nodes
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.
- Frames pré-conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos habilitados,
  frames de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o gateway feche ou descarte o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  conteúdos de anexos, corpo bruto do frame, tokens, cookies ou valores secretos.

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
    "maxProtocol": 4,
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
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Enquanto o Gateway ainda está finalizando os sidecars de inicialização, a solicitação `connect` pode
retornar um erro `UNAVAILABLE` passível de nova tentativa, com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem tentar novamente essa resposta
dentro do orçamento geral de conexão em vez de apresentá-la como uma falha
terminal de handshake.

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` também é obrigatório e informa
o papel/escopos negociados. `pluginSurfaceUrls` é opcional e mapeia nomes de
superfícies de Plugin, como `canvas`, para URLs hospedadas com escopo.

URLs de superfície de Plugin com escopo podem expirar. Nodes podem chamar
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para receber uma nova
entrada em `pluginSurfaceUrls`. A refatoração experimental do Plugin Canvas não
oferece suporte ao caminho de compatibilidade obsoleto `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh`; clientes nativos e gateways atuais devem usar superfícies de Plugin.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` informa as permissões
negociadas sem campos de token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Clientes backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas de loopback quando
se autenticam com o token/senha compartilhado do gateway. Esse caminho é reservado
para RPCs internas do plano de controle e impede que baselines antigas de pareamento CLI/dispositivo
bloqueiem trabalho local de backend, como atualizações de sessão de subagente. Clientes remotos,
clientes de origem de navegador, clientes Node e clientes explícitos de token de dispositivo/identidade
de dispositivo ainda usam as verificações normais de pareamento e upgrade de escopo.

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

O bootstrap integrado por QR/código de configuração é um novo caminho de transferência móvel. Uma conexão
bem-sucedida com código de configuração baseline retorna um token de Node primário mais um token de
operador limitado:

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

A transferência de operador é intencionalmente limitada para que o onboarding por QR possa iniciar o
loop de operador móvel sem conceder `operator.admin` ou `operator.pairing`.
Ela inclui `operator.talk.secrets` para que o cliente nativo possa ler a configuração do Talk
necessária após o bootstrap. Escopos mais amplos de administrador e pareamento exigem
um pareamento de operador aprovado separadamente ou um fluxo de token. Os clientes devem persistir
`hello-ok.auth.deviceTokens` somente
quando a conexão usou autenticação de bootstrap em transporte confiável, como `wss://` ou
loopback/pareamento local.

### Exemplo de Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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

Para o modelo completo de escopo de operador, verificações no momento da aprovação
e semântica de segredo compartilhado, consulte [Escopos de operador](/pt-BR/gateway/operator-scopes).

### Papéis

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidade (camera/screen/canvas/system.run).

### Escopos (operador)

Escopos comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC de gateway registrados por Plugin podem solicitar seu próprio escopo de operador, mas
prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas o primeiro gate. Alguns comandos de barra acessados por meio de
`chat.send` aplicam verificações mais rigorosas no nível do comando por cima. Por exemplo, gravações persistentes de
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação por cima do
escopo base do método:

- solicitações sem comandos: `operator.pairing`
- solicitações com comandos de Node não exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permissões (Node)

Nodes declaram declarações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: lista de permissão de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **declarações** e aplica listas de permissão no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.
- `node.list` inclui campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nodes conectados informam
  seu horário de conexão atual como `lastSeenAtMs` com motivo `connect`; nodes pareados também podem informar
  presença durável em segundo plano quando um evento confiável de Node atualiza seus metadados de pareamento.

### Evento de Node ativo em segundo plano

Nodes podem chamar `node.event` com `event: "node.presence.alive"` para registrar que um Node pareado estava
ativo durante uma ativação em segundo plano sem marcá-lo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é um enum fechado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Strings de trigger desconhecidas são normalizadas para
`background` pelo gateway antes da persistência. O evento é durável somente para sessões autenticadas de dispositivo
Node; sessões sem dispositivo ou não pareadas retornam `handled: false`.

Gateways bem-sucedidos retornam um resultado estruturado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; os clientes devem tratar isso como uma
RPC confirmada, não como persistência durável de presença.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são controlados por escopo para que sessões com escopo de pareamento ou somente Node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` em streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses frames por completo.
- **Broadcasts `plugin.*` definidos por Plugin** são restritos a `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem sem restrição para que a integridade do transporte continue observável a toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por escopo por padrão (fail-closed), a menos que um handler registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem ordenação monotônica nesse socket, mesmo quando clientes diferentes veem subconjuntos diferentes do fluxo de eventos filtrados por escopo.

## Famílias comuns de métodos RPC

A superfície WS pública é mais ampla do que os exemplos de handshake/autenticação acima. Esta
não é uma listagem gerada — `hello-ok.features.methods` é uma lista conservadora de
descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exports de métodos de Plugin/canal
carregados. Trate-a como descoberta de recursos, não como uma enumeração completa de
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de saúde do gateway em cache ou recém-verificado.
    - `diagnostics.stability` retorna o registrador recente e limitado de estabilidade diagnóstica. Ele mantém metadados operacionais, como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e IDs de sessão. Ele não mantém texto de chat, corpos de webhooks, saídas de ferramentas, corpos brutos de solicitações ou respostas, tokens, cookies ou valores secretos. Escopo de leitura de operador é obrigatório.
    - `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são incluídos somente para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade do dispositivo gateway usada por fluxos de retransmissão e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operadores/nós conectados.
    - `system-event` acrescenta um evento de sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido pelo runtime. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso dos provedores/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
      Passe `agentId` para um agente, ou `agentScope: "all"` para agregar agentes configurados.
    - `doctor.memory.status` retorna a prontidão da memória vetorial / embedding em cache para o workspace do agente padrão ativo. Passe `{ "probe": true }` ou `{ "deep": true }` somente quando o chamador quiser explicitamente um ping ao vivo do provedor de embedding. Clientes cientes de Dreaming também podem passar `{ "agentId": "agent-id" }` para restringir as estatísticas do armazenamento do Dreaming a um workspace de agente selecionado; omitir `agentId` mantém o fallback do agente padrão e agrega workspaces de Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` aceitam parâmetros opcionais `{ "agentId": "agent-id" }` para visualizações/ações de Dreaming do agente selecionado. Quando `agentId` é omitido, operam no workspace do agente padrão configurado.
    - `doctor.memory.remHarness` retorna uma prévia limitada, somente leitura, do harness REM para clientes remotos do plano de controle. Ela pode incluir caminhos de workspace, trechos de memória, markdown fundamentado renderizado e candidatos a promoção profunda, então os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão. Passe `agentId` para um
      agente, ou `agentScope: "all"` para listar agentes configurados juntos.
    - `sessions.usage.timeseries` retorna o uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
    - `channels.logout` desconecta um canal/conta específico quando o canal tem suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um nó iOS registrado.
    - `voicewake.get` retorna os acionadores de palavra de ativação armazenados.
    - `voicewake.set` atualiza os acionadores de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é a RPC direta de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o trecho final configurado do log em arquivo do Gateway com cursor/limite e controles de bytes máximos.

  </Accordion>

  <Accordion title="Fala e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores de Talk para fala, transcrição por streaming e voz em tempo real. Ele inclui ids de provedores, rótulos, estado configurado, ids de modelos/vozes expostos, modos canônicos, transportes, estratégias de cérebro e flags de áudio/capacidade em tempo real sem retornar segredos de provedores nem modificar a configuração global.
    - `talk.config` retorna o payload efetivo de configuração de Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão de Talk pertencente ao Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Para `stt-tts/managed-room`, chamadores com `operator.write` que passam `sessionKey` também devem passar `spawnedBy` para visibilidade de chave de sessão com escopo; a criação de `sessionKey` sem escopo e `brain: "direct-tools"` exigem `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite eventos `session.ready` ou `session.replaced` conforme necessário e retorna metadados de sala/sessão, além de eventos recentes de Talk, sem o token em texto claro nem o hash do token armazenado.
    - `talk.session.appendAudio` anexa áudio de entrada PCM em base64 a sessões de relay em tempo real e de transcrição pertencentes ao Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` conduzem o ciclo de vida de turno de sala gerenciada com rejeição de turno obsoleto antes que o estado seja limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção controlada por VAD em sessões de relay do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta do provedor emitida por uma sessão de relay em tempo real pertencente ao Gateway. Passe `options: { willContinue: true }` para saída intermediária da ferramenta quando um resultado final ainda será enviado, ou `options: { suppressResponse: true }` quando o resultado da ferramenta deve satisfazer a chamada do provedor sem iniciar outra resposta de assistente em tempo real.
    - `talk.session.steer` envia controle de voz de execução ativa para uma sessão de Talk com agente integrado pertencente ao Gateway. Ele aceita `{ sessionId, text, mode? }`, em que `mode` é `status`, `steer`, `cancel` ou `followup`; o modo omitido é classificado a partir do texto falado.
    - `talk.session.close` fecha uma sessão de relay, transcrição ou sala gerenciada pertencente ao Gateway e emite eventos terminais de Talk.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real pertencente ao cliente usando `webrtc` ou `provider-websocket`, enquanto o Gateway é dono da configuração, credenciais, instruções e política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real pertencentes ao cliente encaminhem chamadas de ferramenta do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; clientes recebem um id de execução e aguardam eventos normais do ciclo de vida do chat antes de enviar o resultado da ferramenta específico do provedor.
    - `talk.client.steer` envia controle de voz de execução ativa para transportes em tempo real pertencentes ao cliente. O Gateway resolve a execução incorporada ativa a partir de `sessionKey` e retorna um resultado estruturado de aceito/rejeitado em vez de descartar silenciosamente o direcionamento.
    - `talk.event` é o único canal de eventos de Talk para adaptadores em tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reunião.
    - `talk.speak` sintetiza fala por meio do provedor ativo de fala de Talk.
    - `tts.status` retorna o estado ativado de TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores de TTS.
    - `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
    - `tts.setProvider` atualiza o provedor preferencial de TTS.
    - `tts.convert` executa uma conversão pontual de texto para fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente as SecretRefs ativas e troca o estado de segredos em tempo de execução somente em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos direcionadas a comandos para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e o hash da configuração atual.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial da configuração. A substituição destrutiva de arrays
      exige o caminho afetado em `replacePaths`; arrays aninhados
      sob entradas de array usam caminhos `[]`, como `agents.list[].skills`.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload de esquema de configuração ativo usado pela Control UI e por ferramentas de CLI: esquema, `uiHints`, versão e metadados de geração, incluindo metadados de esquema de Plugin + canal quando o runtime consegue carregá-los. O esquema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e textos de ajuda usados pela UI, incluindo objetos aninhados, wildcard, item de array e ramificações de composição `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de esquema raso, dica correspondente + `hintPath`, `reloadKind` opcional e resumos de filhos imediatos para detalhamento na UI/CLI. `reloadKind` é um de `restart`, `hot` ou `none` e espelha o planejador de recarga de configuração do Gateway para o caminho solicitado. Nós de esquema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, `reloadKind` opcional, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização somente quando a própria atualização foi bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno de agente de acompanhamento por meio da fila de continuação de reinicialização. Atualizações do gerenciador de pacotes e atualizações supervisionadas de checkout git vindas do plano de controle usam uma transferência desacoplada para serviço gerenciado em vez de substituir a árvore de pacotes ou modificar a saída de checkout/build dentro do Gateway ativo. Uma transferência iniciada retorna `ok: true` com `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; transferências indisponíveis ou com falha retornam `ok: false` com `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, além de `handoff.command` quando uma atualização manual por shell é necessária. Uma transferência indisponível significa que o OpenClaw não tem um limite seguro de supervisor ou uma identidade de serviço durável, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante uma transferência iniciada, o sentinela de reinicialização pode informar brevemente `stats.reason: "restart-health-pending"`; a continuação é adiada até que a CLI verifique o Gateway reiniciado e grave o sentinela final `ok`.
    - `update.status` atualiza e retorna o sentinela de reinicialização de atualização mais recente, incluindo a versão em execução pós-reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de integração inicial via RPC de WS.

  </Accordion>

  <Accordion title="Auxiliares de agente e workspace">
    - `agents.list` retorna entradas de agentes configuradas, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a conexão com o workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de bootstrap do workspace expostos para um agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o ledger de tarefas do Gateway para clientes SDK e operadores.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos de artefatos derivados de transcrições e downloads para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no servidor e retornam apenas mídia de transcrição com proveniência correspondente; fontes de URL inseguras ou locais retornam downloads não compatíveis em vez de buscar no servidor.
    - `environments.list` e `environments.status` expõem a descoberta somente leitura de ambientes locais do Gateway e de Node para clientes SDK.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessão atual, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam as assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam as assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrições para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e direcionar para uma sessão ativa.
    - `sessions.abort` aborta o trabalho ativo de uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway possa resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições de sessão e relata o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa de sessão armazenada.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e tokens de controle de modelo ASCII/largura completa vazados são removidos, linhas de assistente com tokens silenciosos puros, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.
    - `chat.message.get` é o leitor aditivo, limitado e de mensagem completa para uma única entrada visível de transcrição. Os clientes passam `sessionKey`, `agentId` opcional quando a seleção de sessão tem escopo de agente, além de um `messageId` de transcrição previamente exposto por `chat.history`, e o Gateway retorna a mesma projeção normalizada para exibição sem o limite leve de truncamento do histórico quando a entrada armazenada ainda está disponível e não é grande demais.
    - `chat.send` aceita `fastMode: "auto"` de um turno para usar o modo rápido em chamadas de modelo iniciadas antes do corte automático, e então iniciar chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação sem modo rápido. O corte padrão é de 60 segundos e pode ser configurado por modelo com `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Um chamador de `chat.send` pode passar `fastAutoOnSeconds` de um turno para substituir o corte dessa solicitação.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento de Node, invocação e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem pareamento de Node e verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de Nodes conhecidos/conectados.
    - `node.rename` atualiza o rótulo de um Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `node.event` carrega eventos originados no Node de volta para o gateway.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações de aprovação de exec de uso único, além de consulta/replay de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna a decisão final (ou `null` em caso de timeout).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de exec do gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de exec local do Node via comandos de retransmissão de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por Plugin.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção de texto de despertar imediata ou no próximo Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - `cron.run` continua sendo um RPC no estilo enfileiramento para execuções manuais. Clientes que precisam de semântica de conclusão devem ler o `runId` retornado e consultar `cron.runs`.
    - `cron.runs` aceita um filtro `runId` opcional e não vazio para que clientes possam acompanhar uma execução manual enfileirada sem disputar com outras entradas de histórico para o mesmo job.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias de eventos comuns

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  apenas de transcrição. No protocolo v4, payloads de delta carregam `deltaText`; `message` continua sendo
  o snapshot cumulativo do assistente. Substituições que não são prefixo definem `replace=true`
  e usam `deltaText` como texto de substituição.
- `session.message`, `session.operation` e `session.tool`: atualizações de transcrição,
  operação de sessão em andamento e fluxo de eventos para uma sessão
  assinada.
- `sessions.changed`: índice de sessão ou metadados alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / atividade.
- `health`: atualização de snapshot de integridade do gateway.
- `heartbeat`: atualização de fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/job de Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento de Node.
- `node.invoke.request`: broadcast de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de gatilho de palavra de despertar alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação
  de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação
  de Plugin.

### Métodos auxiliares de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de permissão automática.

### RPCs do ledger de tarefas

Clientes operadores podem inspecionar e cancelar registros de tarefas em segundo plano do Gateway por meio
dos RPCs do ledger de tarefas. Esses métodos retornam resumos saneados de tarefas, não o estado
bruto de runtime.

- `tasks.list` exige `operator.read`.
  - Parâmetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou um array desses status,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` e string `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` exige `operator.read`.
  - Parâmetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - IDs de tarefa ausentes retornam o formato de erro de não encontrado do Gateway.
- `tasks.cancel` exige `operator.write`.
  - Parâmetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o ledger tinha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais como `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progresso,
resumo terminal e texto de erro saneado. `agentId` identifica o agente
que executa a tarefa; `sessionKey` e `ownerKey` preservam o contexto do solicitante
e de controle.

### Métodos auxiliares do operador

- Operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em tempo de execução de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário tem como alvo:
    - `text` retorna o token de comando de texto primário sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor quando disponíveis
  - `textAliases` carrega aliases de barra exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo ciente do provedor quando houver um.
  - `provider` é opcional e afeta apenas a nomenclatura nativa e a disponibilidade de comandos nativos de plugins.
  - `includeArgs=false` omite da resposta os metadados serializados de argumentos.
- Operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em tempo de execução de um agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas efetivo em tempo de execução de uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime da sessão no lado do servidor em vez de aceitar contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta é uma projeção derivada pelo servidor e escopada à sessão do inventário ativo, incluindo ferramentas de core, plugin, canal e servidores MCP já descobertos.
  - `tools.effective` é somente leitura para MCP: ele pode projetar um catálogo MCP de sessão aquecida por meio da política final de ferramentas, mas não cria runtimes MCP, não conecta transportes nem emite `tools/list`. Se nenhum catálogo aquecido correspondente existir, a resposta pode incluir um aviso como `mcp-not-yet-connected`, `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Entradas de ferramenta efetivas usam `source="core"`, `source="plugin"`, `source="channel"` ou `source="mcp"`.
- Operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível pelo mesmo caminho de política do gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente da sessão resolvida deve corresponder a `agentId`.
  - Wrappers de core restritos ao proprietário, como `cron`, `gateway` e `nodes`, exigem identidade de proprietário/admin (`operator.admin`), embora o próprio método `tools.invoke` seja `operator.write`.
  - A resposta é um envelope voltado para o SDK com `ok`, `toolName`, `output` opcional e campos `error` tipados. Recusas de aprovação ou política retornam `ok:false` no payload em vez de contornar o pipeline de política de ferramentas do gateway.
- Operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível de skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e opções de instalação sanitizadas sem expor valores brutos de segredos.
- Operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para metadados de descoberta do ClawHub.
- Operadores podem chamar `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit` (`operator.admin`) para preparar um arquivo privado de skill antes de instalá-lo. Este é um caminho separado de upload admin para clientes confiáveis, não o fluxo normal de instalação de skills do ClawHub, e fica desativado por padrão a menos que `skills.install.allowUploadedArchives` esteja habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` cria um upload vinculado a esse slug e valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` acrescenta bytes no deslocamento decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e o SHA-256. O commit apenas finaliza o upload; ele não instala a skill.
  - Arquivos de skill enviados são arquivos zip contendo uma raiz `SKILL.md`. O nome do diretório interno do arquivo nunca seleciona o destino de instalação.
- Operadores podem chamar `skills.install` (`operator.admin`) em três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma pasta de skill no diretório `skills/` do workspace padrão do agente.
  - Modo de upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` instala um upload confirmado no diretório `skills/<slug>` do workspace padrão do agente. O slug e o valor de force devem corresponder à solicitação original de `skills.upload.begin`. Este modo é rejeitado a menos que `skills.install.allowUploadedArchives` esteja habilitado. A configuração não afeta instalações do ClawHub.
  - Modo instalador do Gateway: `{ name, installId, timeoutMs? }` executa uma ação `metadata.openclaw.install` declarada no host do gateway. Clientes mais antigos ainda podem enviar `dangerouslyForceUnsafeInstall`; esse campo está obsoleto, é aceito apenas para compatibilidade de protocolo e é ignorado. Use `security.installPolicy` para decisões de instalação pertencentes ao operador.
- Operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no workspace padrão do agente.
  - O modo de configuração corrige valores de `skills.entries.<skillKey>`, como `enabled`, `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro `view` opcional:

- Omitido ou `"default"`: comportamento atual de runtime. Se `agents.defaults.models` estiver configurado, a resposta será o catálogo permitido, incluindo modelos descobertos dinamicamente para entradas `provider/*`. Caso contrário, a resposta será o catálogo completo do Gateway.
- `"configured"`: comportamento dimensionado para seletores. Se `agents.defaults.models` estiver configurado, ele ainda prevalece, incluindo descoberta escopada ao provedor para entradas `provider/*`. Sem uma allowlist, a resposta usa entradas explícitas de `models.providers.*.models`, recorrendo ao catálogo completo apenas quando não existem linhas de modelo configuradas.
- `"all"`: catálogo completo do Gateway, contornando `agents.defaults.models`. Use isto para diagnósticos e UIs de descoberta, não para seletores normais de modelo.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador modificar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o gateway rejeitará a execução em vez de confiar no payload modificado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente de sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas com vários canais).
- Resultados finais de `agent` podem incluir `result.deliveryStatus` quando a entrega foi solicitada, usando os mesmos status `sent`, `suppressed`, `partial_failed` e `failed` documentados para [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` fica em `packages/gateway-protocol/src/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita intervalos que não incluem seu protocolo atual. Clientes e servidores atuais exigem o protocolo v4.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são estáveis no protocolo v4 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                                | Fonte                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Tempo limite de solicitação (por RPC)     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tempo limite de pré-autenticação / desafio de conexão | `15_000` ms                                | `src/gateway/handshake-timeouts.ts` (config/env pode elevar o orçamento pareado de servidor/cliente) |
| Backoff inicial de reconexão              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexão               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nova tentativa rápida após fechamento por token do dispositivo | `250` ms                    | `src/gateway/client.ts`                                                                    |
| Período de carência de parada forçada antes de `terminate()` | `250` ms                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick padrão (pré `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Fechamento por tempo limite de tick       | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` em `hello-ok`; clientes devem respeitar esses valores em vez dos padrões pré-handshake.

## Auth

- A autenticação de Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` sem loopback,
  satisfazem a verificação de autenticação da conexão a partir dos cabeçalhos da
  solicitação em vez de `connect.params.auth.*`.
- O `gateway.auth.mode: "none"` de ingresso privado ignora totalmente a
  autenticação de conexão por segredo compartilhado; não exponha esse modo em
  ingressos públicos/não confiáveis.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo para a
  função + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o
  conjunto de escopos aprovados armazenado para esse token. Isso preserva o acesso
  de leitura/sondagem/status que já foi concedido e evita reduzir silenciosamente
  as reconexões para um escopo implícito mais restrito somente de administrador.
- Montagem da autenticação de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito e, por fim, um token por dispositivo armazenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na nova tentativa única
    `AUTH_TOKEN_MISMATCH` é limitada a **endpoints confiáveis apenas** —
    loopback, ou `wss://` com um `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- O bootstrap integrado por código de configuração retorna o
  `hello-ok.auth.deviceToken` do nó principal, além de um token de operador limitado em
  `hello-ok.auth.deviceTokens` para transferência móvel confiável. O token de operador
  inclui `operator.talk.secrets` para leituras de configuração nativa do Talk e
  exclui `operator.admin` e `operator.pairing`.
- Enquanto um bootstrap por código de configuração não baseline aguarda aprovação, os detalhes de `PAIRING_REQUIRED`
  incluem `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  e `pauseReconnect: false`. Os clientes devem continuar reconectando com o mesmo
  token de bootstrap até que a solicitação seja aprovada ou o token se torne inválido.
- Persista `hello-ok.auth.deviceTokens` somente quando a conexão usou autenticação de bootstrap
  em um transporte confiável, como `wss://` ou pareamento por loopback/local.
- Se um cliente fornece um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache são
  reutilizados somente quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer o escopo `operator.pairing`). Rotacionar ou
  revogar um nó ou outra função que não seja de operador também requer `operator.admin`.
- `device.token.rotate` retorna metadados de rotação. Ele ecoa o token portador de
  substituição somente para chamadas do mesmo dispositivo que já estão autenticadas com
  esse token de dispositivo, para que clientes que usam apenas token possam persistir a substituição antes de
  reconectar. Rotações compartilhadas/de administrador não ecoam o token portador.
- Emissão, rotação e revogação de tokens permanecem limitadas ao conjunto de funções aprovado
  registrado na entrada de pareamento desse dispositivo; mutações de token não podem expandir nem
  direcionar uma função de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos é autoescopado, a menos que o
  chamador também tenha `operator.admin`: chamadores que não são administradores podem gerenciar somente o
  token de operador para a entrada de dispositivo **própria**. O gerenciamento de tokens de nó e de outros
  tokens que não sejam de operador é somente para administradores, mesmo para o próprio dispositivo do chamador.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos do token de operador
  de destino contra os escopos da sessão atual do chamador. Chamadores que não são administradores
  não podem rotacionar ou revogar um token de operador mais amplo do que aquele que já possuem.
- Falhas de autenticação incluem `error.details.code`, além de dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientação de ação para o operador.
- `AUTH_SCOPE_MISMATCH` significa que o token de dispositivo foi reconhecido, mas não cobre
  a função/os escopos solicitados. Os clientes não devem apresentar isso como um token inválido;
  solicite que o operador faça o pareamento novamente ou aprove o contrato de escopo mais restrito/mais amplo.

## Identidade do dispositivo + pareamento

- Nós devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + função.
- Aprovações de pareamento são obrigatórias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas de local loopback.
- OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões na mesma tailnet do host ou em LAN ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem identidade `device` durante `connect` (operador +
  nó). As únicas exceções de operador sem dispositivo são caminhos de confiança explícitos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro somente em localhost.
  - autenticação bem-sucedida de operador da Control UI em `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (último recurso, rebaixamento severo de segurança).
  - RPCs de backend `gateway-client` por loopback direto no caminho auxiliar interno
    reservado.
- Omitir a identidade do dispositivo tem consequências de escopo. Quando uma conexão de operador
  sem dispositivo é permitida por um caminho de confiança explícito, o OpenClaw ainda limpa
  escopos autodeclarados para um conjunto vazio, a menos que esse caminho tenha uma exceção nomeada
  de preservação de escopo. Métodos protegidos por escopo então falham com
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` é um caminho de preservação de escopo
  de último recurso da Control UI. Ele não concede escopos a clientes WebSocket arbitrários
  de backend personalizado ou em formato de CLI.
- O caminho auxiliar reservado de backend `gateway-client` por loopback direto preserva
  escopos somente para RPCs internas locais do plano de controle; IDs de backend personalizados não
  recebem essa exceção.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | A carga útil da assinatura não corresponde à carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O carimbo de data/hora assinado está fora da tolerância permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou. |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine a carga útil v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- A carga útil de assinatura preferida é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/função/escopos/token/nonce.
- Assinaturas legadas `v2` continuam sendo aceitas para compatibilidade, mas a fixação de
  metadados de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Os clientes podem opcionalmente fixar a impressão digital do certificado do gateway (consulte a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `packages/gateway-protocol/src/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

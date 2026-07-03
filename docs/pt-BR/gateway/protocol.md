---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-07-03T09:28:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de nó** do
OpenClaw. Todos os clientes (CLI, interface web, app macOS, nodes iOS/Android,
nodes headless) conectam via WebSocket e declaram sua **função** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.
- Frames pré-conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos habilitados,
  frames de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o Gateway feche ou descarte o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  conteúdo de anexos, corpo bruto do frame, tokens, cookies ou valores secretos.

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

Enquanto o Gateway ainda está finalizando sidecars de inicialização, a solicitação `connect` pode
retornar um erro `UNAVAILABLE` que permite nova tentativa, com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem tentar novamente essa resposta
dentro do orçamento geral de conexão, em vez de exibi-la como uma falha terminal de
handshake.

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo esquema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` também é obrigatório e informa
a função/escopos negociados. `pluginSurfaceUrls` é opcional e mapeia nomes de superfícies de plugin,
como `canvas`, para URLs hospedadas com escopo.

URLs de superfície de plugin com escopo podem expirar. Nodes podem chamar
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para receber uma entrada nova
em `pluginSurfaceUrls`. A refatoração experimental do Plugin Canvas não dá suporte ao caminho de compatibilidade
obsoleto `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh`; clientes nativos e gateways atuais devem usar superfícies de plugin.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` informa as permissões negociadas
sem campos de token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Clientes de backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas de loopback quando
se autenticam com o token/senha compartilhado do Gateway. Esse caminho é reservado
para RPCs internos do plano de controle e impede que linhas de base antigas de pareamento CLI/dispositivo
bloqueiem trabalho de backend local, como atualizações de sessão de subagente. Clientes remotos,
clientes com origem em navegador, clientes de nó e clientes explícitos com token de dispositivo/identidade de dispositivo
ainda usam as verificações normais de pareamento e upgrade de escopo.

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
bem-sucedida por código de configuração de linha de base retorna um token de nó primário mais um token
de operador limitado:

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
necessária após o bootstrap. Escopos mais amplos de admin e pareamento exigem
um pareamento de operador aprovado separadamente ou um fluxo de token. Os clientes devem persistir
`hello-ok.auth.deviceTokens` somente
quando a conexão usou autenticação de bootstrap em transporte confiável, como `wss://` ou
pareamento local/loopback.

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

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja o esquema).

## Funções + escopos

Para o modelo completo de escopo de operador, verificações no momento da aprovação e
semântica de segredo compartilhado, veja [Escopos de operador](/pt-BR/gateway/operator-scopes).

### Funções

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
Quando segredos são incluídos, os clientes devem ler a credencial do provedor Talk ativo
em `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
permanece no formato da origem e pode ser um objeto SecretRef ou uma string redigida.

Métodos RPC do Gateway registrados por Plugin podem solicitar seu próprio escopo de operador, mas
prefixos reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos de barra acessados por meio de
`chat.send` aplicam verificações mais estritas em nível de comando por cima. Por exemplo, gravações persistentes
de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação por cima do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de nó não exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permissões (nó)

Nodes declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e impõe listas de permissões no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node**.
- `node.list` inclui campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nodes conectados informam
  seu horário de conexão atual como `lastSeenAtMs` com motivo `connect`; nodes pareados também podem informar
  presença durável em segundo plano quando um evento de nó confiável atualiza seus metadados de pareamento.

### Evento de nó vivo em segundo plano

Nodes podem chamar `node.event` com `event: "node.presence.alive"` para registrar que um nó pareado estava
vivo durante uma ativação em segundo plano sem marcá-lo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é um enum fechado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Strings de acionador desconhecidas são normalizadas para
`background` pelo Gateway antes da persistência. O evento é durável somente para sessões autenticadas de dispositivo
de nó; sessões sem dispositivo ou não pareadas retornam `handled: false`.

Gateways bem-sucedidos retornam um resultado estruturado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; os clientes devem tratar isso como um
RPC reconhecido, não como persistência durável de presença.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor têm escopo controlado para que sessões com escopo de pareamento ou somente de nó não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses frames completamente.
- **Broadcasts `plugin.*` definidos por Plugin** são controlados por `operator.write` ou `operator.admin`, dependendo de como o plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem irrestritos para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por escopo por padrão (falham fechadas), a menos que um manipulador registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem ordenação monotônica nesse socket, mesmo quando clientes diferentes veem subconjuntos diferentes do fluxo de eventos filtrados por escopo.

## Famílias comuns de métodos RPC

A superfície WS pública é mais ampla do que os exemplos de handshake/autenticação acima. Isto
não é um despejo gerado — `hello-ok.features.methods` é uma lista conservadora
de descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exports de métodos
de plugin/canal carregados. Trate-a como descoberta de recursos, não como uma enumeração completa
de `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway armazenado em cache ou recém-sondado.
    - `diagnostics.stability` retorna o gravador recente e limitado de estabilidade diagnóstica. Ele mantém metadados operacionais, como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e ids de sessão. Ele não mantém texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies nem valores secretos. Escopo de leitura do operador é obrigatório.
    - `status` retorna o resumo do Gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade do dispositivo Gateway usada por fluxos de retransmissão e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operador/Node conectados.
    - `system-event` acrescenta um evento de sistema e pode atualizar/transmitir o contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no Gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em tempo de execução. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso do provedor/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
      Passe `agentId` para um agente, ou `agentScope: "all"` para agregar agentes configurados.
    - `doctor.memory.status` retorna prontidão de memória vetorial / embeddings em cache para o workspace ativo do agente padrão. Passe `{ "probe": true }` ou `{ "deep": true }` apenas quando o chamador quiser explicitamente um ping ao vivo do provedor de embeddings. Clientes cientes de Dreaming também podem passar `{ "agentId": "agent-id" }` para limitar estatísticas do armazenamento Dreaming a um workspace de agente selecionado; omitir `agentId` mantém o fallback do agente padrão e agrega workspaces Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` aceitam parâmetros opcionais `{ "agentId": "agent-id" }` para visualizações/ações de Dreaming do agente selecionado. Quando `agentId` é omitido, eles operam no workspace do agente padrão configurado.
    - `doctor.memory.remHarness` retorna uma prévia limitada e somente leitura do harness REM para clientes remotos do plano de controle. Ela pode incluir caminhos de workspace, trechos de memória, markdown fundamentado renderizado e candidatos de promoção profunda, então os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão. Passe `agentId` para um
      agente, ou `agentScope: "all"` para listar agentes configurados juntos.
    - `sessions.usage.timeseries` retorna uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/Plugins integrados + empacotados.
    - `channels.logout` desconecta um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um Node iOS registrado.
    - `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
    - `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna a cauda configurada do log de arquivo do Gateway com controles de cursor/limite e máximo de bytes.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores Talk para fala, transcrição por streaming e voz em tempo real. Ele inclui ids canônicos de provedor, aliases de registro, rótulos, estado configurado, um resultado opcional `ready` em nível de grupo, ids expostos de modelo/voz, modos canônicos, transportes, estratégias de cérebro e sinalizadores de áudio/capacidade em tempo real sem retornar segredos de provedor nem modificar a configuração global. Gateways atuais definem `ready` após aplicar a seleção de provedor em tempo de execução; clientes devem tratar sua ausência como não verificada para compatibilidade com Gateways mais antigos.
    - `talk.config` retorna o payload de configuração efetiva do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão Talk pertencente ao Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Para `stt-tts/managed-room`, chamadores `operator.write` que passam `sessionKey` também devem passar `spawnedBy` para visibilidade com escopo da chave de sessão; criação sem escopo de `sessionKey` e `brain: "direct-tools"` exigem `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite eventos `session.ready` ou `session.replaced` conforme necessário e retorna metadados de sala/sessão mais eventos Talk recentes sem o token em texto simples nem o hash de token armazenado.
    - `talk.session.appendAudio` acrescenta áudio de entrada PCM em base64 a sessões de retransmissão em tempo real e transcrição pertencentes ao Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` conduzem o ciclo de vida de turnos de sala gerenciada com rejeição de turno obsoleto antes que o estado seja limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção gated por VAD em sessões de retransmissão do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta do provedor emitida por uma sessão de retransmissão em tempo real pertencente ao Gateway. Passe `options: { willContinue: true }` para saída intermediária da ferramenta quando um resultado final será enviado depois, ou `options: { suppressResponse: true }` quando o resultado da ferramenta deve satisfazer a chamada do provedor sem iniciar outra resposta do assistente em tempo real.
    - `talk.session.steer` envia controle de voz da execução ativa para uma sessão Talk baseada em agente pertencente ao Gateway. Ele aceita `{ sessionId, text, mode? }`, em que `mode` é `status`, `steer`, `cancel` ou `followup`; o modo omitido é classificado a partir do texto falado.
    - `talk.session.close` fecha uma sessão de retransmissão, transcrição ou sala gerenciada pertencente ao Gateway e emite eventos Talk terminais.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real pertencente ao cliente usando `webrtc` ou `provider-websocket` enquanto o Gateway possui a configuração, credenciais, instruções e política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real pertencentes ao cliente encaminhem chamadas de ferramentas do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; clientes recebem um id de execução e aguardam eventos normais do ciclo de vida do chat antes de enviar o resultado de ferramenta específico do provedor.
    - `talk.client.steer` envia controle de voz da execução ativa para transportes em tempo real pertencentes ao cliente. O Gateway resolve a execução incorporada ativa a partir de `sessionKey` e retorna um resultado estruturado aceito/rejeitado em vez de descartar o direcionamento silenciosamente.
    - `talk.event` é o único canal de eventos Talk para adaptadores em tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reunião.
    - `talk.speak` sintetiza fala pelo provedor de fala Talk ativo.
    - `tts.status` retorna o estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
    - `tts.setProvider` atualiza o provedor TTS preferido.
    - `tts.convert` executa uma conversão pontual de texto para fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em tempo de execução apenas em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredo direcionadas a comando para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e o hash da configuração atual.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração. Substituição destrutiva de array
      exige o caminho afetado em `replacePaths`; arrays aninhados
      sob entradas de array usam caminhos `[]`, como `agents.list[].skills`.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload do esquema de configuração ao vivo usado pela Control UI e por ferramentas de CLI: esquema, `uiHints`, versão e metadados de geração, incluindo metadados de esquema de Plugin + canal quando o runtime consegue carregá-los. O esquema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e textos de ajuda usados pela UI, incluindo branches de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo por caminho para um caminho de configuração: caminho normalizado, um nó de esquema raso, dica correspondente + `hintPath`, `reloadKind` opcional e resumos imediatos de filhos para detalhamento em UI/CLI. `reloadKind` é um de `restart`, `hot` ou `none` e espelha o planejador de recarregamento de configuração do Gateway para o caminho solicitado. Nós de esquema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e sinalizadores como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, `reloadKind` opcional, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização apenas quando a própria atualização teve sucesso; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno de agente de acompanhamento pela fila de continuação de reinicialização. Atualizações por gerenciador de pacotes e atualizações supervisionadas de checkout git a partir do plano de controle usam uma transferência destacada para serviço gerenciado em vez de substituir a árvore do pacote ou modificar a saída de checkout/build dentro do Gateway ao vivo. Uma transferência iniciada retorna `ok: true` com `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; transferências indisponíveis ou com falha retornam `ok: false` com `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, além de `handoff.command` quando uma atualização manual por shell é obrigatória. Uma transferência indisponível significa que o OpenClaw não tem um limite seguro de supervisor ou uma identidade de serviço durável, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante uma transferência iniciada, o sentinela de reinicialização pode relatar brevemente `stats.reason: "restart-health-pending"`; a continuação é adiada até que a CLI verifique o Gateway reiniciado e grave o sentinela final `ok`.
    - `update.status` atualiza e retorna o sentinela de reinicialização de atualização mais recente, incluindo a versão em execução pós-reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding via WS RPC.

  </Accordion>

  <Accordion title="Auxiliares de agente e espaço de trabalho">
    - `agents.list` retorna entradas de agentes configuradas, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a conexão com o espaço de trabalho.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de espaço de trabalho de bootstrap expostos para um agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o registro de tarefas do Gateway para clientes SDK e operadores.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos de artefatos derivados de transcrições e downloads para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no lado do servidor e retornam apenas mídia de transcrição com proveniência correspondente; fontes de URL inseguras ou locais retornam downloads sem suporte em vez de serem buscadas no lado do servidor.
    - `environments.list` e `environments.status` expõem a descoberta somente leitura de ambientes locais ao Gateway e de Node para clientes SDK.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessões atual, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias de transcrição limitadas para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e direcionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo de uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway consiga resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições de sessão e informa o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha de sessão armazenada completa.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e tokens de controle de modelo ASCII/largura completa vazados são removidos, linhas de assistente compostas apenas por tokens silenciosos, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.
    - `chat.message.get` é o leitor aditivo e limitado de mensagem completa para uma única entrada de transcrição visível. Clientes passam `sessionKey`, `agentId` opcional quando a seleção de sessão é escopada por agente, mais um `messageId` de transcrição previamente exposto por `chat.history`, e o Gateway retorna a mesma projeção normalizada para exibição sem o limite leve de truncamento de histórico quando a entrada armazenada ainda está disponível e não é grande demais.
    - `chat.send` aceita `fastMode: "auto"` de um turno para usar modo rápido em chamadas de modelo iniciadas antes do corte automático, e então iniciar chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação sem modo rápido. O corte tem padrão de 60 segundos e pode ser configurado por modelo com `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Um chamador de `chat.send` pode passar `fastAutoOnSeconds` de um turno para substituir o corte dessa solicitação.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento de Node, invocação e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem o pareamento de Node e a verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de Nodes conhecidos/conectados.
    - `node.rename` atualiza um rótulo de Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `node.event` transporta eventos originados no Node de volta para o gateway.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações únicas de aprovação de exec mais consulta/reprodução de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna a decisão final (ou `null` em caso de timeout).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de exec do gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de exec local ao Node via comandos de relay do Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por plugin.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata de texto de despertar ou no próximo Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - `cron.run` continua sendo um RPC no estilo enfileiramento para execuções manuais. Clientes que precisam de semântica de conclusão devem ler o `runId` retornado e consultar `cron.runs`.
    - `cron.runs` aceita um filtro opcional não vazio de `runId` para que clientes acompanhem uma execução manual enfileirada sem competir com outras entradas de histórico para o mesmo job.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias de eventos comuns

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  apenas de transcrição. No protocolo v4, payloads delta carregam `deltaText`; `message` continua sendo
  o snapshot acumulado do assistente. Substituições que não são prefixo definem `replace=true`
  e usam `deltaText` como texto de substituição.
- `session.message`, `session.operation` e `session.tool`: atualizações de transcrição,
  operação de sessão em andamento e stream de eventos para uma sessão
  assinada.
- `sessions.changed`: índice de sessões ou metadados alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / atividade.
- `health`: atualização de snapshot de integridade do gateway.
- `heartbeat`: atualização do stream de eventos de Heartbeat.
- `cron`: evento de alteração de execução/job de Cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento de Node.
- `node.invoke.request`: broadcast de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de gatilho por palavra de ativação alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação de plugin.

### Métodos auxiliares de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de permissão automática.

### RPCs do registro de tarefas

Clientes operadores podem inspecionar e cancelar registros de tarefas em segundo plano do Gateway por meio
dos RPCs do registro de tarefas. Esses métodos retornam resumos de tarefas sanitizados, não estado
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
  - IDs de tarefa ausentes retornam o formato de erro not-found do Gateway.
- `tasks.cancel` exige `operator.write`.
  - Parâmetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o registro tinha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais como `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progresso,
resumo terminal e texto de erro sanitizado. `agentId` identifica o agente
que executa a tarefa; `sessionKey` e `ownerKey` preservam o contexto do solicitante
e de controle.

### Métodos auxiliares de operador

- Os operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em tempo de execução de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário tem como alvo:
    - `text` retorna o token primário do comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor quando disponíveis
  - `textAliases` carrega aliases de barra exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome do comando nativo ciente do provedor quando existe.
  - `provider` é opcional e afeta apenas a nomeação nativa e a disponibilidade de comandos nativos de plugin.
  - `includeArgs=false` omite metadados de argumentos serializados da resposta.
- Os operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em tempo de execução de um agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Os operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas efetivo em tempo de execução de uma sessão.
  - `sessionKey` é obrigatório.
  - O Gateway deriva o contexto confiável de tempo de execução da sessão no lado do servidor, em vez de aceitar contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta é uma projeção derivada do servidor com escopo de sessão do inventário ativo, incluindo ferramentas do núcleo, de plugins, de canais e de servidores MCP já descobertos.
  - `tools.effective` é somente leitura para MCP: ele pode projetar um catálogo MCP de sessão aquecida pela política final de ferramentas, mas não cria runtimes MCP, conecta transportes nem emite `tools/list`. Se não existir um catálogo aquecido correspondente, a resposta pode incluir um aviso como `mcp-not-yet-connected`, `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Entradas de ferramentas efetivas usam `source="core"`, `source="plugin"`, `source="channel"` ou `source="mcp"`.
- Os operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível pelo mesmo caminho de política do Gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente da sessão resolvida deve corresponder a `agentId`.
  - Wrappers principais restritos ao proprietário, como `cron`, `gateway` e `nodes`, exigem identidade de proprietário/admin (`operator.admin`), embora o próprio método `tools.invoke` seja `operator.write`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output` opcional e campos `error` tipados. Recusas por aprovação ou política retornam `ok:false` no payload, em vez de contornar o pipeline de política de ferramentas do Gateway.
- Os operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível de Skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e opções de instalação sanitizadas sem expor valores brutos de segredos.
- Os operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para metadados de descoberta do ClawHub.
- Os operadores podem chamar `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit` (`operator.admin`) para preparar um arquivo de skill privado antes de instalá-lo. Este é um caminho separado de upload administrativo para clientes confiáveis, não o fluxo normal de instalação de skills do ClawHub, e é desabilitado por padrão, a menos que `skills.install.allowUploadedArchives` esteja habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    cria um upload vinculado a esse slug e valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` acrescenta bytes no deslocamento decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e o SHA-256. O commit apenas finaliza o upload; ele não instala a skill.
  - Arquivos de skill enviados são arquivos zip contendo uma raiz `SKILL.md`. O nome do diretório interno do arquivo nunca seleciona o alvo de instalação.
- Os operadores podem chamar `skills.install` (`operator.admin`) em três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma pasta de skill no diretório `skills/` do workspace padrão do agente.
  - Modo de upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala um upload confirmado no diretório `skills/<slug>` do workspace padrão do agente. O slug e o valor de force devem corresponder à solicitação original de `skills.upload.begin`. Este modo é rejeitado a menos que `skills.install.allowUploadedArchives` esteja habilitado. A configuração não afeta instalações do ClawHub.
  - Modo instalador do Gateway: `{ name, installId, timeoutMs? }`
    executa uma ação `metadata.openclaw.install` declarada no host do Gateway. Clientes mais antigos ainda podem enviar `dangerouslyForceUnsafeInstall`; esse campo está obsoleto, é aceito apenas para compatibilidade de protocolo e é ignorado. Use `security.installPolicy` para decisões de instalação pertencentes ao operador.
- Os operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações ClawHub rastreadas no workspace padrão do agente.
  - O modo de configuração corrige valores de `skills.entries.<skillKey>`, como `enabled`, `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro opcional `view`:

- Omitido ou `"default"`: comportamento atual em tempo de execução. Se `agents.defaults.models` estiver configurado, a resposta é o catálogo permitido, incluindo modelos descobertos dinamicamente para entradas `provider/*`. Caso contrário, a resposta é o catálogo completo do Gateway.
- `"configured"`: comportamento dimensionado para seletor. Se `agents.defaults.models` estiver configurado, ele ainda prevalece, incluindo descoberta com escopo de provedor para entradas `provider/*`. Sem uma lista de permissões, a resposta usa entradas explícitas de `models.providers.*.models`, recorrendo ao catálogo completo apenas quando não existem linhas de modelo configuradas.
- `"all"`: catálogo completo do Gateway, ignorando `agents.defaults.models`. Use isto para diagnósticos e UIs de descoberta, não para seletores normais de modelo.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o Gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador modificar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o Gateway rejeita a execução em vez de confiar no payload modificado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou somente internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota externa entregável pode ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas de múltiplos canais).
- Resultados finais de `agent` podem incluir `result.deliveryStatus` quando a entrega foi solicitada, usando os mesmos status `sent`, `suppressed`, `partial_failed` e `failed` documentados para [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` fica em `packages/gateway-protocol/src/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita intervalos que não incluem seu protocolo atual. Clientes e servidores atuais exigem o protocolo v4.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são estáveis no protocolo v4 e são a base esperada para clientes de terceiros.

| Constante                                 | Padrão                                                | Fonte                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Tempo limite da solicitação (por RPC)     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tempo limite de preauth / connect-challenge | `15_000` ms                                         | `src/gateway/handshake-timeouts.ts` (config/env pode elevar o orçamento pareado servidor/cliente) |
| Backoff inicial de reconexão              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexão               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nova tentativa rápida após fechamento por device-token | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Carência de parada forçada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo de tick padrão (pré `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Fechamento por timeout de tick            | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

O servidor anuncia `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` efetivos em `hello-ok`; os clientes devem respeitar esses valores em vez dos padrões pré-handshake.

## Autenticação

- A autenticação do Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou não local loopback
  `gateway.auth.mode: "trusted-proxy"` satisfazem a verificação de autenticação de conexão a partir dos
  cabeçalhos da solicitação, em vez de `connect.params.auth.*`.
- O modo de ingresso privado `gateway.auth.mode: "none"` ignora totalmente a autenticação
  de conexão por segredo compartilhado; não exponha esse modo em ingressos públicos/não confiáveis.

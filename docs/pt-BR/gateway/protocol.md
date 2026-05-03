---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: negociação inicial, quadros, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-05-03T21:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de nós** para
OpenClaw. Todos os clientes (CLI, UI web, app macOS, nós iOS/Android, nós
headless) se conectam por WebSocket e declaram sua **função** + **escopo** no
momento da negociação.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.
- Frames pré-conexão são limitados a 64 KiB. Após uma negociação bem-sucedida, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos habilitados,
  frames de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o gateway feche ou descarte o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  o conteúdo de anexos, o corpo bruto do frame, tokens, cookies ou valores secretos.

## Negociação (connect)

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
retornar um erro `UNAVAILABLE` repetível com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem repetir essa resposta
dentro do orçamento geral de conexão, em vez de apresentá-la como uma falha terminal
de negociação.

`server`, `features`, `snapshot` e `policy` são todos exigidos pelo esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` também é exigido e informa
a função/escopos negociados. `canvasHostUrl` é opcional.

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

Clientes de backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas de loopback
quando se autenticam com o token/senha compartilhado do gateway. Esse caminho é reservado
para RPCs internos do plano de controle e evita que baselines obsoletas de pareamento CLI/dispositivo
bloqueiem trabalho de backend local, como atualizações de sessão de subagente. Clientes remotos,
clientes de origem de navegador, clientes de nó e clientes explícitos de token de dispositivo/identidade de dispositivo
ainda usam as verificações normais de pareamento e aumento de escopo.

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

Durante a transferência de bootstrap confiável, `hello-ok.auth` também pode incluir entradas
adicionais de função delimitada em `deviceTokens`:

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

Para o fluxo de bootstrap integrado de nó/operador, o token primário do nó permanece
`scopes: []` e qualquer token de operador transferido permanece limitado à lista de permissões
do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap permanecem
prefixadas por função: entradas de operador satisfazem apenas solicitações de operador, e funções
não operadoras ainda precisam de escopos sob seu próprio prefixo de função.

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

Métodos com efeitos colaterais exigem **chaves de idempotência** (consulte o esquema).

## Funções + escopos

Para o modelo completo de escopo de operador, verificações no momento da aprovação e semântica
de segredo compartilhado, consulte [Escopos de operador](/pt-BR/gateway/operator-scopes).

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

`talk.config` com `includeSecrets: true` requer `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC do Gateway registrados por Plugin podem solicitar seu próprio escopo de operador, mas
prefixos reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas o primeiro bloqueio. Alguns comandos de barra acessados por
`chat.send` aplicam verificações mais rígidas em nível de comando além disso. Por exemplo, gravações persistentes de
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de Node sem exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permissões (Node)

Nodes declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: controles granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica listas de permissões no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operador** e **Node**.
- `node.list` inclui os campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nodes conectados informam
  seu horário de conexão atual como `lastSeenAtMs` com motivo `connect`; Nodes pareados também podem informar
  presença durável em segundo plano quando um evento de Node confiável atualiza seus metadados de pareamento.

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
`significant_location`, `manual` ou `connect`. Strings de acionador desconhecidas são normalizadas para
`background` pelo Gateway antes da persistência. O evento só é durável para sessões autenticadas de dispositivo
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

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; clientes devem tratar isso como uma
RPC reconhecida, não como persistência durável de presença.

## Escopo de eventos de transmissão

Eventos de transmissão WebSocket enviados pelo servidor são bloqueados por escopo para que sessões com escopo de pareamento ou apenas de Node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos por streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses frames completamente.
- **Transmissões `plugin.*` definidas por Plugin** são bloqueadas para `operator.write` ou `operator.admin`, dependendo de como o Plugin as registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem irrestritos para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de transmissão** são bloqueadas por escopo por padrão (falham fechadas), a menos que um manipulador registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que as transmissões preservem a ordenação monotônica nesse socket, mesmo quando clientes diferentes veem subconjuntos diferentes do fluxo de eventos filtrados por escopo.

## Famílias comuns de métodos RPC

A superfície pública de WS é mais ampla do que os exemplos de handshake/autenticação acima. Esta
não é uma listagem gerada — `hello-ok.features.methods` é uma lista conservadora
de descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exportações de métodos de
Plugin/canal carregadas. Trate-a como descoberta de recursos, não como uma
enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o registrador de estabilidade diagnóstica recente e limitado. Ele mantém metadados operacionais como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e ids de sessão. Ele não mantém texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies ou valores secretos. O escopo de leitura do operador é obrigatório.
    - `status` retorna o resumo do Gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade de dispositivo do Gateway usada por fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operador/Node conectados.
    - `system-event` acrescenta um evento de sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no Gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em runtime. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso/resumos de cota restante do provedor.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão de memória vetorial / embedding em cache para o workspace ativo do agente padrão. Passe `{ "probe": true }` ou `{ "deep": true }` somente quando o chamador quiser explicitamente um ping ao vivo do provedor de embedding.
    - `doctor.memory.remHarness` retorna uma prévia limitada e somente leitura do harness REM para clientes remotos do plano de controle. Ele pode incluir caminhos de workspace, trechos de memória, markdown fundamentado renderizado e candidatos de promoção profunda, portanto os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/plugins integrados + incluídos.
    - `channels.logout` encerra a sessão de um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um nó iOS registrado.
    - `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
    - `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna a cauda do log de arquivo configurado do Gateway com controles de cursor/limite e máximo de bytes.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza fala por meio do provedor de fala ativo do Talk.
    - `tts.status` retorna o estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores de TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
    - `tts.setProvider` atualiza o provedor de TTS preferido.
    - `tts.convert` executa uma conversão avulsa de texto para fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em runtime somente em caso de sucesso total.
    - `secrets.resolve` resolve atribuições de segredos direcionadas a comandos para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e hash atuais da configuração.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload do schema de configuração ao vivo usado pela Control UI e pelas ferramentas da CLI: schema, `uiHints`, versão e metadados de geração, incluindo metadados de schema de plugin + canal quando o runtime consegue carregá-los. O schema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e texto de ajuda usados pela UI, incluindo ramificações de composição de objeto aninhado, wildcard, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de schema superficial, dica correspondente + `hintPath` e resumos de filhos imediatos para detalhamento em UI/CLI. Os nós de schema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Os resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondente.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização somente quando a atualização em si foi bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno de agente de acompanhamento por meio da fila de continuação da reinicialização. Atualizações do gerenciador de pacotes forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote, para que o processo antigo do Gateway não continue fazendo carregamento preguiçoso a partir de uma árvore `dist` substituída.
    - `update.status` retorna o sentinela de reinicialização de atualização mais recente em cache, incluindo a versão em execução pós-reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de integração via RPC WS.

  </Accordion>

  <Accordion title="Auxiliares de agente e workspace">
    - `agents.list` retorna entradas de agentes configurados, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e conexão com workspaces.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de workspace de bootstrap expostos para um agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos de artefatos derivados de transcrições e downloads para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no lado do servidor e retornam apenas mídia de transcrição com proveniência correspondente; fontes de URL inseguras ou locais retornam downloads sem suporte em vez de serem buscadas no lado do servidor.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda uma execução terminar e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessões atual, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam inscrições em eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam inscrições em eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e direcionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo para uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway consegue resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições de sessão e relata o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` realizam manutenção de sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição em clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos de chamadas de ferramenta truncados) e tokens vazados de controle de modelo ASCII/largura completa são removidos, linhas de assistente compostas puramente por tokens silenciosos, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` alterna um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento, invocação e trabalho pendente de Node">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem o pareamento de Node e a verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de Nodes conhecidos/conectados.
    - `node.rename` atualiza um rótulo de Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `node.event` transporta eventos originados pelo Node de volta para o Gateway.
    - `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações de aprovação de exec de uso único, além de consulta/reprodução de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna a decisão final (ou `null` em caso de tempo esgotado).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de exec do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de exec local ao Node por meio de comandos de retransmissão de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por plugins.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de despertar; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma sessão inscrita.
- `sessions.changed`: índice de sessão ou metadados alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / disponibilidade.
- `health`: atualização de snapshot de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/tarefa Cron.
- `shutdown`: notificação de desligamento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento de Node.
- `node.invoke.request`: transmissão de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de acionamento por palavra de despertar alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação de plugin.

### Métodos auxiliares de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills para verificações de permissão automática.

### Métodos auxiliares do operador

- Os operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em tempo de execução de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário mira:
    - `text` retorna o token primário do comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor quando disponíveis
  - `textAliases` carrega aliases de barra exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo ciente do provedor quando houver um.
  - `provider` é opcional e afeta apenas a nomenclatura nativa e a disponibilidade de comandos nativos de plugin.
  - `includeArgs=false` omite da resposta os metadados de argumentos serializados.
- Os operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em tempo de execução de um agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Os operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas efetivo em tempo de execução de uma sessão.
  - `sessionKey` é obrigatório.
  - O Gateway deriva o contexto confiável de tempo de execução da sessão no lado do servidor, em vez de aceitar autenticação ou contexto de entrega fornecidos pelo chamador.
  - A resposta é delimitada à sessão e reflete o que a conversa ativa pode usar agora, incluindo ferramentas do núcleo, de plugins e de canais.
- Os operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível pelo mesmo caminho de política do Gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente da sessão resolvida deve corresponder a `agentId`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output` opcional e campos `error` tipados. Aprovação ou recusas por política retornam `ok:false` no payload, em vez de contornar o pipeline de política de ferramentas do Gateway.
- Os operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível de Skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e opções de instalação sanitizadas sem expor valores secretos brutos.
- Os operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para metadados de descoberta do ClawHub.
- Os operadores podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma pasta de Skills no diretório `skills/` do workspace padrão do agente.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` executa uma ação declarada em `metadata.openclaw.install` no host do Gateway.
- Os operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no workspace padrão do agente.
  - O modo de configuração aplica patches em valores `skills.entries.<skillKey>`, como `enabled`, `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro opcional `view`:

- Omitido ou `"default"`: comportamento atual em tempo de execução. Se `agents.defaults.models` estiver configurado, a resposta é o catálogo permitido; caso contrário, a resposta é o catálogo completo do Gateway.
- `"configured"`: comportamento dimensionado para seletor. Se `agents.defaults.models` estiver configurado, ele ainda prevalece. Caso contrário, a resposta usa entradas explícitas de `models.providers.*.models`, recorrendo ao catálogo completo apenas quando não houver linhas de modelos configuradas.
- `"all"`: catálogo completo do Gateway, ignorando `agents.defaults.models`. Use isto para diagnósticos e UIs de descoberta, não para seletores de modelo normais.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o Gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (exige o escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o Gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução apenas na sessão quando nenhuma rota entregável externa puder ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas de múltiplos canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são estáveis no protocolo v3 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                                | Fonte                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout de solicitação (por RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout de pré-autenticação / desafio de conexão | `15_000` ms                                   | `src/gateway/handshake-timeouts.ts` (config/env pode aumentar o orçamento pareado de servidor/cliente) |
| Backoff inicial de reconexão              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexão               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nova tentativa rápida após fechamento por token de dispositivo | `250` ms               | `src/gateway/client.ts`                                                                    |
| Período de carência de parada forçada antes de `terminate()` | `250` ms                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout padrão de `stopAndWait()`         | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo padrão de tick (pré `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Fechamento por timeout de tick            | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

O servidor anuncia o `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` efetivos em `hello-ok`; clientes devem respeitar esses valores em vez dos padrões anteriores ao handshake.

## Autenticação

- A autenticação do Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos que carregam identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  fora de loopback, satisfazem a verificação de autenticação de conexão a partir
  dos cabeçalhos da requisição em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` para ingresso privado ignora completamente a
  autenticação de conexão por segredo compartilhado; não exponha esse modo em
  ingressos públicos/não confiáveis.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo
  limitado ao papel + escopos da conexão. Ele é retornado em
  `hello-ok.auth.deviceToken` e deve ser persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar
  o conjunto de escopos aprovados armazenado para esse token. Isso preserva o
  acesso de leitura/sondagem/status que já foi concedido e evita reduzir
  silenciosamente as reconexões a um escopo implícito mais estreito, apenas de administrador.
- Montagem de autenticação de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito, depois um token por dispositivo armazenado (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na nova tentativa única de
    `AUTH_TOKEN_MISMATCH` é limitada a **endpoints confiáveis somente** —
    loopback, ou `wss://` com um `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- Entradas adicionais de `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-as somente quando a conexão usou autenticação de bootstrap em um transporte confiável,
  como `wss://` ou pareamento por loopback/local.
- Se um cliente fornece um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só são
  reutilizados quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer o escopo `operator.pairing`).
- `device.token.rotate` retorna metadados de rotação. Ele ecoa o token portador substituto
  somente para chamadas do mesmo dispositivo que já estão autenticadas com
  esse token de dispositivo, para que clientes apenas com token possam persistir o substituto antes
  de reconectar. Rotações compartilhadas/de administrador não ecoam o token portador.
- A emissão, rotação e revogação de tokens permanecem limitadas ao conjunto de papéis aprovados
  registrado na entrada de pareamento desse dispositivo; a mutação de token não pode expandir nem
  mirar um papel de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos é autoescopado, a menos que o
  chamador também tenha `operator.admin`: chamadores não administradores podem remover/revogar/rotacionar
  somente a entrada do **próprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos do token de operador
  alvo contra os escopos da sessão atual do chamador. Chamadores não administradores
  não podem rotacionar nem revogar um token de operador mais amplo do que o que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientação de ação para o operador.

## Identidade do dispositivo + pareamento

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas de local loopback.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis de segredo compartilhado.
- Conexões de tailnet ou LAN no mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem identidade de `device` durante `connect` (operador +
  node). As únicas exceções de operador sem dispositivo são caminhos explícitos de confiança:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade HTTP insegura somente em localhost.
  - autenticação de operador da Control UI bem-sucedida com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (quebra-vidro, rebaixamento severo de segurança).
  - RPCs de backend `gateway-client` em loopback direto autenticadas com o token/senha
    compartilhado do Gateway.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou vazio). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | A carga de assinatura não corresponde à carga v2.  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da margem permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falha no formato/canonização da chave pública.     |

Alvo da migração:

- Sempre aguarde `connect.challenge`.
- Assine a carga v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- A carga de assinatura preferida é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas a fixação de metadados
  de dispositivo pareado ainda controla a política de comando na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Os clientes podem opcionalmente fixar a impressão digital do certificado do Gateway (consulte a configuração
  `gateway.tls` mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do Gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

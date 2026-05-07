---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando o esquema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-05-07T13:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de nós** para
OpenClaw. Todos os clientes (CLI, UI web, app macOS, nós iOS/Android, nós
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.
- Frames antes da conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos ativados,
  frames de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o gateway feche ou descarte o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  conteúdos de anexos, corpo bruto do frame, tokens, cookies ou valores secretos.

## Handshake (connect)

Gateway → Cliente (desafio antes da conexão):

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
    "minProtocol": 4,
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
retornar um erro `UNAVAILABLE` passível de nova tentativa com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem tentar novamente essa resposta
dentro do orçamento geral de conexão em vez de exibi-la como uma falha terminal de
handshake.

`server`, `features`, `snapshot` e `policy` são todos obrigatórios pelo esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` também é obrigatório e relata
o papel/escopos negociados. `pluginSurfaceUrls` é opcional e mapeia nomes de superfícies de plugin,
como `canvas`, para URLs hospedadas com escopo.

URLs de superfícies de plugin com escopo podem expirar. Nós podem chamar
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para receber uma entrada nova
em `pluginSurfaceUrls`. A refatoração experimental do Plugin Canvas não
oferece suporte ao caminho de compatibilidade obsoleto `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh`; clientes nativos e gateways atuais devem usar superfícies de plugin.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` relata as permissões negociadas
sem campos de token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Clientes backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões de loopback diretas quando
se autenticam com o token/senha compartilhado do gateway. Esse caminho é reservado
para RPCs internos do plano de controle e evita que baselines obsoletas de pareamento de CLI/dispositivo
bloqueiem trabalho local de backend, como atualizações de sessão de subagente. Clientes remotos,
clientes de origem de navegador, clientes de nó e clientes explícitos com token de dispositivo/identidade de dispositivo
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

Durante a transferência de bootstrap confiável, `hello-ok.auth` também pode incluir entradas adicionais
de papel limitado em `deviceTokens`:

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

Para o fluxo integrado de bootstrap de nó/operador, o token primário do nó permanece
`scopes: []` e qualquer token de operador transferido permanece limitado à allowlist do operador de bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap permanecem
prefixadas por papel: entradas de operador só satisfazem solicitações de operador, e papéis não operadores
ainda precisam de escopos sob o próprio prefixo de papel.

### Exemplo de Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

## Papéis + escopos

Para o modelo completo de escopo de operador, verificações no momento da aprovação e semântica de segredo compartilhado,
consulte [Escopos de operador](/pt-BR/gateway/operator-scopes).

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

Métodos RPC do gateway registrados por plugin podem solicitar seu próprio escopo de operador, mas
prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas o primeiro bloqueio. Alguns comandos de barra acessados por meio de
`chat.send` aplicam verificações mais rígidas em nível de comando por cima. Por exemplo, escritas persistentes
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação de escopo extra no momento da aprovação além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de nó não exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permissões (nó)

Nós declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e impõe allowlists do lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.
- `node.list` inclui campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nós conectados relatam
  seu horário de conexão atual como `lastSeenAtMs` com motivo `connect`; nós pareados também podem relatar
  presença durável em segundo plano quando um evento confiável de nó atualiza seus metadados de pareamento.

### Evento de nó ativo em segundo plano

Nós podem chamar `node.event` com `event: "node.presence.alive"` para registrar que um nó pareado estava
ativo durante um despertar em segundo plano sem marcá-lo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é um enum fechado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Strings de trigger desconhecidas são normalizadas para
`background` pelo gateway antes da persistência. O evento é durável apenas para sessões de dispositivo de nó
autenticadas; sessões sem dispositivo ou não pareadas retornam `handled: false`.

Gateways bem-sucedidos retornam um resultado estruturado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; clientes devem tratar isso como um
RPC reconhecido, não como persistência de presença durável.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são filtrados por escopo para que sessões com escopo de pareamento ou somente nó não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos por streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses frames completamente.
- **Broadcasts `plugin.*` definidos por Plugin** são limitados a `operator.write` ou `operator.admin`, dependendo de como o plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem irrestritos para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são filtradas por escopo por padrão (fail-closed), a menos que um handler registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente, de modo que broadcasts preservem ordenação monotônica nesse socket mesmo quando clientes diferentes veem subconjuntos diferentes filtrados por escopo do fluxo de eventos.

## Famílias comuns de métodos RPC

A superfície WS pública é mais ampla que os exemplos de handshake/autenticação acima. Isto
não é um dump gerado — `hello-ok.features.methods` é uma lista conservadora
de descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exports de métodos
de plugin/canal carregados. Trate-a como descoberta de recursos, não como uma
enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` retorna o snapshot de integridade do gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o gravador recente e limitado de estabilidade diagnóstica. Ele mantém metadados operacionais, como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e ids de sessão. Ele não mantém texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies ou valores secretos. Escopo de leitura de operador é obrigatório.
    - `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operadores com escopo de admin.
    - `gateway.identity.get` retorna a identidade de dispositivo do gateway usada por fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operador/nó conectados.
    - `system-event` acrescenta um evento do sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o último evento de heartbeat persistido.
    - `set-heartbeats` alterna o processamento de heartbeat no gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em runtime. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso de provedores/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings em cache para o workspace ativo do agente padrão. Passe `{ "probe": true }` ou `{ "deep": true }` apenas quando o chamador quiser explicitamente um ping ao vivo do provedor de embeddings.
    - `doctor.memory.remHarness` retorna uma prévia limitada e somente leitura do harness REM para clientes remotos do plano de controle. Ela pode incluir caminhos de workspace, trechos de memória, markdown fundamentado renderizado e candidatos a promoção profunda, portanto os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
    - `channels.logout` encerra a sessão de um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia uma notificação push APNs de teste para um Node iOS registrado.
    - `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
    - `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna a cauda do log em arquivo configurado do Gateway com cursor/limite e controles de bytes máximos.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores Talk para fala, transcrição por streaming e voz em tempo real. Ele inclui ids de provedores, rótulos, estado configurado, ids de modelos/vozes expostos, modos canônicos, transportes, estratégias de brain e flags de áudio/capacidade em tempo real sem retornar segredos de provedores nem alterar a configuração global.
    - `talk.config` retorna a carga útil efetiva da configuração Talk; `includeSecrets` requer `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão Talk pertencente ao Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. `brain: "direct-tools"` requer `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite eventos `session.ready` ou `session.replaced` conforme necessário e retorna metadados de sala/sessão mais eventos Talk recentes sem o token em texto claro nem o hash de token armazenado.
    - `talk.session.appendAudio` anexa áudio de entrada PCM em base64 a sessões de relay em tempo real e de transcrição pertencentes ao Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` conduzem o ciclo de vida de turnos de sala gerenciada com rejeição de turnos obsoletos antes que o estado seja limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção gated por VAD em sessões de relay do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta de provedor emitida por uma sessão de relay em tempo real pertencente ao Gateway.
    - `talk.session.close` fecha uma sessão de relay, transcrição ou sala gerenciada pertencente ao Gateway e emite eventos Talk terminais.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real pertencente ao cliente usando `webrtc` ou `provider-websocket`, enquanto o Gateway controla configuração, credenciais, instruções e política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real pertencentes ao cliente encaminhem chamadas de ferramentas do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; os clientes recebem um id de execução e aguardam eventos normais do ciclo de vida do chat antes de enviar o resultado de ferramenta específico do provedor.
    - `talk.event` é o canal único de eventos Talk para adaptadores em tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reunião.
    - `talk.speak` sintetiza fala por meio do provedor de fala Talk ativo.
    - `tts.status` retorna o estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
    - `tts.setProvider` atualiza o provedor TTS preferido.
    - `tts.convert` executa conversão única de texto para fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em runtime apenas em caso de sucesso total.
    - `secrets.resolve` resolve atribuições de segredos direcionadas a comando para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e o hash da configuração atual.
    - `config.set` grava uma carga útil de configuração validada.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui a carga útil completa de configuração.
    - `config.schema` retorna a carga útil do schema de configuração ao vivo usada pela Control UI e pelas ferramentas de CLI: schema, `uiHints`, versão e metadados de geração, incluindo metadados de schema de plugin + canal quando o runtime consegue carregá-los. O schema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e texto de ajuda usados pela UI, incluindo ramificações de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna uma carga útil de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de schema superficial, dica correspondente + `hintPath` e resumos de filhos imediatos para detalhamento em UI/CLI. Nós de schema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do gateway e agenda uma reinicialização apenas quando a própria atualização foi bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno de agente de acompanhamento por meio da fila de continuação de reinicialização. Atualizações de gerenciador de pacotes forçam uma reinicialização de atualização não adiada e sem cooldown após a troca de pacote, para que o processo antigo do Gateway não continue fazendo carregamento preguiçoso a partir de uma árvore `dist` substituída.
    - `update.status` retorna o sentinel mais recente em cache de reinicialização de atualização, incluindo a versão em execução após a reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por WS RPC.

  </Accordion>

  <Accordion title="Auxiliares de agente e workspace">
    - `agents.list` retorna entradas de agente configuradas, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e conexão de workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de bootstrap de workspace expostos para um agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos e downloads de artefatos derivados de transcrição para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no lado do servidor e retornam apenas mídia de transcrição com proveniência correspondente; fontes inseguras ou de URL local retornam downloads sem suporte em vez de buscar no lado do servidor.
    - `environments.list` e `environments.status` expõem descoberta somente leitura de ambientes locais do Gateway e de Node para clientes SDK.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessões atual, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e direcionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo de uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway consegue resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições de sessão e relata o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são removidas do texto visível, cargas XML de chamadas de ferramentas em texto puro (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramentas) e tokens vazados de controle de modelo ASCII/full-width são removidos, linhas de assistente compostas apenas por tokens silenciosos, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento de Node, invocação e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem o pareamento de Node e a verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de Nodes conhecidos/conectados.
    - `node.rename` atualiza um rótulo de Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `node.event` leva eventos originados por Node de volta ao gateway.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações pontuais de aprovação de exec, além de consulta/reprodução de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna a decisão final (ou `null` em caso de tempo limite).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de exec do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de exec local do Node por meio de comandos de retransmissão do Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por plugins.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de ativação; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  somente de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: índice ou metadados da sessão alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização de snapshot de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/tarefa Cron.
- `shutdown`: notificação de desligamento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento do Node.
- `node.invoke.request`: transmissão de solicitação de invocação do Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de acionamento por palavra de ativação alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação de Plugin.

### Métodos auxiliares do Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de skill
  para verificações de permissão automática.

### Métodos auxiliares de operador

- Operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos
  em tempo de execução de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário direciona:
    - `text` retorna o token primário de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor
      quando disponíveis
  - `textAliases` carrega aliases exatos com barra, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo ciente do provedor quando existe.
  - `provider` é opcional e afeta apenas a nomenclatura nativa e a disponibilidade de comandos
    nativos de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em tempo de execução de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do Plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de Plugin é opcional
- Operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas
  efetivo em tempo de execução para uma sessão.
  - `sessionKey` é obrigatório.
  - O Gateway deriva o contexto de runtime confiável da sessão no lado do servidor, em vez de aceitar
    contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas de core, Plugin e canal.
- Operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível por meio do
  mesmo caminho de política do Gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente da sessão resolvida deve corresponder a
    `agentId`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output` opcional e campos
    `error` tipados. Recusas por aprovação ou política retornam `ok:false` no payload em vez de
    contornar o pipeline de política de ferramentas do Gateway.
- Operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores brutos de segredos.
- Operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operadores podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace padrão do agente.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação `metadata.openclaw.install` declarada no host do Gateway.
- Operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace padrão do agente.
  - O modo de configuração aplica patches a valores de `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro opcional `view`:

- Omitido ou `"default"`: comportamento atual em tempo de execução. Se `agents.defaults.models` estiver configurado, a resposta será o catálogo permitido; caso contrário, a resposta será o catálogo completo do Gateway.
- `"configured"`: comportamento dimensionado para seletores. Se `agents.defaults.models` estiver configurado, ele ainda prevalece. Caso contrário, a resposta usa entradas explícitas de `models.providers.*.models`, recorrendo ao catálogo completo somente quando não houver linhas de modelo configuradas.
- `"all"`: catálogo completo do Gateway, ignorando `agents.defaults.models`. Use isto para diagnósticos e UIs de descoberta, não para seletores normais de modelo.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o Gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (exige o escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas `node.invoke system.run` encaminhadas reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador altera `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o
  Gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente em sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configurações multicanal ambíguas).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis no protocolo v4 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                                | Fonte                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                         |
| Tempo limite da solicitação (por RPC)     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Tempo limite de pré-autenticação / desafio de conexão | `15_000` ms                                | `src/gateway/handshake-timeouts.ts` (config/env podem aumentar o orçamento pareado servidor/cliente) |
| Backoff inicial de reconexão              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Backoff máximo de reconexão               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Limite de nova tentativa rápida após fechamento por token de dispositivo | `250` ms                 | `src/gateway/client.ts`                                                                   |
| Tolerância de parada forçada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Intervalo padrão de tick (pré `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                   |
| Fechamento por tempo limite de tick       | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                         |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões anteriores ao handshake.

## Autenticação

- A autenticação do Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos que carregam identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  fora de loopback, satisfazem a verificação de autenticação de conexão a partir
  dos cabeçalhos da solicitação em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` com entrada privada ignora completamente a autenticação
  de conexão por segredo compartilhado; não exponha esse modo em entradas públicas/não confiáveis.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo limitado à
  função da conexão + escopos. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto
  de escopos aprovados armazenado para esse token. Isso preserva o acesso de leitura/sondagem/status
  que já foi concedido e evita reduzir silenciosamente as reconexões a um escopo implícito
  mais estreito apenas de administrador.
- Montagem de autenticação de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito e, em seguida, um token por dispositivo armazenado
    (chaveado por `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na nova tentativa única
    `AUTH_TOKEN_MISMATCH` é limitada a **endpoints confiáveis somente** —
    loopback ou `wss://` com um `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-as somente quando a conexão usar autenticação de bootstrap em um transporte confiável,
  como `wss://` ou pareamento por loopback/local.
- Se um cliente fornece um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer o escopo `operator.pairing`).
- `device.token.rotate` retorna metadados de rotação. Ele ecoa o token portador de substituição
  somente para chamadas do mesmo dispositivo que já estão autenticadas com esse token de dispositivo,
  para que clientes que usam apenas token possam persistir a substituição antes de reconectar.
  Rotações compartilhadas/de administrador não ecoam o token portador.
- A emissão, rotação e revogação de tokens permanecem limitadas ao conjunto de funções aprovado
  registrado na entrada de pareamento desse dispositivo; a mutação de token não pode expandir nem
  direcionar uma função de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivo é autoescopado, a menos que
  o chamador também tenha `operator.admin`: chamadores não administradores podem remover/revogar/rotacionar
  apenas sua **própria** entrada de dispositivo.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos do token de operador
  de destino em relação aos escopos da sessão atual do chamador. Chamadores não administradores
  não podem rotacionar ou revogar um token de operador mais amplo do que o que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops de reconexão automática e apresentar orientação de ação ao operador.

## Identidade de dispositivo + pareamento

- Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + função.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática
  local esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas por local loopback.
- OpenClaw também tem um caminho restrito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões de tailnet ou LAN no mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem a identidade `device` durante `connect` (operador +
  node). As únicas exceções de operador sem dispositivo são caminhos de confiança explícitos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade HTTP insegura somente em localhost.
  - autenticação bem-sucedida da Control UI de operador com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (recurso de emergência, rebaixamento grave de segurança).
  - RPCs de backend `gateway-client` por loopback direto autenticados com o token/senha
    compartilhado do Gateway.
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
- Assinaturas legadas `v2` continuam aceitas para compatibilidade, mas a fixação de
  metadados de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Os clientes podem, opcionalmente, fixar a impressão digital do certificado do gateway (consulte a configuração
  `gateway.tls` mais `gateway.remote.tlsFingerprint` ou CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: negociação inicial, quadros, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-05-10T19:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de Node** para
OpenClaw. Todos os clientes (CLI, interface web, app macOS, Nodes iOS/Android,
Nodes headless) se conectam por WebSocket e declaram sua **função** + **escopo** no
momento da negociação inicial.

## Transporte

- WebSocket, quadros de texto com payloads JSON.
- O primeiro quadro **deve** ser uma solicitação `connect`.
- Quadros pré-conexão são limitados a 64 KiB. Após uma negociação inicial bem-sucedida, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos habilitados,
  quadros de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o Gateway feche ou descarte o quadro afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  conteúdos de anexos, corpo bruto do quadro, tokens, cookies ou valores secretos.

## Negociação inicial (connect)

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
retornar um erro `UNAVAILABLE` repetível com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem tentar essa resposta novamente
dentro do orçamento geral de conexão, em vez de apresentá-la como uma falha terminal
de negociação inicial.

`server`, `features`, `snapshot` e `policy` são todos exigidos pelo esquema
(`src/gateway/protocol/schema/frames.ts`). `auth` também é exigido e informa
a função/escopos negociados. `pluginSurfaceUrls` é opcional e mapeia nomes de superfície de Plugin,
como `canvas`, para URLs hospedadas com escopo.

URLs de superfície de Plugin com escopo podem expirar. Nodes podem chamar
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para receber uma entrada nova
em `pluginSurfaceUrls`. A refatoração experimental do Plugin Canvas não
oferece suporte ao caminho de compatibilidade obsoleto `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh`; clientes nativos e Gateways atuais devem usar superfícies de Plugin.

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
`client.mode: "backend"`) podem omitir `device` em conexões diretas de loopback quando
autenticam com o token/senha compartilhado do Gateway. Esse caminho é reservado
para RPCs internos do plano de controle e impede que linhas de base obsoletas de pareamento CLI/dispositivo
bloqueiem trabalho local de backend, como atualizações de sessão de subagente. Clientes remotos,
clientes de origem de navegador, clientes Node e clientes explícitos de token de dispositivo/identidade de dispositivo
ainda usam as verificações normais de pareamento e elevação de escopo.

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

Para o fluxo integrado de bootstrap Node/operador, o token Node primário permanece
`scopes: []` e qualquer token de operador transferido permanece limitado à lista de permissões
do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Verificações de escopo de bootstrap continuam
prefixadas por função: entradas de operador só satisfazem solicitações de operador, e funções
não operadoras ainda precisam de escopos sob seu próprio prefixo de função.

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

## Funções + escopos

Para o modelo completo de escopo de operador, verificações em tempo de aprovação e semântica
de segredo compartilhado, veja [Escopos de operador](/pt-BR/gateway/operator-scopes).

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

Métodos RPC do Gateway registrados por Plugin podem solicitar seu próprio escopo de operador, mas
prefixos reservados de administração do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos de barra acessados por
`chat.send` aplicam verificações mais rígidas em nível de comando além dela. Por exemplo, gravações persistentes
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo em tempo de aprovação além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos Node não exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Capacidades/comandos/permissões (Node)

Nodes declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: alternadores granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata essas declarações como **reivindicações** e aplica listas de permissões do lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operador** quanto como **Node**.
- `node.list` inclui os campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nodes conectados informam
  seu tempo de conexão atual como `lastSeenAtMs` com motivo `connect`; Nodes pareados também podem informar
  presença durável em segundo plano quando um evento confiável de Node atualiza seus metadados de pareamento.

### Evento de Node vivo em segundo plano

Nodes podem chamar `node.event` com `event: "node.presence.alive"` para registrar que um Node pareado estava
vivo durante um despertar em segundo plano sem marcá-lo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é um enum fechado: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Strings de gatilho desconhecidas são normalizadas para
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

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; os clientes devem tratar isso como uma
RPC reconhecida, não como persistência durável de presença.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são controlados por escopo, para que sessões com escopo de pareamento ou somente Node não recebam passivamente conteúdo de sessão.

- **Quadros de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos em streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses quadros completamente.
- **Broadcasts `plugin.*` definidos por Plugin** são controlados por `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem irrestritos para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por escopo por padrão (falha fechada), a menos que um manipulador registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente, então broadcasts preservam ordenação monotônica nesse socket mesmo quando clientes diferentes veem subconjuntos filtrados por escopo distintos do fluxo de eventos.

## Famílias comuns de métodos RPC

A superfície WS pública é mais ampla do que os exemplos de negociação inicial/autenticação acima. Esta
não é uma listagem gerada — `hello-ok.features.methods` é uma lista conservadora
de descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exportações de métodos
de Plugin/canal carregadas. Trate-a como descoberta de recursos, não como uma enumeração completa
de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway em cache ou sondado recentemente.
    - `diagnostics.stability` retorna o gravador recente e limitado de estabilidade diagnóstica. Ele mantém metadados operacionais, como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e ids de sessão. Ele não mantém texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies ou valores secretos. Escopo de leitura de operador é exigido.
    - `status` retorna o resumo do Gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operadores com escopo de admin.
    - `gateway.identity.get` retorna a identidade de dispositivo do Gateway usada por fluxos de retransmissão e pareamento.
    - `system-presence` retorna o snapshot atual de presença para dispositivos operador/Node conectados.
    - `system-event` acrescenta um evento de sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no Gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em tempo de execução. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso dos provedores/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de custo de uso para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão da memória vetorial / incorporação em cache para o workspace do agente padrão ativo. Passe `{ "probe": true }` ou `{ "deep": true }` somente quando o chamador quiser explicitamente um ping ao vivo para o provedor de incorporações.
    - `doctor.memory.remHarness` retorna uma prévia delimitada e somente leitura do harness REM para clientes remotos do plano de controle. Ela pode incluir caminhos de workspace, trechos de memória, markdown embasado renderizado e candidatos de promoção profunda, então os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna o uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
    - `channels.logout` desconecta um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um nó iOS registrado.
    - `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
    - `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o trecho final configurado do log de arquivo do Gateway com cursor/limite e controles de bytes máximos.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores Talk para fala, transcrição por streaming e voz em tempo real. Ele inclui ids de provedores, rótulos, estado configurado, ids de modelos/vozes expostos, modos canônicos, transportes, estratégias de cérebro e flags de áudio/capacidade em tempo real sem retornar segredos dos provedores nem alterar a configuração global.
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão Talk de propriedade do Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. `brain: "direct-tools"` exige `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite eventos `session.ready` ou `session.replaced` conforme necessário e retorna metadados de sala/sessão mais eventos Talk recentes sem o token em texto claro nem o hash de token armazenado.
    - `talk.session.appendAudio` acrescenta áudio de entrada PCM em base64 a sessões de relay em tempo real e de transcrição de propriedade do Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` controlam o ciclo de vida de turnos de sala gerenciada com rejeição de turnos obsoletos antes de o estado ser limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção controlada por VAD em sessões de relay do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta de provedor emitida por uma sessão de relay em tempo real de propriedade do Gateway. Passe `options: { willContinue: true }` para saída intermediária da ferramenta quando um resultado final virá em seguida, ou `options: { suppressResponse: true }` quando o resultado da ferramenta deve satisfazer a chamada do provedor sem iniciar outra resposta do assistente em tempo real.
    - `talk.session.close` fecha uma sessão de relay, transcrição ou sala gerenciada de propriedade do Gateway e emite eventos Talk terminais.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real de propriedade do cliente usando `webrtc` ou `provider-websocket`, enquanto o Gateway possui configuração, credenciais, instruções e política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real de propriedade do cliente encaminhem chamadas de ferramentas do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; os clientes recebem um id de execução e aguardam eventos normais do ciclo de vida do chat antes de enviar o resultado de ferramenta específico do provedor.
    - `talk.event` é o único canal de eventos Talk para adaptadores em tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reunião.
    - `talk.speak` sintetiza fala por meio do provedor de fala Talk ativo.
    - `tts.status` retorna o estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências do TTS.
    - `tts.setProvider` atualiza o provedor TTS preferencial.
    - `tts.convert` executa uma conversão única de texto em fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em tempo de execução somente em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos direcionadas a comandos para um conjunto específico de comandos/alvos.
    - `config.get` retorna o snapshot e hash da configuração atual.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload do esquema de configuração ao vivo usado pela Control UI e pelo ferramental da CLI: esquema, `uiHints`, versão e metadados de geração, incluindo metadados de esquema de Plugin + canal quando o runtime consegue carregá-los. O esquema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e texto de ajuda usados pela UI, incluindo objeto aninhado, curinga, item de array e ramificações de composição `anyOf` / `oneOf` / `allOf` quando há documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de esquema superficial, dica correspondente + `hintPath` e resumos de filhos imediatos para detalhamento na UI/CLI. Os nós de esquema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização somente quando a própria atualização tiver sucesso; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno de agente de acompanhamento pela fila de continuação de reinicialização. Atualizações do gerenciador de pacotes forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote, para que o processo antigo do Gateway não continue carregando sob demanda a partir de uma árvore `dist` substituída.
    - `update.status` retorna o sentinel de reinicialização de atualização em cache mais recente, incluindo a versão em execução após a reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por RPC WS.

  </Accordion>

  <Accordion title="Auxiliares de agente e workspace">
    - `agents.list` retorna entradas de agentes configurados, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a fiação do workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de workspace de bootstrap expostos para um agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o ledger de tarefas do Gateway para clientes SDK e operadores.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos de artefatos derivados de transcrições e downloads para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no lado do servidor e retornam apenas mídia de transcrição com proveniência correspondente; fontes de URL inseguras ou locais retornam downloads sem suporte em vez de serem buscadas no lado do servidor.
    - `environments.list` e `environments.status` expõem descoberta somente leitura de ambientes locais do Gateway e de nós para clientes SDK.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice atual de sessões, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias delimitadas de transcrições para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e direcionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo para uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway consiga resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições de sessão e relata o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretivas inline são removidas do texto visível, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta) e tokens vazados de controle de modelo ASCII/largura completa são removidos, linhas de assistente com tokens silenciosos puros como `NO_REPLY` / `no_reply` exatos são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de papel aprovado e escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de papel aprovado e escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento de Node, invocação e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem pareamento de Node e verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de Node conhecido/conectado.
    - `node.rename` atualiza o rótulo de um Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado para uma solicitação de invocação.
    - `node.event` transporta eventos originados no Node de volta para o Gateway.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações únicas de aprovação de execução, além da consulta/reprodução de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de execução pendente e retorna a decisão final (ou `null` em caso de tempo limite).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de execução do gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de execução local do node por meio de comandos de relay do node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por plugin.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata de texto de ativação ou no próximo heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  somente de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão inscrita.
- `sessions.changed`: índice da sessão ou metadados alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização de snapshot de integridade do gateway.
- `heartbeat`: atualização do fluxo de eventos de heartbeat.
- `cron`: evento de alteração de execução/job do cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento do node.
- `node.invoke.request`: broadcast de solicitação de invocação do node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de gatilho de palavra de ativação alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação de
  execução.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação de
  plugin.

### Métodos auxiliares do node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de skill
  para verificações de permissão automática.

### RPCs de registro de tarefas

Clientes operadores podem inspecionar e cancelar registros de tarefas em segundo plano do Gateway por meio
dos RPCs de registro de tarefas. Esses métodos retornam resumos sanitizados de tarefas, não o estado bruto
do runtime.

- `tasks.list` exige `operator.read`.
  - Params: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou um array desses status,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` e string `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` exige `operator.read`.
  - Params: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - IDs de tarefa ausentes retornam o formato de erro de não encontrado do Gateway.
- `tasks.cancel` exige `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Resultado:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o registro tinha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais como `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progresso,
resumo terminal e texto de erro sanitizado.

### Métodos auxiliares de operador

- Operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos do runtime
  para um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário tem como alvo:
    - `text` retorna o token de comando de texto primário sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes de provedor
      quando disponíveis
  - `textAliases` carrega aliases de barra exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo ciente de provedor quando existir.
  - `provider` é opcional e afeta apenas a nomenclatura nativa, além da disponibilidade
    de comandos nativos de plugin.
  - `includeArgs=false` omite metadados de argumentos serializados da resposta.
- Operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas do runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas efetivo no runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime da sessão no lado do servidor em vez de aceitar
    autenticação ou contexto de entrega fornecidos pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas de core, plugin e canal.
- Operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível por meio do
  mesmo caminho de política do gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente resolvido da sessão deve corresponder a
    `agentId`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output` opcional e campos
    `error` tipados. Recusas de aprovação ou política retornam `ok:false` no payload em vez de
    contornar o pipeline de política de ferramentas do gateway.
- Operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível de
  skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de config e
    opções de instalação sanitizadas sem expor valores brutos de segredo.
- Operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operadores podem chamar `skills.upload.begin`, `skills.upload.chunk` e
  `skills.upload.commit` (`operator.admin`) para preparar um arquivo de skill privado
  antes de instalá-lo. Este é um caminho separado de upload de admin para clientes confiáveis,
  não o fluxo normal de instalação de skill do ClawHub, e fica desabilitado por padrão, a menos que
  `skills.install.allowUploadedArchives` esteja habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    cria um upload vinculado a esse slug e valor de força.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` acrescenta bytes no
    deslocamento decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e o
    SHA-256. O commit apenas finaliza o upload; ele não instala a skill.
  - Arquivos de skills enviados são arquivos zip contendo uma raiz `SKILL.md`. O
    nome do diretório interno do arquivo nunca seleciona o alvo da instalação.
- Operadores podem chamar `skills.install` (`operator.admin`) em três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace padrão do agente.
  - Modo upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala um upload confirmado no diretório `skills/<slug>`
    do workspace padrão do agente. O slug e o valor de força devem corresponder à solicitação original
    `skills.upload.begin`. Este modo é rejeitado, a menos que
    `skills.install.allowUploadedArchives` esteja habilitado. A configuração não
    afeta instalações do ClawHub.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace padrão do agente.
  - O modo config corrige valores `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro opcional `view`:

- Omitido ou `"default"`: comportamento atual do runtime. Se `agents.defaults.models` estiver configurado, a resposta será o catálogo permitido, incluindo modelos descobertos dinamicamente para entradas `provider/*`. Caso contrário, a resposta será o catálogo completo do Gateway.
- `"configured"`: comportamento dimensionado para seletores. Se `agents.defaults.models` estiver configurado, ele ainda prevalece, incluindo descoberta com escopo de provedor para entradas `provider/*`. Sem uma allowlist, a resposta usa entradas explícitas `models.providers.*.models`, recorrendo ao catálogo completo apenas quando não existem linhas de modelo configuradas.
- `"all"`: catálogo completo do Gateway, ignorando `agents.defaults.models`. Use isso para diagnósticos e UIs de descoberta, não seletores normais de modelo.

## Aprovações de execução

- Quando uma solicitação de execução precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o
  gateway rejeitará a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: alvos de entrega não resolvidos ou somente internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota entregável externa pode ser resolvida (por exemplo, sessões internas/webchat ou configs multicanal ambíguas).
- Resultados finais de `agent` podem incluir `result.deliveryStatus` quando a entrega foi
  solicitada, usando os mesmos status `sent`, `suppressed`, `partial_failed` e `failed`
  documentados para [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis em todo o protocolo v4 e são a baseline esperada para clientes de terceiros.

| Constante                                 | Padrão                                               | Fonte                                                                                      |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                  | `src/gateway/protocol/version.ts`                                                          |
| Tempo limite de requisição (por RPC)      | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tempo limite de pré-autenticação / desafio de conexão | `15_000` ms                              | `src/gateway/handshake-timeouts.ts` (config/env podem aumentar o orçamento pareado servidor/cliente) |
| Recuo inicial de reconexão                | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Recuo máximo de reconexão                 | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nova tentativa rápida após fechamento por token de dispositivo | `250` ms               | `src/gateway/client.ts`                                                                    |
| Carência de parada forçada antes de `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo padrão de pulso (pré-`hello-ok`) | `30_000` ms                                         | `src/gateway/client.ts`                                                                    |
| Fechamento por tempo limite de pulso      | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões pré-handshake.

## Autenticação

- A autenticação do Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos que carregam identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` sem loopback, satisfazem a verificação de autenticação
  de conexão a partir dos cabeçalhos da requisição em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` para ingresso privado ignora completamente a autenticação
  de conexão por segredo compartilhado; não exponha esse modo em ingresso público/não confiável.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo limitado à função
  + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto
  de escopos aprovados armazenado para esse token. Isso preserva o acesso de leitura/sondagem/status
  que já foi concedido e evita restringir silenciosamente reconexões a um escopo
  implícito mais estreito, somente de administrador.
- Montagem de autenticação de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito, depois um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhum dos itens acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na nova tentativa única de
    `AUTH_TOKEN_MISMATCH` é limitada a **endpoints confiáveis apenas** —
    loopback, ou `wss://` com um `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- Entradas adicionais de `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-os somente quando a conexão usar autenticação de bootstrap em um transporte confiável,
  como `wss://` ou pareamento por loopback/local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador continua sendo autoritativo; escopos em cache são
  reutilizados somente quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige o escopo `operator.pairing`).
- `device.token.rotate` retorna metadados de rotação. Ele ecoa o token portador substituto
  somente para chamadas do mesmo dispositivo que já estejam autenticadas com
  esse token de dispositivo, para que clientes somente com token possam persistir a substituição antes
  de reconectar. Rotações compartilhadas/de administrador não ecoam o token portador.
- Emissão, rotação e revogação de tokens permanecem limitadas ao conjunto de funções aprovado
  registrado na entrada de pareamento desse dispositivo; a mutação de token não pode expandir nem
  direcionar uma função de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos é autoescopado, a menos que
  o chamador também tenha `operator.admin`: chamadores não administradores podem remover/revogar/rotacionar
  apenas a entrada do seu **próprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos do token
  de operador de destino contra os escopos da sessão atual do chamador. Chamadores não administradores
  não podem rotacionar nem revogar um token de operador mais amplo do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token em cache por dispositivo.
  - Se essa nova tentativa falhar, os clientes devem parar os ciclos de reconexão automática e apresentar orientação de ação ao operador.

## Identidade do dispositivo + pareamento

- Nós devem incluir uma identidade estável de dispositivo (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + função.
- Aprovações de pareamento são obrigatórias para novos IDs de dispositivo, a menos que a aprovação automática
  local esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas de local loopback.
- OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões de mesma máquina por tailnet ou LAN ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem identidade `device` durante `connect` (operador +
  nó). As únicas exceções de operador sem dispositivo são caminhos explícitos de confiança:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade HTTP insegura somente em localhost.
  - autenticação bem-sucedida de operador na interface de controle com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (quebra-vidro, rebaixamento severo de segurança).
  - RPCs de backend `gateway-client` por loopback direto autenticadas com o token/senha
    compartilhado do Gateway.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura pré-desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Cliente assinou com um nonce obsoleto/incorreto.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | A carga útil da assinatura não corresponde à carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O carimbo de data/hora assinado está fora da variação permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalização da chave pública falhou.   |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine a carga útil v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- A carga útil de assinatura preferida é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/função/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas a fixação
  de metadados de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Clientes podem, opcionalmente, fixar a impressão digital do certificado do Gateway (veja a configuração
  `gateway.tls` mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do Gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

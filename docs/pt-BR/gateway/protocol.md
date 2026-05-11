---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket do Gateway: negociação inicial, quadros, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-05-11T20:29:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o **plano de controle único + transporte de nós** para
OpenClaw. Todos os clientes (CLI, interface web, app macOS, nós iOS/Android, nós
headless) conectam-se por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, quadros de texto com cargas JSON.
- O primeiro quadro **deve** ser uma requisição `connect`.
- Quadros antes da conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos ativados,
  quadros de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large`
  antes que o gateway feche ou descarte o quadro afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo da mensagem,
  conteúdos de anexos, corpo bruto do quadro, tokens, cookies ou valores secretos.

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

Enquanto o Gateway ainda está finalizando sidecars de inicialização, a requisição `connect` pode
retornar um erro `UNAVAILABLE` retentável com `details.reason` definido como
`"startup-sidecars"` e `retryAfterMs`. Os clientes devem tentar novamente essa resposta
dentro do orçamento geral de conexão em vez de exibi-la como uma falha terminal de
handshake.

`server`, `features`, `snapshot` e `policy` são todos exigidos pelo schema
(`src/gateway/protocol/schema/frames.ts`). `auth` também é obrigatório e relata
o papel/escopos negociados. `pluginSurfaceUrls` é opcional e mapeia nomes de
superfícies de plugin, como `canvas`, para URLs hospedadas com escopo.

URLs de superfície de plugin com escopo podem expirar. Nós podem chamar
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para receber uma nova
entrada em `pluginSurfaceUrls`. A refatoração experimental do Plugin Canvas não
oferece suporte ao caminho de compatibilidade obsoleto `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh`; clientes nativos e gateways atuais devem usar superfícies de plugin.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` relata as permissões
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
`client.mode: "backend"`) podem omitir `device` em conexões de loopback direto quando
se autenticam com o token/senha compartilhado do gateway. Esse caminho é reservado
para RPCs internos do plano de controle e impede que baselines obsoletas de pareamento CLI/dispositivo
bloqueiem trabalho local de backend, como atualizações de sessão de subagentes. Clientes remotos,
clientes de origem de navegador, clientes de nó e clientes explícitos de token de dispositivo/identidade de dispositivo
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

Durante o repasse de bootstrap confiável, `hello-ok.auth` também pode incluir entradas adicionais
de papel delimitado em `deviceTokens`:

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

Para o fluxo integrado de bootstrap de nó/operador, o token primário de nó permanece
`scopes: []` e qualquer token de operador repassado permanece delimitado à allowlist
de operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Verificações de escopo de bootstrap permanecem
prefixadas por papel: entradas de operador satisfazem apenas solicitações de operador, e papéis
não operadores ainda precisam de escopos sob seu próprio prefixo de papel.

### Exemplo de nó

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

- **Requisição**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja o schema).

## Papéis + escopos

Para o modelo completo de escopo de operador, verificações no momento da aprovação e semântica
de segredo compartilhado, veja [Escopos de operador](/pt-BR/gateway/operator-scopes).

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

Métodos RPC de gateway registrados por plugin podem solicitar seu próprio escopo de operador, mas
prefixos administrativos principais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas o primeiro bloqueio. Alguns comandos slash acessados por meio de
`chat.send` aplicam verificações mais estritas no nível do comando além disso. Por exemplo, gravações persistentes
de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do
escopo base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos de nó que não são exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/comandos/permissões (nó)

Nós declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist de comandos para invocação.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas por identidade de dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node**.
- `node.list` inclui campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nós conectados relatam
  o horário da conexão atual como `lastSeenAtMs` com motivo `connect`; nós pareados também podem relatar
  presença durável em segundo plano quando um evento de nó confiável atualiza seus metadados de pareamento.

### Evento de nó ativo em segundo plano

Nós podem chamar `node.event` com `event: "node.presence.alive"` para registrar que um nó pareado estava
ativo durante um despertar em segundo plano sem marcá-lo como conectado.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é uma enumeração fechada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Strings de gatilho desconhecidas são normalizadas para
`background` pelo gateway antes da persistência. O evento só é durável para sessões de dispositivo de nó
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

Gateways mais antigos ainda podem retornar `{ "ok": true }` para `node.event`; clientes devem tratar isso como uma
RPC confirmada, não como persistência durável de presença.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são controlados por escopo para que sessões com escopo de pareamento ou somente de nó não recebam passivamente conteúdo de sessão.

- **Quadros de chat, agente e resultado de ferramenta** (incluindo eventos `agent` em streaming e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram esses quadros completamente.
- **Broadcasts `plugin.*` definidos por plugin** são bloqueados para `operator.write` ou `operator.admin`, dependendo de como o plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem sem restrição para que a integridade do transporte permaneça observável para toda sessão autenticada.
- **Famílias de eventos de broadcast desconhecidas** são bloqueadas por escopo por padrão (falha fechada), a menos que um handler registrado as relaxe explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem ordenação monotônica nesse socket mesmo quando clientes diferentes veem subconjuntos filtrados por escopo diferentes do fluxo de eventos.

## Famílias comuns de métodos RPC

A superfície WS pública é mais ampla que os exemplos de handshake/auth acima. Esta
não é uma listagem gerada — `hello-ok.features.methods` é uma lista conservadora
de descoberta criada a partir de `src/gateway/server-methods-list.ts` mais exportações de métodos de
plugin/canal carregadas. Trate-a como descoberta de recursos, não como uma
enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o registrador recente e delimitado de estabilidade diagnóstica. Ele mantém metadados operacionais, como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/plugin e ids de sessão. Ele não mantém texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de requisição ou resposta, tokens, cookies ou valores secretos. Escopo de leitura de operador é exigido.
    - `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade de dispositivo do gateway usada por fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operador/nó conectados.
    - `system-event` anexa um evento de sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no gateway.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em runtime. Passe `{ "view": "configured" }` para modelos configurados em tamanho de seletor (`agents.defaults.models` primeiro, depois `models.providers.*.models`), ou `{ "view": "all" }` para o catálogo completo.
    - `usage.status` retorna janelas de uso do provedor/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de custo de uso para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão da memória vetorial / embeddings em cache para o workspace ativo do agente padrão. Passe `{ "probe": true }` ou `{ "deep": true }` somente quando o chamador quiser explicitamente um ping ao vivo do provedor de embeddings.
    - `doctor.memory.remHarness` retorna uma prévia limitada e somente leitura do harness REM para clientes remotos do plano de controle. Ele pode incluir caminhos de workspace, trechos de memória, markdown fundamentado renderizado e candidatos a promoção profunda, então os chamadores precisam de `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna uso em série temporal para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
    - `channels.logout` faz logout de um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o canal em caso de sucesso.
    - `push.test` envia uma notificação push APNs de teste para um nó iOS registrado.
    - `voicewake.get` retorna os acionadores de palavra de ativação armazenados.
    - `voicewake.set` atualiza os acionadores de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o trecho final configurado do log de arquivo do Gateway com controles de cursor/limite e máximo de bytes.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores Talk para fala, transcrição em streaming e voz em tempo real. Ele inclui ids de provedores, rótulos, estado configurado, ids de modelos/vozes expostos, modos canônicos, transportes, estratégias de cérebro e flags de áudio/capacidade em tempo real sem retornar segredos do provedor nem alterar a configuração global.
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão Talk de propriedade do Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. `brain: "direct-tools"` exige `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite eventos `session.ready` ou `session.replaced` conforme necessário e retorna metadados de sala/sessão mais eventos recentes do Talk sem o token em texto claro nem o hash de token armazenado.
    - `talk.session.appendAudio` anexa áudio de entrada PCM em base64 a sessões de relay em tempo real e transcrição de propriedade do Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` controlam o ciclo de vida de turnos de sala gerenciada com rejeição de turno obsoleto antes que o estado seja limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção controlada por VAD em sessões de relay do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta do provedor emitida por uma sessão de relay em tempo real de propriedade do Gateway. Passe `options: { willContinue: true }` para saída provisória de ferramenta quando um resultado final vier depois, ou `options: { suppressResponse: true }` quando o resultado da ferramenta deve satisfazer a chamada do provedor sem iniciar outra resposta de assistente em tempo real.
    - `talk.session.close` fecha uma sessão de relay, transcrição ou sala gerenciada de propriedade do Gateway e emite eventos Talk terminais.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real de propriedade do cliente usando `webrtc` ou `provider-websocket`, enquanto o Gateway é proprietário da configuração, credenciais, instruções e política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real de propriedade do cliente encaminhem chamadas de ferramentas do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; clientes recebem um id de execução e aguardam eventos normais do ciclo de vida do chat antes de enviar o resultado de ferramenta específico do provedor.
    - `talk.event` é o canal único de eventos Talk para adaptadores em tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reuniões.
    - `talk.speak` sintetiza fala por meio do provedor de fala Talk ativo.
    - `tts.status` retorna estado habilitado do TTS, provedor ativo, provedores de fallback e estado de configuração do provedor.
    - `tts.providers` retorna o inventário visível de provedores TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências do TTS.
    - `tts.setProvider` atualiza o provedor TTS preferido.
    - `tts.convert` executa conversão avulsa de texto em fala.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em runtime somente em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos direcionadas a comando para um conjunto específico de comandos/alvos.
    - `config.get` retorna o snapshot e hash da configuração atual.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload do esquema de configuração ativo usado pela Control UI e ferramentas CLI: esquema, `uiHints`, versão e metadados de geração, incluindo metadados de esquema de Plugin + canal quando o runtime consegue carregá-los. O esquema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e texto de ajuda usados pela UI, incluindo ramificações de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de esquema raso, dica correspondente + `hintPath` e resumos de filhos imediatos para detalhamento na UI/CLI. Nós de esquema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização somente quando a atualização em si tiver sido bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno subsequente do agente pela fila de continuação de reinicialização. Atualizações do gerenciador de pacotes forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote para que o processo antigo do Gateway não continue carregando sob demanda de uma árvore `dist` substituída.
    - `update.status` retorna o sentinela de reinicialização de atualização mais recente em cache, incluindo a versão em execução após a reinicialização quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por WS RPC.

  </Accordion>

  <Accordion title="Auxiliares de agente e workspace">
    - `agents.list` retorna entradas de agentes configurados, incluindo modelo efetivo e metadados de runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e ligação de workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de workspace de bootstrap expostos para um agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o ledger de tarefas do Gateway para clientes SDK e operadores.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos de artefatos derivados de transcritos e downloads para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem a sessão proprietária no lado do servidor e retornam apenas mídias de transcrito com proveniência correspondente; fontes de URL inseguras ou locais retornam downloads não compatíveis em vez de fazer busca no lado do servidor.
    - `environments.list` e `environments.status` expõem descoberta somente leitura de ambientes locais do Gateway e de nós para clientes SDK.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` aguarda uma execução terminar e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessões atual, incluindo metadados de `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrito/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcritos para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canoniza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interrupção e direcionamento para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo para uma sessão. Um chamador pode passar `key` mais `runId` opcional, ou passar apenas `runId` para execuções ativas que o Gateway consegue resolver para uma sessão.
    - `sessions.patch` atualiza metadados/sobrescritas de sessão e relata o modelo canônico resolvido mais o `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha de sessão armazenada completa.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamadas de ferramenta em texto puro (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos de chamadas de ferramenta truncados) e tokens de controle de modelo ASCII/largura total vazados são removidos, linhas de assistente compostas apenas por tokens silenciosos, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de função aprovada e escopo do chamador.

  </Accordion>

  <Accordion title="Pareamento de nós, invocação e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` cobrem pareamento de nós e verificação de bootstrap.
    - `node.list` e `node.describe` retornam estado de nós conhecidos/conectados.
    - `node.rename` atualiza o rótulo de um nó pareado.
    - `node.invoke` encaminha um comando para um nó conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `node.event` transporta eventos originados por nós de volta para o Gateway.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de nós conectados.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para nós offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem solicitações de aprovação de execução pontuais, além de consulta/reprodução de aprovações pendentes.
    - `exec.approval.waitDecision` aguarda uma aprovação de execução pendente e retorna a decisão final (ou `null` em caso de tempo limite).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de execução do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de execução local do Node por meio de comandos de retransmissão do Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por Plugin.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de ativação; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de
  chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: índice ou metadados da sessão alterados.
- `presence`: atualizações de snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização de snapshot de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/tarefa de Cron.
- `shutdown`: notificação de encerramento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de pareamento de Node.
- `node.invoke.request`: transmissão de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: configuração de disparo por palavra de ativação alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação
  de execução.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprovação
  de Plugin.

### Métodos auxiliares de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de permissão automática.

### RPCs do livro-razão de tarefas

Clientes operadores podem inspecionar e cancelar registros de tarefas em segundo plano do Gateway por meio
dos RPCs do livro-razão de tarefas. Esses métodos retornam resumos de tarefas sanitizados, não o estado bruto
de runtime.

- `tasks.list` requer `operator.read`.
  - Parâmetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou uma matriz desses status,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` e string `cursor` opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requer `operator.read`.
  - Parâmetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - IDs de tarefa ausentes retornam o formato de erro de não encontrado do Gateway.
- `tasks.cancel` requer `operator.write`.
  - Parâmetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o livro-razão tinha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais, como `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, progresso,
resumo terminal e texto de erro sanitizado.

### Métodos auxiliares de operador

- Operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos
  de runtime de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície o `name` primário mira:
    - `text` retorna o token de comando de texto primário sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos cientes do provedor
      quando disponíveis
  - `textAliases` carrega aliases de barra exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo ciente do provedor quando existe.
  - `provider` é opcional e afeta apenas a nomeação nativa, além da disponibilidade de comandos
    nativos de Plugin.
  - `includeArgs=false` omite metadados de argumentos serializados da resposta.
- Operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas de runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do Plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de Plugin é opcional
- Operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário de ferramentas efetivo em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto de runtime confiável da sessão no lado do servidor, em vez de aceitar
    autenticação ou contexto de entrega fornecidos pelo chamador.
  - A resposta é escopada à sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas de core, Plugin e canal.
- Operadores podem chamar `tools.invoke` (`operator.write`) para invocar uma ferramenta disponível por meio do
  mesmo caminho de política do Gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente resolvido da sessão deve corresponder a
    `agentId`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output` opcional e campos
    `error` tipados. Recusas por aprovação ou política retornam `ok:false` no payload, em vez de
    contornar o pipeline de política de ferramentas do Gateway.
- Operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores secretos brutos.
- Operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operadores podem chamar `skills.upload.begin`, `skills.upload.chunk` e
  `skills.upload.commit` (`operator.admin`) para preparar um arquivo privado de Skill
  antes de instalá-lo. Este é um caminho separado de upload administrativo para clientes confiáveis,
  não o fluxo normal de instalação de Skills do ClawHub, e fica desabilitado por padrão, a menos que
  `skills.install.allowUploadedArchives` esteja habilitado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    cria um upload vinculado a esse slug e valor de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` anexa bytes no
    offset decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e
    o SHA-256. O commit apenas finaliza o upload; ele não instala a Skill.
  - Arquivos de Skill enviados são arquivos zip que contêm uma raiz `SKILL.md`. O
    nome do diretório interno do arquivo nunca seleciona o destino de instalação.
- Operadores podem chamar `skills.install` (`operator.admin`) em três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace padrão do agente.
  - Modo upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala um upload confirmado no diretório `skills/<slug>`
    do workspace padrão do agente. O slug e o valor de force devem corresponder à solicitação original
    `skills.upload.begin`. Este modo é rejeitado, a menos que
    `skills.install.allowUploadedArchives` esteja habilitado. A configuração não
    afeta instalações do ClawHub.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação `metadata.openclaw.install` declarada no host do Gateway.
- Operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace padrão do agente.
  - O modo de configuração aplica patches a valores `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro opcional `view`:

- Omitido ou `"default"`: comportamento atual de runtime. Se `agents.defaults.models` estiver configurado, a resposta será o catálogo permitido, incluindo modelos descobertos dinamicamente para entradas `provider/*`. Caso contrário, a resposta será o catálogo completo do Gateway.
- `"configured"`: comportamento em tamanho de seletor. Se `agents.defaults.models` estiver configurado, ele ainda prevalece, incluindo descoberta escopada por provedor para entradas `provider/*`. Sem uma allowlist, a resposta usa entradas explícitas `models.providers.*.models`, recorrendo ao catálogo completo somente quando não há linhas de modelo configuradas.
- `"all"`: catálogo completo do Gateway, contornando `agents.defaults.models`. Use isso para diagnósticos e UIs de descoberta, não para seletores normais de modelo.

## Aprovações de execução

- Quando uma solicitação de execução precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (requer o escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador mutar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o
  gateway rejeitará a execução em vez de confiar no payload mutado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou somente internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota entregável externa pode ser resolvida (por exemplo, sessões internas/webchat ou configurações multicanal ambíguas).
- Resultados finais de `agent` podem incluir `result.deliveryStatus` quando a entrega foi
  solicitada, usando os mesmos status `sent`, `suppressed`, `partial_failed` e `failed`
  documentados para [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita intervalos que
  não incluem seu protocolo atual. Clientes nativos usam um limite inferior v3 para que
  clientes v4 aditivos ainda possam alcançar gateways v3.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes de cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis no protocolo v4 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                                | Origem                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Tempo limite da solicitação (por RPC)     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Tempo limite de pré-autenticação / desafio de conexão | `15_000` ms                               | `src/gateway/handshake-timeouts.ts` (config/env pode aumentar o orçamento pareado servidor/cliente) |
| Backoff de reconexão inicial              | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff máximo de reconexão               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nova tentativa rápida após fechamento por token de dispositivo | `250` ms                  | `src/gateway/client.ts`                                                                    |
| Período de tolerância de parada forçada antes de `terminate()` | `250` ms                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                                                    |
| Fechamento por tempo limite de tick       | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões anteriores ao handshake.

## Autenticação

- A autenticação de Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` fora de loopback atendem à verificação de autenticação de conexão a partir dos
  cabeçalhos da solicitação em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` em ingresso privado ignora totalmente a autenticação de conexão por segredo compartilhado;
  não exponha esse modo em ingresso público/não confiável.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo limitado ao papel +
  escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto de escopos aprovado
  armazenado para esse token. Isso preserva acesso de leitura/sondagem/status
  que já foi concedido e evita reduzir silenciosamente as reconexões a um
  escopo implícito mais restrito, apenas de administrador.
- Montagem de autenticação de conexão no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito, depois um token por dispositivo armazenado (chaveado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções acima resolveu um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na nova tentativa única de
    `AUTH_TOKEN_MISMATCH` é restrita a **endpoints confiáveis** —
    loopback, ou `wss://` com um `tlsFingerprint` fixado. `wss://` público
    sem fixação não se qualifica.
- Entradas adicionais de `hello-ok.auth.deviceTokens` são tokens de repasse de bootstrap.
  Persista-as somente quando a conexão usar autenticação de bootstrap em um transporte confiável
  como `wss://` ou pareamento local/loopback.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só são
  reutilizados quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer escopo `operator.pairing`).
- `device.token.rotate` retorna metadados de rotação. Ele ecoa o token portador substituto
  somente para chamadas do mesmo dispositivo que já estão autenticadas com
  esse token de dispositivo, para que clientes apenas com token possam persistir o substituto antes de
  reconectar. Rotações compartilhadas/de administrador não ecoam o token portador.
- Emissão, rotação e revogação de tokens permanecem limitadas ao conjunto de papéis aprovado
  registrado na entrada de pareamento desse dispositivo; a mutação de token não pode expandir nem
  mirar um papel de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos é autoescopado, a menos que o
  chamador também tenha `operator.admin`: chamadores não administradores podem remover/revogar/rotacionar
  somente sua **própria** entrada de dispositivo.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos do token de operador
  de destino contra os escopos da sessão atual do chamador. Chamadores não administradores
  não podem rotacionar nem revogar um token de operador mais amplo do que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem parar loops de reconexão automática e apresentar orientação de ação ao operador.
- `AUTH_SCOPE_MISMATCH` significa que o token de dispositivo foi reconhecido, mas não cobre
  o papel/escopos solicitados. Os clientes não devem apresentar isso como um token inválido;
  solicite que o operador faça novo pareamento ou aprove o contrato de escopo mais restrito/mais amplo.

## Identidade do dispositivo + pareamento

- Nós devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas de local loopback.
- OpenClaw também tem um caminho restrito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões de tailnet ou LAN no mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem identidade `device` durante `connect` (operador +
  nó). As únicas exceções de operador sem dispositivo são caminhos de confiança explícitos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade HTTP insegura apenas em localhost.
  - autenticação de operador bem-sucedida da UI de controle com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (recurso de emergência, rebaixamento severo de segurança).
  - RPCs de backend `gateway-client` por loopback direto autenticados com o token/senha
    compartilhado do Gateway.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Cliente assinou com um nonce obsoleto/incorreto.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload de assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp assinado está fora da distorção permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalização da chave pública falhou.   |

Destino de migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferencial é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas a fixação de metadados
  de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + fixação

- TLS é compatível com conexões WS.
- Clientes podem opcionalmente fixar a impressão digital do certificado do Gateway (veja a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do Gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

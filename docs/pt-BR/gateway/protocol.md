---
read_when:
    - Implementação ou atualização de clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando o esquema e os modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-07-12T15:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o único plano de controle e transporte de nodes do
OpenClaw. Clientes operadores e nodes (CLI, interface web, aplicativo para macOS, nodes iOS/Android,
nodes headless) conectam-se por WebSocket e declaram uma **função** e um **escopo** no
momento do handshake.

## Transporte e enquadramento

- WebSocket, quadros de texto, payloads JSON.
- O primeiro quadro **deve** ser uma solicitação `connect`.
- Quadros anteriores à conexão são limitados a 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Após o
  handshake, siga `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com os diagnósticos ativados, quadros
  de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large` antes que
  o Gateway feche ou descarte o quadro. Esses eventos contêm `surface`, tamanhos em
  bytes, limites e um código de motivo seguro, nunca corpos de mensagens, conteúdo de
  anexos, bytes brutos de quadros, tokens, cookies ou segredos.

Formatos dos quadros:

- Solicitação: `{type:"req", id, method, params}`
- Resposta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem chaves de idempotência (consulte o esquema).

## Handshake

O Gateway envia um desafio anterior à conexão:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

O cliente responde com `connect`:

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

O Gateway responde com `hello-ok`:

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

`server`, `features`, `snapshot`, `policy` e `auth` são todos obrigatórios em
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa a função e os escopos negociados mesmo quando nenhum token de dispositivo é emitido (formato
acima). `pluginSurfaceUrls` é opcional e mapeia nomes de superfícies de plugins (por exemplo,
`canvas`) para URLs hospedadas com escopo; ele pode expirar, portanto os nodes chamam
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para obter uma entrada nova.
O caminho obsoleto `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
não é compatível; use superfícies de plugins.

Enquanto o Gateway ainda estiver concluindo a inicialização dos processos auxiliares, `connect` poderá retornar um
erro `UNAVAILABLE` que permite nova tentativa, com `details.reason: "startup-sidecars"` e
`retryAfterMs`. Tente novamente dentro do limite de tempo da conexão, em vez de tratar isso como
uma falha terminal do handshake.

Quando um token de dispositivo é emitido, `hello-ok.auth` o adiciona:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

O bootstrap integrado por QR/código de configuração é um caminho de transferência para dispositivos móveis. Uma conexão
bem-sucedida com o código de configuração básico retorna um token de node primário e um token de
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

Essa transferência para o operador é limitada de propósito: o suficiente para iniciar o ciclo do
operador móvel e a configuração nativa, incluindo `operator.talk.secrets` para leituras da
configuração do Talk, mas sem escopos de alteração de pareamento e sem `operator.admin`. Um acesso
mais amplo a pareamento/administração exige um fluxo separado e aprovado de pareamento ou token. Persista
`hello-ok.auth.deviceTokens` somente quando a autenticação do bootstrap tiver sido executada por um
transporte confiável (`wss://` ou pareamento por loopback/local).

Clientes de backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas por loopback ao
se autenticarem com o token/senha compartilhado do Gateway. Esse caminho é reservado
para RPCs internos do plano de controle (por exemplo, atualizações de sessão de subagentes) e evita que
linhas de base obsoletas de pareamento de CLI/dispositivo bloqueiem o trabalho do backend local. Clientes
remotos, com origem no navegador, nodes e clientes explícitos de token de dispositivo/identidade de dispositivo ainda
passam pelas verificações normais de pareamento e elevação de escopo.

### Função de worker e protocolo fechado

Workers na nuvem usam uma entrada dedicada por loopback através do túnel SSH pertencente ao Gateway,
com chave do host fixada. Ela aceita somente a identidade do worker e nunca encaminha
autenticação geral, eventos de node, RPCs de operador ou métodos de plugins. Um `connect` rigoroso
verifica uma credencial de curta duração, armazenada como hash e vinculada ao ambiente, ao hash do
bundle, à época do proprietário, à versão do conjunto de RPCs, à expiração e a uma sessão anulável; ele
verifica separadamente a versão e o conjunto de recursos atuais. O sucesso retorna um
`worker-hello-ok` mínimo; a negociação de recursos é independente da versão geral do protocolo.
Os quadros permanecem abaixo de 64 KiB. A lista fechada de permissões contém
`worker.heartbeat`, `worker.transcript.commit` e `worker.live-event`.
Os commits de transcrição usam delimitação pela época do proprietário, uma vinculação de sessão pertencente ao Gateway, comparação e troca
da folha base e reprodução durável de sequência; o Gateway gera IDs de entrada e de pai da
transcrição por meio do gravador de sessão normal. A propriedade e a expiração são
verificadas novamente em cada RPC.

### Recursos do cliente

Clientes operadores podem anunciar recursos opcionais em `connect.params.caps`:

- `tool-events`: aceita eventos estruturados do ciclo de vida de ferramentas.
- `inline-widgets`: pode renderizar resultados hospedados de ferramentas em widgets embutidos.

Os recursos do cliente descrevem o cliente conectado, não a autorização. As ferramentas do agente podem declarar recursos obrigatórios; o Gateway omite essas ferramentas, a menos que todos os requisitos estejam presentes em `caps` do cliente de origem. Execuções originadas em canais não têm recursos de cliente do Gateway, portanto ferramentas condicionadas a recursos ficam indisponíveis mesmo quando a política de ferramentas as permite explicitamente.

### Exemplo de conexão de node

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

Os nodes declaram as alegações de recursos no momento da conexão:

- `caps`: categorias de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: controles granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata esses valores como alegações e aplica listas de permissões no lado do servidor.

## Funções e escopos

Para conferir o modelo completo de escopos do operador, as verificações no momento da aprovação e a semântica de
segredo compartilhado, consulte [Escopos do operador](/pt-BR/gateway/operator-scopes).

Funções:

- `operator`: cliente do plano de controle (CLI/interface/automação).
- `node`: host de recursos (câmera/tela/canvas/system.run).
- `worker`: host de execução na nuvem no protocolo dedicado e fechado de workers.

Escopos do operador (`src/gateway/operator-scopes.ts`), o conjunto fechado completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` exige `operator.talk.secrets` (ou
`operator.admin`). Quando os segredos estiverem incluídos, leia a credencial ativa do provedor do Talk
em `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
mantém o formato da origem e pode ser um objeto SecretRef ou uma string ocultada.

Métodos RPC do Gateway registrados por plugins podem solicitar seu próprio escopo de operador,
mas estes prefixos reservados do núcleo sempre são resolvidos como `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

O escopo do método é apenas a primeira barreira. Alguns comandos de barra acessados por
`chat.send` aplicam verificações mais rigorosas no nível do comando: gravações persistentes de `/config set` e
`/config unset` exigem `operator.admin`, mesmo para clientes do Gateway que
já tenham um escopo de operador inferior.

`node.pair.approve` tem uma verificação adicional de escopo no momento da aprovação, além do escopo
base do método (`operator.pairing`), com base nos `commands` declarados pela solicitação
pendente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                            | Escopos obrigatórios                   |
| -------------------------------------------------------------- | ------------------------------------- |
| nenhum                                                         | `operator.pairing`                    |
| comandos que não sejam de execução                             | `operator.pairing` + `operator.write` |
| inclui `system.run`, `system.run.prepare` ou `system.which`     | `operator.pairing` + `operator.admin` |

### Caps/comandos/permissões (node)

Os nodes declaram as alegações de recursos no momento da conexão:

- `caps`: categorias de recursos de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: controles granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata esses valores como **alegações** e aplica listas de permissões no lado do servidor.
Nodes conectados podem publicar descritores opcionais, visíveis para o agente, de ferramentas de plugins ou MCP
com `node.pluginTools.update` após uma conexão ou
reconexão bem-sucedida. Hosts de nodes headless são reiniciados para aplicar alterações declarativas no inventário
MCP. Esse método de atualização é o único caminho de publicação; descritores de ferramentas de plugins não são aceitos nos
parâmetros de `connect`. Cada descritor deve usar um `name` de ferramenta seguro para o provedor e nomear
um `command` presente na lista atual de permissões de comandos do node. O Gateway confia nos metadados do descritor
provenientes do node pareado, filtra descritores fora da superfície de comandos aprovada,
remove-os quando o node se desconecta e rejeita tentativas do operador
de alterar o catálogo de outro node. Defina `gateway.nodes.pluginTools.enabled: false`
para ignorar descritores publicados por nodes.

Hosts de nodes conectados publicam seu catálogo completo de substituição de skills com
`node.skills.update`. Esse método da função de node é o único caminho de publicação de skills
de nodes; skills não são aceitas nos parâmetros de `connect`. Cada descritor contém um
nome seguro, uma descrição e conteúdo limitado de `SKILL.md`. O Gateway analisa esse
conteúdo com o carregador normal de skills, inclui-o nos snapshots de skills do agente
enquanto o node está conectado e remove-o na desconexão. Defina
`gateway.nodes.skills.enabled: false` para ignorar skills publicadas por nodes.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo, incluindo
  `deviceId`, `roles` e `scopes`, para que as interfaces possam mostrar uma linha por dispositivo, mesmo
  quando ele se conecta tanto como operador quanto como node.
- `node.list` inclui os campos opcionais `lastSeenAtMs` e `lastSeenReason`. Nodes
  conectados informam o horário da conexão atual com o motivo `connect`; nodes pareados também podem
  informar presença durável em segundo plano por meio de um evento confiável de node.

Nodes nativos do macOS também podem enviar eventos `node.presence.activity` autenticados
com tempo de inatividade de entrada limitado. O Gateway deriva os carimbos de data/hora de atividade usando seu
próprio relógio, expõe o Mac conectado com atividade mais recente por meio de `node.list` e
`node.describe` e transmite atualizações de `node.presence` para clientes com escopo de leitura.
Consulte [Presença do computador ativo](/nodes/presence) para saber mais sobre seleção, privacidade, contexto do
modelo e comportamento de roteamento de notificações.

### Evento de atividade do Node em segundo plano

Os Nodes chamam `node.event` com `event: "node.presence.alive"` para registrar que um
Node pareado estava ativo durante uma ativação em segundo plano, sem marcá-lo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"iPhone do Peter\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é uma enumeração fechada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Valores desconhecidos são normalizados para
`background` (`src/shared/node-presence.ts`). O evento só é persistido em
sessões autenticadas de dispositivos Node; sessões sem dispositivo ou não pareadas retornam
`handled: false`.

Gateways bem-sucedidos retornam um resultado estruturado:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways mais antigos podem retornar apenas `{ "ok": true }` para `node.event`; trate isso
como uma RPC confirmada, não como persistência durável da presença.

## Escopo de eventos de transmissão

Eventos de transmissão enviados pelo servidor são controlados por escopo para que sessões
com escopo de pareamento ou exclusivas de Node não recebam passivamente o conteúdo da sessão
(`src/gateway/server-broadcast.ts`):

- Quadros de chat, agente e resultado de ferramenta (eventos `agent` transmitidos, eventos
  de resultado de ferramenta) exigem pelo menos `operator.read`. Sessões sem esse escopo ignoram
  completamente esses quadros.
- Transmissões `plugin.*` definidas por Plugins são restritas a `operator.write` ou
  `operator.admin` por padrão; entradas explícitas como
  `plugin.approval.requested` / `plugin.approval.resolved` usam
  `operator.approvals`.
- Eventos de status/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de
  conexão/desconexão) permanecem irrestritos para que a integridade do transporte seja observável por todas
  as sessões autenticadas.
- Famílias desconhecidas de eventos de transmissão são controladas por escopo por padrão (falha segura)
  a menos que um manipulador registrado as flexibilize explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente, portanto as transmissões
permanecem ordenadas de forma monotônica nesse soquete, mesmo quando clientes diferentes veem
subconjuntos distintos do fluxo de eventos filtrados por escopo.

## Famílias de métodos RPC

  `hello-ok.features.methods` é uma lista de descoberta conservadora criada a partir de
  `src/gateway/server-methods-list.ts` e das exportações de métodos de plugins/canais
  carregados — ela não é um despejo gerado de todos os métodos, e alguns métodos (por
  exemplo, `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
  são intencionalmente excluídos da descoberta, embora sejam métodos reais e
  invocáveis. Considere isso uma descoberta de recursos, não uma enumeração completa de
  `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway armazenado em cache ou recém-verificado.
    - `diagnostics.stability` retorna o registrador limitado de estabilidade de diagnóstico recente: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e IDs de sessão. Não inclui texto de chats, corpos de webhooks, saídas de ferramentas, corpos brutos de solicitações/respostas, tokens, cookies nem segredos. Requer `operator.read`.
    - `status` retorna o resumo do Gateway no estilo de `/status`; os campos confidenciais são exibidos somente para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade do dispositivo Gateway usada pelos fluxos de retransmissão e pareamento.
    - `system-presence` retorna o snapshot de presença atual dos dispositivos operadores/nós conectados.
    - `system-event` acrescenta um evento do sistema e pode atualizar/transmitir o contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` ativa ou desativa o processamento de Heartbeat no Gateway.
    - `gateway.suspend.prepare` cria uma concessão curta de suspensão cooperativa somente quando o trabalho monitorado do Gateway está ocioso. `gateway.suspend.status` verifica essa concessão, e `gateway.suspend.resume` a libera após a retomada ou uma operação de host abortada.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitidos no runtime. Consulte "Visualizações de `models.list`" abaixo.
    - `usage.status` retorna resumos das janelas de uso/cotas restantes dos provedores.
    - `usage.cost` retorna resumos agregados do uso de custos para um intervalo de datas. Passe `agentId` para um agente ou `agentScope: "all"` para agregar os agentes configurados.
    - `doctor.memory.status` retorna a prontidão da memória vetorial/dos embeddings armazenados em cache para o workspace do agente padrão ativo. Passe `{ "probe": true }` ou `{ "deep": true }` somente para executar explicitamente um ping em tempo real no provedor de embeddings. Passe `{ "agentId": "agent-id" }` para limitar as estatísticas do armazenamento do Dreaming ao workspace de um agente; se omitido, agrega os workspaces do Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` aceitam o parâmetro opcional `{ "agentId": "agent-id" }`; quando omitido, operam no workspace do agente padrão configurado.
    - `doctor.memory.remHarness` retorna uma visualização limitada e somente leitura do harness REM para clientes remotos do plano de controle, incluindo caminhos do workspace, trechos de memória, Markdown fundamentado renderizado e candidatos à promoção profunda. Requer `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão. Passe `agentId` para um agente ou `agentScope: "all"` para listar conjuntamente os agentes configurados.
      Ambos os métodos de uso aceitam `mode: "specific"` com um `timeZone` IANA para limites e agrupamentos por dia do calendário que consideram o horário de verão. `utcOffset` continua disponível para clientes mais antigos e como alternativa quando o runtime do Gateway não reconhece o fuso solicitado.
    - `sessions.usage.timeseries` retorna o uso em série temporal de uma sessão.
    - `sessions.usage.logs` retorna entradas do log de uso de uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status dos canais/plugins integrados e incluídos no pacote.
    - `channels.logout` encerra a sessão de um canal/uma conta específicos quando o canal oferece suporte a essa operação.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor atual de canal web compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo e inicia o canal em caso de sucesso.
    - `push.test` envia uma notificação por push de teste do APNs para um nó iOS registrado.
    - `voicewake.get` retorna os acionadores de palavra de ativação armazenados.
    - `voicewake.set` atualiza os acionadores de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Gerenciamento de plugins">
    - `plugins.list` (`operator.read`) retorna o inventário de plugins instalados, além de seleções oficiais organizadas localmente, diagnósticos e a indicação de que o modo de instalação atual permite ou não alterações.
    - `plugins.search` (`operator.read`) pesquisa famílias instaláveis de plugins de código e de pacotes de plugins do ClawHub. Passe um `query` não vazio e um `limit` opcional de 1 a 100.
    - `plugins.install` (`operator.admin`) instala uma entrada do catálogo oficial com `{ source: "official", pluginId }` ou um pacote do ClawHub com `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. As instalações do ClawHub preservam as verificações de confiança, integridade e política de instalação do Gateway. Instalações bem-sucedidas exigem a reinicialização do Gateway.
    - `plugins.setEnabled` (`operator.admin`) altera a política de ativação de um plugin instalado com `{ pluginId, enabled }`. A resposta inclui a entrada atualizada do catálogo, metadados de reinicialização e quaisquer avisos de seleção de slot.
    - `plugins.uninstall` (`operator.admin`) remove um plugin instalado externamente com `{ pluginId }`: referências de configuração, o registro de instalação e os arquivos gerenciados. Plugins incluídos no pacote não podem ser desinstalados, apenas desativados. A resposta lista as ações de remoção e sempre exige a reinicialização do Gateway.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC de entrega direta de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o trecho final configurado do log em arquivo do Gateway, com controles de cursor/limite e máximo de bytes.

  </Accordion>

  <Accordion title="Terminal do operador">
    - `terminal.open` inicia um PTY do host para um `agentId` explícito ou para o agente padrão e retorna o agente resolvido, o diretório de trabalho, o shell e o estado de confinamento.
    - `terminal.input`, `terminal.resize` e `terminal.close` operam somente em sessões pertencentes à conexão que fez a chamada.
    - Os eventos `terminal.data` e `terminal.exit` são transmitidos somente para a conexão proprietária da sessão.
    - As sessões cuja conexão é interrompida são desanexadas, não encerradas: elas permanecem disponíveis para reanexação durante `gateway.terminal.detachedSessionTimeoutSeconds` (padrão: 300; `0` restaura o encerramento ao desconectar), enquanto a saída recente se acumula em um buffer limitado no servidor.
    - `terminal.list` retorna as sessões que podem ser anexadas; `terminal.attach` vincula novamente uma sessão ativa ou desanexada à conexão que fez a chamada e retorna o buffer de reprodução (assunção de controle no estilo tmux — um proprietário ativo anterior recebe `terminal.exit` com o motivo `detached`); `terminal.text` lê o buffer como texto simples sem anexá-lo.
    - Todos os métodos de terminal exigem `operator.admin`; `gateway.terminal.enabled` deve ser explicitamente definido como true. Agentes totalmente isolados são recusados, e uma alteração na política do agente encerra os PTYs existentes e em andamento, incluindo os desanexados.

  </Accordion>

  <Accordion title="Conversa e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores de Conversa para fala, transcrição por streaming e voz em tempo real: ids canônicos de provedores, aliases de registro, rótulos, estado de configuração, um resultado opcional `ready` no nível do grupo, ids expostos de modelos/vozes, modos canônicos, transportes, estratégias de cérebro e sinalizadores de áudio/recursos em tempo real, sem retornar segredos dos provedores nem alterar a configuração global. Gateways atuais definem `ready` após aplicar a seleção de provedor em tempo de execução; considere sua ausência como não verificada em gateways mais antigos.
    - `talk.config` retorna a carga útil efetiva de configuração de Conversa; `includeSecrets` requer `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão de Conversa pertencente ao gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Para `stt-tts/managed-room`, chamadores com `operator.write` que passam `sessionKey` também devem passar `spawnedBy` para visibilidade restrita da chave de sessão; a criação de `sessionKey` sem restrição e `brain: "direct-tools"` exigem `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite `session.ready` ou `session.replaced` conforme necessário e retorna metadados da sala/sessão, além de eventos recentes de Conversa, sem nunca retornar o token em texto simples nem seu hash.
    - `talk.session.appendAudio` acrescenta áudio de entrada PCM em base64 a sessões de retransmissão em tempo real e de transcrição pertencentes ao gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` controlam o ciclo de vida dos turnos de salas gerenciadas, rejeitando turnos obsoletos antes que o estado seja limpo.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupções habilitadas por VAD em sessões de retransmissão do gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta do provedor emitida por uma sessão de retransmissão em tempo real pertencente ao gateway. A solicitação aguarda qualquer sinal de conclusão assíncrona exposto pela ponte do provedor; envios com falha mantêm a execução vinculada ativa e não emitem um evento de resultado de ferramenta bem-sucedido. Passe `options: { willContinue: true }` para uma saída intermediária da ferramenta ou `options: { suppressResponse: true }` quando a ponte do provedor anunciar suporte à supressão e o resultado não deva iniciar outra resposta.
    - `talk.session.steer` envia controle de voz da execução ativa para uma sessão de Conversa baseada em agente e pertencente ao gateway: `{ sessionId, text, mode? }`, em que `mode` é `status`, `steer`, `cancel` ou `followup`; quando omitido, o modo é classificado com base no texto falado.
    - `talk.session.close` encerra uma sessão de retransmissão, transcrição ou sala gerenciada pertencente ao gateway e emite eventos terminais de Conversa.
    - `talk.mode` define/transmite o estado atual do modo de Conversa para clientes da WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real pertencente ao cliente usando `webrtc` ou `provider-websocket`, enquanto o gateway controla a configuração, as credenciais, as instruções e a política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real pertencentes ao cliente encaminhem chamadas de ferramentas do provedor para a política do gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; os clientes recebem um id de execução e aguardam os eventos normais do ciclo de vida do chat antes de enviar o resultado de ferramenta específico do provedor.
    - `talk.client.steer` envia controle de voz da execução ativa para transportes em tempo real pertencentes ao cliente. O gateway resolve a execução incorporada ativa a partir de `sessionKey` e retorna um resultado estruturado de aceitação/rejeição, em vez de descartar silenciosamente o direcionamento.
    - `talk.event` é o canal único de eventos de Conversa para adaptadores de tempo real, transcrição, STT/TTS, sala gerenciada, telefonia e reuniões.
    - `talk.speak` sintetiza fala por meio do provedor de fala de Conversa ativo.
    - `tts.status` retorna o estado de ativação do TTS, o provedor ativo, os provedores de contingência e o estado de configuração dos provedores.
    - `tts.providers` retorna o inventário visível de provedores de TTS.
    - `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
    - `tts.setProvider` atualiza o provedor de TTS preferencial.
    - `tts.convert` executa uma conversão avulsa de texto em fala.
    - `tts.speak` (`operator.write`) renderiza `text` não vazio com a cadeia configurada de provedores gerais de TTS e retorna um clipe completo embutido como `audioBase64`, além de `provider` e metadados opcionais `outputFormat`, `mimeType` e `fileExtension`. Diferentemente de `tts.convert`, ele não retorna um caminho local do Gateway; diferentemente de `talk.speak`, ele não exige um provedor de Conversa. Textos acima de `messages.tts.maxTextLength` retornam `INVALID_REQUEST`; falhas de síntese retornam `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente as SecretRefs ativas e substitui o estado dos segredos em tempo de execução somente em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos destinadas a comandos para um conjunto específico de comandos/destinos.
    - `config.get` retorna o instantâneo e o hash da configuração atual.
    - `config.set` grava uma carga útil de configuração validada.
    - `config.patch` mescla uma atualização parcial da configuração. A substituição destrutiva de arrays exige o caminho afetado em `replacePaths`; arrays aninhados em entradas de arrays usam caminhos com `[]`, como `agents.list[].skills`.
    - `config.apply` valida + substitui toda a carga útil de configuração.
    - `config.schema` retorna a carga útil ativa do esquema de configuração usada pela Control UI e pelas ferramentas da CLI: esquema, `uiHints`, versão, metadados de geração e metadados de esquema de plugins + canais quando podem ser carregados. Ela inclui metadados `title` / `description` provenientes dos mesmos rótulos/textos de ajuda da interface, incluindo objetos aninhados, curingas, itens de array e ramificações de composição `anyOf` / `oneOf` / `allOf` quando existe documentação correspondente para o campo.
    - `config.schema.lookup` retorna uma carga útil de consulta restrita a um caminho de configuração: caminho normalizado, um nó de esquema superficial, dica correspondente + `hintPath`, `reloadKind` opcional e resumos dos filhos imediatos para detalhamento na interface/CLI. `reloadKind` é um de `restart`, `hot` ou `none` (`src/config/schema.ts`) e espelha o planejador de recarga de configuração do gateway para o caminho solicitado. Os nós de esquema da consulta mantêm a documentação voltada ao usuário e os campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de strings/de arrays/de objetos, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Os resumos dos filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, `reloadKind` opcional, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do gateway e agenda uma reinicialização somente se a atualização for bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que, durante a inicialização, um turno adicional do agente seja retomado por meio da fila de continuação de reinicialização. Atualizações do gerenciador de pacotes e atualizações supervisionadas de checkouts do Git provenientes do plano de controle usam uma transferência para serviço gerenciado desacoplada, em vez de substituir a árvore de pacotes ou alterar o checkout/resultado da compilação dentro do gateway ativo. Uma transferência iniciada retorna `ok: true` com `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; transferências indisponíveis ou com falha retornam `ok: false` com `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, além de `handoff.command` quando é necessária uma atualização manual pelo shell. Indisponível significa que o OpenClaw não dispõe de um limite seguro de supervisão ou de uma identidade de serviço durável, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante uma transferência iniciada, o sentinela de reinicialização pode informar brevemente `stats.reason: "restart-health-pending"`; a continuação é adiada até que a CLI verifique o gateway reiniciado e grave o sentinela `ok` final.
    - `update.status` atualiza e retorna o sentinela mais recente de reinicialização da atualização, incluindo a versão em execução após a reinicialização, quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de integração por RPC via WS.

  </Accordion>

  <Accordion title="Auxiliares de agente e espaço de trabalho">
    - `agents.list` retorna as entradas de agentes configuradas, incluindo o modelo efetivo e os metadados de tempo de execução.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a integração com o espaço de trabalho.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de inicialização do espaço de trabalho expostos para um agente.
    - `audit.activity.list` retorna o registro de atividades versionado e somente de metadados; `audit.list` continua sendo o RPC de execução/ferramenta seguro para compatibilidade.
    - `agents.workspace.list` e `agents.workspace.get` (`operator.read`) disponibilizam navegação somente leitura e paginada no diretório do espaço de trabalho de um agente para clientes no domínio de operador confiável descrito em [Escopos do operador](/pt-BR/gateway/operator-scopes). As solicitações aceitam apenas caminhos relativos ao espaço de trabalho; as leituras permanecem confinadas à raiz do espaço de trabalho após resolução do caminho real (escapes por links simbólicos e links físicos são rejeitados), têm tamanho limitado e aceitam somente texto UTF-8, além de tipos comuns de imagem (base64). As respostas não expõem o caminho do espaço de trabalho no host. Não há operações de gravação nesse namespace.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o registro de tarefas do gateway a clientes do SDK e a operadores. Consulte [RPCs do registro de tarefas](#task-ledger-rpcs) abaixo.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos e downloads de artefatos derivados de transcrições para um escopo explícito de `sessionKey`, `runId` ou `taskId`. Consultas de execução e tarefa resolvem no servidor a sessão proprietária e retornam apenas mídias da transcrição com procedência correspondente; fontes de URL inseguras ou locais resultam em downloads não compatíveis, em vez de serem buscadas pelo servidor.
    - `environments.list` e `environments.status` preservam a descoberta de ambientes locais do gateway e de Node. Workers de nuvem configurados e registros duráveis deixados por perfis anteriores adicionam metadados `worker` com `providerId`, `leaseId` opcional, `state`, `ageMs`, `idleMs` opcional e `attachedSessionIds`. Os estados do ciclo de vida do worker são `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` e `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) provisiona um worker a partir de um perfil de provedor de plugin configurado; novas tentativas com a mesma chave reutilizam a operação durável. `environments.destroy` (`{ environmentId }`) solicita o encerramento idempotente de um ambiente de worker durável. Ambos exigem `operator.admin`, são gravações do plano de controle e retornam o mesmo formato de resumo de ambiente usado pelas respostas de status.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou uma sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o instantâneo terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice de sessões atual, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado.
    - `sessions.subscribe` e `sessions.unsubscribe` ativam ou desativam assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` ativam ou desativam assinaturas de eventos de transcrição/mensagem para uma sessão. Passe `includeApprovals: true` para também receber eventos de ciclo de vida `session.approval` sanitizados referentes a aprovações cujo público persistido inclua exatamente essa sessão e cuja vinculação de revisor autorize o cliente assinante. A resposta da assinatura inclui então um `approvalReplay` pendente e limitado; ele é autoritativo quando `truncated` é falso. A adesão é definida por chamada de assinatura, não é persistente: assinar novamente a mesma sessão sem `includeApprovals: true` remove uma assinatura de aprovação existente. Além da autoridade normal de leitura da sessão, essa adesão exige `operator.admin` ou `operator.approvals` em um dispositivo pareado.
    - `sessions.preview` retorna prévias limitadas de transcrições para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canoniza um destino de sessão.
    - `sessions.create` cria uma nova entrada de sessão. `worktree: true` provisiona uma worktree gerenciada; `worktreeBaseRef`/`worktreeName` opcionais selecionam a ref de base e o nome da branch, e `execNode` (`operator.admin`) vincula a execução da sessão a um host Node. A worktree criada é retornada no resultado e persistida na linha da sessão (`worktree: { id, branch, repoRoot }`). Quando a entrada é criada, mas seu `chat.send` inicial aninhado é rejeitado, o resultado bem-sucedido inclui `runStarted: false` e `runError`; os clientes podem preservar o prompt e tentar novamente usando a chave de sessão retornada.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` e `sessions.groups.delete` gerenciam o catálogo de grupos de sessões personalizados pertencente ao Gateway (nomes + ordem de exibição). A associação permanece no campo `category` de cada sessão; renomear e excluir atualizam as sessões integrantes no lado do servidor.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interrupção e redirecionamento para uma sessão ativa.
    - `sessions.abort` interrompe o trabalho ativo de uma sessão. Passe `key` mais um `runId` opcional, ou apenas `runId` para execuções ativas que o Gateway consiga resolver para uma sessão.
    - `sessions.patch` atualiza metadados/substituições da sessão e informa o modelo canônico resolvido, além do `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam a manutenção da sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução do chat continua usando `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição em clientes de UI: tags de diretivas em linha são removidas do texto visível, cargas XML de chamadas de ferramenta em texto simples (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta) e tokens de controle do modelo ASCII/de largura completa que tenham vazado são removidos, linhas do assistente que contenham apenas tokens de silêncio (exatamente `NO_REPLY` / `no_reply`) são omitidas, e linhas grandes demais podem ser substituídas por espaços reservados.
    - `chat.message.get` é o leitor completo, aditivo e limitado de mensagens para uma única entrada visível da transcrição. Passe `sessionKey`, um `agentId` opcional quando a seleção de sessão tiver escopo de agente e um `messageId` da transcrição anteriormente fornecido por `chat.history`; o Gateway retorna a mesma projeção normalizada para exibição sem o limite de truncamento do histórico leve, desde que a entrada armazenada ainda esteja disponível e não seja grande demais.
    - `chat.toolTitles` retorna títulos curtos de finalidade para chamadas de ferramenta renderizadas na UI de Controle (em lote, no máximo 24 itens com entradas limitadas). O recurso exige adesão por meio de `gateway.controlUi.toolTitles` (desativado por padrão); Gateways desativados respondem `{ titles: {}, disabled: true }` sem chamar o modelo, para que os clientes parem de solicitar. Quando ativado, os títulos usam o roteamento padrão de modelos utilitários: um `utilityModel` configurado explicitamente (uma decisão do operador que, assim como todas as tarefas utilitárias, pode enviar conteúdo limitado da tarefa ao provedor escolhido) ou, caso contrário, o padrão de modelo pequeno declarado pelo provedor da sessão, para que nenhum novo destino de saída apareça implicitamente; um `utilityModel` vazio os desativa por completo. Os títulos nunca recorrem ao modelo principal como fallback. Os resultados são armazenados em cache no banco de dados de estado por agente, indexados pelo nome da ferramenta + entrada, portanto visualizações repetidas nunca geram nova cobrança pelas mesmas chamadas.
    - `chat.send` aceita `fastMode: "auto"` por um turno para usar o modo rápido em chamadas de modelo iniciadas antes do limite automático e, depois, iniciar novas tentativas, fallbacks, chamadas de resultado de ferramenta ou chamadas de continuação posteriores sem o modo rápido. O limite padrão é de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) e pode ser configurado por modelo com `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Um chamador de `chat.send` pode passar `fastAutoOnSeconds` por um turno para substituir o limite dessa solicitação.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.setupCode` cria um código de configuração para dispositivo móvel e, por padrão, uma URL de dados de QR em PNG. Exige `operator.admin` e é omitido intencionalmente da descoberta anunciada. O resultado inclui `setupCode`, um `qrDataUrl` opcional, `gatewayUrl`, o rótulo não secreto `auth` e `urlSource`.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.pair.rename` atribui um rótulo do operador (`{ deviceId, label }`) que tem preferência sobre o nome de exibição informado pelo cliente e permanece após o reparo ou a nova aprovação do dispositivo.
    - `device.token.rotate` rotaciona o token de um dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.
    - `device.token.revoke` revoga o token de um dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.

    O código de configuração incorpora uma credencial de bootstrap de curta duração. Os clientes não devem
    registrá-la nem persistí-la além do fluxo de pareamento.

  </Accordion>

  <Accordion title="Pareamento de Node, invocação e trabalho pendente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.remove` abrangem aprovações de recursos de Node. `node.pair.request` e `node.pair.verify` foram removidos na versão 2026.7 junto com o armazenamento independente de pareamento de Node; solicitações pendentes são criadas pelo Gateway durante conexões de Node.
    - `node.list` e `node.describe` retornam o estado de Nodes conhecidos/conectados.
    - `node.rename` atualiza o rótulo de um Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `mcp.tools.call.v1` é o comando de host Node sem interface gráfica para chamar uma ferramenta MCP local do Node configurada. Ele é transportado por `node.invoke`, exige que o Node declare o comando e continua sujeito à aprovação de pareamento e a `gateway.nodes.denyCommands`.
    - `node.event` transporta eventos originados no Node de volta ao Gateway.
    - `node.pluginTools.update` é o único caminho de publicação para substituir os descritores de ferramentas de Plugin/MCP visíveis ao agente do Node conectado; os parâmetros de `connect` não os transportam.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila do Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `approval.get` e `approval.resolve` são os métodos de aprovação durável independentes de tipo (escopo `operator.approvals`). `approval.get` retorna uma projeção sanitizada pendente ou terminal retida com um `urlPath` estável; `approval.resolve` aceita o ID de aprovação canônico, um `kind` explícito e uma decisão, aplica uma resolução em que a primeira resposta prevalece e sempre retorna o resultado canônico registrado.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` abrangem solicitações de aprovação de execução de uso único, além da consulta/reprodução de aprovações pendentes. Eles são adaptadores de fronteira de protocolo sobre o mesmo registro de aprovações durável.
    - `exec.approval.waitDecision` aguarda uma aprovação de execução pendente e retorna a decisão final (ou `null` em caso de tempo limite).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de execução do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local do Node para aprovação de execução por meio de comandos de retransmissão do Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` abrangem fluxos de aprovação definidos pelo Plugin.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção de texto de ativação imediata ou no próximo Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalhos agendados.
    - `cron.run` continua sendo uma RPC no estilo de enfileiramento para execuções manuais. Clientes que precisam de semântica de conclusão devem ler o `runId` retornado e consultar `cron.runs` periodicamente.
    - `cron.runs` aceita um filtro `runId` opcional e não vazio, para que os clientes possam acompanhar uma execução manual enfileirada sem disputar com outras entradas do histórico referentes ao mesmo trabalho.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulte [Métodos auxiliares do operador](#operator-helper-methods) abaixo.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações do chat da UI, como `chat.inject` e outros eventos de chat
  exclusivos da transcrição. No protocolo v4, cargas delta contêm `deltaText`; `message` continua sendo
  o snapshot cumulativo do assistente. Substituições que não sejam de prefixo definem
  `replace=true` e usam `deltaText` como texto substituto.
- `session.message`, `session.operation`, `session.tool`: atualizações de transcrição, operação de sessão
  em andamento e fluxo de eventos para uma sessão assinada.
- `session.approval`: estado sanitizado e autoritativo de aprovações pendentes e terminais para um
  assinante de sessão exata que tenha aderido explicitamente. Aprovações filhas usam o
  público ancestral persistido; os eventos nunca alteram transcrições nem despertam agentes.
- `sessions.changed`: o índice ou os metadados da sessão foram alterados.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive/atividade.
- `health`: atualização do snapshot de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/trabalho Cron.
- `shutdown`: notificação de desligamento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de Node.
- `node.invoke.request`: transmissão de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida do dispositivo pareado.
- `voicewake.changed`: a configuração do acionador por palavra de ativação foi alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da aprovação
  de execução.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da aprovação
  de Plugin.

### Métodos auxiliares de Node

Nodes podem chamar `skills.bins` para obter a lista atual de executáveis de Skills
para verificações de permissão automática.

## RPC do livro-razão de auditoria

`audit.activity.list` fornece aos clientes do operador uma visualização estável, do mais recente para o mais antigo, dos metadados de ciclo de vida de execuções de agente,
ações de ferramenta e mensagens com adesão opcional. Exige
`operator.read`. As consultas excluem registros com mais de 30 dias, e o livro-razão
SQLite compartilhado é limitado a 100,000 registros. Linhas expiradas são excluídas durante
a inicialização do Gateway, a manutenção horária e gravações posteriores. Consulte
[Histórico de auditoria](/gateway/audit) para conhecer o modelo de dados e a semântica de privacidade.

- Parâmetros: `agentId`, `sessionKey` ou `runId` exato opcional; `kind` opcional
  (`"agent_run"`, `"tool_action"` ou `"message"`); `status` opcional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` ou `"unknown"`); `direction` opcional da mensagem (`"inbound"` ou
  `"outbound"`) e `channel` exato; limites inclusivos opcionais `after` / `before`
  em milissegundos Unix; `limit` opcional de `1` a `500`; e `cursor` de string
  opcional da página anterior.
- Resultado: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

A união nomeada de resultados V1 tem esquemas separados para execução de agente,
ação de ferramenta, mensagem de entrada e mensagem de saída. O discriminador
`eventType` é, respectivamente, `agent_run`, `tool_action`, `inbound_message` ou
`outbound_message`; `kind` e `direction` da mensagem continuam disponíveis para
filtragem e exibição. Todo evento tem `schemaVersion: 1` inteiro. As referências
de identidade da mensagem usam o formato exato
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; um id de ator remetente do
canal usa o mesmo formato.

Todas as variantes exigem `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` e
`redaction`. Os campos das variantes são:

| `eventType`        | Campos obrigatórios                                               | Campos opcionais                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referências de identidade, `reasonCode`, `errorCode`                           |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referências de identidade, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

As enumerações fechadas de mensagem são:

- `conversationKind`: `direct`, `group`, `channel` ou `unknown`.
- `outcome` de entrada: `completed`, `skipped` ou `failed`; `reasonCode`
  opcional: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` ou `acp_dispatch_aborted`.
- `outcome` de saída: `sent`, `suppressed`, `failed` ou `unknown`; `reasonCode`
  opcional: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  ou `no_visible_payload`. Um adaptador que não retorna identidade da plataforma
  é `unknown`, pois não é possível refutar o efeito colateral externo.
- `deliveryKind`: `text`, `media` ou `other`; `failureStage`:
  `platform_send`, `queue` ou `unknown`.

Os campos terminais são correlacionados, não opcionais de forma independente:

| Variante          | Mapeamento terminal                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execução de agente | `started` não tem `errorCode`; cada status finalizado sem sucesso exige seu código `run_*` correspondente.                                                         |
| Ação de ferramenta | `started` e sucesso não têm `errorCode`; cada outro status finalizado exige seu código `tool_*` correspondente.                                                    |
| Mensagem de entrada | sucesso = `completed`; bloqueado = `skipped`; falha = `failed` mais `message_processing_failed`. Quando presente, `reasonCode` deve pertencer a essa família terminal. |
| Mensagem de saída | sucesso = `sent`; bloqueado = `suppressed` mais `reasonCode`; falha = `failed` mais `errorCode` e `failureStage`; desconhecido = `unknown` mais `failureStage`.      |

Cada evento de atividade inclui um id de evento estável, uma sequência monotônica
do registro contábil, a sequência do evento de origem, o carimbo de data/hora, o
ator, a ação, o status, `schemaVersion: 1` inteiro e
`redaction: "metadata_only"`. Os registros de execução e ferramenta exigem a
proveniência do agente e da execução e podem incluir a proveniência da sessão.
Os registros de mensagem podem incluir ids de agente e execução, mas
intencionalmente nunca incluem `sessionKey` ou `sessionId`; portanto, o filtro de
consulta `sessionKey` aplica-se somente às linhas de execução e ferramenta. Os
eventos de ferramenta podem incluir o id da chamada da ferramenta e o nome da
ferramenta.

Os registros de mensagem usam `message.inbound.processed` ou
`message.outbound.finished` e adicionam direção, canal, tipo de conversa,
resultado normalizado e, opcionalmente, tipo de entrega, estágio da falha,
duração, contagem de resultados, código do motivo e pseudônimos com chave,
locais à instalação, de conta/conversa/mensagem/destino. Esses pseudônimos
auxiliam na correlação, mas não constituem anonimização: o banco de dados de
estado contém a chave deles, enquanto as exportações de RPC e CLI não a contêm.
O registro contábil não armazena prompts, corpos de mensagens, argumentos de
ferramentas, resultados de ferramentas, saída de comandos nem texto bruto de
erros. Os valores `sessionKey` de execução/ferramenta permanecem como metadados
brutos de correlação e podem incorporar ids de conta ou de par da plataforma;
os registros de mensagem omitem chaves de sessão.

Para linhas de entrada, `durationMs` mede o despacho do núcleo até seu estado terminal e
`resultCount` conta payloads finalizados de ferramentas, blocos e respostas na fila. Para
linhas de saída, `durationMs` abrange desde a posse da entrega até a confirmação,
a fila de mensagens mortas ou a reconciliação (incluindo o tempo de espera na fila), e `resultCount`
conta os envios físicos identificados para a plataforma. `deliveryKind`, quando presente,
descreve o payload efetivo após hooks e renderização; linhas suprimidas ou
ambíguas devido a falhas omitem esse campo.

A cobertura atual de mensagens inclui mensagens de entrada aceitas que chegam ao
despacho do núcleo, incluindo resultados de duplicação/estado terminal do núcleo. A cobertura de saída grava
uma linha terminal por payload de resposta lógico original que chega à entrega durável
compartilhada; a divisão em partes e a distribuição pelo adaptador são agregadas em `resultCount`. Envios na fila
que podem ser repetidos ou que são ambíguos são registrados somente após confirmação, envio à fila
de mensagens mortas ou reconciliação. Caminhos locais de Plugin e de envio direto que contornam esses
limites compartilhados ainda não são cobertos. A fila limitada de workers opera em regime de melhor esforço
e pode descartar registros em caso de falha ou saturação, portanto esta superfície não é um
arquivo de conformidade sem perdas.

A gravação fica ativada por padrão e é controlada por
[`audit.enabled`](/pt-BR/gateway/configuration-reference#audit). A gravação de mensagens é
controlada separadamente por `audit.messages` e o padrão é `"off"`. Quando
a gravação está desativada, `audit.activity.list` continua fornecendo registros gravados
anteriormente até que expirem.

Os esquemas fornecidos de solicitação e resultado de `audit.list` e de `AuditEvent` permanecem
inalterados e retornam somente registros de execução de agente e ação de ferramenta. Novos clientes
de operador devem chamar `audit.activity.list` quando o Gateway o anunciar. Gateways mais antigos
podem retornar `unknown method: audit.activity.list` ou, como
a autorização precedia a consulta do método nas versões fornecidas, `missing scope:
operator.admin` para uma solicitação com escopo de leitura. Trate o segundo caso como ausência do método
somente quando o método não tiver sido anunciado. Um cliente poderá então tentar novamente com `audit.list`
somente quando seus filtros não exigirem suporte a tipo de mensagem, direção ou canal.

Use [`openclaw audit`](/cli/audit) para consultas de texto e exportações JSON limitadas.

## RPCs do registro de tarefas

Clientes de operador inspecionam e cancelam registros de tarefas em segundo plano do Gateway por meio
dos RPCs do registro de tarefas (`packages/gateway-protocol/src/schema/tasks.ts`). Eles
retornam resumos de tarefas sanitizados, não o estado bruto do runtime.

- `tasks.list` exige `operator.read`.
  - Parâmetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou um array desses estados,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` e `cursor` de string opcional.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` exige `operator.read`.
  - Parâmetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - IDs de tarefa ausentes retornam o formato de erro de não encontrado do Gateway.
- `tasks.cancel` exige `operator.write`.
  - Parâmetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o registro continha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, carimbos de data e hora, progresso,
resumo terminal e texto de erro sanitizado. `agentId` identifica o agente
que executa a tarefa; `sessionKey` e `ownerKey` preservam o contexto do solicitante e de controle.

## Métodos auxiliares do operador

- `commands.list` (`operator.read`) busca o inventário de comandos de runtime para
  um agente.
  - `agentId` é opcional; omita-o para ler o espaço de trabalho do agente padrão.
  - `scope` controla qual superfície é o destino do `name` principal: `text` retorna
    o token principal do comando de texto sem a `/` inicial; `native` e o caminho
    padrão `both` retornam nomes nativos específicos do provedor quando disponíveis.
  - `textAliases` contém aliases exatos com barra, como `/model` e `/m`.
  - `nativeName` contém o nome do comando nativo específico do provedor quando
    existe.
  - `provider` é opcional e afeta somente a nomenclatura nativa e a disponibilidade
    de comandos nativos de plugins.
  - `includeArgs=false` omite da resposta os metadados serializados dos argumentos.
- `tools.catalog` (`operator.read`) busca o catálogo de ferramentas de runtime para
  um agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: plugin proprietário quando `source="plugin"`
  - `optional`: indica se uma ferramenta de plugin é opcional
- `tools.effective` (`operator.read`) busca o inventário de ferramentas efetivas
  no runtime para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto confiável de runtime da sessão no servidor,
    em vez de aceitar contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta é uma projeção derivada pelo servidor e limitada à sessão do
    inventário ativo, incluindo ferramentas do núcleo, de plugins, de canais e
    de servidores MCP já descobertos.
  - `tools.effective` é somente leitura para MCP: pode projetar um catálogo MCP
    de uma sessão ativa por meio da política final de ferramentas, mas não cria
    runtimes MCP, conecta transportes nem emite `tools/list`. Se não houver um
    catálogo ativo correspondente, a resposta poderá incluir um aviso como
    `mcp-not-yet-connected`, `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - As entradas de ferramentas efetivas usam `source="core"`, `source="plugin"`,
    `source="channel"` ou `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca uma ferramenta disponível pelo
  mesmo caminho de política do gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente resolvido da sessão
    deverá corresponder a `agentId`.
  - Wrappers do núcleo exclusivos do proprietário, como `cron`, `gateway` e `nodes`,
    exigem identidade de proprietário/administrador (`operator.admin`), embora
    `tools.invoke` em si seja `operator.write`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, `output`
    opcional e campos `error` tipados. Recusas por aprovação ou política retornam
    `ok:false` na carga útil, em vez de ignorar o pipeline de políticas de
    ferramentas do gateway.
- `skills.status` (`operator.read`) busca o inventário visível de Skills para um
  agente.
  - `agentId` é opcional; omita-o para ler o espaço de trabalho do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de
    configuração e opções de instalação sanitizadas, sem expor valores brutos
    de segredos.
- `skills.search` e `skills.detail` (`operator.read`) retornam metadados de
  descoberta do ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`
  (`operator.admin`) preparam um arquivo privado de Skill antes de instalá-lo. Este
  é um caminho separado de upload administrativo para clientes confiáveis, não o
  fluxo normal de instalação de Skills do ClawHub, e fica desativado por padrão,
  a menos que `skills.install.allowUploadedArchives` esteja ativado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    cria um upload vinculado a esse slug e valor de força.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` acrescenta bytes no
    deslocamento decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e o
    SHA-256. A confirmação apenas finaliza o upload; ela não instala a Skill.
  - Os arquivos de Skills enviados são arquivos zip que contêm um `SKILL.md` na
    raiz. O nome do diretório interno do arquivo nunca seleciona o destino da
    instalação.
- `skills.install` (`operator.admin`) tem três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do espaço de trabalho do agente padrão.
  - Modo de upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala um upload confirmado no diretório `skills/<slug>` do espaço de trabalho
    do agente padrão. O slug e o valor de força devem corresponder à solicitação
    `skills.upload.begin` original. A solicitação é rejeitada, a menos que
    `skills.install.allowUploadedArchives` esteja ativado; a configuração não
    afeta instalações do ClawHub.
  - Modo de instalador do Gateway: `{ name, installId, timeoutMs? }` executa uma
    ação `metadata.openclaw.install` declarada no host do gateway. Clientes antigos
    ainda podem enviar `dangerouslyForceUnsafeInstall`; esse campo está obsoleto,
    é aceito somente para compatibilidade de protocolo e é ignorado. Use
    `security.installPolicy` para decisões de instalação sob responsabilidade do
    operador.
- `skills.update` (`operator.admin`) tem dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas
    do ClawHub no espaço de trabalho do agente padrão.
  - O modo de configuração modifica valores de `skills.entries.<skillKey>`, como
    `enabled`, `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro `view` opcional
(`src/agents/model-catalog-visibility.ts`):

- Omitido ou `"default"`: se `agents.defaults.models` estiver configurado, a
  resposta será o catálogo permitido, incluindo modelos descobertos dinamicamente
  para entradas `provider/*`. Caso contrário, a resposta será o catálogo completo
  do gateway.
- `"configured"`: comportamento dimensionado para seletores. Se
  `agents.defaults.models` estiver configurado, ele ainda terá precedência,
  incluindo a descoberta limitada ao provedor para entradas `provider/*`. Sem uma
  lista de permissões, a resposta usará entradas explícitas de
  `models.providers.<provider>.models`, recorrendo ao catálogo completo somente
  quando não houver linhas de modelos configuradas.
- `"provider-config"`: inventário de `models.providers.*.models` criado pela
  origem, independente das listas de permissões do seletor. As linhas incluem
  recursos públicos dos modelos e disponibilidade que considera as rotas, mas
  omitem endpoints de provedores, material de autenticação e configuração de
  solicitações de runtime.
- `"all"`: catálogo completo do gateway, ignorando `agents.defaults.models`. Use
  para interfaces de diagnóstico/descoberta, não para seletores normais de modelos.

## Aprovações de execução

- Quando uma solicitação de execução precisa de aprovação, o gateway transmite
  `exec.approval.requested`.
- Clientes operadores resolvem a solicitação chamando `exec.approval.resolve`
  (requer `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan`
  (`argv`/`cwd`/`rawCommand` canônicos e metadados da sessão). Solicitações sem
  `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam
  esse `systemRunPlan` canônico como o contexto autoritativo de
  comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de
  `system.run`, o gateway rejeitará a execução em vez de confiar na carga útil
  alterada.

## Fallback de entrega do agente

- As solicitações de `agent` podem incluir `deliver=true` para solicitar entrega
  de saída.
- `bestEffortDeliver=false` (o padrão) mantém o comportamento estrito: destinos
  de entrega não resolvidos ou somente internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando
  nenhuma rota externa de entrega puder ser resolvida (por exemplo, sessões
  internas/de webchat ou configurações ambíguas com vários canais).
- Os resultados finais de `agent` podem incluir `result.deliveryStatus` quando
  a entrega tiver sido solicitada, usando os mesmos status `sent`, `suppressed`,
  `partial_failed` e `failed` documentados para
  [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` e `MIN_PROBE_PROTOCOL_VERSION` ficam em
  `packages/gateway-protocol/src/version.ts`.
- Os clientes enviam `minProtocol` + `maxProtocol`. Os clientes operadores e de
  interface devem incluir o protocolo atual nesse intervalo; clientes e servidores
  atuais executam o protocolo v4.
- Clientes autenticados com `role: "node"` e `client.mode: "node"` podem usar
  o protocolo de Node N-1 (atualmente v3). Sondas leves de reinicialização usam a
  mesma janela N-1. Autenticação de dispositivos, pareamento, escopos, política
  de comandos e aprovações de execução não são alterados por essa janela de
  compatibilidade. Recursos e comandos de Node pertencentes a plugins são
  retidos até que o Node seja atualizado para o protocolo atual, pois suas
  superfícies hospedadas não fazem parte do contrato N-1.
- Esquemas e modelos são gerados a partir de definições do TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

A implementação de referência do cliente fica em `packages/gateway-client/src/`
(o OpenClaw a encapsula por meio da fachada fina `src/gateway/client.ts`). Esses
padrões são estáveis em todo o protocolo v4 e constituem a linha de base esperada
para clientes de terceiros.

| Constante                                 | Padrão                                                | Origem                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Tempo limite da solicitação (por RPC)     | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Tempo limite de pré-autenticação / desafio de conexão | `15_000` ms                                | `packages/gateway-client/src/timeouts.ts` (a variável de ambiente `OPENCLAW_HANDSHAKE_TIMEOUT_MS` pode aumentar o limite combinado do servidor/cliente) |
| Recuo inicial de reconexão                | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Recuo máximo de reconexão                 | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Limite de repetição rápida após encerramento por token do dispositivo | `250` ms                          | `packages/gateway-client/src/client.ts`                                                                                   |
| Período de tolerância para encerramento forçado antes de `terminate()` | `250` ms                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Tempo limite padrão de `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms                                      | `packages/gateway-client/src/client.ts`                                                                                   |
| Encerramento por tempo limite de tick     | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`,
`policy.maxPayload` e `policy.maxBufferedBytes` em `hello-ok`; os clientes
devem respeitar esses valores em vez dos padrões anteriores ao handshake.

O cliente de referência permite que solicitações finitas controlem seu prazo
configurado quando todas as solicitações pendentes têm um. Uma solicitação
`expectFinal` sem um `timeoutMs` finito, qualquer solicitação com
`timeoutMs: null` ou uma combinação de solicitações finitas e ilimitadas mantém
o watchdog de tick ativo. Se eventos e respostas de entrada permanecerem em
silêncio além do limite de tempo do tick, o cliente fecha o socket com o código
`4000`, rejeita todas as solicitações pendentes e se reconecta. Ele não reenvia
as solicitações rejeitadas após a reconexão.

## Autenticação

- A autenticação do Gateway por segredo compartilhado usa
  `connect.params.auth.token` ou `connect.params.auth.password`, dependendo do
  `gateway.auth.mode` configurado
  (`"none" | "token" | "password" | "trusted-proxy"`).
- Modos que incluem identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` fora de loopback, satisfazem a
  verificação de autenticação da conexão por meio dos cabeçalhos da solicitação,
  em vez de `connect.params.auth.*`.
- O `gateway.auth.mode: "none"` em entrada privada ignora completamente a
  autenticação da conexão por segredo compartilhado; não exponha esse modo em
  entradas públicas/não confiáveis.
- Após o pareamento, o Gateway emite um token de dispositivo com escopo
  correspondente à função + aos escopos da conexão, retornado em
  `hello-ok.auth.deviceToken`. Os clientes devem persistir esse token após
  qualquer conexão bem-sucedida.
- Ao se reconectar com esse token de dispositivo armazenado, o conjunto de
  escopos aprovados armazenado para esse token também deve ser reutilizado.
  Isso preserva o acesso de leitura/sondagem/status já concedido e evita que as
  reconexões sejam silenciosamente reduzidas a um escopo implícito mais restrito,
  exclusivo de administrador.
- Montagem da autenticação de conexão no lado do cliente (`selectConnectAuth`
  em `packages/gateway-client/src/client.ts`):
  - `auth.password` é independente e sempre é encaminhado quando definido.
  - `auth.token` é preenchido na seguinte ordem de prioridade: primeiro o token
    compartilhado explícito, depois um `deviceToken` explícito e, por fim, um
    token armazenado por dispositivo (indexado por `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções acima
    definiu `auth.token`. Um token compartilhado ou qualquer token de
    dispositivo definido impede seu envio.
  - A promoção automática de um token de dispositivo armazenado na única nova
    tentativa de `AUTH_TOKEN_MISMATCH` é restrita apenas a endpoints confiáveis:
    loopback ou `wss://` com um `tlsFingerprint` fixado. Um `wss://` público sem
    fixação não se qualifica.
- O bootstrap integrado por código de configuração retorna o
  `hello-ok.auth.deviceToken` do Node principal, além de um token de operador
  limitado em `hello-ok.auth.deviceTokens` para transferência móvel confiável.
  O token de operador inclui `operator.talk.secrets` para leituras nativas da
  configuração do Talk, mas exclui os escopos de alteração de pareamento e
  `operator.admin`.
- Enquanto um bootstrap por código de configuração que não seja de linha de
  base aguarda aprovação, os detalhes de `PAIRING_REQUIRED` incluem
  `recommendedNextStep: "wait_then_retry"`, `retryable: true` e
  `pauseReconnect: false`. Continue se reconectando com o mesmo token de
  bootstrap até que a solicitação seja aprovada ou o token se torne inválido.
- Persista `hello-ok.auth.deviceTokens` somente quando a conexão tiver usado
  autenticação de bootstrap em um transporte confiável, como `wss://` ou
  pareamento por loopback/local.
- Se um cliente fornecer um `deviceToken` explícito ou `scopes` explícitos, o
  conjunto de escopos solicitado pelo chamador continuará sendo a fonte de
  autoridade; os escopos em cache só serão reutilizados quando o cliente
  estiver reutilizando o token armazenado por dispositivo.
- Os tokens de dispositivo podem ser rotacionados/revogados por meio de
  `device.token.rotate` e `device.token.revoke` (requer `operator.pairing`).
  Rotacionar ou revogar um Node ou outra função que não seja de operador também
  requer `operator.admin`.
- `device.token.rotate` retorna metadados da rotação. Ele reproduz o token
  portador substituto somente para chamadas do mesmo dispositivo já
  autenticadas com esse token de dispositivo, permitindo que clientes que usam
  apenas token persistam o substituto antes de se reconectarem. Rotações
  compartilhadas/de administrador não reproduzem o token portador.
- A emissão, a rotação e a revogação de tokens permanecem limitadas ao conjunto
  de funções aprovado registrado na entrada de pareamento desse dispositivo;
  uma alteração de token não pode expandir nem selecionar uma função de
  dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos
  é limitado ao próprio dispositivo, a menos que o chamador também tenha
  `operator.admin`: chamadores que não sejam administradores só podem gerenciar
  o token de operador da própria entrada de dispositivo. O gerenciamento de
  tokens de Node e de outras funções que não sejam de operador é exclusivo de
  administradores, mesmo para o próprio dispositivo do chamador.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de
  escopos do token de operador de destino em relação aos escopos da sessão
  atual do chamador. Chamadores que não sejam administradores não podem
  rotacionar nem revogar um token de operador com escopo mais amplo do que o
  que já possuem.
- Falhas de autenticação incluem `error.details.code`, além de orientações de
  recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: um entre `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem realizar uma única nova tentativa limitada com
    um token por dispositivo em cache.
  - Se essa nova tentativa falhar, interrompa os ciclos de reconexão automática
    e apresente orientações de ação ao operador.
- `AUTH_SCOPE_MISMATCH` significa que o token do dispositivo foi reconhecido,
  mas não abrange a função/os escopos solicitados. Não apresente isso como um
  token inválido; solicite ao operador que refaça o pareamento ou aprove o
  contrato de escopo mais restrito/amplo.

## Identidade e pareamento do dispositivo

- Os Nodes devem incluir uma identidade de dispositivo estável (`device.id`)
  derivada da impressão digital de um par de chaves.
- Os Gateways emitem tokens por dispositivo + função.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a
  menos que a aprovação automática local esteja habilitada.
- A aprovação automática de pareamento se concentra em conexões diretas por
  loopback local.
- O OpenClaw também tem um caminho restrito de autoconexão local ao
  backend/contêiner para fluxos auxiliares confiáveis por segredo compartilhado.
- Conexões da tailnet ou LAN no mesmo host ainda são tratadas como remotas para
  fins de pareamento e exigem aprovação.
- Normalmente, os clientes WS incluem a identidade `device` durante `connect`
  (operador + Node). As únicas exceções de operador sem dispositivo são
  caminhos de confiança explícitos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade HTTP
    insegura somente em localhost.
  - autenticação bem-sucedida da Control UI do operador com
    `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (medida emergencial,
    redução severa da segurança).
  - RPCs de backend por loopback direto do `gateway-client` no caminho auxiliar
    interno reservado.
- Omitir a identidade do dispositivo tem consequências para os escopos. Quando
  uma conexão de operador sem dispositivo é permitida por um caminho de
  confiança explícito, o OpenClaw ainda redefine os escopos autodeclarados para
  um conjunto vazio, a menos que esse caminho tenha uma exceção nomeada de
  preservação de escopo. Métodos protegidos por escopo então falham com
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` é um caminho
  emergencial de preservação de escopo da Control UI. Ele não concede escopos
  a clientes WebSocket arbitrários de backend personalizado ou com formato de
  CLI.
- O caminho auxiliar reservado de backend do `gateway-client` por loopback
  direto preserva escopos somente para RPCs internos do plano de controle local;
  IDs de backend personalizados não recebem essa exceção.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo
  servidor.

### Diagnósticos de migração da autenticação do dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao
desafio, `connect` retorna códigos de detalhe `DEVICE_AUTH_*` em
`error.details.code`, com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                                           |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou em branco).                |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto.                    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O conteúdo da assinatura não corresponde ao conteúdo v2.             |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O carimbo de data e hora assinado está fora da tolerância permitida.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública.    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato ou a canonicalização da chave pública falhou.               |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine o conteúdo v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O conteúdo de assinatura preferencial é `v3`
  (`buildDeviceAuthPayloadV3` em `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` e `deviceFamily`, além dos campos
  de dispositivo/cliente/função/escopos/token/nonce.
- Assinaturas `v2` legadas continuam sendo aceitas por compatibilidade, mas a
  fixação dos metadados do dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS e fixação

- TLS é compatível com conexões WS (configuração `gateway.tls`).
- Opcionalmente, os clientes podem fixar a impressão digital do certificado do Gateway por meio de
  `gateway.remote.tlsFingerprint` ou da opção de CLI `--tls-fingerprint`.

## Escopo

Este protocolo expõe a API completa do Gateway: status, canais, modelos, chat,
agente, sessões, nós, aprovações e muito mais. A superfície exata é definida pelos
esquemas TypeBox reexportados de `packages/gateway-protocol/src/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

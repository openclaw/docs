---
read_when:
    - Implementação ou atualização de clientes WS do Gateway
    - Depuração de incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos de protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-07-16T12:28:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

O protocolo WS do Gateway é o único plano de controle e transporte de nós do
OpenClaw. Clientes operadores e nós (CLI, interface web, aplicativo para macOS, nós iOS/Android,
nós headless) conectam-se por WebSocket e declaram uma **função** e um **escopo** no
momento do handshake.

## Transporte e enquadramento

- WebSocket, quadros de texto, cargas JSON.
- O primeiro quadro **deve** ser uma solicitação `connect`.
- Os quadros anteriores à conexão são limitados a 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Após o
  handshake, siga `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com o diagnóstico ativado, quadros
  de entrada grandes demais e buffers de saída lentos emitem eventos `payload.large` antes que
  o gateway feche ou descarte o quadro. Esses eventos incluem `surface`, tamanhos em
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

`server`, `features`, `snapshot`, `policy` e `auth` são todos exigidos por
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
informa a função/os escopos negociados mesmo quando nenhum token de dispositivo é emitido (formato
acima). `pluginSurfaceUrls` é opcional e mapeia nomes de superfícies de plugins (por exemplo,
`canvas`) para URLs hospedadas com escopo; ele pode expirar, portanto os nós chamam
`node.pluginSurface.refresh` com `{ "surface": "canvas" }` para obter uma entrada atualizada.
O caminho obsoleto `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
não é compatível; use superfícies de plugins.
O campo opcional `appliedConfigHash` do snapshot é a revisão resolvida da configuração de origem
aceita pelo runtime ativo do Gateway. Os clientes podem compará-la com
`config.get.configRevisionHash` para determinar se uma configuração salva mais recente ainda
exige uma reinicialização. `config.get.hash` continua sendo a revisão bruta do arquivo raiz usada pelas
proteções contra conflitos de gravação da configuração.

Enquanto o gateway ainda estiver concluindo a inicialização dos processos auxiliares, `connect` poderá retornar um
erro recuperável `UNAVAILABLE` com `details.reason: "startup-sidecars"` e
`retryAfterMs`. Tente novamente dentro do orçamento da conexão em vez de tratá-lo como
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

A inicialização integrada por QR/código de configuração é um caminho de transferência para dispositivos móveis. Uma conexão bem-sucedida
com o código de configuração básico retorna um token de nó primário mais um
token de operador limitado:

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

Essa transferência de operador é intencionalmente limitada: suficiente para iniciar o ciclo do
operador móvel e a configuração nativa, incluindo `operator.talk.secrets` para leituras da
configuração do Talk, mas sem escopos de mutação de pareamento e sem `operator.admin`. Um acesso
mais amplo de pareamento/administração exige um fluxo separado de pareamento ou token aprovado. Persista
`hello-ok.auth.deviceTokens` somente quando a autenticação de inicialização tiver sido executada por um transporte
confiável (`wss://` ou pareamento de loopback/local).

Clientes de backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas de loopback ao
se autenticarem com o token/senha compartilhado do gateway. Esse caminho é reservado
para RPCs internos do plano de controle (por exemplo, atualizações de sessão de subagentes) e evita que
linhas de base obsoletas de pareamento de CLI/dispositivo bloqueiem o trabalho local do backend. Clientes
remotos, com origem no navegador, nós e clientes explícitos com token de dispositivo/identidade de dispositivo ainda
passam pelas verificações normais de pareamento e elevação de escopo.

### Função de worker e protocolo fechado

Workers na nuvem usam uma entrada dedicada de loopback pelo túnel SSH pertencente ao gateway,
com a chave do host fixada. Ela aceita somente a identidade do worker e nunca despacha
autenticação geral, eventos de nós, RPCs de operadores ou métodos de plugins. Um `connect` rigoroso
verifica uma credencial de curta duração, armazenada como hash e vinculada ao ambiente, ao hash do
pacote, à época do proprietário, à versão do conjunto de RPCs, à expiração e a uma sessão anulável; ele
verifica separadamente a versão atual e o conjunto de recursos. O sucesso retorna um
`worker-hello-ok` mínimo; a negociação de recursos é independente da versão geral do
protocolo. Os quadros permanecem abaixo de 64 KiB, exceto por um quadro `worker.inference.start`
negociado, que pode ter até 25 MiB. A lista de permissões fechada contém `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` e
`worker.inference.cancel`.

Os commits de transcrição usam delimitação por época do proprietário, uma vinculação de sessão pertencente ao gateway,
comparação e troca da folha base e repetição durável da sequência; o gateway gera
IDs de entradas e pais da transcrição pelo gravador normal de sessões. A propriedade e
a expiração são verificadas novamente em cada RPC.

### Recursos do cliente

Clientes operadores podem anunciar recursos opcionais em `connect.params.caps`:

- `tool-events`: aceita eventos estruturados do ciclo de vida de ferramentas.
- `inline-widgets`: pode renderizar resultados de ferramentas de widgets inline hospedados.

Os recursos do cliente descrevem o cliente conectado, não a autorização. As ferramentas do agente podem declarar recursos obrigatórios; o Gateway omite essas ferramentas, a menos que todos os requisitos apareçam em `caps` do cliente de origem. Execuções originadas em canais não têm recursos de cliente do Gateway, portanto ferramentas controladas por recursos ficam indisponíveis mesmo quando a política de ferramentas as permite explicitamente.

### Exemplo de conexão de nó

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

Os nós declaram reivindicações de recursos no momento da conexão:

- `caps`: categorias de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: controles granulares (por exemplo, `screen.record`, `camera.capture`).

O gateway trata essas declarações como reivindicações e aplica listas de permissões no lado do servidor.

## Funções e escopos

Para conhecer o modelo completo de escopos do operador, as verificações no momento da aprovação e a semântica de segredo
compartilhado, consulte [Escopos do operador](/pt-BR/gateway/operator-scopes).

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
`operator.admin`). Quando os segredos forem incluídos, leia a credencial ativa do provedor do Talk
em `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
mantém o formato da origem e pode ser um objeto SecretRef ou uma string ocultada.

Os métodos RPC do gateway registrados por plugins podem solicitar seu próprio escopo de operador,
mas estes prefixos reservados do núcleo sempre são resolvidos como `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

O escopo do método é apenas a primeira verificação. Alguns comandos com barra acessados por
`chat.send` aplicam verificações mais rigorosas no nível do comando: gravações persistentes de `/config set` e
`/config unset` exigem `operator.admin` mesmo para clientes do gateway que
já tenham um escopo de operador inferior.

`node.pair.approve` tem uma verificação adicional de escopo no momento da aprovação, além do escopo
básico do método (`operator.pairing`), com base no `commands` declarado pela
solicitação pendente (`src/infra/node-pairing-authz.ts`):

| Comandos declarados                                                                                                           | Escopos obrigatórios                    |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| nenhum                                                                                                                        | `operator.pairing`                      |
| comandos comuns                                                                                                               | `operator.pairing` + `operator.write` |
| inclui `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` ou `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Recursos/comandos/permissões (nó)

Os nós declaram reivindicações de recursos no momento da conexão:

- `caps`: categorias de recursos de alto nível, como `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: lista de permissões de comandos para invocação.
- `permissions`: controles granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **declarações** e aplica listas de permissões no lado do servidor.
Os nodes conectados podem publicar descritores opcionais de Plugin ou de ferramentas MCP visíveis ao agente
com `node.pluginTools.update` após uma conexão ou
reconexão bem-sucedida. Hosts de nodes sem interface reiniciam para aplicar alterações declarativas
ao inventário MCP. Esse método de atualização é o único caminho de publicação; descritores de ferramentas de Plugin não são aceitos nos
parâmetros de `connect`. Cada descritor deve usar um `name` de ferramenta seguro para o provedor e indicar
um `command` presente na lista atual de comandos permitidos do node. O Gateway confia nos metadados
do descritor provenientes do node pareado, filtra descritores fora da superfície de comandos
aprovada, remove-os quando o node se desconecta e rejeita tentativas do operador
de modificar o catálogo de outro node. Defina `gateway.nodes.pluginTools.enabled: false`
para ignorar descritores publicados por nodes.

Hosts de nodes conectados publicam seu catálogo completo de substituição de Skills com
`node.skills.update`. Esse método da função de node é o único caminho de publicação
de Skills do node; Skills não são aceitas nos parâmetros de `connect`. Cada descritor contém
um nome seguro, uma descrição e conteúdo `SKILL.md` limitado. O Gateway analisa esse
conteúdo com o carregador normal de Skills, inclui-o nos snapshots de Skills do agente
enquanto o node está conectado e o remove na desconexão. Defina
`gateway.nodes.skills.enabled: false` para ignorar Skills publicadas por nodes.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo, incluindo
  `deviceId`, `roles` e `scopes`, para que as interfaces possam exibir uma linha por dispositivo mesmo
  quando ele se conecta como operador e como node.
- `node.list` inclui `lastSeenAtMs` e `lastSeenReason` opcionais. Nodes conectados
  informam o horário atual da conexão com o motivo `connect`; nodes pareados também podem
  informar presença durável em segundo plano por meio de um evento de node confiável.

Nodes nativos do macOS também podem enviar eventos `node.presence.activity` autenticados
com tempo de inatividade de entrada limitado. O Gateway deriva os timestamps de atividade usando seu
próprio relógio, expõe o Mac conectado mais recente por meio de `node.list` e
`node.describe` e transmite atualizações de `node.presence` para clientes com escopo de leitura.
Consulte [Presença do computador ativo](/pt-BR/nodes/presence) para saber sobre seleção, privacidade, contexto
do modelo e comportamento de roteamento de notificações.

### Evento de atividade do node em segundo plano

Os nodes chamam `node.event` com `event: "node.presence.alive"` para registrar que um
node pareado estava ativo durante uma ativação em segundo plano, sem marcá-lo como conectado:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` é uma enumeração fechada: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Valores desconhecidos são normalizados para
`background` (`src/shared/node-presence.ts`). O evento só é persistido para
sessões autenticadas de dispositivos de node; sessões sem dispositivo ou não pareadas retornam
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

Os eventos de transmissão enviados pelo servidor são controlados por escopo para que sessões
restritas ao pareamento ou exclusivas de nodes não recebam passivamente conteúdo de sessão
(`src/gateway/server-broadcast.ts`):

- Quadros de chat, agente e resultado de ferramenta (eventos `agent` transmitidos, eventos de resultado
  de ferramenta) exigem pelo menos `operator.read`. Sessões sem esse escopo ignoram
  completamente esses quadros.
- As transmissões `plugin.*` definidas por Plugins são restritas por padrão a `operator.write` ou
  `operator.admin`; entradas explícitas, como
  `plugin.approval.requested` / `plugin.approval.resolved`, usam
  `operator.approvals` em vez disso.
- Eventos de status/transporte (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão)
  permanecem irrestritos para que a integridade do transporte seja observável por todas as
  sessões autenticadas.
- Famílias desconhecidas de eventos de transmissão são controladas por escopo por padrão (falha fechada),
  a menos que um manipulador registrado as flexibilize explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente, portanto as transmissões
permanecem em ordem monotônica nesse socket, mesmo quando clientes diferentes veem
subconjuntos distintos do fluxo de eventos filtrados por escopo.

## Famílias de métodos RPC

`hello-ok.features.methods` é uma lista de descoberta conservadora criada a partir de
`src/gateway/server-methods-list.ts` e das exportações de métodos de Plugins/canais
carregados — não é um despejo gerado de todos os métodos, e alguns métodos (por
exemplo, `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
são intencionalmente excluídos da descoberta, embora sejam métodos reais e
invocáveis. Trate isso como descoberta de recursos, não como uma enumeração completa de
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway armazenado em cache ou verificado recentemente.
    - `diagnostics.stability` retorna o registrador recente e limitado de estabilidade de diagnóstico: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/Plugins e IDs de sessão. Não inclui texto de chat, corpos de Webhooks, saídas de ferramentas, corpos brutos de solicitações/respostas, tokens, cookies ou segredos. Exige `operator.read`.
    - `status` retorna o resumo do Gateway no estilo `/status`; campos confidenciais somente para clientes operadores com escopo de administrador.
    - `gateway.identity.get` retorna a identidade de dispositivo do Gateway usada pelos fluxos de retransmissão e pareamento.
    - `system-presence` retorna o snapshot de presença atual dos dispositivos de operador/node conectados.
    - `system-event` acrescenta um evento de sistema e pode atualizar/transmitir o contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` ativa ou desativa o processamento de Heartbeat no Gateway.
    - `gateway.suspend.prepare` cria uma concessão curta de suspensão cooperativa somente quando o trabalho monitorado do Gateway está ocioso. `gateway.suspend.status` verifica essa concessão, e `gateway.suspend.resume` a libera após a retomada ou uma operação de host abortada.

  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitidos em tempo de execução. Consulte as visualizações de “`models.list`” abaixo.
    - `usage.status` retorna resumos das janelas de uso/cotas restantes dos provedores.
    - `usage.cost` retorna resumos agregados do uso de custos para um intervalo de datas. Passe `agentId` para um agente ou `agentScope: "all"` para agregar os agentes configurados.
    - `doctor.memory.status` retorna a prontidão da memória vetorial/dos embeddings em cache para o workspace do agente padrão ativo. Passe `{ "probe": true }` ou `{ "deep": true }` apenas para realizar um ping explícito no provedor de embeddings ativo. Passe `{ "agentId": "agent-id" }` para restringir as estatísticas do armazenamento do Dreaming ao workspace de um agente; omiti-lo agrega os workspaces do Dreaming configurados.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` aceitam `{ "agentId": "agent-id" }` opcional; quando omitido, operam no workspace do agente padrão configurado.
    - `doctor.memory.remHarness` retorna uma prévia limitada e somente leitura do ambiente REM para clientes remotos do plano de controle, incluindo caminhos do workspace, trechos da memória, Markdown fundamentado renderizado e candidatos a promoção profunda. Exige `operator.read`.
    - `sessions.usage` retorna resumos de uso por sessão. Passe `agentId` para um agente ou `agentScope: "all"` para listar os agentes configurados em conjunto.
      Ambos os métodos de uso aceitam `mode: "specific"` com um `timeZone` da IANA para limites e agrupamentos de dias do calendário compatíveis com o horário de verão. `utcOffset` continua compatível com clientes mais antigos e serve como alternativa quando o runtime do Gateway não reconhece o fuso solicitado.
    - `sessions.usage.timeseries` retorna o uso em série temporal de uma sessão.
    - `sessions.usage.logs` retorna entradas do log de uso de uma sessão.

  </Accordion>

  <Accordion title="Canais e auxiliares de login">
    - `channels.status` retorna resumos de status de canais/Plugins integrados e incluídos.
    - `channels.logout` encerra a sessão de um canal/conta específico quando o canal oferece suporte.
    - `web.login.start` inicia um fluxo de login por QR/web para o provedor atual de canal web compatível com QR.
    - `web.login.wait` aguarda a conclusão desse fluxo e inicia o canal em caso de sucesso.
    - `push.test` envia uma notificação push de teste por APNs para um node iOS registrado.
    - `voicewake.get` retorna os acionadores de palavra de ativação armazenados.
    - `voicewake.set` atualiza os acionadores de palavra de ativação e transmite a alteração.

  </Accordion>

  <Accordion title="Gerenciamento de Plugins">
    - `plugins.list` (`operator.read`) retorna o inventário de Plugins instalados, além de seleções oficiais organizadas localmente, diagnósticos e se o modo de instalação atual permite modificações.
    - `plugins.search` (`operator.read`) pesquisa famílias de Plugins de código e Plugins de pacote instaláveis do ClawHub. Passe `query` não vazio e `limit` opcional de 1 a 100.
    - `plugins.install` (`operator.admin`) instala uma entrada oficial do catálogo com `{ source: "official", pluginId }` ou um pacote do ClawHub com `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. As instalações do ClawHub preservam as verificações de confiança, integridade e política de instalação do Gateway. Instalações bem-sucedidas exigem a reinicialização do Gateway.
    - `plugins.setEnabled` (`operator.admin`) altera a política de ativação de um Plugin instalado usando `{ pluginId, enabled }`. A resposta inclui a entrada atualizada do catálogo, metadados de reinicialização e quaisquer avisos de seleção de slot.
    - `plugins.uninstall` (`operator.admin`) remove um Plugin instalado externamente com `{ pluginId }`: referências de configuração, o registro de instalação e os arquivos gerenciados. Plugins incluídos não podem ser desinstalados, apenas desativados. A resposta lista as ações de remoção e sempre exige a reinicialização do Gateway.

  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é a RPC de entrega de saída direta para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o final configurado do log de arquivo do Gateway, com controles de cursor/limite e máximo de bytes.

  </Accordion>

  <Accordion title="Terminal do operador">
    - `terminal.open` inicia um PTY do host para um `agentId` explícito ou para o agente padrão e retorna o agente resolvido, o diretório de trabalho, o shell e o estado de confinamento.
    - `terminal.input`, `terminal.resize` e `terminal.close` operam somente em sessões pertencentes à conexão que faz a chamada.
    - `terminal.upload` aceita um arquivo em base64 de até 16 MiB, armazena-o em um diretório temporário privado por 24 horas no Gateway da sessão ou no host do nó emparelhado e retorna o caminho absoluto. O chamador ainda precisa colar ou usar esse caminho de outra forma; a RPC nunca grava uma entrada no terminal nem executa um comando.
    - Os eventos `terminal.data` e `terminal.exit` são transmitidos somente para a conexão que possui a sessão.
    - As sessões cuja conexão é interrompida são desanexadas, não encerradas: elas permanecem disponíveis para reanexação por `gateway.terminal.detachedSessionTimeoutSeconds` (padrão 300; `0` restaura o encerramento ao desconectar), enquanto a saída recente se acumula em um buffer limitado no lado do servidor.
    - `terminal.list` retorna sessões que podem ser anexadas; `terminal.attach` vincula novamente uma sessão ativa ou desanexada à conexão que faz a chamada e retorna o buffer de reprodução (assunção de controle no estilo tmux — um proprietário ativo anterior recebe `terminal.exit` com o motivo `detached`); `terminal.text` lê o buffer como texto simples sem anexar.
    - Cada método de terminal exige `operator.admin`; `gateway.terminal.enabled` deve ser explicitamente verdadeiro. Agentes totalmente isolados são recusados, e uma alteração na política do agente fecha os PTYs existentes e em andamento, inclusive os desanexados.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` retorna o catálogo somente leitura de provedores do Talk para fala, transcrição por streaming e voz em tempo real: IDs canônicos de provedores, aliases do registro, rótulos, estado de configuração, um resultado opcional `ready` no nível do grupo, IDs expostos de modelos/vozes, modos canônicos, transportes, estratégias do cérebro e sinalizadores de áudio/recursos em tempo real, sem retornar segredos dos provedores nem alterar a configuração global. Os gateways atuais definem `ready` após aplicar a seleção de provedor em tempo de execução; em gateways mais antigos, trate sua ausência como não verificada.
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` cria uma sessão do Talk pertencente ao Gateway para `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Para `stt-tts/managed-room`, os chamadores de `operator.write` que passam `sessionKey` também devem passar `spawnedBy` para obter visibilidade da chave de sessão com escopo; a criação de `sessionKey` sem escopo e `brain: "direct-tools"` exigem `operator.admin`.
    - `talk.session.join` valida um token de sessão de sala gerenciada, emite `session.ready` ou `session.replaced` conforme necessário e retorna metadados da sala/sessão, além de eventos recentes do Talk, mas nunca o token em texto simples nem seu hash.
    - `talk.session.appendAudio` acrescenta áudio de entrada PCM em base64 às sessões de retransmissão em tempo real e transcrição pertencentes ao Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` controlam o ciclo de vida dos turnos de salas gerenciadas, com rejeição de turnos obsoletos antes da limpeza do estado.
    - `talk.session.cancelOutput` interrompe a saída de áudio do assistente, principalmente para interrupção de fala condicionada por VAD em sessões de retransmissão do Gateway.
    - `talk.session.submitToolResult` conclui uma chamada de ferramenta do provedor emitida por uma sessão de retransmissão em tempo real pertencente ao Gateway. A solicitação aguarda qualquer sinal de conclusão assíncrona exposto pela ponte do provedor; envios com falha mantêm a execução vinculada ativa e não emitem um evento de resultado de ferramenta bem-sucedido. Passe `options: { willContinue: true }` para uma saída intermediária da ferramenta ou `options: { suppressResponse: true }` quando a ponte do provedor anunciar compatibilidade com supressão e o resultado não deva iniciar outra resposta.
    - `talk.session.steer` envia o controle de voz da execução ativa para uma sessão do Talk baseada em agente e pertencente ao Gateway: `{ sessionId, text, mode? }`, em que `mode` é `status`, `steer`, `cancel` ou `followup`; quando omitido, o modo é classificado com base no texto falado.
    - `talk.session.close` fecha uma sessão de retransmissão, transcrição ou sala gerenciada pertencente ao Gateway e emite eventos terminais do Talk.
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes da WebChat/Control UI.
    - `talk.client.create` cria uma sessão de provedor em tempo real pertencente ao cliente usando `webrtc` ou `provider-websocket`, enquanto o Gateway controla a configuração, as credenciais, as instruções e a política de ferramentas.
    - `talk.client.toolCall` permite que transportes em tempo real pertencentes ao cliente encaminhem chamadas de ferramentas do provedor para a política do Gateway. A primeira ferramenta compatível é `openclaw_agent_consult`; os clientes recebem um ID de execução e aguardam os eventos normais do ciclo de vida do chat antes de enviar o resultado da ferramenta específico do provedor.
    - `talk.client.steer` envia o controle de voz da execução ativa para transportes em tempo real pertencentes ao cliente. O Gateway resolve a execução incorporada ativa com base em `sessionKey` e retorna um resultado estruturado de aceitação/rejeição, em vez de descartar silenciosamente o direcionamento.
    - `talk.event` é o único canal de eventos do Talk para adaptadores em tempo real, transcrição, STT/TTS, salas gerenciadas, telefonia e reuniões.
    - `talk.speak` sintetiza fala por meio do provedor de fala ativo do Talk.
    - `tts.status` retorna o estado de ativação do TTS, o provedor ativo, os provedores alternativos e o estado de configuração dos provedores.
    - `tts.providers` retorna o inventário visível de provedores de TTS.
    - `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
    - `tts.setProvider` atualiza o provedor de TTS preferencial.
    - `tts.convert` executa uma conversão avulsa de texto em fala.
    - `tts.speak` (`operator.write`) renderiza `text` não vazio com a cadeia configurada de provedores gerais de TTS e retorna um clipe inteiro em linha como `audioBase64`, além dos metadados `provider` e, opcionalmente, `outputFormat`, `mimeType` e `fileExtension`. Ao contrário de `tts.convert`, ele não retorna um caminho local do Gateway; ao contrário de `talk.speak`, ele não exige um provedor do Talk. Texto acima de `messages.tts.maxTextLength` retorna `INVALID_REQUEST`; falhas de síntese retornam `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente as SecretRefs ativas e substitui o estado dos segredos em tempo de execução somente em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos de destino de comando para um conjunto específico de comandos/destinos.
    - `config.get` retorna o snapshot atual da configuração em disco, o `hash` bruto do arquivo raiz, o `configRevisionHash` resolvido e o `appliedConfigHash` opcional da revisão resolvida aceita pelo runtime ativo do Gateway.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial da configuração. A substituição destrutiva de arrays exige o caminho afetado em `replacePaths`; arrays aninhados sob entradas de array usam caminhos `[]`, como `agents.list[].skills`.
    - `config.apply` valida e substitui o payload completo da configuração.
    - `config.schema` retorna o payload do esquema de configuração ativo usado pela Control UI e pelas ferramentas da CLI: esquema, `uiHints`, versão, metadados de geração e metadados de esquema de plugins e canais quando podem ser carregados. Ele inclui metadados `title` / `description` provenientes dos mesmos rótulos/textos de ajuda da UI, incluindo ramificações de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando há documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de esquema superficial, dica correspondente + `hintPath`, `reloadKind` opcional e resumos dos filhos imediatos para detalhamento na UI/CLI. `reloadKind` é `restart`, `hot` ou `none` (`src/config/schema.ts`) e reflete o planejador de recarregamento da configuração do Gateway para o caminho solicitado. Os nós do esquema de consulta mantêm a documentação voltada ao usuário e os campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Os resumos dos filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, `reloadKind` opcional, além dos `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização somente se a atualização for bem-sucedida; chamadores com uma sessão podem incluir `continuationMessage` para que a inicialização retome um turno adicional do agente por meio da fila de continuação da reinicialização. As atualizações do gerenciador de pacotes e as atualizações supervisionadas do checkout do Git pelo plano de controle usam uma transferência desanexada para um serviço gerenciado, em vez de substituir a árvore de pacotes ou alterar o checkout/resultado da compilação dentro do Gateway ativo. Uma transferência iniciada retorna `ok: true` com `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; transferências indisponíveis ou com falha retornam `ok: false` com `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, além de `handoff.command` quando é necessária uma atualização manual pelo shell. Indisponível significa que o OpenClaw não possui um limite de supervisão seguro ou uma identidade de serviço durável, como `OPENCLAW_SYSTEMD_UNIT` para systemd. Durante uma transferência iniciada, o sentinela de reinicialização pode informar brevemente `stats.reason: "restart-health-pending"`; a continuação é adiada até que a CLI verifique o Gateway reiniciado e grave o sentinela final `ok`.
    - `update.status` atualiza e retorna o sentinela mais recente de reinicialização de atualização, incluindo a versão em execução após a reinicialização, quando disponível.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de integração por RPC via WS.

  </Accordion>

  <Accordion title="Auxiliares de agente e espaço de trabalho">
    - `agents.list` retorna as entradas de agente configuradas, incluindo metadados efetivos de modelo e runtime.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a vinculação do espaço de trabalho.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de inicialização do espaço de trabalho expostos a um agente.
    - `audit.activity.list` retorna o registro de atividades versionado que contém apenas metadados; `audit.list` continua sendo o RPC de execução/ferramenta seguro para compatibilidade.
    - `agents.workspace.list` e `agents.workspace.get` (`operator.read`) fornecem navegação paginada e somente leitura pelo diretório do espaço de trabalho de um agente para clientes no domínio de operadores confiáveis descrito em [Escopos de operador](/pt-BR/gateway/operator-scopes). As solicitações aceitam apenas caminhos relativos ao espaço de trabalho; as leituras permanecem confinadas à raiz do espaço de trabalho após a resolução do caminho real (escapes por links simbólicos e links físicos são rejeitados), têm limite de tamanho e são restritas a texto UTF-8 e tipos de imagem comuns (base64). As respostas não expõem o caminho do espaço de trabalho no host. Não há operações de gravação neste namespace.
    - `tasks.list`, `tasks.get` e `tasks.cancel` expõem o registro de tarefas do Gateway a clientes SDK e operadores. Consulte [RPCs do registro de tarefas](#task-ledger-rpcs) abaixo.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` expõem resumos e downloads de artefatos derivados da transcrição para um escopo explícito `sessionKey`, `runId` ou `taskId`. As consultas de execução e tarefa determinam no servidor a sessão proprietária e retornam apenas mídia da transcrição com procedência correspondente; fontes de URL locais ou não seguras retornam downloads não compatíveis em vez de serem buscadas pelo servidor.
    - `environments.list` e `environments.status` preservam a descoberta de ambientes locais do Gateway e de Node. Workers de nuvem configurados e registros duráveis deixados por perfis anteriores adicionam metadados `worker` com `providerId`, `leaseId` opcional, `state`, `ageMs`, `idleMs` opcional e `attachedSessionIds`. Os estados do ciclo de vida do worker são `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` e `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) provisiona um worker usando um perfil configurado de provedor de plugin; novas tentativas com a mesma chave reutilizam a operação durável. `environments.destroy` (`{ environmentId }`) solicita o desprovisionamento idempotente de um ambiente de worker durável. Ambos exigem `operator.admin`, são gravações do plano de controle e retornam o mesmo formato de resumo de ambiente usado pelas respostas de status.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou uma sessão.
    - `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando disponível.

  </Accordion>

  <Accordion title="Controle de sessões">
    - `sessions.list` retorna o índice atual de sessões, incluindo metadados `agentRuntime` por linha quando um backend de runtime de agente está configurado. Quando o posicionamento em workers de nuvem está habilitado ou existe um estado de recuperação durável, as linhas de sessão também incluem um estado fechado `placement` (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` ou `failed`), além de campos específicos do estado referentes a ambiente, época do proprietário, espaço de trabalho, pacote, cursor de ACK ou recuperação.
    - `sessions.subscribe` e `sessions.unsubscribe` ativam ou desativam as assinaturas de eventos de alteração de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` ativam ou desativam as assinaturas de eventos de transcrição/mensagem para uma sessão. Passe `includeApprovals: true` para também receber eventos de ciclo de vida `session.approval` sanitizados referentes a aprovações cujo público persistido inclua exatamente essa sessão e cuja vinculação de revisor autorize o cliente assinante. A resposta da assinatura passa então a incluir um `approvalReplay` pendente e limitado; ele é autoritativo quando `truncated` é falso. A adesão é feita por chamada de assinatura, não é persistente: assinar novamente a mesma sessão sem `includeApprovals: true` remove uma assinatura de aprovação existente. Além da autoridade normal de leitura da sessão, essa adesão exige `operator.admin` ou `operator.approvals` em um dispositivo pareado.
    - `sessions.preview` retorna visualizações prévias limitadas de transcrições para chaves de sessão específicas.
    - `sessions.describe` retorna uma linha de sessão do Gateway para uma chave de sessão exata.
    - `sessions.resolve` resolve ou canonicaliza um destino de sessão.
    - `sessions.create` cria uma nova entrada de sessão. Os valores opcionais `model` e `thinkingLevel` persistem atomicamente as substituições iniciais de modelo e raciocínio. `worktree: true` provisiona uma árvore de trabalho gerenciada; `worktreeBaseRef`/`worktreeName` opcionais selecionam a referência base e o nome da branch, e `execNode` (`operator.admin`) vincula a execução da sessão a um host Node. A árvore de trabalho criada é reproduzida no resultado e persistida na linha da sessão (`worktree: { id, branch, repoRoot }`). Quando a entrada é criada, mas seu `chat.send` inicial aninhado é rejeitado, o resultado bem-sucedido inclui `runStarted: false` e `runError`; os clientes podem preservar o prompt e tentar novamente usando a chave de sessão retornada.
    - `sessions.dispatch` (`operator.admin`) move uma sessão local existente do OpenClaw com uma árvore de trabalho gerenciada pertencente à sessão para um perfil configurado de worker de nuvem. Passe `{ key, profileId, agentId? }`. O método não existe quando nenhum perfil de worker está configurado, encerra a admissão de turnos locais antes de aguardar a conclusão do trabalho ativo e só retorna depois que o posicionamento atinge a propriedade do worker `active`. O despacho é unidirecional; o retorno do worker para o ambiente local não faz parte deste RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` e `sessions.groups.delete` gerenciam o catálogo de grupos de sessões personalizados pertencente ao Gateway (nomes + ordem de exibição). A associação permanece no campo `category` de cada sessão; renomear e excluir atualizam as sessões integrantes no servidor.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interrupção e redirecionamento para uma sessão ativa.
    - `sessions.abort` interrompe o trabalho ativo de uma sessão. Passe `key` com `runId` opcional, ou apenas `runId` para execuções ativas que o Gateway consiga associar a uma sessão.
    - `sessions.patch` atualiza metadados/substituições da sessão e informa o modelo canônico resolvido, além do `agentRuntime` efetivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` realizam a manutenção da sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução do chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição em clientes de UI: tags de diretivas embutidas são removidas do texto visível; payloads XML de chamadas de ferramenta em texto simples (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta) e tokens de controle de modelo ASCII/de largura completa que tenham vazado são removidos; linhas do assistente contendo exclusivamente tokens de silêncio (`NO_REPLY` / `no_reply` exatos) são omitidas; e linhas grandes demais podem ser substituídas por placeholders.
    - `chat.message.get` é o leitor aditivo e limitado da mensagem completa para uma única entrada visível da transcrição. Passe `sessionKey`, `agentId` opcional quando a seleção da sessão tiver escopo de agente e um `messageId` de transcrição anteriormente exposto por `chat.history`; o Gateway retorna a mesma projeção normalizada para exibição sem o limite de truncamento do histórico leve, quando a entrada armazenada ainda estiver disponível e não for grande demais.
    - `chat.toolTitles` retorna títulos curtos de finalidade para chamadas de ferramenta renderizadas na UI de Controle (em lote, no máximo 24 itens com entradas limitadas). O recurso exige adesão por meio de `gateway.controlUi.toolTitles` (desativado por padrão); Gateways desativados respondem `{ titles: {}, disabled: true }` sem chamar o modelo para que os clientes parem de solicitar. Quando ativados, os títulos usam o roteamento padrão do modelo utilitário: um `utilityModel` configurado explicitamente (uma decisão do operador que, como todas as tarefas utilitárias, pode enviar conteúdo limitado da tarefa ao provedor escolhido) ou, caso contrário, o modelo pequeno padrão declarado pelo provedor da sessão, para que nenhum novo destino de saída surja implicitamente; um `utilityModel` vazio os desativa por completo. Os títulos nunca recorrem ao modelo principal. Os resultados são armazenados em cache no banco de dados de estado por agente, usando como chave o nome da ferramenta + entrada, portanto visualizações repetidas nunca geram nova cobrança pelas mesmas chamadas.
    - `chat.send` aceita `fastMode: "auto"` de um único turno para usar o modo rápido em chamadas de modelo iniciadas antes do limite automático e, depois, iniciar novas tentativas, fallbacks, resultados de ferramenta ou chamadas de continuação posteriores sem o modo rápido. O limite padrão é de 60 segundos (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) e pode ser configurado por modelo com `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Um chamador `chat.send` pode passar `fastAutoOnSeconds` de um único turno para substituir o limite nessa solicitação. Passe `queueMode` (`steer`, `followup`, `collect` ou `interrupt`) para substituir o modo de fila armazenado apenas nesta solicitação; ações explícitas de redirecionamento da UI de Controle usam `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivos">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.setupCode` cria um código de configuração móvel e, por padrão, uma URL de dados de QR code em PNG. Ele exige `operator.admin` e é intencionalmente omitido da descoberta anunciada. O resultado inclui `setupCode`, `qrDataUrl` opcional, `gatewayUrl`, o rótulo não secreto `auth` e `urlSource`.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.pair.rename` atribui um rótulo de operador (`{ deviceId, label }`) que tem preferência sobre o nome de exibição informado pelo cliente e persiste após o reparo ou a nova aprovação do dispositivo.
    - `device.token.rotate` faz a rotação de um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites de sua função aprovada e do escopo do chamador.

    O código de configuração incorpora uma credencial de inicialização de curta duração. Os clientes não devem
    registrá-la em logs nem mantê-la após o fluxo de pareamento.

  </Accordion>

  <Accordion title="Emparelhamento de Node, invocação e trabalho pendente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.remove` abrangem as aprovações de recursos do Node. `node.pair.request` e `node.pair.verify` foram removidos na versão 2026.7 junto com o armazenamento independente de emparelhamento de Node; as solicitações pendentes são criadas pelo Gateway durante as conexões dos Nodes.
    - `node.list` e `node.describe` retornam o estado conhecido/conectado do Node.
    - `node.rename` atualiza o rótulo de um Node emparelhado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma solicitação de invocação.
    - `mcp.tools.call.v1` é o comando do host de Node sem interface gráfica para chamar uma ferramenta MCP local do Node configurada. Ele é transportado por `node.invoke`, exige que o Node declare o comando e permanece sujeito à aprovação de emparelhamento e a `gateway.nodes.denyCommands`.
    - `node.event` transporta eventos originados pelo Node de volta ao Gateway.
    - `node.pluginTools.update` é o único caminho de publicação para substituir os descritores de ferramentas de Plugin/MCP visíveis ao agente do Node conectado; os parâmetros de `connect` não os transportam.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila do Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.

  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `approval.get` e `approval.resolve` são os métodos de aprovação durável independentes de tipo (escopo `operator.approvals`). `approval.get` retorna uma projeção sanitizada, pendente ou terminal retida, com um `urlPath` estável; `approval.resolve` aceita o ID de aprovação canônico, um `kind` explícito e uma decisão, aplica a resolução em que a primeira resposta prevalece e sempre retorna o resultado canônico registrado.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` abrangem solicitações de aprovação de execução de uso único, além da consulta/reprodução de aprovações pendentes. Eles são adaptadores de limite de protocolo sobre o mesmo registro de aprovações durável.
    - `exec.approval.waitDecision` aguarda uma aprovação de execução pendente e retorna a decisão final (ou `null` em caso de tempo limite).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam instantâneos da política de aprovação de execução do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política de aprovação de execução local do Node por meio de comandos de retransmissão do Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` abrangem fluxos de aprovação definidos por Plugins.

  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de ativação; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - `cron.run` continua sendo uma RPC no estilo de enfileiramento para execuções manuais. Os clientes que precisam de semântica de conclusão devem ler o `runId` retornado e consultar `cron.runs` periodicamente.
    - `cron.runs` aceita um filtro `runId` opcional e não vazio para que os clientes possam acompanhar uma execução manual enfileirada sem disputar com outras entradas do histórico referentes ao mesmo trabalho.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consulte [Métodos auxiliares do operador](#operator-helper-methods) abaixo.

  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de conversa da interface, como `chat.inject`, e outros eventos de conversa
  exclusivos da transcrição. No protocolo v4, as cargas úteis delta transportam `deltaText`; `message` continua sendo
  o instantâneo cumulativo do assistente. Substituições que não são prefixos definem
  `replace=true` e usam `deltaText` como texto de substituição.
- `session.message`, `session.operation`, `session.tool`: atualizações de transcrição, operação
  de sessão em andamento e fluxo de eventos de uma sessão assinada.
- `session.approval`: estado sanitizado de aprovações pendentes e terminais para um
  assinante de sessão exata que aderiu explicitamente. As aprovações filhas usam o
  público ancestral persistido; os eventos nunca alteram transcrições nem ativam agentes.
- `sessions.changed`: o índice ou os metadados da sessão foram alterados.
- `presence`: atualizações do instantâneo de presença do sistema.
- `tick`: evento periódico de manutenção de conexão/vitalidade.
- `health`: atualização do instantâneo de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/trabalho Cron.
- `shutdown`: notificação de encerramento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do emparelhamento de Node.
- `node.invoke.request`: difusão de solicitação de invocação de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparelhado.
- `voicewake.changed`: a configuração do acionador por palavra de ativação foi alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de execução.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da
  aprovação de Plugin.

### Métodos auxiliares de Node

Os Nodes podem chamar `skills.bins` para obter a lista atual de executáveis de Skills
para verificações de permissão automática.

## RPC do livro-razão de auditoria

`audit.activity.list` oferece aos clientes operadores uma visualização estável, da mais recente para a mais antiga, dos metadados do ciclo de vida
de execuções de agentes, ações de ferramentas e mensagens com adesão opcional. Ela exige
`operator.read`. As consultas excluem registros com mais de 30 dias, e o livro-razão
SQLite compartilhado é limitado a 100.000 registros. As linhas expiradas são excluídas durante
a inicialização do Gateway, a manutenção a cada hora e gravações posteriores. Consulte
[Histórico de auditoria](/pt-BR/gateway/audit) para conhecer o modelo de dados e a semântica de privacidade.

- Parâmetros: `agentId`, `sessionKey` ou `runId` exato e opcional; `kind` opcional
  (`"agent_run"`, `"tool_action"` ou `"message"`); `status` opcional
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` ou `"unknown"`); `direction` de mensagem opcional (`"inbound"` ou
  `"outbound"`) e `channel` exato; limites inclusivos opcionais `after` / `before`
  em milissegundos Unix; `limit` opcional de `1` a `500`; e a string
  `cursor` opcional da página anterior.
- Resultado: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

A união nomeada de resultados V1 tem esquemas separados para execução de agente, ação de ferramenta, mensagem recebida
e mensagem enviada. O discriminador `eventType` é, respectivamente,
`agent_run`, `tool_action`, `inbound_message` ou `outbound_message`; `kind` e
`direction` de mensagem permanecem disponíveis para filtragem e exibição. Cada evento tem
`schemaVersion: 1` inteiro. As referências de identidade de mensagem usam o formato
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` exato; um ID de ator remetente do canal
usa o mesmo formato.

Todas as variantes exigem `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` e
`redaction`. Os campos das variantes são:

| `eventType`        | Campos obrigatórios                                               | Campos opcionais                                                                                                                |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, referências de identidade, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, referências de identidade, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Os enums fechados de mensagem são:

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
  ou `no_visible_payload`. Um adaptador que não retorna identidade da plataforma é
  `unknown`, pois o efeito colateral externo não pode ser refutado.
- `deliveryKind`: `text`, `media` ou `other`; `failureStage`:
  `platform_send`, `queue` ou `unknown`.

Os campos terminais são correlacionados, não opcionalmente independentes:

| Variante         | Mapeamento terminal                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Execução de agente | `started` não tem `errorCode`; cada status concluído sem sucesso exige seu código `run_*` correspondente.                                                                 |
| Ação de ferramenta | `started` e sucesso não têm `errorCode`; cada outro status concluído exige seu código `tool_*` correspondente.                                                       |
| Mensagem recebida | sucesso = `completed`; bloqueio = `skipped`; falha = `failed` mais `message_processing_failed`. `reasonCode`, quando presente, deve pertencer a essa família terminal. |
| Mensagem enviada | sucesso = `sent`; bloqueio = `suppressed` mais `reasonCode`; falha = `failed` mais `errorCode` e `failureStage`; desconhecido = `unknown` mais `failureStage`.      |

Cada evento de atividade inclui um id de evento estável, uma sequência monotônica do ledger,
uma sequência do evento de origem, carimbo de data/hora, ator, ação, status, inteiro
`schemaVersion: 1` e `redaction: "metadata_only"`. Registros de execução e ferramenta
exigem a proveniência do agente e da execução e podem incluir a proveniência da sessão. Registros de
mensagens podem incluir ids do agente e da execução, mas intencionalmente nunca incluem
`sessionKey` ou `sessionId`; portanto, o filtro de consulta `sessionKey` se aplica
somente às linhas de execução e ferramenta. Eventos de ferramenta podem incluir o id da chamada da ferramenta e o nome da ferramenta.

Registros de mensagens usam `message.inbound.processed` ou
`message.outbound.finished` e adicionam direção, canal, tipo de conversa,
resultado normalizado e, opcionalmente, tipo de entrega, estágio da falha, duração,
contagem de resultados, código do motivo e pseudônimos com chave, locais da instalação,
para conta/conversa/mensagem/destino. Esses pseudônimos auxiliam na
correlação, mas não constituem anonimização: o banco de dados de estado contém a chave deles,
enquanto as exportações de RPC e CLI não. O ledger não armazena prompts, corpos de mensagens,
argumentos de ferramentas, resultados de ferramentas, saída de comandos ou texto bruto de erros.
Os valores `sessionKey` de execução/ferramenta permanecem como metadados brutos de correlação e podem incorporar
ids de contas ou pares da plataforma; os registros de mensagens omitem chaves de sessão.

Para linhas de entrada, `durationMs` mede o despacho do núcleo até seu estado terminal e
`resultCount` conta payloads finalizados de ferramenta, bloco e resposta na fila. Para
linhas de saída, `durationMs` abrange a responsabilidade pela entrega até a confirmação,
fila de mensagens mortas ou reconciliação (incluindo o tempo de espera na fila), e `resultCount`
conta envios físicos identificados à plataforma. `deliveryKind`, quando presente,
descreve o payload efetivo após hooks e renderização; linhas suprimidas ou
ambíguas devido a falha omitem esse valor.

A cobertura atual de mensagens inclui mensagens de entrada aceitas que chegam ao
despacho do núcleo, incluindo resultados de duplicação/terminais do núcleo. A cobertura de saída grava
uma linha terminal por payload de resposta lógico original que chega à entrega durável
compartilhada; a fragmentação e a distribuição em leque do adaptador são agregadas em `resultCount`. Envios
enfileirados, passíveis de nova tentativa ou ambíguos são registrados somente após confirmação, fila
de mensagens mortas ou reconciliação. Caminhos locais de Plugin e de envio direto que ignoram esses
limites compartilhados ainda não são cobertos. A fila limitada de workers funciona em regime de melhor esforço
e pode descartar registros em caso de falha ou saturação; portanto, essa superfície não é um
arquivo de conformidade sem perdas.

O registro fica ativado por padrão e é controlado por
[`audit.enabled`](/pt-BR/gateway/configuration-reference#audit). O registro de mensagens é
controlado separadamente por `audit.messages` e usa `"off"` como padrão. Quando
o registro está desativado, `audit.activity.list` continua fornecendo registros gravados
anteriormente até que expirem.

Os esquemas fornecidos de solicitação e resultado de `audit.list` e de `AuditEvent`
permanecem inalterados e retornam somente registros de execução do agente e de ações de ferramentas. Novos
clientes de operador devem chamar `audit.activity.list` quando o Gateway o anunciar. Gateways mais
antigos podem informar `unknown method: audit.activity.list` ou, como
a autorização precedia a busca do método nas versões fornecidas, `missing scope:
operator.admin` para uma solicitação com escopo de leitura. Trate o último como ausência do método
somente quando o método não tiver sido anunciado. Um cliente poderá então tentar novamente `audit.list`
somente quando seus filtros não exigirem compatibilidade com tipo, direção ou canal
da mensagem.

Use [`openclaw audit`](/pt-BR/cli/audit) para consultas de texto e exportações JSON limitadas.

## RPCs do ledger de tarefas

Clientes de operador inspecionam e cancelam registros de tarefas em segundo plano do gateway por meio
dos RPCs do ledger de tarefas (`packages/gateway-protocol/src/schema/tasks.ts`). Eles
retornam resumos de tarefas sanitizados, não o estado bruto do runtime.

- `tasks.list` exige `operator.read`.
  - Parâmetros: `status` opcional (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou uma matriz desses status,
    `agentId` opcional, `sessionKey` opcional, `limit` opcional de `1` a
    `500` e a string opcional `cursor`.
  - Resultado: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` exige `operator.read`.
  - Parâmetros: `{ "taskId": string }`.
  - Resultado: `{ "task": TaskSummary }`.
  - Ids de tarefas ausentes retornam o formato de erro de não encontrado do gateway.
- `tasks.cancel` exige `operator.write`.
  - Parâmetros: `{ "taskId": string, "reason"?: string }`.
  - Resultado: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` informa se o ledger tinha uma tarefa correspondente. `cancelled`
    informa se o runtime aceitou ou registrou o cancelamento.

`TaskSummary` inclui `id`, `status` e metadados opcionais: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, carimbos de data/hora, progresso,
resumo terminal e texto de erro sanitizado. `agentId` identifica o agente
que executa a tarefa; `sessionKey` e `ownerKey` preservam o contexto do solicitante e de
controle.

## Métodos auxiliares do operador

- `commands.list` (`operator.read`) obtém o inventário de comandos do runtime para
  um agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - `scope` controla qual superfície é o destino do `name` primário: `text` retorna
    o token do comando de texto primário sem o `/` inicial; `native` e o
    caminho padrão `both` retornam nomes nativos que consideram o provedor, quando disponíveis.
  - `textAliases` contém aliases exatos de barra, como `/model` e `/m`.
  - `nativeName` contém o nome do comando nativo que considera o provedor, quando
    existe.
  - `provider` é opcional e afeta somente a nomenclatura nativa e a disponibilidade de comandos
    nativos de Plugin.
  - `includeArgs=false` omite da resposta os metadados serializados de argumentos.
- `tools.catalog` (`operator.read`) obtém o catálogo de ferramentas do runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: Plugin proprietário quando `source="plugin"`
  - `optional`: se uma ferramenta de Plugin é opcional
- `tools.effective` (`operator.read`) obtém o inventário efetivo de ferramentas do
  runtime para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto confiável do runtime da sessão no lado do servidor
    em vez de aceitar contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta é uma projeção derivada pelo servidor e com escopo de sessão do inventário
    ativo, incluindo ferramentas do núcleo, de Plugins, de canais e de servidores MCP já
    descobertos.
  - `tools.effective` é somente leitura para MCP: pode projetar um catálogo MCP
    de sessão já inicializada por meio da política final de ferramentas, mas não cria runtimes MCP,
    conecta transportes nem emite `tools/list`. Se não existir um catálogo já inicializado
    correspondente, a resposta poderá incluir um aviso como `mcp-not-yet-connected`,
    `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - As entradas efetivas de ferramentas usam `source="core"`, `source="plugin"`,
    `source="channel"` ou `source="mcp"`.
- `tools.invoke` (`operator.write`) invoca uma ferramenta disponível por meio do
  mesmo caminho de política do gateway que `/tools/invoke`.
  - `name` é obrigatório. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` são opcionais.
  - Se `sessionKey` e `agentId` estiverem presentes, o agente da sessão resolvida
    deverá corresponder a `agentId`.
  - Wrappers do núcleo exclusivos do proprietário, como `cron`, `gateway` e `nodes`, exigem
    identidade de proprietário/administrador (`operator.admin`), embora o próprio `tools.invoke`
    seja `operator.write`.
  - A resposta é um envelope voltado ao SDK com `ok`, `toolName`, o
    `output` opcional e campos `error` tipados. Recusas de aprovação ou política retornam
    `ok:false` no payload em vez de contornar o pipeline de políticas de ferramentas
    do gateway.
- `skills.status` (`operator.read`) obtém o inventário de Skills visível para um
  agente.
  - `agentId` é opcional; omita-o para ler o workspace padrão do agente.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração
    e opções de instalação sanitizadas, sem expor valores brutos de segredos.
- `skills.search` e `skills.detail` (`operator.read`) retornam metadados de
  descoberta do ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`
  (`operator.admin`) preparam um arquivo privado de skill antes de instalá-lo. Esse
  é um caminho separado de upload administrativo para clientes confiáveis, não o fluxo normal
  de instalação de skill do ClawHub, e fica desativado por padrão, a menos que
  `skills.install.allowUploadedArchives` esteja ativado.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    cria um upload vinculado a esse slug e valor de imposição.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` anexa bytes no
    deslocamento decodificado exato.
  - `skills.upload.commit({ uploadId, sha256? })` verifica o tamanho final e o
    SHA-256. O commit apenas finaliza o upload; ele não instala a skill.
  - Os arquivos de skill enviados são arquivos zip que contêm uma raiz `SKILL.md`. O
    nome do diretório interno do arquivo nunca seleciona o destino da instalação.
- `skills.install` (`operator.admin`) tem três modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace padrão do agente.
  - Modo de upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    instala um upload confirmado no diretório `skills/<slug>` do workspace
    padrão do agente. O slug e o valor de imposição devem corresponder à solicitação
    `skills.upload.begin` original. A operação é rejeitada, a menos que
    `skills.install.allowUploadedArchives` esteja ativado; a configuração não
    afeta instalações do ClawHub.
  - Modo de instalador do Gateway: `{ name, installId, timeoutMs? }` executa uma ação
    `metadata.openclaw.install` declarada no host do gateway. Clientes mais antigos ainda podem
    enviar `dangerouslyForceUnsafeInstall`; esse campo está obsoleto,
    é aceito somente para compatibilidade de protocolo e é ignorado. Use
    `security.installPolicy` para decisões de instalação pertencentes ao operador.
- `skills.update` (`operator.admin`) tem dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace padrão do agente.
  - O modo de configuração aplica patches aos valores de `skills.entries.<skillKey>`, como `enabled`,
    `apiKey` e `env`.

### Visualizações de `models.list`

`models.list` aceita um parâmetro `view` opcional
(`src/agents/model-catalog-visibility.ts`):

- Omitido ou `"default"`: se `agents.defaults.models` estiver configurado, a
  resposta será o catálogo permitido, incluindo modelos descobertos dinamicamente
  para entradas `provider/*`. Caso contrário, a resposta será o catálogo
  completo do Gateway.
- `"configured"`: comportamento dimensionado para seletores. Se `agents.defaults.models` estiver
  configurado, ele ainda terá precedência, incluindo a descoberta com escopo de provedor para
  entradas `provider/*`. Sem uma lista de permissões, a resposta usará entradas
  `models.providers.<provider>.models` explícitas, recorrendo ao catálogo
  completo somente quando não houver linhas de modelo configuradas.
- `"provider-config"`: inventário `models.providers.*.models` definido na origem,
  independente das listas de permissões do seletor. As linhas incluem recursos públicos dos modelos e
  disponibilidade que considera as rotas, mas omitem endpoints de provedores, material de autenticação e
  configuração de solicitações em tempo de execução.
- `"all"`: catálogo completo do Gateway, ignorando `agents.defaults.models`. Use em
  interfaces de diagnóstico/descoberta, não em seletores de modelo comuns.

## Aprovações de execução

- Quando uma solicitação de execução exige aprovação, o Gateway transmite
  `exec.approval.requested`.
- Os clientes do operador resolvem a solicitação chamando `exec.approval.resolve` (requer
  `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan`
  (metadados canônicos de `argv`/`cwd`/`rawCommand`/sessão). Solicitações sem
  `systemRunPlan` são rejeitadas.
- Após a aprovação, as chamadas `node.invoke system.run` encaminhadas reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador modificar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`,
  o Gateway rejeitará a execução em vez de confiar no conteúdo modificado.

## Fallback de entrega do agente

- As solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` (o padrão) mantém um comportamento estrito: destinos de entrega
  não resolvidos ou exclusivamente internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite o fallback para execução somente na sessão quando nenhuma
  rota externa de entrega puder ser resolvida (por exemplo, sessões internas/de webchat
  ou configurações ambíguas com vários canais).
- Os resultados finais de `agent` podem incluir `result.deliveryStatus` quando a entrega tiver sido
  solicitada, usando os mesmos status `sent`, `suppressed`, `partial_failed` e
  `failed` documentados em
  [`openclaw agent --json --deliver`](/pt-BR/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` e `MIN_PROBE_PROTOCOL_VERSION` ficam em
  `packages/gateway-protocol/src/version.ts`.
- Os clientes enviam `minProtocol` + `maxProtocol`. Os clientes de operador e de interface
  devem incluir o protocolo atual nesse intervalo; os clientes e servidores atuais executam
  o protocolo v4.
- Clientes autenticados com `role: "node"` e `client.mode: "node"`
  podem usar o protocolo de Node N-1 (atualmente v3). Sondas leves de reinicialização usam
  a mesma janela N-1. A autenticação de dispositivo, o pareamento, os escopos, a política de comandos e as aprovações
  de execução não são alterados por essa janela de compatibilidade. Os recursos e comandos de Node
  pertencentes a Plugins ficam indisponíveis até que o Node seja atualizado para o protocolo
  atual, pois suas superfícies hospedadas não fazem parte do contrato N-1.
- Os esquemas e modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

A implementação de referência do cliente fica em `packages/gateway-client/src/`
(o OpenClaw a encapsula por meio da fachada mínima `src/gateway/client.ts`). Esses
valores padrão são estáveis em todo o protocolo v4 e constituem a linha de base esperada para
clientes de terceiros.

| Constante                                 | Padrão                                                | Origem                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_CLIENT_PROTOCOL_VERSION`                        | `4`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_NODE_PROTOCOL_VERSION`                        | `3`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_PROBE_PROTOCOL_VERSION`                        | `3`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| Tempo limite da solicitação (por RPC)     | `30_000` ms                                 | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                                                   |
| Tempo limite de pré-autenticação/desafio de conexão | `15_000` ms                        | `packages/gateway-client/src/timeouts.ts` (a variável de ambiente `OPENCLAW_HANDSHAKE_TIMEOUT_MS` pode aumentar o limite conjunto do servidor/cliente) |
| Backoff inicial de reconexão              | `1_000` ms                                 | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                                                   |
| Backoff máximo de reconexão               | `30_000` ms                                 | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                                                   |
| Limite de repetição rápida após fechamento por token do dispositivo | `250` ms       | `packages/gateway-client/src/client.ts`                                                                                                        |
| Período de tolerância para interrupção forçada antes de `terminate()` | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                                        |
| Tempo limite padrão de `stopAndWait()` | `1_000` ms                                 | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                        |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms                | `packages/gateway-client/src/client.ts`                                                                                                        |
| Fechamento por tempo limite de tick       | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                                        |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`,
`policy.maxPayload` e `policy.maxBufferedBytes` em `hello-ok`; os clientes
devem respeitar esses valores em vez dos padrões anteriores ao handshake.

O cliente de referência permite que solicitações finitas controlem o próprio prazo configurado quando
cada solicitação pendente possui um. Uma solicitação `expectFinal` sem um
`timeoutMs` finito, qualquer solicitação com `timeoutMs: null` ou uma combinação de solicitações
finitas e ilimitadas mantém o watchdog de tick ativo. Se os eventos e
as respostas recebidos permanecerem silenciosos além do limite de tempo do tick, o cliente fechará o
socket com o código `4000`, rejeitará todas as solicitações pendentes e se reconectará. Ele
não repetirá as solicitações rejeitadas após a reconexão.

## Autenticação

- A autenticação do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do
  `gateway.auth.mode` configurado (`"none" | "token" | "password" | "trusted-proxy"`).
- Modos que contêm identidade, como o Tailscale Serve (`gateway.auth.allowTailscale: true`)
  ou `gateway.auth.mode: "trusted-proxy"` fora do loopback, atendem à verificação de autenticação
  da conexão por meio dos cabeçalhos da solicitação, em vez de `connect.params.auth.*`.
- O `gateway.auth.mode: "none"` de ingresso privado ignora completamente a autenticação
  da conexão por segredo compartilhado; não exponha esse modo em um ingresso público/não confiável.
- Após o pareamento, o gateway emite um token de dispositivo com escopo limitado
  à função + aos escopos da conexão, retornado em `hello-ok.auth.deviceToken`. Os clientes devem
  persistir esse token após qualquer conexão bem-sucedida.
- Ao se reconectar com esse token de dispositivo armazenado, também se deve reutilizar
  o conjunto de escopos aprovado e armazenado para esse token. Isso preserva o acesso de leitura/sondagem/status
  já concedido e evita que as reconexões sejam silenciosamente reduzidas a um escopo
  implícito mais restrito, exclusivo para administradores.
- Montagem da autenticação de conexão no cliente (`selectConnectAuth` em
  `packages/gateway-client/src/client.ts`):
  - `auth.password` é independente e sempre é encaminhado quando definido.
  - `auth.token` é preenchido na seguinte ordem de prioridade: primeiro o token compartilhado explícito,
    depois um `deviceToken` explícito e, em seguida, um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado somente quando nenhuma das opções anteriores resolveu
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A promoção automática de um token de dispositivo armazenado na única
    nova tentativa de `AUTH_TOKEN_MISMATCH` é restrita somente a endpoints confiáveis: loopback
    ou `wss://` com um `tlsFingerprint` fixado. Um `wss://` público sem fixação
    não se qualifica.
- A inicialização integrada por código de configuração retorna o
  `hello-ok.auth.deviceToken` do Node primário, além de um token de operador com limites definidos em
  `hello-ok.auth.deviceTokens`, para transferência móvel confiável. O token de operador
  inclui `operator.talk.secrets` para leituras da configuração nativa do Talk, mas
  exclui os escopos de alteração de pareamento e `operator.admin`.
- Enquanto uma inicialização por código de configuração fora da linha de base aguarda aprovação,
  os detalhes de `PAIRING_REQUIRED` incluem `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` e `pauseReconnect: false`. Continue se reconectando com o
  mesmo token de inicialização até que a solicitação seja aprovada ou o token se torne
  inválido.
- Persista `hello-ok.auth.deviceTokens` somente quando a conexão tiver usado autenticação
  de inicialização em um transporte confiável, como `wss://` ou pareamento por loopback/local.
- Se um cliente fornecer um `deviceToken` explícito ou um `scopes` explícito, esse
  conjunto de escopos solicitado pelo chamador continuará sendo autoritativo; os escopos armazenados em cache
  só serão reutilizados quando o cliente estiver reutilizando o token armazenado por dispositivo.
- Os tokens de dispositivo podem ser rotacionados/revogados por meio de `device.token.rotate` e
  `device.token.revoke` (requer `operator.pairing`). Rotacionar ou revogar um
  Node ou outra função que não seja de operador também requer `operator.admin`.
- `device.token.rotate` retorna metadados de rotação. Ele retorna o token de portador substituto
  somente para chamadas do mesmo dispositivo já autenticadas com esse
  token de dispositivo, para que clientes que usam apenas tokens possam persistir o substituto antes
  de se reconectarem. Rotações compartilhadas/de administrador não retornam o token de portador.
- A emissão, a rotação e a revogação de tokens permanecem limitadas ao conjunto de funções aprovado
  registrado na entrada de pareamento desse dispositivo; a alteração de tokens não pode expandir nem
  ter como alvo uma função de dispositivo que nunca tenha sido concedida pela aprovação do pareamento.
- Em sessões de token de dispositivo pareado, o gerenciamento de dispositivos fica restrito ao próprio dispositivo,
  a menos que o chamador também tenha `operator.admin`: chamadores que não sejam administradores podem gerenciar somente o
  token de operador da própria entrada de dispositivo. O gerenciamento de tokens de Node e de outras funções
  que não sejam de operador é exclusivo para administradores, mesmo no próprio dispositivo do chamador.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de escopos
  do token de operador de destino em relação aos escopos da sessão atual do chamador.
  Chamadores que não sejam administradores não podem rotacionar nem revogar um token de operador mais amplo do que aquele que
  já possuem.
- As falhas de autenticação incluem `error.details.code`, além de orientações de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: um de `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem realizar uma única nova tentativa limitada com um token
    armazenado em cache por dispositivo.
  - Se essa nova tentativa falhar, interrompa os ciclos de reconexão automática e apresente orientações
    sobre a ação necessária do operador.
- `AUTH_SCOPE_MISMATCH` significa que o token de dispositivo foi reconhecido, mas não
  abrange a função/os escopos solicitados. Não apresente isso como um token inválido; solicite
  que o operador refaça o pareamento ou aprove o contrato de escopo mais restrito/amplo.

## Identidade e pareamento de dispositivos

- Os Nodes devem incluir uma identidade de dispositivo estável (`device.id`) derivada da
  impressão digital de um par de chaves.
- Os Gateways emitem tokens por dispositivo + função.
- As aprovações de pareamento são obrigatórias para novos IDs de dispositivo, a menos que a
  aprovação automática local esteja habilitada.
- A aprovação automática de pareamento é voltada para conexões locais diretas por loopback.
- O OpenClaw também tem um caminho restrito de autoconexão local ao backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- As conexões da tailnet ou da LAN no mesmo host ainda são tratadas como remotas para fins de pareamento
  e exigem aprovação.
- Os clientes WS normalmente incluem a identidade `device` durante `connect` (operador +
  Node). As únicas exceções de operador sem dispositivo são caminhos de confiança explícitos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro
    restrita ao localhost.
  - autenticação bem-sucedida da Control UI do operador por `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (último recurso, redução grave
    da segurança).
  - RPCs de backend `gateway-client` por loopback direto no caminho auxiliar interno
    reservado.
- A omissão da identidade do dispositivo tem consequências para os escopos. Quando uma conexão
  de operador sem dispositivo é permitida por um caminho de confiança explícito, o OpenClaw
  ainda limpa os escopos autodeclarados, deixando um conjunto vazio, a menos que esse caminho tenha uma
  exceção nomeada de preservação de escopos. Os métodos restritos por escopo falham, então, com
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` é um caminho de
  preservação de escopos de último recurso da Control UI. Ele não concede escopos a clientes WebSocket
  arbitrários de backends personalizados ou com formato de CLI.
- O caminho auxiliar de backend `gateway-client` reservado por loopback direto preserva
  escopos somente para RPCs internas do plano de controle local; IDs de backend personalizados não
  recebem essa exceção.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnóstico da migração da autenticação de dispositivos

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect`
retorna códigos de detalhes `DEVICE_AUTH_*` em `error.details.code`, com um
`error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | A carga útil da assinatura não corresponde à carga útil v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O carimbo de data/hora assinado está fora da defasagem permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falha no formato/na canonicalização da chave pública. |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine a carga útil v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- A carga útil de assinatura preferencial é `v3`
  (`buildDeviceAuthPayloadV3` em `packages/gateway-client/src/device-auth.ts`),
  que vincula `platform` e `deviceFamily`, além dos
  campos de dispositivo/cliente/função/escopos/token/nonce.
- As assinaturas `v2` legadas continuam sendo aceitas para compatibilidade, mas a
  fixação de metadados de dispositivos pareados ainda controla a política de comandos na reconexão.

## TLS e fixação

- Há suporte a TLS para conexões WS (configuração `gateway.tls`).
- Os clientes podem, opcionalmente, fixar a impressão digital do certificado do gateway por meio de
  `gateway.remote.tlsFingerprint` ou da CLI `--tls-fingerprint`.

## Escopo

Este protocolo expõe toda a API do gateway: status, canais, modelos, chat,
agente, sessões, Nodes, aprovações e muito mais. A superfície exata é definida pelos
esquemas TypeBox reexportados de `packages/gateway-protocol/src/schema.ts`.

## Relacionados

- [Protocolo de ponte](/pt-BR/gateway/bridge-protocol)
- [Guia operacional do Gateway](/pt-BR/gateway)

---
read_when:
    - Implementando ou atualizando clientes WS do Gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

O protocolo WS do Gateway é o **único plano de controle + transporte de Node** do
OpenClaw. Todos os clientes (CLI, UI web, app macOS, Nodes iOS/Android, Nodes
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma requisição `connect`.
- Frames pré-conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos ativados,
  frames de entrada grandes demais e buffers lentos de saída emitem eventos `payload.large`
  antes de o Gateway fechar ou descartar o frame afetado. Esses eventos mantêm
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
relata o papel/escopos negociados quando disponíveis e inclui `deviceToken`
quando o Gateway emite um.

Quando nenhum token de dispositivo é emitido, `hello-ok.auth` ainda pode relatar as
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

Durante a transferência confiável de bootstrap, `hello-ok.auth` também pode incluir entradas adicionais
de papel limitadas em `deviceTokens`:

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

Para o fluxo interno de bootstrap de Node/operator, o token primário do Node permanece com
`scopes: []` e qualquer token de operator transferido permanece limitado à allowlist do operator
de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap continuam
prefixadas pelo papel: entradas de operator atendem apenas a solicitações de operator, e papéis que não são operator
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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeito colateral exigem **chaves de idempotência** (consulte o schema).

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

Métodos RPC do Gateway registrados por Plugin podem solicitar seu próprio escopo de operator, mas
prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos como `operator.admin`.

O escopo do método é apenas o primeiro portão. Alguns comandos slash alcançados por
`chat.send` aplicam verificações mais rígidas no nível do comando por cima. Por exemplo, gravações persistentes
de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação adicional de escopo no momento da aprovação, além do
escopo base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos Node sem exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node** ao mesmo tempo.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são controlados por escopo para que sessões com escopo apenas de pareamento ou apenas de Node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` transmitidos e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram totalmente esses frames.
- **Broadcasts `plugin.*` definidos por Plugin** são controlados por `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem sem restrições para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por escopo por padrão (falha fechada), a menos que um handler registrado alivie explicitamente essa restrição.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem a ordenação monotônica naquele socket, mesmo quando clientes diferentes veem subconjuntos filtrados por escopo diferentes do fluxo de eventos.

## Famílias comuns de métodos RPC

A superfície pública de WS é mais ampla do que os exemplos de handshake/autenticação acima. Isto
não é um dump gerado — `hello-ok.features.methods` é uma lista conservadora de
descoberta construída a partir de `src/gateway/server-methods-list.ts` mais exportações de métodos carregadas de plugin/channel. Trate isso como descoberta de recursos, não como uma enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de integridade do Gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o registrador recente limitado de estabilidade diagnóstica. Ele mantém metadados operacionais como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/plugin e IDs de sessão. Não mantém texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de request ou response, tokens, cookies ou valores secretos. É necessário escopo de leitura de operator.
    - `status` retorna o resumo do Gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operator com escopo de admin.
    - `gateway.identity.get` retorna a identidade do dispositivo do Gateway usada pelos fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot de presença atual para dispositivos operator/node conectados.
    - `system-event` anexa um evento do sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no Gateway.
  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitido em runtime.
    - `usage.status` retorna janelas de uso do provider/resumos de cota restante.
    - `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings para o workspace ativo do agente padrão.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.
  </Accordion>

  <Accordion title="Canais e helpers de login">
    - `channels.status` retorna resumos de status de canais/plugins internos + incluídos.
    - `channels.logout` faz logout de um canal/conta específico quando o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login por QR/web para o provider atual de canal web compatível com QR.
    - `web.login.wait` espera esse fluxo de login por QR/web terminar e inicia o canal em caso de sucesso.
    - `push.test` envia um push de teste APNs para um Node iOS registrado.
    - `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
    - `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.
  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna a cauda de log de arquivo configurada do Gateway com cursor/limite e controles de bytes máximos.
  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` retorna o payload efetivo de configuração de Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza fala por meio do provider de fala ativo de Talk.
    - `tts.status` retorna o estado de TTS ativado, provider ativo, providers de fallback e estado de configuração do provider.
    - `tts.providers` retorna o inventário visível de providers de TTS.
    - `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
    - `tts.setProvider` atualiza o provider preferido de TTS.
    - `tts.convert` executa uma conversão avulsa de texto para fala.
  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredos em runtime apenas em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredos voltadas para comandos para um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot e o hash da configuração atual.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial de configuração.
    - `config.apply` valida + substitui o payload completo de configuração.
    - `config.schema` retorna o payload de schema de configuração ao vivo usado pela Control UI e pelas ferramentas de CLI: schema, `uiHints`, versão e metadados de geração, incluindo metadados de schema de Plugin + canal quando o runtime consegue carregá-los. O schema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e textos de ajuda usados pela UI, incluindo ramos compostos de objeto aninhado, wildcard, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de consulta com escopo de caminho para um caminho de configuração: caminho normalizado, um nó de schema raso, dica correspondente + `hintPath` e resumos imediatos de filhos para detalhamento em UI/CLI. Nós de schema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/string/array/objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, mais a `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do Gateway e agenda uma reinicialização apenas quando a própria atualização foi bem-sucedida.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por WS RPC.
  </Accordion>

  <Accordion title="Helpers de agente e workspace">
    - `agents.list` retorna entradas de agentes configurados.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a conexão com o workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de bootstrap do workspace expostos para um agente.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` espera uma execução terminar e retorna o snapshot terminal quando disponível.
  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice atual de sessões.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de mudança de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrições para chaves de sessão específicas.
    - `sessions.resolve` resolve ou canoniza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo de uma sessão.
    - `sessions.patch` atualiza metadados/substituições da sessão.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags inline de diretiva são removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e tokens de controle vazados do modelo em ASCII/largura total são removidos, linhas puras de assistant com token silencioso como `NO_REPLY` / `no_reply` exatos são omitidas, e linhas grandes demais podem ser substituídas por placeholders.
  </Accordion>

  <Accordion title="Pareamento de dispositivos e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivos.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites aprovados de papel e escopo.
    - `device.token.revoke` revoga um token de dispositivo pareado.
  </Accordion>

  <Accordion title="Pareamento de Node, invoke e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` cobrem pareamento de Node e verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado conhecido/conectado do Node.
    - `node.rename` atualiza um rótulo de Node pareado.
    - `node.invoke` encaminha um comando para um Node conectado.
    - `node.invoke.result` retorna o resultado de uma requisição de invoke.
    - `node.event` carrega eventos originados do Node de volta para o Gateway.
    - `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila de Node conectado.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para Nodes offline/desconectados.
  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem requisições avulsas de aprovação de exec, mais consulta/replay de aprovações pendentes.
    - `exec.approval.waitDecision` espera uma aprovação de exec pendente e retorna a decisão final (ou `null` em caso de timeout).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots de política de aprovação de exec do Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local de aprovação de exec do Node por meio de comandos de relay de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por Plugin.
  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção de texto de despertar imediata ou no próximo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros eventos de chat
  apenas de transcrição.
- `session.message` e `session.tool`: atualizações de fluxo de eventos/transcrição para uma
  sessão assinada.
- `sessions.changed`: o índice de sessões ou os metadados foram alterados.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização do snapshot de integridade do Gateway.
- `heartbeat`: atualização do fluxo de eventos de Heartbeat.
- `cron`: evento de alteração de execução/job Cron.
- `shutdown`: notificação de desligamento do Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de Node.
- `node.invoke.request`: broadcast de requisição de invoke de Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: a configuração de gatilho de palavra de ativação foi alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprovação
  de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida
  de aprovação de Plugin.

### Métodos helper de Node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skill
  para verificações de permissão automática.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos
  em runtime de um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` primário tem como alvo:
    - `text` retorna o token primário de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos com reconhecimento do provider
      quando disponíveis
  - `textAliases` carrega aliases de slash exatos como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo com reconhecimento do provider quando ele existe.
  - `provider` é opcional e afeta apenas a nomenclatura nativa, além da disponibilidade de comandos nativos de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime de um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: Plugin proprietário quando `source="plugin"`
  - `optional`: se uma ferramenta de Plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O Gateway deriva contexto confiável de runtime a partir da sessão no lado do servidor em vez de aceitar
    contexto de autenticação ou entrega fornecido pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas core, de Plugin e de canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills de um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções sanitizadas de instalação sem expor valores brutos de segredos.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do Gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo Config corrige valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma requisição de exec precisa de aprovação, o Gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Requisições sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o preparo e o encaminhamento final aprovado de `system.run`, o
  Gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega de agente

- Requisições `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução apenas na sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas com vários canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis ao longo do protocolo v3 e são a linha de base esperada para clientes de terceiros.

| Constante                                 | Padrão                                               | Origem                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout de request (por RPC)              | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout de pré-autenticação / connect-challenge | `10_000` ms                                    | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão              | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexão               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nova tentativa rápida após fechamento por device-token | `250` ms                             | `src/gateway/client.ts`                                    |
| Período de tolerância antes de `terminate()` em parada forçada | `250` ms                          | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout padrão de `stopAndWait()`         | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo padrão de tick (pré `hello-ok`) | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Fechamento por timeout de tick            | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

O servidor anuncia `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` efetivos em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões pré-handshake.

## Auth

- A autenticação do Gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` fora de loopback, satisfazem a verificação de autenticação de connect a partir de
  cabeçalhos da request em vez de `connect.params.auth.*`.
- Ingresso privado com `gateway.auth.mode: "none"` ignora completamente a autenticação de connect por segredo compartilhado;
  não exponha esse modo em ingressos públicos/não confiáveis.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo para o
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` primário após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto
  de escopos aprovados armazenado para esse token. Isso preserva acesso de leitura/sondagem/status
  que já foi concedido e evita reduzir silenciosamente reconexões para um
  escopo implícito mais estreito apenas de admin.
- Montagem de autenticação de connect no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido em ordem de prioridade: primeiro token compartilhado explícito,
    depois um `deviceToken` explícito e, em seguida, um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhuma das opções acima resolve um
    `auth.token`. Um token compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A autopromoção de um token de dispositivo armazenado na tentativa única de
    `AUTH_TOKEN_MISMATCH` é limitada apenas a **endpoints confiáveis** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público
    sem pinning não se qualifica.
- Entradas adicionais `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-os apenas quando a conexão tiver usado autenticação de bootstrap em um transporte confiável
  como `wss://` ou pareamento loopback/local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige escopo `operator.pairing`).
- A emissão/rotação de token continua limitada ao conjunto de papéis aprovados registrado
  na entrada de pareamento desse dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento do dispositivo é autocontido por escopo, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin podem remover/revogar/rotacionar
  apenas sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operator solicitado em relação aos
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para um
  conjunto de escopos de operator mais amplo do que o que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientação para ação do operador.

## Identidade do dispositivo + pareamento

- Nodes devem incluir uma identidade estável de dispositivo (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são exigidas para novos IDs de dispositivo, a menos que a aprovação automática
  local esteja ativada.
- A aprovação automática de pareamento é centrada em conexões diretas de loopback local.
- O OpenClaw também tem um caminho estreito de autoconexão backend/local ao container para
  fluxos helper confiáveis com segredo compartilhado.
- Conexões na mesma tailnet ou LAN do host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A Control UI pode omiti-la apenas nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro apenas em localhost.
  - autenticação bem-sucedida de operator Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (modo de emergência, grave rebaixamento de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam comportamento de assinatura anterior ao challenge, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou o enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce desatualizado/incorreto. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora do desvio permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou. |

Alvo da migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos device/client/role/scopes/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas a fixação de metadados
  de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Os clientes podem opcionalmente fixar a impressão digital do certificado do Gateway (consulte a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou o CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do Gateway** (status, canais, modelos, chat,
agente, sessões, Nodes, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de bridge](/pt-BR/gateway/bridge-protocol)
- [Runbook do Gateway](/pt-BR/gateway)

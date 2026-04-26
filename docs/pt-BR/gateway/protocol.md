---
read_when:
    - Implementando ou atualizando clientes WS do gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

O protocolo WS do Gateway é o **plano de controle único + transporte de node** do
OpenClaw. Todos os clientes (CLI, UI web, app macOS, nodes iOS/Android, nodes
headless) se conectam por WebSocket e declaram sua **role** + **scope** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma requisição `connect`.
- Frames antes da conexão são limitados a 64 KiB. Após um handshake bem-sucedido, os clientes
  devem seguir os limites `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Com diagnósticos ativados,
  frames de entrada grandes demais e buffers lentos de saída emitem eventos `payload.large`
  antes que o gateway feche ou descarte o frame afetado. Esses eventos mantêm
  tamanhos, limites, superfícies e códigos de motivo seguros. Eles não mantêm o corpo
  da mensagem, conteúdo de anexos, corpo bruto do frame, tokens, cookies nem valores secretos.

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
relata a role/scopes negociados quando disponíveis e inclui `deviceToken`
quando o gateway emite um.

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

Clientes de backend confiáveis no mesmo processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) podem omitir `device` em conexões diretas por loopback quando
se autenticam com o token/senha compartilhados do gateway. Esse caminho é reservado
para RPCs internos do plano de controle e evita que baselines obsoletos de pareamento de CLI/dispositivo
bloqueiem trabalho local de backend, como atualizações de sessão de subagente. Clientes remotos,
clientes originados no navegador, clientes node e clientes explícitos de
token de dispositivo/identidade de dispositivo continuam usando as verificações normais de
pareamento e elevação de escopo.

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

Durante o handoff confiável de bootstrap, `hello-ok.auth` também pode incluir entradas
adicionais de role limitadas em `deviceTokens`:

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

Para o fluxo integrado de bootstrap node/operator, o token principal do node permanece com
`scopes: []` e qualquer token de operador repassado permanece limitado à allowlist
de operador do bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap continuam
prefixadas por role: entradas de operator satisfazem apenas requisições de operator, e roles
que não são operator ainda precisam de scopes sob o prefixo de sua própria role.

### Exemplo de node

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

Métodos com efeitos colaterais exigem **chaves de idempotência** (consulte o schema).

## Roles + scopes

### Roles

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Scopes (operator)

Scopes comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC de gateway registrados por Plugin podem solicitar seu próprio scope de operator, mas
prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre são resolvidos para `operator.admin`.

O scope do método é apenas o primeiro gate. Alguns comandos slash acessados por
`chat.send` aplicam verificações mais rígidas no nível do comando além disso. Por exemplo,
gravações persistentes de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de scope no momento da aprovação além do
scope base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos de node que não são exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declaram alegações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo `screen.record`, `camera.capture`).

O Gateway trata essas declarações como **alegações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta tanto como **operator** quanto como **node**.

## Escopo de eventos de broadcast

Eventos de broadcast WebSocket enviados pelo servidor são controlados por scope para que sessões com escopo de pareamento ou apenas node não recebam passivamente conteúdo de sessão.

- **Frames de chat, agente e resultado de ferramenta** (incluindo eventos `agent` em stream e resultados de chamadas de ferramenta) exigem pelo menos `operator.read`. Sessões sem `operator.read` ignoram completamente esses frames.
- **Broadcasts `plugin.*` definidos por Plugin** são controlados para `operator.write` ou `operator.admin`, dependendo de como o Plugin os registrou.
- **Eventos de status e transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexão/desconexão etc.) permanecem sem restrição para que a integridade do transporte continue observável para toda sessão autenticada.
- **Famílias desconhecidas de eventos de broadcast** são controladas por scope por padrão (falha segura), a menos que um handler registrado as flexibilize explicitamente.

Cada conexão de cliente mantém seu próprio número de sequência por cliente para que broadcasts preservem ordenação monotônica naquele socket, mesmo quando clientes diferentes veem subconjuntos filtrados por scope diferentes do stream de eventos.

## Famílias comuns de métodos RPC

A superfície pública de WS é mais ampla do que os exemplos de handshake/autenticação acima. Isto
não é um dump gerado — `hello-ok.features.methods` é uma lista conservadora de
descoberta construída a partir de `src/gateway/server-methods-list.ts` mais exportações
de métodos de Plugin/canal carregados. Trate isso como descoberta de recursos, não como uma enumeração completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidade">
    - `health` retorna o snapshot de saúde do gateway em cache ou recém-sondado.
    - `diagnostics.stability` retorna o registrador recente e limitado de estabilidade diagnóstica. Ele mantém metadados operacionais como nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e ids de sessão. Ele não mantém texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de requisição ou resposta, tokens, cookies nem valores secretos. É necessário scope de leitura de operator.
    - `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são incluídos apenas para clientes operator com escopo de admin.
    - `gateway.identity.get` retorna a identidade de dispositivo do gateway usada por fluxos de relay e pareamento.
    - `system-presence` retorna o snapshot atual de presença para dispositivos operator/node conectados.
    - `system-event` acrescenta um evento do sistema e pode atualizar/transmitir contexto de presença.
    - `last-heartbeat` retorna o evento de Heartbeat persistido mais recente.
    - `set-heartbeats` alterna o processamento de Heartbeat no gateway.
  </Accordion>

  <Accordion title="Modelos e uso">
    - `models.list` retorna o catálogo de modelos permitidos em runtime.
    - `usage.status` retorna resumos de janelas de uso/limite restante por provider.
    - `usage.cost` retorna resumos agregados de custo de uso para um intervalo de datas.
    - `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings para o workspace ativo do agente padrão.
    - `sessions.usage` retorna resumos de uso por sessão.
    - `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
    - `sessions.usage.logs` retorna entradas de log de uso para uma sessão.
  </Accordion>

  <Accordion title="Canais e helpers de login">
    - `channels.status` retorna resumos de status de canais/Plugin integrados + incluídos.
    - `channels.logout` faz logout de um canal/conta específico onde o canal oferece suporte a logout.
    - `web.login.start` inicia um fluxo de login QR/web para o provider atual de canal web compatível com QR.
    - `web.login.wait` espera esse fluxo de login QR/web ser concluído e inicia o canal em caso de sucesso.
    - `push.test` envia um push APNs de teste para um node iOS registrado.
    - `voicewake.get` retorna os gatilhos de wake-word armazenados.
    - `voicewake.set` atualiza os gatilhos de wake-word e transmite a alteração.
  </Accordion>

  <Accordion title="Mensagens e logs">
    - `send` é o RPC de entrega direta de saída para envios direcionados a canal/conta/thread fora do executor de chat.
    - `logs.tail` retorna o tail do log de arquivo configurado do gateway com controles de cursor/limite e bytes máximos.
  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` define/transmite o estado atual do modo Talk para clientes WebChat/Control UI.
    - `talk.speak` sintetiza fala por meio do provider de fala ativo do Talk.
    - `tts.status` retorna estado ativado do TTS, provider ativo, providers de fallback e estado da configuração do provider.
    - `tts.providers` retorna o inventário visível de providers de TTS.
    - `tts.enable` e `tts.disable` alternam o estado das preferências de TTS.
    - `tts.setProvider` atualiza o provider preferido de TTS.
    - `tts.convert` executa conversão pontual de texto em fala.
  </Accordion>

  <Accordion title="Segredos, configuração, atualização e assistente">
    - `secrets.reload` resolve novamente SecretRefs ativos e troca o estado secreto de runtime apenas em caso de sucesso completo.
    - `secrets.resolve` resolve atribuições de segredo para comandos-alvo de um conjunto específico de comando/alvo.
    - `config.get` retorna o snapshot atual da configuração e o hash.
    - `config.set` grava um payload de configuração validado.
    - `config.patch` mescla uma atualização parcial da configuração.
    - `config.apply` valida + substitui o payload completo da configuração.
    - `config.schema` retorna o payload do schema ativo de configuração usado pela Control UI e pelas ferramentas de CLI: schema, `uiHints`, versão e metadados de geração, incluindo metadados de schema de Plugin + canal quando o runtime consegue carregá-los. O schema inclui metadados de campo `title` / `description` derivados dos mesmos rótulos e textos de ajuda usados pela UI, incluindo ramificações de composição de objeto aninhado, curinga, item de array e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
    - `config.schema.lookup` retorna um payload de busca com escopo de caminho para um caminho de configuração: caminho normalizado, um nó superficial do schema, hint correspondente + `hintPath` e resumos imediatos de filhos para drill-down de UI/CLI. Nós de schema de lookup mantêm a documentação voltada ao usuário e campos comuns de validação (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numéricos/de string/de array/de objeto e flags como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`, `hasChildren`, além de `hint` / `hintPath` correspondentes.
    - `update.run` executa o fluxo de atualização do gateway e agenda uma reinicialização apenas quando a própria atualização foi bem-sucedida.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o assistente de onboarding por WS RPC.
  </Accordion>

  <Accordion title="Helpers de agente e workspace">
    - `agents.list` retorna entradas de agentes configuradas.
    - `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e ligação do workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os arquivos de bootstrap do workspace expostos para um agente.
    - `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou sessão.
    - `agent.wait` espera uma execução terminar e retorna o snapshot terminal quando disponível.
  </Accordion>

  <Accordion title="Controle de sessão">
    - `sessions.list` retorna o índice atual de sessões.
    - `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de mudança de sessão para o cliente WS atual.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam assinaturas de eventos de transcrição/mensagem para uma sessão.
    - `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão específicas.
    - `sessions.resolve` resolve ou canoniza um alvo de sessão.
    - `sessions.create` cria uma nova entrada de sessão.
    - `sessions.send` envia uma mensagem para uma sessão existente.
    - `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
    - `sessions.abort` aborta trabalho ativo de uma sessão.
    - `sessions.patch` atualiza metadados/substituições da sessão.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
    - `sessions.get` retorna a linha completa da sessão armazenada.
    - A execução de chat continua usando `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e tokens de controle do modelo vazados em ASCII/largura total são removidos, linhas puras do assistente com token silencioso como `NO_REPLY` / `no_reply` exatos são omitidas e linhas grandes demais podem ser substituídas por placeholders.
  </Accordion>

  <Accordion title="Pareamento de dispositivo e tokens de dispositivo">
    - `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam registros de pareamento de dispositivo.
    - `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites aprovados de role e escopo do chamador.
    - `device.token.revoke` revoga um token de dispositivo pareado dentro dos limites aprovados de role e escopo do chamador.
  </Accordion>

  <Accordion title="Pareamento de node, invoke e trabalho pendente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` cobrem pareamento de node e verificação de bootstrap.
    - `node.list` e `node.describe` retornam o estado de nodes conhecidos/conectados.
    - `node.rename` atualiza um rótulo de node pareado.
    - `node.invoke` encaminha um comando para um node conectado.
    - `node.invoke.result` retorna o resultado de uma requisição de invoke.
    - `node.event` carrega eventos originados no node de volta para o gateway.
    - `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
    - `node.pending.pull` e `node.pending.ack` são as APIs de fila para nodes conectados.
    - `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável para nodes offline/desconectados.
  </Accordion>

  <Accordion title="Famílias de aprovação">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` cobrem requisições pontuais de aprovação de exec mais busca/replay de aprovações pendentes.
    - `exec.approval.waitDecision` espera por uma aprovação pendente de exec e retorna a decisão final (ou `null` em caso de timeout).
    - `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de exec do gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam política local de aprovação de exec do node por meio de comandos de relay do node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem fluxos de aprovação definidos por Plugin.
  </Accordion>

  <Accordion title="Automação, Skills e ferramentas">
    - Automação: `wake` agenda uma injeção imediata ou no próximo Heartbeat de texto de ativação; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gerenciam trabalho agendado.
    - Skills e ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros
  eventos de chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/stream de eventos para uma
  sessão assinada.
- `sessions.changed`: o índice ou os metadados da sessão mudaram.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / vivacidade.
- `health`: atualização do snapshot de saúde do gateway.
- `heartbeat`: atualização do stream de eventos de Heartbeat.
- `cron`: evento de mudança de execução/tarefa do cron.
- `shutdown`: notificação de encerramento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de node.
- `node.invoke.request`: broadcast de requisição de invoke de node.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: a configuração de gatilho de wake-word mudou.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da
  aprovação de Plugin.

### Métodos helper de node

- Nodes podem chamar `skills.bins` para buscar a lista atual de executáveis de Skill
  para verificações de auto-permissão.

### Métodos helper de operator

- Operators podem chamar `commands.list` (`operator.read`) para buscar o inventário
  de comandos de runtime para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` principal segmenta:
    - `text` retorna o token primário de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos com reconhecimento de provider
      quando disponíveis
  - `textAliases` carrega aliases de slash exatos, como `/model` e `/m`.
  - `nativeName` carrega o nome de comando nativo com reconhecimento de provider quando ele existe.
  - `provider` é opcional e afeta apenas nomeação nativa mais disponibilidade de
    comando nativo de Plugin.
  - `includeArgs=false` omite metadados serializados de argumentos da resposta.
- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas de runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva contexto confiável de runtime da sessão no lado do servidor em vez de aceitar
    autenticação ou contexto de entrega fornecidos pelo chamador.
  - A resposta tem escopo de sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas centrais, de Plugin e de canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores secretos brutos.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações do ClawHub rastreadas no
    workspace do agente padrão.
  - O modo de configuração faz patch em valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma requisição exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem isso chamando `exec.approval.resolve` (exige scope `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Requisições sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/cwd/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o prepare e o encaminhamento final aprovado de `system.run`, o
  gateway rejeita a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Requisições `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução apenas na sessão quando nenhuma rota externa entregável pode ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas com vários canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes do cliente

O cliente de referência em `src/gateway/client.ts` usa estes padrões. Os valores são
estáveis ao longo do protocolo v3 e são a baseline esperada para clientes de terceiros.

| Constante                                 | Padrão                                               | Origem                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout de requisição (por RPC)           | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout de pré-autenticação / connect-challenge | `10_000` ms                                    | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff inicial de reconexão              | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexão               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nova tentativa rápida após fechamento por device-token | `250` ms                           | `src/gateway/client.ts`                                    |
| Grace de parada forçada antes de `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout padrão de `stopAndWait()`         | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo padrão de tick (antes de `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                    |
| Fechamento por timeout de tick            | código `4000` quando o silêncio excede `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

O servidor anuncia os valores efetivos de `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` em `hello-ok`; os clientes devem respeitar esses valores
em vez dos padrões anteriores ao handshake.

## Autenticação

- A autenticação do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` fora de loopback, satisfazem a verificação de autenticação de connect a partir de
  cabeçalhos da requisição em vez de `connect.params.auth.*`.
- A entrada privada `gateway.auth.mode: "none"` ignora totalmente a autenticação de connect por segredo compartilhado; não exponha esse modo em entradas públicas/não confiáveis.
- Após o pareamento, o Gateway emite um **token de dispositivo** com escopo da
  role + scopes da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto de scopes
  aprovados armazenado para esse token. Isso preserva o acesso de leitura/sonda/status
  que já foi concedido e evita colapsar silenciosamente reconexões para um
  escopo implícito apenas de admin mais restrito.
- A montagem de autenticação de connect no lado do cliente (`selectConnectAuth` em
  `src/gateway/client.ts`):
  - `auth.password` é ortogonal e sempre é encaminhado quando definido.
  - `auth.token` é preenchido nesta ordem de prioridade: segredo compartilhado explícito primeiro,
    depois um `deviceToken` explícito, depois um token armazenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` é enviado apenas quando nenhuma das opções acima resolveu um
    `auth.token`. Um segredo compartilhado ou qualquer token de dispositivo resolvido o suprime.
  - A autopromoção de um token de dispositivo armazenado na nova tentativa única de
    `AUTH_TOKEN_MISMATCH` é controlada apenas para **endpoints confiáveis** —
    loopback, ou `wss://` com `tlsFingerprint` fixado. `wss://` público sem
    pinning não se qualifica.
- Entradas adicionais `hello-ok.auth.deviceTokens` são tokens de handoff de bootstrap.
  Persista-os apenas quando a conexão usou autenticação de bootstrap em um transporte confiável,
  como `wss://` ou loopback/pareamento local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de scopes solicitado pelo chamador permanece autoritativo; scopes em cache só
  são reutilizados quando o cliente está reutilizando o token armazenado por dispositivo.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige scope `operator.pairing`).
- Emissão, rotação e revogação de tokens permanecem limitadas ao conjunto aprovado de roles
  registrado na entrada de pareamento daquele dispositivo; a mutação do token não pode expandir nem
  segmentar uma role de dispositivo que a aprovação de pareamento nunca concedeu.
- Para sessões com token de dispositivo pareado, o gerenciamento de dispositivos tem escopo próprio, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin podem remover/revogar/rotacionar
  apenas sua **própria** entrada de dispositivo.
- `device.token.rotate` e `device.token.revoke` também verificam o conjunto de scopes do token operator de destino
  em relação aos scopes atuais da sessão do chamador. Chamadores sem admin
  não podem rotacionar nem revogar um token operator mais amplo do que aquele que já possuem.
- Falhas de autenticação incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem parar loops automáticos de reconexão e exibir orientação para ação do operador.

## Identidade do dispositivo + pareamento

- Nodes devem incluir uma identidade estável de dispositivo (`device.id`) derivada de uma
  fingerprint de par de chaves.
- Gateways emitem tokens por dispositivo + role.
- Aprovações de pareamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja ativada.
- A aprovação automática de pareamento é centrada em conexões diretas locais por loopback.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos helper confiáveis com segredo compartilhado.
- Conexões tailnet ou LAN no mesmo host ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Clientes WS normalmente incluem identidade `device` durante `connect` (operator +
  node). As únicas exceções de operator sem dispositivo são caminhos explícitos de confiança:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade apenas com HTTP inseguro em localhost.
  - autenticação bem-sucedida do Control UI de operator com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, forte redução de segurança).
  - RPCs de backend `gateway-client` em loopback direto autenticadas com o
    token/senha compartilhados do gateway.
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de autenticação de dispositivo

Para clientes legados que ainda usam comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                         |
| -------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`    | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou enviou em branco). |
| `device nonce mismatch`    | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce obsoleto/incorreto.  |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da defasagem permitida. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à fingerprint da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`     | O formato/canonicalização da chave pública falhou.  |

Alvo de migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/role/scopes/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas o pinning de metadados
  de dispositivo pareado ainda controla a política de comando na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Clientes podem opcionalmente fixar a fingerprint do certificado do gateway (consulte a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agent, sessões, nodes, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de bridge](/pt-BR/gateway/bridge-protocol)
- [Guia operacional do Gateway](/pt-BR/gateway)

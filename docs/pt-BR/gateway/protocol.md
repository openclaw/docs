---
read_when:
    - Implementando ou atualizando clientes WS do gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando schema/modelos do protocolo
summary: 'Protocolo WebSocket do Gateway: handshake, frames, versionamento'
title: Protocolo do Gateway
x-i18n:
    generated_at: "2026-04-11T02:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do gateway (WebSocket)

O protocolo WS do Gateway é o **plano de controle único + transporte de nós** do
OpenClaw. Todos os clientes (CLI, interface web, app macOS, nós iOS/Android, nós
headless) se conectam via WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma requisição `connect`.

## Handshake (`connect`)

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
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

Durante a transferência confiável de bootstrap, `hello-ok.auth` também pode incluir entradas adicionais de papel limitado em `deviceTokens`:

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

Para o fluxo de bootstrap interno de nó/operador, o token principal do nó permanece com
`scopes: []` e qualquer token de operador transferido continua limitado à allowlist do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap continuam prefixadas por papel: entradas de operador só satisfazem requisições de operador, e papéis não operadores ainda precisam de escopos sob o prefixo do próprio papel.

### Exemplo de nó

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

- **Requisição**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (veja o schema).

## Papéis + escopos

### Papéis

- `operator` = cliente do plano de controle (CLI/UI/automação).
- `node` = host de capacidades (`camera`/`screen`/`canvas`/`system.run`).

### Escopos (`operator`)

Escopos comuns:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` com `includeSecrets: true` requer `operator.talk.secrets`
(ou `operator.admin`).

Métodos RPC do gateway registrados por plugins podem solicitar seu próprio escopo de operador, mas prefixos administrativos centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos de barra acessados por
`chat.send` aplicam verificações mais rígidas no nível do comando além disso. Por exemplo, gravações persistentes de `/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação além do escopo base do método:

- requisições sem comando: `operator.pairing`
- requisições com comandos de nó que não sejam exec: `operator.pairing` + `operator.write`
- requisições que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Nós declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidade de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata isso como **reivindicações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo,
  mesmo quando ele se conecta como **operator** e **node** ao mesmo tempo.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície WS pública é mais ampla
do que os exemplos de handshake/auth acima. Estas são as principais famílias de métodos que o
Gateway expõe hoje.

`hello-ok.features.methods` é uma lista de descoberta conservadora construída a partir de
`src/gateway/server-methods-list.ts` mais exports de métodos de plugins/canais carregados.
Trate isso como descoberta de recursos, não como um dump gerado de todos os helpers chamáveis
implementados em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o snapshot de saúde do gateway em cache ou recém-verificado.
- `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são
  incluídos apenas para clientes operadores com escopo de admin.
- `gateway.identity.get` retorna a identidade do dispositivo do gateway usada pelos fluxos de relay e
  pairing.
- `system-presence` retorna o snapshot atual de presença para dispositivos
  operator/node conectados.
- `system-event` acrescenta um evento do sistema e pode atualizar/transmitir
  o contexto de presença.
- `last-heartbeat` retorna o evento de heartbeat persistido mais recente.
- `set-heartbeats` alterna o processamento de heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em tempo de execução.
- `usage.status` retorna janelas de uso do provedor/resumos de cota restante.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna a prontidão de memória vetorial / embeddings para o
  workspace ativo do agente padrão.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canais/plugins incluídos + empacotados.
- `channels.logout` faz logout de um canal/conta específico onde o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web atual compatível com QR.
- `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um nó iOS registrado.
- `voicewake.get` retorna os gatilhos de palavra de ativação armazenados.
- `voicewake.set` atualiza os gatilhos de palavra de ativação e transmite a alteração.

### Mensagens e logs

- `send` é o RPC direto de entrega de saída para envios direcionados a canal/conta/thread
  fora do executor de chat.
- `logs.tail` retorna o tail configurado do log de arquivo do gateway com controles de cursor/limite e
  máximo de bytes.

### Talk e TTS

- `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets`
  requer `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes
  WebChat/Control UI.
- `talk.speak` sintetiza fala por meio do provedor de fala ativo do Talk.
- `tts.status` retorna estado habilitado do TTS, provedor ativo, provedores de fallback
  e estado de configuração do provedor.
- `tts.providers` retorna o inventário visível de provedores de TTS.
- `tts.enable` e `tts.disable` alternam o estado de preferências de TTS.
- `tts.setProvider` atualiza o provedor preferido de TTS.
- `tts.convert` executa uma conversão pontual de texto para fala.

### Segredos, configuração, atualização e assistente

- `secrets.reload` resolve novamente SecretRefs ativos e troca o estado de segredo em tempo de execução
  apenas em caso de sucesso completo.
- `secrets.resolve` resolve atribuições de segredos direcionadas por comando para um conjunto específico de comando/alvo.
- `config.get` retorna o snapshot e hash da configuração atual.
- `config.set` grava um payload de configuração validado.
- `config.patch` mescla uma atualização parcial de configuração.
- `config.apply` valida + substitui o payload completo de configuração.
- `config.schema` retorna o payload do schema de configuração ao vivo usado pela Control UI e pelas
  ferramentas da CLI: schema, `uiHints`, versão e metadados de geração, incluindo
  metadados de schema de plugins + canais quando o runtime consegue carregá-los. O schema
  inclui metadados de campo `title` / `description` derivados dos mesmos rótulos
  e texto de ajuda usados pela UI, incluindo branches aninhados de objeto, curinga,
  item de array e composição `anyOf` / `oneOf` / `allOf` quando há
  documentação de campo correspondente.
- `config.schema.lookup` retorna um payload de consulta restrito a caminho para um caminho de configuração:
  caminho normalizado, um nó de schema superficial, dica correspondente + `hintPath`, e
  resumos imediatos dos filhos para aprofundamento em UI/CLI.
  - Nós de schema de lookup mantêm a documentação voltada ao usuário e campos comuns de validação:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Resumos dos filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além de `hint` / `hintPath` correspondentes.
- `update.run` executa o fluxo de atualização do gateway e agenda uma reinicialização apenas quando
  a própria atualização foi bem-sucedida.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  assistente de onboarding por WS RPC.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agentes configuradas.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e a
  ligação com o workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos de bootstrap do workspace expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda a conclusão de uma execução e retorna o snapshot terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos
  de mudança de sessão para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  assinaturas de eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna prévias limitadas de transcrição para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canoniza um alvo de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interromper e redirecionar para uma sessão ativa.
- `sessions.abort` aborta trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições da sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam manutenção de sessão.
- `sessions.get` retorna a linha completa armazenada da sessão.
- A execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, payloads XML em texto simples de chamada de ferramenta (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, e
  blocos truncados de chamada de ferramenta) e tokens de controle do modelo vazados em ASCII/largura total
  são removidos, linhas puras do assistente com token silencioso, como `NO_REPLY` /
  `no_reply` exato, são omitidas, e linhas superdimensionadas podem ser substituídas por placeholders.

#### Pareamento de dispositivos e tokens de dispositivo

- `device.pair.list` retorna dispositivos pareados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de pareamento de dispositivos.
- `device.token.rotate` rotaciona um token de dispositivo pareado dentro dos limites aprovados
  de papel e escopo.
- `device.token.revoke` revoga um token de dispositivo pareado.

#### Pareamento de nós, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem o pareamento de nós e a
  verificação de bootstrap.
- `node.list` e `node.describe` retornam o estado conhecido/conectado dos nós.
- `node.rename` atualiza o rótulo de um nó pareado.
- `node.invoke` encaminha um comando para um nó conectado.
- `node.invoke.result` retorna o resultado de uma requisição de invoke.
- `node.event` transporta eventos originados do nó de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de nós conectados.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para nós offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` cobrem requisições pontuais de aprovação de exec mais
  consulta/reexecução de aprovações pendentes.
- `exec.approval.waitDecision` aguarda uma aprovação pendente de exec e retorna
  a decisão final (ou `null` em caso de timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação
  de exec do gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam a política local de aprovação
  de exec do nó por meio de comandos de relay do nó.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem
  fluxos de aprovação definidos por plugins.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção de texto de ativação imediata ou no próximo heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/ferramentas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI como `chat.inject` e outros eventos
  de chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de transcrição/fluxo de eventos para uma
  sessão assinada.
- `sessions.changed`: o índice ou os metadados da sessão foram alterados.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / liveness.
- `health`: atualização do snapshot de saúde do gateway.
- `heartbeat`: atualização do fluxo de eventos de heartbeat.
- `cron`: evento de alteração de execução/job do cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do pareamento de nós.
- `node.invoke.request`: transmissão de requisição de invoke de nó.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo pareado.
- `voicewake.changed`: a configuração do gatilho da palavra de ativação foi alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da aprovação
  de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da aprovação
  de plugin.

### Métodos helper de nó

- Nós podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de auto-allow.

### Métodos helper de operador

- Operadores podem chamar `commands.list` (`operator.read`) para buscar o inventário de comandos em tempo de execução para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - `scope` controla qual superfície o `name` principal segmenta:
    - `text` retorna o token principal de comando de texto sem a `/` inicial
    - `native` e o caminho padrão `both` retornam nomes nativos sensíveis ao provedor
      quando disponíveis
  - `textAliases` carrega aliases exatos de barra, como `/model` e `/m`.
  - `nativeName` carrega o nome do comando nativo sensível ao provedor quando ele existe.
  - `provider` é opcional e afeta apenas nomes nativos mais a disponibilidade de comandos nativos de plugin.
  - `includeArgs=false` omite metadados de argumentos serializados da resposta.
- Operadores podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em tempo de execução para um
  agente. A resposta inclui ferramentas agrupadas e metadados de proveniência:
  - `source`: `core` ou `plugin`
  - `pluginId`: plugin proprietário quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operadores podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em tempo de execução
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto confiável de runtime do lado do servidor a partir da sessão, em vez de aceitar
    auth ou contexto de entrega fornecidos pelo chamador.
  - A resposta é delimitada pela sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas de core, plugin e canal.
- Operadores podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de configuração e
    opções de instalação sanitizadas sem expor valores brutos de segredos.
- Operadores podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operadores podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de Skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada de `metadata.openclaw.install` no host do gateway.
- Operadores podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações rastreadas do ClawHub no
    workspace do agente padrão.
  - O modo de configuração aplica patch em valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma requisição de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operadores resolvem chamando `exec.approval.resolve` (requer escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Requisições sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como contexto autoritativo de comando/`cwd`/sessão.
- Se um chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre a preparação e o encaminhamento final aprovado de `system.run`, o
  gateway rejeitará a execução em vez de confiar no payload alterado.

## Fallback de entrega do agente

- Requisições `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: alvos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução apenas na sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configurações ambíguas de múltiplos canais).

## Versionamento

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema.ts`.
- Os clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Schemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- A auth do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de auth configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  sem loopback, satisfazem a verificação de auth do connect a partir dos
  cabeçalhos da requisição em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` com ingress privado ignora totalmente a auth de connect por segredo compartilhado;
  não exponha esse modo em ingress público/não confiável.
- Após o pareamento, o Gateway emite um **token de dispositivo** delimitado pelo papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Os clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Reconectar com esse **token de dispositivo armazenado** também deve reutilizar o conjunto de escopos aprovados armazenado para esse token. Isso preserva o acesso de leitura/probe/status
  já concedido e evita reduzir silenciosamente reconexões a um
  escopo implícito mais restrito apenas de admin.
- A precedência normal de auth no connect é: token/senha compartilhado explícito primeiro, depois
  `deviceToken` explícito, depois token por dispositivo armazenado, depois token de bootstrap.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-os apenas quando a conexão tiver usado auth de bootstrap em um transporte confiável,
  como `wss://` ou loopback/pareamento local.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só são
  reutilizados quando o cliente estiver reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (requer escopo `operator.pairing`).
- A emissão/rotação de tokens permanece limitada ao conjunto aprovado de papéis registrado na
  entrada de pareamento do dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de pareamento nunca concedeu.
- Para sessões de token de dispositivo pareado, o gerenciamento de dispositivos é autocontido, a menos que o
  chamador também tenha `operator.admin`: chamadores sem admin só podem remover/revogar/rotacionar
  sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto solicitado de escopos de operador em relação aos
  escopos atuais da sessão do chamador. Chamadores sem admin não podem rotacionar um token para
  um conjunto mais amplo de escopos de operador do que já possuem.
- Falhas de auth incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma única nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e orientar o operador para uma ação.

## Identidade do dispositivo + pareamento

- Nós devem incluir uma identidade estável de dispositivo (`device.id`) derivada da
  impressão digital de um par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de pareamento são exigidas para novos IDs de dispositivo, a menos que a aprovação automática local
  esteja habilitada.
- A aprovação automática de pareamento é centrada em conexões diretas locais por local loopback.
- O OpenClaw também tem um caminho restrito de autoconexão local de backend/container para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões da mesma máquina via tailnet ou LAN ainda são tratadas como remotas para pareamento e
  exigem aprovação.
- Todos os clientes WS devem incluir a identidade `device` durante `connect` (`operator` + `node`).
  A Control UI só pode omiti-la nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro apenas em localhost.
  - auth bem-sucedida de operador da Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, rebaixamento severo de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de auth do dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao challenge, `connect` agora retorna
códigos `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou o enviou em branco). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce antigo/incorreto.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da defasagem permitida. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou. |

Objetivo da migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas a fixação de metadados de dispositivo pareado ainda controla a política de comandos na reconexão.

## TLS + pinagem

- TLS é compatível com conexões WS.
- Os clientes podem, opcionalmente, fixar a impressão digital do certificado do gateway (veja a configuração `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
schemas TypeBox em `src/gateway/protocol/schema.ts`.

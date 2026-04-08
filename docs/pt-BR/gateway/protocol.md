---
read_when:
    - Implementando ou atualizando clientes WS do gateway
    - Depurando incompatibilidades de protocolo ou falhas de conexão
    - Regenerando esquema/modelos do protocolo
summary: 'Protocolo WebSocket do gateway: handshake, frames, versionamento'
title: Protocolo do gateway
x-i18n:
    generated_at: "2026-04-08T02:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8635e3ac1dd311dbd3a770b088868aa1495a8d53b3ebc1eae0dfda3b2bf4694a
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo do gateway (WebSocket)

O protocolo WS do Gateway é o **único plano de controle + transporte de nó** do
OpenClaw. Todos os clientes (CLI, UI web, app do macOS, nós de iOS/Android, nós
headless) se conectam por WebSocket e declaram seu **papel** + **escopo** no
momento do handshake.

## Transporte

- WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser uma solicitação `connect`.

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

Durante a transferência de bootstrap confiável, `hello-ok.auth` também pode incluir
entradas adicionais de papéis limitados em `deviceTokens`:

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

Para o fluxo integrado de bootstrap de nó/operador, o token principal do nó permanece com
`scopes: []` e qualquer token de operador transferido permanece limitado à allowlist
do operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). As verificações de escopo de bootstrap
continuam prefixadas por papel: entradas de operador só satisfazem solicitações de operador, e papéis que não são de operador
ainda precisam de escopos sob seu próprio prefixo de papel.

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

- **Solicitação**: `{type:"req", id, method, params}`
- **Resposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Métodos com efeitos colaterais exigem **chaves de idempotência** (consulte o esquema).

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

Métodos RPC do gateway registrados por plugin podem solicitar seu próprio escopo de operador, mas
prefixos admin centrais reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sempre resolvem para `operator.admin`.

O escopo do método é apenas a primeira barreira. Alguns comandos slash acessados por
`chat.send` aplicam verificações mais restritas no nível do comando por cima disso. Por exemplo, gravações persistentes de
`/config set` e `/config unset` exigem `operator.admin`.

`node.pair.approve` também tem uma verificação extra de escopo no momento da aprovação, além do
escopo base do método:

- solicitações sem comando: `operator.pairing`
- solicitações com comandos de nó que não sejam exec: `operator.pairing` + `operator.write`
- solicitações que incluem `system.run`, `system.run.prepare` ou `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nós declaram reivindicações de capacidade no momento da conexão:

- `caps`: categorias de capacidades de alto nível.
- `commands`: allowlist de comandos para invoke.
- `permissions`: alternâncias granulares (por exemplo, `screen.record`, `camera.capture`).

O Gateway trata essas declarações como **reivindicações** e aplica allowlists no lado do servidor.

## Presença

- `system-presence` retorna entradas indexadas pela identidade do dispositivo.
- Entradas de presença incluem `deviceId`, `roles` e `scopes` para que as UIs possam mostrar uma única linha por dispositivo
  mesmo quando ele se conecta como **operator** e **node**.

## Famílias comuns de métodos RPC

Esta página não é um dump completo gerado, mas a superfície pública de WS é mais ampla
do que os exemplos de handshake/auth acima. Estas são as principais famílias de métodos que o
Gateway expõe hoje.

`hello-ok.features.methods` é uma lista conservadora de descoberta criada a partir de
`src/gateway/server-methods-list.ts` mais exportações de métodos de plugin/canal carregadas.
Trate isso como descoberta de recursos, não como um dump gerado de todos os helpers chamáveis
implementados em `src/gateway/server-methods/*.ts`.

### Sistema e identidade

- `health` retorna o snapshot de saúde do gateway em cache ou recém-verificado.
- `status` retorna o resumo do gateway no estilo `/status`; campos sensíveis são
  incluídos apenas para clientes operator com escopo admin.
- `gateway.identity.get` retorna a identidade do dispositivo do gateway usada por fluxos de relay e
  emparelhamento.
- `system-presence` retorna o snapshot atual de presença para dispositivos
  operator/node conectados.
- `system-event` acrescenta um evento de sistema e pode atualizar/transmitir o contexto
  de presença.
- `last-heartbeat` retorna o evento de heartbeat persistido mais recente.
- `set-heartbeats` alterna o processamento de heartbeat no gateway.

### Modelos e uso

- `models.list` retorna o catálogo de modelos permitido em runtime.
- `usage.status` retorna resumos de janelas de uso/restante de cota do provedor.
- `usage.cost` retorna resumos agregados de uso de custo para um intervalo de datas.
- `doctor.memory.status` retorna o estado de prontidão de memória vetorial / embeddings para o
  workspace ativo do agente padrão.
- `sessions.usage` retorna resumos de uso por sessão.
- `sessions.usage.timeseries` retorna séries temporais de uso para uma sessão.
- `sessions.usage.logs` retorna entradas de log de uso para uma sessão.

### Canais e helpers de login

- `channels.status` retorna resumos de status de canais/plugins integrados + empacotados.
- `channels.logout` faz logout de um canal/conta específico onde o canal
  oferece suporte a logout.
- `web.login.start` inicia um fluxo de login por QR/web para o provedor de canal web
  atual com suporte a QR.
- `web.login.wait` aguarda a conclusão desse fluxo de login por QR/web e inicia o
  canal em caso de sucesso.
- `push.test` envia um push APNs de teste para um nó iOS registrado.
- `voicewake.get` retorna os gatilhos de wake word armazenados.
- `voicewake.set` atualiza os gatilhos de wake word e transmite a alteração.

### Mensagens e logs

- `send` é o RPC de entrega de saída direta para envios direcionados a
  canal/conta/thread fora do executor de chat.
- `logs.tail` retorna o tail do log de arquivo configurado do gateway com cursor/limite e
  controles de bytes máximos.

### Talk e TTS

- `talk.config` retorna o payload efetivo de configuração do Talk; `includeSecrets`
  exige `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` define/transmite o estado atual do modo Talk para clientes do WebChat/Control UI.
- `talk.speak` sintetiza fala por meio do provedor de fala Talk ativo.
- `tts.status` retorna o estado de TTS habilitado, provedor ativo, provedores de fallback
  e estado de configuração do provedor.
- `tts.providers` retorna o inventário visível de provedores de TTS.
- `tts.enable` e `tts.disable` alternam o estado de preferências do TTS.
- `tts.setProvider` atualiza o provedor preferido de TTS.
- `tts.convert` executa uma conversão única de texto para fala.

### Secrets, config, update e wizard

- `secrets.reload` resolve novamente os SecretRefs ativos e troca o estado de segredo em runtime
  apenas em caso de sucesso total.
- `secrets.resolve` resolve atribuições de segredos para comandos de destino para um conjunto específico
  de comando/alvo.
- `config.get` retorna o snapshot e o hash da configuração atual.
- `config.set` grava um payload de configuração validado.
- `config.patch` mescla uma atualização parcial de configuração.
- `config.apply` valida + substitui o payload completo de configuração.
- `config.schema` retorna o payload do esquema de configuração em uso, usado pela Control UI e
  por ferramentas da CLI: esquema, `uiHints`, versão e metadados de geração, incluindo
  metadados de esquema de plugin + canal quando o runtime consegue carregá-los. O esquema
  inclui metadados de campo `title` / `description` derivados dos mesmos rótulos
  e textos de ajuda usados pela UI, incluindo ramos compostos de objeto aninhado, curinga, item de array
  e `anyOf` / `oneOf` / `allOf` quando existe documentação de campo correspondente.
- `config.schema.lookup` retorna um payload de consulta restrito a um caminho para um caminho de config:
  caminho normalizado, um nó de esquema raso, hint correspondente + `hintPath`, e
  resumos imediatos de filhos para aprofundamento em UI/CLI.
  - Nós de esquema de consulta mantêm a documentação voltada ao usuário e campos comuns de validação:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limites numéricos/de string/de array/de objeto e flags booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Resumos de filhos expõem `key`, `path` normalizado, `type`, `required`,
    `hasChildren`, além de `hint` / `hintPath` correspondentes.
- `update.run` executa o fluxo de atualização do gateway e agenda uma reinicialização apenas quando
  a própria atualização foi bem-sucedida.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` expõem o
  assistente de onboarding por RPC WS.

### Famílias principais existentes

#### Helpers de agente e workspace

- `agents.list` retorna entradas de agente configuradas.
- `agents.create`, `agents.update` e `agents.delete` gerenciam registros de agentes e
  conexão com o workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gerenciam os
  arquivos bootstrap do workspace expostos para um agente.
- `agent.identity.get` retorna a identidade efetiva do assistente para um agente ou
  sessão.
- `agent.wait` aguarda o término de uma execução e retorna o snapshot terminal quando
  disponível.

#### Controle de sessão

- `sessions.list` retorna o índice atual de sessões.
- `sessions.subscribe` e `sessions.unsubscribe` alternam assinaturas de eventos de alteração de sessão
  para o cliente WS atual.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` alternam
  assinaturas de eventos de transcrição/mensagem para uma sessão.
- `sessions.preview` retorna prévias limitadas da transcrição para chaves de sessão
  específicas.
- `sessions.resolve` resolve ou canoniza um destino de sessão.
- `sessions.create` cria uma nova entrada de sessão.
- `sessions.send` envia uma mensagem para uma sessão existente.
- `sessions.steer` é a variante de interrupção e direcionamento para uma sessão ativa.
- `sessions.abort` aborta o trabalho ativo de uma sessão.
- `sessions.patch` atualiza metadados/substituições da sessão.
- `sessions.reset`, `sessions.delete` e `sessions.compact` executam a manutenção
  da sessão.
- `sessions.get` retorna a linha armazenada completa da sessão.
- a execução de chat ainda usa `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` é normalizado para exibição para clientes de UI: tags de diretiva inline são
  removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, e
  blocos de chamada de ferramenta truncados) e tokens de controle do modelo vazados em ASCII/largura total
  são removidos, linhas de assistente compostas apenas por token silencioso, como `NO_REPLY` /
  `no_reply`, são omitidas, e linhas grandes demais podem ser substituídas por placeholders.

#### Emparelhamento de dispositivos e tokens de dispositivo

- `device.pair.list` retorna dispositivos emparelhados pendentes e aprovados.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gerenciam
  registros de emparelhamento de dispositivos.
- `device.token.rotate` rotaciona um token de dispositivo emparelhado dentro dos limites aprovados
  de papel e escopo.
- `device.token.revoke` revoga um token de dispositivo emparelhado.

#### Emparelhamento de nó, invoke e trabalho pendente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` cobrem emparelhamento de nó e bootstrap
  de verificação.
- `node.list` e `node.describe` retornam o estado de nós conhecidos/conectados.
- `node.rename` atualiza um rótulo de nó emparelhado.
- `node.invoke` encaminha um comando para um nó conectado.
- `node.invoke.result` retorna o resultado de uma solicitação invoke.
- `node.event` carrega eventos originados do nó de volta para o gateway.
- `node.canvas.capability.refresh` atualiza tokens de capacidade de canvas com escopo.
- `node.pending.pull` e `node.pending.ack` são as APIs de fila de nós conectados.
- `node.pending.enqueue` e `node.pending.drain` gerenciam trabalho pendente durável
  para nós offline/desconectados.

#### Famílias de aprovação

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` cobrem solicitações únicas de aprovação de exec, além de
  consulta/replay de aprovações pendentes.
- `exec.approval.waitDecision` aguarda uma aprovação de exec pendente e retorna
  a decisão final (ou `null` em caso de timeout).
- `exec.approvals.get` e `exec.approvals.set` gerenciam snapshots da política de aprovação de exec
  do gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gerenciam políticas locais de aprovação de exec
  do nó por meio de comandos de relay do nó.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` cobrem
  fluxos de aprovação definidos por plugin.

#### Outras famílias principais

- automação:
  - `wake` agenda uma injeção de texto de ativação imediata ou no próximo heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/ferramentas: `skills.*`, `tools.catalog`, `tools.effective`

### Famílias comuns de eventos

- `chat`: atualizações de chat da UI, como `chat.inject` e outros
  eventos de chat apenas de transcrição.
- `session.message` e `session.tool`: atualizações de fluxo de eventos/transcrição para uma
  sessão assinada.
- `sessions.changed`: o índice de sessões ou os metadados foram alterados.
- `presence`: atualizações do snapshot de presença do sistema.
- `tick`: evento periódico de keepalive / verificação de atividade.
- `health`: atualização do snapshot de saúde do gateway.
- `heartbeat`: atualização do fluxo de eventos de heartbeat.
- `cron`: evento de alteração de execução/trabalho de cron.
- `shutdown`: notificação de desligamento do gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida do emparelhamento de nó.
- `node.invoke.request`: transmissão de solicitação de invoke de nó.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida do dispositivo emparelhado.
- `voicewake.changed`: a configuração de gatilho de wake word foi alterada.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida da
  aprovação de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida da aprovação
  de plugin.

### Métodos helper de nó

- Nós podem chamar `skills.bins` para buscar a lista atual de executáveis de Skills
  para verificações de auto-allow.

### Métodos helper de operator

- Operators podem chamar `tools.catalog` (`operator.read`) para buscar o catálogo de ferramentas em runtime para um
  agente. A resposta inclui ferramentas agrupadas e metadados de procedência:
  - `source`: `core` ou `plugin`
  - `pluginId`: proprietário do plugin quando `source="plugin"`
  - `optional`: se uma ferramenta de plugin é opcional
- Operators podem chamar `tools.effective` (`operator.read`) para buscar o inventário efetivo de ferramentas em runtime
  para uma sessão.
  - `sessionKey` é obrigatório.
  - O gateway deriva o contexto de runtime confiável a partir da sessão no lado do servidor, em vez de aceitar
    auth ou contexto de entrega fornecidos pelo chamador.
  - A resposta é restrita à sessão e reflete o que a conversa ativa pode usar agora,
    incluindo ferramentas centrais, de plugin e de canal.
- Operators podem chamar `skills.status` (`operator.read`) para buscar o inventário visível
  de Skills para um agente.
  - `agentId` é opcional; omita-o para ler o workspace do agente padrão.
  - A resposta inclui elegibilidade, requisitos ausentes, verificações de config e
    opções de instalação sanitizadas sem expor valores brutos de segredo.
- Operators podem chamar `skills.search` e `skills.detail` (`operator.read`) para
  metadados de descoberta do ClawHub.
- Operators podem chamar `skills.install` (`operator.admin`) em dois modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala uma
    pasta de skill no diretório `skills/` do workspace do agente padrão.
  - Modo instalador do gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    executa uma ação declarada em `metadata.openclaw.install` no host do gateway.
- Operators podem chamar `skills.update` (`operator.admin`) em dois modos:
  - O modo ClawHub atualiza um slug rastreado ou todas as instalações do ClawHub rastreadas no
    workspace do agente padrão.
  - O modo Config aplica patch em valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` e `env`.

## Aprovações de exec

- Quando uma solicitação de exec precisa de aprovação, o gateway transmite `exec.approval.requested`.
- Clientes operator resolvem chamando `exec.approval.resolve` (exige escopo `operator.approvals`).
- Para `host=node`, `exec.approval.request` deve incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadados de sessão canônicos). Solicitações sem `systemRunPlan` são rejeitadas.
- Após a aprovação, chamadas encaminhadas de `node.invoke system.run` reutilizam esse
  `systemRunPlan` canônico como o contexto autoritativo de comando/cwd/sessão.
- Se um chamador modificar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre o preparo e o encaminhamento final aprovado de `system.run`, o
  gateway rejeita a execução em vez de confiar no payload modificado.

## Fallback de entrega do agente

- Solicitações `agent` podem incluir `deliver=true` para solicitar entrega de saída.
- `bestEffortDeliver=false` mantém o comportamento estrito: destinos de entrega não resolvidos ou apenas internos retornam `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite fallback para execução somente na sessão quando nenhuma rota externa entregável puder ser resolvida (por exemplo, sessões internas/webchat ou configs ambíguas de múltiplos canais).

## Versionamento

- `PROTOCOL_VERSION` está em `src/gateway/protocol/schema.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Esquemas + modelos são gerados a partir de definições TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- O auth do gateway por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de auth configurado.
- Modos com identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` sem loopback
  satisfazem a verificação de auth de conexão a partir de cabeçalhos da
  solicitação em vez de `connect.params.auth.*`.
- A entrada privada `gateway.auth.mode: "none"` ignora completamente o auth de conexão por segredo compartilhado;
  não exponha esse modo em entradas públicas/não confiáveis.
- Após o emparelhamento, o Gateway emite um **token de dispositivo** restrito ao
  papel + escopos da conexão. Ele é retornado em `hello-ok.auth.deviceToken` e deve ser
  persistido pelo cliente para conexões futuras.
- Clientes devem persistir o `hello-ok.auth.deviceToken` principal após qualquer
  conexão bem-sucedida.
- Reconectar com esse token de dispositivo **armazenado** também deve reutilizar o conjunto de escopos aprovados
  armazenado para esse token. Isso preserva o acesso de leitura/probe/status
  que já foi concedido e evita reduzir silenciosamente as reconexões para um
  escopo implícito mais restrito apenas de admin.
- A precedência normal do auth de conexão é token/senha compartilhado explícito primeiro, depois
  `deviceToken` explícito, depois token por dispositivo armazenado, e por fim token de bootstrap.
- Entradas adicionais em `hello-ok.auth.deviceTokens` são tokens de transferência de bootstrap.
  Persista-as apenas quando a conexão usar auth de bootstrap em um transporte confiável,
  como `wss://` ou loopback/local pairing.
- Se um cliente fornecer um `deviceToken` **explícito** ou `scopes` explícitos, esse
  conjunto de escopos solicitado pelo chamador permanece autoritativo; escopos em cache só
  são reutilizados quando o cliente está reutilizando o token por dispositivo armazenado.
- Tokens de dispositivo podem ser rotacionados/revogados via `device.token.rotate` e
  `device.token.revoke` (exige escopo `operator.pairing`).
- A emissão/rotação de tokens permanece limitada ao conjunto de papéis aprovados registrados na
  entrada de emparelhamento desse dispositivo; rotacionar um token não pode expandir o dispositivo para um
  papel que a aprovação de emparelhamento nunca concedeu.
- Para sessões com token de dispositivo emparelhado, o gerenciamento do dispositivo é restrito ao próprio dispositivo, a menos que o
  chamador também tenha `operator.admin`: chamadores não admin só podem remover/revogar/rotacionar
  sua **própria** entrada de dispositivo.
- `device.token.rotate` também verifica o conjunto de escopos de operator solicitado em relação aos
  escopos atuais da sessão do chamador. Chamadores não admin não podem rotacionar um token para um
  conjunto de escopos de operator mais amplo do que o que já possuem.
- Falhas de auth incluem `error.details.code` mais dicas de recuperação:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento do cliente para `AUTH_TOKEN_MISMATCH`:
  - Clientes confiáveis podem tentar uma nova tentativa limitada com um token por dispositivo em cache.
  - Se essa nova tentativa falhar, os clientes devem interromper loops automáticos de reconexão e exibir orientações para ação do operador.

## Identidade do dispositivo + emparelhamento

- Nós devem incluir uma identidade de dispositivo estável (`device.id`) derivada de uma
  impressão digital de par de chaves.
- Gateways emitem tokens por dispositivo + papel.
- Aprovações de emparelhamento são necessárias para novos IDs de dispositivo, a menos que a aprovação automática
  local esteja habilitada.
- A aprovação automática de emparelhamento é centrada em conexões diretas de local loopback.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/container para
  fluxos helper confiáveis com segredo compartilhado.
- Conexões tailnet ou LAN no mesmo host ainda são tratadas como remotas para emparelhamento e
  exigem aprovação.
- Todos os clientes WS devem incluir identidade `device` durante `connect` (operator + node).
  A Control UI pode omiti-la apenas nestes modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidade com HTTP inseguro somente em localhost.
  - auth bem-sucedido de operator da Control UI com `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, rebaixamento severo de segurança).
- Todas as conexões devem assinar o nonce `connect.challenge` fornecido pelo servidor.

### Diagnósticos de migração de auth de dispositivo

Para clientes legados que ainda usam o comportamento de assinatura anterior ao desafio, `connect` agora retorna
códigos de detalhe `DEVICE_AUTH_*` em `error.details.code` com um `error.details.reason` estável.

Falhas comuns de migração:

| Mensagem                    | details.code                     | details.reason           | Significado                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | O cliente omitiu `device.nonce` (ou o enviou em branco).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | O cliente assinou com um nonce desatualizado/incorreto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | O payload da assinatura não corresponde ao payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | O timestamp assinado está fora da margem permitida.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` não corresponde à impressão digital da chave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | O formato/canonicalização da chave pública falhou.         |

Destino da migração:

- Sempre aguarde `connect.challenge`.
- Assine o payload v2 que inclui o nonce do servidor.
- Envie o mesmo nonce em `connect.params.device.nonce`.
- O payload de assinatura preferido é `v3`, que vincula `platform` e `deviceFamily`
  além dos campos de dispositivo/cliente/papel/escopos/token/nonce.
- Assinaturas legadas `v2` continuam aceitas por compatibilidade, mas o pinning de metadados de dispositivos emparelhados
  ainda controla a política de comandos na reconexão.

## TLS + pinning

- TLS é compatível para conexões WS.
- Clientes podem opcionalmente fazer pinning da impressão digital do certificado do gateway (consulte a config `gateway.tls`
  mais `gateway.remote.tlsFingerprint` ou a CLI `--tls-fingerprint`).

## Escopo

Este protocolo expõe a **API completa do gateway** (status, canais, modelos, chat,
agente, sessões, nós, aprovações etc.). A superfície exata é definida pelos
esquemas TypeBox em `src/gateway/protocol/schema.ts`.

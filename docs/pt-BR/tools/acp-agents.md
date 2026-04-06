---
read_when:
    - Executando coding harnesses por meio de ACP
    - Configurando sessões ACP vinculadas a conversas em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Diagnosticando o backend ACP e a integração de plugin
    - Operando comandos `/acp` a partir do chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-06T03:13:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302f3fe25b1ffe0576592b6e0ad9e8a5781fa5702b31d508d9ba8908f7df33bd
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

As sessões de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses de programação externos (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar o Claude Code em uma thread", o OpenClaw deve encaminhar essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que Codex ou Claude Code se conectem como um cliente MCP externo diretamente
a conversas de canal existentes do OpenClaw, use [`openclaw mcp serve`](/cli/mcp)
em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                     | Use isto                 | Observações                                                                                                      |
| --------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio do_ OpenClaw | Esta página: agentes ACP | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente      | [`openclaw acp`](/cli/acp) | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                         |

## Isso funciona pronto para uso?

Geralmente, sim.

- Instalações novas agora vêm com o plugin de runtime empacotado `acpx` ativado por padrão.
- O plugin empacotado `acpx` prefere seu binário `acpx` fixado localmente no plugin.
- Na inicialização, o OpenClaw testa esse binário e faz autorreparo nele se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adapter de harness de destino pode ser buscado sob demanda com `npx` na primeira vez que você usar esse harness.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adapter na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adapter seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw deve estar pronto para fazer bootstrap do `acpx`, mas o adapter ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: a mesma situação para o adapter ACP do Claude, além da autenticação do lado do Claude nesse host.

## Fluxo rápido do operador

Use isto quando quiser um runbook prático de `/acp`:

1. Crie uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa session key).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste opções de runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dê um direcionamento a uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Pare o trabalho:
   - `/acp cancel` (interrompe o turno atual), ou
   - `/acp close` (fecha a sessão + remove vínculos)

## Início rápido para humanos

Exemplos de solicitações em linguagem natural:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão persistente do Codex em uma thread aqui e mantenha o foco nela."
- "Execute isto como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o destino de harness solicitado (`agentId`, por exemplo `codex`).
3. Se for solicitado vínculo com a conversa atual e o canal ativo o suportar, vincular a sessão ACP a essa conversa.
4. Caso contrário, se for solicitado vínculo com thread e o canal atual o suportar, vincular a sessão ACP à thread.
5. Encaminhar mensagens de acompanhamento vinculadas para essa mesma sessão ACP até que ela seja desfocada/fechada/expirada.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principais | `/acp ...`                      | `/subagents ...`                    |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Consulte também [Sub-agents](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. plugin de runtime empacotado `acpx`
3. Adapter ACP do Claude
4. Runtime/mecanismo de sessão do lado do Claude

Distinção importante:

- Claude via ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vínculo opcional com conversa/thread.
  Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente com harness: use ACP

## Sessões vinculadas

### Vínculos com a conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo responsável pelo transporte do canal, autenticação, segurança e entrega.
- A conversa atual é fixada na session key da sessão ACP criada.
- Mensagens de acompanhamento nessa conversa são encaminhadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no lugar.
- `/acp close` fecha a sessão e remove o vínculo da conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver criando trabalho novo. O vínculo anexa essa sessão à conversa atual.
- `--bind here` não cria por si só uma thread filha no Discord nem um tópico no Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace gerenciado pelo backend em disco. Esse workspace de runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você criar uma sessão para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda o workspace **do agente de destino** por padrão, não o do solicitante.
- Se o caminho herdado desse workspace estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw volta para o cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), a criação da sessão retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime de Codex/Claude/Gemini para o qual o OpenClaw encaminha
- thread/tópico filho: uma superfície opcional extra de mensagens criada apenas por `--thread ...`
- workspace de runtime: o local no sistema de arquivos onde o harness é executado (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: mantém este chat, cria ou anexa uma sessão ACP do Codex e encaminha futuras mensagens daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP ali
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo vínculo de chat do exemplo anterior, mas o Codex é executado em `/workspace/repo`

Suporte a vínculo com a conversa atual:

- Canais de chat/mensagem que anunciam suporte a vínculo com a conversa atual podem usar `--bind here` por meio do caminho compartilhado de vínculo de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa "vincular a conversa atual no lugar".
- Vínculos genéricos com a conversa atual usam o armazenamento compartilhado de vínculos do OpenClaw e sobrevivem a reinicializações normais do gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no lugar. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vínculos ACP com a conversa atual, o OpenClaw retorna uma mensagem clara de não compatível.
- `resume` e perguntas sobre "nova sessão" são perguntas sobre sessão ACP, não sobre o canal. Você pode reutilizar ou substituir o estado do runtime sem alterar a superfície de chat atual.

### Sessões vinculadas a thread

Quando vínculos de thread estão ativados para um adapter de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são encaminhadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta à mesma thread.
- Desfocar/fechar/arquivar/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo com thread é específico do adapter. Se o adapter do canal ativo não der suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara de não compatível/não disponível.

Flags de feature necessárias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho ACP)
- Flag de criação de thread ACP no adapter de canal ativada (específica do adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a thread

- Qualquer adapter de canal que exponha capability de vínculo de sessão/thread.
- Suporte interno atual:
  - threads/canais do Discord
  - tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Plugins de canal podem adicionar suporte por meio da mesma interface de vínculo.

## Configurações específicas de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/em grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - Chat DM/em grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefira `chat_id:*` para vínculos estáveis de grupo.
- `bindings[].agentId` é o ID do agente OpenClaw proprietário.
- Substituições opcionais de ACP vivem em `bindings[].acp`:
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedência de substituição para sessões ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. padrões globais de ACP (por exemplo `acp.backend`)

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamento:

- O OpenClaw garante que a sessão ACP configurada exista antes do uso.
- Mensagens nesse canal ou tópico são encaminhadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma session key ACP no lugar.
- Vínculos temporários de runtime (por exemplo criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações de ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos herdados de workspace ausentes voltam para o cwd padrão do backend; falhas reais de acesso em caminhos existentes aparecem como erros de criação.

## Iniciar sessões ACP (interfaces)

### A partir de `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou chamada de ferramenta.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Observações:

- `runtime` usa `subagent` por padrão, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado à sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): ID do harness ACP de destino. Usa `acp.defaultAgent` como fallback, se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo com thread onde houver suporte.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode adotar comportamento persistente por padrão de acordo com o caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado para o runtime (validado pela política do backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes voltam para padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado em texto de sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa por meio de `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de retransmissão.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa por meio de `session/load`, então retoma com o contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão do Codex do seu notebook para o seu telefone — diga ao seu agente para continuar de onde você parou
- Continuar uma sessão de programação iniciada interativamente na CLI, agora de forma headless por meio do seu agente
- Retomar um trabalho interrompido por reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna um erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino deve dar suporte a `session/load` (Codex e Claude Code dão).
- Se o ID da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Smoke test para operadores

Use isto depois de um deploy do gateway quando quiser uma verificação rápida ao vivo de que a criação de sessão ACP
está realmente funcionando ponta a ponta, e não apenas passando em testes unitários.

Gate recomendado:

1. Verifique a versão/commit do gateway implantado no host de destino.
2. Confirme que o código-fonte implantado inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão bridge ACPX temporária para um agente ao vivo (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarefa: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente informa:
   - `accepted=yes`
   - uma `childSessionKey` real
   - nenhum erro de validação
6. Limpe a sessão bridge ACPX temporária.

Exemplo de prompt para o agente ao vivo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha esse smoke test em `mode: "run"` a menos que você esteja testando intencionalmente
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capabilities de solicitante/sessão e é uma verificação de integração separada.
- Trate o teste de `mode: "session"` vinculado a thread como uma segunda passagem de integração, mais rica,
  a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

As sessões ACP atualmente são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP são bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não dá suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução imposta por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador a partir do chat quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Principais flags:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulte [Slash Commands](/pt-BR/tools/slash-commands).

## Resolução de destino da sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta a key
   - depois o session id no formato UUID
   - depois o rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão atual do solicitante

Vínculos com a conversa atual e vínculos com thread participam da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo na criação

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no lugar; falha se nenhuma estiver ativa. |
| `off`  | Não cria um vínculo com a conversa atual.                              |

Observações:

- `--bind here` é o caminho mais simples para o operador dizer "faça este canal ou chat ser apoiado pelo Codex".
- `--bind here` não cria uma thread filha.
- `--bind here` está disponível apenas em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

## Modos de thread na criação

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                  |
| `off`  | Sem vínculo. A sessão é iniciada sem vínculo.                                                           |

Observações:

- Em superfícies sem suporte a vínculo de thread, o comportamento padrão é efetivamente `off`.
- A criação vinculada a thread exige suporte da política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

## Controles ACP

Família de comandos disponível:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` mostra as opções efetivas de runtime e, quando disponíveis, os identificadores de sessão tanto no nível do runtime quanto no nível do backend.

Alguns controles dependem de capabilities do backend. Se um backend não der suporte a um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Cookbook de comandos ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual ou vínculo com thread opcionais. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desfaz vínculos de destinos em thread.    | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.         | `/acp set-mode plan`                                          |
| `/acp set`           | Escrita genérica de opção de configuração de runtime.      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição de diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil de política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout de runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição de modelo do runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.       | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.               | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capabilities, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Mostra etapas determinísticas de instalação e ativação.    | `/acp install`                                                |

`/acp sessions` lê o armazenamento da sessão vinculada atual ou da sessão do solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem destinos por meio da descoberta de sessão do gateway, incluindo raízes personalizadas de `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime da sessão de destino.

## Suporte a harnesses do acpx (atual)

Aliases internos atuais de harness no acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando o OpenClaw usa o backend acpx, prefira estes valores para `agentId`, a menos que sua configuração do acpx defina aliases de agente personalizados.
Se sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão interno.

O uso direto da CLI do acpx também pode apontar para adapters arbitrários por `--agent <command>`, mas essa rota de escape bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` no OpenClaw).

## Configuração obrigatória

Linha de base do ACP no core:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho ACP mantendo os controles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

A configuração de vínculo com thread é específica do adapter de canal. Exemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se a criação de ACP vinculada a thread não funcionar, verifique primeiro a flag de feature do adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos com a conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativo e um adapter de canal que exponha vínculos ACP de conversa.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do plugin para backend acpx

Instalações novas vêm com o plugin de runtime empacotado `acpx` ativado por padrão, então o ACP
geralmente funciona sem uma etapa manual de instalação do plugin.

Comece com:

```text
/acp doctor
```

Se você desativou `acpx`, o negou via `plugins.allow` / `plugins.deny` ou quer
alternar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação de workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois, verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend acpx empacotado (`acpx`) usa o binário local do plugin fixado:

1. O comando usa por padrão o `node_modules/.bin/acpx` local do plugin dentro do pacote do plugin ACPX.
2. A versão esperada usa por padrão o pin da extensão.
3. Na inicialização, o OpenClaw registra o backend ACP imediatamente como não pronto.
4. Um job de garantia em segundo plano verifica `acpx --version`.
5. Se o binário local do plugin estiver ausente ou com versão divergente, ele executa:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente.

Você pode substituir comando/versão na configuração do plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Observações:

- `command` aceita caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos são resolvidos a partir do diretório de workspace do OpenClaw.
- `expectedVersion: "any"` desativa a verificação estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao plugin é desativada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Bridge MCP de ferramentas do plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP, como Codex ou Claude Code, possam chamar ferramentas
instaladas de plugins do OpenClaw, como memory recall/store, ative a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP interno chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins OpenClaw instalados e ativados.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso apenas a ferramentas de plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses plugins sejam executados
  dentro do próprio OpenClaw.
- Revise os plugins instalados antes de ativar isso.

`mcpServers` personalizados continuam funcionando como antes. A bridge interna de ferramentas de plugin é
uma conveniência adicional com opt-in, não um substituto para a configuração genérica de servidor MCP.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação em arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass específicas do fornecedor de backend CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente harness pode executar sem prompt.

| Valor           | Comportamento                                               |
| --------------- | ----------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações em arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                         |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas não há TTY interativo disponível (o que sempre é o caso para sessões ACP).

| Valor  | Comportamento                                                      |
| ------ | ------------------------------------------------------------------ |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**                |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa). |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway depois de alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que dispare um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões sofram degradação graciosa em vez de falhar.

## Diagnóstico

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desativado.                                        | Instale e ative o plugin de backend, depois execute `/acp doctor`.                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desativado globalmente.                                                     | Defina `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho a partir de mensagens normais de thread desativado.                    | Defina `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na allowlist.                                                   | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                     |
| `Unable to resolve session target: ...`                                     | Token incorreto de key/id/label.                                                | Execute `/acp sessions`, copie a key/rótulo exato e tente novamente.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa vinculável ativa.                          | Vá até o chat/canal de destino e tente novamente, ou use criação sem vínculo.                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                      | O adapter não tem capability de vínculo ACP com a conversa atual.               | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                            | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é o proprietário do destino de vínculo ativo.                     | Refaça o vínculo como proprietário ou use outra conversa ou thread.                                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | O adapter não tem capability de vínculo com thread.                             | Use `--thread off` ou vá para um adapter/canal compatível.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute a criação ACP a partir de uma sessão sem sandbox.                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para runtime ACP.                                | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                     |
| Metadados ACP ausentes para a sessão vinculada                              | Metadados de sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn` e depois refaça o vínculo/foco na thread.                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/exec na sessão ACP não interativa.          | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](#permission-configuration). |
| A sessão ACP falha cedo com pouca saída                                     | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway em busca de `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| A sessão ACP fica travada indefinidamente após concluir o trabalho          | O processo do harness terminou, mas a sessão ACP não informou conclusão.        | Monitore com `ps aux \| grep acpx`; finalize manualmente processos obsoletos.                                                                                  |

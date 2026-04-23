---
read_when:
    - Executando harnesses de coding por ACP
    - Configurando sessões ACP vinculadas a conversas em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP e do wiring de Plugin
    - Depurando entrega de conclusão ACP ou loops entre agentes
    - Operando comandos /acp a partir do chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-23T14:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de coding (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar Claude Code em uma thread", o OpenClaw deve encaminhar essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que Codex ou Claude Code se conectem como um cliente MCP externo diretamente
a conversas de canais existentes do OpenClaw, use [`openclaw mcp serve`](/pt-BR/cli/mcp)
em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                       | Use isto                              | Observações                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio do_ OpenClaw | Esta página: agentes ACP              | Sessões vinculadas a chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente | [`openclaw acp`](/pt-BR/cli/acp)            | Modo bridge. O IDE/cliente conversa em ACP com o OpenClaw por stdio/WebSocket                                |
| Reutilizar uma CLI de IA local como modelo fallback somente texto                   | [Backends CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas OpenClaw, sem controles ACP, sem runtime de harness                              |

## Isso funciona pronto para uso?

Normalmente, sim.

- Instalações novas agora incluem o plugin de runtime empacotado `acpx` ativado por padrão.
- O plugin empacotado `acpx` prefere seu binário `acpx` fixado local ao plugin.
- Na inicialização, o OpenClaw sonda esse binário e faz autorreparo se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adaptador de harness de destino pode ser buscado sob demanda com `npx` na primeira vez em que você usar esse harness.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas do adaptador na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw deve estar pronto para inicializar `acpx`, mas o adaptador ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: mesma situação para o adaptador ACP do Claude, mais a autenticação do lado do Claude nesse host.

## Fluxo rápido de operador

Use isto quando quiser um runbook prático de `/acp`:

1. Crie uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa chave de sessão).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste opções de runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Direcione uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Interrompa o trabalho:
   - `/acp cancel` (interromper o turno atual), ou
   - `/acp close` (fechar a sessão + remover vinculações)

## Início rápido para humanos

Exemplos de solicitações naturais:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão Codex persistente em uma thread aqui e mantenha o foco."
- "Execute isso como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o destino do harness solicitado (`agentId`, por exemplo `codex`).
3. Se for solicitada vinculação à conversa atual e o canal ativo oferecer suporte, vincular a sessão ACP a essa conversa.
4. Caso contrário, se for solicitada vinculação à thread e o canal atual oferecer suporte, vincular a sessão ACP à thread.
5. Encaminhar mensagens de acompanhamento vinculadas para essa mesma sessão ACP até perder o foco/fechar/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principais | `/acp ...`                      | `/subagents ...`                    |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa Claude Code

Para Claude Code por ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. plugin de runtime empacotado `acpx`
3. Adaptador ACP do Claude
4. Maquinário de runtime/sessão do lado do Claude

Distinção importante:

- Claude via ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vinculação opcional a conversa/thread.
- Backends CLI são runtimes locais de fallback somente texto separados. Veja [Backends CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto pela CLI bruta: use backends CLI

## Sessões vinculadas

### Vinculações à conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo o responsável pelo transporte do canal, autenticação, segurança e entrega.
- A conversa atual é fixada na chave da sessão ACP criada.
- Mensagens de acompanhamento nessa conversa são encaminhadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão e remove a vinculação da conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver iniciando um trabalho novo. A vinculação anexa essa sessão à conversa atual.
- `--bind here` não cria por si só uma thread filha do Discord nem um tópico do Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace em disco gerenciado pelo backend. Esse workspace de runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você criar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**, não o do solicitante.
- Se esse caminho de workspace herdado estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw usa fallback para o cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), a criação retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável do runtime Codex/Claude/Gemini para o qual o OpenClaw encaminha
- thread/tópico filho: uma superfície extra opcional de mensagens criada apenas por `--thread ...`
- workspace de runtime: a localização no sistema de arquivos onde o harness é executado (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: manter este chat, criar ou anexar uma sessão ACP do Codex e encaminhar futuras mensagens daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP ali
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesma vinculação de chat acima, mas o Codex é executado em `/workspace/repo`

Suporte a vinculação à conversa atual:

- Canais de chat/mensagem que anunciam suporte a vinculação à conversa atual podem usar `--bind here` pelo caminho compartilhado de vinculação de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa "vincular a conversa atual no local".
- Vinculações genéricas à conversa atual usam o armazenamento compartilhado de vinculações do OpenClaw e sobrevivem a reinicializações normais do gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no local. `spawnAcpSessions` é necessário apenas quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vinculações ACP à conversa atual, o OpenClaw retorna uma mensagem clara de não compatível.
- `resume` e perguntas de "nova sessão" são perguntas da sessão ACP, não perguntas do canal. Você pode reutilizar ou substituir o estado do runtime sem mudar a superfície atual do chat.

### Sessões vinculadas a thread

Quando vinculações de thread estão ativadas para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são encaminhadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta na mesma thread.
- Perda de foco/fechamento/arquivamento/expiração por tempo ocioso ou idade máxima remove a vinculação.

O suporte a vinculação de thread é específico do adaptador. Se o adaptador de canal ativo não oferecer suporte a vinculações de thread, o OpenClaw retorna uma mensagem clara de não compatível/indisponível.

Sinalizadores de recurso obrigatórios para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho ACP)
- Sinalizador de criação de thread ACP do adaptador de canal ativado (específico do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a thread

- Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
- Suporte integrado atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Canais de Plugin podem adicionar suporte por meio da mesma interface de vinculação.

## Configurações específicas de canal

Para workflows não efêmeros, configure vinculações ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de vinculação

- `bindings[].type="acp"` marca uma vinculação persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/chat em grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefira `chat_id:*` ou `chat_identifier:*` para vinculações de grupo estáveis.
  - DM/chat em grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefira `chat_id:*` para vinculações de grupo estáveis.
- `bindings[].agentId` é o id do agente OpenClaw proprietário.
- Substituições ACP opcionais ficam em `bindings[].acp`:
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedência de substituição para sessões vinculadas ACP:

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
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no local.
- Vinculações temporárias de runtime (por exemplo criadas por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações de ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos herdados de workspace ausentes usam fallback para o cwd padrão do backend; falhas reais de acesso em caminhos existentes aparecem como erros de criação.

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

- `runtime` usa por padrão `subagent`, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado para a sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Usa fallback para `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vinculação à thread onde houver suporte.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o OpenClaw pode usar comportamento persistente por padrão dependendo do caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado para o runtime (validado pela política do backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes usam fallback para os padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado no texto da sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa por `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de relay.
- `model` (opcional): substituição explícita de modelo para a sessão filha ACP. É respeitada para `runtime: "acp"` para que o filho use o modelo solicitado em vez de usar silenciosamente o padrão do agente de destino.

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano pertencente ao pai. O caminho de entrega depende desse formato.

### Sessões ACP interativas

Sessões interativas foram feitas para continuar conversando em uma superfície visível de chat:

- `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
- `/acp spawn ... --thread ...` vincula uma thread/tópico do canal à sessão ACP.
- `bindings[].type="acp"` persistentes configuradas encaminham conversas correspondentes para a mesma sessão ACP.

Mensagens de acompanhamento na conversa vinculada são encaminhadas diretamente para a sessão ACP, e a saída ACP é entregue de volta no mesmo canal/thread/tópico.

### Sessões ACP one-shot pertencentes ao pai

Sessões ACP one-shot criadas por outra execução de agente são filhos em segundo plano, semelhantes a subagentes:

- O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
- O filho é executado em sua própria sessão de harness ACP.
- A conclusão retorna pelo caminho interno de anúncio de conclusão de tarefa.
- O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

Não trate esse caminho como um chat ponto a ponto entre pai e filho. O filho já tem um canal de conclusão de volta para o pai.

### `sessions_send` e entrega A2A

`sessions_send` pode direcionar outra sessão após a criação. Para sessões pares normais, o OpenClaw usa um caminho de acompanhamento agent-to-agent (A2A) depois de injetar a mensagem:

- aguardar a resposta da sessão de destino
- opcionalmente deixar solicitante e destino trocarem um número limitado de turnos de acompanhamento
- pedir ao destino para produzir uma mensagem de anúncio
- entregar esse anúncio ao canal ou thread visível

Esse caminho A2A é um fallback para envios entre pares em que o remetente precisa de um acompanhamento visível. Ele continua ativado quando uma sessão não relacionada pode ver e enviar mensagem para um destino ACP, por exemplo sob configurações amplas de `tools.sessions.visibility`.

O OpenClaw ignora o acompanhamento A2A apenas quando o solicitante é o pai de seu próprio filho ACP one-shot pertencente ao pai. Nesse caso, executar A2A sobre a conclusão da tarefa pode acordar o pai com o resultado do filho, encaminhar a resposta do pai de volta ao filho e criar um loop de eco pai/filho. O resultado de `sessions_send` informa `delivery.status="skipped"` nesse caso de filho pertencente porque o caminho de conclusão já é responsável pelo resultado.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de iniciar do zero. O agente reproduz seu histórico de conversa por `session/load`, então retoma com o contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do seu laptop para o telefone — peça ao seu agente para retomar de onde você parou
- Continuar uma sessão de coding iniciada interativamente na CLI, agora em modo headless pelo seu agente
- Retomar um trabalho interrompido por reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o id da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Smoke test de operador

Use isto após um deploy do gateway quando quiser uma verificação live rápida de que a criação ACP
está realmente funcionando de ponta a ponta, não apenas passando em testes unitários.

Verificação recomendada:

1. Verifique a versão/commit do gateway implantado no host de destino.
2. Confirme que a origem implantada inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão temporária de bridge ACPX para um agente live (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarefa: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente informa:
   - `accepted=yes`
   - um `childSessionKey` real
   - nenhum erro de validator
6. Limpe a sessão temporária de bridge ACPX.

Exemplo de prompt para o agente live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha este smoke test em `mode: "run"` a menos que esteja testando intencionalmente
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para a verificação básica. Esse caminho depende de
  capacidades do solicitante/sessão e é uma verificação de integração separada.
- Trate o teste vinculado a thread com `mode: "session"` como uma segunda
  etapa de integração mais rica a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Atualmente, sessões ACP são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP são bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução reforçada por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador a partir do chat quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Principais sinalizadores:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Veja [Comandos com barra](/pt-BR/tools/slash-commands).

## Resolução de destino de sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta chave
   - depois id de sessão em formato UUID
   - depois rótulo
2. Vinculação de thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão atual do solicitante

Vinculações à conversa atual e vinculações de thread participam da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vinculação na criação

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
| `off`  | Não cria uma vinculação à conversa atual.                              |

Observações:

- `--bind here` é o caminho de operador mais simples para “tornar este canal ou chat respaldado por Codex”.
- `--bind here` não cria uma thread filha.
- `--bind here` está disponível apenas em canais que expõem suporte a vinculação à conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

## Modos de thread na criação

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                |
| `off`  | Sem vinculação. A sessão inicia desvinculada.                                                         |

Observações:

- Em superfícies sem suporte a vinculação de thread, o comportamento padrão é efetivamente `off`.
- Criação vinculada a thread exige suporte da política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

## Controles ACP

Família de comandos disponíveis:

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

`/acp status` mostra as opções efetivas de runtime e, quando disponível, identificadores de sessão tanto em nível de runtime quanto em nível de backend.

Alguns controles dependem de capacidades do backend. Se um backend não oferecer suporte a um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Cookbook de comandos ACP

| Comando              | O que faz                                                | Exemplo                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vinculação opcional à conversa atual ou à thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de thread.          | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.       | `/acp set-mode plan`                                          |
| `/acp set`           | Gravação genérica de opção de configuração de runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define perfil de política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define timeout do runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define substituição de modelo do runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opção de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.             | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e ativação. | `/acp install`                                                |

`/acp sessions` lê o armazenamento da sessão vinculada atual ou da sessão solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem destinos por meio da descoberta de sessão do gateway, incluindo raízes personalizadas `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime para a sessão de destino.

## Suporte de harness acpx (atual)

Aliases de harness integrados atuais do acpx:

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

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se sua instalação local do Cursor ainda expõe ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários por `--agent <command>`, mas essa saída bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Baseline de ACP no core:

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

A configuração de vinculação de thread é específica do adaptador de canal. Exemplo para Discord:

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

Se a criação ACP vinculada a thread não funcionar, primeiro verifique o sinalizador de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vinculações à conversa atual não exigem criação de thread filha. Elas exigem um contexto ativo de conversa e um adaptador de canal que exponha vinculações ACP de conversa.

Veja [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do Plugin para backend acpx

Instalações novas já incluem o plugin de runtime empacotado `acpx` ativado por padrão, então o ACP
normalmente funciona sem uma etapa manual de instalação do plugin.

Comece com:

```text
/acp doctor
```

Se você desativou `acpx`, o negou via `plugins.allow` / `plugins.deny`, ou quer
trocar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação de workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend acpx empacotado (`acpx`) usa o binário fixado local ao plugin:

1. O comando usa por padrão o `node_modules/.bin/acpx` local ao plugin dentro do pacote do Plugin ACPX.
2. A versão esperada usa por padrão o pin da extension.
3. A inicialização registra imediatamente o backend ACP como não pronto.
4. Um job de garantia em segundo plano verifica `acpx --version`.
5. Se o binário local ao plugin estiver ausente ou com versão divergente, ele executa:
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
- `expectedVersion: "any"` desativa a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao plugin é desativada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Veja [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependência

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos de plataforma) são instaladas automaticamente
por um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por `openclaw acp doctor`.

### Bridge MCP de ferramentas de Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por Plugin do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem
ferramentas de Plugin instaladas do OpenClaw, como recuperação/armazenamento de memória, ative a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas de Plugin já registradas por plugins instalados e ativados do OpenClaw.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso apenas às ferramentas de Plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses plugins executem no
  próprio OpenClaw.
- Revise plugins instalados antes de ativá-lo.

`mcpServers` personalizados continuam funcionando como antes. A bridge integrada de ferramentas de plugin é
uma conveniência adicional opt-in, não uma substituição para configuração genérica de servidor MCP.

### Bridge MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas integradas do OpenClaw por
MCP. Ative a bridge separada de ferramentas core quando um agente ACP precisar de
ferramentas integradas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas integradas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramenta core explícita e desativada por padrão.

### Configuração de timeout de runtime

O plugin empacotado `acpx` usa por padrão um
timeout de 120 segundos para turnos de runtime embutido. Isso dá a harnesses mais lentos, como Gemini CLI, tempo suficiente para concluir
a inicialização e bootstrap do ACP. Substitua se o seu host precisar de um
limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway depois de alterar esse valor.

### Configuração do agente de sonda de integridade

O plugin empacotado `acpx` sonda um agente de harness enquanto decide se o
backend de runtime embutido está pronto. O padrão é `codex`. Se sua implantação
usar um agente ACP padrão diferente, defina o agente de sonda com o mesmo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway depois de alterar esse valor.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de escrita em arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de sinalizadores de bypass do fornecedor de backend CLI, como o `--permission-mode bypassPermissions` da CLI Claude. ACPX `approve-all` é o interruptor break-glass no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem solicitar confirmação.

| Valor           | Comportamento                                             |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as escritas em arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; escritas e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                       |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas não há TTY interativo disponível (o que sempre é o caso em sessões ACP).

| Valor  | Comportamento                                                      |
| ------ | ------------------------------------------------------------------ |
| `fail` | Interrompe a sessão com `AcpRuntimeError`. **(padrão)**            |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa). |

### Configuração

Defina pela configuração do Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer escrita ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem graciosamente em vez de falhar.

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desativado.                                        | Instale e ative o plugin de backend, depois execute `/acp doctor`.                                                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desativado globalmente.                                                     | Defina `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | O despacho a partir de mensagens normais de thread está desativado.             | Defina `acp.dispatch.enabled=true`.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | O agente não está na allowlist.                                                 | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa e vinculável.                        | Vá para o chat/canal de destino e tente novamente, ou use criação sem vinculação.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP à conversa atual.              | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                 |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                            | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é o proprietário do destino de vinculação ativo.                  | Refaça a vinculação como proprietário ou use outra conversa ou thread.                                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                         | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute a criação ACP a partir de uma sessão sem sandbox.                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para runtime ACP.                                | Use `runtime="subagent"` para sandbox obrigatório ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                          |
| Missing ACP metadata for bound session                                      | Metadados de sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn`, depois refaça a vinculação/foco da thread.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia escritas/exec em sessão ACP não interativa.           | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](#permission-configuration).        |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não informou conclusão.        | Monitore com `ps aux \| grep acpx`; encerre manualmente processos obsoletos.                                                                                       |

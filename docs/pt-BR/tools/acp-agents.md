---
read_when:
    - Executando harnesses de codificação por meio de ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solucionando problemas de backend ACP e de integração de plugin
    - Operando comandos `/acp` pelo chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-08T02:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71c7c0cdae5247aefef17a0029360950a1c2987ddcee21a1bb7d78c67da52950
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

As sessões [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de codificação (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar o Claude Code em uma thread", o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada spawn de sessão ACP é rastreado como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que o Codex ou o Claude Code se conectem diretamente como um cliente MCP externo
a conversas de canal existentes do OpenClaw, use [`openclaw mcp serve`](/cli/mcp)
em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                     | Use isto                              | Observações                                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio do_ OpenClaw | Esta página: Agentes ACP              | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente      | [`openclaw acp`](/cli/acp)            | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                           |
| Reutilizar um CLI de IA local como modelo de fallback somente de texto                                 | [CLI Backends](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime harness                                   |

## Isso funciona imediatamente?

Normalmente, sim.

- Instalações novas agora vêm com o plugin de runtime `acpx` incluído e habilitado por padrão.
- O plugin `acpx` incluído prefere seu binário `acpx` fixado local ao plugin.
- Na inicialização, o OpenClaw faz probe desse binário e o autorepara, se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adaptador do harness de destino pode ser buscado sob demanda com `npx` na primeira vez que você usar esse harness.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adaptador na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw deve estar pronto para inicializar `acpx`, mas o adaptador ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: a mesma história para o adaptador ACP do Claude, além da autenticação do lado do Claude nesse host.

## Fluxo rápido do operador

Use isto quando quiser um runbook prático de `/acp`:

1. Inicie uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou mire essa chave de sessão explicitamente).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste as opções de runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Direcione uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Pare o trabalho:
   - `/acp cancel` (interrompe o turno atual), ou
   - `/acp close` (fecha a sessão + remove vínculos)

## Início rápido para pessoas

Exemplos de solicitações em linguagem natural:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão persistente do Codex em uma thread aqui e mantenha o foco."
- "Execute isto como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread, depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o alvo de harness solicitado (`agentId`, por exemplo `codex`).
3. Se for solicitada vinculação à conversa atual e o canal ativo a suportar, vincular a sessão ACP a essa conversa.
4. Caso contrário, se for solicitada vinculação à thread e o canal atual a suportar, vincular a sessão ACP à thread.
5. Rotear mensagens de acompanhamento vinculadas para essa mesma sessão ACP até perder o foco/fechar/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente                |
| ------------- | ------------------------------------- | ------------------------------------ |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                            | `/subagents ...`                   |
| Ferramenta de spawn    | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Sub-agents](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para o Claude Code via ACP, a stack é:

1. Plano de controle de sessão ACP do OpenClaw
2. plugin de runtime `acpx` incluído
3. Adaptador ACP do Claude
4. Maquinário de runtime/sessão do lado do Claude

Distinção importante:

- Claude via ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vinculação opcional a conversa/thread.
- Backends de CLI são runtimes locais separados de fallback somente de texto. Veja [CLI Backends](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente em harness: use ACP
- quer fallback local simples de texto por meio do CLI bruto: use backends de CLI

## Sessões vinculadas

### Vínculos à conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo o dono do transporte do canal, autenticação, segurança e entrega.
- A conversa atual é fixada na chave da sessão ACP iniciada.
- Mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada in place.
- `/acp close` fecha a sessão e remove o vínculo com a conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver iniciando trabalho novo. O vínculo anexa essa sessão à conversa atual.
- `--bind here` não cria sozinho uma thread filha no Discord nem um tópico no Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace em disco gerenciado pelo backend. Esse workspace do runtime é separado da superfície do chat e não implica uma nova thread de mensagens.
- Se você iniciar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**, não o do solicitante.
- Se o caminho herdado do workspace estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw recorre ao cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), o spawn retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam falando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime de Codex/Claude/Gemini para o qual o OpenClaw roteia
- thread/tópico filho: uma superfície extra opcional de mensagens criada somente por `--thread ...`
- workspace do runtime: o local no sistema de arquivos onde o harness é executado (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: mantenha este chat, inicie ou anexe uma sessão ACP do Codex e roteie mensagens futuras daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP lá
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo vínculo de chat acima, mas o Codex roda em `/workspace/repo`

Suporte a vinculação da conversa atual:

- Canais de chat/mensagem que anunciam suporte a vinculação da conversa atual podem usar `--bind here` por meio do caminho compartilhado de vinculação de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa "vincular a conversa atual in place".
- Vínculos genéricos à conversa atual usam a store de vínculos compartilhada do OpenClaw e sobrevivem a reinicializações normais do gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual in place. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vínculos ACP à conversa atual, o OpenClaw retorna uma mensagem clara de não compatibilidade.
- `resume` e perguntas de "nova sessão" são perguntas sobre sessão ACP, não sobre canal. Você pode reutilizar ou substituir o estado do runtime sem mudar a superfície atual do chat.

### Sessões vinculadas à thread

Quando vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta na mesma thread.
- Perda de foco/fechamento/arquivamento/timeout por ociosidade ou expiração de idade máxima removem o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não suportar vínculos de thread, o OpenClaw retorna uma mensagem clara de não compatível/indisponível.

Flags de recurso obrigatórias para ACP vinculado à thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` vem ativado por padrão (defina `false` para pausar o despacho ACP)
- Flag de spawn ACP de thread do adaptador de canal habilitada (específica do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte embutido atual:
  - threads/canais do Discord
  - tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Plugins de canal podem adicionar suporte pela mesma interface de vínculo.

## Configurações específicas do canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat de DM/grupo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - Chat de DM/grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` para vínculos estáveis de grupo.
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
- Mensagens nesse canal ou tópico são roteadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP in place.
- Vínculos temporários de runtime (por exemplo criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para spawns ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos herdados de workspace ausentes recorrem ao cwd padrão do backend; falhas reais de acesso em caminhos existentes aparecem como erros de spawn.

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

- `runtime` tem como padrão `subagent`, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa vinculada persistente.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado à sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Recorre a `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicita o fluxo de vínculo com thread quando compatível.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode assumir comportamento persistente conforme o caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho do runtime solicitado (validado pela política do backend/runtime). Se omitido, o spawn ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes recorrem aos padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo visível ao operador usado no texto de sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz o histórico da conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo do relay.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz o histórico da conversa via `session/load`, então ele retoma com todo o contexto do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão do Codex do seu laptop para o seu telefone — diga ao seu agente para retomar de onde você parou
- Continuar uma sessão de codificação que você iniciou interativamente na CLI, agora em modo headless por meio do seu agente
- Retomar um trabalho interrompido por reinicialização do gateway ou timeout por ociosidade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino deve suportar `session/load` (Codex e Claude Code suportam).
- Se o id da sessão não for encontrado, o spawn falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Smoke test do operador

Use isto após um deploy do gateway quando quiser uma verificação rápida ao vivo de que o spawn ACP
está realmente funcionando de ponta a ponta, não apenas passando em testes unitários.

Gate recomendado:

1. Verifique a versão/commit do gateway implantado no host de destino.
2. Confirme que o código-fonte implantado inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão bridge ACPX temporária para um agente ativo (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarefa: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente informa:
   - `accepted=yes`
   - uma `childSessionKey` real
   - nenhum erro de validador
6. Faça a limpeza da sessão bridge ACPX temporária.

Exemplo de prompt para o agente ativo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha este smoke test em `mode: "run"` a menos que você esteja testando
  intencionalmente sessões ACP persistentes vinculadas à thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capacidades da sessão/solicitante e é uma verificação separada de integração.
- Trate o teste de `mode: "session"` vinculado à thread como uma segunda etapa
  de integração mais rica a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

As sessões ACP atualmente são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, spawns ACP serão bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não suporta `sandbox: "require"`.
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

Flags principais:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Veja [Slash Commands](/pt-BR/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de alvo (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o id de sessão em formato UUID
   - depois o rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback da sessão solicitante atual

Vínculos da conversa atual e vínculos de thread participam da etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo no spawn

`/acp spawn` suporta `--bind here|off`.

| Modo   | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual in place; falha se nenhuma estiver ativa. |
| `off`  | Não cria um vínculo com a conversa atual.                              |

Observações:

- `--bind here` é o caminho mais simples para o operador em "faça este canal ou chat ser respaldado por Codex".
- `--bind here` não cria uma thread filha.
- `--bind here` só está disponível em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

## Modos de thread no spawn

`/acp spawn` suporta `--thread auto|here|off`.

| Modo   | Comportamento                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando compatível. |
| `here` | Exige thread ativa atual; falha se você não estiver em uma.                                               |
| `off`  | Sem vínculo. A sessão inicia desvinculada.                                                                |

Observações:

- Em superfícies sem vínculo de thread, o comportamento padrão efetivamente é `off`.
- Spawn vinculado à thread exige suporte da política do canal:
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

`/acp status` mostra as opções efetivas de runtime e, quando disponível, os identificadores de sessão tanto no nível do runtime quanto no nível do backend.

Alguns controles dependem de capacidades do backend. Se um backend não suportar um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Livro de receitas de comandos ACP

| Comando              | O que faz                                               | Exemplo                                                       |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria uma sessão ACP; vínculo atual opcional ou vínculo de thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia uma instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.            | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime e capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.      | `/acp set-mode plan`                                          |
| `/acp set`           | Grava uma opção genérica de configuração de runtime.    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil de política de aprovação.               | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                 | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição de modelo do runtime.             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opção de runtime da sessão.     | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes da store.                    | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades e correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                                |

`/acp sessions` lê a store da sessão atual vinculada ou da sessão solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem alvos por meio da descoberta de sessão do gateway, incluindo raízes personalizadas `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` é mapeado para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` é mapeado para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` é mapeado para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime para a sessão de destino.

## Suporte a harness acpx (atual)

Aliases de harness embutidos atuais do acpx:

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

Quando o OpenClaw usa o backend acpx, prefira estes valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se a sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de mudar o padrão embutido.

O uso direto da CLI do acpx também pode mirar adaptadores arbitrários via `--agent <command>`, mas essa saída bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Baseline do ACP no core:

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

A configuração de vínculo de thread é específica do adaptador de canal. Exemplo para o Discord:

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

Se o spawn ACP vinculado à thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos à conversa atual não exigem criação de thread filha. Eles exigem um contexto ativo de conversa e um adaptador de canal que exponha vínculos ACP de conversa.

Veja [Configuration Reference](/pt-BR/gateway/configuration-reference).

## Configuração do plugin para backend acpx

Instalações novas vêm com o plugin de runtime `acpx` incluído e habilitado por padrão, então o ACP
geralmente funciona sem etapa manual de instalação de plugin.

Comece com:

```text
/acp doctor
```

Se você desativou `acpx`, o negou via `plugins.allow` / `plugins.deny`, ou quer
mudar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação a partir do workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend acpx incluído (`acpx`) usa o binário fixado local ao plugin:

1. O comando tem como padrão o `node_modules/.bin/acpx` local ao plugin dentro do pacote do plugin ACPX.
2. A versão esperada tem como padrão o pin da extensão.
3. Na inicialização, o backend ACP é registrado imediatamente como não pronto.
4. Um job de garantia em segundo plano verifica `acpx --version`.
5. Se o binário local ao plugin estiver ausente ou incompatível, ele executa:
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

- `command` aceita um caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos são resolvidos a partir do diretório do workspace do OpenClaw.
- `expectedVersion: "any"` desativa a correspondência rígida de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao plugin é desativada.
- A inicialização do OpenClaw permanece não bloqueante enquanto a verificação de integridade do backend é executada.

Veja [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Ponte MCP de ferramentas de plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugins do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem ferramentas de plugins instalados do
OpenClaw, como recuperação/armazenamento de memória, habilite a ponte dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP embutido chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas de plugins já registradas por plugins OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desligado por padrão.

Observações de segurança e confiança:

- Isso amplia a superfície de ferramentas do harness ACP.
- Agentes ACP só obtêm acesso a ferramentas de plugins já ativos no gateway.
- Trate isso como o mesmo limite de confiança que permitir que esses plugins sejam executados
  no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar.

`mcpServers` personalizados continuam funcionando como antes. A ponte embutida de ferramentas de plugin é uma
conveniência adicional opt-in, não um substituto para a configuração genérica de servidor MCP.

### Configuração de timeout do runtime

O plugin `acpx` incluído define por padrão turns de runtime embutido com timeout de 120 segundos. Isso dá
a harnesses mais lentos, como Gemini CLI, tempo suficiente para concluir
a inicialização e o bootstrap do ACP. Substitua se o seu host precisar de um limite
de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

As sessões ACP são executadas sem interação — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness do ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass de fornecedor em backends de CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é o interruptor de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode executar sem prompt.

| Valor           | Comportamento                                            |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                      |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas nenhum TTY interativo está disponível (o que sempre ocorre em sessões ACP).

| Valor  | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Interrompe a sessão com `AcpRuntimeError`. **(padrão)**                |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa).     |

### Configuração

Defina por meio da configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** No momento, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP sem interação, qualquer gravação ou exec que dispare um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões tenham degradação graciosa em vez de travar.

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desabilitado.                                      | Instale e habilite o plugin de backend, depois execute `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                   | Defina `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho a partir de mensagens normais da thread desabilitado.                  | Defina `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na allowlist.                                                   | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                       |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exato, tente novamente.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa ativa vinculável.                      | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP à conversa atual.                 | Use `/acp spawn ... --thread ...` quando compatível, configure `bindings[]` de nível superior ou vá para um canal compatível.                                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` foi usado fora de um contexto de thread.                        | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é dono do alvo de vínculo ativo.                                  | Refaça o vínculo como proprietário ou use outra conversa ou thread.                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo de thread.                            | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` a partir de sessões em sandbox ou execute o spawn ACP a partir de uma sessão fora de sandbox.                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` foi solicitado para o runtime ACP.                          | Use `runtime="subagent"` para sandbox obrigatório ou use ACP com `sandbox="inherit"` a partir de uma sessão fora de sandbox.                                    |
| Missing ACP metadata for bound session                                      | Metadados da sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn`, depois refaça o vínculo/foco da thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/exec em sessão ACP sem interação.           | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](#configuração-de-permissões).    |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões totais, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não informou conclusão.        | Monitore com `ps aux \| grep acpx`; mate processos obsoletos manualmente.                                                                                         |

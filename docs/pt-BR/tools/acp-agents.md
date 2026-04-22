---
read_when:
    - Executando harnesses de codificação por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP e do wiring de plugin
    - Depurando a entrega de conclusão do ACP ou loops de agente para agente
    - Operando comandos `/acp` pelo chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-22T04:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de codificação (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar Claude Code em uma thread", o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada spawn de sessão ACP é rastreado como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que Codex ou Claude Code se conectem como um client MCP externo diretamente
a conversas de canal existentes do OpenClaw, use [`openclaw mcp serve`](/cli/mcp)
em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                     | Use isto                              | Observações                                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio_ do OpenClaw | Esta página: agentes ACP              | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do Gateway do OpenClaw _como_ um servidor ACP para um editor ou client      | [`openclaw acp`](/cli/acp)            | Modo bridge. IDE/client conversa via ACP com o OpenClaw por stdio/WebSocket                                          |
| Reutilizar uma AI CLI local como modelo de fallback somente texto                                 | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                             |

## Isso funciona imediatamente?

Na maioria das vezes, sim.

- Instalações novas agora vêm com o plugin de runtime `acpx` incluído habilitado por padrão.
- O plugin `acpx` incluído prefere seu binário `acpx` fixado local ao plugin.
- Na inicialização, o OpenClaw verifica esse binário e faz autorreparo nele se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adaptador de harness de destino pode ser buscado sob demanda com `npx` na primeira vez que você usar esse harness.
- A autenticação do vendor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adaptador na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw já deve estar pronto para inicializar o `acpx`, mas o adaptador ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: mesma situação para o adaptador ACP do Claude, além da autenticação do lado do Claude nesse host.

## Fluxo rápido para operadores

Use isto quando quiser um runbook prático de `/acp`:

1. Gere uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa chave de sessão).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste opções de runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dê um empurrão em uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Pare o trabalho:
   - `/acp cancel` (interrompe o turno atual), ou
   - `/acp close` (fecha a sessão + remove vínculos)

## Início rápido para humanos

Exemplos de solicitações naturais:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão persistente do Codex em uma thread aqui e mantenha o foco."
- "Execute isso como uma sessão ACP pontual do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o destino de harness solicitado (`agentId`, por exemplo `codex`).
3. Se um vínculo com a conversa atual for solicitado e o canal ativo oferecer suporte a isso, vincular a sessão ACP a essa conversa.
4. Caso contrário, se um vínculo com thread for solicitado e o canal atual oferecer suporte a isso, vincular a sessão ACP à thread.
5. Rotear mensagens de acompanhamento vinculadas para essa mesma sessão ACP até desfocar/fechar/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw  |
| Chave de sessão   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                            | `/subagents ...`                   |
| Ferramenta de spawn    | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Consulte também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. plugin de runtime `acpx` incluído
3. Adaptador ACP do Claude
4. Maquinário de runtime/sessão do lado do Claude

Distinção importante:

- Claude via ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vínculo opcional com conversa/thread.
- Backends de CLI são runtimes separados de fallback local somente texto. Consulte [Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto por meio da CLI bruta: use backends de CLI

## Sessões vinculadas

### Vínculos com a conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo dono do transporte do canal, autenticação, segurança e entrega.
- A conversa atual é fixada na chave da sessão ACP gerada.
- Mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão e remove o vínculo da conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver gerando trabalho novo. O vínculo anexa essa sessão à conversa atual.
- `--bind here` não cria uma thread filha do Discord nem um tópico do Telegram por si só.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace em disco gerenciado pelo backend. Esse workspace de runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você gerar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**, não do solicitante.
- Se esse caminho herdado do workspace estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw recorre ao cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), o spawn retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime de Codex/Claude/Gemini para o qual o OpenClaw roteia
- thread/tópico filho: uma superfície extra opcional de mensagens criada apenas por `--thread ...`
- workspace de runtime: o local no sistema de arquivos onde o harness é executado (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: manter este chat, gerar ou anexar uma sessão ACP do Codex e rotear futuras mensagens daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP lá
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo vínculo de chat acima, mas o Codex executa em `/workspace/repo`

Suporte a vínculo com a conversa atual:

- Canais de chat/mensagem que anunciam suporte a vínculo com a conversa atual podem usar `--bind here` pelo caminho compartilhado de vínculo de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa "vincular a conversa atual no local".
- Vínculos genéricos com a conversa atual usam o armazenamento compartilhado de vínculos do OpenClaw e sobrevivem a reinicializações normais do Gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no local. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vínculos ACP com a conversa atual, o OpenClaw retornará uma mensagem clara de recurso sem suporte.
- `resume` e perguntas de "nova sessão" são questões da sessão ACP, não do canal. Você pode reutilizar ou substituir o estado de runtime sem mudar a superfície atual de chat.

### Sessões vinculadas a thread

Quando vínculos de thread são habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída do ACP é entregue de volta à mesma thread.
- Desfocar/fechar/arquivar/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara de recurso não compatível/indisponível.

Flags de recurso necessárias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` vem ativado por padrão (defina `false` para pausar o dispatch ACP)
- Flag de spawn de thread ACP do adaptador de canal habilitada (específica do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais compatíveis com thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte integrado atual:
  - threads/canais do Discord
  - tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Plugins de canal podem adicionar suporte pela mesma interface de vínculo.

## Configurações específicas por canal

Para fluxos não efêmeros, configure vínculos ACP persistentes em entradas de nível superior `bindings[]`.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - Chat DM/grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
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
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no local.
- Vínculos temporários de runtime (por exemplo criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para spawns ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos herdados de workspace ausentes recorrem ao cwd padrão do backend; falhas de acesso em caminhos existentes aparecem como erros de spawn.

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

- `task` (obrigatório): prompt inicial enviado para a sessão ACP.
- `runtime` (obrigatório para ACP): precisa ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Usa `acp.defaultAgent` como fallback se estiver definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo com thread onde houver suporte.
- `mode` (opcional): `run` (pontual) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode assumir comportamento persistente por caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado para o runtime (validado pela política do backend/runtime). Se omitido, o spawn ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes recorrem aos padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado em texto de sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz o histórico da conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos iniciais de progresso da execução ACP de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo do relay.

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano sob posse do pai. O caminho de entrega depende desse formato.

### Sessões ACP interativas

Sessões interativas servem para continuar conversando em uma superfície visível de chat:

- `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
- `/acp spawn ... --thread ...` vincula uma thread/tópico do canal à sessão ACP.
- `bindings[].type="acp"` persistentes e configurados roteiam conversas correspondentes para a mesma sessão ACP.

Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a sessão ACP, e a saída do ACP é entregue de volta ao mesmo canal/thread/tópico.

### Sessões ACP pontuais sob posse do pai

Sessões ACP pontuais geradas por outra execução de agente são filhos em segundo plano, semelhantes a subagentes:

- O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
- O filho executa em sua própria sessão de harness ACP.
- A conclusão é reportada de volta pelo caminho interno de anúncio de conclusão de tarefa.
- O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

Não trate esse caminho como um chat peer-to-peer entre pai e filho. O filho já tem um canal de conclusão de volta ao pai.

### `sessions_send` e entrega A2A

`sessions_send` pode direcionar outra sessão após o spawn. Para sessões peer normais, o OpenClaw usa um caminho de acompanhamento agente-para-agente (A2A) após injetar a mensagem:

- espera a resposta da sessão de destino
- opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento
- solicita que o destino produza uma mensagem de anúncio
- entrega esse anúncio ao canal ou thread visível

Esse caminho A2A é um fallback para envios peer em que o remetente precisa de um acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode ver e enviar mensagens a um destino ACP, por exemplo sob configurações amplas de `tools.sessions.visibility`.

O OpenClaw ignora o acompanhamento A2A apenas quando o solicitante é o pai de seu próprio filho ACP pontual sob posse do pai. Nesse caso, executar A2A além da conclusão da tarefa pode acordar o pai com o resultado do filho, encaminhar a resposta do pai de volta ao filho e criar um loop de eco pai/filho. O resultado de `sessions_send` reporta `delivery.status="skipped"` nesse caso de filho sob posse, porque o caminho de conclusão já é responsável pelo resultado.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz o histórico da conversa via `session/load`, então continua com o contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do notebook para o telefone — diga ao agente para retomar de onde você parou
- Continuar uma sessão de codificação iniciada interativamente na CLI, agora sem interface por meio do seu agente
- Retomar trabalho interrompido por reinicialização do Gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico upstream da conversa ACP; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` continua exigindo `thread: true`.
- O agente de destino precisa oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o id da sessão não for encontrado, o spawn falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Smoke test do operador

Use isto após um deploy do Gateway quando quiser uma verificação rápida em ambiente real de que o spawn ACP
está realmente funcionando de ponta a ponta, não apenas passando em testes unitários.

Gate recomendado:

1. Verifique a versão/commit do Gateway implantado no host de destino.
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
   - um `childSessionKey` real
   - nenhum erro de validador
6. Faça a limpeza da sessão bridge ACPX temporária.

Exemplo de prompt para o agente ativo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha esse smoke test em `mode: "run"` a menos que você esteja testando
  intencionalmente sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capacidades do solicitante/sessão e é uma verificação de integração separada.
- Trate testes de `mode: "session"` vinculados a thread como uma segunda
  etapa de integração mais rica, a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Atualmente, sessões ACP executam no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, spawns ACP são bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução imposta por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito pelo operador a partir do chat, quando necessário.

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

Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de destino (ou `--session` para `/acp steer`)
   - tenta chave
   - depois id de sessão em formato UUID
   - depois rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão atual do solicitante

Vínculos com a conversa atual e vínculos de thread participam da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo de spawn

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                               |
| ------ | ---------------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa.     |
| `off`  | Não cria vínculo com a conversa atual.                                       |

Observações:

- `--bind here` é o caminho mais simples para operadores para "fazer este canal ou chat ser sustentado por Codex".
- `--bind here` não cria thread filha.
- `--bind here` só está disponível em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

## Modos de thread de spawn

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
| `here` | Exige a thread ativa atual; falha se não estiver em uma.                                                |
| `off`  | Sem vínculo. A sessão inicia desvinculada.                                                              |

Observações:

- Em superfícies sem vínculo de thread, o comportamento padrão é efetivamente `off`.
- O spawn vinculado a thread exige suporte da política do canal:
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

Alguns controles dependem das capacidades do backend. Se um backend não oferecer suporte a um controle, o OpenClaw retorna um erro claro de controle sem suporte.

## Cookbook de comandos ACP

| Comando              | O que faz                                                | Exemplo                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual opcional ou vínculo de thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direção para a sessão em execução.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de thread.          | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime da sessão de destino.           | `/acp set-mode plan`                                          |
| `/acp set`           | Gravação genérica de opção de configuração de runtime.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil de política de aprovação.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                  | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição de modelo do runtime.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opção de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do store.                     | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                                |

`/acp sessions` lê o store da sessão atual vinculada ou da sessão do solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem destinos por meio da descoberta de sessão do Gateway, incluindo raízes personalizadas de `session.store` por agente.

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

## Suporte atual de harness acpx

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

Quando o OpenClaw usa o backend acpx, prefira estes valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` em sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode apontar para adaptadores arbitrários via `--agent <command>`, mas esse escape hatch bruto é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Linha de base ACP do core:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o dispatch ACP mantendo os controles /acp.
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

A configuração de vínculo de thread é específica do adaptador de canal. Exemplo para Discord:

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

Se o spawn ACP vinculado a thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos com a conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativo e um adaptador de canal que exponha vínculos ACP de conversa.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração de plugin para backend acpx

Instalações novas vêm com o plugin de runtime `acpx` incluído e habilitado por padrão, então o ACP
geralmente funciona sem uma etapa manual de instalação do plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, o negou via `plugins.allow` / `plugins.deny`, ou quer
mudar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação a partir de workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend acpx incluído (`acpx`) usa o binário fixado local ao plugin:

1. O comando usa por padrão o `node_modules/.bin/acpx` local ao plugin dentro do pacote do plugin ACPX.
2. A versão esperada usa por padrão o pin da extensão.
3. A inicialização registra imediatamente o backend ACP como não pronto.
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
- Caminhos relativos são resolvidos a partir do diretório de workspace do OpenClaw.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a autoinstalação local ao plugin é desabilitada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx
(binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de pós-instalação. Se a instalação automática falhar, o Gateway ainda inicia
normalmente e reporta a dependência ausente via `openclaw acp doctor`.

### Bridge MCP de ferramentas de plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por plugin do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem
ferramentas de plugin instaladas do OpenClaw, como recuperação/armazenamento de memória, habilite a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas de plugin já registradas por plugins OpenClaw
  instalados e habilitados.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP têm acesso apenas às ferramentas de plugin já ativas no Gateway.
- Trate isso como o mesmo limite de confiança que permitir a execução desses plugins no
  próprio OpenClaw.
- Revise os plugins instalados antes de habilitar isso.

`mcpServers` personalizados continuam funcionando como antes. A bridge integrada de ferramentas de plugin é uma conveniência adicional opt-in, não uma substituição para a configuração genérica de servidor MCP.

### Configuração de timeout de runtime

O plugin `acpx` incluído usa por padrão um
timeout de 120 segundos para turnos de runtime embutido. Isso dá a harnesses mais lentos, como Gemini CLI, tempo suficiente para concluir
a inicialização e a preparação do ACP. Substitua se seu host precisar de um
limite diferente de runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o Gateway após alterar esse valor.

### Configuração do agente de health probe

O plugin `acpx` incluído verifica um agente de harness enquanto decide se o
backend de runtime embutido está pronto. O padrão é `codex`. Se sua implantação
usar um agente ACP padrão diferente, defina o agente de probe com o mesmo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o Gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP executam sem interação — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass específicas do vendor em backends de CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é o interruptor break-glass no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem prompt.

| Valor           | Comportamento                                                  |
| --------------- | -------------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                              |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas nenhum TTY interativo está disponível (o que sempre acontece em sessões ACP).

| Valor  | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**                    |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa).     |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o Gateway após alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que dispare um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões façam degradação graciosa em vez de travar.

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | O plugin de backend está ausente ou desabilitado.                              | Instale e habilite o plugin de backend e depois execute `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                   | Defina `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | O dispatch a partir de mensagens normais da thread está desabilitado.          | Defina `acp.dispatch.enabled=true`.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | O agente não está na allowlist.                                                 | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa ativa vinculável.                      | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP com a conversa atual.             | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` no nível superior ou vá para um canal compatível.                                 |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` foi usado fora de um contexto de thread.                        | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é dono do alvo de vínculo ativo.                                  | Refaça o vínculo como owner ou use outra conversa ou thread.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo de thread.                            | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP está no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox.                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` foi solicitado para runtime ACP.                            | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                         |
| Metadados ACP ausentes para sessão vinculada                                | Metadados da sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn` e depois refaça o vínculo/foco da thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/exec na sessão ACP não interativa.         | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o Gateway. Consulte [Configuração de permissões](#permission-configuration).    |
| A sessão ACP falha cedo com pouca saída                                     | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do Gateway por `AcpRuntimeError`. Para permissões totais, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| A sessão ACP trava indefinidamente após concluir o trabalho                 | O processo do harness terminou, mas a sessão ACP não reportou conclusão.       | Monitore com `ps aux \| grep acpx`; elimine processos obsoletos manualmente.                                                                                       |

---
read_when:
    - Executando harnesses de coding via ACP
    - Configurando sessões ACP vinculadas a conversas em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Depurando backend ACP e wiring de Plugin
    - Depurando entrega de conclusão do ACP ou loops agente-para-agente
    - Operando comandos `/acp` pelo chat
summary: Use sessões de runtime ACP para Claude Code, Cursor, Gemini CLI, fallback explícito do Codex ACP, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-24T06:14:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permite que sessões executem harnesses externos de coding (por exemplo Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para vincular ou controlar o Codex na conversa atual, o OpenClaw deve usar o Plugin nativo de app-server do Codex (`/codex bind`, `/codex threads`, `/codex resume`). Se você pedir `/acp`, ACP, acpx ou uma sessão filha em segundo plano do Codex, o OpenClaw ainda poderá rotear o Codex por ACP. Cada inicialização de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você pedir ao OpenClaw em linguagem natural para "iniciar o Claude Code em uma thread" ou usar outro harness externo, o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente).

Se você quiser que Codex ou Claude Code se conectem como um cliente MCP externo diretamente
a conversas de canal já existentes do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                                   | Use isto                               | Observações                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                               | `/codex bind`, `/codex threads`        | Caminho nativo do app-server Codex; inclui respostas vinculadas ao chat, encaminhamento de imagem, modelo/fast/permissões, stop e controles de steer. ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, fallback explícito do Codex ACP ou outro harness externo _através_ do OpenClaw | Esta página: agentes ACP               | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                              |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente         | [`openclaw acp`](/pt-BR/cli/acp)             | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                        |
| Reutilizar uma CLI local de IA como modelo de fallback somente texto                          | [CLI Backends](/pt-BR/gateway/cli-backends)  | Não é ACP. Sem ferramentas OpenClaw, sem controles ACP, sem runtime de harness                                                                                |

## Isso funciona imediatamente?

Normalmente, sim. Instalações novas incluem o Plugin de runtime `acpx` habilitado por padrão, com um binário `acpx` fixado localmente no Plugin que o OpenClaw verifica e autorrepara na inicialização. Execute `/acp doctor` para uma verificação de prontidão.

Pontos de atenção na primeira execução:

- Adaptadores de harness de destino (Codex, Claude etc.) podem ser buscados sob demanda com `npx` na primeira vez que você os usar.
- A autenticação do vendor ainda precisa existir no host para esse harness.
- Se o host não tiver npm ou acesso à rede, as buscas iniciais do adaptador falharão até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

## Runbook do operador

Fluxo rápido de `/acp` no chat:

1. **Iniciar** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` ou o explícito `/acp spawn codex --bind here`
2. **Trabalhe** na conversa ou thread vinculada (ou direcione explicitamente à chave de sessão).
3. **Verifique o estado** — `/acp status`
4. **Ajuste** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Direcione** sem substituir o contexto — `/acp steer tighten logging and continue`
6. **Pare** — `/acp cancel` (turno atual) ou `/acp close` (sessão + vínculos)

Acionadores em linguagem natural que devem ser roteados para o Plugin nativo do Codex:

- "Vincule este canal do Discord ao Codex."
- "Anexe este chat à thread do Codex `<id>`."
- "Mostre as threads do Codex e depois vincule esta."

O vínculo nativo de conversa do Codex é o caminho padrão de controle por chat, mas ele é intencionalmente conservador para fluxos interativos de aprovação/ferramenta do Codex: ferramentas dinâmicas do OpenClaw e prompts de aprovação ainda não são expostos por esse caminho de chat vinculado, então essas solicitações são recusadas com uma explicação clara. Use o caminho de harness do Codex ou o fallback ACP explícito quando o fluxo de trabalho depender de ferramentas dinâmicas do OpenClaw ou de aprovações interativas de longa duração.

Acionadores em linguagem natural que devem ser roteados para o runtime ACP:

- "Execute isto como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Use Gemini CLI para esta tarefa em uma thread e mantenha os acompanhamentos nessa mesma thread."
- "Execute o Codex por ACP em uma thread em segundo plano."

O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness, vincula à conversa ou thread atual quando compatível e roteia os acompanhamentos para essa sessão até close/expiração. O Codex só segue esse caminho quando ACP é explícito ou quando o runtime em segundo plano solicitado ainda precisa de ACP.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o app-server nativo do Codex para vínculo/controle de conversa do Codex. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente                 |
| ------------- | ------------------------------------- | ------------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`     |
| Comandos principais | `/acp ...`                      | `/subagents ...`                      |
| Ferramenta de inicialização | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. Plugin incluído de runtime `acpx`
3. Adaptador Claude ACP
4. Mecanismo de runtime/sessão do lado do Claude

Distinção importante:

- Claude via ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vínculo opcional a conversa/thread.
- CLI Backends são runtimes locais separados de fallback somente texto. Consulte [CLI Backends](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto pela CLI bruta: use CLI Backends

## Sessões vinculadas

### Vínculos da conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à sessão ACP iniciada — sem thread filha, na mesma superfície de chat. O OpenClaw continua sendo o proprietário do transporte, autenticação, segurança e entrega; mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a sessão no local; `/acp close` remove o vínculo.

Modelo mental:

- **superfície de chat** — onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **sessão ACP** — o estado durável de runtime Codex/Claude/Gemini para o qual o OpenClaw faz roteamento.
- **thread/tópico filho** — uma superfície extra opcional de mensagens criada somente por `--thread ...`.
- **workspace de runtime** — o local do sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

Exemplos:

- `/codex bind` — mantenha este chat, inicie ou anexe o app-server nativo do Codex, roteie mensagens futuras para cá.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajuste a thread nativa do Codex vinculada pelo chat.
- `/codex stop` ou `/codex steer focus on the failing tests first` — controle o turno nativo ativo do Codex.
- `/acp spawn codex --bind here` — fallback ACP explícito para Codex.
- `/acp spawn codex --thread auto` — o OpenClaw pode criar uma thread/tópico filho e vincular lá.
- `/acp spawn codex --bind here --cwd /workspace/repo` — mesmo vínculo de chat, o Codex roda em `/workspace/repo`.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos.
- `--bind here` só funciona em canais que anunciam vínculo da conversa atual; o OpenClaw retorna uma mensagem clara de não compatibilidade caso contrário. Os vínculos persistem entre reinicializações do gateway.
- No Discord, `spawnAcpSessions` só é exigido quando o OpenClaw precisa criar uma thread filha para `--thread auto|here` — não para `--bind here`.
- Se você iniciar para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) recorrem ao padrão do backend; outros erros de acesso (por exemplo `EACCES`) aparecem como erros de inicialização.

### Sessões vinculadas a thread

Quando vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta à mesma thread.
- Desfocar/fechar/arquivar/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara de não compatível/indisponível.

Sinalizadores de recurso exigidos para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` fica ligado por padrão (defina `false` para pausar o despacho ACP)
- Sinalizador de inicialização ACP de thread do adaptador de canal habilitado (específico do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais que oferecem suporte a thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte integrado atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Plugins de canal podem adicionar suporte pela mesma interface de vínculo.

## Configurações específicas por canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - Chat DM/grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` para vínculos estáveis de grupo.
- `bindings[].agentId` é o ID do agente OpenClaw proprietário.
- Substituições opcionais de ACP ficam em `bindings[].acp`:
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
- Mensagens nesse canal ou tópico são roteadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no local.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para inicializações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos ausentes do workspace herdado recorrem ao `cwd` padrão do backend; falhas de acesso em caminhos existentes aparecem como erros de inicialização.

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
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): ID do harness ACP de destino. Recorre a `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo com thread quando compatível.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode usar comportamento persistente por padrão, dependendo do caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado em runtime (validado pela política do backend/runtime). Se omitido, a inicialização ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes recorrem aos padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado no texto da sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz o histórico da conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos do progresso inicial da execução ACP de volta à sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para obter o histórico completo do relay.
- `model` (opcional): substituição explícita de modelo para a sessão filha ACP. É respeitada em `runtime: "acp"` para que a filha use o modelo solicitado em vez de recorrer silenciosamente ao padrão do agente de destino.

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano de propriedade do pai. O caminho de entrega depende desse formato.

### Sessões ACP interativas

Sessões interativas servem para continuar conversando em uma superfície visível de chat:

- `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
- `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
- `bindings[].type="acp"` persistentes roteiam conversas correspondentes para a mesma sessão ACP.

Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a sessão ACP, e a saída ACP é entregue de volta ao mesmo canal/thread/tópico.

### Sessões ACP one-shot de propriedade do pai

Sessões ACP one-shot iniciadas por outra execução de agente são filhas em segundo plano, semelhantes a subagentes:

- O pai pede trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
- A filha é executada em sua própria sessão de harness ACP.
- A conclusão é reportada de volta pelo caminho interno de anúncio de conclusão de tarefa.
- O pai reescreve o resultado da filha na voz normal do assistente quando uma resposta voltada ao usuário é útil.

Não trate esse caminho como um chat ponto a ponto entre pai e filha. A filha já possui um canal de conclusão de volta ao pai.

### `sessions_send` e entrega A2A

`sessions_send` pode ter como destino outra sessão após a inicialização. Para sessões de pares normais, o OpenClaw usa um caminho de acompanhamento agent-to-agent (A2A) após injetar a mensagem:

- aguarda a resposta da sessão de destino
- opcionalmente deixa solicitante e destino trocarem um número limitado de mensagens de acompanhamento
- pede ao destino que produza uma mensagem de anúncio
- entrega esse anúncio ao canal ou thread visível

Esse caminho A2A é um fallback para envios entre pares quando o remetente precisa de um acompanhamento visível. Ele continua habilitado quando uma sessão não relacionada pode ver e enviar mensagens a um destino ACP, por exemplo sob configurações amplas de `tools.sessions.visibility`.

O OpenClaw ignora o acompanhamento A2A somente quando o solicitante é o pai de sua própria filha ACP one-shot. Nesse caso, executar A2A por cima da conclusão da tarefa pode despertar o pai com o resultado da filha, encaminhar a resposta do pai de volta para a filha e criar um loop de eco pai/filho. O resultado de `sessions_send` informa `delivery.status="skipped"` nesse caso de filho de propriedade do pai porque o caminho de conclusão já é responsável pelo resultado.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa via `session/load`, então continua com todo o contexto do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do seu laptop para o seu telefone — diga ao agente para continuar de onde parou
- Continuar uma sessão de coding iniciada interativamente na CLI, agora de forma headless pelo seu agente
- Retomar trabalho interrompido por reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna um erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` continua exigindo `thread: true`.
- O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o ID da sessão não for encontrado, a inicialização falha com um erro claro — sem fallback silencioso para uma nova sessão.

<Accordion title="Teste de fumaça pós-implantação">

Após uma implantação do gateway, execute uma verificação ao vivo ponta a ponta em vez de confiar apenas em testes unitários:

1. Verifique a versão implantada do gateway e o commit no host de destino.
2. Abra uma sessão bridge ACPX temporária para um agente ativo.
3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifique `accepted=yes`, um `childSessionKey` real e ausência de erro de validador.
5. Limpe a sessão bridge temporária.

Mantenha a verificação em `mode: "run"` e ignore `streamTo: "parent"` — caminhos vinculados a thread em `mode: "session"` e caminhos de relay de stream são passagens de integração separadas e mais ricas.

</Accordion>

## Compatibilidade com sandbox

Sessões ACP atualmente são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, inicializações ACP são bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução forçada por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador a partir do chat, quando necessário.

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

Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Resolução de destino de sessão

A maioria das ações de `/acp` aceita um destino de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de destino (ou `--session` para `/acp steer`)
   - tenta chave
   - depois ID de sessão em formato UUID
   - depois rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão solicitante atual

Vínculos da conversa atual e vínculos de thread participam ambos da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo na inicialização

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                            |
| ------ | ------------------------------------------------------------------------ |
| `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
| `off`  | Não cria um vínculo da conversa atual.                                   |

Observações:

- `--bind here` é o caminho mais simples para o operador em "faça este canal ou chat usar Codex."
- `--bind here` não cria uma thread filha.
- `--bind here` está disponível apenas em canais que expõem suporte a vínculo da conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

## Modos de thread na inicialização

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando compatível. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                  |
| `off`  | Sem vínculo. A sessão é iniciada sem vínculo.                                                           |

Observações:

- Em superfícies sem vínculo com thread, o comportamento padrão é efetivamente `off`.
- A inicialização vinculada a thread exige suporte da política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

## Controles ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual opcional ou vínculo de thread. | `/acp spawn codex --bind here --cwd /repo`                 |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de steer para a sessão em execução.        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de thread.            | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                              |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.         | `/acp set-mode plan`                                          |
| `/acp set`           | Gravação genérica de opção de configuração de runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição de diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout de runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição de modelo em runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opção de runtime da sessão.        | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.               | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                               |

`/acp status` mostra as opções efetivas de runtime, além de identificadores de sessão em nível de runtime e backend. Erros de controle não compatível aparecem claramente quando um backend não possui determinada capacidade. `/acp sessions` lê o armazenamento para a sessão vinculada ou solicitante atual; tokens de destino (`session-key`, `session-id` ou `session-label`) são resolvidos pela descoberta de sessão do gateway, incluindo raízes personalizadas `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd de runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime da sessão de destino.

## Harness acpx, configuração do Plugin e permissões

Para configuração do harness acpx (aliases Claude Code / Codex / Gemini CLI), bridges MCP
plugin-tools e OpenClaw-tools e modos de permissão ACP, consulte
[Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desabilitado.                                      | Instale e habilite o Plugin de backend e depois execute `/acp doctor`.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP globalmente desabilitado.                                                   | Defina `acp.enabled=true`.                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho a partir de mensagens normais de thread desabilitado.                  | Defina `acp.dispatch.enabled=true`.                                                                                                                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na lista de permissão.                                          | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                              |
| `Unable to resolve session target: ...`                                     | Token inválido de chave/id/rótulo.                                              | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa vinculável.                          | Vá para o chat/canal de destino e tente novamente, ou use inicialização sem vínculo.                                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP da conversa atual.                | Use `/acp spawn ... --thread ...` quando compatível, configure `bindings[]` de nível superior ou vá para um canal compatível.                                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                            | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é o proprietário do destino de vínculo ativo.                     | Refaça o vínculo como proprietário ou use uma conversa ou thread diferente.                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo de thread.                            | Use `--thread off` ou mude para um adaptador/canal compatível.                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` em sessões em sandbox, ou execute a inicialização ACP a partir de uma sessão sem sandbox.                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para runtime ACP.                                | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                |
| Metadados ACP ausentes para sessão vinculada                                | Metadados de sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn`, depois refaça o vínculo/foco da thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/exec em sessão ACP não interativa.          | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| Sessão ACP falha cedo com pouca saída                                       | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões totais, defina `permissionMode=approve-all`; para degradação elegante, defina `nonInteractivePermissions=deny`. |
| Sessão ACP trava indefinidamente após concluir o trabalho                   | O processo do harness terminou, mas a sessão ACP não informou conclusão.        | Monitore com `ps aux \| grep acpx`; mate manualmente processos obsoletos.                                                                                                |

## Relacionado

- [Subagentes](/pt-BR/tools/subagents)
- [Ferramentas multiagente em sandbox](/pt-BR/tools/multi-agent-sandbox-tools)
- [Envio de agente](/pt-BR/tools/agent-send)

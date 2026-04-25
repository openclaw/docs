---
read_when:
    - Executando harnesses de codificação por ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP e do wiring de Plugin
    - Depuração da entrega de conclusão do ACP ou de loops de agente para agente
    - Operação de comandos `/acp` pelo chat
summary: Use sessões de runtime ACP para Claude Code, Cursor, Gemini CLI, fallback ACP explícito do Codex, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-25T13:56:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de programação (por exemplo Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para vincular ou controlar o Codex na conversa atual, o OpenClaw deve usar o Plugin nativo app-server do Codex (`/codex bind`, `/codex threads`, `/codex resume`). Se você pedir por `/acp`, ACP, acpx ou uma sessão filha em segundo plano do Codex, o OpenClaw ainda pode rotear o Codex por meio do ACP. Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você pedir ao OpenClaw em linguagem natural para "iniciar o Claude Code em uma thread" ou usar outro harness externo, o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente).

Se você quiser que Codex ou Claude Code se conectem como um cliente MCP externo diretamente
às conversas de canal existentes do OpenClaw, use [`openclaw mcp serve`](/pt-BR/cli/mcp)
em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                                   | Use isto                              | Observações                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                               | `/codex bind`, `/codex threads`       | Caminho nativo do app-server do Codex; inclui respostas de chat vinculadas, encaminhamento de imagem, controles de modelo/rápido/permissões, parar e direcionar. ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, ACP explícito do Codex ou outro harness externo _por meio_ do OpenClaw | Esta página: agentes ACP              | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                             |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente         | [`openclaw acp`](/pt-BR/cli/acp)            | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                     |
| Reutilizar uma CLI de IA local como modelo de fallback somente texto                          | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                          |

## Isso funciona imediatamente?

Normalmente, sim. Instalações novas já vêm com o Plugin de runtime `acpx` empacotado habilitado por padrão, com um binário `acpx` fixado localmente ao Plugin que o OpenClaw verifica e autorrepara na inicialização. Execute `/acp doctor` para uma checagem de prontidão.

Pontos de atenção na primeira execução:

- Adaptadores do harness de destino (Codex, Claude etc.) podem ser buscados sob demanda com `npx` na primeira vez que você os usar.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver npm ou acesso à rede, as buscas iniciais do adaptador falham até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

## Manual operacional

Fluxo rápido de `/acp` pelo chat:

1. **Criar** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` ou o explícito `/acp spawn codex --bind here`
2. **Trabalhar** na conversa ou thread vinculada (ou direcionar explicitamente pela chave da sessão).
3. **Verificar o estado** — `/acp status`
4. **Ajustar** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Direcionar** sem substituir o contexto — `/acp steer tighten logging and continue`
6. **Parar** — `/acp cancel` (turno atual) ou `/acp close` (sessão + vínculos)

Gatilhos em linguagem natural que devem ser roteados para o Plugin nativo do Codex:

- "Vincule este canal do Discord ao Codex."
- "Anexe este chat à thread do Codex `<id>`."
- "Mostre as threads do Codex e depois vincule esta."

O vínculo nativo de conversa do Codex é o caminho padrão de controle por chat. As
ferramentas dinâmicas do OpenClaw ainda são executadas por meio do OpenClaw, enquanto ferramentas
nativas do Codex, como shell/apply-patch, são executadas dentro do Codex. Para eventos de ferramentas nativas do Codex, o OpenClaw
injeta um relay de hook nativo por turno para que hooks de Plugin possam bloquear
`before_tool_call`, observar `after_tool_call` e rotear eventos
`PermissionRequest` do Codex por meio das aprovações do OpenClaw. O relay v1 é
deliberadamente conservador: ele não altera argumentos de ferramentas nativas do Codex,
não reescreve registros de thread do Codex nem controla respostas finais/hooks Stop. Use
ACP explícito apenas quando você quiser o modelo de runtime/sessão ACP. O limite de suporte
embutido do Codex está documentado no
[contrato de suporte v1 do harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

Gatilhos em linguagem natural que devem ser roteados para o runtime ACP:

- "Execute isso como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Use o Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."
- "Execute o Codex por meio do ACP em uma thread em segundo plano."

O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness, vincula à conversa ou thread atual quando compatível e roteia os acompanhamentos para essa sessão até o fechamento/expiração. O Codex só segue esse caminho quando o ACP é explícito ou quando o runtime em segundo plano solicitado ainda precisa de ACP.

## ACP versus subagentes

Use ACP quando você quiser um runtime de harness externo. Use o app-server nativo do Codex para vínculo/controle de conversa do Codex. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave da sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principais | `/acp ...`                      | `/subagents ...`                    |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. Plugin de runtime `acpx` empacotado
3. Adaptador ACP do Claude
4. Maquinário de runtime/sessão do lado do Claude

Distinção importante:

- Claude por ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vínculo opcional de conversa/thread.
- Backends de CLI são runtimes locais separados de fallback somente texto. Veja [Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto por meio da CLI bruta: use backends de CLI

## Sessões vinculadas

### Vínculos na conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à sessão ACP criada — sem thread filha, mesma superfície de chat. O OpenClaw continua sendo responsável por transporte, autenticação, segurança e entrega; mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a sessão no mesmo lugar; `/acp close` remove o vínculo.

Modelo mental:

- **superfície de chat** — onde as pessoas continuam falando (canal do Discord, tópico do Telegram, chat do iMessage).
- **sessão ACP** — o estado durável do runtime de Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **thread/tópico filho** — uma superfície extra opcional de mensagens criada apenas por `--thread ...`.
- **workspace de runtime** — o local no sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

Exemplos:

- `/codex bind` — mantém este chat, cria ou anexa o app-server nativo do Codex, roteia futuras mensagens aqui.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajusta a thread nativa vinculada do Codex pelo chat.
- `/codex stop` ou `/codex steer focus on the failing tests first` — controla o turno nativo ativo do Codex.
- `/acp spawn codex --bind here` — fallback ACP explícito para o Codex.
- `/acp spawn codex --thread auto` — o OpenClaw pode criar uma thread/tópico filho e vincular ali.
- `/acp spawn codex --bind here --cwd /workspace/repo` — mesmo vínculo de chat, o Codex executa em `/workspace/repo`.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos.
- `--bind here` só funciona em canais que anunciam vínculo à conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de não compatibilidade. Os vínculos persistem entre reinicializações do gateway.
- No Discord, `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here` — não para `--bind here`.
- Se você criar para um ACP agent diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agent de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) fazem fallback para o padrão do backend; outros erros de acesso (por exemplo `EACCES`) aparecem como erros de criação.

### Sessões vinculadas a thread

Quando vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída do ACP é entregue de volta para a mesma thread.
- Desfocar/fechar/arquivar/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara de não compatibilidade/indisponibilidade.

Flags de recurso necessárias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho ACP)
- Flag de criação de thread ACP do adaptador de canal habilitada (específica do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte embutido atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos em DM)
- Canais de Plugin podem adicionar suporte por meio da mesma interface de vínculo.

## Configurações específicas de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas de nível superior `bindings[]`.

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
- Substituições opcionais de ACP ficam em `bindings[].acp`:
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
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no mesmo lugar.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos de workspace herdados ausentes fazem fallback para o cwd padrão do backend; falhas de acesso em caminhos existentes aparecem como erros de criação.

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

- `runtime` usa `subagent` por padrão, portanto defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado à sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Usa `acp.defaultAgent` como fallback, se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo em thread quando compatível.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode usar comportamento persistente por padrão, dependendo do caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho de runtime solicitado (validado pela política do backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes fazem fallback para os padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado no texto da sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos iniciais de progresso da execução ACP de volta para a sessão solicitante como eventos do sistema.
  - Quando disponível, as respostas aceitas incluem `streamLogPath`, apontando para um log JSONL com escopo da sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo do relay.
- `model` (opcional): substituição explícita de modelo para a sessão filha ACP. Respeitado para `runtime: "acp"` para que a sessão filha use o modelo solicitado em vez de silenciosamente fazer fallback para o padrão do agente de destino.

## Modelo de entrega

As sessões ACP podem ser workspaces interativos ou trabalho em segundo plano pertencente ao pai. O caminho de entrega depende desse formato.

### Sessões ACP interativas

Sessões interativas servem para continuar conversando em uma superfície de chat visível:

- `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
- `/acp spawn ... --thread ...` vincula uma thread/tópico do canal à sessão ACP.
- `bindings[].type="acp"` persistentes e configurados roteiam conversas correspondentes para a mesma sessão ACP.

Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a sessão ACP, e a saída ACP é entregue de volta ao mesmo canal/thread/tópico.

### Sessões ACP one-shot pertencentes ao pai

Sessões ACP one-shot criadas por outra execução de agente são filhas em segundo plano, semelhantes a subagentes:

- O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
- A filha executa em sua própria sessão de harness ACP.
- A conclusão é reportada pelo caminho interno de anúncio de conclusão de tarefa.
- O pai reescreve o resultado da filha em voz normal de assistente quando uma resposta voltada ao usuário é útil.

Não trate esse caminho como um chat ponto a ponto entre pai e filha. A filha já tem um canal de conclusão de volta para o pai.

### `sessions_send` e entrega A2A

`sessions_send` pode direcionar outra sessão após a criação. Para sessões pares normais, o OpenClaw usa um caminho de acompanhamento agente para agente (A2A) após injetar a mensagem:

- aguarda a resposta da sessão de destino
- opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento
- pede ao destino para produzir uma mensagem de anúncio
- entrega esse anúncio ao canal ou thread visível

Esse caminho A2A é um fallback para envios entre pares quando o remetente precisa de um acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode ver e enviar mensagem para um alvo ACP, por exemplo sob configurações amplas de `tools.sessions.visibility`.

O OpenClaw ignora o acompanhamento A2A apenas quando o solicitante é o pai de sua própria filha ACP one-shot pertencente ao pai. Nesse caso, executar A2A por cima da conclusão da tarefa pode despertar o pai com o resultado da filha, encaminhar a resposta do pai de volta para a filha e criar um loop de eco pai/filha. O resultado de `sessions_send` informa `delivery.status="skipped"` nesse caso de filha pertencente ao pai porque o caminho de conclusão já é responsável pelo resultado.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa via `session/load`, então ele retoma com todo o contexto do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão do Codex do seu laptop para o seu celular — diga ao seu agente para continuar de onde você parou
- Continuar uma sessão de programação iniciada interativamente na CLI, agora em modo headless por meio do seu agente
- Retomar um trabalho interrompido por uma reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna um erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino precisa oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o id da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

<Accordion title="Teste de smoke após o deploy">

Após um deploy do gateway, execute uma verificação real de ponta a ponta em vez de confiar em testes unitários:

1. Verifique a versão e o commit do gateway implantado no host de destino.
2. Abra uma sessão bridge ACPX temporária para um agente ativo.
3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifique `accepted=yes`, um `childSessionKey` real e a ausência de erro de validador.
5. Limpe a sessão bridge temporária.

Mantenha o gate em `mode: "run"` e ignore `streamTo: "parent"` — os caminhos de `mode: "session"` vinculado a thread e de relay de stream são verificações de integração separadas e mais completas.

</Accordion>

## Compatibilidade com sandbox

As sessões ACP atualmente executam no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, as criações ACP serão bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução imposta por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador pelo chat, quando necessário.

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

Veja [Comandos de barra](/pt-BR/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações de `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento de alvo explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o id de sessão em formato UUID
   - depois o rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão solicitante atual

Vínculos da conversa atual e vínculos de thread participam da etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo na criação

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no mesmo lugar; falha se não houver nenhuma ativa. |
| `off`  | Não cria um vínculo com a conversa atual.                              |

Observações:

- `--bind here` é o caminho mais simples para o operador em casos como "faça este canal ou chat ser alimentado por Codex".
- `--bind here` não cria uma thread filha.
- `--bind here` só está disponível em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

## Modos de thread na criação

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando compatível. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                |
| `off`  | Sem vínculo. A sessão é iniciada sem vínculo.                                                         |

Observações:

- Em superfícies sem vínculo com thread, o comportamento padrão é efetivamente `off`.
- A criação com vínculo em thread exige suporte da política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

## Controles ACP

| Comando              | O que faz                                                 | Exemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria uma sessão ACP; vínculo atual opcional ou vínculo em thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia uma instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.              | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime e capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime da sessão de destino.            | `/acp set-mode plan`                                          |
| `/acp set`           | Escrita genérica de opção de configuração de runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                   | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição de modelo do runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove as substituições de opções de runtime da sessão.   | `/acp reset-options`                                          |
| `/acp sessions`      | Lista as sessões ACP recentes do armazenamento.           | `/acp sessions`                                               |
| `/acp doctor`        | Saúde do backend, capacidades, correções acionáveis.      | `/acp doctor`                                                 |
| `/acp install`       | Exibe etapas determinísticas de instalação e ativação.    | `/acp install`                                                |

`/acp status` mostra as opções efetivas de runtime, além dos identificadores de sessão no nível do runtime e do backend. Erros de controle não compatível aparecem claramente quando um backend não tem determinada capacidade. `/acp sessions` lê o armazenamento da sessão vinculada atual ou da sessão solicitante; tokens de destino (`session-key`, `session-id` ou `session-label`) são resolvidos por meio da descoberta de sessão do gateway, incluindo raízes `session.store` personalizadas por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um definidor genérico.

Operações equivalentes:

- `/acp model <id>` corresponde à chave de configuração de runtime `model`.
- `/acp permissions <profile>` corresponde à chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` corresponde à chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime da sessão de destino.

## Harness acpx, configuração de Plugin e permissões

Para configuração do harness acpx (aliases de Claude Code / Codex / Gemini CLI), as
bridges MCP de plugin-tools e OpenClaw-tools, e os modos de permissão do ACP, veja
[Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desabilitado.                                      | Instale e habilite o Plugin de backend e depois execute `/acp doctor`.                                                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                   | Defina `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho de mensagens normais de thread desabilitado.                           | Defina `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent não está na allowlist.                                                    | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                               |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exata e tente novamente.                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa que permita vínculo.                 | Vá para o chat/canal de destino e tente novamente, ou use uma criação sem vínculo.                                                                                        |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP com a conversa atual.             | Use `/acp spawn ... --thread ...` quando compatível, configure `bindings[]` de nível superior ou vá para um canal compatível.                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                            | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é o proprietário do alvo de vínculo ativo.                        | Refaça o vínculo como proprietário ou use outra conversa ou thread.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo em thread.                            | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP é no host; a sessão solicitante está em sandbox.                  | Use `runtime="subagent"` em sessões em sandbox ou execute a criação ACP a partir de uma sessão sem sandbox.                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para o runtime ACP.                              | Use `runtime="subagent"` para sandbox obrigatório ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                 |
| Metadados ACP ausentes para a sessão vinculada                              | Metadados da sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn` e depois refaça o vínculo/foco da thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/execução em sessão ACP não interativa.      | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| A sessão ACP falha cedo com pouca saída                                     | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação controlada, defina `nonInteractivePermissions=deny`. |
| A sessão ACP trava indefinidamente após concluir o trabalho                 | O processo do harness terminou, mas a sessão ACP não informou a conclusão.      | Monitore com `ps aux \| grep acpx`; mate processos obsoletos manualmente.                                                                                                 |

## Relacionado

- [Subagentes](/pt-BR/tools/subagents)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Envio para agente](/pt-BR/tools/agent-send)

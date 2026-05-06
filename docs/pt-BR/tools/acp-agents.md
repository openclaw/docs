---
read_when:
    - Executando ambientes de codificação por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da integração do Plugin ou da entrega de conclusões
    - Operando comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute ambientes de codificação externos (Claude Code, Cursor, Gemini CLI, ACP explícito do Codex, ACP do OpenClaw, OpenCode) por meio do backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-06T09:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permitem que o OpenClaw execute harnesses de codificação externos (por exemplo Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de harness externo, não o caminho padrão do Codex.** O
Plugin nativo do servidor de aplicativo Codex controla `/codex ...` e o
runtime incorporado `agentRuntime.id: "codex"`; o ACP controla
`/acp ...` e sessões `sessions_spawn({ runtime: "acp" })`.

Se você quiser que o Codex ou o Claude Code se conecte como um cliente MCP externo
diretamente a conversas existentes de canais do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez do ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                      | Use isto                              | Observações                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                                 | `/codex bind`, `/codex threads`       | Caminho nativo do servidor de aplicativo Codex quando o Plugin `codex` está habilitado; inclui respostas de chat vinculadas, encaminhamento de imagens, modelo/rápido/permissões, parada e controles de direcionamento. O ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro harness externo _por meio_ do OpenClaw | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                                                                |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente            | [`openclaw acp`](/pt-BR/cli/acp)            | Modo ponte. IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                                                           |
| Reutilizar uma CLI local de IA como modelo fallback somente texto                                | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                                                             |

## Isso funciona imediatamente?

Sim, depois de instalar o Plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts de código-fonte podem usar o Plugin local de workspace `extensions/acpx` depois de
`pnpm install`. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só ensina agentes sobre criação de ACP quando o ACP está **realmente
utilizável**: o ACP deve estar habilitado, o dispatch não pode estar desabilitado, a sessão
atual não pode estar bloqueada pelo sandbox, e um backend de runtime deve estar
carregado. Se essas condições não forem atendidas, as Skills do Plugin ACP e a
orientação ACP de `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Pegadinhas da primeira execução">
    - Se `plugins.allow` estiver definido, ele é um inventário restritivo de Plugins e **deve** incluir `acpx`; caso contrário, o backend ACP instalado é bloqueado intencionalmente e `/acp doctor` informa a entrada ausente na allowlist.
    - O adaptador Codex ACP é preparado com o Plugin `acpx` e iniciado localmente quando possível.
    - Outros adaptadores de harness de destino ainda podem ser baixados sob demanda com `npx` na primeira vez que você os usar.
    - A autenticação do fornecedor ainda precisa existir no host para esse harness.
    - Se o host não tiver npm ou acesso à rede, os downloads de adaptadores da primeira execução falharão até que os caches sejam pré-aquecidos ou que o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos de runtime">
    O ACP inicia um processo real de harness externo. O OpenClaw controla roteamento,
    estado de tarefas em segundo plano, entrega, vinculações e política; o harness
    controla seu login de provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de culpar o OpenClaw, verifique:

    - `/acp doctor` informa um backend habilitado e íntegro.
    - O id de destino é permitido por `acp.allowedAgents` quando essa allowlist estiver definida.
    - O comando do harness consegue iniciar no host do Gateway.
    - A autenticação do provedor está presente para esse harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - O modelo selecionado existe para esse harness - ids de modelo não são portáveis entre harnesses.
    - O `cwd` solicitado existe e é acessível, ou omita `cwd` e deixe o backend usar seu padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não conseguem clicar em prompts nativos de permissão, então execuções de codificação com muita escrita/execução geralmente precisam de um perfil de permissão ACPX que possa prosseguir sem interação.

  </Accordion>
</AccordionGroup>

Ferramentas de Plugin do OpenClaw e ferramentas integradas do OpenClaw **não** são expostas a
harnesses ACP por padrão. Habilite as pontes MCP explícitas em
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup) somente quando o harness
deve chamar essas ferramentas diretamente.

## Destinos de harness compatíveis

Com o backend `acpx`, use estes ids de harness como destinos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id de harness | Backend típico                                  | Observações                                                                         |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`      | Adaptador Claude Code ACP                       | Requer autenticação do Claude Code no host.                                         |
| `codex`       | Adaptador Codex ACP                             | Fallback ACP explícito somente quando `/codex` nativo estiver indisponível ou ACP for solicitado. |
| `copilot`     | Adaptador GitHub Copilot ACP                    | Requer autenticação da CLI/runtime do Copilot.                                      |
| `cursor`      | Cursor CLI ACP (`cursor-agent acp`)             | Sobrescreva o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente. |
| `droid`       | Factory Droid CLI                               | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente do harness.      |
| `gemini`      | Adaptador Gemini CLI ACP                        | Requer autenticação do Gemini CLI ou configuração de chave de API.                  |
| `iflow`       | iFlow CLI                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kilocode`    | Kilo Code CLI                                   | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kimi`        | Kimi/Moonshot CLI                               | Requer autenticação Kimi/Moonshot no host.                                          |
| `kiro`        | Kiro CLI                                        | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `opencode`    | Adaptador OpenCode ACP                          | Requer autenticação de CLI/provedor do OpenCode.                                    |
| `openclaw`    | Ponte do OpenClaw Gateway por meio de `openclaw acp` | Permite que um harness compatível com ACP converse de volta com uma sessão do OpenClaw Gateway. |
| `pi`          | Runtime OpenClaw Pi/incorporado                 | Usado para experimentos de harness nativo do OpenClaw.                              |
| `qwen`        | Qwen Code / Qwen CLI                            | Requer autenticação compatível com Qwen no host.                                    |

Aliases personalizados de agentes acpx podem ser configurados no próprio acpx, mas a política do OpenClaw
ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do dispatch.

## Runbook do operador

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Criar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou
    `/acp spawn codex --bind here` explícito.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou thread vinculada (ou direcione explicitamente para a chave
    da sessão).
  </Step>
  <Step title="Verificar estado">
    `/acp status`
  </Step>
  <Step title="Ajustar">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Direcionar">
    Sem substituir o contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Parar">
    `/acp cancel` (turno atual) ou `/acp close` (sessão + vinculações).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalhes do ciclo de vida">
    - A criação cria ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução é controlada pelo pai.
    - Sessões ACP controladas pelo pai são tratadas como trabalho em segundo plano mesmo quando a sessão de runtime é persistente; a conclusão e a entrega entre superfícies passam pelo notificador da tarefa pai em vez de agir como uma sessão de chat normal voltada ao usuário.
    - A manutenção de tarefas fecha sessões ACP one-shot controladas pelo pai que estejam terminais ou órfãs. Sessões ACP persistentes são preservadas enquanto uma vinculação ativa de conversa permanecer; sessões persistentes obsoletas sem uma vinculação ativa são fechadas para que não possam ser retomadas silenciosamente depois que a tarefa proprietária terminar ou seu registro de tarefa desaparecer.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que a vinculação seja fechada, desfocada, redefinida ou expire.
    - Comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto de prompt normal para um harness ACP vinculado.
    - `cancel` aborta o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui a vinculação nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove a vinculação. Um harness ainda pode manter seu próprio histórico upstream se oferecer suporte a retomada.
    - Workers de runtime ociosos ficam elegíveis para limpeza após `acp.runtime.ttlMinutes`; os metadados de sessão armazenados permanecem disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem rotear para o **Plugin Codex nativo**
    quando ele estiver habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread Codex `<id>`."
    - "Mostre as threads do Codex e então vincule esta."

    A vinculação de conversa nativa do Codex é o caminho padrão de controle de chat.
    Ferramentas dinâmicas do OpenClaw ainda são executadas por meio do OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta um relay de hook nativo
    por turno para que hooks de Plugins possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos Codex `PermissionRequest`
    por aprovações do OpenClaw. Hooks Codex `Stop` são retransmitidos para
    `before_agent_finalize` do OpenClaw, onde Plugins podem solicitar mais uma
    passagem pelo modelo antes que o Codex finalize sua resposta. O relay permanece
    deliberadamente conservador: ele não altera argumentos de ferramentas nativas do Codex
    nem reescreve registros de threads do Codex. Use ACP explícito somente
    quando você quiser o modelo de runtime/sessão do ACP. O limite de suporte incorporado do Codex
    está documentado no
    [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Resumo de seleção de modelo / provedor / runtime">
    - `openai-codex/*` - rota OAuth/assinatura do PI Codex.
    - `openai/*` mais `agentRuntime.id: "codex"` - runtime embarcado nativo do servidor de app Codex.
    - `/codex ...` - controle de conversa nativo do Codex.
    - `/acp ...` ou `runtime: "acp"` - controle ACP/acpx explícito.

  </Accordion>
  <Accordion title="Gatilhos em linguagem natural para roteamento ACP">
    Gatilhos que devem rotear para o runtime ACP:

    - "Execute isto como uma sessão única do Claude Code ACP e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread e mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex por meio do ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte, e
    roteia os acompanhamentos para essa sessão até o fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou o Plugin nativo do Codex
    não está disponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime
    ACP está carregado. `acp.dispatch.enabled=false` pausa o envio automático
    de threads ACP, mas não oculta nem bloqueia chamadas explícitas
    `sessions_spawn({ runtime: "acp" })`. Ele mira ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um id normal
    de agente de configuração do OpenClaw vindo de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente OpenClaw
    é configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como o id de harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **servidor de app Codex
nativo** para vinculação/controle de conversas do Codex quando o Plugin `codex`
estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo, acpx) | Runtime nativo de subagente do OpenClaw |
| Chave da sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                       | `/subagents ...`                   |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Consulte também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio do ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Mecanismo de runtime/sessão do lado do Claude.

ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefas em segundo plano e vinculação opcional de conversa/thread.

Backends CLI são runtimes de fallback locais, separados e somente texto - consulte
[Backends CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback simples de texto local pela CLI bruta?** Use backends CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** - onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **Sessão ACP** - o estado durável de runtime Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** - uma superfície de mensagens extra opcional criada somente por `--thread ...`.
- **Workspace de runtime** - o local do sistema de arquivos (`cwd`, checkout do repositório, workspace de backend) onde o harness executa. Independente da superfície de chat.

### Vínculos de conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à
sessão ACP criada - sem thread filha, mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a
sessão no lugar; `/acp close` remove o vínculo.

Exemplos:

```text
/codex bind                                              # vínculo nativo do Codex, rotear mensagens futuras aqui
/codex model gpt-5.4                                     # ajustar a thread nativa vinculada do Codex
/codex stop                                              # controlar o turno nativo ativo do Codex
/acp spawn codex --bind here                             # fallback ACP explícito para Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular lá
/acp spawn codex --bind here --cwd /workspace/repo       # mesmo vínculo de chat, Codex executa em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` só funciona em canais que anunciam vinculação de conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de não suporte. Os vínculos persistem entre reinicializações do Gateway.
    - No Discord, `spawnSessions` controla a criação de threads filhas para `--thread auto|here` - não `--bind here`.
    - Se você criar uma sessão para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) recorrem ao padrão do backend; outros erros de acesso (por exemplo, `EACCES`) aparecem como erros de criação.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas - comandos `/acp ...` são tratados pelo OpenClaw mesmo quando texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos estiver habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a threads">
    Quando vínculos de thread estão habilitados para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
    - A saída ACP é entregue de volta à mesma thread.
    - Desfocar/fechar/arquivar/tempo limite de inatividade ou expiração por idade máxima remove o vínculo.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso necessárias para ACP vinculado a threads:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ativado por padrão (defina como `false` para pausar o envio automático de threads ACP; chamadas explícitas `sessions_spawn({ runtime: "acp" })` ainda funcionam).
    - Criações de sessões de thread do adaptador de canal habilitadas (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte a vinculação de threads é específico do adaptador. Se o adaptador
    de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara
    de não suporte/indisponibilidade.

  </Accordion>
  <Accordion title="Canais com suporte a threads">
    - Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de DM).
    - Canais de Plugin podem adicionar suporte pela mesma interface de vinculação.

  </Accordion>
</AccordionGroup>

## Vínculos persistentes de canal

Para workflows não efêmeros, configure vínculos ACP persistentes em
entradas de nível superior `bindings[]`.

### Modelo de vinculação

<ParamField path="bindings[].type" type='"acp"'>
  Marca uma vinculação de conversa ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo do BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` ou `chat_identifier:*` para vínculos de grupo estáveis.
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vínculos de grupo estáveis.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  O id do agente OpenClaw proprietário.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Sobrescrita ACP opcional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Rótulo opcional voltado ao operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Diretório de trabalho de runtime opcional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sobrescrita opcional de backend.
</ParamField>

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de sobrescrita para sessões vinculadas ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Padrões ACP globais (por exemplo, `acp.backend`)

### Exemplo

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

### Comportamento

- O OpenClaw garante que a sessão ACP configurada exista antes do uso.
- Mensagens nesse canal ou tópico são roteadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no lugar.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam onde estiverem presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos de workspace herdados ausentes recorrem ao cwd padrão do backend; falhas de acesso não relacionadas a ausência aparecem como erros de criação.

## Iniciar sessões ACP

Duas formas de iniciar uma sessão ACP:

<Tabs>
  <Tab title="De sessions_spawn">
    Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou
    chamada de ferramenta.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    O padrão de `runtime` é `subagent`; portanto, defina `runtime: "acp"` explicitamente
    para sessões ACP. Se `agentId` for omitido, o OpenClaw usa
    `acp.defaultAgent` quando configurado. `mode: "session"` requer
    `thread: true` para manter uma conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="Pelo comando /acp">
    Use `/acp spawn` para controle explícito pelo operador a partir da conversa.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Principais opções:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

  </Tab>
</Tabs>

### Parâmetros de `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt inicial enviado à sessão ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Deve ser `"acp"` para sessões ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID do ambiente de execução ACP de destino. Recorre a `acp.defaultAgent` se definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita o fluxo de associação de thread quando compatível.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é de execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw pode usar comportamento persistente por padrão conforme o
  caminho do ambiente de execução. `mode: "session"` requer `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho solicitado do ambiente de execução (validado pela política do backend/ambiente de execução). Se omitido, a criação ACP herda o espaço de trabalho do agente de destino
  quando configurado; caminhos herdados ausentes usam os padrões do backend,
  enquanto erros reais de acesso são retornados.
</ParamField>
<ParamField path="label" type="string">
  Rótulo voltado ao operador usado no texto da sessão/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Retoma uma sessão ACP existente em vez de criar uma nova. O
  agente reproduz seu histórico de conversa via `session/load`. Requer
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a
  sessão solicitante como eventos do sistema. As respostas aceitas incluem
  `streamLogPath` apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver todo o histórico de retransmissão.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe o turno ACP filho após N segundos. `0` mantém o turno no
  caminho sem tempo limite do Gateway. O mesmo valor é aplicado à execução do Gateway
  e ao ambiente de execução ACP para que ambientes de execução travados ou com cota esgotada não
  ocupem o canal do agente pai indefinidamente.
</ParamField>
<ParamField path="model" type="string">
  Substituição explícita de modelo para a sessão ACP filha. Criações Codex ACP
  normalizam referências OpenClaw Codex como `openai-codex/gpt-5.4` para a configuração
  de inicialização do Codex ACP antes de `session/new`; formatos de barra como
  `openai-codex/gpt-5.4/high` também definem o esforço de raciocínio do Codex ACP.
  Outros ambientes de execução precisam anunciar `models` ACP e oferecer suporte a
  `session/set_model`; caso contrário, OpenClaw/acpx falha claramente em vez de
  recorrer silenciosamente ao padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de pensamento/raciocínio. Para Codex ACP, `minimal` mapeia para
  esforço baixo, `low`/`medium`/`high`/`xhigh` mapeiam diretamente, e `off`
  omite a substituição de esforço de raciocínio na inicialização.
</ParamField>

## Modos de associação e thread no spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                          |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Associa a conversa ativa atual no local; falha se nenhuma estiver ativa. |
    | `off`  | Não cria uma associação de conversa atual.                             |

    Observações:

    - `--bind here` é o caminho mais simples para o operador "tornar este canal ou conversa baseado no Codex."
    - `--bind here` não cria uma thread filha.
    - `--bind here` só está disponível em canais que expõem suporte à associação da conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                       |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: associa essa thread. Fora de uma thread: cria/associa uma thread filha quando compatível. |
    | `here` | Exige uma thread ativa atual; falha se não estiver em uma.                                          |
    | `off`  | Sem associação. A sessão começa desvinculada.                                                       |

    Observações:

    - Em superfícies sem associação de thread, o comportamento padrão é efetivamente `off`.
    - A criação associada a thread requer suporte da política do canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

  </Tab>
</Tabs>

## Modelo de entrega

Sessões ACP podem ser espaços de trabalho interativos ou trabalho em segundo plano
pertencente ao pai. O caminho de entrega depende desse formato.

<AccordionGroup>
  <Accordion title="Sessões ACP interativas">
    Sessões interativas foram feitas para continuar conversando em uma superfície de conversa
    visível:

    - `/acp spawn ... --bind here` associa a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` associa uma thread/tópico de canal à sessão ACP.
    - `bindings[].type="acp"` persistentes configurados roteiam conversas correspondentes para a mesma sessão ACP.

    Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta para o mesmo
    canal/thread/tópico.

    O que o OpenClaw envia ao ambiente de execução:

    - Acompanhamentos vinculados normais são enviados como texto de prompt, além de anexos apenas quando o ambiente de execução/backend oferece suporte a eles.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do despacho ACP.
    - Eventos de conclusão gerados pelo ambiente de execução são materializados por destino. Agentes OpenClaw recebem o envelope interno de contexto de ambiente de execução do OpenClaw; ambientes de execução ACP externos recebem um prompt simples com o resultado filho e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado a ambientes de execução externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de acionamento visível ao usuário ou o prompt simples de conclusão. Metadados internos de eventos permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat escrito pelo usuário.

  </Accordion>
  <Accordion title="Sessões ACP de execução única pertencentes ao pai">
    Sessões ACP de execução única criadas por outra execução de agente são filhas em segundo plano,
    semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - A sessão filha é executada em sua própria sessão de ambiente de execução ACP.
    - Turnos filhos são executados no mesmo canal em segundo plano usado por criações nativas de subagentes, para que um ambiente de execução ACP lento não bloqueie trabalho não relacionado da sessão principal.
    - A conclusão retorna pelo caminho de anúncio de conclusão de tarefa. O OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo a um ambiente de execução externo, para que os ambientes de execução não vejam marcadores de contexto de ambiente de execução exclusivos do OpenClaw.
    - O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate este caminho como uma conversa ponto a ponto entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="sessions_send e entrega A2A">
    `sessions_send` pode ter como destino outra sessão após a criação. Para sessões
    pares normais, o OpenClaw usa um caminho de acompanhamento agente-para-agente (A2A)
    após injetar a mensagem:

    - Aguardar a resposta da sessão de destino.
    - Opcionalmente permitir que solicitante e destino troquem um número limitado de turnos de acompanhamento.
    - Pedir ao destino que produza uma mensagem de anúncio.
    - Entregar esse anúncio ao canal ou thread visível.

    Esse caminho A2A é uma alternativa para envios entre pares em que o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada consegue
    ver e enviar mensagens a um destino ACP, por exemplo sob configurações amplas de
    `tools.sessions.visibility`.

    O OpenClaw pula o acompanhamento A2A apenas quando o solicitante é o
    pai de seu próprio filho ACP de execução única pertencente ao pai. Nesse caso,
    executar A2A sobre a conclusão de tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta para o filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` relata
    `delivery.status="skipped"` para esse caso de filho pertencente porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Retomar uma sessão existente">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, portanto continua com o contexto completo do que veio antes.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Transfira uma sessão Codex do seu notebook para seu celular - diga ao seu agente para continuar de onde você parou.
    - Continue uma sessão de programação que você iniciou interativamente na CLI, agora sem interface por meio do seu agente.
    - Retome trabalho que foi interrompido por uma reinicialização do Gateway ou por tempo limite de inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o ambiente de execução padrão de subagente ignora este campo exclusivo de ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o ambiente de execução padrão de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` é um ID de retomada ACP/ambiente de execução local ao host, não uma chave de sessão de canal do OpenClaw; o OpenClaw ainda verifica a política de criação ACP e a política do agente de destino antes do despacho, enquanto o backend ou ambiente de execução ACP é responsável pela autorização para carregar esse ID do sistema de origem.
    - `resumeSessionId` restaura o histórico de conversa ACP do sistema de origem; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, portanto `mode: "session"` ainda requer `thread: true`.
    - O agente de destino precisa oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o ID da sessão não for encontrado, a criação falha com um erro claro - sem recorrer silenciosamente a uma nova sessão.

  </Accordion>
  <Accordion title="Teste de fumaça pós-implantação">
    Após uma implantação do Gateway, execute uma verificação ao vivo de ponta a ponta em vez de
    confiar nos testes unitários:

    1. Verifique a versão e o commit do Gateway implantado no host de destino.
    2. Abra uma sessão temporária de ponte ACPX para um agente ao vivo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e nenhum erro de validador.
    5. Faça a limpeza da sessão temporária de ponte.

    Mantenha a verificação em `mode: "run"` e pule `streamTo: "parent"` -
    caminhos de `mode: "session"` associados a thread e caminhos de retransmissão de fluxo são
    verificações de integração separadas e mais completas.

  </Accordion>
</AccordionGroup>

## Compatibilidade com sandbox

Sessões ACP atualmente são executadas no ambiente de execução do host, **não** dentro da
sandbox do OpenClaw.

<Warning>
**Limite de segurança:**

- O harness externo pode ler/gravar de acordo com suas próprias permissões de CLI e o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do harness ACP.
- O OpenClaw ainda aplica feature gates ACP, agentes permitidos, propriedade de sessão, vinculações de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com sandbox aplicado.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP serão bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução do alvo da sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de alvo explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o id de sessão em formato UUID
   - depois o rótulo
2. Vinculação da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback da sessão solicitante atual.

Vinculações da conversa atual e vinculações de thread participam da
etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que faz                                                | Exemplo                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vinculação atual ou de thread opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela turno em andamento para a sessão alvo.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento à sessão em execução.  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.             | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, recursos. | `/acp status`                                               |
| `/acp set-mode`      | Define o modo de runtime para a sessão alvo.             | `/acp set-mode plan`                                          |
| `/acp set`           | Grava opção genérica de configuração de runtime.         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define sobrescrita do diretório de trabalho do runtime.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define perfil de política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define timeout do runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define sobrescrita do modelo de runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove sobrescritas de opções de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.             | `/acp sessions`                                               |
| `/acp doctor`        | Saúde do backend, recursos, correções acionáveis.        | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e ativação. | `/acp install`                                                |

`/acp status` mostra as opções efetivas de runtime mais identificadores
de sessão em nível de runtime e de backend. Erros de controle sem suporte aparecem
claramente quando um backend não tem um recurso. `/acp sessions` lê o
armazenamento para a sessão solicitante ou vinculada atual; tokens de alvo
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessões do gateway, incluindo raízes `session.store`
personalizadas por agente.

### Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um definidor genérico. Operações
equivalentes:

| Comando                      | Mapeia para                          | Observações                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chave de configuração de runtime `model` | Para Codex ACP, o OpenClaw normaliza `openai-codex/<model>` para o id de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai-codex/gpt-5.4/high`, para `reasoning_effort`. |
| `/acp set thinking <level>`  | chave de configuração de runtime `thinking` | Para Codex ACP, o OpenClaw envia o `reasoning_effort` correspondente onde o adaptador oferece suporte.                                                                      |
| `/acp permissions <profile>` | chave de configuração de runtime `approval_policy` | -                                                                                                                                                                       |
| `/acp timeout <seconds>`     | chave de configuração de runtime `timeout` | -                                                                                                                                                                       |
| `/acp cwd <path>`            | sobrescrita de cwd do runtime        | Atualização direta.                                                                                                                                                           |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa o caminho de sobrescrita de cwd.                                                                                                                                |
| `/acp reset-options`         | limpa todas as sobrescritas de runtime | -                                                                                                                                                                         |

## Harness acpx, configuração de Plugin e permissões

Para configuração do harness acpx (aliases Claude Code / Codex / Gemini CLI),
as pontes MCP plugin-tools e OpenClaw-tools, e modos de
permissão ACP, consulte
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                                                         | Correção                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desativado ou bloqueado por `plugins.allow`.                                                | Instale e habilite o Plugin de backend, inclua `acpx` em `plugins.allow` quando essa lista de permissões estiver definida e execute `/acp doctor`.                       |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desativado globalmente.                                                                                            | Defina `acp.enabled=true`.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho automático a partir de mensagens normais de thread desativado.                                                | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas a `sessions_spawn({ runtime: "acp" })` continuam funcionando.    |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na lista de permissões.                                                                                | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                             |
| `/acp doctor` reports backend not ready right after startup                 | Plugin de backend ausente, desativado, bloqueado por política de permissão/negação, ou o executável configurado está indisponível. | Instale/habilite o Plugin de backend, execute `/acp doctor` novamente e inspecione o erro de instalação ou política do backend se ele continuar não saudável.           |
| Harness command not found                                                   | A CLI do adaptador não está instalada, o Plugin externo está ausente ou a busca inicial do `npx` falhou para um adaptador que não é Codex. | Execute `/acp doctor`, instale/pré-aqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                           |
| Model-not-found from the harness                                            | O id do modelo é válido para outro provedor/harness, mas não para este destino ACP.                                    | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                           |
| Vendor auth error from the harness                                          | OpenClaw está saudável, mas a CLI/provedor de destino não está autenticado.                                            | Faça login ou forneça a chave de provedor exigida no ambiente do host do Gateway.                                                                                       |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                                                                     | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                  |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa que possa ser vinculada.                                                    | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP da conversa atual.                                                    | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal com suporte.                                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                                                                   | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é proprietário do destino de vínculo ativo.                                                              | Refazer o vínculo como proprietário ou use outra conversa ou thread.                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                                                                | Use `--thread off` ou vá para um adaptador/canal com suporte.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no lado do host; a sessão solicitante está em sandbox.                                              | Use `runtime="subagent"` em sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para o runtime ACP.                                                                     | Use `runtime="subagent"` para sandboxing obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                            |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe troca genérica de modelo ACP.                                                           | Use um harness que anuncie `models`/`session/set_model` do ACP, use refs de modelo ACP do Codex ou configure o modelo diretamente no harness se ele tiver seu próprio sinalizador de inicialização. |
| Missing ACP metadata for bound session                                      | Metadados de sessão ACP obsoletos/excluídos.                                                                           | Recrie com `/acp spawn` e depois refaça o vínculo/foque a thread.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/execução em sessão ACP não interativa.                                             | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`.                                  | Verifique os logs do gateway por `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação gradual, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não relatou conclusão.                                                | Monitore com `ps aux \| grep acpx`; encerre processos obsoletos manualmente.                                                                                           |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou pela fronteira ACP.                                                                   | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts de conclusão simples.                                     |

## Relacionados

- [Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup)
- [Envio para agente](/pt-BR/tools/agent-send)
- [Backends de CLI](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

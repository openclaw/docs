---
read_when:
    - Executando ambientes de codificação por meio do ACP
    - Configurar sessões ACP vinculadas a conversas em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da integração de Plugin ou da entrega de conclusões
    - Operando comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute ambientes de codificação externos (Claude Code, Cursor, Gemini CLI, ACP explícito do Codex, ACP do OpenClaw, OpenCode) por meio do backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-02T21:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
permitem que o OpenClaw execute harnesses de codificação externos (por exemplo, Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Cada spawn de sessão ACP é rastreado como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de harness externo, não o caminho padrão do Codex.** O
Plugin nativo de app-server do Codex controla `/codex ...` e o
runtime incorporado `agentRuntime.id: "codex"`; ACP controla
`/acp ...` e sessões `sessions_spawn({ runtime: "acp" })`.

Se você quiser que Codex ou Claude Code se conecte como um cliente MCP externo
diretamente a conversas de canal existentes do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                      | Use isto                              | Observações                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar Codex na conversa atual                                                   | `/codex bind`, `/codex threads`       | Caminho nativo de app-server do Codex quando o Plugin `codex` está habilitado; inclui respostas de chat vinculadas, encaminhamento de imagens, modelo/rápido/permissões, parar e controles de direção. ACP é uma alternativa explícita |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro harness externo _por meio_ do OpenClaw | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                                                                |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente           | [`openclaw acp`](/pt-BR/cli/acp)            | Modo ponte. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                                                         |
| Reutilizar uma CLI de IA local como modelo de fallback somente texto                            | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                                                             |

## Isso funciona de imediato?

Sim, depois de instalar o Plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts do código-fonte podem usar o Plugin de workspace local `extensions/acpx` depois de
`pnpm install`. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só ensina agentes sobre spawn ACP quando ACP está **realmente
utilizável**: ACP deve estar habilitado, o dispatch não deve estar desabilitado, a sessão atual
não deve estar bloqueada por sandbox e um backend de runtime deve estar
carregado. Se essas condições não forem atendidas, Skills do Plugin ACP e a
orientação ACP de `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Pegadinhas da primeira execução">
    - Se `plugins.allow` estiver definido, ele é um inventário restritivo de plugins e **deve** incluir `acpx`; caso contrário, o backend ACP instalado é bloqueado intencionalmente e `/acp doctor` relata a entrada ausente na allowlist.
    - O adaptador Codex ACP é preparado com o Plugin `acpx` e iniciado localmente quando possível.
    - Outros adaptadores de harness de destino ainda podem ser buscados sob demanda com `npx` na primeira vez que você os usar.
    - A autenticação do fornecedor ainda precisa existir no host para esse harness.
    - Se o host não tiver npm ou acesso à rede, as buscas de adaptador na primeira execução falham até que caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos de runtime">
    ACP inicia um processo real de harness externo. O OpenClaw controla roteamento,
    estado de tarefa em segundo plano, entrega, vinculações e política; o harness
    controla seu login no provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de culpar o OpenClaw, verifique:

    - `/acp doctor` relata um backend habilitado e íntegro.
    - O id de destino é permitido por `acp.allowedAgents` quando essa allowlist está definida.
    - O comando do harness pode iniciar no host do Gateway.
    - A autenticação do provedor está presente para esse harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - O modelo selecionado existe para esse harness — ids de modelo não são portáveis entre harnesses.
    - O `cwd` solicitado existe e é acessível, ou omita `cwd` e deixe o backend usar seu padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não conseguem clicar em prompts nativos de permissão, então execuções de codificação com muita escrita/execução geralmente precisam de um perfil de permissão ACPX que consiga prosseguir sem intervenção.

  </Accordion>
</AccordionGroup>

Ferramentas de plugins do OpenClaw e ferramentas integradas do OpenClaw **não** são expostas a
harnesses ACP por padrão. Habilite as pontes MCP explícitas em
[Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup) somente quando o harness
deve chamar essas ferramentas diretamente.

## Destinos de harness compatíveis

Com o backend `acpx`, use estes ids de harness como alvos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id do harness | Backend típico                                  | Observações                                                                         |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`      | Adaptador Claude Code ACP                       | Requer autenticação do Claude Code no host.                                         |
| `codex`       | Adaptador Codex ACP                             | Fallback ACP explícito somente quando `/codex` nativo está indisponível ou ACP é solicitado. |
| `copilot`     | Adaptador GitHub Copilot ACP                    | Requer autenticação da CLI/runtime do Copilot.                                      |
| `cursor`      | Cursor CLI ACP (`cursor-agent acp`)             | Substitua o comando acpx se uma instalação local expuser um entrypoint ACP diferente. |
| `droid`       | Factory Droid CLI                               | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente do harness.      |
| `gemini`      | Adaptador Gemini CLI ACP                        | Requer autenticação Gemini CLI ou configuração de chave de API.                     |
| `iflow`       | iFlow CLI                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kilocode`    | Kilo Code CLI                                   | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kimi`        | Kimi/Moonshot CLI                               | Requer autenticação Kimi/Moonshot no host.                                          |
| `kiro`        | Kiro CLI                                        | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `opencode`    | Adaptador OpenCode ACP                          | Requer autenticação da CLI/provedor do OpenCode.                                    |
| `openclaw`    | Ponte OpenClaw Gateway por meio de `openclaw acp` | Permite que um harness compatível com ACP converse de volta com uma sessão do OpenClaw Gateway. |
| `pi`          | Runtime OpenClaw incorporado/Pi                 | Usado para experimentos de harness nativo do OpenClaw.                              |
| `qwen`        | Qwen Code / Qwen CLI                            | Requer autenticação compatível com Qwen no host.                                    |

Aliases personalizados de agente acpx podem ser configurados no próprio acpx, mas a política do OpenClaw
ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do dispatch.

## Runbook do operador

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Gerar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` ou explicitamente
    `/acp spawn codex --bind here`.
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
  <Step title="Orientar">
    Sem substituir o contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Parar">
    `/acp cancel` (turno atual) ou `/acp close` (sessão + vinculações).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalhes do ciclo de vida">
    - O spawn cria ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence ao pai.
    - Sessões ACP pertencentes ao pai são tratadas como trabalho em segundo plano mesmo quando a sessão de runtime é persistente; conclusão e entrega entre superfícies passam pelo notificador da tarefa pai em vez de agir como uma sessão de chat normal voltada ao usuário.
    - A manutenção de tarefas fecha sessões ACP one-shot pertencentes ao pai que estejam terminais ou órfãs. Sessões ACP persistentes são preservadas enquanto uma vinculação ativa de conversa permanece; sessões persistentes obsoletas sem uma vinculação ativa são fechadas para que não possam ser retomadas silenciosamente depois que a tarefa proprietária terminar ou seu registro de tarefa desaparecer.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que a vinculação seja fechada, desfocada, redefinida ou expire.
    - Comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto normal de prompt para um harness ACP vinculado.
    - `cancel` aborta o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui a vinculação nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove a vinculação. Um harness ainda pode manter seu próprio histórico upstream se oferecer suporte a retomada.
    - Workers de runtime ociosos são elegíveis para limpeza após `acp.runtime.ttlMinutes`; os metadados de sessão armazenados permanecem disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem rotear para o **Plugin nativo do Codex**
    quando ele estiver habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread Codex `<id>`."
    - "Mostre as threads do Codex e depois vincule esta."

    A vinculação de conversa nativa do Codex é o caminho padrão de controle de chat.
    Ferramentas dinâmicas do OpenClaw ainda são executadas por meio do OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta um relay de hook nativo
    por turno para que hooks de plugins possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos Codex `PermissionRequest`
    por aprovações do OpenClaw. Hooks Codex `Stop` são retransmitidos para
    `before_agent_finalize` do OpenClaw, onde plugins podem solicitar mais uma
    passagem de modelo antes que o Codex finalize sua resposta. O relay permanece
    deliberadamente conservador: ele não altera argumentos de ferramentas nativas do Codex
    nem reescreve registros de thread do Codex. Use ACP explícito somente
    quando você quiser o modelo de runtime/sessão ACP. O limite de suporte incorporado do Codex
    está documentado no
    [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Guia rápido de seleção de modelo / provedor / runtime">
    - `openai-codex/*` — rota de OAuth/assinatura do PI Codex.
    - `openai/*` mais `agentRuntime.id: "codex"` — runtime incorporado nativo do servidor de aplicativo do Codex.
    - `/codex ...` — controle de conversa nativo do Codex.
    - `/acp ...` ou `runtime: "acp"` — controle ACP/acpx explícito.

  </Accordion>
  <Accordion title="Gatilhos de linguagem natural para roteamento ACP">
    Gatilhos que devem rotear para o runtime ACP:

    - "Execute isto como uma sessão ACP única do Claude Code e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex por meio de ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e
    roteia acompanhamentos para essa sessão até fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou o Plugin nativo do Codex
    está indisponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime
    ACP está carregado. `acp.dispatch.enabled=false` pausa o despacho automático
    de threads ACP, mas não oculta nem bloqueia chamadas explícitas a
    `sessions_spawn({ runtime: "acp" })`. Ele usa como alvo ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um id de agente normal
    da configuração do OpenClaw vindo de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente do OpenClaw
    é configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como o id do harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **servidor de aplicativo nativo do Codex**
para vinculação/controle de conversas do Codex quando o Plugin `codex`
estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo, acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                     | `/subagents ...`                   |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Consulte também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Maquinário de runtime/sessão do lado do Claude.

ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefas em segundo plano e vinculação opcional de conversa/thread.

Backends de CLI são runtimes locais alternativos, somente texto, separados — consulte
[Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback local simples em texto por meio da CLI bruta?** Use backends de CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** — onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **Sessão ACP** — o estado durável de runtime Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** — uma superfície extra opcional de mensagens criada somente por `--thread ...`.
- **Workspace de runtime** — o local do sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

### Vinculações da conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à
sessão ACP criada — sem thread filha, mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a
sessão no lugar; `/acp close` remove a vinculação.

Exemplos:

```text
/codex bind                                              # vinculação nativa do Codex, roteia mensagens futuras para cá
/codex model gpt-5.4                                     # ajusta a thread nativa vinculada do Codex
/codex stop                                              # controla o turno nativo ativo do Codex
/acp spawn codex --bind here                             # fallback ACP explícito para Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular lá
/acp spawn codex --bind here --cwd /workspace/repo       # mesma vinculação de chat, Codex é executado em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` só funciona em canais que anunciam vinculação à conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de não compatibilidade. Vinculações persistem entre reinicializações do Gateway.
    - No Discord, `spawnSessions` controla a criação de threads filhas para `--thread auto|here` — não `--bind here`.
    - Se você criar uma sessão para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) fazem fallback para o padrão do backend; outros erros de acesso (por exemplo, `EACCES`) aparecem como erros de criação.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas — comandos `/acp ...` são tratados pelo OpenClaw mesmo quando texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos está habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a threads">
    Quando vinculações de thread estão habilitadas para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
    - A saída do ACP é entregue de volta à mesma thread.
    - Desfocar/fechar/arquivar/tempo limite por inatividade ou expiração por idade máxima remove a vinculação.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso necessárias para ACP vinculado a threads:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho automático de threads ACP; chamadas explícitas a `sessions_spawn({ runtime: "acp" })` ainda funcionam).
    - Criações de sessão de thread do adaptador de canal habilitadas (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte a vinculação de threads é específico do adaptador. Se o adaptador
    de canal ativo não oferecer suporte a vinculações de thread, o OpenClaw retorna uma mensagem
    clara de não compatibilidade/indisponibilidade.

  </Accordion>
  <Accordion title="Canais com suporte a threads">
    - Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de DM).
    - Canais de Plugin podem adicionar suporte por meio da mesma interface de vinculação.

  </Accordion>
</AccordionGroup>

## Vinculações persistentes de canal

Para workflows não efêmeros, configure vinculações ACP persistentes em
entradas `bindings[]` de nível superior.

### Modelo de vinculação

<ParamField path="bindings[].type" type='"acp"'>
  Marca uma vinculação persistente de conversa ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo do BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` ou `chat_identifier:*` para vinculações estáveis de grupo.
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vinculações estáveis de grupo.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  O id do agente proprietário do OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Substituição ACP opcional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Rótulo opcional voltado ao operador.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Diretório de trabalho opcional do runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Substituição opcional do backend.
</ParamField>

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de substituição para sessões ACP vinculadas:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Padrões globais de ACP (por exemplo, `acp.backend`)

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
- Vinculações temporárias de runtime (por exemplo, criadas por fluxos de foco de thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos de workspace herdados ausentes fazem fallback para o cwd padrão do backend; falhas de acesso não relacionadas a ausência aparecem como erros de criação.

## Iniciar sessões ACP

Duas formas de iniciar uma sessão ACP:

<Tabs>
  <Tab title="A partir de sessions_spawn">
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
    `runtime` usa `subagent` por padrão, então defina `runtime: "acp"` explicitamente
    para sessões ACP. Se `agentId` for omitido, OpenClaw usa
    `acp.defaultAgent` quando configurado. `mode: "session"` exige
    `thread: true` para manter uma conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Use `/acp spawn` para controle explícito do operador a partir do chat.

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

    Consulte [Comandos slash](/pt-BR/tools/slash-commands).

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
  ID do harness de destino ACP. Recua para `acp.defaultAgent` se definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita o fluxo de vinculação de thread onde houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, OpenClaw pode usar comportamento persistente por padrão conforme
  o caminho de runtime. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho de runtime solicitado (validado pela política de
  backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino
  quando configurado; caminhos herdados ausentes recuam para os padrões do
  backend, enquanto erros reais de acesso são retornados.
</ParamField>
<ParamField path="label" type="string">
  Rótulo voltado ao operador usado no texto da sessão/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Retoma uma sessão ACP existente em vez de criar uma nova. O
  agente reproduz seu histórico de conversa via `session/load`. Exige
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resumos iniciais de progresso da execução ACP de volta para a
  sessão solicitante como eventos de sistema. Respostas aceitas incluem
  `streamLogPath` apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de retransmissão.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe o turno filho ACP após N segundos. `0` mantém o turno no
  caminho sem timeout do Gateway. O mesmo valor é aplicado à execução do Gateway
  e ao runtime ACP para que harnesses travados ou com cota esgotada não
  ocupem indefinidamente a faixa do agente pai.
</ParamField>
<ParamField path="model" type="string">
  Sobrescrita explícita de modelo para a sessão filha ACP. Criações ACP do Codex
  normalizam referências OpenClaw Codex como `openai-codex/gpt-5.4` para a configuração
  de inicialização ACP do Codex antes de `session/new`; formas slash como
  `openai-codex/gpt-5.4/high` também definem o esforço de raciocínio ACP do Codex.
  Outros harnesses devem anunciar `models` ACP e oferecer suporte a
  `session/set_model`; caso contrário, OpenClaw/acpx falha claramente em vez de
  recuar silenciosamente para o padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de pensamento/raciocínio. Para Codex ACP, `minimal` mapeia para
  esforço baixo, `low`/`medium`/`high`/`xhigh` mapeiam diretamente, e `off`
  omite a sobrescrita de inicialização de esforço de raciocínio.
</ParamField>

## Modos de vinculação e thread de criação

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
    | `off`  | Não cria uma vinculação com a conversa atual.                          |

    Observações:

    - `--bind here` é o caminho mais simples para o operador "tornar este canal ou chat apoiado pelo Codex."
    - `--bind here` não cria uma thread filha.
    - `--bind here` só está disponível em canais que expõem suporte a vinculação da conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
    | `here` | Exige a thread ativa atual; falha se não estiver em uma.                                                  |
    | `off`  | Sem vinculação. A sessão inicia sem vínculo.                                                                 |

    Observações:

    - Em superfícies sem vinculação de thread, o comportamento padrão é efetivamente `off`.
    - A criação vinculada a thread exige suporte da política do canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

  </Tab>
</Tabs>

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano
pertencente ao pai. O caminho de entrega depende desse formato.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sessões interativas devem continuar conversando em uma superfície de chat
    visível:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
    - `bindings[].type="acp"` configuradas como persistentes encaminham conversas correspondentes à mesma sessão ACP.

    Mensagens subsequentes na conversa vinculada são encaminhadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta para o mesmo
    canal/thread/tópico.

    O que OpenClaw envia ao harness:

    - Seguimentos vinculados normais são enviados como texto de prompt, além de anexos apenas quando o harness/backend oferece suporte a eles.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do envio ACP.
    - Eventos de conclusão gerados pelo runtime são materializados por destino. Agentes OpenClaw recebem o envelope de contexto de runtime interno do OpenClaw; harnesses ACP externos recebem um prompt simples com o resultado filho e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado a harnesses externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de gatilho visível ao usuário ou o prompt simples de conclusão. Metadados internos de evento permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat escrito pelo usuário.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sessões ACP de execução única criadas por outra execução de agente são filhos em segundo plano,
    semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - O filho é executado em sua própria sessão de harness ACP.
    - Turnos filhos executam na mesma faixa em segundo plano usada por criações nativas de subagentes, então um harness ACP lento não bloqueia trabalho não relacionado da sessão principal.
    - A conclusão é informada de volta pelo caminho de anúncio de conclusão de tarefa. OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo a um harness externo, para que harnesses não vejam marcadores de contexto de runtime exclusivos do OpenClaw.
    - O pai reescreve o resultado filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate este caminho como um chat peer-to-peer entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` pode mirar outra sessão após a criação. Para sessões pares
    normais, OpenClaw usa um caminho de acompanhamento agente-para-agente (A2A)
    depois de injetar a mensagem:

    - Aguarde a resposta da sessão de destino.
    - Opcionalmente permita que solicitante e destino troquem um número limitado de turnos de acompanhamento.
    - Peça ao destino que produza uma mensagem de anúncio.
    - Entregue esse anúncio ao canal ou thread visível.

    Esse caminho A2A é um fallback para envios entre pares em que o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode
    ver e enviar mensagem a um destino ACP, por exemplo sob configurações amplas de
    `tools.sessions.visibility`.

    OpenClaw pula o acompanhamento A2A somente quando o solicitante é o
    pai de seu próprio filho ACP de execução única pertencente ao pai. Nesse caso,
    executar A2A além da conclusão de tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta para o filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` informa
    `delivery.status="skipped"` para esse caso de filho pertencente porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Resume an existing session">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, então retoma com o contexto completo do que veio antes.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Passe uma sessão Codex do seu laptop para seu telefone — diga ao seu agente para retomar de onde você parou.
    - Continue uma sessão de codificação que você iniciou interativamente na CLI, agora sem interface interativa por meio do seu agente.
    - Retome trabalho que foi interrompido por uma reinicialização do gateway ou timeout por inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` é um ID de retomada ACP/harness local ao host, não uma chave de sessão de canal OpenClaw; OpenClaw ainda verifica a política de criação ACP e a política do agente de destino antes do envio, enquanto o backend ou harness ACP é responsável pela autorização para carregar esse ID upstream.
    - `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o ID da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Após um deploy do gateway, execute uma verificação end-to-end ao vivo em vez de
    confiar em testes unitários:

    1. Verifique a versão e o commit do gateway implantado no host de destino.
    2. Abra uma sessão temporária de ponte ACPX para um agente ao vivo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e nenhum erro de validador.
    5. Limpe a sessão temporária de ponte.

    Mantenha a verificação em `mode: "run"` e pule `streamTo: "parent"` —
    `mode: "session"` vinculado a thread e caminhos de retransmissão de stream são passagens de integração mais ricas separadas.

  </Accordion>
</AccordionGroup>

## Compatibilidade de sandbox

Sessões ACP atualmente executam no runtime do host, **não** dentro do
sandbox OpenClaw.

<Warning>
**Limite de segurança:**

- O ambiente externo pode ler/gravar de acordo com suas próprias permissões de CLI e o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do ambiente ACP.
- O OpenClaw ainda aplica portas de recurso do ACP, agentes permitidos, propriedade de sessão, vínculos de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com imposição de sandbox.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, os spawns de ACP serão bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução de destino da sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta chave
   - depois ID de sessão com formato de UUID
   - depois rótulo
2. Vínculo do tópico atual (se esta conversa/tópico estiver vinculada a uma sessão ACP).
3. Fallback para a sessão solicitante atual.

Vínculos da conversa atual e vínculos de tópico participam ambos da
etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que faz                                                 | Exemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual ou vínculo de tópico opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela turno em andamento da sessão de destino.          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de tópico.           | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de tempo de execução e capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de tempo de execução da sessão de destino.  | `/acp set-mode plan`                                          |
| `/acp set`           | Grava opção genérica de configuração de tempo de execução. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define substituição do diretório de trabalho do tempo de execução. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define perfil da política de aprovação.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Define tempo limite do tempo de execução (segundos).      | `/acp timeout 120`                                            |
| `/acp model`         | Define substituição do modelo do tempo de execução.       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de tempo de execução da sessão. | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.              | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e ativação.  | `/acp install`                                                |

`/acp status` mostra as opções efetivas de tempo de execução, além dos identificadores de sessão em nível de tempo de execução e
em nível de backend. Erros de controle sem suporte aparecem
claramente quando um backend não tem uma capacidade. `/acp sessions` lê o
armazenamento da sessão atualmente vinculada ou solicitante; tokens de destino
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessões do gateway, incluindo raízes `session.store`
personalizadas por agente.

### Mapeamento de opções de tempo de execução

`/acp` tem comandos de conveniência e um definidor genérico. Operações
equivalentes:

| Comando                      | Mapeia para                          | Observações                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chave de configuração de tempo de execução `model` | Para Codex ACP, o OpenClaw normaliza `openai-codex/<model>` para o ID de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai-codex/gpt-5.4/high`, para `reasoning_effort`. |
| `/acp set thinking <level>`  | chave de configuração de tempo de execução `thinking` | Para Codex ACP, o OpenClaw envia o `reasoning_effort` correspondente quando o adaptador oferece suporte a isso.                                                               |
| `/acp permissions <profile>` | chave de configuração de tempo de execução `approval_policy` | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | chave de configuração de tempo de execução `timeout` | —                                                                                                                                                                             |
| `/acp cwd <path>`            | substituição de cwd do tempo de execução | Atualização direta.                                                                                                                                                          |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa o caminho de substituição de cwd.                                                                                                                              |
| `/acp reset-options`         | limpa todas as substituições de tempo de execução | —                                                                                                                                                                             |

## Ambiente acpx, configuração de Plugin e permissões

Para configuração do ambiente acpx (aliases Claude Code / Codex / Gemini CLI),
as pontes MCP plugin-tools e OpenClaw-tools, e modos de
permissão ACP, consulte
[Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                                                           | Correção                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.                                                       | Instale e habilite o Plugin de backend, inclua `acpx` em `plugins.allow` quando essa lista de permissões estiver definida, então execute `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                                                                 | Defina `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho automático de mensagens normais de thread desabilitado.                                                               | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas a `sessions_spawn({ runtime: "acp" })` ainda funcionam.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na lista de permissões.                                                                                                | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` relata que o backend não está pronto logo após a inicialização                 | O Plugin de backend está ausente, desabilitado, bloqueado pela política de permissão/negação, ou o executável configurado está indisponível.        | Instale/habilite o Plugin de backend, execute `/acp doctor` novamente e inspecione o erro de instalação do backend ou de política se ele continuar não saudável.                                           |
| Comando do harness não encontrado                                                   | A CLI do adaptador não está instalada, o Plugin externo está ausente, ou a busca `npx` de primeira execução falhou para um adaptador que não é Codex. | Execute `/acp doctor`, instale/pré-aqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                      |
| Modelo não encontrado pelo harness                                            | O ID do modelo é válido para outro provedor/harness, mas não para este alvo ACP.                                                | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                            |
| Erro de autenticação do fornecedor pelo harness                                          | OpenClaw está saudável, mas a CLI/provedor de destino não está conectado.                                                     | Faça login ou forneça a chave de provedor exigida no ambiente do host do Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de chave/ID/rótulo inválido.                                                                                                | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa que possa ser vinculada.                                                            | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP da conversa atual.                                                             | Use `/acp spawn ... --thread ...` onde houver suporte, configure `bindings[]` no nível superior ou vá para um canal compatível.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                                                                         | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário possui o alvo de vinculação ativo.                                                                           | Refazer o vínculo como proprietário ou use outra conversa ou thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                                                                               | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP é do lado do host; a sessão solicitante está em sandbox.                                                              | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para runtime ACP.                                                                         | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe troca genérica de modelo ACP.                                                        | Use um harness que anuncie ACP `models`/`session/set_model`, use referências de modelo ACP do Codex ou configure o modelo diretamente no harness se ele tiver sua própria flag de inicialização. |
| Metadados ACP ausentes para sessão vinculada                                      | Metadados de sessão ACP obsoletos/excluídos.                                                                                    | Recrie com `/acp spawn`, então refaça o vínculo/foque a thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/execução em sessão ACP não interativa.                                                    | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| Sessão ACP falha cedo com pouca saída                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`.                                        | Verifique os logs do gateway por `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação gradual, defina `nonInteractivePermissions=deny`.        |
| Sessão ACP fica travada indefinidamente após concluir o trabalho                       | O processo do harness terminou, mas a sessão ACP não relatou conclusão.                                                    | Monitore com `ps aux \| grep acpx`; encerre processos obsoletos manualmente.                                                                                                       |
| Harness vê `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou pela fronteira ACP.                                                                | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts de conclusão simples.                                                          |

## Relacionado

- [Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Backends da CLI](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo ponte)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

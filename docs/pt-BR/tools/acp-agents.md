---
read_when:
    - Executando harnesses de codificação por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da integração do Plugin ou da entrega de conclusão
    - Operando comandos `/acp` pelo chat
sidebarTitle: ACP agents
summary: Execute harnesses de codificação externos (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) por meio do backend ACP
title: agentes ACP
x-i18n:
    generated_at: "2026-04-26T11:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permitem que o OpenClaw execute harnesses de codificação externos (por exemplo Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Cada inicialização de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de harness externo, não o caminho padrão do Codex.** O
Plugin nativo do servidor de aplicativos Codex é responsável pelos controles `/codex ...` e pelo
runtime incorporado `agentRuntime.id: "codex"`; o ACP é responsável
pelos controles `/acp ...` e pelas sessões `sessions_spawn({ runtime: "acp" })`.

Se você quiser que o Codex ou o Claude Code se conectem como um cliente MCP externo
diretamente a conversas de canal existentes do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                    | Use isto                              | Observações                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                               | `/codex bind`, `/codex threads`       | Caminho nativo do servidor de aplicativos Codex quando o plugin `codex` está habilitado; inclui respostas vinculadas no chat, encaminhamento de imagens, modelo/rápido/permissões, parada e controles de direcionamento. O ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro harness externo _por meio_ do OpenClaw | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                                                                  |
| Expor uma sessão OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente                   | [`openclaw acp`](/pt-BR/cli/acp)            | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                                                          |
| Reutilizar uma CLI de IA local como modelo fallback somente texto                                              | [CLI Backends](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                                                              |

## Isso funciona pronto para uso?

Geralmente sim. Instalações novas vêm com o Plugin de runtime `acpx` integrado habilitado
por padrão, com um binário `acpx` fixado localmente ao plugin que o OpenClaw verifica
e autorrepara na inicialização. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só ensina agentes sobre a criação de ACP quando o ACP é **realmente
utilizável**: o ACP deve estar habilitado, o despacho não pode estar desabilitado, a
sessão atual não pode estar bloqueada por sandbox e um backend de runtime deve estar
carregado. Se essas condições não forem atendidas, Skills de plugin ACP e
a orientação ACP de `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Problemas comuns na primeira execução">
    - Se `plugins.allow` estiver definido, ele será um inventário restritivo de plugins e **deverá** incluir `acpx`; caso contrário, o padrão integrado será bloqueado intencionalmente e `/acp doctor` relatará a entrada ausente na allowlist.
    - Adaptadores de harness de destino (Codex, Claude etc.) podem ser buscados sob demanda com `npx` na primeira vez em que você os usar.
    - A autenticação do fornecedor ainda precisa existir no host para esse harness.
    - Se o host não tiver npm ou acesso à rede, buscas de adaptador na primeira execução falharão até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.
  </Accordion>
  <Accordion title="Pré-requisitos de runtime">
    O ACP inicia um processo real de harness externo. O OpenClaw é responsável pelo roteamento,
    estado de tarefa em segundo plano, entrega, vínculos e política; o harness
    é responsável por seu login no provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de culpar o OpenClaw, verifique:

    - `/acp doctor` relata um backend habilitado e íntegro.
    - O ID de destino é permitido por `acp.allowedAgents` quando essa allowlist está definida.
    - O comando do harness consegue iniciar no host do Gateway.
    - A autenticação do provedor está presente para esse harness (`claude`, `codex`, `gemini`, `opencode`, `droid` etc.).
    - O modelo selecionado existe para esse harness — IDs de modelo não são portáveis entre harnesses.
    - O `cwd` solicitado existe e está acessível, ou omita `cwd` e deixe o backend usar o padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não podem clicar em prompts nativos de permissão, então execuções de codificação com muita escrita/execução geralmente precisam de um perfil de permissão ACPX que possa prosseguir sem interface.

  </Accordion>
</AccordionGroup>

Ferramentas de plugin do OpenClaw e ferramentas integradas do OpenClaw **não** são expostas a
harnesses ACP por padrão. Habilite as bridges MCP explícitas em
[agentes ACP — configuração](/pt-BR/tools/acp-agents-setup) somente quando o harness
deve chamar essas ferramentas diretamente.

## Alvos de harness compatíveis

Com o backend `acpx` integrado, use estes IDs de harness como alvos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID do harness | Backend típico                                 | Observações                                                                          |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`      | Adaptador ACP do Claude Code                   | Requer autenticação do Claude Code no host.                                          |
| `codex`       | Adaptador ACP do Codex                         | Fallback ACP explícito apenas quando o `/codex` nativo não estiver disponível ou quando ACP for solicitado. |
| `copilot`     | Adaptador ACP do GitHub Copilot                | Requer autenticação da CLI/runtime do Copilot.                                       |
| `cursor`      | ACP da CLI do Cursor (`cursor-agent acp`)      | Substitua o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente. |
| `droid`       | CLI Factory Droid                              | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente do harness.       |
| `gemini`      | Adaptador ACP do Gemini CLI                    | Requer autenticação do Gemini CLI ou configuração de chave de API.                   |
| `iflow`       | CLI iFlow                                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.     |
| `kilocode`    | CLI Kilo Code                                  | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.     |
| `kimi`        | CLI Kimi/Moonshot                              | Requer autenticação Kimi/Moonshot no host.                                           |
| `kiro`        | CLI Kiro                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.     |
| `opencode`    | Adaptador ACP do OpenCode                      | Requer autenticação da CLI/provedor do OpenCode.                                     |
| `openclaw`    | Bridge do OpenClaw Gateway via `openclaw acp`  | Permite que um harness compatível com ACP converse de volta com uma sessão OpenClaw Gateway. |
| `pi`          | Pi/runtime OpenClaw incorporado                | Usado para experimentos de harness nativos do OpenClaw.                              |
| `qwen`        | Qwen Code / Qwen CLI                           | Requer autenticação compatível com Qwen no host.                                     |

Aliases personalizados de agente acpx podem ser configurados no próprio acpx, mas a
política do OpenClaw ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do despacho.

## Runbook do operador

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Criar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` ou
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou thread vinculada (ou direcione para a
    chave da sessão explicitamente).
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
    `/acp cancel` (turno atual) ou `/acp close` (sessão + vínculos).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalhes do ciclo de vida">
    - Criar inicia ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessão do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence ao pai.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que o vínculo seja fechado, desfocado, redefinido ou expire.
    - Comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto normal de prompt para um harness ACP vinculado.
    - `cancel` interrompe o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui o vínculo nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove o vínculo. Um harness ainda pode manter seu próprio histórico upstream se oferecer suporte a retomada.
    - Workers de runtime ociosos podem ser limpos após `acp.runtime.ttlMinutes`; os metadados de sessão armazenados permanecem disponíveis para `/acp sessions`.
  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem ser roteados para o **Plugin nativo do Codex**
    quando ele estiver habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread do Codex `<id>`."
    - "Mostre as threads do Codex e depois vincule esta."

    O vínculo nativo de conversa do Codex é o caminho padrão de controle por chat.
    Ferramentas dinâmicas do OpenClaw ainda são executadas por meio do OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramenta nativa do Codex, o OpenClaw injeta um
    relay de hook nativo por turno para que hooks de plugin possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos `PermissionRequest` do Codex
    por meio de aprovações do OpenClaw. Hooks `Stop` do Codex são retransmitidos para
    `before_agent_finalize` do OpenClaw, onde plugins podem solicitar mais uma
    passagem do modelo antes de o Codex finalizar sua resposta. O relay permanece
    deliberadamente conservador: ele não altera argumentos de ferramenta nativa do Codex
    nem reescreve registros de thread do Codex. Use ACP explícito apenas
    quando quiser o modelo de runtime/sessão ACP. O limite de suporte
    do Codex incorporado está documentado no
    [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Folha de referência de seleção de modelo / provedor / runtime">
    - `openai-codex/*` — rota PI Codex OAuth/assinatura.
    - `openai/*` mais `agentRuntime.id: "codex"` — runtime incorporado nativo do servidor de aplicativos Codex.
    - `/codex ...` — controle nativo de conversa do Codex.
    - `/acp ...` ou `runtime: "acp"` — controle ACP/acpx explícito.
  </Accordion>
  <Accordion title="Gatilhos em linguagem natural para roteamento ACP">
    Gatilhos que devem ser roteados para o runtime ACP:

    - "Execute isso como uma sessão ACP do Claude Code de execução única e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex por meio do ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e
    roteia acompanhamentos para essa sessão até fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou quando o Plugin nativo do Codex
    não está disponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando o ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime ACP
    está carregado. Ele tem como alvo IDs de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um ID normal
    de agente de configuração do OpenClaw de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente OpenClaw
    está configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como ID de harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **servidor de aplicativos Codex
nativo** para vínculo/controle de conversa do Codex quando o plugin `codex`
estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principais | `/acp ...`                      | `/subagents ...`                    |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin de runtime `acpx` integrado.
3. Adaptador ACP do Claude.
4. Maquinário de runtime/sessão do lado do Claude.

ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefa em segundo plano e vínculo opcional com conversa/thread.

Backends de CLI são runtimes fallback locais separados somente de texto — veja
[CLI Backends](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback local simples de texto por meio da CLI bruta?** Use backends de CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** — onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **Sessão ACP** — o estado durável de runtime Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** — uma superfície extra opcional de mensagens criada apenas por `--thread ...`.
- **Workspace de runtime** — o local do sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

### Vínculos com a conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual na
sessão ACP criada — sem thread filha, mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a
sessão no mesmo lugar; `/acp close` remove o vínculo.

Exemplos:

```text
/codex bind                                              # vínculo nativo do Codex, roteia futuras mensagens para cá
/codex model gpt-5.4                                     # ajusta a thread nativa do Codex vinculada
/codex stop                                              # controla o turno nativo ativo do Codex
/acp spawn codex --bind here                             # fallback ACP explícito para o Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular lá
/acp spawn codex --bind here --cwd /workspace/repo       # mesmo vínculo de chat, o Codex roda em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vínculo e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` só funciona em canais que anunciam vínculo com a conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de falta de suporte. Os vínculos persistem após reinicializações do gateway.
    - No Discord, `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here` — não para `--bind here`.
    - Se você criar para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) recorrem ao padrão do backend; outros erros de acesso (por exemplo `EACCES`) aparecem como erros de criação.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas — comandos `/acp ...` são processados pelo OpenClaw mesmo quando o texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos estiver habilitado para essa superfície.
  </Accordion>
  <Accordion title="Sessões vinculadas a thread">
    Quando vínculos de thread estão habilitados para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
    - A saída ACP é entregue de volta à mesma thread.
    - Desfocar/fechar/arquivar/timeout por inatividade ou expiração por idade máxima remove o vínculo.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso obrigatórias para ACP vinculado a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` vem ativado por padrão (defina `false` para pausar o despacho ACP).
    - Flag de criação de thread ACP do adaptador de canal habilitada (específica do adaptador):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    O suporte a vínculo de thread é específico do adaptador. Se o adaptador
    de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma
    mensagem clara de indisponibilidade/falta de suporte.

  </Accordion>
  <Accordion title="Canais com suporte a thread">
    - Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos em DM).
    - Canais de plugin podem adicionar suporte por meio da mesma interface de vínculo.
  </Accordion>
</AccordionGroup>

## Vínculos persistentes de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em
entradas de nível superior `bindings[]`.

### Modelo de vínculo

<ParamField path="bindings[].type" type='"acp"'>
  Marca um vínculo persistente de conversa ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo do BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vínculos estáveis de grupo.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  O ID do agente OpenClaw proprietário.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Substituição opcional de ACP.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Rótulo opcional voltado ao operador.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  Diretório de trabalho de runtime opcional.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  Substituição opcional de backend.
  </ParamField>

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de substituição para sessões ACP vinculadas:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Padrões globais de ACP (por exemplo `acp.backend`)

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
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no mesmo lugar.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos ausentes do workspace herdado recorrem ao cwd padrão do backend; falhas de acesso que não sejam por ausência aparecem como erros de criação.

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
    para sessões ACP. Se `agentId` for omitido, o OpenClaw usará
    `acp.defaultAgent` quando configurado. `mode: "session"` exige
    `thread: true` para manter uma conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="A partir do comando /acp">
    Use `/acp spawn` para controle explícito do operador pelo chat.

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

    Veja [Comandos de barra](/pt-BR/tools/slash-commands).

  </Tab>
</Tabs>

### Parâmetros de `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt inicial enviado para a sessão ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Deve ser `"acp"` para sessões ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID do harness ACP de destino. Recorre a `acp.defaultAgent` se estiver definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita fluxo de vínculo com thread quando houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw pode usar comportamento persistente por padrão de acordo com
  o caminho do runtime. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho solicitado do runtime (validado pela política do backend/runtime).
  Se omitido, a criação ACP herda o workspace do agente de destino
  quando configurado; caminhos herdados ausentes recorrem aos padrões
  do backend, enquanto erros reais de acesso são retornados.
</ParamField>
<ParamField path="label" type="string">
  Rótulo voltado ao operador usado no texto de sessão/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Retoma uma sessão ACP existente em vez de criar uma nova. O
  agente reproduz seu histórico de conversa via `session/load`. Exige
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a
  sessão solicitante como eventos de sistema. As respostas aceitas incluem
  `streamLogPath` apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe o turno filho ACP após N segundos. `0` mantém o turno no
  caminho sem timeout do gateway. O mesmo valor é aplicado ao runtime do Gateway
  e do ACP para que harnesses travados/com cota esgotada não
  ocupem a faixa do agente pai indefinidamente.
</ParamField>
<ParamField path="model" type="string">
  Substituição explícita de modelo para a sessão filha ACP. Criações ACP do Codex
  normalizam refs Codex do OpenClaw, como `openai-codex/gpt-5.4`, para a configuração de inicialização do ACP do Codex antes de `session/new`; formas com barra, como
  `openai-codex/gpt-5.4/high`, também definem o esforço de raciocínio do ACP do Codex.
  Outros harnesses precisam anunciar `models` ACP e oferecer suporte a
  `session/set_model`; caso contrário, OpenClaw/acpx falha claramente em vez de
  recorrer silenciosamente ao padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de thinking/raciocínio. Para ACP do Codex, `minimal` mapeia para
  esforço baixo, `low`/`medium`/`high`/`xhigh` mapeiam diretamente, e `off`
  omite a substituição de inicialização do esforço de raciocínio.
</ParamField>

## Modos de vínculo e thread na criação

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                          |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula a conversa ativa atual no mesmo lugar; falha se nenhuma estiver ativa. |
    | `off`  | Não cria um vínculo com a conversa atual.                              |

    Observações:

    - `--bind here` é o caminho mais simples para o operador para "tornar este canal ou chat respaldado pelo Codex".
    - `--bind here` não cria uma thread filha.
    - `--bind here` está disponível apenas em canais que expõem suporte a vínculo com a conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                      |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
    | `here` | Exige thread ativa atual; falha se não estiver em uma.                                              |
    | `off`  | Sem vínculo. A sessão inicia desvinculada.                                                          |

    Observações:

    - Em superfícies sem vínculo de thread, o comportamento padrão é efetivamente `off`.
    - A criação vinculada a thread exige suporte da política do canal:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

  </Tab>
</Tabs>

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano
de propriedade do pai. O caminho de entrega depende desse formato.

<AccordionGroup>
  <Accordion title="Sessões ACP interativas">
    Sessões interativas servem para continuar conversando em uma superfície
    visível de chat:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
    - `bindings[].type="acp"` configurados de forma persistente roteiam conversas correspondentes para a mesma sessão ACP.

    Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta para esse mesmo
    canal/thread/tópico.

    O que o OpenClaw envia ao harness:

    - Acompanhamentos vinculados normais são enviados como texto de prompt, mais anexos apenas quando o harness/backend oferece suporte a eles.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do despacho ACP.
    - Eventos de conclusão gerados pelo runtime são materializados por destino. Agentes OpenClaw recebem o envelope interno de contexto de runtime do OpenClaw; harnesses ACP externos recebem um prompt simples com o resultado filho e instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado para harnesses externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de gatilho visível ao usuário ou o prompt simples de conclusão. Metadados de eventos internos permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat criado pelo usuário.

  </Accordion>
  <Accordion title="Sessões ACP de execução única de propriedade do pai">
    Sessões ACP de execução única criadas por outra execução de agente são filhas
    em segundo plano, semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - O filho é executado em sua própria sessão de harness ACP.
    - Turnos filhos rodam na mesma faixa em segundo plano usada por criações nativas de subagente, para que um harness ACP lento não bloqueie trabalho não relacionado da sessão principal.
    - A conclusão é reportada de volta pelo caminho de anúncio de conclusão de tarefa. O OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo para um harness externo, para que harnesses não vejam marcadores de contexto de runtime exclusivos do OpenClaw.
    - O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário for útil.

    **Não** trate este caminho como um chat ponto a ponto entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="Entrega via sessions_send e A2A">
    `sessions_send` pode ter como alvo outra sessão após a criação. Para sessões
    pares normais, o OpenClaw usa um caminho de acompanhamento agente para agente (A2A)
    após injetar a mensagem:

    - Aguarda a resposta da sessão de destino.
    - Opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento.
    - Solicita que o destino produza uma mensagem de anúncio.
    - Entrega esse anúncio ao canal ou thread visível.

    Esse caminho A2A é um fallback para envios entre sessões em que o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode
    ver e enviar mensagem para um alvo ACP, por exemplo sob configurações amplas de
    `tools.sessions.visibility`.

    O OpenClaw ignora o acompanhamento A2A somente quando o solicitante é o
    pai de seu próprio filho ACP de execução única de propriedade do pai. Nesse caso,
    executar A2A além da conclusão da tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta para o filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` informa
    `delivery.status="skipped"` para esse caso de filho próprio porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Retomar uma sessão existente">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, então ele continua com o contexto completo do que veio antes.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Transferir uma sessão Codex do seu laptop para o seu telefone — diga ao seu agente para continuar de onde você parou.
    - Continuar uma sessão de codificação que você iniciou interativamente na CLI, agora sem interface por meio do seu agente.
    - Retomar trabalho que foi interrompido por reinicialização do gateway ou timeout por inatividade.

    Observações:

    - `resumeSessionId` exige `runtime: "acp"` — retorna um erro se for usado com o runtime de subagente.
    - `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o ID da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Teste de fumaça pós-implantação">
    Após uma implantação do gateway, execute uma verificação ativa de ponta a ponta em vez de
    confiar em testes unitários:

    1. Verifique a versão e o commit do gateway implantado no host de destino.
    2. Abra uma sessão bridge ACPX temporária para um agente ativo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e ausência de erro de validador.
    5. Limpe a sessão bridge temporária.

    Mantenha a validação em `mode: "run"` e ignore `streamTo: "parent"` —
    os caminhos vinculados a thread com `mode: "session"` e de relay de stream são
    etapas de integração separadas e mais ricas.

  </Accordion>
</AccordionGroup>

## Compatibilidade com sandbox

Atualmente, sessões ACP são executadas no runtime do host, **não** dentro da
sandbox do OpenClaw.

<Warning>
**Limite de segurança:**

- O harness externo pode ler/gravar de acordo com suas próprias permissões de CLI e com o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do harness ACP.
- O OpenClaw ainda aplica gates de recurso do ACP, agentes permitidos, propriedade da sessão, vínculos de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com sandbox aplicada.
  </Warning>

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP são bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução do alvo da sessão

A maioria das ações de `/acp` aceita um alvo de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento explícito de destino (ou `--session` para `/acp steer`)
   - tenta chave
   - depois `session id` em formato UUID
   - depois rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback para a sessão solicitante atual.

Vínculos da conversa atual e vínculos de thread participam ambos da
etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual ou vínculo de thread opcionais. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.               | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime e capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.         | `/acp set-mode plan`                                          |
| `/acp set`           | Gravação genérica de opção de configuração do runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição do modelo do runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.       | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.               | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades e correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                                |

`/acp status` mostra as opções de runtime efetivas, além de identificadores de sessão no nível de runtime e
backend. Erros de controle não compatível aparecem
claramente quando um backend não tem determinada capacidade. `/acp sessions` lê o
armazenamento para a sessão vinculada atual ou da sessão solicitante; tokens de destino
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessão do gateway, incluindo raízes personalizadas `session.store`
por agente.

### Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um configurador genérico. Operações
equivalentes:

| Comando                      | Mapeia para                          | Observações                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chave de configuração de runtime `model`           | Para ACP do Codex, o OpenClaw normaliza `openai-codex/<model>` para o ID de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai-codex/gpt-5.4/high`, para `reasoning_effort`. |
| `/acp set thinking <level>`  | chave de configuração de runtime `thinking`        | Para ACP do Codex, o OpenClaw envia o `reasoning_effort` correspondente quando o adaptador oferece suporte a isso.                                                              |
| `/acp permissions <profile>` | chave de configuração de runtime `approval_policy` | —                                                                                                                                                                                |
| `/acp timeout <seconds>`     | chave de configuração de runtime `timeout`         | —                                                                                                                                                                                |
| `/acp cwd <path>`            | substituição de cwd do runtime                     | Atualização direta.                                                                                                                                                              |
| `/acp set <key> <value>`     | genérico                              | `key=cwd` usa o caminho de substituição de cwd.                                                                                                                                   |
| `/acp reset-options`         | limpa todas as substituições de runtime         | —                                                                                                                                                                                |

## acpx harness, configuração de Plugin e permissões

Para configuração de harness acpx (aliases do Claude Code / Codex / Gemini CLI),
as bridges MCP de ferramentas de Plugin e de ferramentas do OpenClaw, e modos de
permissão do ACP, veja
[agentes ACP — configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.       | Instale e habilite o Plugin de backend, inclua `acpx` em `plugins.allow` quando essa allowlist estiver definida e depois execute `/acp doctor`.                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                   | Defina `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho a partir de mensagens normais de thread desabilitado.                  | Defina `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na allowlist.                                                   | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                               |
| `/acp doctor` reports backend not ready right after startup                 | Verificação de dependência do Plugin ou autorreparo ainda está em execução.     | Aguarde um pouco e execute `/acp doctor` novamente; se continuar indisponível, inspecione o erro de instalação do backend e a política de allow/deny do plugin.           |
| Harness command not found                                                   | A CLI do adaptador não está instalada ou a busca inicial com `npx` falhou.      | Instale/pré-aqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                                   |
| Model-not-found from the harness                                            | O ID do modelo é válido para outro provedor/harness, mas não para este alvo ACP. | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                            |
| Vendor auth error from the harness                                          | O OpenClaw está íntegro, mas a CLI/provedor de destino não está autenticado.    | Faça login ou forneça a chave de provedor necessária no ambiente do host do Gateway.                                                                                      |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa ativa vinculável.                      | Vá para o chat/canal de destino e tente novamente ou use criação sem vínculo.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP com a conversa atual.             | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` foi usado fora de um contexto de thread.                        | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é proprietário do alvo de vínculo ativo.                          | Refaça o vínculo como proprietário ou use outra conversa ou thread.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo de thread.                            | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` em sessões em sandbox ou execute a criação ACP a partir de uma sessão sem sandbox.                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` foi solicitado para runtime ACP.                            | Use `runtime="subagent"` para sandbox obrigatória ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                 |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe troca genérica de modelo por ACP.                | Use um harness que anuncie `models`/`session/set_model` de ACP, use refs de modelo ACP do Codex ou configure o modelo diretamente no harness se ele tiver sua própria flag de inicialização. |
| Missing ACP metadata for bound session                                      | Metadados de sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn` e depois refaça o vínculo/foco da thread.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/execuções em sessão ACP não interativa.     | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway em busca de `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação controlada, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não informou a conclusão.      | Monitore com `ps aux \| grep acpx`; encerre processos obsoletos manualmente.                                                                                              |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou pela fronteira ACP.                            | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts simples de conclusão.                                       |

## Relacionado

- [agentes ACP — configuração](/pt-BR/tools/acp-agents-setup)
- [Envio de agente](/pt-BR/tools/agent-send)
- [CLI Backends](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

---
read_when:
    - Executando ambientes de codificação por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da integração de Plugin ou da entrega de conclusões
    - Operando comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute ambientes externos de codificação (Claude Code, Cursor, Gemini CLI, ACP explícito do Codex, ACP do OpenClaw, OpenCode) por meio do back-end ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-05-07T13:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessões
permitem que o OpenClaw execute harnesses de codificação externos (por exemplo, Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Cada geração de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de harness externo, não o caminho padrão do Codex.** O
plugin nativo de servidor de aplicativo do Codex controla os comandos
`/codex ...` e o runtime incorporado `agentRuntime.id: "codex"`; ACP controla
os comandos `/acp ...` e as sessões `sessions_spawn({ runtime: "acp" })`.

Se você quer que Codex ou Claude Code se conectem como um cliente MCP externo
diretamente às conversas existentes de canais do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                    | Use isto                              | Observações                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                               | `/codex bind`, `/codex threads`       | Caminho nativo do servidor de aplicativo do Codex quando o plugin `codex` está habilitado; inclui respostas de chat vinculadas, encaminhamento de imagens, modelo/rápido/permissões, parar e controles de direção. ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro harness externo _por meio_ do OpenClaw | Esta página                             | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                                                                                   |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente                   | [`openclaw acp`](/pt-BR/cli/acp)            | Modo ponte. IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                                                            |
| Reutilizar uma CLI de IA local como modelo de fallback somente texto                                              | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                                                                               |

## Isso funciona imediatamente?

Sim, após instalar o plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts de código-fonte podem usar o plugin de workspace local `extensions/acpx` após
`pnpm install`. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só ensina agentes sobre geração ACP quando ACP está **realmente
utilizável**: ACP deve estar habilitado, o dispatch não deve estar desabilitado, a sessão
atual não deve estar bloqueada por sandbox e um backend de runtime deve estar
carregado. Se essas condições não forem atendidas, as Skills do plugin ACP e a
orientação ACP de `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Armadilhas da primeira execução">
    - Se `plugins.allow` estiver definido, ele é um inventário restritivo de plugins e **deve** incluir `acpx`; caso contrário, o backend ACP instalado é bloqueado intencionalmente e `/acp doctor` relata a entrada ausente na allowlist.
    - O adaptador ACP do Codex é preparado com o plugin `acpx` e iniciado localmente quando possível.
    - Codex ACP executa com um `CODEX_HOME` isolado; o OpenClaw copia apenas entradas de projeto confiáveis da configuração do Codex do host e confia no workspace ativo, deixando autenticação, notificações e hooks na configuração do host.
    - Outros adaptadores de harness de destino ainda podem ser buscados sob demanda com `npx` na primeira vez que você os usa.
    - A autenticação do fornecedor ainda precisa existir no host para esse harness.
    - Se o host não tiver npm ou acesso à rede, buscas de adaptador na primeira execução falham até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos de runtime">
    ACP inicia um processo real de harness externo. O OpenClaw controla roteamento,
    estado de tarefa em segundo plano, entrega, vínculos e política; o harness
    controla seu login de provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de culpar o OpenClaw, verifique:

    - `/acp doctor` relata um backend habilitado e íntegro.
    - O id de destino é permitido por `acp.allowedAgents` quando essa allowlist está definida.
    - O comando do harness pode iniciar no host do Gateway.
    - A autenticação do provedor está presente para esse harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - O modelo selecionado existe para esse harness - ids de modelo não são portáveis entre harnesses.
    - O `cwd` solicitado existe e está acessível, ou omita `cwd` e deixe o backend usar seu padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não conseguem clicar em prompts nativos de permissão, então execuções de codificação intensivas em escrita/execução geralmente precisam de um perfil de permissão ACPX que possa prosseguir sem intervenção.

  </Accordion>
</AccordionGroup>

Ferramentas de plugin do OpenClaw e ferramentas integradas do OpenClaw **não** são expostas a
harnesses ACP por padrão. Habilite as pontes MCP explícitas em
[agentes ACP - configuração](/pt-BR/tools/acp-agents-setup) somente quando o harness
deve chamar essas ferramentas diretamente.

## Destinos de harness compatíveis

Com o backend `acpx`, use estes ids de harness como destinos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id do harness | Backend típico                                | Observações                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adaptador ACP do Claude Code                        | Requer autenticação do Claude Code no host.                                              |
| `codex`    | Adaptador ACP do Codex                              | Fallback ACP explícito somente quando `/codex` nativo está indisponível ou ACP é solicitado. |
| `copilot`  | Adaptador ACP do GitHub Copilot                     | Requer autenticação da CLI/runtime do Copilot.                                                  |
| `cursor`   | ACP da Cursor CLI (`cursor-agent acp`)            | Substitua o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente.    |
| `droid`    | Factory Droid CLI                              | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente do harness.        |
| `gemini`   | Adaptador ACP da Gemini CLI                         | Requer autenticação da Gemini CLI ou configuração de chave de API.                                          |
| `iflow`    | iFlow CLI                                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                 |
| `kilocode` | Kilo Code CLI                                  | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Requer autenticação Kimi/Moonshot no host.                                            |
| `kiro`     | Kiro CLI                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                 |
| `opencode` | Adaptador ACP do OpenCode                           | Requer autenticação da CLI/provedor do OpenCode.                                                |
| `openclaw` | Ponte do OpenClaw Gateway por meio de `openclaw acp` | Permite que um harness compatível com ACP fale de volta com uma sessão do OpenClaw Gateway.                 |
| `pi`       | Runtime Pi/OpenClaw incorporado                   | Usado para experimentos de harness nativos do OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Requer autenticação compatível com Qwen no host.                                          |

Aliases de agentes acpx personalizados podem ser configurados no próprio acpx, mas a política do OpenClaw
ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do dispatch.

## Runbook do operador

Fluxo rápido de `/acp` a partir do chat:

<Steps>
  <Step title="Gerar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitamente
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou thread vinculada (ou direcione a sessão
    explicitamente pela chave).
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
    - A geração cria ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence ao pai.
    - Sessões ACP pertencentes ao pai são tratadas como trabalho em segundo plano mesmo quando a sessão de runtime é persistente; conclusão e entrega entre superfícies passam pelo notificador da tarefa pai em vez de agir como uma sessão normal de chat voltada ao usuário.
    - A manutenção de tarefas fecha sessões ACP one-shot terminais ou órfãs pertencentes ao pai. Sessões ACP persistentes são preservadas enquanto um vínculo ativo de conversa permanece; sessões persistentes obsoletas sem um vínculo ativo são fechadas para que não possam ser retomadas silenciosamente depois que a tarefa proprietária termina ou seu registro de tarefa desaparece.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que o vínculo seja fechado, desfocado, redefinido ou expire.
    - Comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto normal de prompt para um harness ACP vinculado.
    - `cancel` aborta o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui o vínculo nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove o vínculo. Um harness ainda pode manter seu próprio histórico upstream se oferecer suporte a retomar.
    - O plugin acpx limpa árvores de processos de wrapper e adaptador pertencentes ao OpenClaw após `close`, e recolhe órfãos ACPX obsoletos pertencentes ao OpenClaw durante a inicialização do Gateway.
    - Workers de runtime ociosos são elegíveis para limpeza após `acp.runtime.ttlMinutes`; metadados de sessão armazenados permanecem disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem ser roteados para o **plugin nativo do Codex**
    quando ele está habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread do Codex `<id>`."
    - "Mostre as threads do Codex, depois vincule esta."

    A vinculação nativa de conversas do Codex é o caminho padrão de controle de chat.
    As ferramentas dinâmicas do OpenClaw ainda são executadas pelo OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta um relay de hook
    nativo por turno para que hooks de Plugin possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos `PermissionRequest` do Codex
    pelas aprovações do OpenClaw. Hooks `Stop` do Codex são retransmitidos para
    `before_agent_finalize` do OpenClaw, onde Plugins podem solicitar mais uma
    passagem do modelo antes que o Codex finalize sua resposta. O relay permanece
    deliberadamente conservador: ele não altera argumentos de ferramentas nativas
    do Codex nem reescreve registros de thread do Codex. Use ACP explícito somente
    quando quiser o modelo de runtime/sessão do ACP. O limite de suporte do Codex
    incorporado está documentado no
    [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Resumo de seleção de modelo / provedor / runtime">
    - `openai-codex/*` - rota legada de modelo Codex OAuth/assinatura reparada pelo doctor.
    - `openai/*` - runtime incorporado nativo do servidor de aplicativo Codex para turnos de agente OpenAI.
    - `/codex ...` - controle nativo de conversa do Codex.
    - `/acp ...` ou `runtime: "acp"` - controle ACP/acpx explícito.

  </Accordion>
  <Accordion title="Gatilhos de linguagem natural para roteamento ACP">
    Gatilhos que devem rotear para o runtime ACP:

    - "Execute isto como uma sessão ACP avulsa do Claude Code e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex pelo ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e
    roteia acompanhamentos para essa sessão até o fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou o Plugin nativo do Codex
    está indisponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando o ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime
    ACP está carregado. `acp.dispatch.enabled=false` pausa o despacho automático
    de threads ACP, mas não oculta nem bloqueia chamadas explícitas de
    `sessions_spawn({ runtime: "acp" })`. Ele aponta para ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um id normal de agente
    da configuração do OpenClaw vindo de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente do OpenClaw
    está configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como o id de harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **servidor de aplicativo
nativo do Codex** para vinculação/controle de conversa do Codex quando o Plugin
`codex` estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                     | `/subagents ...`                   |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code pelo ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin oficial de runtime `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Maquinário de runtime/sessão do lado do Claude.

O ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefas em segundo plano e vinculação opcional de conversa/thread.

Backends de CLI são runtimes locais separados de fallback somente texto - veja
[Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback simples de texto local pela CLI bruta?** Use backends de CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** - onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **Sessão ACP** - o estado durável de runtime do Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** - uma superfície extra opcional de mensagens criada somente por `--thread ...`.
- **Workspace de runtime** - o local do sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

### Vinculações de conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à
sessão ACP criada - sem thread filha, mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa roteiam para a mesma sessão; `/new` e `/reset` redefinem a
sessão no lugar; `/acp close` remove a vinculação.

Exemplos:

```text
/codex bind                                              # vinculação nativa do Codex, roteia mensagens futuras aqui
/codex model gpt-5.4                                     # ajusta a thread nativa vinculada do Codex
/codex stop                                              # controla o turno nativo ativo do Codex
/acp spawn codex --bind here                             # fallback ACP explícito para Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular ali
/acp spawn codex --bind here --cwd /workspace/repo       # mesma vinculação de chat, Codex roda em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` só funciona em canais que anunciam vinculação de conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de não suporte. Vinculações persistem entre reinicializações do gateway.
    - No Discord, `spawnSessions` controla a criação de threads filhas para `--thread auto|here` - não `--bind here`.
    - Se você criar uma sessão para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) fazem fallback para o padrão do backend; outros erros de acesso (por exemplo, `EACCES`) aparecem como erros de criação.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas - comandos `/acp ...` são tratados pelo OpenClaw mesmo quando texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos estiver habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a threads">
    Quando vinculações de thread estão habilitadas para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread roteiam para a sessão ACP vinculada.
    - A saída do ACP é entregue de volta à mesma thread.
    - Unfocus/fechamento/arquivamento/timeout de inatividade ou expiração por idade máxima remove a vinculação.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso necessárias para ACP vinculado a threads:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ligado por padrão (defina `false` para pausar o despacho automático de threads ACP; chamadas explícitas de `sessions_spawn({ runtime: "acp" })` continuam funcionando).
    - Criações de sessão de thread do adaptador de canal habilitadas (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte a vinculação de thread é específico do adaptador. Se o adaptador
    de canal ativo não oferecer suporte a vinculações de thread, o OpenClaw retorna
    uma mensagem clara de não suporte/indisponibilidade.

  </Accordion>
  <Accordion title="Canais com suporte a threads">
    - Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de DM).
    - Canais de Plugin podem adicionar suporte pela mesma interface de vinculação.

  </Accordion>
</AccordionGroup>

## Vinculações persistentes de canal

Para fluxos de trabalho não efêmeros, configure vinculações ACP persistentes em
entradas de nível superior `bindings[]`.

### Modelo de vinculação

<ParamField path="bindings[].type" type='"acp"'>
  Marca uma vinculação persistente de conversa ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo do BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` ou `chat_identifier:*` para vinculações de grupo estáveis.
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vinculações de grupo estáveis.

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
  Diretório de trabalho opcional do runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sobrescrita opcional de backend.
</ParamField>

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de sobrescrita para sessões ACP vinculadas:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Padrões globais do ACP (por exemplo, `acp.backend`)

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
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no local.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos de workspace herdados ausentes recorrem ao cwd padrão do backend; falhas de acesso não ausentes aparecem como erros de criação.

## Iniciar sessões ACP

Duas formas de iniciar uma sessão ACP:

<Tabs>
  <Tab title="A partir de sessions_spawn">
    Use `runtime: "acp"` para iniciar uma sessão ACP a partir de uma vez de agente ou
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

    Consulte [comandos de barra](/pt-BR/tools/slash-commands).

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
  ID do harness de destino ACP. Recorre a `acp.defaultAgent` se definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita fluxo de vínculo de thread quando houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw poderá usar comportamento persistente por padrão conforme
  o caminho de runtime. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho de runtime solicitado (validado pela política de backend/runtime).
  Se omitido, a criação ACP herda o workspace do agente de destino
  quando configurado; caminhos herdados ausentes recorrem aos padrões do backend,
  enquanto erros reais de acesso são retornados.
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
  sessão solicitante como eventos de sistema. Respostas aceitas incluem
  `streamLogPath`, apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de retransmissão.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe a vez ACP filha após N segundos. `0` mantém a vez no
  caminho sem timeout do Gateway. O mesmo valor é aplicado à execução do Gateway
  e ao runtime ACP para que harnesses travados ou com cota esgotada não
  ocupem a faixa do agente pai indefinidamente.
</ParamField>
<ParamField path="model" type="string">
  Substituição explícita de modelo para a sessão ACP filha. Criações ACP do Codex
  normalizam referências do OpenClaw Codex, como `openai-codex/gpt-5.4`, para a configuração
  de inicialização do Codex ACP antes de `session/new`; formas de barra como
  `openai-codex/gpt-5.4/high` também definem o esforço de raciocínio do Codex ACP.
  Outros harnesses devem anunciar `models` ACP e oferecer suporte a
  `session/set_model`; caso contrário, OpenClaw/acpx falha claramente em vez de
  recorrer silenciosamente ao padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de pensamento/raciocínio. Para Codex ACP, `minimal` é mapeado para
  esforço baixo, `low`/`medium`/`high`/`xhigh` são mapeados diretamente, e `off`
  omite a substituição de inicialização de esforço de raciocínio.
</ParamField>

## Modos de vínculo e thread de criação

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
    | `off`  | Não cria um vínculo de conversa atual.                          |

    Observações:

    - `--bind here` é o caminho mais simples para operadores para "tornar este canal ou chat respaldado pelo Codex".
    - `--bind here` não cria uma thread filha.
    - `--bind here` só está disponível em canais que expõem suporte a vínculo de conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
    | `here` | Exige thread ativa atual; falha se não estiver em uma.                                                  |
    | `off`  | Sem vínculo. A sessão começa desvinculada.                                                                 |

    Observações:

    - Em superfícies de vínculo sem threads, o comportamento padrão é efetivamente `off`.
    - Criação vinculada a thread exige suporte da política do canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

  </Tab>
</Tabs>

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano
pertencente ao pai. O caminho de entrega depende desse formato.

<AccordionGroup>
  <Accordion title="Sessões ACP interativas">
    Sessões interativas foram pensadas para continuar conversando em uma superfície
    de chat visível:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
    - `bindings[].type="acp"` persistentes configurados roteiam conversas correspondentes para a mesma sessão ACP.

    Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta ao mesmo
    canal/thread/tópico.

    O que o OpenClaw envia ao harness:

    - Acompanhamentos vinculados normais são enviados como texto de prompt, mais anexos somente quando o harness/backend oferece suporte.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do despacho ACP.
    - Eventos de conclusão gerados pelo runtime são materializados por destino. Agentes OpenClaw recebem o envelope interno de contexto de runtime do OpenClaw; harnesses ACP externos recebem um prompt simples com o resultado filho e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado a harnesses externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de acionamento visível ao usuário ou o prompt simples de conclusão. Metadados internos de eventos permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat escrito pelo usuário.

  </Accordion>
  <Accordion title="Sessões ACP de execução única pertencentes ao pai">
    Sessões ACP de execução única criadas por outra execução de agente são filhos
    em segundo plano, semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - O filho executa na própria sessão de harness ACP.
    - Vezes do filho executam na mesma faixa em segundo plano usada por criações de subagentes nativos, então um harness ACP lento não bloqueia trabalho não relacionado da sessão principal.
    - A conclusão é reportada de volta pelo caminho de anúncio de conclusão da tarefa. O OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo a um harness externo, para que harnesses não vejam marcadores de contexto de runtime exclusivos do OpenClaw.
    - O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate este caminho como um chat ponto a ponto entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="sessions_send e entrega A2A">
    `sessions_send` pode direcionar outra sessão após a criação. Para sessões pares
    normais, o OpenClaw usa um caminho de acompanhamento agente a agente (A2A)
    depois de injetar a mensagem:

    - Aguarda a resposta da sessão de destino.
    - Opcionalmente permite que solicitante e destino troquem um número limitado de vezes de acompanhamento.
    - Pede ao destino para produzir uma mensagem de anúncio.
    - Entrega esse anúncio ao canal ou thread visível.

    Esse caminho A2A é um fallback para envios entre pares nos quais o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada consegue
    ver e enviar mensagens a um destino ACP, por exemplo em configurações amplas de
    `tools.sessions.visibility`.

    O OpenClaw ignora o acompanhamento A2A somente quando o solicitante é o
    pai de seu próprio filho ACP de execução única pertencente ao pai. Nesse caso,
    executar A2A sobre a conclusão da tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta ao filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` reporta
    `delivery.status="skipped"` nesse caso de filho pertencente ao pai porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Retomar uma sessão existente">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, então retoma com todo o contexto do que veio antes.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Transferir uma sessão Codex do seu laptop para o seu telefone - diga ao seu agente para retomar de onde você parou.
    - Continuar uma sessão de codificação que você iniciou interativamente na CLI, agora sem interface por meio do seu agente.
    - Retomar trabalho que foi interrompido por uma reinicialização do Gateway ou timeout por inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` é um ID de retomada ACP/harness local do host, não uma chave de sessão de canal do OpenClaw; o OpenClaw ainda verifica a política de criação ACP e a política do agente de destino antes do despacho, enquanto o backend ou harness ACP é responsável pela autorização para carregar esse ID upstream.
    - `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o ID da sessão não for encontrado, a criação falha com um erro claro - sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Teste rápido pós-deploy">
    Após um deploy de Gateway, execute uma verificação ao vivo de ponta a ponta em vez de
    confiar em testes unitários:

    1. Verifique a versão e o commit do Gateway implantado no host de destino.
    2. Abra uma sessão de ponte ACPX temporária para um agente ativo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e nenhum erro de validador.
    5. Limpe a sessão de ponte temporária.

    Mantenha o gate em `mode: "run"` e ignore `streamTo: "parent"` -
    `mode: "session"` vinculado à thread e caminhos de retransmissão de stream são
    passagens de integração mais completas separadas.

  </Accordion>
</AccordionGroup>

## Compatibilidade de sandbox

As sessões ACP atualmente são executadas no runtime do host, **não** dentro do
sandbox do OpenClaw.

<Warning>
**Limite de segurança:**

- O ambiente externo pode ler/gravar de acordo com suas próprias permissões de CLI e o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do ambiente ACP.
- O OpenClaw ainda impõe gates de recursos ACP, agentes permitidos, propriedade de sessão, vínculos de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com sandbox aplicado.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, os spawns ACP serão bloqueados para `sessions_spawn({ runtime: "acp" })` e `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução de destino de sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o ID de sessão em formato UUID
   - depois o rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback para a sessão solicitante atual.

Vínculos da conversa atual e vínculos de thread participam
da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que ele faz                                             | Exemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual ou vínculo de thread opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento para a sessão de destino.    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de thread.           | `/acp close`                                                  |
| `/acp status`        | Mostra back-end, modo, estado, opções de runtime, capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.        | `/acp set-mode plan`                                          |
| `/acp set`           | Grava opção genérica de configuração de runtime.          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil de política de aprovação.                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o tempo limite do runtime (segundos).              | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição do modelo de runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.              | `/acp sessions`                                               |
| `/acp doctor`        | Saúde do back-end, capacidades, correções acionáveis.     | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e ativação.  | `/acp install`                                                |

`/acp status` mostra as opções efetivas de runtime, além de identificadores de sessão no nível do runtime e
no nível do back-end. Erros de controle sem suporte aparecem
claramente quando um back-end não tem uma capacidade. `/acp sessions` lê o
armazenamento para a sessão vinculada atual ou solicitante; tokens de destino
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessão do Gateway, incluindo raízes `session.store`
personalizadas por agente.

### Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um definidor genérico. Operações
equivalentes:

| Comando                      | Mapeia para                         | Observações                                                                                                                                                                    |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chave de configuração de runtime `model` | Para Codex ACP, o OpenClaw normaliza `openai-codex/<model>` para o ID de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai-codex/gpt-5.4/high`, para `reasoning_effort`. |
| `/acp set thinking <level>`  | chave de configuração de runtime `thinking` | Para Codex ACP, o OpenClaw envia o `reasoning_effort` correspondente quando o adaptador oferece suporte a um.                                                                  |
| `/acp permissions <profile>` | chave de configuração de runtime `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | chave de configuração de runtime `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | substituição de cwd do runtime      | Atualização direta.                                                                                                                                                           |
| `/acp set <key> <value>`     | genérico                            | `key=cwd` usa o caminho de substituição de cwd.                                                                                                                               |
| `/acp reset-options`         | limpa todas as substituições de runtime | -                                                                                                                                                                              |

## Ambiente acpx, configuração de Plugin e permissões

Para configuração do ambiente acpx (aliases Claude Code / Codex / Gemini CLI),
as pontes MCP plugin-tools e OpenClaw-tools, e modos de
permissão ACP, consulte
[agentes ACP - configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                                                           | Correção                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.                                                       | Instale e habilite o plugin de backend, inclua `acpx` em `plugins.allow` quando essa lista de permissões estiver definida e execute `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                                                                 | Defina `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho automático de mensagens normais de thread desabilitado.                                                               | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas de `sessions_spawn({ runtime: "acp" })` continuam funcionando.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente fora da lista de permissões.                                                                                                | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` informa que o backend não está pronto logo após a inicialização                 | O plugin de backend está ausente, desabilitado, bloqueado por política de permissão/negação, ou seu executável configurado está indisponível.        | Instale/habilite o plugin de backend, execute `/acp doctor` novamente e inspecione o erro de instalação ou política do backend se ele continuar não íntegro.                                           |
| Comando de harness não encontrado                                                   | A CLI do adaptador não está instalada, o plugin externo está ausente ou a busca inicial via `npx` falhou para um adaptador que não é Codex. | Execute `/acp doctor`, instale/preaqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                      |
| Modelo não encontrado pelo harness                                            | O id do modelo é válido para outro provedor/harness, mas não para este destino ACP.                                                | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                            |
| Erro de autenticação do fornecedor vindo do harness                                          | O OpenClaw está íntegro, mas a CLI/provedor de destino não está autenticada.                                                     | Faça login ou forneça a chave de provedor necessária no ambiente do host do Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                                                                                | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa vinculável.                                                            | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP à conversa atual.                                                             | Use `/acp spawn ... --thread ...` onde houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                                                                         | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é dono do destino de vinculação ativo.                                                                           | Refazer o vínculo como dono ou use uma conversa ou thread diferente.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                                                                               | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.                                                              | Use `runtime="subagent"` em sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para o runtime ACP.                                                                         | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe alternância genérica de modelo ACP.                                                        | Use um harness que anuncie `models`/`session/set_model` do ACP, use referências de modelo ACP do Codex ou configure o modelo diretamente no harness se ele tiver sua própria flag de inicialização. |
| Metadados ACP ausentes para sessão vinculada                                      | Metadados de sessão ACP obsoletos/excluídos.                                                                                    | Recrie com `/acp spawn` e então refaça o vínculo/foque a thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia escritas/execução em sessão ACP não interativa.                                                    | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| Sessão ACP falha cedo com pouca saída                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`.                                        | Verifique os logs do gateway por `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação suave, defina `nonInteractivePermissions=deny`.        |
| Sessão ACP fica travada indefinidamente após concluir o trabalho                       | O processo do harness terminou, mas a sessão ACP não informou conclusão.                                                    | Atualize o OpenClaw; a limpeza atual do acpx remove processos obsoletos de wrapper e adaptador pertencentes ao OpenClaw no fechamento e na inicialização do Gateway.                                             |
| O harness vê `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou através do limite ACP.                                                                | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts de conclusão simples.                                                          |

## Relacionados

- [Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Backends de CLI](/pt-BR/gateway/cli-backends)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo de ponte)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

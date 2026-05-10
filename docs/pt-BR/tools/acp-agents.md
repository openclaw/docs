---
read_when:
    - Executando ambientes de codificação por meio do ACP
    - Configuração de sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculação de uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do back-end ACP, da configuração do Plugin ou da entrega de conclusões
    - Executar comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute ambientes de codificação externos (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) por meio do backend ACP
title: agentes ACP
x-i18n:
    generated_at: "2026-05-10T19:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
permitem que o OpenClaw execute ferramentas externas de codificação (por exemplo, Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
ambientes ACPX compatíveis) por meio de um Plugin de backend ACP.

Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de ferramentas externas, não o caminho padrão do Codex.** O
Plugin nativo de servidor de aplicativo do Codex controla os comandos `/codex ...` e o
ambiente de execução embutido padrão `openai/gpt-*` para turnos de agente; ACP controla
comandos `/acp ...` e sessões `sessions_spawn({ runtime: "acp" })`.

Se você quiser que Codex ou Claude Code se conectem como cliente MCP externo
diretamente a conversas de canais existentes do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                      | Use isto                              | Notas                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                                 | `/codex bind`, `/codex threads`       | Caminho nativo de servidor de aplicativo do Codex quando o Plugin `codex` está habilitado; inclui respostas de chat vinculadas, encaminhamento de imagens, controles de modelo/rápido/permissões, parada e orientação. ACP é uma alternativa explícita |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outra ferramenta externa _por meio_ do OpenClaw | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de ambiente de execução                                                   |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente            | [`openclaw acp`](/pt-BR/cli/acp)            | Modo de ponte. IDE/cliente usa ACP com o OpenClaw por stdio/WebSocket                                                                                                                         |
| Reutilizar uma CLI de IA local como modelo alternativo somente de texto                          | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas OpenClaw, sem controles ACP, sem ambiente de execução de ferramenta                                                                                                |

## Isso funciona de imediato?

Sim, após instalar o Plugin oficial de ambiente de execução ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Cópias de trabalho do código-fonte podem usar o Plugin de workspace local `extensions/acpx` após
`pnpm install`. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só informa os agentes sobre a criação via ACP quando o ACP é **realmente
utilizável**: ACP deve estar habilitado, o despacho não pode estar desabilitado, a sessão
atual não pode estar bloqueada pelo sandbox, e um backend de ambiente de execução deve estar
carregado. Se essas condições não forem atendidas, as Skills do Plugin ACP e a orientação
ACP de `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Pontos de atenção da primeira execução">
    - Se `plugins.allow` estiver definido, ele é um inventário restritivo de plugins e **deve** incluir `acpx`; caso contrário, o backend ACP instalado é bloqueado intencionalmente e `/acp doctor` relata a entrada ausente na lista de permissões.
    - O adaptador ACP do Codex é fornecido com o Plugin `acpx` e iniciado localmente quando possível.
    - O Codex ACP é executado com um `CODEX_HOME` isolado; o OpenClaw copia apenas entradas confiáveis de projeto da configuração do Codex no host e confia no workspace ativo, deixando autenticação, notificações e ganchos na configuração do host.
    - Outros adaptadores de ferramentas de destino ainda podem ser buscados sob demanda com `npx` na primeira vez que você os usa.
    - A autenticação do fornecedor ainda precisa existir no host para essa ferramenta.
    - Se o host não tiver npm ou acesso à rede, as buscas de adaptador da primeira execução falham até que caches sejam pré-populados ou o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos de ambiente de execução">
    O ACP inicia um processo real de ferramenta externa. O OpenClaw controla roteamento,
    estado de tarefas em segundo plano, entrega, vínculos e política; a ferramenta
    controla seu login de provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de atribuir o problema ao OpenClaw, verifique:

    - `/acp doctor` relata um backend habilitado e saudável.
    - O id de destino é permitido por `acp.allowedAgents` quando essa lista de permissões está definida.
    - O comando da ferramenta consegue iniciar na máquina do Gateway.
    - A autenticação do provedor está presente para essa ferramenta (`claude`, `codex`, `gemini`, `opencode`, `droid` etc.).
    - O modelo selecionado existe para essa ferramenta - ids de modelos não são portáveis entre ferramentas.
    - O `cwd` solicitado existe e é acessível, ou omita `cwd` e deixe o backend usar seu padrão.
    - O modo de permissões corresponde ao trabalho. Sessões não interativas não conseguem clicar em prompts nativos de permissão, então execuções de codificação com muito uso de escrita/execução geralmente precisam de um perfil de permissões ACPX que consiga prosseguir sem interface interativa.

  </Accordion>
</AccordionGroup>

As ferramentas de Plugin do OpenClaw e as ferramentas integradas do OpenClaw **não** são expostas a
ferramentas ACP por padrão. Habilite as pontes MCP explícitas em
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup) somente quando a ferramenta
deve chamar essas ferramentas diretamente.

## Alvos de ferramentas compatíveis

Com o backend `acpx`, use estes ids de ferramentas como alvos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID da ferramenta | Backend típico                                 | Notas                                                                               |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`         | Adaptador ACP do Claude Code                   | Requer autenticação do Claude Code no host.                                         |
| `codex`          | Adaptador ACP do Codex                         | Alternativa ACP explícita somente quando o `/codex` nativo está indisponível ou ACP é solicitado. |
| `copilot`        | Adaptador ACP do GitHub Copilot                | Requer autenticação da CLI/ambiente de execução do Copilot.                         |
| `cursor`         | ACP da CLI Cursor (`cursor-agent acp`)         | Substitua o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente. |
| `droid`          | CLI Factory Droid                              | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente da ferramenta.   |
| `gemini`         | Adaptador ACP do Gemini CLI                    | Requer autenticação do Gemini CLI ou configuração de chave de API.                  |
| `iflow`          | iFlow CLI                                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kilocode`       | Kilo Code CLI                                  | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kimi`           | Kimi/Moonshot CLI                              | Requer autenticação Kimi/Moonshot no host.                                          |
| `kiro`           | Kiro CLI                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `opencode`       | Adaptador ACP do OpenCode                      | Requer autenticação da CLI/provedor do OpenCode.                                    |
| `openclaw`       | Ponte do Gateway OpenClaw por meio de `openclaw acp` | Permite que uma ferramenta compatível com ACP converse de volta com uma sessão do Gateway OpenClaw. |
| `pi`             | Pi/ambiente de execução embutido do OpenClaw   | Usado para experimentos de ferramentas nativas do OpenClaw.                         |
| `qwen`           | Qwen Code / Qwen CLI                           | Requer autenticação compatível com Qwen no host.                                    |

Apelidos personalizados de agentes acpx podem ser configurados no próprio acpx, mas a política do OpenClaw
ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do despacho.

## Guia operacional

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Criar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou o explícito
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou no tópico vinculado (ou direcione explicitamente
    para a chave da sessão).
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
    `/acp cancel` (turno atual) ou `/acp close` (sessão + vínculos).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalhes do ciclo de vida">
    - A criação inicia ou retoma uma sessão de ambiente de execução ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence ao pai.
    - Sessões ACP pertencentes ao pai são tratadas como trabalho em segundo plano mesmo quando a sessão de ambiente de execução é persistente; a conclusão e a entrega entre superfícies passam pelo notificador da tarefa pai em vez de agir como uma sessão de chat normal voltada ao usuário.
    - A manutenção de tarefas fecha sessões ACP de execução única finalizadas ou órfãs pertencentes ao pai. Sessões ACP persistentes são preservadas enquanto um vínculo de conversa ativo permanece; sessões persistentes obsoletas sem um vínculo ativo são fechadas para que não possam ser retomadas silenciosamente depois que a tarefa proprietária termina ou seu registro de tarefa desaparece.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que o vínculo seja fechado, desfocado, redefinido ou expire.
    - Os comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto normal de prompt para uma ferramenta ACP vinculada.
    - `cancel` aborta o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui o vínculo nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove o vínculo. Uma ferramenta ainda pode manter seu próprio histórico upstream se oferecer suporte a retomada.
    - O Plugin acpx limpa as árvores de processos de wrapper e adaptador pertencentes ao OpenClaw após `close` e remove órfãos ACPX obsoletos pertencentes ao OpenClaw durante a inicialização do Gateway.
    - Processos de trabalho de ambiente de execução ociosos podem ser limpos após `acp.runtime.ttlMinutes`; os metadados de sessão armazenados continuam disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativas do Codex">
    Gatilhos em linguagem natural que devem ser roteados para o **Plugin
    nativo do Codex** quando ele está habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat ao tópico do Codex `<id>`."
    - "Mostre os tópicos do Codex e então vincule este."

    A vinculação nativa de conversas do Codex é o caminho padrão de controle de chat.
    As ferramentas dinâmicas do OpenClaw ainda são executadas pelo OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta um relé de hook
    nativo por turno para que hooks de Plugin possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos `PermissionRequest` do Codex
    pelas aprovações do OpenClaw. Hooks `Stop` do Codex são retransmitidos para
    `before_agent_finalize` do OpenClaw, onde Plugins podem solicitar mais uma
    passagem do modelo antes que o Codex finalize sua resposta. O relé permanece
    deliberadamente conservador: ele não altera argumentos de ferramentas nativas
    do Codex nem reescreve registros de thread do Codex. Use ACP explícito somente
    quando quiser o modelo de runtime/sessão do ACP. O limite de suporte do Codex
    embutido está documentado no
    [contrato de suporte v1 do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Folha de consulta rápida de seleção de modelo / provedor / runtime">
    - `openai-codex/*` - rota legada de modelo OAuth/assinatura do Codex reparada pelo doctor.
    - `openai/*` - runtime embutido nativo do servidor de aplicativo Codex para turnos de agente OpenAI.
    - `/codex ...` - controle nativo de conversa do Codex.
    - `/acp ...` ou `runtime: "acp"` - controle ACP/acpx explícito.

  </Accordion>
  <Accordion title="Gatilhos de linguagem natural para roteamento ACP">
    Gatilhos que devem rotear para o runtime ACP:

    - "Execute isto como uma sessão ACP única do Claude Code e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread e, depois, mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex pelo ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e
    roteia acompanhamentos para essa sessão até o fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou quando o Plugin nativo do Codex
    está indisponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando o ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime ACP
    está carregado. `acp.dispatch.enabled=false` pausa o despacho automático
    de threads ACP, mas não oculta nem bloqueia chamadas explícitas
    `sessions_spawn({ runtime: "acp" })`. Ele aponta para ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um id normal
    de agente de configuração do OpenClaw vindo de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente OpenClaw
    está configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como o id de harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **servidor de aplicativo
nativo do Codex** para vinculação/controle de conversa do Codex quando o Plugin `codex`
estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo, acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                       | `/subagents ...`                   |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio do ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin oficial de runtime `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Mecanismo de runtime/sessão do lado do Claude.

ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefas em segundo plano e vinculação opcional de conversa/thread.

Backends de CLI são runtimes locais de fallback separados, somente texto - veja
[Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback local simples de texto pela CLI bruta?** Use backends de CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** - onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, chat do iMessage).
- **Sessão ACP** - o estado durável de runtime do Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** - uma superfície extra opcional de mensagens criada somente por `--thread ...`.
- **Espaço de trabalho de runtime** - o local no sistema de arquivos (`cwd`, checkout do repositório, espaço de trabalho do backend) onde o harness é executado. Independente da superfície de chat.

### Vínculos de conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à
sessão ACP criada - sem thread filha, mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a
sessão no lugar; `/acp close` remove a vinculação.

Exemplos:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` funciona somente em canais que anunciam vinculação de conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de não suporte. As vinculações persistem entre reinicializações do Gateway.
    - No Discord, `spawnSessions` controla a criação de thread filha para `--thread auto|here` - não `--bind here`.
    - Se você criar para um agente ACP diferente sem `--cwd`, o OpenClaw herda o espaço de trabalho do **agente de destino** por padrão. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) retornam ao padrão do backend; outros erros de acesso (por exemplo, `EACCES`) aparecem como erros de criação.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas - comandos `/acp ...` são tratados pelo OpenClaw mesmo quando texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos está habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a threads">
    Quando vinculações de thread estão habilitadas para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
    - A saída do ACP é entregue de volta à mesma thread.
    - Desfocar/fechar/arquivar/tempo limite por inatividade ou expiração por idade máxima remove a vinculação.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso necessárias para ACP vinculado a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho automático de threads ACP; chamadas explícitas `sessions_spawn({ runtime: "acp" })` ainda funcionam).
    - Criação de sessões de thread do adaptador de canal habilitada (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte a vinculação de thread é específico do adaptador. Se o adaptador de canal
    ativo não oferecer suporte a vinculações de thread, o OpenClaw retorna uma mensagem
    clara de não suporte/indisponibilidade.

  </Accordion>
  <Accordion title="Canais com suporte a threads">
    - Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de DM).
    - Canais de Plugin podem adicionar suporte pela mesma interface de vinculação.

  </Accordion>
</AccordionGroup>

## Vinculações persistentes de canal

Para fluxos de trabalho não efêmeros, configure vinculações ACP persistentes em
entradas `bindings[]` de nível superior.

### Modelo de vinculação

<ParamField path="bindings[].type" type='"acp"'>
  Marca uma vinculação persistente de conversa ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/DM do Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefira ids estáveis do Slack; vinculações de canal também correspondem a respostas dentro das threads desse canal.
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vinculações estáveis de grupo.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  O id do agente OpenClaw proprietário.
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
  Substituição opcional de backend.
</ParamField>

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id de harness, por exemplo, `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de substituição para sessões ACP vinculadas:**

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
- Vinculações temporárias de runtime (por exemplo, criadas por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos de workspace herdados ausentes recorrem ao cwd padrão do backend; falhas de acesso não ausentes aparecem como erros de criação.

## Iniciar sessões ACP

Duas formas de iniciar uma sessão ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    para sessões ACP. Se `agentId` for omitido, o OpenClaw usa
    `acp.defaultAgent` quando configurado. `mode: "session"` exige
    `thread: true` para manter uma conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
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

    Consulte [Comandos slash](/pt-BR/tools/slash-commands).

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
  ID do harness ACP de destino. Recorre a `acp.defaultAgent` se definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita o fluxo de vinculação de thread quando houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw pode usar comportamento persistente por padrão conforme o
  caminho de runtime. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho de runtime solicitado (validado pela política de
  backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino
  quando configurado; caminhos herdados ausentes recorrem aos padrões do backend,
  enquanto erros reais de acesso são retornados.
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
  `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a
  sessão solicitante como eventos de sistema. Respostas aceitas incluem
  `streamLogPath` apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para o histórico completo de retransmissão.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Aborta o turno ACP filho após N segundos. `0` mantém o turno no
  caminho sem timeout do gateway. O mesmo valor é aplicado à execução do Gateway
  e ao runtime ACP para que harnesses travados ou com cota esgotada não
  ocupem a faixa do agente pai indefinidamente.
</ParamField>
<ParamField path="model" type="string">
  Substituição explícita de modelo para a sessão ACP filha. Criações ACP do Codex
  normalizam refs do Codex no OpenClaw, como `openai-codex/gpt-5.4`, para a configuração
  de inicialização ACP do Codex antes de `session/new`; formas slash como
  `openai-codex/gpt-5.4/high` também definem o esforço de raciocínio ACP do Codex.
  Outros harnesses devem anunciar `models` ACP e oferecer suporte a
  `session/set_model`; caso contrário, o OpenClaw/acpx falha claramente em vez de
  recorrer silenciosamente ao padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de pensamento/raciocínio. Para ACP do Codex, `minimal` mapeia para
  esforço baixo, `low`/`medium`/`high`/`xhigh` mapeiam diretamente, e `off`
  omite a substituição de esforço de raciocínio na inicialização.
</ParamField>

## Modos de vinculação de criação e thread

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula a conversa ativa atual no lugar; falha se nenhuma estiver ativa. |
    | `off`  | Não cria uma vinculação de conversa atual.                          |

    Observações:

    - `--bind here` é o caminho mais simples para o operador quando se quer "tornar este canal ou chat apoiado pelo Codex".
    - `--bind here` não cria uma thread filha.
    - `--bind here` só está disponível em canais que expõem suporte a vinculação da conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
    | `here` | Exige uma thread ativa atual; falha se não estiver em uma.                                                  |
    | `off`  | Sem vinculação. A sessão inicia desvinculada.                                                                 |

    Observações:

    - Em superfícies sem vinculação de thread, o comportamento padrão é efetivamente `off`.
    - Criação vinculada a thread exige suporte de política do canal:
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
    Sessões interativas foram feitas para continuar conversando em uma superfície
    de chat visível:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
    - `bindings[].type="acp"` configurados persistentes roteiam conversas correspondentes para a mesma sessão ACP.

    Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta para esse mesmo
    canal/thread/tópico.

    O que o OpenClaw envia ao harness:

    - Acompanhamentos vinculados normais são enviados como texto de prompt, mais anexos somente quando o harness/backend oferece suporte a eles.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do envio ACP.
    - Eventos de conclusão gerados pelo runtime são materializados por destino. Agentes OpenClaw recebem o envelope interno de contexto de runtime do OpenClaw; harnesses ACP externos recebem um prompt simples com o resultado filho e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado para harnesses externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de acionamento visível ao usuário ou o prompt simples de conclusão. Metadados internos de eventos permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat escrito pelo usuário.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sessões ACP de execução única criadas por outra execução de agente são filhas em segundo plano,
    semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - O filho executa em sua própria sessão de harness ACP.
    - Turnos filhos executam na mesma faixa em segundo plano usada por criações de subagente nativas, então um harness ACP lento não bloqueia trabalho não relacionado da sessão principal.
    - Relatórios de conclusão retornam pelo caminho de anúncio de conclusão de tarefa. O OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo a um harness externo, então harnesses não veem marcadores de contexto de runtime exclusivos do OpenClaw.
    - O pai reescreve o resultado filho na voz normal do assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate esse caminho como um chat ponto a ponto entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` pode mirar outra sessão após a criação. Para sessões pares
    normais, o OpenClaw usa um caminho de acompanhamento agente para agente (A2A)
    após injetar a mensagem:

    - Aguarda a resposta da sessão de destino.
    - Opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento.
    - Pede que o destino produza uma mensagem de anúncio.
    - Entrega esse anúncio ao canal ou thread visível.

    Esse caminho A2A é um fallback para envios entre pares em que o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode
    ver e enviar mensagem a um destino ACP, por exemplo sob configurações amplas de
    `tools.sessions.visibility`.

    O OpenClaw pula o acompanhamento A2A somente quando o solicitante é o
    pai de seu próprio filho ACP de execução única pertencente ao pai. Nesse caso,
    executar A2A sobre a conclusão de tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta para o filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` relata
    `delivery.status="skipped"` para esse caso de filho pertencente porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Resume an existing session">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, então retoma com contexto completo do que veio antes.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Transfira uma sessão Codex do seu laptop para o seu telefone - diga ao seu agente para retomar de onde você parou.
    - Continue uma sessão de programação que você iniciou interativamente na CLI, agora sem interface pela sua agente.
    - Retome trabalho que foi interrompido por uma reinicialização do Gateway ou timeout por inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora este campo exclusivo de ACP.
    - `resumeSessionId` é um ID de retomada ACP/harness local ao host, não uma chave de sessão de canal do OpenClaw; o OpenClaw ainda verifica a política de criação ACP e a política do agente de destino antes do envio, enquanto o backend ACP ou harness é responsável pela autorização para carregar esse ID upstream.
    - `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o ID da sessão não for encontrado, a criação falha com um erro claro - sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Após um deploy do gateway, execute uma verificação ponta a ponta ao vivo em vez de
    confiar em testes unitários:

    1. Verifique a versão e o commit do Gateway implantado no host de destino.
    2. Abra uma sessão temporária de ponte ACPX para um agente ativo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e nenhum erro de validador.
    5. Limpe a sessão temporária de ponte.

    Mantenha a validação em `mode: "run"` e ignore `streamTo: "parent"` -
    caminhos vinculados à thread com `mode: "session"` e caminhos de retransmissão de stream são passagens
    de integração mais abrangentes separadas.

  </Accordion>
</AccordionGroup>

## Compatibilidade com ambiente isolado

As sessões ACP atualmente são executadas no runtime do host, **não** dentro do
ambiente isolado do OpenClaw.

<Warning>
**Limite de segurança:**

- O harness externo pode ler/gravar de acordo com suas próprias permissões de CLI e o `cwd` selecionado.
- A política de ambiente isolado do OpenClaw **não** envolve a execução do harness ACP.
- O OpenClaw ainda impõe gates de recursos ACP, agentes permitidos, propriedade de sessão, vinculações de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com ambiente isolado imposto.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em ambiente isolado, spawns ACP serão bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução do alvo da sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de alvo explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o ID de sessão em formato UUID
   - depois o rótulo
2. Vinculação da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback da sessão solicitante atual.

Vinculações da conversa atual e vinculações de thread participam
da etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que faz                                                 | Exemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vinculação atual ou de thread opcional.  | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.              | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                              |
| `/acp set-mode`      | Define o modo de runtime da sessão de destino.            | `/acp set-mode plan`                                          |
| `/acp set`           | Grava opção genérica de configuração de runtime.          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define substituição do diretório de trabalho do runtime.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o tempo limite do runtime (segundos).              | `/acp timeout 120`                                            |
| `/acp model`         | Define substituição do modelo de runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.              | `/acp sessions`                                               |
| `/acp doctor`        | Saúde do backend, capacidades, correções acionáveis.      | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                             |

`/acp status` mostra as opções efetivas de runtime, além de identificadores de sessão em nível de runtime e
em nível de backend. Erros de controle sem suporte aparecem
claramente quando um backend não possui uma capacidade. `/acp sessions` lê o
armazenamento da sessão atualmente vinculada ou solicitante; tokens de alvo
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessões do Gateway, incluindo raízes `session.store`
personalizadas por agente.

### Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico. Operações
equivalentes:

| Comando                      | Mapeia para                          | Observações                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chave de configuração de runtime `model` | Para Codex ACP, o OpenClaw normaliza `openai-codex/<model>` para o ID de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai-codex/gpt-5.4/high`, para `reasoning_effort`.       |
| `/acp set thinking <level>`  | opção canônica `thinking`            | O OpenClaw envia o equivalente anunciado pelo backend quando presente, preferindo `thinking`, depois `effort`, `reasoning_effort` ou `thought_level`. Para Codex ACP, o adaptador mapeia valores para `reasoning_effort`. |
| `/acp permissions <profile>` | opção canônica `permissionProfile`   | O OpenClaw envia o equivalente anunciado pelo backend quando presente, como `approval_policy`, `permission_profile`, `permissions` ou `permission_mode`.                                                 |
| `/acp timeout <seconds>`     | opção canônica `timeoutSeconds`      | O OpenClaw envia o equivalente anunciado pelo backend quando presente, como `timeout` ou `timeout_seconds`.                                                                                              |
| `/acp cwd <path>`            | substituição de cwd do runtime       | Atualização direta.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa o caminho de substituição de cwd.                                                                                                                                                           |
| `/acp reset-options`         | limpa todas as substituições de runtime | -                                                                                                                                                                                                      |

## Harness acpx, configuração de Plugin e permissões

Para configuração do harness acpx (aliases Claude Code / Codex / Gemini CLI),
as pontes MCP plugin-tools e OpenClaw-tools, e modos de permissão ACP,
consulte
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                                                           | Correção                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.                                                | Instale e habilite o plugin de backend, inclua `acpx` em `plugins.allow` quando essa lista de permissões estiver definida e execute `/acp doctor`.                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                                                            | Defina `acp.enabled=true`.                                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho automático a partir de mensagens normais de thread desabilitado.                                                | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas `sessions_spawn({ runtime: "acp" })` ainda funcionam.                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na lista de permissões.                                                                                  | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                   |
| `/acp doctor` reports backend not ready right after startup                 | O plugin de backend está ausente, desabilitado, bloqueado por política de permissão/negação, ou seu executável configurado está indisponível. | Instale/habilite o plugin de backend, execute `/acp doctor` novamente e inspecione o erro de instalação do backend ou de política se ele continuar sem integridade.          |
| Harness command not found                                                   | A CLI do adaptador não está instalada, o plugin externo está ausente, ou a busca `npx` da primeira execução falhou para um adaptador que não é Codex. | Execute `/acp doctor`, instale/pré-aqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                |
| Model-not-found from the harness                                            | O id do modelo é válido para outro provedor/harness, mas não para este destino ACP.                                      | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                               |
| Vendor auth error from the harness                                          | O OpenClaw está íntegro, mas a CLI/provedor de destino não está autenticado.                                             | Faça login ou forneça a chave de provedor necessária no ambiente do host do Gateway.                                                                                         |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                                                                       | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa vinculável.                                                                   | Vá para o chat/canal de destino e tente novamente, ou use um spawn sem vínculo.                                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP da conversa atual.                                                      | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                                                                     | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é proprietário do destino de vinculação ativo.                                                            | Revincule como proprietário ou use outra conversa ou thread.                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                                                                 | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no lado do host; a sessão solicitante está em sandbox.                                                | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para o runtime ACP.                                                                       | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                    |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe troca genérica de modelo ACP.                                                            | Use um harness que anuncie ACP `models`/`session/set_model`, use refs de modelo ACP do Codex, ou configure o modelo diretamente no harness se ele tiver sua própria flag de inicialização. |
| Missing ACP metadata for bound session                                      | Metadados da sessão ACP obsoletos/excluídos.                                                                            | Recrie com `/acp spawn` e então revincule/focalize a thread.                                                                                                                 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/execução em sessão ACP não interativa.                                              | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`.                                   | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não relatou conclusão.                                                 | Atualize o OpenClaw; a limpeza atual do acpx remove processos obsoletos de wrapper e adaptador pertencentes ao OpenClaw no fechamento e na inicialização do Gateway.        |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou através do limite ACP.                                                                 | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts de conclusão simples.                                          |

## Relacionados

- [Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Backends de CLI](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

---
read_when:
    - Executando harnesses de codificação pelo ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da fiação do plugin ou da entrega de conclusão
    - Operando comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute harnesses de codificação externos (Claude Code, Cursor, Gemini CLI, ACP explícito do Codex, ACP do OpenClaw, OpenCode) por meio do backend ACP
title: agentes ACP
x-i18n:
    generated_at: "2026-06-30T13:55:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessões
permitem que o OpenClaw execute harnesses de codificação externos (por exemplo Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e outros
harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**ACP é o caminho de harness externo, não o caminho padrão do Codex.** O
plugin nativo do servidor de app Codex é responsável pelos controles `/codex ...` e pelo runtime
embarcado padrão `openai/gpt-*` para turnos de agente; ACP é responsável pelos
controles `/acp ...` e pelas sessões `sessions_spawn({ runtime: "acp" })`.

Se você quiser que Codex ou Claude Code se conecte como um cliente MCP externo
diretamente a conversas de canais existentes do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez de ACP.
</Note>

## Qual página eu quero?

| Você quer…                                                                                      | Use isto                              | Observações                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar Codex na conversa atual                                                   | `/codex bind`, `/codex threads`       | Caminho nativo do servidor de app Codex quando o plugin `codex` está habilitado; inclui respostas de chat vinculadas, encaminhamento de imagens, modelo/rápido/permissões, parar e controles de direção. ACP é um fallback explícito |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro harness externo _por meio_ do OpenClaw | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime                                                               |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente            | [`openclaw acp`](/pt-BR/cli/acp)            | Modo bridge. IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                                                                                                         |
| Reutilizar uma CLI de IA local como modelo fallback somente de texto                            | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                                                                                                            |

## Isso funciona sem configuração extra?

Sim, depois de instalar o plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts do código-fonte podem usar o plugin local do workspace `extensions/acpx` depois de
`pnpm install`. Execute `/acp doctor` para uma verificação de prontidão.

O OpenClaw só ensina agentes sobre criação ACP quando o ACP está **realmente
utilizável**: o ACP deve estar habilitado, o dispatch não pode estar desabilitado, a sessão
atual não pode estar bloqueada por sandbox e um backend de runtime deve estar
carregado. Se essas condições não forem atendidas, as Skills do plugin ACP e a
orientação de ACP em `sessions_spawn` permanecem ocultas para que o agente não sugira
um backend indisponível.

<AccordionGroup>
  <Accordion title="Armadilhas da primeira execução">
    - Se `plugins.allow` estiver definido, ele é um inventário restritivo de plugins e **deve** incluir `acpx`; caso contrário, o backend ACP instalado será bloqueado intencionalmente e `/acp doctor` reportará a entrada ausente na lista de permissões.
    - O adaptador ACP do Codex é preparado com o plugin `acpx` e iniciado localmente quando possível.
    - Codex ACP é executado com um `CODEX_HOME` isolado; o OpenClaw copia entradas de projeto confiáveis e configuração segura de roteamento de modelo/provedor da configuração do Codex no host, enquanto autenticação, notificações e hooks permanecem na configuração do host.
    - Outros adaptadores de harness de destino ainda podem ser buscados sob demanda com `npx` na primeira vez que você os usa.
    - A autenticação do fornecedor ainda precisa existir no host para esse harness.
    - Se o host não tiver npm ou acesso à rede, as buscas de adaptador na primeira execução falham até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos de runtime">
    O ACP inicia um processo real de harness externo. O OpenClaw é responsável por roteamento,
    estado de tarefa em segundo plano, entrega, vínculos e política; o harness
    é responsável por seu login de provedor, catálogo de modelos, comportamento do sistema de arquivos e
    ferramentas nativas.

    Antes de culpar o OpenClaw, verifique:

    - `/acp doctor` reporta um backend habilitado e saudável.
    - O id de destino é permitido por `acp.allowedAgents` quando essa lista de permissões está definida.
    - O comando do harness consegue iniciar no host Gateway.
    - A autenticação do provedor está presente para esse harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, etc.).
    - O modelo selecionado existe para esse harness - ids de modelo não são portáveis entre harnesses.
    - O `cwd` solicitado existe e está acessível, ou omita `cwd` e deixe o backend usar seu padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não conseguem clicar em prompts nativos de permissão, portanto execuções de codificação com muita escrita/execução geralmente precisam de um perfil de permissão ACPX que possa prosseguir sem interação.

  </Accordion>
</AccordionGroup>

Ferramentas de plugin do OpenClaw e ferramentas integradas do OpenClaw **não** são expostas a
harnesses ACP por padrão. Habilite as bridges MCP explícitas em
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup) somente quando o harness
deve chamar essas ferramentas diretamente.

## Destinos de harness compatíveis

Com o backend `acpx`, use estes ids de harness como destinos de `/acp spawn <id>`
ou `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id do harness | Backend típico                                  | Observações                                                                         |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`      | Adaptador ACP do Claude Code                    | Requer autenticação do Claude Code no host.                                         |
| `codex`       | Adaptador ACP do Codex                          | Fallback ACP explícito somente quando `/codex` nativo está indisponível ou ACP é solicitado. |
| `copilot`     | Adaptador ACP do GitHub Copilot                 | Requer autenticação da CLI/runtime do Copilot.                                      |
| `cursor`      | ACP da Cursor CLI (`cursor-agent acp`)          | Substitua o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente. |
| `droid`       | Factory Droid CLI                               | Requer autenticação Factory/Droid ou `FACTORY_API_KEY` no ambiente do harness.      |
| `gemini`      | Adaptador ACP do Gemini CLI                     | Requer autenticação do Gemini CLI ou configuração de chave de API.                  |
| `iflow`       | iFlow CLI                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kilocode`    | Kilo Code CLI                                   | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `kimi`        | Kimi/Moonshot CLI                               | Requer autenticação Kimi/Moonshot no host.                                          |
| `kiro`        | Kiro CLI                                        | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.    |
| `opencode`    | Adaptador ACP do OpenCode                       | Requer autenticação da CLI/provedor do OpenCode.                                    |
| `openclaw`    | Bridge do OpenClaw Gateway por meio de `openclaw acp` | Permite que um harness compatível com ACP fale de volta com uma sessão do OpenClaw Gateway. |
| `qwen`        | Qwen Code / Qwen CLI                            | Requer autenticação compatível com Qwen no host.                                    |

Aliases personalizados de agente acpx podem ser configurados no próprio acpx, mas a política do OpenClaw
ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do dispatch.

## Runbook do operador

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Criar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, ou explicitamente
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou thread vinculada (ou direcione a chave da sessão
    explicitamente).
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
    - Criar inicia ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence ao pai.
    - Sessões ACP pertencentes ao pai são tratadas como trabalho em segundo plano mesmo quando a sessão de runtime é persistente; a conclusão e a entrega entre superfícies passam pelo notificador da tarefa pai, em vez de agir como uma sessão de chat normal voltada ao usuário.
    - A manutenção de tarefas fecha sessões ACP one-shot pertencentes ao pai que estejam terminais ou órfãs. Sessões ACP persistentes são preservadas enquanto permanecer um vínculo de conversa ativo; sessões persistentes obsoletas sem vínculo ativo são fechadas para que não possam ser retomadas silenciosamente depois que a tarefa proprietária termina ou seu registro de tarefa desaparece.
    - Mensagens de acompanhamento vinculadas vão diretamente para a sessão ACP até que o vínculo seja fechado, desfocado, redefinido ou expire.
    - Comandos Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto de prompt normal para um harness ACP vinculado.
    - `cancel` aborta o turno ativo quando o backend oferece suporte a cancelamento; ele não exclui o vínculo nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove o vínculo. Um harness ainda pode manter seu próprio histórico upstream se oferecer suporte a retomada.
    - O plugin acpx limpa árvores de processos de wrapper e adaptador pertencentes ao OpenClaw após `close` e coleta órfãos ACPX obsoletos pertencentes ao OpenClaw durante a inicialização do Gateway.
    - Workers de runtime ociosos ficam elegíveis para limpeza após `acp.runtime.ttlMinutes`; metadados de sessão armazenados permanecem disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem ser roteados para o **plugin nativo do Codex**
    quando ele está habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread Codex `<id>`."
    - "Mostre as threads do Codex e então vincule esta."

    A vinculação de conversa nativa do Codex é o caminho padrão de controle por chat.
    As ferramentas dinâmicas do OpenClaw ainda são executadas por meio do OpenClaw, enquanto
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta um relay de hook nativo
    por turno para que hooks de Plugin possam bloquear `before_tool_call`, observar
    `after_tool_call` e rotear eventos `PermissionRequest` do Codex
    pelas aprovações do OpenClaw. Hooks `Stop` do Codex são repassados para
    `before_agent_finalize` do OpenClaw, onde Plugins podem solicitar mais uma
    passagem do modelo antes de o Codex finalizar sua resposta. O relay permanece
    deliberadamente conservador: ele não altera argumentos de ferramentas nativas
    do Codex nem reescreve registros de thread do Codex. Use ACP explícito somente
    quando quiser o modelo de runtime/sessão ACP. O limite de suporte do Codex
    incorporado está documentado no
    [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Resumo de seleção de modelo / provedor / runtime">
    - refs legadas de modelo Codex - rota legada de modelo OAuth/assinatura do Codex reparada pelo doctor.
    - `openai/*` - runtime incorporado nativo de app-server do Codex para turnos de agente OpenAI.
    - `/codex ...` - controle de conversa nativo do Codex.
    - `/acp ...` ou `runtime: "acp"` - controle ACP/acpx explícito.

  </Accordion>
  <Accordion title="Gatilhos em linguagem natural para roteamento por ACP">
    Gatilhos que devem rotear para o runtime ACP:

    - "Execute isto como uma sessão ACP Claude Code avulsa e resuma o resultado."
    - "Use Gemini CLI para esta tarefa em uma thread, depois mantenha os acompanhamentos nessa mesma thread."
    - "Execute Codex por meio de ACP em uma thread em segundo plano."

    O OpenClaw escolhe `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e
    roteia acompanhamentos para essa sessão até o fechamento/expiração. O Codex só
    segue esse caminho quando ACP/acpx é explícito ou o Plugin nativo do Codex
    está indisponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` é anunciado somente quando ACP
    está habilitado, o solicitante não está em sandbox e um backend de runtime
    ACP está carregado. `acp.dispatch.enabled=false` pausa o despacho automático
    de threads ACP, mas não oculta nem bloqueia chamadas explícitas
    `sessions_spawn({ runtime: "acp" })`. Ele direciona ids de harness ACP como `codex`,
    `claude`, `droid`, `gemini` ou `opencode`. Não passe um id normal de agente
    de configuração do OpenClaw de `agents_list`, a menos que essa entrada esteja
    explicitamente configurada com `agents.list[].runtime.type="acp"`;
    caso contrário, use o runtime padrão de subagente. Quando um agente OpenClaw
    é configurado com `runtime.type="acp"`, o OpenClaw usa
    `runtime.acp.agent` como o id de harness subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use **app-server nativo do Codex**
para vinculação/controle de conversa do Codex quando o Plugin `codex`
estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave da sessão | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principais | `/acp ...`                            | `/subagents ...`                   |
| Ferramenta de spawn | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como ACP executa Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw.
2. Plugin oficial de runtime `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Maquinário de runtime/sessão no lado do Claude.

ACP Claude é uma **sessão de harness** com controles ACP, retomada de sessão,
rastreamento de tarefas em segundo plano e vinculação opcional de conversa/thread.

Backends CLI são runtimes locais de fallback separados, somente texto - veja
[Backends CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness?** Use ACP.
- **Quer fallback simples de texto local pela CLI bruta?** Use backends CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** - onde as pessoas continuam conversando (canal Discord, tópico Telegram, chat iMessage).
- **Sessão ACP** - o estado durável de runtime Codex/Claude/Gemini para o qual o OpenClaw roteia.
- **Thread/tópico filho** - uma superfície de mensagens extra opcional criada somente por `--thread ...`.
- **Workspace de runtime** - o local do sistema de arquivos (`cwd`, checkout do repo, workspace do backend) onde o harness executa. Independente da superfície de chat.

### Vinculações da conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à
sessão ACP criada - sem thread filha, mesma superfície de chat. O OpenClaw continua
dono do transporte, autenticação, segurança e entrega. Mensagens de acompanhamento nessa
conversa são roteadas para a mesma sessão; `/new` e `/reset` redefinem a
sessão no local; `/acp close` remove a vinculação.

Exemplos:

```text
/codex bind                                              # vinculação nativa do Codex, rotear mensagens futuras aqui
/codex model gpt-5.4                                     # ajustar a thread nativa vinculada do Codex
/codex stop                                              # controlar o turno nativo ativo do Codex
/acp spawn codex --bind here                             # fallback ACP explícito para Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular lá
/acp spawn codex --bind here --cwd /workspace/repo       # mesma vinculação de chat, Codex executa em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` funciona apenas em canais que anunciam vinculação da conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara de sem suporte. Vinculações persistem após reinicializações do Gateway.
    - No Discord, `spawnSessions` controla a criação de threads filhas para `--thread auto|here` - não `--bind here`.
    - Se você criar uma sessão para um agente ACP diferente sem `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) fazem fallback para o padrão do backend; outros erros de acesso (por exemplo, `EACCES`) aparecem como erros de spawn.
    - Comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas - comandos `/acp ...` são tratados pelo OpenClaw mesmo quando texto normal de acompanhamento é roteado para a sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o tratamento de comandos está habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a thread">
    Quando vinculações de thread estão habilitadas para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
    - A saída do ACP é entregue de volta à mesma thread.
    - Desfocar/fechar/arquivar/tempo limite de inatividade ou expiração por idade máxima remove a vinculação.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness ACP.

    Flags de recurso necessárias para ACP vinculado a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho automático de threads ACP; chamadas explícitas `sessions_spawn({ runtime: "acp" })` ainda funcionam).
    - Spawns de sessão de thread do adaptador de canal habilitados (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte a vinculação de thread é específico do adaptador. Se o adaptador
    de canal ativo não oferecer suporte a vinculações de thread, o OpenClaw retorna uma
    mensagem clara de sem suporte/indisponível.

  </Accordion>
  <Accordion title="Canais com suporte a thread">
    - Qualquer adaptador de canal que exponha capacidade de vinculação de sessão/thread.
    - Suporte integrado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de DM).
    - Canais de Plugin podem adicionar suporte por meio da mesma interface de vinculação.

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
- **DM/grupo do WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Use números E.164 como `+15555550123` para chats diretos e JIDs de grupo do WhatsApp como `120363424282127706@g.us` para grupos.
- **DM/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vinculações estáveis de grupo.

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
- `agents.list[].runtime.acp.agent` (id de harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de sobrescrita para sessões ACP vinculadas:**

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

- O OpenClaw garante que a sessão ACP configurada exista após a admissão específica do canal e antes do uso.
- Mensagens nesse canal, tópico ou chat são roteadas para a sessão ACP configurada.
- Bindings ACP configurados são donos da rota da própria sessão. A distribuição por broadcast do canal não substitui a sessão ACP configurada para um binding correspondente.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no lugar.
- Bindings temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para spawns ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos de workspace herdados ausentes voltam para o cwd padrão do backend; falhas de acesso não ausentes aparecem como erros de spawn.

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
    `runtime` usa `subagent` por padrão, então defina `runtime: "acp"` explicitamente
    para sessões ACP. Se `agentId` for omitido, o OpenClaw usa
    `acp.defaultAgent` quando configurado. `mode: "session"` exige
    `thread: true` para manter uma conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="De comando /acp">
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
  ID do harness ACP de destino. Volta para `acp.defaultAgent` se definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita fluxo de binding de thread quando houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é de execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw pode usar comportamento persistente por padrão conforme o
  caminho de runtime. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho de runtime solicitado (validado pela política do backend/runtime).
  Se omitido, o spawn ACP herda o workspace do agente de destino quando
  configurado; caminhos herdados ausentes voltam para os padrões do backend,
  enquanto erros reais de acesso são retornados.
</ParamField>
<ParamField path="label" type="string">
  Rótulo visível ao operador usado no texto da sessão/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz
  o histórico da conversa via `session/load`. Exige `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a
  sessão solicitante como eventos de sistema. Respostas aceitas incluem
  `streamLogPath` apontando para um log JSONL com escopo de sessão
  (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para obter o histórico completo de retransmissão.
  Fluxos de progresso do pai mostram comentários do assistente e progresso de status ACP por
  padrão, a menos que `streaming.progress.commentary=false`. O Discord também define por padrão
  prévias do pai para o modo de progresso quando nenhum modo de stream está configurado. O progresso de
  status ainda respeita `acp.stream.tagVisibility`, então tags como `plan`
  permanecem ocultas a menos que sejam habilitadas explicitamente.
</ParamField>

Execuções ACP de `sessions_spawn` usam `agents.defaults.subagents.runTimeoutSeconds` para
o limite padrão de turno filho. A ferramenta não aceita sobrescritas de timeout por chamada.

<ParamField path="model" type="string">
  Sobrescrita explícita de modelo para a sessão ACP filha. Spawns ACP do Codex
  normalizam refs da OpenAI como `openai/gpt-5.4` para a configuração de inicialização do Codex ACP
  antes de `session/new`; formas slash como `openai/gpt-5.4/high`
  também definem o esforço de raciocínio do Codex ACP.
  Quando omitido, `sessions_spawn({ runtime: "acp" })` usa padrões existentes
  de modelo de subagente (`agents.defaults.subagents.model` ou
  `agents.list[].subagents.model`) quando configurados; caso contrário, deixa o
  harness ACP usar o próprio modelo padrão.
  Outros harnesses devem anunciar ACP `models` e oferecer suporte a
  `session/set_model`; caso contrário, OpenClaw/acpx falha claramente em vez de
  voltar silenciosamente para o padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Esforço explícito de pensamento/raciocínio. Para Codex ACP, `minimal` mapeia para
  esforço baixo, `low`/`medium`/`high`/`xhigh` mapeiam diretamente, e `off`
  omite a sobrescrita de inicialização de esforço de raciocínio.
  Quando omitido, spawns ACP usam os padrões existentes de thinking de subagente e
  `agents.defaults.models["provider/model"].params.thinking` por modelo
  para o modelo selecionado.
</ParamField>

## Modos de spawn com binding e thread

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
    | `off`  | Não cria uma vinculação de conversa atual.                          |

    Observações:

    - `--bind here` é o caminho de operador mais simples para "tornar este canal ou chat apoiado por Codex."
    - `--bind here` não cria uma thread filha.
    - `--bind here` só está disponível em canais que expõem suporte à vinculação de conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
    | `here` | Exige a thread ativa atual; falha se não estiver em uma.                                                  |
    | `off`  | Sem vinculação. A sessão começa desvinculada.                                                                 |

    Observações:

    - Em superfícies de vinculação sem threads, o comportamento padrão é efetivamente `off`.
    - A geração vinculada a thread exige suporte da política do canal:
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
    Sessões interativas são destinadas a manter a conversa em uma superfície
    de chat visível:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula uma thread/tópico do canal à sessão ACP.
    - `bindings[].type="acp"` configuradas persistentes roteiam conversas correspondentes para a mesma sessão ACP.

    Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a
    sessão ACP, e a saída ACP é entregue de volta ao mesmo
    canal/thread/tópico.

    O que o OpenClaw envia ao harness:

    - Acompanhamentos vinculados normais são enviados como texto de prompt, mais anexos somente quando o harness/backend oferece suporte a eles.
    - Comandos de gerenciamento `/acp` e comandos locais do Gateway são interceptados antes do envio ACP.
    - Eventos de conclusão gerados pelo runtime são materializados por destino. Agentes OpenClaw recebem o envelope interno de contexto de runtime do OpenClaw; harnesses ACP externos recebem um prompt simples com o resultado filho e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado para harnesses externos nem persistido como texto de transcrição de usuário ACP.
    - Entradas de transcrição ACP usam o texto de acionamento visível ao usuário ou o prompt simples de conclusão. Metadados de evento internos permanecem estruturados no OpenClaw quando possível e não são tratados como conteúdo de chat de autoria do usuário.

  </Accordion>
  <Accordion title="Sessões ACP one-shot pertencentes ao pai">
    Sessões ACP one-shot geradas por outra execução de agente são filhas em segundo plano,
    semelhantes a subagentes:

    - O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - O filho executa em sua própria sessão de harness ACP.
    - Turnos do filho executam na mesma faixa em segundo plano usada por gerações de subagentes nativos, então um harness ACP lento não bloqueia trabalho não relacionado da sessão principal.
    - Relatórios de conclusão retornam pelo caminho de anúncio de conclusão de tarefa. O OpenClaw converte metadados internos de conclusão em um prompt ACP simples antes de enviá-lo a um harness externo, para que harnesses não vejam marcadores de contexto de runtime exclusivos do OpenClaw.
    - O pai reescreve o resultado do filho em voz normal de assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate este caminho como um chat ponto a ponto entre pai
    e filho. O filho já tem um canal de conclusão de volta para o
    pai.

  </Accordion>
  <Accordion title="sessions_send e entrega A2A">
    `sessions_send` pode direcionar outra sessão após a geração. Para sessões
    pares normais, o OpenClaw usa um caminho de acompanhamento agente-para-agente (A2A)
    depois de injetar a mensagem:

    - Aguarda a resposta da sessão de destino.
    - Opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento.
    - Solicita que o destino produza uma mensagem de anúncio.
    - Entrega esse anúncio ao canal ou thread visível.

    Esse caminho A2A é um fallback para envios entre pares quando o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada pode
    ver e enviar mensagem a um destino ACP, por exemplo, sob configurações amplas de
    `tools.sessions.visibility`.

    OpenClaw pula o acompanhamento A2A somente quando o solicitante é o
    pai de seu próprio filho ACP de uso único pertencente ao pai. Nesse caso,
    executar A2A sobre a conclusão da tarefa pode acordar o pai com o
    resultado do filho, encaminhar a resposta do pai de volta ao filho e
    criar um loop de eco pai/filho. O resultado de `sessions_send` informa
    `delivery.status="skipped"` para esse caso de filho pertencente porque o
    caminho de conclusão já é responsável pelo resultado.

  </Accordion>
  <Accordion title="Retomar uma sessão existente">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz seu histórico de conversa via
    `session/load`, então retoma com o contexto completo do que veio antes.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Passe uma sessão Codex do seu laptop para o seu telefone - diga ao seu agente para retomar de onde você parou.
    - Continue uma sessão de codificação que você iniciou interativamente na CLI, agora de forma headless por meio do seu agente.
    - Retome um trabalho que foi interrompido por uma reinicialização do gateway ou tempo limite de inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora esse campo exclusivo de ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora esse campo exclusivo de ACP.
    - `resumeSessionId` é um id de retomada ACP/harness local ao host, não uma chave de sessão de canal do OpenClaw; o OpenClaw ainda verifica a política de criação ACP e a política do agente de destino antes do despacho, enquanto o backend ou harness ACP controla a autorização para carregar esse id upstream.
    - `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão do OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o id de sessão não for encontrado, a criação falha com um erro claro - sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Teste de fumaça pós-deploy">
    Depois de um deploy do Gateway, execute uma verificação ponta a ponta
    ao vivo em vez de confiar em testes unitários:

    1. Verifique a versão e o commit do Gateway implantado no host de destino.
    2. Abra uma sessão temporária de ponte ACPX para um agente ao vivo.
    3. Peça a esse agente para chamar `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, um `childSessionKey` real e nenhum erro de validador.
    5. Limpe a sessão temporária de ponte.

    Mantenha a porta em `mode: "run"` e pule `streamTo: "parent"` -
    `mode: "session"` vinculado a thread e caminhos de retransmissão de stream são
    passes de integração mais ricos separados.

  </Accordion>
</AccordionGroup>

## Compatibilidade de sandbox

Sessões ACP atualmente são executadas no runtime do host, **não** dentro do
sandbox do OpenClaw.

<Warning>
**Limite de segurança:**

- O harness externo pode ler/gravar de acordo com suas próprias permissões de CLI e o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do harness ACP.
- O OpenClaw ainda aplica feature gates ACP, agentes permitidos, propriedade de sessão, vínculos de canal e política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com sandbox aplicado.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP serão bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução de destino de sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o id de sessão em formato UUID
   - depois o rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback para a sessão solicitante atual.

Vínculos da conversa atual e vínculos de thread participam ambos na
etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro
(`Unable to resolve session target: ...`).

## Controles ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual ou de thread opcional.     | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela turno em andamento para a sessão de destino.      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de orientação para sessão em execução.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha sessão e desvincula destinos de thread.             | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, recursos. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.        | `/acp set-mode plan`                                          |
| `/acp set`           | Grava opção genérica de configuração de runtime.          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define substituição do diretório de trabalho do runtime.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define perfil de política de aprovação.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Define tempo limite do runtime (segundos).                | `/acp timeout 120`                                            |
| `/acp model`         | Define substituição de modelo do runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.      | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.              | `/acp sessions`                                               |
| `/acp doctor`        | Saúde do backend, recursos, correções acionáveis.         | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                                |

Controles de runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` e `reset-options`) exigem
identidade de proprietário de canais externos e `operator.admin` de clientes
internos do Gateway. Remetentes autorizados que não são proprietários ainda podem usar `sessions`, `doctor`,
`install` e `help`.

`/acp status` mostra as opções de runtime efetivas, além de identificadores de sessão
em nível de runtime e de backend. Erros de controle sem suporte aparecem
claramente quando um backend não tem um recurso. `/acp sessions` lê o
armazenamento para a sessão vinculada atual ou solicitante; tokens de destino
(`session-key`, `session-id` ou `session-label`) são resolvidos por meio da
descoberta de sessão do Gateway, incluindo raízes `session.store`
personalizadas por agente.

### Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico. Operações
equivalentes:

| Comando                      | Mapeia para                          | Observações                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chave de configuração de runtime `model` | Para Codex ACP, o OpenClaw normaliza `openai/<model>` para o id de modelo do adaptador e mapeia sufixos de raciocínio com barra, como `openai/gpt-5.4/high`, para `reasoning_effort`.                    |
| `/acp set thinking <level>`  | opção canônica `thinking`            | O OpenClaw envia o equivalente anunciado pelo backend quando presente, preferindo `thinking`, depois `effort`, `reasoning_effort` ou `thought_level`. Para Codex ACP, o adaptador mapeia valores para `reasoning_effort`. |
| `/acp permissions <profile>` | opção canônica `permissionProfile`   | O OpenClaw envia o equivalente anunciado pelo backend quando presente, como `approval_policy`, `permission_profile`, `permissions` ou `permission_mode`.                                                   |
| `/acp timeout <seconds>`     | opção canônica `timeoutSeconds`      | O OpenClaw envia o equivalente anunciado pelo backend quando presente, como `timeout` ou `timeout_seconds`.                                                                                               |
| `/acp cwd <path>`            | substituição de cwd do runtime       | Atualização direta.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | genérico                             | `key=cwd` usa o caminho de substituição de cwd.                                                                                                                                                           |
| `/acp reset-options`         | limpa todas as substituições de runtime | -                                                                                                                                                                                                         |

## Harness acpx, configuração de Plugin e permissões

Para configuração do harness acpx (aliases Claude Code / Codex / Gemini CLI),
as pontes MCP plugin-tools e OpenClaw-tools, e modos de permissão ACP, consulte
[Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                                                           | Correção                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.                                                       | Instale e habilite o Plugin de backend, inclua `acpx` em `plugins.allow` quando essa allowlist estiver definida e, em seguida, execute `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                                                                 | Defina `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Despacho automático a partir de mensagens normais de thread desabilitado.                                                               | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas a `sessions_spawn({ runtime: "acp" })` ainda funcionam.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na allowlist.                                                                                                | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin de backend ausente, desabilitado, bloqueado por política de permissão/negação ou seu executável configurado está indisponível.        | Instale/habilite o Plugin de backend, execute `/acp doctor` novamente e inspecione o erro de instalação ou política do backend se ele continuar não íntegro.                                           |
| Comando do harness não encontrado                                                   | A CLI do adaptador não está instalada, o Plugin externo está ausente ou a busca de primeira execução com `npx` falhou para um adaptador que não é Codex. | Execute `/acp doctor`, instale/preaqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                      |
| Modelo não encontrado pelo harness                                            | O id do modelo é válido para outro provedor/harness, mas não para este destino ACP.                                                | Use um modelo listado por esse harness, configure o modelo no harness ou omita a sobrescrita.                                                                            |
| Erro de autenticação do fornecedor pelo harness                                          | OpenClaw está íntegro, mas a CLI/provedor de destino não está autenticado.                                                     | Faça login ou forneça a chave de provedor necessária no ambiente do host do Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                                                                                | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usado sem uma conversa ativa que possa ser vinculada.                                                            | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vinculação ACP para a conversa atual.                                                             | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usado fora de um contexto de thread.                                                                         | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é proprietário do destino de vinculação ativo.                                                                           | Faça o rebind como proprietário ou use outra conversa ou thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vinculação de thread.                                                                               | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no lado do host; a sessão solicitante está em sandbox.                                                              | Use `runtime="subagent"` em sessões em sandbox ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` solicitado para o runtime ACP.                                                                         | Use `runtime="subagent"` para exigir sandboxing ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | O harness de destino não expõe troca genérica de modelo ACP.                                                        | Use um harness que anuncie `models`/`session/set_model` de ACP, use refs de modelo ACP do Codex ou configure o modelo diretamente no harness se ele tiver sua própria flag de inicialização. |
| Metadados ACP ausentes para sessão vinculada                                      | Metadados de sessão ACP obsoletos/excluídos.                                                                                    | Recrie com `/acp spawn` e então faça rebind/foque a thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia escritas/exec em uma sessão ACP não interativa.                                                    | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| Sessão ACP falha cedo com pouca saída                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`.                                        | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`.        |
| Sessão ACP fica parada indefinidamente após concluir o trabalho                       | O processo do harness terminou, mas a sessão ACP não informou conclusão.                                                    | Atualize o OpenClaw; a limpeza atual do acpx colhe processos obsoletos de wrapper e adaptador pertencentes ao OpenClaw no fechamento e na inicialização do Gateway.                                             |
| Harness vê `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope de evento interno vazou pela fronteira ACP.                                                                | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts simples de conclusão.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertence ao
relay de hook nativo do Codex, não a ACP/acpx. Em um chat Codex vinculado, inicie uma nova
sessão com `/new` ou `/reset`; se funcionar uma vez e depois retornar na próxima
chamada de ferramenta nativa, reinicie o app-server do Codex ou o Gateway do OpenClaw em vez de
repetir `/new`. Consulte [Solução de problemas do harness Codex](/pt-BR/plugins/codex-harness#troubleshooting).
</Note>

## Relacionados

- [Agentes ACP - configuração](/pt-BR/tools/acp-agents-setup)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Backends de CLI](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo bridge)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

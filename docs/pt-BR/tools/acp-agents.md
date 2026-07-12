---
read_when:
    - Executando harnesses de codificação por meio do ACP
    - Configuração de sessões ACP vinculadas a conversas em canais de mensagens
    - Vinculação de uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas do backend ACP, da integração do plugin ou da entrega de conclusões
    - Operando comandos /acp pelo chat
sidebarTitle: ACP agents
summary: Execute ambientes externos de programação (Claude Code, Cursor, Gemini CLI, Codex ACP explícito, OpenClaw ACP, OpenCode) por meio do backend ACP
title: Agentes ACP
x-i18n:
    generated_at: "2026-07-12T00:25:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o
OpenClaw execute ambientes externos de programação (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI e outros ambientes ACPX compatíveis)
por meio de um plugin de backend ACP. Cada inicialização é acompanhada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

<Note>
**O ACP é o caminho para ambientes externos, não o caminho padrão do Codex.** O plugin
nativo do servidor de aplicativo Codex controla os comandos `/codex ...` e o runtime
incorporado padrão `openai/gpt-*` para turnos do agente; o ACP controla os comandos
`/acp ...` e as sessões `sessions_spawn({ runtime: "acp" })`.

Para permitir que o Codex ou o Claude Code se conecte diretamente como cliente MCP externo
a conversas existentes dos canais do OpenClaw, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez do ACP.
</Note>

## Qual página devo usar?

| Você quer...                                                                                              | Use isto                              | Observações                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular ou controlar o Codex na conversa atual                                                          | `/codex bind`, `/codex threads`       | Caminho nativo do servidor de aplicativo Codex quando o plugin `codex` está habilitado: respostas vinculadas ao chat, encaminhamento de imagens, modelo/velocidade/permissões, interrupção e direcionamento. O ACP é uma alternativa explícita |
| Executar Claude Code, Gemini CLI, Codex ACP explícito ou outro ambiente externo _por meio_ do OpenClaw   | Esta página                           | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano e controles do runtime                                                               |
| Expor uma sessão do Gateway do OpenClaw _como_ servidor ACP para um editor ou cliente                    | [`openclaw acp`](/pt-BR/cli/acp)            | Modo de ponte: um IDE/cliente se comunica via ACP com o OpenClaw por stdio/WebSocket                                                                                                           |
| Reutilizar uma CLI local de IA como modelo alternativo somente de texto                                  | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP: sem ferramentas do OpenClaw, controles do ACP ou runtime de ambiente                                                                                                             |

## Isso funciona imediatamente?

Sim, após instalar o plugin oficial de runtime ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouts do código-fonte podem usar o plugin local do workspace `extensions/acpx` após
`pnpm install`. Execute `/acp doctor` para verificar a prontidão.

O OpenClaw só instrui os agentes sobre a inicialização via ACP quando o ACP está
**realmente disponível**: o ACP deve estar habilitado, o despacho não pode estar
desabilitado, a sessão atual não pode estar bloqueada pelo sandbox e um backend de
runtime deve estar carregado e íntegro. Se qualquer condição falhar, as Skills do ACP
e as orientações de ACP para `sessions_spawn` permanecem ocultas, para que o agente
não sugira um backend indisponível.

<AccordionGroup>
  <Accordion title="Considerações da primeira execução">
    - Se `plugins.allow` estiver definido, ele será um inventário restritivo de plugins e **deverá** incluir `acpx`; caso contrário, o backend ACP instalado será bloqueado intencionalmente (`/acp doctor` informará a ausência da entrada na lista de permissões).
    - O adaptador ACP do Codex é fornecido com o plugin `acpx` e é iniciado localmente quando possível.
    - O Codex ACP é executado com um `CODEX_HOME` isolado. O OpenClaw copia as entradas confiáveis de confiança do projeto e a configuração segura de roteamento de modelo/provedor (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` e os campos seguros de `model_providers.<name>`) da configuração do Codex no host; autenticação, notificações e hooks permanecem apenas na configuração do host.
    - Outros adaptadores de ambientes de destino podem ser obtidos sob demanda com `npx` no primeiro uso.
    - A autenticação do fornecedor já deve existir no host para esse ambiente.
    - Se o host não tiver npm ou acesso à rede, a obtenção dos adaptadores na primeira execução falhará até que os caches sejam pré-aquecidos ou que o adaptador seja instalado de outra forma.

  </Accordion>
  <Accordion title="Pré-requisitos do runtime">
    O ACP inicia um processo real de ambiente externo. O OpenClaw controla o roteamento,
    o estado das tarefas em segundo plano, a entrega, os vínculos e as políticas; o ambiente
    controla o login no provedor, o catálogo de modelos, o comportamento do sistema de
    arquivos e as ferramentas nativas.

    Antes de atribuir o problema ao OpenClaw, verifique:

    - `/acp doctor` informa um backend habilitado e íntegro.
    - O id de destino é permitido por `acp.allowedAgents` quando essa lista de permissões está definida.
    - O comando do ambiente pode ser iniciado no host do Gateway.
    - A autenticação do provedor está presente para esse ambiente (`claude`, `codex`, `gemini`, `opencode`, `droid` etc.).
    - O modelo selecionado existe para esse ambiente — os ids de modelo não são intercambiáveis entre ambientes.
    - O `cwd` solicitado existe e está acessível; caso contrário, omita `cwd` e permita que o backend use seu padrão.
    - O modo de permissão corresponde ao trabalho. Sessões não interativas não podem clicar em solicitações nativas de permissão; portanto, execuções de programação com uso intenso de gravação/execução geralmente precisam de um perfil de permissões ACPX capaz de prosseguir sem interface interativa.

  </Accordion>
</AccordionGroup>

As ferramentas de plugins do OpenClaw e as ferramentas integradas do OpenClaw **não**
são expostas aos ambientes ACP por padrão. Habilite as pontes MCP explícitas em
[Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup) somente quando o ambiente precisar
chamar essas ferramentas diretamente.

## Ambientes de destino compatíveis

Com o backend `acpx`, use estes ids como destinos de `/acp spawn <id>` ou
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id do ambiente | Backend típico                                  | Observações                                                                                                    |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `claude`       | Adaptador ACP do Claude Code                   | Requer autenticação do Claude Code no host.                                                                    |
| `codex`        | Adaptador ACP do Codex                         | Alternativa ACP explícita somente quando o `/codex` nativo estiver indisponível ou quando o ACP for solicitado. |
| `copilot`      | Adaptador ACP do GitHub Copilot                | Requer autenticação da CLI/runtime do Copilot.                                                                 |
| `cursor`       | ACP da CLI do Cursor (`cursor-agent acp`)      | Substitua o comando acpx se uma instalação local expuser um ponto de entrada ACP diferente.                    |
| `droid`        | CLI Factory Droid                              | Requer autenticação do Factory/Droid ou `FACTORY_API_KEY` no ambiente do executor.                             |
| `fast-agent`   | Adaptador ACP fast-agent-mcp                   | Obtido sob demanda com `uvx`.                                                                                  |
| `gemini`       | Adaptador ACP da Gemini CLI                    | Requer autenticação da Gemini CLI ou configuração de chave de API.                                             |
| `iflow`        | CLI iFlow                                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                              |
| `kilocode`     | CLI Kilo Code                                  | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                              |
| `kimi`         | CLI Kimi/Moonshot                              | Requer autenticação do Kimi/Moonshot no host.                                                                  |
| `kiro`         | CLI Kiro                                       | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                              |
| `mux`          | Adaptador ACP da CLI Mux                       | Obtido sob demanda com `npx`.                                                                                  |
| `opencode`     | Adaptador ACP do OpenCode                      | Requer autenticação da CLI/provedor do OpenCode.                                                               |
| `openclaw`     | Ponte do Gateway do OpenClaw via `openclaw acp` | Permite que um ambiente compatível com ACP se comunique com uma sessão do Gateway do OpenClaw.                |
| `qoder`        | CLI Qoder                                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                              |
| `qwen`         | Qwen Code / Qwen CLI                           | Requer autenticação compatível com Qwen no host.                                                               |
| `trae`         | Adaptador ACP da CLI Trae                      | A disponibilidade do adaptador e o controle de modelo dependem da CLI instalada.                              |

`pi` (pi-acp) também é registrado no backend acpx, mas não é um ambiente de
programação no mesmo sentido que os demais acima.

Aliases personalizados de agentes acpx podem ser configurados no próprio acpx, mas a
política do OpenClaw ainda verifica `acp.allowedAgents` e qualquer mapeamento
`agents.list[].runtime.acp.agent` antes do despacho.

## Guia operacional

Fluxo rápido de `/acp` pelo chat:

<Steps>
  <Step title="Iniciar">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` ou, explicitamente,
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Trabalhar">
    Continue na conversa ou thread vinculada (ou indique explicitamente a chave
    da sessão).
  </Step>
  <Step title="Verificar o estado">
    `/acp status`
  </Step>
  <Step title="Ajustar">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Direcionar">
    Sem substituir o contexto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Interromper">
    `/acp cancel` (turno atual) ou `/acp close` (sessão + vínculos).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detalhes do ciclo de vida">
    - A inicialização cria ou retoma uma sessão de runtime ACP, registra metadados ACP no armazenamento de sessões do OpenClaw e pode criar uma tarefa em segundo plano quando a execução pertence à tarefa principal.
    - As sessões ACP pertencentes à tarefa principal são tratadas como trabalho em segundo plano, mesmo quando a sessão de runtime é persistente; a conclusão e a entrega entre superfícies passam pelo notificador da tarefa principal, em vez de se comportarem como uma sessão normal de chat voltada ao usuário.
    - A manutenção de tarefas encerra sessões ACP de execução única, terminais ou órfãs, pertencentes à tarefa principal. Sessões ACP persistentes são preservadas enquanto houver um vínculo ativo com uma conversa; sessões persistentes obsoletas sem vínculo ativo são encerradas para impedir que sejam retomadas silenciosamente após a conclusão da tarefa proprietária ou a remoção do registro dessa tarefa.
    - Mensagens subsequentes vinculadas são enviadas diretamente à sessão ACP até que o vínculo seja encerrado, perca o foco, seja redefinido ou expire.
    - Os comandos do Gateway permanecem locais. `/acp ...`, `/status` e `/unfocus` nunca são enviados como texto normal de prompt a um ambiente ACP vinculado.
    - `cancel` interrompe o turno ativo quando o backend é compatível com cancelamento; ele não exclui o vínculo nem os metadados da sessão.
    - `close` encerra a sessão ACP do ponto de vista do OpenClaw e remove o vínculo. Um ambiente ainda pode manter seu próprio histórico no serviço de origem se for compatível com retomada.
    - O plugin acpx limpa as árvores de processos de wrappers e adaptadores pertencentes ao OpenClaw após `close` e remove processos ACPX órfãos e obsoletos pertencentes ao OpenClaw durante a inicialização do Gateway.
    - Workers de runtime ociosos podem ser limpos após `acp.runtime.ttlMinutes`; os metadados de sessão armazenados continuam disponíveis para `/acp sessions`.

  </Accordion>
  <Accordion title="Regras de roteamento nativo do Codex">
    Gatilhos em linguagem natural que devem ser encaminhados ao **plugin nativo do Codex**
    quando ele estiver habilitado:

    - "Vincule este canal do Discord ao Codex."
    - "Anexe este chat à thread `<id>` do Codex."
    - "Mostre as threads do Codex e vincule esta."

    A vinculação nativa de conversas do Codex é o caminho padrão de controle do chat.
    As ferramentas dinâmicas do OpenClaw ainda são executadas pelo OpenClaw, enquanto as
    ferramentas nativas do Codex, como shell/apply-patch, são executadas dentro do Codex.
    Para eventos de ferramentas nativas do Codex, o OpenClaw injeta, a cada turno, um
    retransmissor de hooks nativos para que os hooks de plugins possam bloquear
    `before_tool_call`, observar `after_tool_call` e encaminhar eventos
    `PermissionRequest` do Codex pelas aprovações do OpenClaw. Os hooks `Stop` do Codex
    são retransmitidos para `before_agent_finalize` do OpenClaw, onde os plugins podem
    solicitar mais uma passagem do modelo antes que o Codex finalize sua resposta.
    O retransmissor permanece deliberadamente conservador: ele não modifica os argumentos
    das ferramentas nativas do Codex nem reescreve os registros de threads do Codex.
    Use ACP explícito somente quando quiser o modelo de runtime/sessão do ACP. O limite
    de suporte do Codex incorporado está documentado no
    [contrato de suporte v1 do harness do Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Guia rápido de seleção de modelo / provedor / runtime">
    - referências legadas de modelos do Codex - rota legada de modelo por OAuth/assinatura do Codex reparada pelo doctor.
    - `openai/*` - runtime incorporado do app-server nativo do Codex para turnos de agentes da OpenAI.
    - `/codex ...` - controle nativo de conversas do Codex.
    - `/acp ...` ou `runtime: "acp"` - controle explícito do ACP/acpx.

  </Accordion>
  <Accordion title="Gatilhos de linguagem natural para roteamento ao ACP">
    Gatilhos que devem ser roteados ao runtime do ACP:

    - "Execute isto como uma sessão ACP pontual do Claude Code e resuma o resultado."
    - "Use o Gemini CLI para esta tarefa em uma thread e mantenha os acompanhamentos nessa mesma thread."
    - "Execute o Codex pelo ACP em uma thread em segundo plano."

    O OpenClaw seleciona `runtime: "acp"`, resolve o `agentId` do harness,
    vincula à conversa ou thread atual quando houver suporte e encaminha os
    acompanhamentos para essa sessão até o fechamento ou a expiração. O Codex
    só segue esse caminho quando ACP/acpx é explícito ou quando o plugin nativo
    do Codex não está disponível para a operação solicitada.

    Para `sessions_spawn`, `runtime: "acp"` só é anunciado quando o ACP está
    habilitado, o solicitante não está em sandbox e um backend de runtime do ACP
    está carregado. `acp.dispatch.enabled=false` pausa o despacho automático de
    threads do ACP, mas não oculta nem bloqueia chamadas explícitas de
    `sessions_spawn({ runtime: "acp" })`. Ele tem como alvo ids de harness do ACP,
    como `codex`, `claude`, `droid`, `gemini` ou `opencode`. Não passe um id normal
    de agente da configuração do OpenClaw proveniente de `agents_list`, a menos
    que essa entrada esteja configurada explicitamente com
    `agents.list[].runtime.type="acp"`; caso contrário, use o runtime padrão de
    subagente. Quando um agente do OpenClaw está configurado com
    `runtime.type="acp"`, o OpenClaw usa `runtime.acp.agent` como o id de harness
    subjacente.

  </Accordion>
</AccordionGroup>

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use o **app-server
nativo do Codex** para vincular/controlar conversas do Codex quando o plugin
`codex` estiver habilitado. Use **subagentes** quando quiser execuções delegadas
nativas do OpenClaw.

| Área              | Sessão ACP                            | Execução de subagente                 |
| ----------------- | ------------------------------------- | ------------------------------------- |
| Runtime           | Plugin de backend ACP (por exemplo, acpx) | Runtime nativo de subagente do OpenClaw |
| Chave da sessão   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`     |
| Comandos principais | `/acp ...`                          | `/subagents ...`                      |
| Ferramenta de criação | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão)  |

Consulte também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para o Claude Code por meio do ACP, a pilha é:

1. Plano de controle de sessões ACP do OpenClaw.
2. Plugin de runtime oficial `@openclaw/acpx`.
3. Adaptador ACP do Claude.
4. Mecanismo de runtime/sessão no lado do Claude.

O Claude via ACP é uma **sessão de harness** com controles do ACP, retomada de
sessão, acompanhamento de tarefas em segundo plano e vinculação opcional a
conversas/threads.

Os backends de CLI são runtimes locais alternativos separados e exclusivamente
textuais — consulte [Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- **Quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente no harness?** Use ACP.
- **Quer uma alternativa textual local simples por meio da CLI bruta?** Use backends de CLI.

## Sessões vinculadas

### Modelo mental

- **Superfície de chat** — onde as pessoas continuam conversando (canal do Discord, tópico do Telegram, conversa do iMessage).
- **Sessão ACP** — o estado durável de runtime do Codex/Claude/Gemini para o qual o OpenClaw encaminha.
- **Thread/tópico filho** — uma superfície adicional opcional de mensagens criada somente por `--thread ...`.
- **Workspace do runtime** — o local no sistema de arquivos (`cwd`, checkout do repositório, workspace do backend) onde o harness é executado. Independente da superfície de chat.

### Vinculações à conversa atual

`/acp spawn <harness> --bind here` fixa a conversa atual à sessão ACP
criada — sem thread filha, na mesma superfície de chat. O OpenClaw continua
controlando transporte, autenticação, segurança e entrega. As mensagens de
acompanhamento nessa conversa são encaminhadas à mesma sessão; `/new` e
`/reset` redefinem a sessão no local; `/acp close` remove a vinculação.

Exemplos:

```text
/codex bind                                              # vincula nativamente o Codex e encaminha futuras mensagens para cá
/codex model gpt-5.4                                     # ajusta a thread nativa vinculada do Codex
/codex stop                                              # controla o turno nativo ativo do Codex
/acp spawn codex --bind here                             # alternativa ACP explícita para o Codex
/acp spawn codex --thread auto                           # pode criar uma thread/tópico filho e vincular nela
/acp spawn codex --bind here --cwd /workspace/repo       # mesma vinculação de chat; o Codex é executado em /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regras de vinculação e exclusividade">
    - `--bind here` e `--thread ...` são mutuamente exclusivos.
    - `--bind here` só funciona em canais que anunciam suporte à vinculação da conversa atual; caso contrário, o OpenClaw retorna uma mensagem clara informando que não há suporte. As vinculações persistem após reinicializações do Gateway.
    - No Discord, `spawnSessions` controla a criação de threads filhas para `--thread auto|here`, não para `--bind here`.
    - Se você criar uma sessão para um agente ACP diferente sem `--cwd`, o OpenClaw herdará, por padrão, o workspace do **agente de destino**. Caminhos herdados ausentes (`ENOENT`/`ENOTDIR`) usam como alternativa o padrão do backend; outros erros de acesso (por exemplo, `EACCES`) são apresentados como erros de criação.
    - Os comandos de gerenciamento do Gateway permanecem locais em conversas vinculadas — os comandos `/acp ...` são processados pelo OpenClaw mesmo quando o texto normal de acompanhamento é encaminhado à sessão ACP vinculada; `/status` e `/unfocus` também permanecem locais sempre que o processamento de comandos estiver habilitado para essa superfície.

  </Accordion>
  <Accordion title="Sessões vinculadas a threads">
    Quando as vinculações de threads estão habilitadas para um adaptador de canal:

    - O OpenClaw vincula uma thread a uma sessão ACP de destino.
    - As mensagens de acompanhamento nessa thread são encaminhadas à sessão ACP vinculada.
    - A saída do ACP é entregue de volta à mesma thread.
    - Remover o foco, fechar, arquivar ou expirar por inatividade ou idade máxima remove a vinculação.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` são comandos do Gateway, não prompts para o harness do ACP.

    Flags de recurso obrigatórias para ACP vinculado a threads:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` fica ativado por padrão (defina como `false` para pausar o despacho automático de threads do ACP; chamadas explícitas de `sessions_spawn({ runtime: "acp" })` continuam funcionando).
    - Criação de sessões de thread pelo adaptador de canal habilitada (padrão: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    O suporte à vinculação de threads é específico de cada adaptador. Se o
    adaptador de canal ativo não oferecer suporte a vinculações de threads,
    o OpenClaw retornará uma mensagem clara informando que o recurso não é
    compatível ou não está disponível.

  </Accordion>
  <Accordion title="Canais compatíveis com threads">
    - Qualquer adaptador de canal que exponha a capacidade de vinculação de sessões/threads.
    - Suporte incorporado atual: threads/canais do **Discord**, tópicos do **Telegram** (tópicos de fórum em grupos/supergrupos e tópicos de mensagens diretas).
    - Canais de plugins podem adicionar suporte pela mesma interface de vinculação.

  </Accordion>
</AccordionGroup>

## Vinculações persistentes de canais

Para fluxos de trabalho não efêmeros, configure vinculações ACP persistentes
em entradas `bindings[]` de nível superior.

### Modelo de vinculação

<ParamField path="bindings[].type" type='"acp"'>
  Marca uma vinculação persistente de conversa ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica a conversa de destino. Formatos por canal:

- **Canal/thread do Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canal/mensagem direta do Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Prefira ids estáveis do Slack; as vinculações de canais também correspondem a respostas nas threads desse canal.
- **Tópico de fórum do Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Mensagem direta/grupo do WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Use números E.164, como `+15555550123`, para conversas diretas e JIDs de grupos do WhatsApp, como `120363424282127706@g.us`, para grupos.
- **Mensagem direta/grupo do iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Prefira `chat_id:*` para vinculações estáveis de grupos.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  O id do agente proprietário no OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Substituição opcional do ACP.
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

Use `agents.list[].runtime` para definir os padrões do ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo, `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedência de substituição para sessões ACP vinculadas:**

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

- O OpenClaw garante que a sessão ACP configurada exista após a admissão específica do canal e antes do uso.
- As mensagens nesse canal, tópico ou chat são encaminhadas para a sessão ACP configurada.
- Os vínculos ACP configurados controlam a rota de suas sessões. A distribuição de transmissões do canal não substitui a sessão ACP configurada para um vínculo correspondente.
- Em conversas vinculadas, `/new` e `/reset` redefinem no local a mesma chave de sessão ACP.
- Vínculos temporários de execução (por exemplo, criados por fluxos de foco em tópicos encadeados) continuam sendo aplicados quando presentes.
- Para inicializações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o espaço de trabalho do agente de destino da configuração do agente.
- Caminhos de espaços de trabalho herdados que não existem usam como alternativa o diretório de trabalho padrão da infraestrutura; falhas de acesso a caminhos existentes são apresentadas como erros de inicialização.

## Iniciar sessões ACP

Há duas maneiras de iniciar uma sessão ACP:

<Tabs>
  <Tab title="A partir de sessions_spawn">
    Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno do agente ou de uma
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
    O padrão de `runtime` é `subagent`; portanto, defina `runtime: "acp"` explicitamente para
    sessões ACP. Se `agentId` for omitido, o OpenClaw usará `acp.defaultAgent`
    quando estiver configurado. `mode: "session"` exige `thread: true` para manter uma
    conversa vinculada persistente.
    </Note>

  </Tab>
  <Tab title="A partir do comando /acp">
    Use `/acp spawn` para obter controle explícito do operador pelo chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Opções principais:

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
  Identificador da estrutura de execução ACP de destino. Usa `acp.defaultAgent` como alternativa, se estiver definido.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Solicita o fluxo de vinculação a tópico encadeado quando houver suporte.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` é uma execução única; `"session"` é persistente. Se `thread: true` e
  `mode` for omitido, o OpenClaw poderá adotar por padrão o comportamento persistente de acordo com
  o caminho de execução. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho solicitado para a execução (validado pela política da infraestrutura ou da execução).
  Se omitido, a inicialização ACP herda o espaço de trabalho do agente de destino quando configurado;
  caminhos herdados que não existem usam os padrões da infraestrutura como alternativa, enquanto erros
  reais de acesso são retornados.
</ParamField>
<ParamField path="label" type="string">
  Rótulo voltado ao operador usado no texto da sessão ou do banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Retoma uma sessão ACP existente em vez de criar uma nova. O agente
  reproduz o histórico da conversa por meio de `session/load`. Exige
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` transmite resumos do progresso da execução ACP inicial de volta à sessão
  solicitante como eventos do sistema. As respostas aceitas incluem `streamLogPath`,
  que aponta para um registro JSONL específico da sessão (`<sessionId>.acp-stream.jsonl`), cujo
  conteúdo você pode acompanhar para obter todo o histórico de retransmissão. Por padrão, os fluxos de progresso
  da sessão principal mostram comentários do assistente e o progresso do estado ACP, a menos que
  `streaming.progress.commentary=false`. O Discord também usa por padrão o modo de progresso
  nas prévias da sessão principal quando nenhum modo de transmissão está configurado. O progresso do
  estado ainda respeita `acp.stream.tagVisibility`; portanto, etiquetas como `plan`
  permanecem ocultas, a menos que sejam ativadas explicitamente.
</ParamField>

As execuções de `sessions_spawn` ACP usam `agents.defaults.subagents.runTimeoutSeconds`
como limite padrão para o turno da sessão secundária. A ferramenta não aceita substituições de tempo-limite
por chamada (`runTimeoutSeconds`/`timeoutSeconds` são rejeitados com um erro que
solicita a configuração do valor padrão).

<ParamField path="model" type="string">
  Substituição explícita do modelo para a sessão ACP secundária. Inicializações ACP do Codex
  normalizam referências da OpenAI, como `openai/gpt-5.4`, para a configuração de inicialização ACP do Codex
  antes de `session/new`; formatos com barras, como `openai/gpt-5.4/high`, também definem
  o nível de raciocínio ACP do Codex. Quando omitido, `sessions_spawn({ runtime: "acp" })`
  usa os padrões existentes do modelo de subagente (`agents.defaults.subagents.model` ou
  `agents.list[].subagents.model`) quando configurados; caso contrário, permite que a estrutura
  de execução ACP use seu próprio modelo padrão. Outras estruturas de execução devem anunciar
  `models` ACP e oferecer suporte a `session/set_model`; caso contrário, o OpenClaw/acpx falha
  de forma clara em vez de usar silenciosamente o padrão do agente de destino.
</ParamField>
<ParamField path="thinking" type="string">
  Nível explícito de pensamento ou raciocínio. Para ACP do Codex, `minimal` corresponde ao nível baixo,
  `low`/`medium`/`high`/`xhigh` são aplicados diretamente, e `off` omite a
  substituição do nível de raciocínio na inicialização. Quando omitido, as inicializações ACP usam os
  padrões existentes de pensamento dos subagentes e
  `agents.defaults.models["provider/model"].params.thinking` por modelo para o
  modelo selecionado.
</ParamField>

## Modos de vinculação e tópico encadeado na inicialização

<Tabs>
  <Tab title="--bind here|off">
    | Modo   | Comportamento                                                               |
    | ------ | --------------------------------------------------------------------------- |
    | `here` | Vincula no local a conversa ativa atual; falha se nenhuma estiver ativa.    |
    | `off`  | Não cria um vínculo com a conversa atual.                                   |

    Observações:

    - `--bind here` é o caminho mais simples para o operador indicar que "este canal ou chat deve usar o Codex".
    - `--bind here` não cria um tópico encadeado secundário.
    - `--bind here` está disponível somente em canais que oferecem suporte à vinculação da conversa atual.
    - `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modo   | Comportamento                                                                                                                |
    | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
    | `auto` | Em um tópico encadeado ativo: vincula esse tópico. Fora de um tópico: cria/vincula um tópico secundário quando houver suporte. |
    | `here` | Exige um tópico encadeado ativo; falha quando não estiver em um.                                                              |
    | `off`  | Sem vínculo. A sessão é iniciada sem vínculo.                                                                                 |

    Observações:

    - Em superfícies de vinculação sem tópicos encadeados, o comportamento padrão é, na prática, `off`.
    - A inicialização vinculada a um tópico encadeado exige suporte da política do canal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Use `--bind here` quando quiser fixar a conversa atual sem criar um tópico encadeado secundário.

  </Tab>
</Tabs>

## Modelo de entrega

As sessões ACP podem ser espaços de trabalho interativos ou trabalhos em segundo plano
controlados pela sessão principal. O caminho de entrega depende desse formato.

<AccordionGroup>
  <Accordion title="Sessões ACP interativas">
    As sessões interativas destinam-se a manter a conversa em uma superfície de chat visível:

    - `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
    - `/acp spawn ... --thread ...` vincula um tópico encadeado ou tópico do canal à sessão ACP.
    - Vínculos persistentes configurados com `bindings[].type="acp"` encaminham as conversas correspondentes para a mesma sessão ACP.

    Mensagens subsequentes na conversa vinculada são encaminhadas diretamente para a sessão
    ACP, e a saída ACP é entregue de volta ao mesmo
    canal, tópico encadeado ou tópico.

    O que o OpenClaw envia à estrutura de execução:

    - Mensagens subsequentes vinculadas normais são enviadas como texto do prompt, além de anexos somente quando a estrutura de execução ou a infraestrutura oferece suporte a eles.
    - Os comandos de gerenciamento `/acp` e os comandos locais do Gateway são interceptados antes do envio ao ACP.
    - Eventos de conclusão gerados durante a execução são materializados para cada destino. Agentes do OpenClaw recebem o envelope interno de contexto de execução do OpenClaw; estruturas de execução ACP externas recebem um prompt simples com o resultado da sessão secundária e a instrução. O envelope bruto `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nunca deve ser enviado a estruturas externas nem persistido como texto de transcrição do usuário no ACP.
    - As entradas da transcrição ACP usam o texto de acionamento visível ao usuário ou o prompt simples de conclusão. Os metadados internos do evento permanecem estruturados no OpenClaw sempre que possível e não são tratados como conteúdo de chat escrito pelo usuário.

  </Accordion>
  <Accordion title="Sessões ACP de execução única controladas pela sessão principal">
    Sessões ACP de execução única iniciadas por outra execução de agente são sessões
    secundárias em segundo plano, semelhantes a subagentes:

    - A sessão principal solicita o trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - A sessão secundária é executada em sua própria sessão da estrutura de execução ACP.
    - Os turnos da sessão secundária são executados na mesma faixa de segundo plano usada pelas inicializações nativas de subagentes; portanto, uma estrutura de execução ACP lenta não bloqueia trabalhos não relacionados da sessão principal.
    - A conclusão é informada pelo caminho de anúncio de conclusão da tarefa. O OpenClaw converte os metadados internos de conclusão em um prompt ACP simples antes de enviá-los a uma estrutura externa; assim, essas estruturas não veem marcadores de contexto de execução exclusivos do OpenClaw.
    - A sessão principal reformula o resultado da sessão secundária na voz normal do assistente quando uma resposta voltada ao usuário é útil.

    **Não** trate esse caminho como um chat ponto a ponto entre a sessão principal e a
    sessão secundária. A sessão secundária já possui um canal de conclusão de volta para a sessão principal.

  </Accordion>
  <Accordion title="Entrega com sessions_send e A2A">
    `sessions_send` pode direcionar outra sessão após a inicialização. Para sessões pares
    normais, o OpenClaw usa um caminho subsequente de agente para agente (A2A) após
    injetar a mensagem:

    - Aguarda a resposta da sessão de destino.
    - Opcionalmente, permite que o solicitante e o destino troquem uma quantidade limitada de turnos subsequentes.
    - Solicita que o destino produza uma mensagem de anúncio.
    - Entrega esse anúncio ao canal ou tópico encadeado visível.

    Esse caminho A2A é um fallback para envios entre pares nos quais o remetente precisa de um
    acompanhamento visível. Ele permanece habilitado quando uma sessão não relacionada consegue ver e
    enviar mensagens a um destino ACP, por exemplo, sob configurações amplas de
    `tools.sessions.visibility`.

    O OpenClaw ignora o acompanhamento A2A somente quando o solicitante é o pai de
    seu próprio filho ACP de execução única pertencente ao pai. Nesse caso, executar A2A além
    da conclusão da tarefa pode despertar o pai com o resultado do filho, encaminhar
    a resposta do pai de volta ao filho e criar um ciclo de eco
    pai/filho. O resultado de `sessions_send` informa `delivery.status="skipped"` nesse
    caso de filho pertencente ao pai, pois o caminho de conclusão já é responsável
    pelo resultado.

  </Accordion>
  <Accordion title="Retomar uma sessão existente">
    Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de
    começar do zero. O agente reproduz o histórico da conversa por meio de
    `session/load`, retomando com o contexto completo do que ocorreu antes.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casos de uso comuns:

    - Transfira uma sessão do Codex do seu laptop para o telefone — peça ao agente que retome de onde você parou.
    - Continue uma sessão de programação iniciada interativamente na CLI, agora sem interface por meio do seu agente.
    - Retome um trabalho interrompido por uma reinicialização do Gateway ou pelo tempo limite de inatividade.

    Observações:

    - `resumeSessionId` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora esse campo exclusivo do ACP.
    - `streamTo` só se aplica quando `runtime: "acp"`; o runtime padrão de subagente ignora esse campo exclusivo do ACP.
    - `resumeSessionId` é um id de retomada do ACP/harness local ao host, não uma chave de sessão de canal do OpenClaw; o OpenClaw ainda verifica a política de criação do ACP e a política do agente de destino antes do despacho, enquanto o backend ou harness ACP controla a autorização para carregar esse id de origem.
    - `resumeSessionId` restaura o histórico da conversa ACP de origem; `thread` e `mode` ainda se aplicam normalmente à nova sessão do OpenClaw que você está criando, portanto `mode: "session"` ainda exige `thread: true`.
    - O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
    - Se o id da sessão não for encontrado, a criação falhará com um erro claro — sem fallback silencioso para uma nova sessão.

  </Accordion>
  <Accordion title="Teste de fumaça pós-implantação">
    Após uma implantação do Gateway, execute uma verificação completa e ativa de ponta a ponta em vez de confiar
    em testes unitários:

    1. Verifique a versão e o commit do Gateway implantado no host de destino.
    2. Abra uma sessão temporária de ponte ACPX para um agente ativo.
    3. Peça a esse agente que chame `sessions_spawn` com `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e a tarefa `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifique `accepted=yes`, uma `childSessionKey` real e a ausência de erros do validador.
    5. Encerre a sessão temporária de ponte.

    Mantenha a validação em `mode: "run"` e ignore `streamTo: "parent"` —
    o `mode: "session"` vinculado a uma thread e os caminhos de retransmissão de fluxo são verificações de integração
    distintas e mais abrangentes.

  </Accordion>
</AccordionGroup>

## Compatibilidade com sandbox

Atualmente, as sessões ACP são executadas no runtime do host, **não** dentro da sandbox do OpenClaw.

<Warning>
**Limite de segurança:**

- O harness externo pode ler/gravar de acordo com suas próprias permissões da CLI e o `cwd` selecionado.
- A política de sandbox do OpenClaw **não** envolve a execução do harness ACP.
- O OpenClaw ainda aplica os controles de acesso do recurso ACP, os agentes permitidos, a propriedade da sessão, as vinculações de canal e a política de entrega do Gateway.
- Use `runtime: "subagent"` para trabalho nativo do OpenClaw com aplicação da sandbox.

</Warning>

Limitações atuais:

- Se a sessão solicitante estiver em uma sandbox, as criações ACP serão bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.

## Resolução do destino da sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`,
`session-id` ou `session-label`).

**Ordem de resolução:**

1. Argumento de destino explícito (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois o id de sessão no formato UUID
   - depois o rótulo
2. Vinculação atual da thread (se esta conversa/thread estiver vinculada a uma sessão ACP).
3. Fallback para a sessão solicitante atual.

As vinculações da conversa atual e as vinculações de thread participam da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retornará um erro claro
(`Unable to resolve session target: ...`).

## Controles do ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria uma sessão ACP; vinculação atual ou à thread opcional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela o turno em andamento da sessão de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia uma instrução de direcionamento à sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Encerra a sessão e desvincula destinos de thread.          | `/acp close`                                                  |
| `/acp status`        | Exibe backend, modo, estado, opções de runtime e recursos. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime da sessão de destino.             | `/acp set-mode plan`                                          |
| `/acp set`           | Grava uma opção genérica de configuração do runtime.       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o tempo limite do runtime (segundos).               | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição do modelo do runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove as substituições das opções de runtime da sessão.   | `/acp reset-options`                                          |
| `/acp sessions`      | Lista as sessões ACP recentes do armazenamento.            | `/acp sessions`                                               |
| `/acp doctor`        | Exibe a integridade e os recursos do backend e correções acionáveis. | `/acp doctor`                                         |
| `/acp install`       | Exibe etapas determinísticas de instalação e habilitação.  | `/acp install`                                                |

Os controles de runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` e `reset-options`) exigem
a identidade do proprietário em canais externos e `operator.admin` em clientes internos do
Gateway. Remetentes autorizados que não sejam proprietários ainda podem usar `sessions`,
`doctor`, `install` e `help`.

`/acp status` exibe as opções efetivas do runtime, além dos identificadores de sessão
no nível do runtime e do backend. Erros de controles não compatíveis são exibidos
claramente quando um backend não possui um recurso. `/acp sessions` lê o armazenamento
da sessão atualmente vinculada ou solicitante; os tokens de destino (`session-key`,
`session-id` ou `session-label`) são resolvidos por meio da descoberta de sessões do Gateway,
incluindo raízes personalizadas de `session.store` por agente.

### Mapeamento das opções de runtime

`/acp` possui comandos de conveniência e um definidor genérico. Operações equivalentes:

| Comando                      | Mapeia para                           | Observações                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chave de configuração do runtime `model` | Para o ACP do Codex, o OpenClaw normaliza `openai/<model>` para o id do modelo do adaptador e mapeia sufixos de raciocínio separados por barras, como `openai/gpt-5.4/high`, para `reasoning_effort`.          |
| `/acp set thinking <level>`  | opção canônica `thinking`             | O OpenClaw envia o equivalente anunciado pelo backend quando disponível, preferindo `thinking`, depois `effort`, `reasoning_effort` ou `thought_level`. Para o ACP do Codex, o adaptador mapeia valores para `reasoning_effort`. |
| `/acp permissions <profile>` | opção canônica `permissionProfile`    | O OpenClaw envia o equivalente anunciado pelo backend quando disponível, como `approval_policy`, `permission_profile`, `permissions` ou `permission_mode`.                                                    |
| `/acp timeout <seconds>`     | opção canônica `timeoutSeconds`       | O OpenClaw envia o equivalente anunciado pelo backend quando disponível, como `timeout` ou `timeout_seconds`.                                                                                                 |
| `/acp cwd <path>`            | substituição do cwd do runtime        | Atualização direta.                                                                                                                                                                                           |
| `/acp set <key> <value>`     | genérico                              | `key=cwd` usa o caminho de substituição do cwd.                                                                                                                                                               |
| `/acp reset-options`         | limpa todas as substituições do runtime | -                                                                                                                                                                                                            |

## Harness acpx, configuração do Plugin e permissões

Para configurar o harness acpx (aliases do Claude Code / Codex / Gemini CLI),
as pontes MCP das ferramentas de Plugin e do OpenClaw e os modos de permissão do ACP,
consulte [Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup).

## Solução de problemas

| Sintoma                                                                                   | Causa provável                                                                                                           | Correção                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Plugin de backend ausente, desabilitado ou bloqueado por `plugins.allow`.                                                | Instale e habilite o Plugin de backend, inclua `acpx` em `plugins.allow` quando essa lista de permissões estiver definida e execute `/acp doctor`.                            |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP desabilitado globalmente.                                                                                            | Defina `acp.enabled=true`.                                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | O despacho automático de mensagens normais de threads está desabilitado.                                                | Defina `acp.dispatch.enabled=true` para retomar o roteamento automático de threads; chamadas explícitas a `sessions_spawn({ runtime: "acp" })` continuam funcionando.         |
| `ACP agent "<id>" is not allowed by policy`                                               | O agente não está na lista de permissões.                                                                                | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                                    |
| `/acp doctor` reports backend not ready right after startup                               | O Plugin de backend está ausente, desabilitado, bloqueado pela política de permissão/negação ou o executável configurado não está disponível. | Instale/habilite o Plugin de backend, execute `/acp doctor` novamente e verifique o erro de instalação ou de política do backend se ele continuar com problemas.              |
| Comando do harness não encontrado                                                         | A CLI do adaptador não está instalada, o Plugin externo está ausente ou a obtenção via `npx` na primeira execução falhou para um adaptador que não seja Codex. | Execute `/acp doctor`, instale/pré-aqueça o adaptador no host do Gateway ou configure explicitamente o comando do agente acpx.                                                |
| Modelo não encontrado pelo harness                                                        | O ID do modelo é válido para outro provedor/harness, mas não para este destino ACP.                                      | Use um modelo listado por esse harness, configure o modelo no harness ou omita a substituição.                                                                                |
| Erro de autenticação do fornecedor no harness                                             | O OpenClaw está funcionando corretamente, mas a CLI/provedor de destino não está autenticada.                           | Autentique-se ou forneça a chave de provedor necessária no ambiente do host do Gateway.                                                                                       |
| `Unable to resolve session target: ...`                                                   | Token de chave/ID/rótulo incorreto.                                                                                      | Execute `/acp sessions`, copie a chave ou o rótulo exato e tente novamente.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` foi usado sem uma conversa ativa que possa ser vinculada.                                                  | Vá para o chat/canal de destino e tente novamente ou faça uma criação sem vínculo.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                                    | O adaptador não oferece capacidade de vinculação ACP à conversa atual.                                                  | Use `/acp spawn ... --thread ...` quando houver suporte, configure `bindings[]` no nível superior ou vá para um canal compatível.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` foi usado fora do contexto de uma thread.                                                               | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Outro usuário é o proprietário do destino de vinculação ativo.                                                          | Refazer o vínculo como proprietário ou use outra conversa ou thread.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                                          | O adaptador não oferece capacidade de vinculação de threads.                                                            | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | O runtime do ACP fica no host; a sessão solicitante está em sandbox.                                                    | Use `runtime="subagent"` em sessões em sandbox ou execute a criação ACP em uma sessão que não esteja em sandbox.                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` foi solicitado para o runtime do ACP.                                                               | Use `runtime="subagent"` quando o uso de sandbox for obrigatório ou use ACP com `sandbox="inherit"` em uma sessão que não esteja em sandbox.                                  |
| `Cannot apply --model ... did not advertise model support`                                | O harness de destino não expõe a troca genérica de modelos do ACP.                                                      | Use um harness que anuncie `models`/`session/set_model` do ACP, use referências de modelo ACP do Codex ou configure o modelo diretamente no harness caso ele tenha uma flag própria de inicialização. |
| Metadados ACP ausentes para a sessão vinculada                                            | Metadados de sessão ACP obsoletos/excluídos.                                                                            | Recrie com `/acp spawn` e depois refaça o vínculo ou coloque a thread em foco.                                                                                                |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloqueia gravações/execução em uma sessão ACP não interativa.                                          | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o Gateway. Consulte [Configuração de permissões](/pt-BR/tools/acp-agents-setup#permission-configuration). |
| A sessão ACP falha logo no início com pouca saída                                         | As solicitações de permissão são bloqueadas por `permissionMode`/`nonInteractivePermissions`.                           | Verifique nos logs do Gateway a presença de `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação controlada, defina `nonInteractivePermissions=deny`. |
| A sessão ACP fica paralisada indefinidamente após concluir o trabalho                     | O processo do harness terminou, mas a sessão ACP não informou a conclusão.                                              | Atualize o OpenClaw; a limpeza atual do acpx encerra processos obsoletos de wrappers e adaptadores pertencentes ao OpenClaw ao fechar e ao iniciar o Gateway.                  |
| O harness recebe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                  | O envelope de eventos internos vazou através do limite do ACP.                                                          | Atualize o OpenClaw e execute novamente o fluxo de conclusão; harnesses externos devem receber apenas prompts de conclusão em texto simples.                                 |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` pertence ao
retransmissor de hooks nativo do Codex, não ao ACP/acpx. Em um chat Codex vinculado, inicie uma
nova sessão com `/new` ou `/reset`; se funcionar uma vez e depois retornar na
próxima chamada de ferramenta nativa, reinicie o app-server do Codex ou o Gateway do OpenClaw
em vez de repetir `/new`. Consulte
[Solução de problemas do harness Codex](/pt-BR/plugins/codex-harness#troubleshooting).
</Note>

## Relacionados

- [Agentes ACP — configuração](/pt-BR/tools/acp-agents-setup)
- [Envio para agente](/pt-BR/tools/agent-send)
- [Backends de CLI](/pt-BR/gateway/cli-backends)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modo de ponte)](/pt-BR/cli/acp)
- [Subagentes](/pt-BR/tools/subagents)

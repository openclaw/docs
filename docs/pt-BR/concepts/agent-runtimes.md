---
read_when:
    - Você está escolhendo entre OpenClaw, Codex, ACP ou outro runtime de agente nativo
    - Você está confuso com rótulos de provedor/modelo/runtime em status ou configuração
    - Você está documentando a paridade de suporte para um harness nativo
summary: Como o OpenClaw separa provedores de modelos, modelos, canais e runtimes de agente
title: Runtimes de agentes
x-i18n:
    generated_at: "2026-06-27T17:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** é o componente que controla um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, lida com chamadas de ferramentas nativas
e retorna o turno concluído ao OpenClaw.

Runtimes são fáceis de confundir com provedores porque ambos aparecem perto da
configuração de modelo. Eles são camadas diferentes:

| Camada            | Exemplos                                     | O que significa                                                       |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Provedor          | `openai`, `anthropic`, `github-copilot`      | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo.  |
| Modelo            | `gpt-5.5`, `claude-opus-4-6`                 | O modelo selecionado para o turno do agente.                          |
| Runtime de agente | `openclaw`, `codex`, `copilot`, `claude-cli` | O loop ou backend de baixo nível que executa o turno preparado.       |
| Canal             | Telegram, Discord, Slack, WhatsApp           | Onde as mensagens entram e saem do OpenClaw.                          |

Você também verá a palavra **harness** no código. Um harness é a implementação
que fornece um runtime de agente. Por exemplo, o harness Codex incluído
implementa o runtime `codex`. A configuração pública usa `agentRuntime.id` em
entradas de provedor ou modelo; chaves de runtime para agente inteiro são legadas e ignoradas.
`openclaw doctor --fix` remove pins antigos de runtime para agente inteiro e reescreve
refs de modelo de runtime legadas para refs canônicas de provedor/modelo mais política
de runtime com escopo de modelo quando necessário.

Há duas famílias de runtime:

- **Harnesses embutidos** rodam dentro do loop de agente preparado do OpenClaw. Hoje isso
  é o runtime `openclaw` integrado, além de harnesses de Plugin registrados, como
  `codex` e `copilot`.
- **Backends de CLI** rodam um processo de CLI local mantendo a ref de modelo
  canônica. Por exemplo, `anthropic/claude-opus-4-8` com
  um `agentRuntime.id: "claude-cli"` com escopo de modelo significa "selecionar o modelo
  da Anthropic, executar por meio do Claude CLI." `claude-cli` não é um id de harness
  embutido e não deve ser passado para a seleção de AgentHarness.

O harness `copilot` é um harness de Plugin externo separado e opcional para a
GitHub Copilot CLI; consulte [runtime de agente do GitHub Copilot](/pt-BR/plugins/copilot)
para a decisão voltada ao usuário entre PI, Codex e runtime de agente do GitHub Copilot.

## Superfícies do Codex

A maior parte da confusão vem de várias superfícies diferentes que compartilham o nome Codex:

| Superfície                                      | Nome/configuração no OpenClaw          | O que faz                                                                                                      |
| ----------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de app-server do Codex           | refs de modelo `openai/*`              | Executa turnos de agente embutidos da OpenAI por meio do app-server do Codex. Esta é a configuração usual de assinatura ChatGPT/Codex. |
| Perfis de autenticação OAuth do Codex           | perfis OAuth `openai`                  | Armazena autenticação de assinatura ChatGPT/Codex consumida pelo harness de app-server do Codex.               |
| Adaptador ACP do Codex                          | `runtime: "acp"`, `agentId: "codex"`   | Executa o Codex por meio do plano de controle ACP/acpx externo. Use apenas quando ACP/acpx for solicitado explicitamente. |
| Conjunto de comandos nativos de controle por chat do Codex | `/codex ...`                 | Vincula, retoma, orienta, interrompe e inspeciona threads do app-server do Codex pelo chat.                    |
| Rota da OpenAI Platform API para superfícies sem agente | `openai/*` mais autenticação por chave de API | Usada para APIs diretas da OpenAI, como imagens, embeddings, fala e tempo real.                                |

Essas superfícies são intencionalmente independentes. Habilitar o Plugin `codex` torna
os recursos nativos de app-server disponíveis; `openclaw doctor --fix` é responsável pelo
reparo de rotas Codex legadas e pela limpeza de pins de sessão obsoletos. Selecionar
`openai/*` para um modelo de agente agora significa "executar isto pelo Codex", a menos que
uma superfície de OpenAI API sem agente esteja sendo usada.

A configuração comum de assinatura ChatGPT/Codex usa OAuth do Codex para autenticação, mas mantém
a ref de modelo como `openai/*` e seleciona o runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Isso significa que o OpenClaw seleciona uma ref de modelo da OpenAI e então pede ao runtime
de app-server do Codex para executar o turno de agente embutido. Isso não significa "usar
cobrança de API", e não significa que o canal, o catálogo de provedores de modelo ou o
armazenamento de sessão do OpenClaw se tornem Codex.

Quando o Plugin `codex` incluído está habilitado, o controle do Codex em linguagem natural
deve usar a superfície de comando nativa `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP. Use ACP para
Codex apenas quando o usuário pedir explicitamente ACP/acpx ou estiver testando o caminho
do adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harnesses externos
semelhantes ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **bind/control/thread/resume/steer/stop do Codex**, use a
   superfície de comando nativa `/codex` quando o Plugin `codex` incluído estiver habilitado.
2. Se o usuário pedir **Codex como runtime embutido** ou quiser a experiência normal
   de agente Codex com assinatura, use `openai/<model>`.
3. Se o usuário escolher explicitamente **OpenClaw para um modelo OpenAI**, mantenha a ref de modelo
   como `openai/<model>` e defina a política de runtime de provedor/modelo como
   `agentRuntime.id: "openclaw"`. Um perfil OAuth `openai` selecionado é roteado
   internamente pelo transporte de autenticação Codex do OpenClaw.
4. Se a configuração legada ainda contiver **refs de modelo Codex legadas**, repare-a para
   `openai/<model>` com `openclaw doctor --fix`; o doctor mantém a rota de autenticação Codex
   adicionando `agentRuntime.id: "codex"` com escopo de provedor/modelo onde a
   ref de modelo antiga implicava isso.
   Refs de modelo **`codex-cli/*` legadas** são reparadas para a mesma rota de app-server Codex
   `openai/<model>`; o OpenClaw não mantém mais um backend Codex CLI incluído.
5. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP do Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
6. Se a solicitação for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro harness externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                       | Use...                                      |
| ---------------------------------------- | ------------------------------------------- |
| Controle de chat/thread do app-server do Codex | `/codex ...` do Plugin `codex` incluído |
| Runtime de agente embutido do app-server do Codex | refs de modelo de agente `openai/*` |
| OAuth OpenAI Codex                       | perfis OAuth `openai`                       |
| Claude Code ou outro harness externo     | ACP/acpx                                    |

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do runtime
Codex, consulte [runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes controlam partes diferentes do loop.

| Superfície                 | OpenClaw embutido                              | App-server do Codex                                                        |
| -------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Dono do loop de modelo     | OpenClaw por meio do executor embutido do OpenClaw | App-server do Codex                                                     |
| Estado canônico da thread  | Transcrição do OpenClaw                        | Thread do Codex, mais espelho da transcrição do OpenClaw                   |
| Ferramentas dinâmicas do OpenClaw | Loop de ferramentas nativo do OpenClaw | Encaminhadas por meio do adaptador Codex                                   |
| Ferramentas nativas de shell e arquivo | Caminho do OpenClaw              | Ferramentas nativas do Codex, encaminhadas por hooks nativos quando suportado |
| Motor de contexto          | Montagem de contexto nativa do OpenClaw        | O OpenClaw projeta o contexto montado para o turno do Codex                |
| Compaction                 | OpenClaw ou motor de contexto selecionado      | Compaction nativa do Codex, com notificações do OpenClaw e manutenção de espelho |
| Entrega por canal          | OpenClaw                                       | OpenClaw                                                                   |

Esta divisão de propriedade é a principal regra de design:

- Se o OpenClaw controla a superfície, o OpenClaw pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo controla a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo controla o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever internos sem suporte.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provedor e modelo:

1. A política de runtime com escopo de modelo vence. Ela pode existir em uma entrada de modelo
   de provedor configurado ou em `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Um curinga de provedor
   como `agents.defaults.models["vllm/*"].agentRuntime` se aplica após a política
   de modelo exata, para que modelos de provedor descobertos dinamicamente possam compartilhar um
   runtime sem substituir exceções exatas por modelo.
2. A política de runtime com escopo de provedor vem em seguida em
   `models.providers.<provider>.agentRuntime`.
3. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares de provedor/modelo
   suportados.
4. Se nenhum runtime reivindicar um turno no modo `auto`, o OpenClaw usa `openclaw` como
   runtime de compatibilidade. Use um id de runtime explícito quando a execução precisar ser
   estrita.

Pins de runtime para sessão inteira e agente inteiro são ignorados. Isso inclui
`OPENCLAW_AGENT_RUNTIME`, estado de sessão `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` e `agents.list[].agentRuntime`. Execute
`openclaw doctor --fix` para remover configuração obsoleta de runtime para agente inteiro e converter
refs de modelo de runtime legadas onde o OpenClaw conseguir preservar a intenção.

Runtimes de Plugin explícitos em provedor/modelo falham de forma fechada. Por exemplo,
`agentRuntime.id: "codex"` em um provedor ou modelo significa Codex ou um erro claro
de seleção/runtime; ele nunca é roteado silenciosamente de volta para o OpenClaw.

Aliases de backend de CLI são diferentes de ids de harness embutido. A forma preferida
para Claude CLI é:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Refs legadas como `claude-cli/claude-opus-4-7` continuam suportadas por
compatibilidade, mas novas configurações devem manter o provedor/modelo canônico e colocar
o backend de execução na política de runtime de provedor/modelo.

Refs `codex-cli/*` legadas são diferentes: o doctor as migra para `openai/*` para que
elas rodem pelo harness de app-server do Codex em vez de preservar um backend Codex CLI.

O modo `auto` é intencionalmente conservador para a maioria dos provedores. Modelos de agente
OpenAI são a exceção: runtime não definido e `auto` ambos resolvem para o harness Codex.
A configuração explícita de runtime OpenClaw continua sendo uma rota de compatibilidade opcional para
turnos de agente `openai/*`; quando pareada com um perfil OAuth `openai` selecionado,
o OpenClaw roteia esse caminho internamente pelo transporte de autenticação Codex, mantendo
a ref pública de modelo como `openai/*`. Pins obsoletos de sessão de runtime OpenAI são
ignorados pela seleção de runtime e podem ser limpos com `openclaw doctor --fix`.

Se `openclaw doctor` avisar que o Plugin `codex` está habilitado enquanto
refs de modelo Codex legadas permanecem na configuração, trate isso como estado de rota legado. Execute
`openclaw doctor --fix` para reescrevê-lo para `openai/*` com o runtime Codex.

## Runtime do agente GitHub Copilot

O Plugin externo `@openclaw/copilot` registra um runtime `copilot` opcional
baseado na CLI do GitHub Copilot (`@github/copilot-sdk`). Ele reivindica o
provedor de assinatura canônico `github-copilot` e **nunca** é selecionado por
`auto`. Opte por modelo ou por provedor via `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

O harness reivindica seu provedor, runtime, chave de sessão da CLI e prefixo de perfil de autenticação
em `extensions/copilot/doctor-contract-api.ts`, que o
`openclaw doctor` carrega automaticamente. Para configuração, autenticação, espelhamento de transcrições,
Compaction, o contrato declarativo do doctor e a decisão mais ampla entre PI, Codex e
Copilot SDK, consulte [Runtime do agente GitHub Copilot](/pt-BR/plugins/copilot).

## Contrato de compatibilidade

Quando um runtime não é OpenClaw, ele deve documentar quais superfícies do OpenClaw ele oferece suporte.
Use este formato para a documentação de runtime:

| Pergunta                               | Por que isso importa                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Quem é responsável pelo loop de modelo?               | Determina onde acontecem as novas tentativas, a continuação de ferramentas e as decisões de resposta final.                   |
| Quem é responsável pelo histórico canônico da thread?     | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                                   |
| As ferramentas dinâmicas do OpenClaw funcionam?        | Mensagens, sessões, Cron e ferramentas pertencentes ao OpenClaw dependem disso.                                 |
| Os hooks de ferramentas dinâmicas funcionam?            | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno das ferramentas pertencentes ao OpenClaw. |
| Os hooks de ferramentas nativas funcionam?             | Shell, patch e ferramentas pertencentes ao runtime precisam de suporte a hooks nativos para política e observação.        |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem dos ciclos de vida de montagem, ingestão, pós-turno e Compaction.      |
| Quais dados de Compaction são expostos?       | Alguns Plugins precisam apenas de notificações, enquanto outros precisam de metadados mantidos/descartados.                    |
| O que não é suportado intencionalmente?     | Usuários não devem presumir equivalência com o OpenClaw quando o runtime nativo possui mais estado.            |

O contrato de suporte do runtime Codex está documentado em
[Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Leia-os como
diagnósticos, não como nomes de provedores.

- Uma ref de modelo como `openai/gpt-5.5` informa o provedor/modelo selecionado.
- Um ID de runtime como `codex` informa qual loop está executando o turno.
- Um rótulo de canal como Telegram ou Discord informa onde a conversa está acontecendo.

Se uma execução ainda mostrar um runtime inesperado, inspecione primeiro a política de runtime
do provedor/modelo selecionado. Pins de runtime de sessão legados não decidem mais o roteamento.

## Relacionado

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Runtime do agente GitHub Copilot](/pt-BR/plugins/copilot)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

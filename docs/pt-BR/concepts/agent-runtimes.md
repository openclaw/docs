---
read_when:
    - Você está escolhendo entre PI, Codex, ACP ou outro runtime de agente nativo
    - Você se confunde com os rótulos de provedor/modelo/tempo de execução no status ou na configuração
    - Você está documentando a paridade de suporte para um ambiente nativo
summary: Como o OpenClaw separa provedores de modelos, modelos, canais e ambientes de execução de agentes
title: Ambientes de execução de agentes
x-i18n:
    generated_at: "2026-05-10T19:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** é o componente que possui um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, lida com chamadas de ferramentas
nativas e retorna o turno finalizado ao OpenClaw.

Runtimes são fáceis de confundir com provedores porque ambos aparecem perto da
configuração de modelo. Eles são camadas diferentes:

| Camada        | Exemplos                              | O que significa                                                     |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provedor      | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo. |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para o turno do agente.                        |
| Runtime de agente | `pi`, `codex`, `claude-cli`       | O loop ou backend de baixo nível que executa o turno preparado.      |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                        |

Você também verá a palavra **harness** no código. Um harness é a implementação
que fornece um runtime de agente. Por exemplo, o harness Codex incluído
implementa o runtime `codex`. A configuração pública usa `agentRuntime.id` em
entradas de provedor ou modelo; chaves de runtime de agente inteiro são legadas
e ignoradas. `openclaw doctor --fix` remove pins antigos de runtime de agente
inteiro e reescreve refs de modelo de runtime legadas para refs canônicas de
provedor/modelo mais política de runtime com escopo de modelo quando necessário.

Há duas famílias de runtime:

- **Harnesses embutidos** são executados dentro do loop de agente preparado do
  OpenClaw. Hoje, isso é o runtime `pi` integrado mais harnesses de Plugin
  registrados, como `codex`.
- **Backends de CLI** executam um processo de CLI local mantendo a ref de modelo
  canônica. Por exemplo, `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` com escopo de modelo significa "selecionar o
  modelo Anthropic, executar por meio da Claude CLI." `claude-cli` não é um id
  de harness embutido e não deve ser passado para a seleção de AgentHarness.

## Superfícies do Codex

A maior parte da confusão vem de várias superfícies diferentes que compartilham o nome Codex:

| Superfície                                      | Nome/configuração no OpenClaw          | O que faz                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de servidor de aplicativo Codex | refs de modelo `openai/*`            | Executa turnos de agente embutidos da OpenAI por meio do servidor de aplicativo Codex. Esta é a configuração usual de assinatura ChatGPT/Codex. |
| Perfis de autenticação OAuth do Codex          | provedor de autenticação `openai-codex` | Armazena autenticação de assinatura ChatGPT/Codex que o harness do servidor de aplicativo Codex consome.       |
| Adaptador ACP do Codex                         | `runtime: "acp"`, `agentId: "codex"` | Executa o Codex pelo plano de controle externo ACP/acpx. Use somente quando ACP/acpx for solicitado explicitamente. |
| Conjunto nativo de comandos de controle de chat do Codex | `/codex ...`                  | Vincula, retoma, direciona, interrompe e inspeciona threads do servidor de aplicativo Codex a partir do chat. |
| Rota da API da Plataforma OpenAI para superfícies que não são de agente | `openai/*` mais autenticação por chave de API | Usada para APIs diretas da OpenAI, como imagens, embeddings, fala e tempo real.                                |

Essas superfícies são intencionalmente independentes. Habilitar o Plugin `codex`
torna os recursos nativos do servidor de aplicativo disponíveis; `openclaw doctor --fix`
é responsável pelo reparo de rotas legadas `openai-codex/*` e pela limpeza de
pins de sessão obsoletos. Selecionar `openai/*` para um modelo de agente agora
significa "executar isto pelo Codex", a menos que uma superfície de API OpenAI
que não seja de agente esteja sendo usada.

A configuração comum de assinatura ChatGPT/Codex usa OAuth do Codex para
autenticação, mas mantém a ref de modelo como `openai/*` e seleciona o runtime
`codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Isso significa que o OpenClaw seleciona uma ref de modelo OpenAI e então pede ao
runtime do servidor de aplicativo Codex para executar o turno de agente
embutido. Isso não significa "usar cobrança por API", e não significa que o
canal, o catálogo do provedor de modelos ou o armazenamento de sessão do
OpenClaw se tornam Codex.

Quando o Plugin `codex` incluído está habilitado, o controle do Codex em
linguagem natural deve usar a superfície nativa de comando `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP. Use ACP para
Codex somente quando o usuário pedir explicitamente ACP/acpx ou estiver testando
o caminho do adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor e
harnesses externos semelhantes ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **vincular/controlar/thread/retomar/direcionar/parar Codex**, use a
   superfície nativa de comando `/codex` quando o Plugin `codex` incluído estiver habilitado.
2. Se o usuário pedir **Codex como o runtime embutido** ou quiser a experiência
   normal de agente Codex respaldada por assinatura, use `openai/<model>`.
3. Se o usuário escolher explicitamente **PI para um modelo OpenAI**, mantenha a ref de modelo
   como `openai/<model>` e defina a política de runtime de provedor/modelo como
   `agentRuntime.id: "pi"`. Um perfil de autenticação `openai-codex` selecionado é roteado
   internamente pelo transporte legado de autenticação Codex do PI.
4. Se a configuração legada ainda contiver **refs de modelo `openai-codex/*`**, repare-a para
   `openai/<model>` com `openclaw doctor --fix`; o doctor mantém a rota de autenticação Codex
   adicionando `agentRuntime.id: "codex"` com escopo de provedor/modelo onde a
   ref de modelo antiga o implicava.
5. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP do Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
6. Se a solicitação for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro harness externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                         | Use...                                      |
| ------------------------------------------ | ------------------------------------------- |
| Controle de chat/thread do servidor de aplicativo Codex | `/codex ...` do Plugin `codex` incluído |
| Runtime de agente embutido do servidor de aplicativo Codex | refs de modelo de agente `openai/*` |
| OAuth Codex da OpenAI                      | perfis de autenticação `openai-codex`       |
| Claude Code ou outro harness externo       | ACP/acpx                                    |

Para a divisão de prefixos da família OpenAI, veja [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do
runtime Codex, veja [runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes possuem partes diferentes do loop.

| Superfície                  | PI embutido do OpenClaw                 | Servidor de aplicativo Codex                                                   |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Proprietário do loop de modelo | OpenClaw por meio do executor PI embutido | Servidor de aplicativo Codex                                               |
| Estado canônico da thread   | Transcrição do OpenClaw                 | Thread do Codex, mais espelho da transcrição do OpenClaw                    |
| Ferramentas dinâmicas do OpenClaw | Loop nativo de ferramentas do OpenClaw | Encaminhadas pela ponte por meio do adaptador Codex                         |
| Ferramentas nativas de shell e arquivo | Caminho PI/OpenClaw          | Ferramentas nativas do Codex, encaminhadas por hooks nativos onde houver suporte |
| Mecanismo de contexto       | Montagem nativa de contexto do OpenClaw | O OpenClaw projeta o contexto montado no turno do Codex                     |
| Compaction                  | OpenClaw ou mecanismo de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção de espelho |
| Entrega de canal            | OpenClaw                                | OpenClaw                                                                    |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw possui a superfície, o OpenClaw pode fornecer comportamento normal de hooks de Plugin.
- Se o runtime nativo possui a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo possui o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever internals sem suporte.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provedor e modelo:

1. A política de runtime com escopo de modelo vence. Ela pode existir em uma entrada de modelo
   de provedor configurada ou em `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. A política de runtime com escopo de provedor vem em seguida em
   `models.providers.<provider>.agentRuntime`.
3. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares
   provedor/modelo compatíveis.
4. Se nenhum runtime reivindicar um turno no modo `auto`, o OpenClaw usa PI como
   runtime de compatibilidade. Use um id de runtime explícito quando a execução precisar ser
   estrita.

Pins de runtime de sessão inteira e agente inteiro são ignorados. Isso inclui
`OPENCLAW_AGENT_RUNTIME`, estado de sessão `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` e `agents.list[].agentRuntime`. Execute
`openclaw doctor --fix` para remover configuração obsoleta de runtime de agente inteiro e converter
refs de modelo de runtime legadas onde o OpenClaw puder preservar a intenção.

Runtimes de Plugin explícitos de provedor/modelo falham de forma fechada. Por exemplo,
`agentRuntime.id: "codex"` em um provedor ou modelo significa Codex ou um erro claro
de seleção/runtime; ele nunca é roteado silenciosamente de volta para PI.

Aliases de backend de CLI são diferentes de ids de harness embutido. A forma
preferida da Claude CLI é:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Refs legadas como `claude-cli/claude-opus-4-7` continuam com suporte para
compatibilidade, mas novas configurações devem manter o provedor/modelo canônico
e colocar o backend de execução na política de runtime de provedor/modelo.

O modo `auto` é intencionalmente conservador para a maioria dos provedores. Modelos de agente
OpenAI são a exceção: runtime não definido e `auto` ambos resolvem para o harness
Codex. A configuração explícita de runtime PI continua sendo uma rota de
compatibilidade opt-in para turnos de agente `openai/*`; quando pareada com um perfil
de autenticação `openai-codex` selecionado, o OpenClaw roteia o PI internamente pelo
transporte legado de autenticação Codex, mantendo a ref de modelo pública como
`openai/*`. Pins de sessão PI OpenAI obsoletos são ignorados pela seleção de runtime
e podem ser limpos com `openclaw doctor --fix`.

Se `openclaw doctor` avisar que o Plugin `codex` está habilitado enquanto
`openai-codex/*` permanece na configuração, trate isso como estado de rota legada. Execute
`openclaw doctor --fix` para reescrevê-lo para `openai/*` com o runtime Codex.

## Contrato de compatibilidade

Quando um runtime não é PI, ele deve documentar quais superfícies do OpenClaw ele oferece suporte.
Use este formato para docs de runtime:

| Pergunta                              | Por que isso importa                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Quem controla o loop do modelo?       | Determina onde acontecem as novas tentativas, a continuação de ferramentas e as decisões de resposta final. |
| Quem controla o histórico canônico da conversa? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                                  |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, cron e ferramentas controladas pelo OpenClaw dependem disso.                       |
| Os hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno de ferramentas controladas pelo OpenClaw. |
| Os hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas controladas pelo runtime precisam de suporte nativo a hooks para política e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem do ciclo de vida de montagem, ingestão, pós-turno e Compaction. |
| Quais dados de Compaction são expostos? | Alguns plugins só precisam de notificações, enquanto outros precisam de metadados mantidos/descartados. |
| O que é intencionalmente sem suporte? | Os usuários não devem presumir equivalência com PI quando o runtime nativo controla mais estado.        |

O contrato de suporte do runtime do Codex está documentado em
[runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Leia-os como
diagnósticos, não como nomes de provedores.

- Uma referência de modelo como `openai/gpt-5.5` informa o provedor/modelo selecionado.
- Um ID de runtime como `codex` informa qual loop está executando o turno.
- Um rótulo de canal como Telegram ou Discord informa onde a conversa está acontecendo.

Se uma execução ainda mostrar um runtime inesperado, inspecione primeiro a política de runtime
do provedor/modelo selecionado. Fixações de runtime de sessões legadas não decidem mais o roteamento.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop do agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

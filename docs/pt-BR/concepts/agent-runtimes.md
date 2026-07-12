---
read_when:
    - Você está escolhendo entre OpenClaw, Codex, ACP ou outro ambiente de execução nativo de agente
    - Você está confuso com os rótulos de provedor/modelo/ambiente de execução no status ou na configuração
    - Você está documentando a equivalência de suporte para um harness nativo
summary: Como o OpenClaw separa provedores de modelos, modelos, canais e ambientes de execução de agentes
title: Runtimes de agentes
x-i18n:
    generated_at: "2026-07-11T23:51:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** controla um loop de modelo preparado: ele recebe o prompt,
conduz a saída do modelo, processa chamadas de ferramentas nativas e retorna o turno
concluído ao OpenClaw.

É fácil confundir runtimes com provedores porque ambos aparecem próximos à
configuração do modelo. Eles são camadas diferentes:

| Camada            | Exemplos                                     | Significado                                                                  |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Provedor          | `anthropic`, `github-copilot`, `openai`      | Como o OpenClaw autentica, descobre modelos e nomeia referências de modelos. |
| Modelo            | `claude-opus-4-6`, `gpt-5.6-sol`             | O modelo selecionado para o turno do agente.                                 |
| Runtime de agente | `claude-cli`, `codex`, `copilot`, `openclaw` | O loop de baixo nível ou backend que executa o turno preparado.              |
| Canal             | Discord, Slack, Telegram, WhatsApp           | Por onde as mensagens entram e saem do OpenClaw.                             |

Um **harness** é a implementação que fornece um runtime de agente (termo de
código). Por exemplo, o harness integrado do Codex implementa o runtime `codex`.
A configuração pública usa `agentRuntime.id` nas entradas de provedor ou modelo; as
chaves de runtime do agente inteiro são legadas e ignoradas. `openclaw doctor --fix`
remove pins antigos de runtime do agente inteiro e reescreve referências legadas de
modelos de runtime como referências canônicas de provedor/modelo, além de políticas
de runtime no escopo do modelo quando necessário.

Duas famílias de runtime:

- **Harnesses incorporados** são executados dentro do loop de agente preparado do
  OpenClaw: o runtime integrado `openclaw`, além de harnesses de plugins registrados,
  como `codex` e `copilot`.
- **Backends de CLI** executam um processo de CLI local enquanto mantêm a referência
  do modelo canônica. Por exemplo, `anthropic/claude-opus-4-8` com
  `agentRuntime.id: "claude-cli"` no escopo do modelo significa "selecionar o modelo
  da Anthropic e executar por meio da Claude CLI". `claude-cli` não é um id de
  harness incorporado e não deve ser passado para a seleção de AgentHarness.

O harness `copilot` é um harness de plugin externo separado e opcional para a
GitHub Copilot CLI; consulte [Runtime de agente do GitHub Copilot](/pt-BR/plugins/copilot)
para ver a decisão voltada ao usuário entre os runtimes de agente PI, Codex e
GitHub Copilot.

## Superfícies do Codex

Várias superfícies compartilham o nome Codex:

| Superfície                                          | Nome/configuração no OpenClaw        | O que faz                                                                                                                        |
| --------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Runtime nativo do app-server do Codex               | Referências de modelo `openai/*`     | Executa turnos de agente incorporados da OpenAI por meio do app-server do Codex. Essa é a configuração habitual da assinatura do ChatGPT/Codex. |
| Perfis de autenticação OAuth do Codex                | Perfis OAuth `openai`                | Armazena a autenticação da assinatura do ChatGPT/Codex consumida pelo harness do app-server do Codex.                            |
| Adaptador ACP do Codex                              | `runtime: "acp"`, `agentId: "codex"` | Executa o Codex por meio do plano de controle externo ACP/acpx. Use somente quando ACP/acpx for solicitado explicitamente.       |
| Conjunto nativo de comandos de controle de chat do Codex | `/codex ...`                    | Vincula, retoma, direciona, interrompe e inspeciona threads do app-server do Codex pelo chat.                                    |
| Rota da API da Plataforma OpenAI para superfícies que não são de agente | `openai/*` mais autenticação por chave de API | APIs diretas da OpenAI, como imagens, embeddings, fala e tempo real.                                            |

Essas superfícies são intencionalmente independentes. Ativar o plugin `codex`
disponibiliza os recursos nativos do app-server; `openclaw doctor --fix` é
responsável pelo reparo de rotas legadas do Codex e pela limpeza de pins obsoletos
de sessão. Selecionar `openai/*` para um modelo de agente agora significa "executar
isto por meio do Codex", a menos que uma superfície de API da OpenAI que não seja de
agente esteja sendo usada.

A configuração comum de assinatura do ChatGPT/Codex usa OAuth do Codex para
autenticação, mas mantém a referência do modelo como `openai/*` e seleciona o
runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Isso significa que o OpenClaw seleciona uma referência de modelo da OpenAI e, em
seguida, solicita que o runtime do app-server do Codex execute o turno de agente
incorporado. Não significa "usar cobrança da API", nem que o canal, o catálogo de
provedores de modelos ou o armazenamento de sessões do OpenClaw se tornem Codex.

Quando o plugin integrado `codex` estiver ativado, use a superfície nativa de
comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) para controlar o Codex em linguagem natural, em vez de usar ACP. Use
ACP para o Codex somente quando o usuário solicitar explicitamente ACP/acpx ou
estiver testando o caminho do adaptador ACP. Claude Code, Gemini CLI, OpenCode,
Cursor e harnesses externos semelhantes continuam usando ACP.

Árvore de decisão:

1. **Vincular/controlar/thread/retomar/direcionar/interromper no Codex** -> superfície nativa de comandos `/codex` quando o plugin integrado `codex` estiver ativado.
2. **Codex como runtime incorporado** ou a experiência normal de agente Codex baseada em assinatura -> `openai/<model>`.
3. **OpenClaw escolhido explicitamente para um modelo da OpenAI** -> mantenha a referência do modelo como `openai/<model>` e defina a política de runtime do provedor/modelo como `agentRuntime.id: "openclaw"`. Um perfil OAuth `openai` selecionado é roteado internamente pelo transporte de autenticação do Codex do OpenClaw.
4. **Referências legadas de modelos Codex na configuração** -> repare com `openclaw doctor --fix` para `openai/<model>`; o doctor mantém a rota de autenticação do Codex adicionando `agentRuntime.id: "codex"` no escopo do provedor/modelo quando a referência antiga do modelo implicava isso. Referências legadas de modelos **`codex-cli/*`** são reparadas para a mesma rota `openai/<model>` do app-server do Codex; o OpenClaw não mantém mais um backend integrado da Codex CLI.
5. **ACP, acpx ou adaptador ACP do Codex solicitado explicitamente** -> `runtime: "acp"` e `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou outro harness externo** -> ACP/acpx, não o runtime nativo de subagentes.

| Você quer dizer...                         | Use...                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Controle de chat/thread do app-server do Codex | `/codex ...` do plugin integrado `codex`         |
| Runtime de agente incorporado do app-server do Codex | Referências de modelo de agente `openai/*` |
| OAuth do OpenAI Codex                      | Perfis OAuth `openai`                                |
| Claude Code ou outro harness externo       | ACP/acpx                                             |

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelos](/pt-BR/concepts/model-providers). Para o contrato de suporte do
runtime Codex, consulte [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Responsabilidade do runtime

Runtimes diferentes controlam partes diferentes do loop:

| Superfície                       | Incorporado ao OpenClaw                                  | App-server do Codex                                                                  |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Responsável pelo loop do modelo  | OpenClaw, por meio do executor incorporado do OpenClaw   | App-server do Codex                                                                  |
| Estado canônico da thread        | Transcrição do OpenClaw                                  | Thread do Codex, mais o espelho da transcrição do OpenClaw                           |
| Ferramentas dinâmicas do OpenClaw | Loop de ferramentas nativo do OpenClaw                  | Intermediadas pelo adaptador do Codex                                                 |
| Ferramentas nativas de shell e arquivos | Caminho do OpenClaw                              | Ferramentas nativas do Codex, intermediadas por hooks nativos quando houver suporte  |
| Mecanismo de contexto            | Montagem nativa de contexto do OpenClaw                  | O OpenClaw projeta o contexto montado no turno do Codex                               |
| Compaction                       | OpenClaw ou mecanismo de contexto selecionado            | Compaction nativa do Codex, com notificações do OpenClaw e manutenção do espelho     |
| Entrega pelo canal               | OpenClaw                                                 | OpenClaw                                                                             |

Regra de design: se o OpenClaw controla a superfície, ele pode fornecer o
comportamento normal de hooks de plugins. Se o runtime nativo controla a superfície,
o OpenClaw precisa de eventos de runtime ou hooks nativos. Se o runtime nativo
controla o estado canônico da thread, o OpenClaw espelha e projeta o contexto, em vez
de reescrever componentes internos sem suporte.

## Seleção de runtime

O OpenClaw resolve um runtime incorporado após a resolução do provedor e do modelo,
nesta ordem:

1. A **política de runtime no escopo do modelo** prevalece. Ela fica em uma entrada
   configurada de modelo do provedor ou em
   `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Um curinga de provedor,
   como `agents.defaults.models["vllm/*"].agentRuntime`, é aplicado após a política
   exata do modelo, permitindo que modelos de provedor descobertos dinamicamente
   compartilhem um runtime sem substituir exceções exatas por modelo.
2. **Política de runtime no escopo do provedor**: `models.providers.<provider>.agentRuntime`.
3. **Modo `auto`**: runtimes de plugins registrados podem reivindicar pares de provedor/modelo compatíveis.
4. Se nenhum runtime reivindicar o turno no modo `auto`, o OpenClaw usa `openclaw`
   como runtime de compatibilidade. Use um id de runtime explícito quando a execução
   precisar ser estrita.

Pins de runtime para a sessão inteira e o agente inteiro são ignorados:
`OPENCLAW_AGENT_RUNTIME`, o estado de sessão `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` e `agents.list[].agentRuntime`. Execute
`openclaw doctor --fix` para remover configurações obsoletas de runtime do agente
inteiro e converter referências legadas de modelos de runtime quando for possível
preservar a intenção.

Runtimes explícitos de plugins no escopo do provedor/modelo falham de forma
restritiva: `agentRuntime.id: "codex"` em um provedor ou modelo significa Codex ou
um erro claro de seleção/runtime — ele nunca é roteado silenciosamente de volta ao
OpenClaw. Somente `auto` pode rotear um turno sem correspondência para o OpenClaw.

Aliases de backends de CLI são diferentes de ids de harnesses incorporados. Forma
preferencial para a Claude CLI:

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

Referências legadas como `claude-cli/claude-opus-4-7` continuam compatíveis, mas
novas configurações devem manter o provedor/modelo canônico e colocar o backend de
execução na política de runtime do provedor/modelo.

As referências legadas `codex-cli/*` são diferentes: o doctor as migra para
`openai/*`, para que sejam executadas pelo harness do app-server do Codex, em vez de
preservar um backend da Codex CLI.

O modo `auto` é intencionalmente conservador para a maioria dos provedores. Os
modelos de agente da OpenAI são a exceção: tanto um runtime não definido quanto
`auto` são resolvidos para o harness Codex. A configuração explícita do runtime
OpenClaw continua sendo uma rota de compatibilidade opcional para turnos de agente
`openai/*`; quando combinada com um perfil OAuth `openai` selecionado, o OpenClaw
roteia esse caminho internamente pelo transporte de autenticação do Codex, mantendo
a referência pública do modelo como `openai/*`. Pins obsoletos de sessão de runtime
da OpenAI são ignorados pela seleção de runtime e podem ser removidos com
`openclaw doctor --fix`.

Se `openclaw doctor` avisar que o plugin `codex` está ativado enquanto referências
legadas de modelos Codex permanecem na configuração, trate isso como estado de rota
legada e execute `openclaw doctor --fix` para reescrevê-las como `openai/*` com o
runtime Codex.

## Runtime de agente do GitHub Copilot

O plugin externo `@openclaw/copilot` registra um runtime `copilot` opcional
baseado na CLI do GitHub Copilot (`@github/copilot-sdk`). Ele reivindica o
provedor canônico de assinatura `github-copilot` e **nunca** é selecionado por
`auto`. Ative-o por modelo ou por provedor por meio de `agentRuntime.id`:

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

O harness reivindica seu provedor, runtime, chave de sessão da CLI e prefixo
do perfil de autenticação em `extensions/copilot/doctor-contract-api.ts`, que
o `openclaw doctor` carrega automaticamente. Para saber mais sobre configuração,
autenticação, espelhamento de transcrições, Compaction, o contrato declarativo
do doctor e a decisão mais ampla entre os SDKs do PI, Codex e Copilot, consulte
[runtime de agente do GitHub Copilot](/pt-BR/plugins/copilot).

## Contrato de compatibilidade

Quando um runtime não é do OpenClaw, sua documentação deve declarar quais
recursos do OpenClaw ele oferece:

| Pergunta | Por que isso é importante |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Quem controla o loop do modelo? | Determina onde ocorrem as novas tentativas, a continuação de ferramentas e as decisões sobre a resposta final. |
| Quem controla o histórico canônico da thread? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo. |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, Cron e ferramentas controladas pelo OpenClaw dependem disso. |
| Os hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno das ferramentas controladas pelo OpenClaw. |
| Os hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas controladas pelo runtime precisam de suporte nativo a hooks para aplicação de políticas e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem dos ciclos de vida de montagem, ingestão, pós-turno e Compaction. |
| Quais dados de Compaction são expostos? | Alguns Plugins precisam apenas de notificações; outros precisam de metadados sobre o que foi mantido ou descartado. |
| O que não tem suporte intencionalmente? | Os usuários não devem presumir equivalência com o OpenClaw quando o runtime nativo controla mais estados. |

O contrato de suporte do runtime Codex está documentado em
[runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

## Rótulos de status

A saída de status pode exibir os rótulos `Execution` e `Runtime`. Interprete-os
como diagnósticos, não como nomes de provedores:

- Uma referência de modelo como `openai/gpt-5.6-sol` é o provedor/modelo selecionado.
- Um ID de runtime como `codex` é o loop que está executando o turno.
- Um rótulo de canal como Telegram ou Discord indica onde a conversa está acontecendo.

Se uma execução mostrar um runtime inesperado, primeiro inspecione a política
de runtime do provedor/modelo selecionado. As antigas fixações de runtime da
sessão não determinam mais o roteamento.

## Relacionados

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Runtime de agente do GitHub Copilot](/pt-BR/plugins/copilot)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop do agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

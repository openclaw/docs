---
read_when:
    - Você está escolhendo entre PI, Codex, ACP ou outro ambiente de execução nativo de agente
    - Você está confuso com os rótulos de provedor/modelo/tempo de execução no status ou na configuração
    - Você está documentando a paridade de suporte para uma estrutura de testes nativa
summary: Como o OpenClaw separa provedores de modelos, modelos, canais e ambientes de execução de agentes
title: Ambientes de execução de agentes
x-i18n:
    generated_at: "2026-05-03T05:47:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** é o componente que possui um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, manipula chamadas de ferramenta nativas e retorna
a vez concluída para o OpenClaw.

Runtimes são fáceis de confundir com provedores porque ambos aparecem perto da
configuração de modelo. Eles são camadas diferentes:

| Camada        | Exemplos                              | O que significa                                                               |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Provedor      | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo.          |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para a vez do agente.                                    |
| Runtime de agente | `pi`, `codex`, `claude-cli`       | O loop ou backend de baixo nível que executa a vez preparada.                 |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                                  |

Você também verá a palavra **harness** no código. Um harness é a implementação
que fornece um runtime de agente. Por exemplo, o harness Codex incluído
implementa o runtime `codex`. A configuração pública usa `agentRuntime.id`; `openclaw
doctor --fix` reescreve chaves antigas de política de runtime para esse formato.

Há duas famílias de runtime:

- **Harnesses embutidos** são executados dentro do loop de agente preparado do OpenClaw. Hoje isso
  é o runtime `pi` integrado mais harnesses de Plugin registrados, como
  `codex`.
- **Backends de CLI** executam um processo de CLI local mantendo a ref de modelo
  canônica. Por exemplo, `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` significa "selecionar o modelo Anthropic, executar
  por meio da Claude CLI." `claude-cli` não é um id de harness embutido e não deve
  ser passado para a seleção de AgentHarness.

## Superfícies do Codex

A maior parte da confusão vem de várias superfícies diferentes compartilhando o nome Codex:

| Superfície                                            | Nome/configuração no OpenClaw              | O que faz                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de servidor de app Codex              | `openai/*` mais `agentRuntime.id: "codex"` | Executa a vez de agente embutida por meio do servidor de app Codex. Esta é a configuração usual de assinatura ChatGPT/Codex. |
| Rota de provedor OAuth Codex                         | refs de modelo `openai-codex/*`            | Usa OAuth de assinatura ChatGPT/Codex por meio do executor PI normal do OpenClaw.                              |
| Adaptador ACP Codex                                  | `runtime: "acp"`, `agentId: "codex"`       | Executa o Codex por meio do plano de controle ACP/acpx externo. Use apenas quando ACP/acpx for pedido explicitamente. |
| Conjunto de comandos nativo de controle de chat Codex | `/codex ...`                               | Vincula, retoma, direciona, interrompe e inspeciona threads do servidor de app Codex a partir do chat.         |
| Rota da API OpenAI Platform para modelos estilo GPT/Codex | refs de modelo `openai/*`              | Usa autenticação por chave de API da OpenAI, a menos que uma substituição de runtime, como `agentRuntime.id: "codex"`, execute a vez. |

Essas superfícies são intencionalmente independentes. Ativar o Plugin `codex` torna
os recursos nativos de servidor de app disponíveis; isso não reescreve
`openai-codex/*` para `openai/*`, não altera sessões existentes e não
torna o ACP o padrão do Codex. Selecionar `openai-codex/*` significa "usar a rota
de provedor OAuth Codex", a menos que você force separadamente um runtime.

A configuração comum de assinatura ChatGPT/Codex usa OAuth Codex para autenticação, mas mantém
a ref de modelo como `openai/*` e seleciona o runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Isso significa que o OpenClaw seleciona uma ref de modelo OpenAI e depois pede que o runtime
de servidor de app Codex execute a vez de agente embutida. Isso não significa "usar cobrança de API",
e não significa que o canal, o catálogo de provedores de modelo ou o armazenamento de sessões do OpenClaw
se tornam Codex.

Quando o Plugin `codex` incluído estiver ativado, o controle Codex em linguagem natural
deve usar a superfície de comando nativa `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP. Use ACP para
Codex apenas quando o usuário pedir explicitamente ACP/acpx ou estiver testando o caminho do
adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harnesses externos
semelhantes ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **vinculação/controle/thread/retomada/direcionamento/interrupção do Codex**, use a
   superfície de comando nativa `/codex` quando o Plugin `codex` incluído estiver ativado.
2. Se o usuário pedir **Codex como runtime embutido** ou quiser a experiência normal
   de agente Codex com suporte de assinatura, use
   `openai/<model>` com `agentRuntime.id: "codex"`.
3. Se o usuário pedir **autenticação OAuth/assinatura Codex no executor normal do OpenClaw**,
   use `openai-codex/<model>` e deixe o runtime como PI.
4. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
5. Se a solicitação for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro harness externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                     | Use...                                      |
| -------------------------------------- | ------------------------------------------ |
| Controle de chat/thread do servidor de app Codex | `/codex ...` do Plugin `codex` incluído |
| Runtime de agente embutido do servidor de app Codex | `agentRuntime.id: "codex"`             |
| OAuth OpenAI Codex no executor PI      | refs de modelo `openai-codex/*`            |
| Claude Code ou outro harness externo   | ACP/acpx                                   |

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do runtime Codex,
consulte [Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes possuem partes diferentes do loop.

| Superfície                  | OpenClaw PI embutido                    | Servidor de app Codex                                                        |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Dono do loop de modelo      | OpenClaw por meio do executor PI embutido | Servidor de app Codex                                                      |
| Estado canônico da thread   | Transcrição do OpenClaw                 | Thread do Codex, mais espelho da transcrição do OpenClaw                    |
| Ferramentas dinâmicas do OpenClaw | Loop de ferramentas nativo do OpenClaw | Interligadas por meio do adaptador Codex                                    |
| Ferramentas nativas de shell e arquivo | Caminho PI/OpenClaw           | Ferramentas nativas do Codex, interligadas por meio de hooks nativos quando compatível |
| Mecanismo de contexto       | Montagem de contexto nativa do OpenClaw | OpenClaw projeta o contexto montado para a vez do Codex                     |
| Compaction                  | OpenClaw ou mecanismo de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção de espelho |
| Entrega de canal            | OpenClaw                                | OpenClaw                                                                    |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw possui a superfície, o OpenClaw pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo possui a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo possui o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever componentes internos sem suporte.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provedor e modelo:

1. O runtime registrado de uma sessão tem prioridade. Alterações de configuração não trocam a quente uma
   transcrição existente para um sistema de thread nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força esse runtime para sessões novas ou redefinidas.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` pode definir
   `auto`, `pi`, um id de harness embutido registrado como `codex` ou um
   alias de backend de CLI compatível como `claude-cli`.
4. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares de provedor/modelo
   compatíveis.
5. Se nenhum runtime reivindicar uma vez no modo `auto`, o OpenClaw usa PI como o
   runtime de compatibilidade. Use um id de runtime explícito quando a execução precisar ser
   estrita.

Runtimes de Plugin explícitos falham de forma fechada. Por exemplo, `agentRuntime.id: "codex"`
significa Codex ou um erro claro de seleção/runtime; ele nunca é roteado silenciosamente de volta
para PI.

Aliases de backend de CLI são diferentes de ids de harness embutido. A forma preferida
para Claude CLI é:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Refs legadas como `claude-cli/claude-opus-4-7` continuam compatíveis para
compatibilidade, mas novas configurações devem manter o provedor/modelo canônico e colocar
o backend de execução em `agentRuntime.id`.

O modo `auto` é intencionalmente conservador. Runtimes de Plugin podem reivindicar
pares de provedor/modelo que entendem, mas o Plugin Codex não reivindica o
provedor `openai-codex` no modo `auto`. Isso mantém
`openai-codex/*` como a rota OAuth Codex PI explícita e evita mover silenciosamente
configurações com autenticação por assinatura para o harness nativo de servidor de app.

Se `openclaw doctor` avisar que o Plugin `codex` está ativado enquanto
`openai-codex/*` ainda é roteado por PI, trate isso como um diagnóstico, não como uma
migração. Mantenha a configuração inalterada quando OAuth Codex por PI for o que você quer.
Mude para `openai/<model>` mais `agentRuntime.id: "codex"` apenas quando quiser execução nativa
pelo servidor de app Codex.

## Contrato de compatibilidade

Quando um runtime não é PI, ele deve documentar quais superfícies do OpenClaw ele oferece suporte.
Use este formato para a documentação de runtime:

| Pergunta                              | Por que isso importa                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Quem possui o loop de modelo?         | Determina onde acontecem novas tentativas, continuação de ferramentas e decisões de resposta final. |
| Quem possui o histórico canônico da thread? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                         |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, cron e ferramentas de propriedade do OpenClaw dependem disso.          |
| Hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno de ferramentas de propriedade do OpenClaw. |
| Hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas de propriedade do runtime precisam de suporte a hooks nativos para política e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem de montagem, ingestão, pós-vez e ciclo de vida de compaction. |
| Quais dados de compaction são expostos? | Alguns Plugins precisam apenas de notificações, enquanto outros precisam de metadados mantidos/descartados. |
| O que é intencionalmente sem suporte? | Usuários não devem presumir equivalência com PI onde o runtime nativo possui mais estado.          |

O contrato de suporte do runtime Codex está documentado em
[Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Leia-os como
diagnósticos, não como nomes de provedores.

- Uma referência de modelo, como `openai/gpt-5.5`, informa o provedor/modelo selecionado.
- Um ID de runtime, como `codex`, informa qual loop está executando o turno.
- Um rótulo de canal, como Telegram ou Discord, informa onde a conversa está acontecendo.

Se uma sessão ainda mostrar PI após alterar a configuração de runtime, inicie uma nova sessão
com `/new` ou limpe a atual com `/reset`. Sessões existentes mantêm o runtime
registrado para que uma transcrição não seja reproduzida por dois sistemas de sessão nativos
incompatíveis.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop do agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

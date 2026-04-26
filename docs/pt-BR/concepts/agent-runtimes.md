---
read_when:
    - Você está escolhendo entre Pi, Codex, ACP ou outro runtime de agente nativo
    - Você está confuso com rótulos de provider/model/runtime em status ou configuração
    - Você está documentando a paridade de suporte para um harness nativo
summary: Como o OpenClaw separa providers de modelo, modelos, canais e runtimes de agente
title: Runtimes de agente
x-i18n:
    generated_at: "2026-04-26T11:26:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Um **runtime de agente** é o componente que controla um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, trata chamadas nativas de ferramentas e retorna
o turno concluído ao OpenClaw.

É fácil confundir runtimes com providers porque ambos aparecem perto da
configuração do modelo. São camadas diferentes:

| Camada        | Exemplos                              | O que significa                                                      |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo. |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para o turno do agente.                         |
| Runtime de agente | `pi`, `codex`, `claude-cli`       | O loop de baixo nível ou backend que executa o turno preparado.      |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                         |

Você também verá a palavra **harness** no código. Um harness é a implementação
que fornece um runtime de agente. Por exemplo, o harness Codex incluído
implementa o runtime `codex`. A config pública usa `agentRuntime.id`; `openclaw
doctor --fix` reescreve chaves mais antigas de política de runtime para esse formato.

Existem duas famílias de runtime:

- **Harnesses embutidos** executam dentro do loop de agente preparado do OpenClaw. Hoje isso
  é o runtime `pi` integrado, além de harnesses de Plugin registrados como
  `codex`.
- **Backends de CLI** executam um processo local de CLI enquanto mantêm a ref do modelo
  canônica. Por exemplo, `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` significa "selecionar o modelo Anthropic, executar
  por meio do Claude CLI". `claude-cli` não é um id de harness embutido e não deve
  ser passado para a seleção de AgentHarness.

## Três coisas chamadas Codex

A maior parte da confusão vem de três superfícies diferentes compartilhando o nome Codex:

| Superfície                                            | Nome/config no OpenClaw              | O que faz                                                                                         |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Rota de provider OAuth do Codex                       | refs de modelo `openai-codex/*`      | Usa OAuth de assinatura ChatGPT/Codex pelo runner PI normal do OpenClaw.                          |
| Runtime nativo app-server do Codex                    | `agentRuntime.id: "codex"`           | Executa o turno de agente embutido por meio do harness app-server Codex incluído.                 |
| Adaptador ACP do Codex                                | `runtime: "acp"`, `agentId: "codex"` | Executa o Codex pelo plano de controle externo ACP/acpx. Use apenas quando ACP/acpx for pedido explicitamente. |
| Conjunto nativo de comandos de controle de chat do Codex | `/codex ...`                      | Faz bind, retoma, orienta, para e inspeciona threads do app-server Codex pelo chat.               |
| Rota da API OpenAI Platform para modelos no estilo GPT/Codex | refs de modelo `openai/*`      | Usa autenticação por chave de API OpenAI, a menos que uma substituição de runtime, como `runtime: "codex"`, execute o turno. |

Essas superfícies são intencionalmente independentes. Ativar
o plugin `codex` torna os recursos nativos do app-server disponíveis;
isso não reescreve `openai-codex/*` para `openai/*`, não muda sessões existentes e
não torna ACP o padrão para Codex. Selecionar `openai-codex/*` significa "usar a rota do
provider OAuth do Codex", a menos que você force separadamente um runtime.

A configuração comum do Codex usa o provider `openai` com o runtime `codex`:

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

Isso significa que o OpenClaw seleciona uma ref de modelo OpenAI e depois pede ao
runtime app-server Codex para executar o turno de agente embutido. Isso não significa
que o canal, o catálogo de providers de modelo ou o armazenamento de sessão do OpenClaw virem Codex.

Quando o plugin `codex` incluído está ativado, o controle de Codex em linguagem natural
deve usar a superfície nativa de comando `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP. Use ACP para
Codex apenas quando o usuário pedir explicitamente ACP/acpx ou estiver testando o caminho
do adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harnesses externos
semelhantes ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **bind/control/thread/resume/steer/stop do Codex**, use a
   superfície nativa de comando `/codex` quando o plugin `codex` incluído estiver ativado.
2. Se o usuário pedir **Codex como runtime embutido**, use
   `openai/<model>` com `agentRuntime.id: "codex"`.
3. Se o usuário pedir **OAuth/autenticação por assinatura do Codex no runner normal do OpenClaw**,
   use `openai-codex/<model>` e deixe o runtime como PI.
4. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP do Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
5. Se o pedido for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro harness externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                       | Use...                                       |
| ---------------------------------------- | -------------------------------------------- |
| Controle de chat/thread do app-server Codex | `/codex ...` do plugin `codex` incluído   |
| Runtime de agente embutido do app-server Codex | `agentRuntime.id: "codex"`            |
| OAuth OpenAI Codex no runner PI          | refs de modelo `openai-codex/*`              |
| Claude Code ou outro harness externo     | ACP/acpx                                     |

Para a divisão de prefixos da família OpenAI, veja [OpenAI](/pt-BR/providers/openai) e
[Providers de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do runtime Codex,
veja [Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes controlam quantidades diferentes do loop.

| Superfície                  | PI embutido do OpenClaw                 | App-server Codex                                                          |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Proprietário do loop do modelo | OpenClaw pelo runner PI embutido     | App-server Codex                                                          |
| Estado canônico da thread   | Transcrição do OpenClaw                 | Thread do Codex, mais espelho da transcrição do OpenClaw                  |
| Ferramentas dinâmicas do OpenClaw | Loop nativo de ferramentas do OpenClaw | Feitas bridge pelo adaptador Codex                                   |
| Ferramentas nativas de shell e arquivo | Caminho PI/OpenClaw             | Ferramentas nativas do Codex, feitas bridge por hooks nativos quando compatível |
| Mecanismo de contexto       | Montagem nativa de contexto do OpenClaw | Contexto montado pelo OpenClaw projetado no turno do Codex               |
| Compaction                  | OpenClaw ou mecanismo de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção do espelho |
| Entrega no canal            | OpenClaw                                | OpenClaw                                                                  |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw controla a superfície, o OpenClaw pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo controla a superfície, o OpenClaw precisa de eventos do runtime ou hooks nativos.
- Se o runtime nativo controla o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever internals não compatíveis.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provider e modelo:

1. O runtime registrado de uma sessão vence. Mudanças de config não trocam em tempo real
   uma transcrição existente para um sistema de thread nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força esse runtime para sessões novas ou redefinidas.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` podem definir
   `auto`, `pi`, um id de harness embutido registrado como `codex`, ou um
   alias de backend de CLI compatível como `claude-cli`.
4. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares compatíveis de provider/modelo.
5. Se nenhum runtime reivindicar um turno no modo `auto` e `fallback: "pi"` estiver definido
   (o padrão), o OpenClaw usa PI como fallback de compatibilidade. Defina
   `fallback: "none"` para fazer a seleção sem correspondência no modo `auto` falhar.

Runtimes explícitos de Plugin falham em modo fail-closed por padrão. Por exemplo,
`runtime: "codex"` significa Codex ou um erro claro de seleção, a menos que você defina
`fallback: "pi"` no mesmo escopo de substituição. Uma substituição de runtime não herda
uma configuração mais ampla de fallback, então um `runtime: "codex"` no nível do agente não é roteado
silenciosamente de volta para PI só porque os padrões usavam `fallback: "pi"`.

Aliases de backend de CLI são diferentes de ids de harness embutidos. O formato preferido
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

Refs legadas como `claude-cli/claude-opus-4-7` continuam compatíveis por
compatibilidade, mas a nova config deve manter o provider/modelo canônico e colocar
o backend de execução em `agentRuntime.id`.

O modo `auto` é intencionalmente conservador. Runtimes de Plugin podem reivindicar
pares de provider/modelo que entendem, mas o plugin Codex não reivindica o
provider `openai-codex` no modo `auto`. Isso mantém
`openai-codex/*` como a rota explícita do PI com OAuth do Codex e evita mover silenciosamente
configs com autenticação por assinatura para o harness nativo app-server.

Se `openclaw doctor` avisar que o plugin `codex` está ativado enquanto
`openai-codex/*` ainda é roteado por PI, trate isso como diagnóstico, não como
migração. Mantenha a config inalterada quando PI com OAuth do Codex for o que você quer.
Troque para `openai/<model>` mais `agentRuntime.id: "codex"` apenas quando quiser execução
nativa no app-server Codex.

## Contrato de compatibilidade

Quando um runtime não é PI, ele deve documentar quais superfícies do OpenClaw oferece suporte.
Use este formato para a documentação de runtime:

| Pergunta                              | Por que isso importa                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Quem controla o loop do modelo?       | Determina onde acontecem repetição, continuação de ferramenta e decisões de resposta final.   |
| Quem controla o histórico canônico da thread? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.               |
| Ferramentas dinâmicas do OpenClaw funcionam? | Mensageria, sessões, cron e ferramentas controladas pelo OpenClaw dependem disso.   |
| Hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno de ferramentas controladas pelo OpenClaw. |
| Hooks de ferramentas nativas funcionam? | Ferramentas de shell, patch e ferramentas controladas pelo runtime precisam de suporte de hooks nativos para política e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem do ciclo de vida de assemble, ingest, after-turn e compaction. |
| Quais dados de compaction são expostos? | Alguns plugins só precisam de notificações, enquanto outros precisam de metadados mantidos/removidos. |
| O que é intencionalmente não compatível? | Usuários não devem assumir equivalência com PI quando o runtime nativo controla mais estado. |

O contrato de suporte do runtime Codex está documentado em
[Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar rótulos `Execution` e `Runtime`. Leia-os como
diagnóstico, não como nomes de provider.

- Uma ref de modelo como `openai/gpt-5.5` informa o provider/modelo selecionado.
- Um id de runtime como `codex` informa qual loop está executando o turno.
- Um rótulo de canal como Telegram ou Discord informa onde a conversa está acontecendo.

Se uma sessão ainda mostrar PI após mudar a configuração de runtime, inicie uma nova sessão
com `/new` ou limpe a atual com `/reset`. Sessões existentes mantêm o runtime
registrado para que uma transcrição não seja reproduzida em dois sistemas nativos
de sessão incompatíveis.

## Relacionados

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

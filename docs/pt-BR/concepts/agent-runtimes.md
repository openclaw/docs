---
read_when:
    - Você está escolhendo entre PI, Codex, ACP ou outro runtime de agente nativo
    - Você está confuso com rótulos de provedor/modelo/tempo de execução no status ou na configuração
    - Você está documentando a paridade de suporte para um ambiente de teste nativo
summary: Como o OpenClaw separa provedores de modelo, modelos, canais e ambientes de execução de agentes
title: Ambientes de execução de agentes
x-i18n:
    generated_at: "2026-05-02T05:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** é o componente que possui um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, lida com chamadas de ferramentas nativas e retorna
a vez concluída para o OpenClaw.

Runtimes são fáceis de confundir com provedores porque ambos aparecem perto da
configuração de modelo. Eles são camadas diferentes:

| Camada        | Exemplos                              | O que significa                                                        |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Provedor      | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo.   |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para a vez do agente.                             |
| Runtime de agente | `pi`, `codex`, `claude-cli`           | O loop de baixo nível ou backend que executa a vez preparada.          |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                           |

Você também verá a palavra **arcabouço** no código. Um arcabouço é a implementação
que fornece um runtime de agente. Por exemplo, o arcabouço Codex incluído
implementa o runtime `codex`. A configuração pública usa `agentRuntime.id`; `openclaw
doctor --fix` reescreve chaves antigas de política de runtime para esse formato.

Há duas famílias de runtime:

- **Arcabouços embutidos** rodam dentro do loop de agente preparado do OpenClaw. Hoje isso
  é o runtime `pi` integrado mais arcabouços de Plugin registrados, como
  `codex`.
- **Backends de CLI** rodam um processo de CLI local enquanto mantêm a ref de modelo
  canônica. Por exemplo, `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` significa "selecionar o modelo Anthropic, executar
  por meio do Claude CLI." `claude-cli` não é um id de arcabouço embutido e não deve
  ser passado para a seleção de AgentHarness.

## Superfícies do Codex

A maior parte da confusão vem de várias superfícies diferentes compartilhando o nome Codex:

| Superfície                                           | Nome/configuração no OpenClaw              | O que faz                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Runtime app-server nativo do Codex                   | `openai/*` mais `agentRuntime.id: "codex"` | Executa a vez do agente embutido por meio do app-server Codex. Esta é a configuração usual de assinatura ChatGPT/Codex. |
| Rota de provedor OAuth do Codex                      | refs de modelo `openai-codex/*`            | Usa OAuth de assinatura ChatGPT/Codex por meio do executor PI normal do OpenClaw.                              |
| Adaptador ACP do Codex                               | `runtime: "acp"`, `agentId: "codex"`       | Executa o Codex por meio do plano de controle externo ACP/acpx. Use somente quando ACP/acpx for pedido explicitamente. |
| Conjunto de comandos nativo de controle por chat do Codex | `/codex ...`                               | Vincula, retoma, direciona, interrompe e inspeciona threads do app-server Codex a partir do chat.              |
| Rota da API da OpenAI Platform para modelos estilo GPT/Codex | refs de modelo `openai/*`                  | Usa autenticação por chave de API da OpenAI, a menos que uma substituição de runtime, como `agentRuntime.id: "codex"`, execute a vez. |

Essas superfícies são intencionalmente independentes. Habilitar o Plugin `codex` torna
os recursos nativos do app-server disponíveis; isso não reescreve
`openai-codex/*` para `openai/*`, não altera sessões existentes e não
torna ACP o padrão do Codex. Selecionar `openai-codex/*` significa "usar a rota
do provedor OAuth do Codex", a menos que você force separadamente um runtime.

A configuração comum de assinatura ChatGPT/Codex usa OAuth do Codex para autenticação, mas mantém
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

Isso significa que o OpenClaw seleciona uma ref de modelo OpenAI e então pede ao runtime app-server
Codex para executar a vez do agente embutido. Isso não significa "usar cobrança de API", e
não significa que o canal, o catálogo de provedores de modelo ou o armazenamento de sessões do OpenClaw
se torne Codex.

Quando o Plugin `codex` incluído está habilitado, o controle Codex em linguagem natural
deve usar a superfície de comandos nativa `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP. Use ACP para
Codex somente quando o usuário pedir explicitamente ACP/acpx ou estiver testando o caminho do
adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor e arcabouços externos semelhantes
ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **vínculo/controle/thread/retomada/direcionamento/interrupção do Codex**, use a
   superfície de comandos nativa `/codex` quando o Plugin `codex` incluído estiver habilitado.
2. Se o usuário pedir **Codex como runtime embutido** ou quiser a experiência normal
   de agente Codex baseada em assinatura, use
   `openai/<model>` com `agentRuntime.id: "codex"`.
3. Se o usuário pedir **autenticação OAuth/assinatura do Codex no executor normal do OpenClaw**,
   use `openai-codex/<model>` e deixe o runtime como PI.
4. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP do Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
5. Se a solicitação for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro arcabouço externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                         | Use...                                      |
| ------------------------------------------ | ------------------------------------------- |
| Controle de chat/thread do app-server Codex | `/codex ...` do Plugin `codex` incluído     |
| Runtime de agente embutido do app-server Codex | `agentRuntime.id: "codex"`                  |
| OAuth do OpenAI Codex no executor PI       | refs de modelo `openai-codex/*`             |
| Claude Code ou outro arcabouço externo     | ACP/acpx                                    |

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do runtime
Codex, consulte [Arcabouço Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes possuem quantidades diferentes do loop.

| Superfície                  | PI embutido do OpenClaw                 | app-server Codex                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Dono do loop de modelo      | OpenClaw por meio do executor PI embutido | app-server Codex                                                            |
| Estado canônico da thread   | Transcrição do OpenClaw                 | Thread Codex, mais espelho da transcrição do OpenClaw                       |
| Ferramentas dinâmicas do OpenClaw | Loop de ferramentas nativo do OpenClaw | Intermediadas por meio do adaptador Codex                                   |
| Ferramentas nativas de shell e arquivo | Caminho PI/OpenClaw                     | Ferramentas nativas do Codex, intermediadas por hooks nativos quando compatíveis |
| Mecanismo de contexto       | Montagem de contexto nativa do OpenClaw | OpenClaw projeta contexto montado na vez do Codex                           |
| Compaction                  | OpenClaw ou mecanismo de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção de espelho |
| Entrega de canal            | OpenClaw                                | OpenClaw                                                                    |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw possui a superfície, o OpenClaw pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo possui a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo possui o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever internos não compatíveis.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provedor e modelo:

1. O runtime registrado de uma sessão prevalece. Alterações de configuração não trocam a quente uma
   transcrição existente para um sistema de threads nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força esse runtime para sessões novas ou redefinidas.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` pode definir
   `auto`, `pi`, um id de arcabouço embutido registrado como `codex` ou um
   alias de backend de CLI compatível como `claude-cli`.
4. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares de provedor/modelo
   compatíveis.
5. Se nenhum runtime reivindicar uma vez no modo `auto` e `fallback: "pi"` estiver definido
   (o padrão), o OpenClaw usa PI como fallback de compatibilidade. Defina
   `fallback: "none"` para fazer a seleção sem correspondência no modo `auto` falhar em vez disso.

Runtimes de Plugin explícitos falham fechados por padrão. Por exemplo,
`agentRuntime.id: "codex"` significa Codex ou um erro claro de seleção, a menos que você defina
`fallback: "pi"` no mesmo escopo de substituição. Uma substituição de runtime não herda
uma configuração de fallback mais ampla, portanto um `agentRuntime.id: "codex"` no nível do agente não é
roteado silenciosamente de volta para PI só porque os padrões usavam `fallback: "pi"`.

Aliases de backend de CLI são diferentes de ids de arcabouço embutido. A forma preferida
do Claude CLI é:

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
`openai-codex/*` como a rota explícita OAuth Codex do PI e evita mover silenciosamente
configurações de autenticação por assinatura para o arcabouço app-server nativo.

Se `openclaw doctor` avisar que o Plugin `codex` está habilitado enquanto
`openai-codex/*` ainda é roteado por PI, trate isso como um diagnóstico, não como uma
migração. Mantenha a configuração inalterada quando OAuth Codex no PI for o que você quer.
Mude para `openai/<model>` mais `agentRuntime.id: "codex"` somente quando quiser execução nativa
pelo app-server Codex.

## Contrato de compatibilidade

Quando um runtime não é PI, ele deve documentar quais superfícies do OpenClaw ele suporta.
Use este formato para documentos de runtime:

| Pergunta                              | Por que isso importa                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Quem controla o loop do modelo?       | Determina onde acontecem as novas tentativas, a continuação de ferramentas e as decisões de resposta final. |
| Quem controla o histórico canônico da conversa? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                                |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, cron e ferramentas controladas pelo OpenClaw dependem disso.                     |
| Os hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno das ferramentas controladas pelo OpenClaw. |
| Os hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas controladas pelo runtime precisam de suporte a hooks nativos para política e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem dos ciclos de vida de montagem, ingestão, pós-turno e Compaction. |
| Quais dados de Compaction são expostos? | Alguns plugins precisam apenas de notificações, enquanto outros precisam de metadados mantidos/removidos. |
| O que é intencionalmente incompatível? | Os usuários não devem presumir equivalência com PI quando o runtime nativo controla mais estado.      |

O contrato de suporte do runtime Codex está documentado em
[harness do Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Leia-os como
diagnósticos, não como nomes de provedores.

- Uma referência de modelo como `openai/gpt-5.5` indica o provedor/modelo selecionado.
- Um ID de runtime como `codex` indica qual loop está executando o turno.
- Um rótulo de canal como Telegram ou Discord indica onde a conversa está acontecendo.

Se uma sessão ainda mostrar PI depois de alterar a configuração de runtime, inicie uma nova sessão
com `/new` ou limpe a atual com `/reset`. Sessões existentes mantêm seu
runtime registrado para que uma transcrição não seja reproduzida por dois sistemas de sessão nativos
incompatíveis.

## Relacionado

- [harness do Codex](/pt-BR/plugins/codex-harness)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

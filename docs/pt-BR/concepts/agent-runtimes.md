---
read_when:
    - Você está escolhendo entre Pi, Codex, ACP ou outro runtime nativo de agente
    - Você está confuso com os rótulos de provider/modelo/runtime no status ou na configuração
    - Você está documentando a paridade de suporte para um harness nativo de agente
summary: Como o OpenClaw separa providers de modelo, modelos, canais e runtimes de agente
title: Runtimes de agente
x-i18n:
    generated_at: "2026-04-25T13:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Um **runtime de agente** é o componente responsável por um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, lida com chamadas nativas de ferramentas e retorna
a interação concluída ao OpenClaw.

É fácil confundir runtimes com providers, porque ambos aparecem próximos da
configuração de modelos. Eles são camadas diferentes:

| Camada         | Exemplos                              | O que significa                                                     |
| -------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider       | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo. |
| Modelo         | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para a interação do agente.                    |
| Runtime de agente | `pi`, `codex`, runtimes com ACP como backend | O loop de baixo nível que executa a interação preparada.         |
| Canal          | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                        |

Você também verá a palavra **harness** no código e na configuração. Um harness é a
implementação que fornece um runtime de agente. Por exemplo, o harness Codex incluído
implementa o runtime `codex`. A chave de configuração ainda se chama
`embeddedHarness` por compatibilidade, mas a documentação voltada ao usuário e a saída
de status geralmente devem dizer runtime.

A configuração comum do Codex usa o provider `openai` com o runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Isso significa que o OpenClaw seleciona uma ref de modelo da OpenAI e depois pede ao
runtime do app-server Codex para executar a interação do agente incorporado. Isso não significa
que o canal, o catálogo de modelos do provider ou o armazenamento de sessões do OpenClaw
se tornem Codex.

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Providers de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do runtime Codex,
consulte [Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Propriedade do runtime

Diferentes runtimes controlam diferentes partes do loop.

| Superfície                  | PI embutido do OpenClaw                | App-server Codex                                                           |
| --------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Responsável pelo loop do modelo | OpenClaw por meio do runner embutido do Pi | App-server Codex                                                       |
| Estado canônico da thread   | Transcrição do OpenClaw                | Thread do Codex, mais espelho da transcrição do OpenClaw                   |
| Ferramentas dinâmicas do OpenClaw | Loop nativo de ferramentas do OpenClaw | Integradas por meio do adaptador Codex                                  |
| Ferramentas nativas de shell e arquivo | Caminho Pi/OpenClaw                    | Ferramentas nativas do Codex, integradas por meio de hooks nativos quando compatível |
| Mecanismo de contexto       | Montagem nativa de contexto do OpenClaw | O OpenClaw projeta o contexto montado na interação do Codex             |
| Compaction                  | OpenClaw ou o mecanismo de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção do espelho |
| Entrega pelo canal          | OpenClaw                               | OpenClaw                                                                   |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw controla a superfície, ele pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo controla a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo controla o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever internos não compatíveis.

## Seleção de runtime

O OpenClaw escolhe um runtime embutido após a resolução de provider e modelo:

1. O runtime registrado de uma sessão tem prioridade. Alterações de configuração não trocam
   dinamicamente uma transcrição existente para um sistema de thread nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força esse runtime para sessões novas ou reiniciadas.
3. `agents.defaults.embeddedHarness.runtime` ou
   `agents.list[].embeddedHarness.runtime` podem definir `auto`, `pi` ou um ID de
   runtime registrado como `codex`.
4. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares compatíveis de
   provider/modelo.
5. Se nenhum runtime reivindicar uma interação no modo `auto` e `fallback: "pi"` estiver definido
   (o padrão), o OpenClaw usa Pi como fallback de compatibilidade. Defina
   `fallback: "none"` para fazer a seleção sem correspondência no modo `auto` falhar.

Runtimes explícitos de Plugin falham de forma fechada por padrão. Por exemplo,
`runtime: "codex"` significa Codex ou um erro claro de seleção, a menos que você defina
`fallback: "pi"` no mesmo escopo de substituição. Uma substituição de runtime não herda
uma configuração de fallback mais ampla, portanto um `runtime: "codex"` no nível do agente não é
silenciosamente roteado de volta para Pi apenas porque os padrões usavam `fallback: "pi"`.

## Contrato de compatibilidade

Quando um runtime não é Pi, ele deve documentar quais superfícies do OpenClaw oferece suporte.
Use este formato para a documentação de runtime:

| Pergunta                               | Por que isso importa                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Quem controla o loop do modelo?        | Determina onde acontecem tentativas novamente, continuação de ferramentas e decisões de resposta final. |
| Quem controla o histórico canônico da thread? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                           |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, Cron e ferramentas de propriedade do OpenClaw dependem disso.               |
| Hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno de ferramentas de propriedade do OpenClaw. |
| Hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas controladas pelo runtime precisam de suporte a hook nativo para política e observação. |
| O ciclo de vida do mecanismo de contexto é executado? | Plugins de memória e contexto dependem dos ciclos assemble, ingest, after-turn e Compaction. |
| Quais dados de Compaction são expostos? | Alguns Plugins precisam apenas de notificações, enquanto outros precisam de metadados de mantidos/descartados. |
| O que é intencionalmente não compatível? | Os usuários não devem presumir equivalência com Pi onde o runtime nativo controla mais estado.   |

O contrato de suporte do runtime Codex está documentado em
[Harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Interprete-os como
diagnósticos, não como nomes de provider.

- Uma ref de modelo como `openai/gpt-5.5` informa o provider/modelo selecionado.
- Um ID de runtime como `codex` informa qual loop está executando a interação.
- Um rótulo de canal como Telegram ou Discord informa onde a conversa está acontecendo.

Se uma sessão ainda mostrar Pi após alterar a configuração de runtime, inicie uma nova sessão
com `/new` ou limpe a atual com `/reset`. Sessões existentes mantêm seu
runtime registrado para que uma transcrição não seja reproduzida por dois sistemas incompatíveis de
sessão nativa.

## Relacionado

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

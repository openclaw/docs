---
read_when:
    - Você está escolhendo entre PI, Codex, ACP ou outro ambiente de execução de agente nativo
    - Você está confuso com os rótulos de provedor/modelo/tempo de execução no status ou na configuração
    - Você está documentando a paridade de suporte para uma estrutura nativa
summary: Como o OpenClaw separa provedores de modelos, modelos, canais e ambientes de execução de agentes
title: Ambientes de execução dos agentes
x-i18n:
    generated_at: "2026-05-07T13:15:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Um **runtime de agente** é o componente que possui um loop de modelo preparado: ele
recebe o prompt, conduz a saída do modelo, lida com chamadas de ferramentas
nativas e retorna o turno concluído ao OpenClaw.

Runtimes são fáceis de confundir com provedores porque ambos aparecem perto da
configuração de modelo. Eles são camadas diferentes:

| Camada             | Exemplos                              | O que significa                                                       |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| Provedor           | `openai`, `anthropic`, `openai-codex` | Como o OpenClaw autentica, descobre modelos e nomeia refs de modelo.  |
| Modelo             | `gpt-5.5`, `claude-opus-4-6`          | O modelo selecionado para o turno do agente.                          |
| Runtime de agente  | `pi`, `codex`, `claude-cli`           | O loop ou backend de baixo nível que executa o turno preparado.       |
| Canal              | Telegram, Discord, Slack, WhatsApp    | Onde as mensagens entram e saem do OpenClaw.                          |

Você também verá a palavra **harness** no código. Um harness é a implementação
que fornece um runtime de agente. Por exemplo, o harness do Codex incluído
implementa o runtime `codex`. A configuração pública usa `agentRuntime.id`; `openclaw
doctor --fix` reescreve chaves de política de runtime antigas para esse formato.

Há duas famílias de runtime:

- **Harnesses incorporados** rodam dentro do loop de agente preparado do OpenClaw.
  Hoje, isso é o runtime `pi` integrado mais harnesses de Plugin registrados,
  como `codex`.
- **Backends de CLI** rodam um processo de CLI local enquanto mantêm a ref do
  modelo canônica. Por exemplo, `anthropic/claude-opus-4-7` com
  `agentRuntime.id: "claude-cli"` significa "selecionar o modelo da Anthropic,
  executar via Claude CLI." `claude-cli` não é um id de harness incorporado e não
  deve ser passado para a seleção de AgentHarness.

## Superfícies do Codex

A maior parte da confusão vem de várias superfícies diferentes compartilharem o nome Codex:

| Superfície                                          | Nome/configuração do OpenClaw        | O que faz                                                                                                           |
| --------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Runtime nativo de servidor de app do Codex          | refs de modelo `openai/*`            | Executa turnos de agente incorporado da OpenAI pelo servidor de app do Codex. Esta é a configuração usual de assinatura ChatGPT/Codex. |
| Perfis de autenticação OAuth do Codex               | provedor de autenticação `openai-codex` | Armazena a autenticação de assinatura ChatGPT/Codex que o harness do servidor de app do Codex consome.           |
| Adaptador ACP do Codex                              | `runtime: "acp"`, `agentId: "codex"` | Executa o Codex pelo plano de controle externo ACP/acpx. Use somente quando ACP/acpx for solicitado explicitamente. |
| Conjunto de comandos nativos de controle de chat do Codex | `/codex ...`                         | Vincula, retoma, orienta, interrompe e inspeciona threads do servidor de app do Codex pelo chat.                  |
| Rota da API da OpenAI Platform para superfícies sem agente | `openai/*` mais autenticação por chave de API | Usada para APIs diretas da OpenAI, como imagens, embeddings, fala e tempo real.                                  |

Essas superfícies são intencionalmente independentes. Habilitar o Plugin `codex`
torna os recursos nativos do servidor de app disponíveis; `openclaw doctor --fix`
é responsável pelo reparo de rotas legadas `openai-codex/*` e pela limpeza de
pins de sessão obsoletos. Selecionar `openai/*` para um modelo de agente agora
significa "executar isto pelo Codex", a menos que uma superfície de API da OpenAI
sem agente esteja sendo usada.

A configuração comum de assinatura ChatGPT/Codex usa OAuth do Codex para
autenticação, mas mantém a ref do modelo como `openai/*` e seleciona o runtime
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

Isso significa que o OpenClaw seleciona uma ref de modelo da OpenAI e, então,
pede ao runtime do servidor de app do Codex para executar o turno de agente
incorporado. Não significa "usar cobrança por API" e não significa que o canal,
o catálogo de provedores de modelo ou o armazenamento de sessão do OpenClaw se
torna Codex.

Quando o Plugin `codex` incluído estiver habilitado, o controle do Codex em
linguagem natural deve usar a superfície de comandos nativa `/codex` (`/codex bind`,
`/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) em vez de ACP.
Use ACP para Codex somente quando o usuário pedir explicitamente ACP/acpx ou
estiver testando o caminho do adaptador ACP. Claude Code, Gemini CLI, OpenCode,
Cursor e harnesses externos semelhantes ainda usam ACP.

Esta é a árvore de decisão voltada ao agente:

1. Se o usuário pedir **vinculação/controle/thread/retomada/orientação/interrupção do Codex**, use a
   superfície de comandos nativa `/codex` quando o Plugin `codex` incluído estiver habilitado.
2. Se o usuário pedir **Codex como runtime incorporado** ou quiser a experiência
   normal de agente Codex respaldada por assinatura, use `openai/<model>`.
3. Se o usuário escolher explicitamente **PI para um modelo da OpenAI**, mantenha a ref do modelo
   como `openai/<model>` e defina `agentRuntime.id: "pi"`. Um perfil de
   autenticação `openai-codex` selecionado é roteado internamente pelo transporte
   legado de autenticação do Codex do PI.
4. Se a configuração legada ainda contiver **refs de modelo `openai-codex/*`**, repare-a para
   `openai/<model>` com `openclaw doctor --fix`.
5. Se o usuário disser explicitamente **ACP**, **acpx** ou **adaptador ACP do Codex**, use
   ACP com `runtime: "acp"` e `agentId: "codex"`.
6. Se a solicitação for para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid ou
   outro harness externo**, use ACP/acpx, não o runtime nativo de subagente.

| Você quer dizer...                         | Use...                                      |
| ------------------------------------------ | ------------------------------------------- |
| Controle de chat/thread do servidor de app do Codex | `/codex ...` do Plugin `codex` incluído |
| Runtime de agente incorporado do servidor de app do Codex | refs de modelo de agente `openai/*` |
| OAuth do OpenAI Codex                      | perfis de autenticação `openai-codex`       |
| Claude Code ou outro harness externo       | ACP/acpx                                    |

Para a divisão de prefixos da família OpenAI, consulte [OpenAI](/pt-BR/providers/openai) e
[Provedores de modelo](/pt-BR/concepts/model-providers). Para o contrato de suporte do
runtime Codex, consulte [harness do Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Propriedade do runtime

Runtimes diferentes possuem partes diferentes do loop.

| Superfície                  | PI incorporado do OpenClaw             | Servidor de app do Codex                                                    |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Dono do loop do modelo      | OpenClaw pelo executor incorporado do PI | Servidor de app do Codex                                                    |
| Estado canônico da thread   | Transcrição do OpenClaw                | Thread do Codex, mais espelho da transcrição do OpenClaw                    |
| Ferramentas dinâmicas do OpenClaw | Loop de ferramentas nativo do OpenClaw | Encaminhadas pela ponte do adaptador do Codex                               |
| Ferramentas nativas de shell e arquivo | Caminho PI/OpenClaw                 | Ferramentas nativas do Codex, conectadas por hooks nativos quando houver suporte |
| Motor de contexto           | Montagem de contexto nativa do OpenClaw | Projetos do OpenClaw montam contexto no turno do Codex                      |
| Compaction                  | OpenClaw ou motor de contexto selecionado | Compaction nativa do Codex, com notificações do OpenClaw e manutenção de espelho |
| Entrega de canal            | OpenClaw                               | OpenClaw                                                                    |

Essa divisão de propriedade é a principal regra de design:

- Se o OpenClaw possui a superfície, o OpenClaw pode fornecer o comportamento normal de hooks de Plugin.
- Se o runtime nativo possui a superfície, o OpenClaw precisa de eventos de runtime ou hooks nativos.
- Se o runtime nativo possui o estado canônico da thread, o OpenClaw deve espelhar e projetar contexto, não reescrever partes internas sem suporte.

## Seleção de runtime

O OpenClaw escolhe um runtime incorporado após a resolução de provedor e modelo:

1. O runtime registrado de uma sessão vence. Alterações de configuração não trocam a quente uma
   transcrição existente para um sistema de thread nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força esse runtime para sessões novas ou redefinidas.
3. `agents.defaults.agentRuntime.id` ou `agents.list[].agentRuntime.id` pode definir
   `auto`, `pi`, um id de harness incorporado registrado como `codex` ou um
   alias de backend de CLI compatível como `claude-cli`.
4. No modo `auto`, runtimes de Plugin registrados podem reivindicar pares de provedor/modelo
   compatíveis.
5. Se nenhum runtime reivindicar um turno no modo `auto`, o OpenClaw usa o PI como
   runtime de compatibilidade. Use um id de runtime explícito quando a execução precisar ser
   estrita.

Runtimes de Plugin explícitos falham fechados. Por exemplo, `agentRuntime.id: "codex"`
significa Codex ou um erro claro de seleção/runtime; ele nunca é roteado silenciosamente de volta
para o PI.

Aliases de backend de CLI são diferentes de ids de harness incorporado. A forma preferida
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

Refs legadas como `claude-cli/claude-opus-4-7` continuam compatíveis por
compatibilidade, mas novas configurações devem manter o provedor/modelo canônico e colocar
o backend de execução em `agentRuntime.id`.

O modo `auto` é intencionalmente conservador para a maioria dos provedores. Modelos de agente da OpenAI
são a exceção: runtime não definido e `auto` ambos resolvem para o harness do Codex.
A configuração explícita de runtime PI continua sendo uma rota de compatibilidade opcional para
turnos de agente `openai/*`; quando pareada com um perfil de autenticação `openai-codex` selecionado,
o OpenClaw roteia o PI internamente pelo transporte legado de autenticação do Codex enquanto
mantém a ref de modelo pública como `openai/*`. Pins de sessão PI da OpenAI obsoletos sem
configuração explícita são reparados de volta para o Codex.

Se `openclaw doctor` avisar que o Plugin `codex` está habilitado enquanto
`openai-codex/*` permanece na configuração, trate isso como estado de rota legado. Execute
`openclaw doctor --fix` para reescrevê-lo para `openai/*` com o runtime Codex.

## Contrato de compatibilidade

Quando um runtime não é PI, ele deve documentar quais superfícies do OpenClaw ele suporta.
Use este formato para a documentação de runtime:

| Pergunta                               | Por que importa                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Quem possui o loop do modelo?          | Determina onde acontecem novas tentativas, continuação de ferramentas e decisões de resposta final. |
| Quem possui o histórico canônico da thread? | Determina se o OpenClaw pode editar o histórico ou apenas espelhá-lo.                          |
| As ferramentas dinâmicas do OpenClaw funcionam? | Mensagens, sessões, cron e ferramentas pertencentes ao OpenClaw dependem disso.              |
| Os hooks de ferramentas dinâmicas funcionam? | Plugins esperam `before_tool_call`, `after_tool_call` e middleware em torno de ferramentas pertencentes ao OpenClaw. |
| Os hooks de ferramentas nativas funcionam? | Shell, patch e ferramentas pertencentes ao runtime precisam de suporte de hooks nativos para política e observação. |
| O ciclo de vida do motor de contexto roda? | Plugins de memória e contexto dependem dos ciclos de montagem, ingestão, pós-turno e compaction. |
| Quais dados de compaction são expostos? | Alguns Plugins precisam apenas de notificações, enquanto outros precisam de metadados mantidos/descartados. |
| O que é intencionalmente sem suporte?   | Usuários não devem presumir equivalência com PI quando o runtime nativo possui mais estado.        |

O contrato de suporte de runtime do Codex está documentado em
[harness do Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

## Rótulos de status

A saída de status pode mostrar os rótulos `Execution` e `Runtime`. Leia-os como
diagnósticos, não como nomes de provedores.

- Uma referência de modelo como `openai/gpt-5.5` informa o provedor/modelo selecionado.
- Um id de runtime como `codex` informa qual loop está executando o turno.
- Um rótulo de canal como Telegram ou Discord informa onde a conversa está acontecendo.

Se uma sessão ainda mostrar PI depois de alterar a configuração de runtime, inicie uma nova sessão
com `/new` ou limpe a atual com `/reset`. Sessões existentes mantêm seu
runtime registrado para que uma transcrição não seja reproduzida por dois sistemas nativos
de sessão incompatíveis.

## Relacionado

- [harness do Codex](/pt-BR/plugins/codex-harness)
- [OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agentes](/pt-BR/plugins/sdk-agent-harness)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Modelos](/pt-BR/concepts/models)
- [Status](/pt-BR/cli/status)

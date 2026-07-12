---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o mecanismo legado e um mecanismo de Plugin
    - Você está criando um plugin de mecanismo de contexto
sidebarTitle: Context engine
summary: 'Mecanismo de contexto: montagem de contexto conectável, compaction e ciclo de vida de subagentes'
title: Mecanismo de contexto
x-i18n:
    generated_at: "2026-07-12T15:04:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Um **mecanismo de contexto** controla como o OpenClaw cria o contexto do modelo para cada execução: quais mensagens incluir, como resumir o histórico mais antigo e como gerenciar o contexto entre limites de subagentes.

O OpenClaw inclui um mecanismo `legacy` integrado e o utiliza por padrão. Instale e selecione um mecanismo de Plugin somente quando quiser um comportamento diferente de montagem, Compaction ou recuperação entre sessões.

## Início rápido

<Steps>
  <Step title="Verifique qual mecanismo está ativo">
    ```bash
    openclaw doctor
    # ou inspecione a configuração diretamente:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instale um mecanismo de Plugin">
    Plugins de mecanismo de contexto são instalados como qualquer outro Plugin do OpenClaw.

    <Tabs>
      <Tab title="Pelo npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Por um caminho local">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ative e selecione o mecanismo">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // deve corresponder ao id de mecanismo registrado pelo Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // A configuração específica do Plugin deve ser inserida aqui (consulte a documentação do Plugin)
          },
        },
      },
    }
    ```

    Reinicie o Gateway após instalar e configurar.

  </Step>
  <Step title="Volte para o mecanismo legado (opcional)">
    Defina `contextEngine` como `"legacy"` (ou remova completamente a chave — `"legacy"` é o padrão).
  </Step>
</Steps>

## Como funciona

Sempre que o OpenClaw executa um prompt de modelo, o mecanismo de contexto participa em quatro pontos do ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingestão">
    Chamado quando uma nova mensagem é adicionada à sessão. O mecanismo pode armazenar ou indexar a mensagem em seu próprio repositório de dados.
  </Accordion>
  <Accordion title="2. Montagem">
    Chamado antes de cada execução do modelo. O mecanismo retorna um conjunto ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe no orçamento de tokens.
  </Accordion>
  <Accordion title="3. Compaction">
    Chamado quando a janela de contexto está cheia ou quando o usuário executa `/compact`. O mecanismo resume o histórico mais antigo para liberar espaço.
  </Accordion>
  <Accordion title="4. Após o turno">
    Chamado após a conclusão de uma execução. O mecanismo pode persistir o estado, acionar a Compaction em segundo plano ou atualizar índices.
  </Accordion>
</AccordionGroup>

Os mecanismos também podem implementar um método `maintain()` opcional para manutenção da transcrição (reescritas seguras por meio de `runtimeContext.rewriteTranscriptEntries()`) após a inicialização, um turno bem-sucedido ou a Compaction. Defina `info.turnMaintenanceMode: "background"` para executá-lo como trabalho adiado em vez de bloquear a resposta.

Para o harness Codex não ACP incluído, o OpenClaw aplica o mesmo ciclo de vida projetando o contexto montado nas instruções de desenvolvedor do Codex e no prompt do turno atual. O Codex continua controlando seu histórico de thread nativo e seu compactador nativo.

### Ciclo de vida do subagente (opcional)

O OpenClaw chama dois hooks opcionais do ciclo de vida de subagentes:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepare o estado de contexto compartilhado antes do início de uma execução filha. O hook recebe chaves de sessão pai/filha, `contextMode` (`isolated` ou `fork`), ids/arquivos de transcrição disponíveis e um TTL opcional. Se retornar um identificador de reversão, o OpenClaw o chamará quando a criação falhar após a preparação ser concluída com sucesso. Criações nativas de subagentes que solicitam `lightContext` e resultam em `contextMode="isolated"` ignoram intencionalmente esse hook para que o filho comece com o contexto leve de inicialização, sem estado pré-criação gerenciado pelo mecanismo de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Faça a limpeza quando uma sessão de subagente for concluída ou removida.
</ParamField>

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw a acrescenta ao início do prompt do sistema para a execução. Isso permite que os mecanismos injetem orientações dinâmicas de recuperação, instruções de busca ou dicas sensíveis ao contexto sem exigir arquivos estáticos no espaço de trabalho.

## O mecanismo legado

O mecanismo `legacy` integrado preserva o comportamento original do OpenClaw:

- **Ingestão**: nenhuma operação (o gerenciador de sessões cuida diretamente da persistência das mensagens).
- **Montagem**: passagem direta (o pipeline existente de sanitização → validação → limitação no runtime cuida da montagem do contexto).
- **Compaction**: delega para a Compaction de sumarização integrada, que cria um único resumo das mensagens mais antigas e mantém intactas as mensagens recentes.
- **Após o turno**: nenhuma operação.

O mecanismo legado não registra ferramentas nem fornece um `systemPromptAddition`.

Quando nenhum `plugins.slots.contextEngine` está definido (ou está definido como `"legacy"`), esse mecanismo é usado automaticamente.

## Mecanismos de Plugin

Um Plugin pode registrar um mecanismo de contexto usando a API de Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Armazene a mensagem em seu repositório de dados
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Retorne mensagens que caibam no orçamento
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Resuma o contexto mais antigo
      return { ok: true, compacted: true };
    },
  }));
}
```

O `ctx` da fábrica inclui valores opcionais `config`, `agentDir` e `workspaceDir`
para que os Plugins possam inicializar o estado por agente ou por espaço de trabalho antes da
execução do primeiro hook do ciclo de vida.

Em seguida, ative-o na configuração:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### A interface ContextEngine

Membros obrigatórios:

| Membro             | Tipo        | Finalidade                                                             |
| ------------------ | ----------- | ---------------------------------------------------------------------- |
| `info`             | Propriedade | Id, nome e versão do mecanismo e se ele controla a Compaction          |
| `ingest(params)`   | Método      | Armazenar uma única mensagem                                            |
| `assemble(params)` | Método      | Criar o contexto para uma execução do modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método      | Resumir/reduzir o contexto                                               |

`assemble` retorna um `AssembleResult` com:

<ParamField path="messages" type="Message[]" required>
  As mensagens ordenadas a serem enviadas ao modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  A estimativa do mecanismo para o total de tokens no contexto montado. O OpenClaw usa isso para decisões sobre o limite de Compaction e para relatórios de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Acrescentado ao início do prompt do sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qual estimativa de tokens o executor usa nas verificações preventivas
  de estouro. O padrão é `"assembled"`, o que significa que somente a estimativa
  do prompt montado é verificada para mecanismos que não controlam a Compaction.
  Os mecanismos que definem `ownsCompaction: true` gerenciam a própria admissão de prompts,
  portanto, por padrão, o OpenClaw ignora a verificação genérica anterior ao prompt. Defina
  `"preassembly_may_overflow"` somente quando a visualização montada puder ocultar o risco de
  estouro na transcrição subjacente; nesse caso, o executor mantém ativa a verificação
  genérica e usa o maior valor entre a estimativa montada e a estimativa
  do histórico da sessão anterior à montagem (sem aplicação de janela) ao decidir se deve
  executar preventivamente a Compaction. De qualquer forma, as mensagens retornadas continuam sendo
  o que o modelo vê — `promptAuthority` afeta apenas a verificação prévia.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Ciclo de vida opcional de projeção para hosts com threads persistentes no backend (por exemplo, o app-server do Codex). `mode: "thread_bootstrap"` com um `epoch` estável solicita que o host injete o contexto montado uma vez por epoch e reutilize a thread do backend até que o epoch seja alterado, em vez de reprojetá-lo a cada turno. Omita este campo para a projeção normal a cada turno.
</ParamField>

`compact` retorna um `CompactResult`. Quando a Compaction altera a identidade da sessão
ativa, `result.sessionTarget` (um `ContextEngineSessionTarget` tipado que contém
a identidade da sessão e o escopo do repositório) identifica a sessão sucessora que a
próxima repetição ou o próximo turno deve usar; `result.sessionId` espelha o id sucessor.

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                                                                           |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do mecanismo para uma sessão. Chamado uma vez quando o mecanismo encontra uma sessão pela primeira vez (por exemplo, ao importar o histórico).  |
| `maintain(params)`             | Método | Manutenção da transcrição após a inicialização, um turno bem-sucedido ou a Compaction. Use `runtimeContext.rewriteTranscriptEntries()` para reescritas seguras.       |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como um lote. Chamado após a conclusão de uma execução, com todas as mensagens desse turno de uma só vez.                                  |
| `afterTurn(params)`            | Método | Trabalho do ciclo de vida após a execução (persistir o estado, acionar a Compaction em segundo plano).                                                               |
| `prepareSubagentSpawn(params)` | Método | Configurar o estado compartilhado para uma sessão filha antes de seu início.                                                                                          |
| `onSubagentEnded(params)`      | Método | Fazer a limpeza após o encerramento de um subagente.                                                                                                                  |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o encerramento do Gateway ou o recarregamento do Plugin — não por sessão.                                                           |

### Configurações de runtime

Os hooks do ciclo de vida executados dentro do OpenClaw recebem um objeto
`runtimeSettings` opcional. Ele é uma superfície de API interna
versionada e somente leitura entre produtor e consumidor: o OpenClaw o produz para o mecanismo de contexto
selecionado, e o mecanismo de contexto o consome dentro dos hooks do ciclo de vida. Ele não é
renderizado diretamente para os usuários e não cria uma superfície dedicada de relatórios.

- `schemaVersion`: atualmente `1`
- `runtime`: host do OpenClaw, modo do runtime (`normal`, `fallback` ou
  `degraded`) e ids opcionais do harness/runtime
- `contextEngineSelection`: id do mecanismo de contexto selecionado e origem da seleção
- `executionHost`: id e rótulo do host para a superfície que invoca o hook
- `model`: modelo solicitado, modelo resolvido, provedor e família de modelos opcional
- `limits`: orçamento de tokens do prompt e máximo de tokens de saída, quando conhecidos
- `diagnostics`: códigos fechados de motivo de fallback e de degradação, quando conhecidos

Os campos que podem ser desconhecidos são representados como `null`; campos discriminadores, como modo de runtime e origem da seleção, permanecem não anuláveis. Mecanismos mais antigos continuam compatíveis: se um mecanismo legado estrito rejeitar `runtimeSettings` como uma propriedade desconhecida, o OpenClaw repetirá a chamada de ciclo de vida sem ela, em vez de colocar o mecanismo em quarentena.

### Requisitos do host

Os mecanismos de contexto podem declarar requisitos de capacidade do host em `info.hostRequirements`.
O OpenClaw verifica esses requisitos antes de iniciar a operação e adota uma postura de falha fechada, com um erro descritivo, quando o runtime selecionado não consegue atendê-los.

Para execuções de agente, declare `assemble-before-prompt` quando o mecanismo precisar controlar o prompt efetivo do modelo por meio de `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use o runtime nativo do Codex ou o runtime incorporado do OpenClaw, ou selecione o mecanismo de contexto legado.",
    },
  },
}
```

As execuções de agente do Codex nativo e do OpenClaw incorporado atendem a `assemble-before-prompt`.
Backends de CLI genéricos não atendem, portanto, mecanismos que exigem essa capacidade são rejeitados antes que o processo da CLI seja iniciado.

### Isolamento de falhas

O OpenClaw isola o mecanismo do plugin selecionado do fluxo principal de respostas. Se um mecanismo não legado estiver ausente, falhar na validação de contrato, lançar uma exceção durante a criação da fábrica ou lançar uma exceção em um método de ciclo de vida, o OpenClaw colocará esse mecanismo em quarentena no processo atual do Gateway e rebaixará o trabalho do mecanismo de contexto para o mecanismo `legacy` integrado. O erro é registrado com a operação que falhou, para que o operador possa reparar, atualizar ou desativar o plugin sem que o agente deixe de responder.

As falhas de requisitos do host são diferentes: quando um mecanismo declara que um runtime não possui uma capacidade obrigatória, o OpenClaw adota uma postura de falha fechada antes de iniciar a execução. Isso protege mecanismos que corromperiam o estado se fossem executados em um host sem suporte.

### ownsCompaction

`ownsCompaction` controla se a compactação automática integrada durante a tentativa do runtime do OpenClaw permanece habilitada para a execução:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    O mecanismo controla o comportamento de compactação. O OpenClaw desabilita a compactação automática integrada do runtime do OpenClaw e a pré-verificação genérica de estouro antes do prompt para essa execução, e a implementação de `compact()` do mecanismo é responsável por `/compact`, pela compactação de recuperação de estouro do provedor e por qualquer compactação proativa que queira realizar em `afterTurn()`. O OpenClaw ainda executa a proteção contra estouro antes do prompt quando o mecanismo retorna `promptAuthority: "preassembly_may_overflow"` de `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false ou não definido">
    A compactação automática integrada do runtime do OpenClaw ainda pode ser executada durante o processamento do prompt, mas o método `compact()` do mecanismo ativo ainda é chamado para `/compact` e para a recuperação de estouro.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **não** significa que o OpenClaw retorna automaticamente ao fluxo de compactação do mecanismo legado.
</Warning>

Isso significa que há dois padrões válidos de plugin:

<Tabs>
  <Tab title="Modo proprietário">
    Implemente seu próprio algoritmo de compactação e defina `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo delegado">
    Defina `ownsCompaction: false` e faça `compact()` chamar `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar o comportamento de compactação integrado do OpenClaw.
  </Tab>
</Tabs>

Um `compact()` que não realiza nenhuma operação é inseguro para um mecanismo ativo não proprietário, pois desabilita o fluxo normal de compactação de `/compact` e de recuperação de estouro para o slot desse mecanismo.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Selecione o mecanismo de contexto ativo. Padrão: "legacy".
      // Defina como o id de um plugin para usar um mecanismo de plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
O slot é exclusivo em tempo de execução — apenas um mecanismo de contexto registrado é resolvido para uma determinada execução ou operação de compactação. Outros plugins `kind: "context-engine"` habilitados ainda podem ser carregados e executar seu código de registro; `plugins.slots.contextEngine` apenas seleciona qual id de mecanismo registrado o OpenClaw resolve quando precisa de um mecanismo de contexto.
</Note>

<Note>
**Desinstalação de plugin:** quando você desinstala o plugin atualmente selecionado como `plugins.slots.contextEngine`, o OpenClaw redefine o slot para o padrão (`legacy`). O mesmo comportamento de redefinição se aplica a `plugins.slots.memory`. Nenhuma edição manual da configuração é necessária.
</Note>

## Relação com compactação e memória

<AccordionGroup>
  <Accordion title="Compaction">
    A compactação é uma das responsabilidades do mecanismo de contexto. O mecanismo legado delega à sumarização integrada do OpenClaw. Os mecanismos de plugin podem implementar qualquer estratégia de compactação (resumos em DAG, recuperação vetorial etc.).
  </Accordion>
  <Accordion title="Plugins de memória">
    Plugins de memória (`plugins.slots.memory`) são separados dos mecanismos de contexto. Plugins de memória fornecem pesquisa/recuperação; mecanismos de contexto controlam o que o modelo vê. Eles podem trabalhar em conjunto — um mecanismo de contexto pode usar dados de plugins de memória durante a montagem. Mecanismos de plugin que desejam usar o fluxo de prompt da memória ativa devem preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que converte as seções ativas do prompt de memória em um `systemPromptAddition` pronto para ser anexado no início. Se um mecanismo precisar de controle de nível mais baixo, ainda poderá obter linhas brutas de `openclaw/plugin-sdk/memory-host-core` por meio de `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sessão">
    A remoção de resultados antigos de ferramentas na memória continua sendo executada independentemente do mecanismo de contexto ativo.
  </Accordion>
</AccordionGroup>

## Dicas

- Use `openclaw doctor` para verificar se seu mecanismo está sendo carregado corretamente.
- Ao trocar de mecanismo, as sessões existentes continuam com o histórico atual. O novo mecanismo assume as execuções futuras.
- Os erros do mecanismo são registrados, e o mecanismo do plugin selecionado é colocado em quarentena no processo atual do Gateway. O OpenClaw retorna a `legacy` para os turnos do usuário, permitindo que as respostas continuem, mas você ainda deve reparar, atualizar, desativar ou desinstalar o plugin com defeito.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um diretório de plugin local sem copiá-lo.

## Relacionados

- [Compaction](/pt-BR/concepts/compaction) — sumarização de conversas longas
- [Contexto](/pt-BR/concepts/context) — como o contexto é criado para os turnos do agente
- [Arquitetura de plugins](/pt-BR/plugins/architecture) — registro de plugins de mecanismo de contexto
- [Manifesto do plugin](/pt-BR/plugins/manifest) — campos do manifesto do plugin
- [Plugins](/pt-BR/tools/plugin) — visão geral dos plugins

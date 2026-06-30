---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o mecanismo legado e um mecanismo de Plugin
    - Você está criando um Plugin de mecanismo de contexto
sidebarTitle: Context engine
summary: 'Mecanismo de contexto: montagem de contexto plugável, Compaction e ciclo de vida de subagente'
title: Mecanismo de contexto
x-i18n:
    generated_at: "2026-06-30T13:53:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Um **mecanismo de contexto** controla como o OpenClaw cria o contexto do modelo para cada execução: quais mensagens incluir, como resumir o histórico mais antigo e como gerenciar o contexto entre limites de subagentes.

O OpenClaw inclui um mecanismo `legacy` integrado e o usa por padrão - a maioria dos usuários nunca precisa alterar isso. Instale e selecione um mecanismo de Plugin somente quando quiser comportamentos diferentes de montagem, Compaction ou recuperação entre sessões.

## Início rápido

<Steps>
  <Step title="Verificar qual mecanismo está ativo">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instalar um mecanismo de Plugin">
    Plugins de mecanismo de contexto são instalados como qualquer outro Plugin do OpenClaw.

    <Tabs>
      <Tab title="Do npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="De um caminho local">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Habilitar e selecionar o mecanismo">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Reinicie o Gateway depois de instalar e configurar.

  </Step>
  <Step title="Voltar para legacy (opcional)">
    Defina `contextEngine` como `"legacy"` (ou remova totalmente a chave - `"legacy"` é o padrão).
  </Step>
</Steps>

## Como funciona

Sempre que o OpenClaw executa um prompt de modelo, o mecanismo de contexto participa em quatro pontos do ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingestão">
    Chamado quando uma nova mensagem é adicionada à sessão. O mecanismo pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
  </Accordion>
  <Accordion title="2. Montagem">
    Chamado antes de cada execução de modelo. O mecanismo retorna um conjunto ordenado de mensagens (e uma `systemPromptAddition` opcional) que cabe no orçamento de tokens.
  </Accordion>
  <Accordion title="3. Compactar">
    Chamado quando a janela de contexto está cheia ou quando o usuário executa `/compact`. O mecanismo resume o histórico mais antigo para liberar espaço.
  </Accordion>
  <Accordion title="4. Após o turno">
    Chamado depois que uma execução é concluída. O mecanismo pode persistir estado, acionar Compaction em segundo plano ou atualizar índices.
  </Accordion>
</AccordionGroup>

Para o harness Codex não ACP incluído, o OpenClaw aplica o mesmo ciclo de vida projetando o contexto montado nas instruções de desenvolvedor do Codex e no prompt do turno atual. O Codex ainda controla seu histórico de thread nativo e seu compactador nativo.

### Ciclo de vida de subagente (opcional)

O OpenClaw chama dois hooks opcionais de ciclo de vida de subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara o estado de contexto compartilhado antes que uma execução filha comece. O hook recebe chaves de sessão pai/filha, `contextMode` (`isolated` ou `fork`), ids/arquivos de transcrição disponíveis e TTL opcional. Se ele retornar um identificador de rollback, o OpenClaw o chama quando a criação falha depois que a preparação é concluída. Criações de subagente nativas que solicitam `lightContext` e resolvem para `contextMode="isolated"` ignoram intencionalmente esse hook para que o filho comece a partir do contexto de bootstrap leve, sem estado pré-criação gerenciado pelo mecanismo de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpa recursos quando uma sessão de subagente é concluída ou varrida.
</ParamField>

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw a antepõe ao prompt do sistema da execução. Isso permite que mecanismos injetem orientações dinâmicas de recuperação, instruções de busca ou dicas sensíveis ao contexto sem exigir arquivos estáticos no workspace.

## O mecanismo legacy

O mecanismo `legacy` integrado preserva o comportamento original do OpenClaw:

- **Ingestão**: sem operação (o gerenciador de sessões trata a persistência de mensagens diretamente).
- **Montagem**: repasse (o pipeline existente de sanitização → validação → limite no runtime trata a montagem de contexto).
- **Compactar**: delega à Compaction de sumarização integrada, que cria um único resumo das mensagens mais antigas e mantém intactas as mensagens recentes.
- **Após o turno**: sem operação.

O mecanismo legacy não registra ferramentas nem fornece uma `systemPromptAddition`.

Quando nenhum `plugins.slots.contextEngine` é definido (ou ele é definido como `"legacy"`), esse mecanismo é usado automaticamente.

## Mecanismos de Plugin

Um Plugin pode registrar um mecanismo de contexto usando a API de Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

A fábrica `ctx` inclui valores opcionais de `config`, `agentDir` e `workspaceDir`
para que Plugins possam inicializar estado por agente ou por workspace antes que o
primeiro hook de ciclo de vida seja executado.

Depois, habilite-o na configuração:

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

| Membro             | Tipo        | Finalidade                                                |
| ------------------ | ----------- | --------------------------------------------------------- |
| `info`             | Propriedade | Id, nome e versão do mecanismo, e se ele controla Compaction |
| `ingest(params)`   | Método      | Armazenar uma única mensagem                              |
| `assemble(params)` | Método      | Criar contexto para uma execução de modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método      | Resumir/reduzir contexto                                  |

`assemble` retorna um `AssembleResult` com:

<ParamField path="messages" type="Message[]" required>
  As mensagens ordenadas para enviar ao modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  A estimativa do mecanismo do total de tokens no contexto montado. O OpenClaw usa isso para decisões de limite de Compaction e relatórios de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anexado antes do prompt do sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qual estimativa de tokens o executor usa para pré-verificações
  preventivas de overflow. O padrão é `"assembled"`, o que significa que apenas
  a estimativa do prompt montado é verificada para mecanismos que não controlam
  Compaction. Mecanismos que definem `ownsCompaction: true` gerenciam sua própria
  admissão de prompts, então o OpenClaw ignora por padrão a pré-verificação
  genérica antes do prompt. Defina `"preassembly_may_overflow"` somente quando
  sua visão montada puder ocultar risco de overflow na transcrição subjacente;
  então o executor mantém a pré-verificação genérica ativa e usa o máximo entre
  a estimativa montada e a estimativa do histórico de sessão pré-montagem (sem
  janela) ao decidir se deve compactar preventivamente. De qualquer forma, as
  mensagens que você retorna ainda são o que o modelo vê - `promptAuthority`
  afeta apenas a pré-verificação.
</ParamField>

`compact` retorna um `CompactResult`. Quando a Compaction rotaciona a
transcrição ativa, `result.sessionId` e `result.sessionFile` identificam a sessão
sucessora que a próxima nova tentativa ou turno deve usar.

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                      |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do mecanismo para uma sessão. Chamado uma vez quando o mecanismo vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como lote. Chamado depois que uma execução é concluída, com todas as mensagens daquele turno de uma vez. |
| `afterTurn(params)`            | Método | Trabalho de ciclo de vida pós-execução (persistir estado, acionar Compaction em segundo plano).                 |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha antes que ela comece.                                     |
| `onSubagentEnded(params)`      | Método | Limpar recursos depois que um subagente termina.                                                               |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do Gateway ou recarregamento de Plugin - não por sessão.       |

### Configurações de runtime

Hooks de ciclo de vida executados dentro do OpenClaw recebem um objeto
`runtimeSettings` opcional. Ele é uma superfície de API interna versionada e
somente leitura de produtor/consumidor: o OpenClaw a produz para o mecanismo de
contexto selecionado, e o mecanismo de contexto a consome dentro dos hooks de
ciclo de vida. Ela não é renderizada diretamente para usuários e não cria uma
superfície dedicada de relatório.

- `schemaVersion`: atualmente `1`
- `runtime`: host do OpenClaw, modo de runtime (`normal`, `fallback` ou
  `degraded`) e ids opcionais de harness/runtime
- `contextEngineSelection`: id do mecanismo de contexto selecionado e origem da seleção
- `executionHost`: id e rótulo do host para a superfície que invoca o hook
- `model`: modelo solicitado, modelo resolvido, provedor e família de modelo opcional
- `limits`: orçamento de tokens do prompt e tokens máximos de saída quando conhecidos
- `diagnostics`: códigos fechados de motivo de fallback e degraded quando conhecidos

Campos que podem ser desconhecidos são representados como `null`; campos
discriminadores, como modo de runtime e origem da seleção, permanecem não
anuláveis. Mecanismos mais antigos permanecem compatíveis: se um mecanismo
legacy estrito rejeitar `runtimeSettings` como uma propriedade desconhecida, o
OpenClaw tenta novamente a chamada do ciclo de vida sem ela, em vez de colocar o
mecanismo em quarentena.

### Requisitos de host

Mecanismos de contexto podem declarar requisitos de capacidade de host em `info.hostRequirements`.
O OpenClaw verifica esses requisitos antes de iniciar a operação e falha fechado
com um erro descritivo quando o runtime selecionado não consegue satisfazê-los.

Para execuções de agente, declare `assemble-before-prompt` quando o mecanismo precisar controlar o
prompt real do modelo por meio de `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Execuções de agente nativas do Codex e incorporadas ao OpenClaw satisfazem `assemble-before-prompt`.
Backends genéricos de CLI não satisfazem, então mecanismos que o exigem são rejeitados antes que o
processo de CLI comece.

### Isolamento de falhas

O OpenClaw isola o mecanismo de Plugin selecionado do caminho principal de resposta. Se um
mecanismo não legado estiver ausente, falhar na validação de contrato, gerar erro durante a
criação da fábrica ou gerar erro em um método de ciclo de vida, o OpenClaw coloca esse mecanismo
em quarentena no processo atual do Gateway e rebaixa o trabalho de mecanismo de contexto para o
mecanismo `legacy` integrado. O erro é registrado com a operação que falhou para que o
operador possa reparar, atualizar ou desabilitar o Plugin sem que o agente fique
silencioso.

Falhas de requisitos do host são diferentes: quando um mecanismo declara que um runtime
não tem uma capacidade obrigatória, o OpenClaw falha de modo fechado antes de iniciar a execução. Isso
protege mecanismos que corromperiam o estado se fossem executados em um host sem suporte.

### ownsCompaction

`ownsCompaction` controla se a compactação automática integrada durante a tentativa do runtime do OpenClaw permanece habilitada para a execução:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    O mecanismo é dono do comportamento de compactação. O OpenClaw desabilita a compactação automática integrada do runtime do OpenClaw e a pré-verificação genérica de estouro antes do prompt para essa execução, e a implementação `compact()` do mecanismo é responsável por `/compact`, pela compactação de recuperação de estouro do provedor e por qualquer compactação proativa que ele queira fazer em `afterTurn()`. O OpenClaw ainda executa a proteção contra estouro antes do prompt quando o mecanismo retorna `promptAuthority: "preassembly_may_overflow"` de `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false ou não definido">
    A compactação automática integrada do runtime do OpenClaw ainda pode ser executada durante a execução do prompt, mas o método `compact()` do mecanismo ativo ainda é chamado para `/compact` e recuperação de estouro.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **não** significa que o OpenClaw volta automaticamente para o caminho de compactação do mecanismo legado.
</Warning>

Isso significa que há dois padrões válidos de Plugin:

<Tabs>
  <Tab title="Modo de propriedade">
    Implemente seu próprio algoritmo de compactação e defina `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo de delegação">
    Defina `ownsCompaction: false` e faça `compact()` chamar `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar o comportamento de compactação integrado do OpenClaw.
  </Tab>
</Tabs>

Um `compact()` sem operação é inseguro para um mecanismo ativo que não é proprietário porque desabilita o caminho normal de compactação de `/compact` e recuperação de estouro para esse slot de mecanismo.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
O slot é exclusivo em tempo de execução - apenas um mecanismo de contexto registrado é resolvido para uma determinada execução ou operação de compactação. Outros Plugins `kind: "context-engine"` habilitados ainda podem carregar e executar seu código de registro; `plugins.slots.contextEngine` seleciona apenas qual id de mecanismo registrado o OpenClaw resolve quando precisa de um mecanismo de contexto.
</Note>

<Note>
**Desinstalação de Plugin:** quando você desinstala o Plugin atualmente selecionado como `plugins.slots.contextEngine`, o OpenClaw redefine o slot para o padrão (`legacy`). O mesmo comportamento de redefinição se aplica a `plugins.slots.memory`. Nenhuma edição manual de configuração é necessária.
</Note>

## Relação com Compaction e memória

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction é uma responsabilidade do mecanismo de contexto. O mecanismo legado delega à sumarização integrada do OpenClaw. Mecanismos de Plugin podem implementar qualquer estratégia de compactação (resumos de DAG, recuperação vetorial etc.).
  </Accordion>
  <Accordion title="Plugins de memória">
    Plugins de memória (`plugins.slots.memory`) são separados dos mecanismos de contexto. Plugins de memória fornecem busca/recuperação; mecanismos de contexto controlam o que o modelo vê. Eles podem trabalhar juntos - um mecanismo de contexto pode usar dados de Plugin de memória durante a montagem. Mecanismos de Plugin que querem o caminho de prompt de memória ativo devem preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que converte as seções de prompt de memória ativa em um `systemPromptAddition` pronto para ser prefixado. Se um mecanismo precisar de controle de nível mais baixo, ele ainda pode obter linhas brutas de `openclaw/plugin-sdk/memory-host-core` por meio de `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda da sessão">
    A remoção de resultados antigos de ferramentas em memória ainda é executada independentemente de qual mecanismo de contexto esteja ativo.
  </Accordion>
</AccordionGroup>

## Dicas

- Use `openclaw doctor` para verificar se seu mecanismo está carregando corretamente.
- Se trocar de mecanismo, as sessões existentes continuam com seu histórico atual. O novo mecanismo assume as execuções futuras.
- Erros de mecanismo são registrados e o mecanismo de Plugin selecionado é colocado em quarentena para o processo atual do Gateway. O OpenClaw volta para `legacy` nas interações do usuário para que as respostas possam continuar, mas você ainda deve reparar, atualizar, desabilitar ou desinstalar o Plugin quebrado.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um diretório de Plugin local sem copiar.

## Relacionados

- [Compaction](/pt-BR/concepts/compaction) - sumarização de conversas longas
- [Contexto](/pt-BR/concepts/context) - como o contexto é criado para interações do agente
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) - registro de Plugins de mecanismo de contexto
- [Manifesto de Plugin](/pt-BR/plugins/manifest) - campos do manifesto de Plugin
- [Plugins](/pt-BR/tools/plugin) - visão geral de Plugins

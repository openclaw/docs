---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o mecanismo legado e um mecanismo de Plugin
    - Você está criando um Plugin de mecanismo de contexto
sidebarTitle: Context engine
summary: 'Mecanismo de contexto: montagem de contexto plugável, Compaction e ciclo de vida de subagente'
title: Mecanismo de contexto
x-i18n:
    generated_at: "2026-04-30T09:44:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Um **mecanismo de contexto** controla como o OpenClaw constrói o contexto do modelo para cada execução: quais mensagens incluir, como resumir o histórico mais antigo e como gerenciar o contexto através dos limites de subagentes.

O OpenClaw vem com um mecanismo `legacy` integrado e o usa por padrão — a maioria dos usuários nunca precisa alterar isso. Instale e selecione um mecanismo de Plugin somente quando quiser um comportamento diferente de montagem, Compaction ou recuperação entre sessões.

## Início rápido

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Plugins de mecanismo de contexto são instalados como qualquer outro Plugin do OpenClaw.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    Reinicie o gateway depois de instalar e configurar.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Defina `contextEngine` como `"legacy"` (ou remova a chave completamente — `"legacy"` é o padrão).
  </Step>
</Steps>

## Como funciona

Toda vez que o OpenClaw executa um prompt de modelo, o mecanismo de contexto participa em quatro pontos do ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Chamado quando uma nova mensagem é adicionada à sessão. O mecanismo pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
  </Accordion>
  <Accordion title="2. Assemble">
    Chamado antes de cada execução de modelo. O mecanismo retorna um conjunto ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe no orçamento de tokens.
  </Accordion>
  <Accordion title="3. Compact">
    Chamado quando a janela de contexto está cheia, ou quando o usuário executa `/compact`. O mecanismo resume o histórico mais antigo para liberar espaço.
  </Accordion>
  <Accordion title="4. After turn">
    Chamado depois que uma execução é concluída. O mecanismo pode persistir estado, acionar Compaction em segundo plano ou atualizar índices.
  </Accordion>
</AccordionGroup>

Para o harness Codex não ACP incluído, o OpenClaw aplica o mesmo ciclo de vida projetando o contexto montado nas instruções de desenvolvedor do Codex e no prompt do turno atual. O Codex ainda controla seu histórico de thread nativo e seu compactador nativo.

### Ciclo de vida de subagente (opcional)

O OpenClaw chama dois hooks opcionais de ciclo de vida de subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepare o estado de contexto compartilhado antes de uma execução filha iniciar. O hook recebe chaves de sessão pai/filha, `contextMode` (`isolated` ou `fork`), ids/arquivos de transcrição disponíveis e TTL opcional. Se ele retornar um manipulador de rollback, o OpenClaw o chama quando o spawn falha depois que a preparação é bem-sucedida.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpe quando uma sessão de subagente for concluída ou varrida.
</ParamField>

### Adição ao prompt de sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw antepõe isso ao prompt de sistema da execução. Isso permite que mecanismos injetem orientações dinâmicas de recuperação, instruções de busca ou dicas sensíveis ao contexto sem exigir arquivos estáticos no workspace.

## O mecanismo legacy

O mecanismo `legacy` integrado preserva o comportamento original do OpenClaw:

- **Ingestão**: sem operação (o gerenciador de sessão cuida diretamente da persistência de mensagens).
- **Montagem**: passagem direta (o pipeline existente sanitize → validate → limit no runtime cuida da montagem do contexto).
- **Compactação**: delega para a Compaction de sumarização integrada, que cria um único resumo das mensagens mais antigas e mantém intactas as mensagens recentes.
- **Após o turno**: sem operação.

O mecanismo legacy não registra ferramentas nem fornece um `systemPromptAddition`.

Quando nenhum `plugins.slots.contextEngine` está definido (ou ele está definido como `"legacy"`), esse mecanismo é usado automaticamente.

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

A fábrica `ctx` inclui valores opcionais `config`, `agentDir` e `workspaceDir`
para que Plugins possam inicializar estado por agente ou por workspace antes que o
primeiro hook de ciclo de vida seja executado.

Então habilite-o na configuração:

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

| Membro             | Tipo     | Finalidade                                               |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriedade | ID do mecanismo, nome, versão e se ele controla a Compaction |
| `ingest(params)`   | Método   | Armazenar uma única mensagem                             |
| `assemble(params)` | Método   | Construir contexto para uma execução de modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método   | Resumir/reduzir contexto                                 |

`assemble` retorna um `AssembleResult` com:

<ParamField path="messages" type="Message[]" required>
  As mensagens ordenadas a enviar para o modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  A estimativa do mecanismo para o total de tokens no contexto montado. O OpenClaw usa isso para decisões de limite de Compaction e relatórios de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto ao prompt de sistema.
</ParamField>

`compact` retorna um `CompactResult`. Quando a Compaction rotaciona a transcrição ativa,
`result.sessionId` e `result.sessionFile` identificam a sessão sucessora
que a próxima tentativa ou turno deve usar.

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                      |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do mecanismo para uma sessão. Chamado uma vez quando o mecanismo vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como um lote. Chamado depois que uma execução é concluída, com todas as mensagens desse turno de uma vez. |
| `afterTurn(params)`            | Método | Trabalho de ciclo de vida pós-execução (persistir estado, acionar Compaction em segundo plano). |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha antes que ela comece. |
| `onSubagentEnded(params)`      | Método | Limpar depois que um subagente termina. |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do gateway ou recarregamento de Plugin — não por sessão. |

### ownsCompaction

`ownsCompaction` controla se a Compaction automática integrada em tentativa do Pi permanece habilitada para a execução:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    O mecanismo controla o comportamento de Compaction. O OpenClaw desabilita a Compaction automática integrada do Pi para essa execução, e a implementação `compact()` do mecanismo é responsável por `/compact`, Compaction de recuperação de estouro e qualquer Compaction proativa que ele queira fazer em `afterTurn()`. O OpenClaw ainda pode executar a proteção pré-prompt contra estouro; quando ela prevê que a transcrição completa vai estourar, o caminho de recuperação chama `compact()` do mecanismo ativo antes de enviar outro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    A Compaction automática integrada do Pi ainda pode ser executada durante a execução do prompt, mas o método `compact()` do mecanismo ativo ainda é chamado para `/compact` e recuperação de estouro.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **não** significa que o OpenClaw volta automaticamente para o caminho de Compaction do mecanismo legacy.
</Warning>

Isso significa que há dois padrões válidos de Plugin:

<Tabs>
  <Tab title="Owning mode">
    Implemente seu próprio algoritmo de Compaction e defina `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Defina `ownsCompaction: false` e faça `compact()` chamar `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar o comportamento de Compaction integrado do OpenClaw.
  </Tab>
</Tabs>

Um `compact()` sem operação é inseguro para um mecanismo ativo que não controla a Compaction, porque ele desabilita o caminho normal de Compaction de `/compact` e recuperação de estouro para esse slot de mecanismo.

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
O slot é exclusivo em tempo de execução — apenas um mecanismo de contexto registrado é resolvido para uma determinada execução ou operação de Compaction. Outros Plugins `kind: "context-engine"` habilitados ainda podem carregar e executar seu código de registro; `plugins.slots.contextEngine` seleciona apenas qual id de mecanismo registrado o OpenClaw resolve quando precisa de um mecanismo de contexto.
</Note>

<Note>
**Desinstalação de Plugin:** quando você desinstala o Plugin atualmente selecionado como `plugins.slots.contextEngine`, o OpenClaw redefine o slot de volta para o padrão (`legacy`). O mesmo comportamento de redefinição se aplica a `plugins.slots.memory`. Nenhuma edição manual de configuração é necessária.
</Note>

## Relação com Compaction e memória

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction é uma responsabilidade do mecanismo de contexto. O mecanismo legado delega para a sumarização integrada do OpenClaw. Mecanismos de Plugin podem implementar qualquer estratégia de compactação (resumos em DAG, recuperação vetorial etc.).
  </Accordion>
  <Accordion title="Plugins de memória">
    Plugins de memória (`plugins.slots.memory`) são separados dos mecanismos de contexto. Plugins de memória fornecem busca/recuperação; mecanismos de contexto controlam o que o modelo vê. Eles podem trabalhar juntos — um mecanismo de contexto pode usar dados do Plugin de memória durante a montagem. Mecanismos de Plugin que quiserem o caminho de prompt da memória ativa devem preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que converte as seções de prompt da memória ativa em um `systemPromptAddition` pronto para ser prependido. Se um mecanismo precisar de controle de nível mais baixo, ele ainda pode obter linhas brutas de `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sessões">
    A remoção de resultados antigos de ferramentas em memória ainda é executada independentemente de qual mecanismo de contexto esteja ativo.
  </Accordion>
</AccordionGroup>

## Dicas

- Use `openclaw doctor` para verificar se seu mecanismo está carregando corretamente.
- Ao trocar de mecanismo, as sessões existentes continuam com seu histórico atual. O novo mecanismo assume para execuções futuras.
- Erros do mecanismo são registrados em logs e exibidos em diagnósticos. Se um mecanismo de Plugin falhar ao se registrar ou se o id do mecanismo selecionado não puder ser resolvido, o OpenClaw não faz fallback automaticamente; as execuções falham até você corrigir o Plugin ou trocar `plugins.slots.contextEngine` de volta para `"legacy"`.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um diretório de Plugin local sem copiar.

## Relacionados

- [Compaction](/pt-BR/concepts/compaction) — resumindo conversas longas
- [Contexto](/pt-BR/concepts/context) — como o contexto é criado para turnos de agente
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — registrando Plugins de mecanismo de contexto
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — campos do manifesto de Plugin
- [Plugins](/pt-BR/tools/plugin) — visão geral de Plugins

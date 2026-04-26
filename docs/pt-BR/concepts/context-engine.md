---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do model
    - Você está alternando entre o mecanismo legado e um mecanismo de Plugin
    - Você está criando um Plugin de mecanismo de contexto
sidebarTitle: Context engine
summary: 'Mecanismo de contexto: montagem de contexto conectável, Compaction e ciclo de vida de subagente'
title: Mecanismo de contexto
x-i18n:
    generated_at: "2026-04-26T11:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Um **mecanismo de contexto** controla como o OpenClaw constrói o contexto do model para cada execução: quais mensagens incluir, como resumir o histórico mais antigo e como gerenciar o contexto através dos limites de subagentes.

O OpenClaw inclui um mecanismo interno `legacy` e o usa por padrão — a maioria dos usuários nunca precisa mudar isso. Instale e selecione um mecanismo de Plugin apenas quando quiser montagem, Compaction ou comportamento de recall entre sessões diferentes.

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
  <Step title="Ative e selecione o mecanismo">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // deve corresponder ao id de mecanismo registrado do Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // A configuração específica do Plugin vai aqui (veja a documentação do Plugin)
          },
        },
      },
    }
    ```

    Reinicie o Gateway após instalar e configurar.

  </Step>
  <Step title="Volte para legacy (opcional)">
    Defina `contextEngine` como `"legacy"` (ou remova a chave completamente — `"legacy"` é o padrão).
  </Step>
</Steps>

## Como funciona

Toda vez que o OpenClaw executa um prompt de model, o mecanismo de contexto participa em quatro pontos do ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Chamado quando uma nova mensagem é adicionada à sessão. O mecanismo pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
  </Accordion>
  <Accordion title="2. Assemble">
    Chamado antes de cada execução de model. O mecanismo retorna um conjunto ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe dentro do orçamento de tokens.
  </Accordion>
  <Accordion title="3. Compact">
    Chamado quando a janela de contexto está cheia, ou quando o usuário executa `/compact`. O mecanismo resume o histórico mais antigo para liberar espaço.
  </Accordion>
  <Accordion title="4. After turn">
    Chamado depois que uma execução termina. O mecanismo pode persistir estado, disparar Compaction em segundo plano ou atualizar índices.
  </Accordion>
</AccordionGroup>

Para o harness Codex não-ACP incluído, o OpenClaw aplica o mesmo ciclo de vida projetando o contexto montado em instruções de desenvolvedor do Codex e no prompt do turno atual. O Codex ainda mantém seu histórico nativo de thread e seu compactador nativo.

### Ciclo de vida de subagente (opcional)

O OpenClaw chama dois hooks opcionais de ciclo de vida de subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara o estado de contexto compartilhado antes de uma execução filha começar. O hook recebe as chaves de sessão pai/filho, `contextMode` (`isolated` ou `fork`), ids/arquivos de transcrição disponíveis e TTL opcional. Se ele retornar um manipulador de rollback, o OpenClaw o chamará quando a inicialização falhar após a preparação ter sido concluída com sucesso.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Faz a limpeza quando uma sessão de subagente é concluída ou removida.
</ParamField>

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw a antepõe ao prompt do sistema para a execução. Isso permite que mecanismos injetem orientação dinâmica de recall, instruções de recuperação ou dicas sensíveis ao contexto sem exigir arquivos estáticos do workspace.

## O mecanismo legacy

O mecanismo interno `legacy` preserva o comportamento original do OpenClaw:

- **Ingest**: no-op (o gerenciador de sessão lida diretamente com a persistência de mensagens).
- **Assemble**: passagem direta (o pipeline existente de sanitize → validate → limit no runtime cuida da montagem do contexto).
- **Compact**: delega à Compaction de sumarização interna, que cria um único resumo das mensagens antigas e mantém intactas as mensagens recentes.
- **After turn**: no-op.

O mecanismo legacy não registra ferramentas nem fornece um `systemPromptAddition`.

Quando `plugins.slots.contextEngine` não está definido (ou está definido como `"legacy"`), esse mecanismo é usado automaticamente.

## Mecanismos de Plugin

Um Plugin pode registrar um mecanismo de contexto usando a API de Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Armazene a mensagem no seu armazenamento de dados
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Retorne mensagens que cabem no orçamento
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
      // Resuma o contexto mais antigo
      return { ok: true, compacted: true };
    },
  }));
}
```

Depois ative-o na configuração:

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
| `info`             | Propriedade | Id, nome, versão do mecanismo e se ele controla a Compaction |
| `ingest(params)`   | Método   | Armazenar uma única mensagem                             |
| `assemble(params)` | Método   | Construir contexto para uma execução de model (retorna `AssembleResult`) |
| `compact(params)`  | Método   | Resumir/reduzir contexto                                 |

`assemble` retorna um `AssembleResult` com:

<ParamField path="messages" type="Message[]" required>
  As mensagens ordenadas para enviar ao model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  A estimativa do mecanismo para o total de tokens no contexto montado. O OpenClaw usa isso para decisões de limite de Compaction e relatórios de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Anteposto ao prompt do sistema.
</ParamField>

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                      |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do mecanismo para uma sessão. Chamado uma vez quando o mecanismo vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Fazer Ingest de um turno concluído como lote. Chamado após uma execução terminar, com todas as mensagens daquele turno de uma vez. |
| `afterTurn(params)`            | Método | Trabalho de ciclo de vida pós-execução (persistir estado, disparar Compaction em segundo plano).                |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha antes de ela começar.                                      |
| `onSubagentEnded(params)`      | Método | Fazer a limpeza depois que um subagente termina.                                                                 |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do Gateway ou recarga do Plugin — não por sessão.              |

### ownsCompaction

`ownsCompaction` controla se a auto-Compaction interna em-attempt do Pi permanece ativada para a execução:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    O mecanismo controla o comportamento de Compaction. O OpenClaw desativa a auto-Compaction interna do Pi para essa execução, e a implementação `compact()` do mecanismo é responsável por `/compact`, Compaction de recuperação por overflow e qualquer Compaction proativa que ele queira fazer em `afterTurn()`. O OpenClaw ainda pode executar a proteção pré-prompt contra overflow; quando prevê que a transcrição completa irá estourar, o caminho de recuperação chama `compact()` do mecanismo ativo antes de enviar outro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    A auto-Compaction interna do Pi ainda pode executar durante a execução do prompt, mas o método `compact()` do mecanismo ativo ainda é chamado para `/compact` e recuperação por overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **não** significa que o OpenClaw automaticamente recorre ao caminho de Compaction do mecanismo legacy.
</Warning>

Isso significa que há dois padrões válidos de Plugin:

<Tabs>
  <Tab title="Modo proprietário">
    Implemente seu próprio algoritmo de Compaction e defina `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo de delegação">
    Defina `ownsCompaction: false` e faça `compact()` chamar `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar o comportamento interno de Compaction do OpenClaw.
  </Tab>
</Tabs>

Um `compact()` no-op é inseguro para um mecanismo ativo não proprietário porque desativa o caminho normal de Compaction de `/compact` e de recuperação por overflow para esse slot de mecanismo.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Seleciona o mecanismo de contexto ativo. Padrão: "legacy".
      // Defina como um id de Plugin para usar um mecanismo de Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
O slot é exclusivo em runtime — apenas um mecanismo de contexto registrado é resolvido para uma determinada execução ou operação de Compaction. Outros Plugins `kind: "context-engine"` ativados ainda podem carregar e executar seu código de registro; `plugins.slots.contextEngine` apenas seleciona qual id de mecanismo registrado o OpenClaw resolve quando precisa de um mecanismo de contexto.
</Note>

<Note>
**Desinstalação de Plugin:** quando você desinstala o Plugin atualmente selecionado como `plugins.slots.contextEngine`, o OpenClaw redefine o slot para o padrão (`legacy`). O mesmo comportamento de redefinição se aplica a `plugins.slots.memory`. Nenhuma edição manual de configuração é necessária.
</Note>

## Relação com Compaction e memória

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction é uma das responsabilidades do mecanismo de contexto. O mecanismo legacy delega à sumarização interna do OpenClaw. Mecanismos de Plugin podem implementar qualquer estratégia de Compaction (resumos DAG, recuperação vetorial etc.).
  </Accordion>
  <Accordion title="Plugins de memória">
    Plugins de memória (`plugins.slots.memory`) são separados dos mecanismos de contexto. Plugins de memória fornecem busca/recuperação; mecanismos de contexto controlam o que o model vê. Eles podem funcionar juntos — um mecanismo de contexto pode usar dados do Plugin de memória durante a montagem. Mecanismos de Plugin que querem o caminho ativo de prompt de memória devem preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que converte as seções ativas do prompt de memória em um `systemPromptAddition` pronto para ser anteposto. Se um mecanismo precisar de controle em nível mais baixo, ainda pode extrair linhas brutas de `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Limpeza de sessões">
    O corte de resultados antigos de ferramentas na memória ainda é executado independentemente de qual mecanismo de contexto esteja ativo.
  </Accordion>
</AccordionGroup>

## Dicas

- Use `openclaw doctor` para verificar se seu mecanismo está carregando corretamente.
- Ao alternar mecanismos, sessões existentes continuam com seu histórico atual. O novo mecanismo assume as execuções futuras.
- Erros do mecanismo são registrados em log e exibidos nos diagnósticos. Se um mecanismo de Plugin falhar ao se registrar ou o id do mecanismo selecionado não puder ser resolvido, o OpenClaw não faz fallback automático; as execuções falham até que você corrija o Plugin ou altere `plugins.slots.contextEngine` de volta para `"legacy"`.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um diretório local de Plugin sem copiar.

## Relacionado

- [Compaction](/pt-BR/concepts/compaction) — resumo de conversas longas
- [Context](/pt-BR/concepts/context) — como o contexto é construído para turnos do agente
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — registro de plugins de mecanismo de contexto
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — campos do manifesto de Plugin
- [Plugins](/pt-BR/tools/plugin) — visão geral de plugins

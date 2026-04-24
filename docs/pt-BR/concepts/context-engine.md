---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o engine legado e um engine de Plugin
    - Você está criando um Plugin de engine de contexto
summary: 'Engine de contexto: montagem de contexto conectável, Compaction e ciclo de vida de subagentes'
title: Engine de contexto
x-i18n:
    generated_at: "2026-04-24T05:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Um **engine de contexto** controla como o OpenClaw monta o contexto do modelo para cada execução:
quais mensagens incluir, como resumir o histórico mais antigo e como gerenciar
o contexto através dos limites de subagentes.

O OpenClaw inclui um engine interno `legacy` e o usa por padrão — a maioria dos
usuários nunca precisa mudar isso. Instale e selecione um engine de Plugin apenas quando
quiser um comportamento diferente de montagem, Compaction ou recuperação entre sessões.

## Início rápido

Verifique qual engine está ativo:

```bash
openclaw doctor
# ou inspecione a configuração diretamente:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalando um Plugin de engine de contexto

Plugins de engine de contexto são instalados como qualquer outro Plugin do OpenClaw. Instale
primeiro e depois selecione o engine no slot:

```bash
# Instalar pelo npm
openclaw plugins install @martian-engineering/lossless-claw

# Ou instalar a partir de um caminho local (para desenvolvimento)
openclaw plugins install -l ./my-context-engine
```

Depois ative o Plugin e selecione-o como engine ativo na sua configuração:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // deve corresponder ao ID de engine registrado do Plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // A configuração específica do Plugin vai aqui (consulte a documentação do Plugin)
      },
    },
  },
}
```

Reinicie o gateway após instalar e configurar.

Para voltar ao engine interno, defina `contextEngine` como `"legacy"` (ou
remova a chave completamente — `"legacy"` é o padrão).

## Como funciona

Toda vez que o OpenClaw executa um prompt de modelo, o engine de contexto participa em
quatro pontos do ciclo de vida:

1. **Ingest** — chamado quando uma nova mensagem é adicionada à sessão. O engine
   pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
2. **Assemble** — chamado antes de cada execução do modelo. O engine retorna um conjunto
   ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe dentro
   do orçamento de tokens.
3. **Compact** — chamado quando a janela de contexto está cheia ou quando o usuário executa
   `/compact`. O engine resume o histórico mais antigo para liberar espaço.
4. **After turn** — chamado depois que uma execução é concluída. O engine pode persistir estado,
   acionar Compaction em segundo plano ou atualizar índices.

Para o harness Codex interno sem ACP, o OpenClaw aplica o mesmo ciclo de vida
projetando o contexto montado nas instruções de desenvolvedor do Codex e no prompt
do turno atual. O Codex ainda mantém seu histórico nativo de thread e seu Compaction nativo.

### Ciclo de vida de subagente (opcional)

O OpenClaw chama dois hooks opcionais do ciclo de vida de subagente:

- **prepareSubagentSpawn** — prepara estado de contexto compartilhado antes de uma execução filha
  começar. O hook recebe chaves de sessão pai/filho, `contextMode`
  (`isolated` ou `fork`), IDs/arquivos de transcrição disponíveis e TTL opcional.
  Se ele retornar um identificador de rollback, o OpenClaw o chamará quando a criação falhar após
  a preparação ter sido bem-sucedida.
- **onSubagentEnded** — faz a limpeza quando uma sessão de subagente é concluída ou removida.

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw
a prefixa ao prompt do sistema da execução. Isso permite que engines injetem
orientação dinâmica de recuperação, instruções de retrieval ou dicas sensíveis ao contexto
sem exigir arquivos estáticos do workspace.

## O engine legado

O engine interno `legacy` preserva o comportamento original do OpenClaw:

- **Ingest**: no-op (o gerenciador de sessão lida diretamente com a persistência de mensagens).
- **Assemble**: pass-through (o pipeline existente sanitize → validate → limit
  no runtime lida com a montagem do contexto).
- **Compact**: delega ao Compaction interno baseado em sumarização, que cria
  um resumo único das mensagens mais antigas e mantém as mensagens recentes intactas.
- **After turn**: no-op.

O engine legado não registra ferramentas nem fornece `systemPromptAddition`.

Quando `plugins.slots.contextEngine` não está definido (ou está definido como `"legacy"`), esse
engine é usado automaticamente.

## Engines de Plugin

Um Plugin pode registrar um engine de contexto usando a API de Plugin:

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
      // Retorne mensagens que caibam no orçamento
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

| Membro             | Tipo      | Finalidade                                               |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Propriedade | ID, nome, versão do engine e se ele controla a Compaction |
| `ingest(params)`   | Método    | Armazenar uma única mensagem                             |
| `assemble(params)` | Método    | Montar contexto para uma execução de modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reduzir contexto                                 |

`assemble` retorna um `AssembleResult` com:

- `messages` — as mensagens ordenadas a serem enviadas ao modelo.
- `estimatedTokens` (obrigatório, `number`) — a estimativa do engine para o total
  de tokens no contexto montado. O OpenClaw usa isso para decisões de limite
  de Compaction e relatórios de diagnóstico.
- `systemPromptAddition` (opcional, `string`) — prefixado ao prompt do sistema.

Membros opcionais:

| Membro                         | Tipo   | Finalidade                                                                                                      |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do engine para uma sessão. Chamado uma vez quando o engine vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como lote. Chamado depois que uma execução é concluída, com todas as mensagens daquele turno de uma vez. |
| `afterTurn(params)`            | Método | Trabalho do ciclo de vida pós-execução (persistir estado, acionar Compaction em segundo plano).                |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha antes de ela começar.                                     |
| `onSubagentEnded(params)`      | Método | Fazer a limpeza depois que um subagente termina.                                                                |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do gateway ou recarga de Plugin — não por sessão.             |

### ownsCompaction

`ownsCompaction` controla se o auto-Compaction interno do Pi durante a tentativa continua
ativado para a execução:

- `true` — o engine controla o comportamento de Compaction. O OpenClaw desativa o
  auto-Compaction interno do Pi para essa execução, e a implementação `compact()` do engine é
  responsável por `/compact`, Compaction de recuperação por overflow e qualquer
  Compaction proativo que queira fazer em `afterTurn()`.
- `false` ou ausente — o auto-Compaction interno do Pi ainda pode ser executado durante a
  execução do prompt, mas o método `compact()` do engine ativo ainda é chamado para
  `/compact` e recuperação por overflow.

`ownsCompaction: false` **não** significa que o OpenClaw automaticamente faz fallback para
o caminho de Compaction do engine legado.

Isso significa que existem dois padrões válidos de Plugin:

- **Modo proprietário** — implemente seu próprio algoritmo de Compaction e defina
  `ownsCompaction: true`.
- **Modo delegado** — defina `ownsCompaction: false` e faça `compact()` chamar
  `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar
  o comportamento interno de Compaction do OpenClaw.

Um `compact()` sem operação é inseguro para um engine ativo não proprietário porque
desativa o caminho normal de `/compact` e de Compaction de recuperação por overflow para esse
slot de engine.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Seleciona o engine de contexto ativo. Padrão: "legacy".
      // Defina como um ID de Plugin para usar um engine de Plugin.
      contextEngine: "legacy",
    },
  },
}
```

O slot é exclusivo em runtime — apenas um engine de contexto registrado é
resolvido para uma determinada execução ou operação de Compaction. Outros
Plugins `kind: "context-engine"` ativados ainda podem ser carregados e executar seu código
de registro; `plugins.slots.contextEngine` seleciona apenas qual ID de engine registrado
o OpenClaw resolve quando precisa de um engine de contexto.

## Relação com Compaction e memória

- **Compaction** é uma das responsabilidades do engine de contexto. O engine legado
  delega à sumarização interna do OpenClaw. Engines de Plugin podem implementar
  qualquer estratégia de Compaction (resumos em DAG, vector retrieval etc.).
- **Plugins de memória** (`plugins.slots.memory`) são separados dos engines de contexto.
  Plugins de memória fornecem busca/retrieval; engines de contexto controlam o que o
  modelo vê. Eles podem trabalhar juntos — um engine de contexto pode usar dados do
  Plugin de memória durante a montagem. Engines de Plugin que querem o caminho ativo de
  prompt de memória devem preferir `buildMemorySystemPromptAddition(...)` de
  `openclaw/plugin-sdk/core`, que converte as seções ativas do prompt de memória
  em um `systemPromptAddition` pronto para prefixação. Se um engine precisar de controle
  de nível mais baixo, ele ainda pode extrair linhas brutas de
  `openclaw/plugin-sdk/memory-host-core` via
  `buildActiveMemoryPromptSection(...)`.
- **Poda de sessão** (remoção de resultados antigos de ferramentas em memória) ainda é executada
  independentemente de qual engine de contexto esteja ativo.

## Dicas

- Use `openclaw doctor` para verificar se seu engine está carregando corretamente.
- Ao trocar de engine, sessões existentes continuam com seu histórico atual.
  O novo engine assume as execuções futuras.
- Erros de engine são registrados e exibidos nos diagnósticos. Se um engine de Plugin
  falhar ao registrar ou o ID do engine selecionado não puder ser resolvido, o OpenClaw
  não faz fallback automaticamente; as execuções falham até você corrigir o Plugin ou
  mudar `plugins.slots.contextEngine` de volta para `"legacy"`.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um
  diretório local de Plugin sem copiar.

Consulte também: [Compaction](/pt-BR/concepts/compaction), [Contexto](/pt-BR/concepts/context),
[Plugins](/pt-BR/tools/plugin), [Manifesto de Plugin](/pt-BR/plugins/manifest).

## Relacionado

- [Contexto](/pt-BR/concepts/context) — como o contexto é construído para turnos do agente
- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — registro de Plugins de engine de contexto
- [Compaction](/pt-BR/concepts/compaction) — resumir conversas longas

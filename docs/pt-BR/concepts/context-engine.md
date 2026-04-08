---
read_when:
    - Você quer entender como o OpenClaw monta o contexto do modelo
    - Você está alternando entre o motor legado e um motor de plugin
    - Você está criando um plugin de motor de contexto
summary: 'Motor de contexto: montagem de contexto conectável, compactação e ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-04-08T02:14:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# Motor de contexto

Um **motor de contexto** controla como o OpenClaw cria o contexto do modelo para cada execução.
Ele decide quais mensagens incluir, como resumir o histórico antigo e como
gerenciar o contexto entre limites de subagentes.

O OpenClaw vem com um motor `legacy` integrado. Plugins podem registrar
motores alternativos que substituem o ciclo de vida ativo do motor de contexto.

## Início rápido

Verifique qual motor está ativo:

```bash
openclaw doctor
# ou inspecione a configuração diretamente:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalando um plugin de motor de contexto

Plugins de motor de contexto são instalados como qualquer outro plugin do OpenClaw. Instale
primeiro e, em seguida, selecione o motor no slot:

```bash
# Instalar a partir do npm
openclaw plugins install @martian-engineering/lossless-claw

# Ou instalar a partir de um caminho local (para desenvolvimento)
openclaw plugins install -l ./my-context-engine
```

Depois, ative o plugin e selecione-o como o motor ativo na sua configuração:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // deve corresponder ao id de motor registrado do plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // A configuração específica do plugin vai aqui (consulte a documentação do plugin)
      },
    },
  },
}
```

Reinicie o gateway após instalar e configurar.

Para voltar ao motor integrado, defina `contextEngine` como `"legacy"` (ou
remova a chave completamente — `"legacy"` é o padrão).

## Como funciona

Toda vez que o OpenClaw executa um prompt de modelo, o motor de contexto participa em
quatro pontos do ciclo de vida:

1. **Ingestão** — chamada quando uma nova mensagem é adicionada à sessão. O motor
   pode armazenar ou indexar a mensagem em seu próprio armazenamento de dados.
2. **Montagem** — chamada antes de cada execução do modelo. O motor retorna um conjunto
   ordenado de mensagens (e um `systemPromptAddition` opcional) que cabe dentro
   do orçamento de tokens.
3. **Compactação** — chamada quando a janela de contexto está cheia, ou quando o usuário executa
   `/compact`. O motor resume o histórico antigo para liberar espaço.
4. **Após o turno** — chamada depois que uma execução é concluída. O motor pode persistir o estado,
   disparar compactação em segundo plano ou atualizar índices.

### Ciclo de vida do subagente (opcional)

Atualmente, o OpenClaw chama um hook de ciclo de vida de subagente:

- **onSubagentEnded** — limpa quando uma sessão de subagente é concluída ou removida.

O hook `prepareSubagentSpawn` faz parte da interface para uso futuro, mas
o runtime ainda não o invoca.

### Adição ao prompt do sistema

O método `assemble` pode retornar uma string `systemPromptAddition`. O OpenClaw
a antepõe ao prompt do sistema para a execução. Isso permite que motores injetem
orientações dinâmicas de recuperação, instruções de recuperação ou dicas
sensíveis ao contexto sem exigir arquivos estáticos do workspace.

## O motor legado

O motor `legacy` integrado preserva o comportamento original do OpenClaw:

- **Ingestão**: no-op (o gerenciador de sessão lida diretamente com a persistência de mensagens).
- **Montagem**: passagem direta (o pipeline existente sanitize → validate → limit
  no runtime lida com a montagem do contexto).
- **Compactação**: delega para a compactação de sumarização integrada, que cria
  um único resumo de mensagens antigas e mantém as mensagens recentes intactas.
- **Após o turno**: no-op.

O motor legado não registra ferramentas nem fornece um `systemPromptAddition`.

Quando nenhum `plugins.slots.contextEngine` é definido (ou quando ele é definido como `"legacy"`), este
motor é usado automaticamente.

## Motores de plugin

Um plugin pode registrar um motor de contexto usando a API de plugin:

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

Depois, ative-o na configuração:

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

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriedade | Id, nome, versão do motor e se ele é dono da compactação |
| `ingest(params)`   | Método   | Armazenar uma única mensagem                                   |
| `assemble(params)` | Método   | Montar o contexto para uma execução de modelo (retorna `AssembleResult`) |
| `compact(params)`  | Método   | Resumir/reduzir o contexto                                 |

`assemble` retorna um `AssembleResult` com:

- `messages` — as mensagens ordenadas a serem enviadas ao modelo.
- `estimatedTokens` (obrigatório, `number`) — a estimativa do motor para o total de
  tokens no contexto montado. O OpenClaw usa isso para decisões de limite
  de compactação e relatórios de diagnóstico.
- `systemPromptAddition` (opcional, `string`) — anteposto ao prompt do sistema.

Membros opcionais:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar o estado do motor para uma sessão. Chamado uma vez quando o motor vê uma sessão pela primeira vez (por exemplo, importar histórico). |
| `ingestBatch(params)`          | Método | Ingerir um turno concluído como lote. Chamado depois que uma execução é concluída, com todas as mensagens daquele turno de uma vez.     |
| `afterTurn(params)`            | Método | Trabalho de ciclo de vida pós-execução (persistir estado, disparar compactação em segundo plano).                                         |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartilhado para uma sessão filha.                                                                        |
| `onSubagentEnded(params)`      | Método | Limpar após o término de um subagente.                                                                                 |
| `dispose()`                    | Método | Liberar recursos. Chamado durante o desligamento do gateway ou recarregamento do plugin — não por sessão.                           |

### ownsCompaction

`ownsCompaction` controla se a auto-compactação integrada em tentativa do Pi permanece
ativada para a execução:

- `true` — o motor é responsável pelo comportamento de compactação. O OpenClaw desativa a auto-compactação integrada do Pi
  para essa execução, e a implementação de `compact()` do motor é
  responsável por `/compact`, compactação de recuperação por overflow e qualquer compactação
  proativa que ele queira fazer em `afterTurn()`.
- `false` ou não definido — a auto-compactação integrada do Pi ainda pode ser executada durante a
  execução do prompt, mas o método `compact()` do motor ativo ainda é chamado para
  `/compact` e recuperação por overflow.

`ownsCompaction: false` **não** significa que o OpenClaw recorre automaticamente a
o caminho de compactação do motor legado.

Isso significa que há dois padrões de plugin válidos:

- **Modo proprietário** — implemente seu próprio algoritmo de compactação e defina
  `ownsCompaction: true`.
- **Modo de delegação** — defina `ownsCompaction: false` e faça `compact()` chamar
  `delegateCompactionToRuntime(...)` de `openclaw/plugin-sdk/core` para usar
  o comportamento de compactação integrado do OpenClaw.

Um `compact()` sem operação é inseguro para um motor ativo não proprietário, porque ele
desativa o caminho normal de compactação de `/compact` e de recuperação por overflow para esse
slot de motor.

## Referência de configuração

```json5
{
  plugins: {
    slots: {
      // Selecione o motor de contexto ativo. Padrão: "legacy".
      // Defina um id de plugin para usar um motor de plugin.
      contextEngine: "legacy",
    },
  },
}
```

O slot é exclusivo em tempo de execução — apenas um motor de contexto registrado é
resolvido para uma determinada execução ou operação de compactação. Outros
plugins `kind: "context-engine"` ativados ainda podem carregar e executar seu código
de registro; `plugins.slots.contextEngine` apenas seleciona qual id de motor registrado
o OpenClaw resolve quando precisa de um motor de contexto.

## Relação com compactação e memória

- **Compactação** é uma das responsabilidades do motor de contexto. O motor legado
  delega para a sumarização integrada do OpenClaw. Motores de plugin podem implementar
  qualquer estratégia de compactação (resumos DAG, recuperação vetorial etc.).
- **Plugins de memória** (`plugins.slots.memory`) são separados dos motores de contexto.
  Plugins de memória fornecem busca/recuperação; motores de contexto controlam o que o
  modelo vê. Eles podem trabalhar juntos — um motor de contexto pode usar dados do
  plugin de memória durante a montagem. Motores de plugin que quiserem o caminho
  de prompt de memória ativo devem preferir `buildMemorySystemPromptAddition(...)` de
  `openclaw/plugin-sdk/core`, que converte as seções do prompt de memória ativo
  em um `systemPromptAddition` pronto para ser anteposto. Se um motor precisar de controle
  de nível mais baixo, ele ainda pode extrair linhas brutas de
  `openclaw/plugin-sdk/memory-host-core` via
  `buildActiveMemoryPromptSection(...)`.
- **Poda de sessão** (remoção de resultados antigos de ferramentas da memória) ainda é executada
  independentemente de qual motor de contexto está ativo.

## Dicas

- Use `openclaw doctor` para verificar se seu motor está sendo carregado corretamente.
- Se estiver alternando motores, as sessões existentes continuam com seu histórico atual.
  O novo motor assume para execuções futuras.
- Erros do motor são registrados em logs e exibidos em diagnósticos. Se um motor de plugin
  falhar ao registrar ou se o id de motor selecionado não puder ser resolvido, o OpenClaw
  não faz fallback automático; as execuções falham até que você corrija o plugin ou
  altere `plugins.slots.contextEngine` de volta para `"legacy"`.
- Para desenvolvimento, use `openclaw plugins install -l ./my-engine` para vincular um
  diretório de plugin local sem copiar.

Veja também: [Compactação](/pt-BR/concepts/compaction), [Contexto](/pt-BR/concepts/context),
[Plugins](/pt-BR/tools/plugin), [Manifesto do plugin](/pt-BR/plugins/manifest).

## Relacionado

- [Contexto](/pt-BR/concepts/context) — como o contexto é criado para os turnos do agente
- [Arquitetura de plugins](/pt-BR/plugins/architecture) — registrando plugins de motor de contexto
- [Compactação](/pt-BR/concepts/compaction) — resumindo conversas longas

---
read_when:
    - Você quer entender a compactação automática e /compact
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compactação
x-i18n:
    generated_at: "2026-04-08T02:14:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6590b82a8c3a9c310998d653459ca4d8612495703ca0a8d8d306d7643142fd1
    source_path: concepts/compaction.md
    workflow: 15
---

# Compactação

Todo modelo tem uma janela de contexto -- o número máximo de tokens que ele pode processar.
Quando uma conversa se aproxima desse limite, o OpenClaw **compacta** as mensagens
mais antigas em um resumo para que o chat possa continuar.

## Como funciona

1. Os turnos mais antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. As mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de compactação, ele mantém as
chamadas de ferramenta do assistente emparelhadas com suas entradas `toolResult`
correspondentes. Se um ponto de divisão cair dentro de um bloco de ferramenta,
o OpenClaw move o limite para que o par permaneça junto e
a cauda atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. A compactação só altera o que o
modelo vê no próximo turno.

## Compactação automática

A compactação automática vem ativada por padrão. Ela é executada quando a sessão se aproxima do
limite de contexto, ou quando o modelo retorna um erro de estouro de contexto (nesse caso,
o OpenClaw compacta e tenta novamente). Assinaturas típicas de estouro incluem
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar notas importantes
em arquivos de [memória](/pt-BR/concepts/memory). Isso evita perda de contexto.
</Info>

Use a configuração `agents.defaults.compaction` no seu `openclaw.json` para configurar o comportamento da compactação (modo, tokens alvo etc.).
A sumarização da compactação preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Você pode substituir isso com `identifierPolicy: "off"` ou fornecer texto personalizado com `identifierPolicy: "custom"` e `identifierInstructions`.

Opcionalmente, você pode especificar um modelo diferente para a sumarização da compactação por meio de `agents.defaults.compaction.model`. Isso é útil quando seu modelo principal é um modelo local ou pequeno e você quer que os resumos de compactação sejam produzidos por um modelo mais capaz. A substituição aceita qualquer string `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Isso também funciona com modelos locais, por exemplo um segundo modelo do Ollama dedicado à sumarização ou um especialista em compactação ajustado finamente:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Quando não definido, a compactação usa o modelo principal do agente.

## Provedores de compactação conectáveis

Plugins podem registrar um provedor de compactação personalizado por meio de `registerCompactionProvider()` na API do plugin. Quando um provedor está registrado e configurado, o OpenClaw delega a sumarização a ele em vez de usar o pipeline de LLM integrado.

Para usar um provedor registrado, defina o id do provedor na sua configuração:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Definir um `provider` força automaticamente `mode: "safeguard"`. Os provedores recebem as mesmas instruções de compactação e a mesma política de preservação de identificadores do caminho integrado, e o OpenClaw ainda preserva o contexto de sufixo de turnos recentes e de turnos divididos após a saída do provedor. Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre à sumarização por LLM integrada.

## Compactação automática (ativada por padrão)

Quando uma sessão se aproxima ou excede a janela de contexto do modelo, o OpenClaw aciona a compactação automática e pode tentar novamente a solicitação original usando o contexto compactado.

Você verá:

- `🧹 Auto-compaction complete` no modo detalhado
- `/status` mostrando `🧹 Compactions: <count>`

Antes da compactação, o OpenClaw pode executar um turno de **descarregamento silencioso de memória** para armazenar
notas persistentes no disco. Consulte [Memória](/pt-BR/concepts/memory) para detalhes e configuração.

## Compactação manual

Digite `/compact` em qualquer chat para forçar uma compactação. Adicione instruções para orientar
o resumo:

```
/compact Focus on the API design decisions
```

## Usar um modelo diferente

Por padrão, a compactação usa o modelo principal do seu agente. Você pode usar um modelo mais
capaz para obter resumos melhores:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Aviso de início da compactação

Por padrão, a compactação é executada silenciosamente. Para mostrar um aviso breve quando a compactação
começar, ative `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Quando ativado, o usuário vê uma mensagem curta (por exemplo, "Compactando
contexto...") no início de cada execução de compactação.

## Compactação vs poda

|                  | Compactação                   | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **O que faz**    | Resume a conversa mais antiga | Remove resultados antigos de ferramentas |
| **Salvo?**       | Sim (na transcrição da sessão)   | Não (somente na memória, por solicitação) |
| **Escopo**       | Conversa inteira           | Somente resultados de ferramentas                |

A [poda de sessão](/pt-BR/concepts/session-pruning) é um complemento mais leve que
remove a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com muita frequência?** A janela de contexto do modelo pode ser pequena, ou as saídas de
ferramentas podem ser grandes. Tente ativar a
[poda de sessão](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a compactação?** Use `/compact Focus on <topic>` para
orientar o resumo, ou ative o [descarregamento de memória](/pt-BR/concepts/memory) para que as notas
sejam preservadas.

**Precisa de uma página em branco?** `/new` inicia uma sessão nova sem compactar.

Para configuração avançada (reserva de tokens, preservação de identificadores, mecanismos de
contexto personalizados, compactação do lado do servidor da OpenAI), consulte a
[Análise aprofundada do gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

## Relacionado

- [Sessão](/pt-BR/concepts/session) — gerenciamento e ciclo de vida da sessão
- [Poda de sessão](/pt-BR/concepts/session-pruning) — remoção de resultados de ferramentas
- [Contexto](/pt-BR/concepts/context) — como o contexto é montado para os turnos do agente
- [Hooks](/pt-BR/automation/hooks) — hooks do ciclo de vida da compactação (before_compaction, after_compaction)

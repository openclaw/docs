---
read_when:
    - Você quer entender a compactação automática e `/compact`
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Todo modelo tem uma janela de contexto — o número máximo de tokens que ele pode processar.
Quando uma conversa se aproxima desse limite, o OpenClaw faz **Compaction** das mensagens mais antigas
em um resumo para que o chat possa continuar.

## Como funciona

1. Turnos mais antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. As mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de Compaction, ele mantém chamadas de ferramenta do assistente
emparelhadas com suas entradas `toolResult` correspondentes. Se um ponto de divisão cair
dentro de um bloco de ferramenta, o OpenClaw move o limite para que o par permaneça junto e
a cauda atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. O Compaction altera apenas o que o
modelo vê no próximo turno.

## Compaction automática

A Compaction automática vem ativada por padrão. Ela é executada quando a sessão se aproxima do limite de contexto,
ou quando o modelo retorna um erro de estouro de contexto (nesse caso,
o OpenClaw faz Compaction e tenta novamente). Assinaturas típicas de estouro incluem
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Antes de fazer Compaction, o OpenClaw lembra automaticamente o agente de salvar notas importantes
em arquivos de [memory](/pt-BR/concepts/memory). Isso evita perda de contexto.
</Info>

Use a configuração `agents.defaults.compaction` no seu `openclaw.json` para configurar o comportamento de Compaction (modo, tokens de destino etc.).
O resumo de Compaction preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Você pode substituir isso por `identifierPolicy: "off"` ou fornecer texto personalizado com `identifierPolicy: "custom"` e `identifierInstructions`.

Opcionalmente, você pode especificar um modelo diferente para o resumo de Compaction por meio de `agents.defaults.compaction.model`. Isso é útil quando seu modelo principal é local ou pequeno e você quer que os resumos de Compaction sejam produzidos por um modelo mais capaz. A substituição aceita qualquer string `provider/model-id`:

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

Isso também funciona com modelos locais, por exemplo, um segundo modelo Ollama dedicado a sumarização ou um especialista em Compaction ajustado finamente:

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

Quando não definido, o Compaction usa o modelo principal do agente.

## Provedores de Compaction conectáveis

Plugins podem registrar um provedor de Compaction personalizado por meio de `registerCompactionProvider()` na API do plugin. Quando um provedor é registrado e configurado, o OpenClaw delega a sumarização a ele em vez de usar o pipeline de LLM integrado.

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

Definir um `provider` força automaticamente `mode: "safeguard"`. Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado, e o OpenClaw ainda preserva o contexto do sufixo de turnos recentes e turnos divididos após a saída do provedor. Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta para a sumarização por LLM integrada.

## Compaction automática (ativada por padrão)

Quando uma sessão se aproxima ou ultrapassa a janela de contexto do modelo, o OpenClaw aciona a Compaction automática e pode tentar novamente a solicitação original usando o contexto compactado.

Você verá:

- `🧹 Auto-compaction complete` no modo detalhado
- `/status` mostrando `🧹 Compactions: <count>`

Antes da Compaction, o OpenClaw pode executar um turno de **memory flush silencioso** para armazenar
notas duráveis no disco. Consulte [Memory](/pt-BR/concepts/memory) para detalhes e configuração.

## Compaction manual

Digite `/compact` em qualquer chat para forçar uma Compaction. Adicione instruções para orientar
o resumo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` estiver definido, a Compaction manual
respeita esse ponto de corte do Pi e mantém a cauda recente no contexto reconstruído. Sem
um orçamento explícito de preservação, a Compaction manual se comporta como um checkpoint rígido e
continua apenas a partir do novo resumo.

## Usando um modelo diferente

Por padrão, a Compaction usa o modelo principal do seu agente. Você pode usar um modelo mais
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

## Avisos de Compaction

Por padrão, a Compaction é executada silenciosamente. Para mostrar avisos breves quando a Compaction
começa e quando ela termina, ative `notifyUser`:

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

Quando ativado, o usuário vê mensagens curtas de status durante cada execução de Compaction
(por exemplo, "Compacting context..." e "Compaction complete").

## Compaction vs pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **O que faz**    | Resume conversas mais antigas | Remove resultados antigos de ferramentas |
| **Salvo?**       | Sim (na transcrição da sessão) | Não (somente em memória, por solicitação) |
| **Escopo**       | Conversa inteira              | Apenas resultados de ferramentas |

[Session pruning](/pt-BR/concepts/session-pruning) é um complemento mais leve que
remove a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com muita frequência?** A janela de contexto do modelo pode ser pequena, ou as saídas de ferramentas
podem ser grandes. Tente ativar
[session pruning](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a Compaction?** Use `/compact Focus on <topic>` para
orientar o resumo, ou ative o [memory flush](/pt-BR/concepts/memory) para que as notas
permaneçam.

**Precisa de um recomeço?** `/new` inicia uma sessão nova sem fazer Compaction.

Para configuração avançada (tokens reservados, preservação de identificadores, mecanismos de
contexto personalizados, Compaction do lado do servidor OpenAI), consulte o
[Guia detalhado de gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

## Relacionado

- [Session](/pt-BR/concepts/session) — gerenciamento e ciclo de vida da sessão
- [Session Pruning](/pt-BR/concepts/session-pruning) — remoção de resultados de ferramentas
- [Context](/pt-BR/concepts/context) — como o contexto é construído para turnos do agente
- [Hooks](/pt-BR/automation/hooks) — hooks do ciclo de vida de Compaction (before_compaction, after_compaction)

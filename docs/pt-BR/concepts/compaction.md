---
read_when:
    - Você quer entender a compactação automática e /compact
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compaction
x-i18n:
    generated_at: "2026-04-30T09:43:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Cada modelo tem uma janela de contexto: o número máximo de tokens que ele consegue processar. Quando uma conversa se aproxima desse limite, o OpenClaw faz **compacts** de mensagens antigas em um resumo para que o chat possa continuar.

## Como funciona

1. Turnos antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. Mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de compaction, ele mantém as chamadas de ferramenta do assistente emparelhadas com suas entradas `toolResult` correspondentes. Se um ponto de divisão cair dentro de um bloco de ferramenta, o OpenClaw move o limite para que o par permaneça junto e a parte final atual não resumida seja preservada.

O histórico completo da conversa permanece em disco. Compaction só altera o que o modelo vê no próximo turno.

## Auto-compaction

Auto-compaction vem ativada por padrão. Ela é executada quando a sessão se aproxima do limite de contexto, ou quando o modelo retorna um erro de estouro de contexto (nesse caso, o OpenClaw compacta e tenta novamente).

Você verá:

- `🧹 Auto-compaction complete` no modo detalhado.
- `/status` mostrando `🧹 Compactions: <count>`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar notas importantes em arquivos de [memory](/pt-BR/concepts/memory). Isso evita perda de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Assinaturas de estouro reconhecidas">
    O OpenClaw detecta estouro de contexto a partir destes padrões de erro de provedor:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Digite `/compact` em qualquer chat para forçar uma compaction. Adicione instruções para orientar o resumo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` está definido, a compaction manual respeita esse ponto de corte do Pi e mantém a parte final recente no contexto reconstruído. Sem um orçamento explícito de preservação, a compaction manual se comporta como um checkpoint rígido e continua apenas a partir do novo resumo.

## Configuração

Configure a compaction em `agents.defaults.compaction` no seu `openclaw.json`. Os controles mais comuns estão listados abaixo; para a referência completa, consulte [Aprofundamento em gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

### Usando um modelo diferente

Por padrão, a compaction usa o modelo primário do agente. Defina `agents.defaults.compaction.model` para delegar a sumarização a um modelo mais capaz ou especializado. A substituição aceita qualquer string `provider/model-id`:

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

Isso também funciona com modelos locais, por exemplo, um segundo modelo Ollama dedicado à sumarização:

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

Quando não definido, a compaction usa o modelo primário do agente.

### Preservação de identificadores

A sumarização de compaction preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Substitua por `identifierPolicy: "off"` para desativar, ou `identifierPolicy: "custom"` mais `identifierInstructions` para orientação personalizada.

### Proteção por bytes da transcrição ativa

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido, o OpenClaw aciona a compaction local normal antes de uma execução se o JSONL ativo atingir esse tamanho. Isso é útil para sessões de longa duração em que o gerenciamento de contexto do lado do provedor pode manter o contexto do modelo saudável enquanto a transcrição local continua crescendo. Ele não divide bytes JSONL brutos; ele pede ao pipeline normal de compaction para criar um resumo semântico.

<Warning>
A proteção por bytes exige `truncateAfterCompaction: true`. Sem rotação de transcrição, o arquivo ativo não encolheria e a proteção permaneceria inativa.
</Warning>

### Transcrições sucessoras

Quando `agents.defaults.compaction.truncateAfterCompaction` está ativado, o OpenClaw não reescreve a transcrição existente no lugar. Ele cria uma nova transcrição sucessora ativa a partir do resumo de compaction, do estado preservado e da parte final não resumida, e então mantém o JSONL anterior como a fonte de checkpoint arquivada.
As transcrições sucessoras também removem turnos longos de usuário exatamente duplicados que chegam
dentro de uma janela curta de nova tentativa, para que tempestades de repetição do canal não sejam levadas para a
próxima transcrição ativa após a compaction.

Checkpoints pré-compaction são mantidos apenas enquanto permanecem abaixo do limite de tamanho de
checkpoint do OpenClaw; transcrições ativas grandes demais ainda são compactadas, mas o OpenClaw
pula o snapshot grande de depuração em vez de dobrar o uso de disco.

### Avisos de Compaction

Por padrão, a compaction é executada silenciosamente. Defina `notifyUser` para mostrar breves mensagens de status quando a compaction começa e termina:

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

### Liberação de memória

Antes da compaction, o OpenClaw pode executar um turno de **liberação silenciosa de memória** para armazenar notas duráveis em disco. Defina `agents.defaults.compaction.memoryFlush.model` quando esse turno de manutenção deve usar um modelo local em vez do modelo da conversa ativa:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

A substituição do modelo de liberação de memória é exata e não herda a cadeia de fallback da sessão ativa. Consulte [Memória](/pt-BR/concepts/memory) para detalhes e configuração.

## Provedores de compaction plugáveis

Plugins podem registrar um provedor de compaction personalizado via `registerCompactionProvider()` na API do plugin. Quando um provedor está registrado e configurado, o OpenClaw delega a sumarização a ele em vez do pipeline LLM integrado.

Para usar um provedor registrado, defina o id dele na sua configuração:

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

Definir um `provider` força automaticamente `mode: "safeguard"`. Provedores recebem as mesmas instruções de compaction e a mesma política de preservação de identificadores que o caminho integrado, e o OpenClaw ainda preserva o contexto de sufixo de turno recente e turno dividido após a saída do provedor.

<Note>
Se o provedor falhar ou retornar um resultado vazio, o OpenClaw volta para a sumarização LLM integrada.
</Note>

## Compaction vs pruning

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **O que faz**    | Resume a conversa antiga      | Recorta resultados antigos de ferramentas |
| **Salvo?**       | Sim (na transcrição da sessão) | Não (apenas em memória, por solicitação) |
| **Escopo**       | Conversa inteira              | Apenas resultados de ferramentas |

[A poda de sessão](/pt-BR/concepts/session-pruning) é um complemento mais leve que recorta a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com frequência demais?** A janela de contexto do modelo pode ser pequena, ou as saídas de ferramentas podem ser grandes. Tente ativar a [poda de sessão](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a compaction?** Use `/compact Focus on <topic>` para orientar o resumo, ou ative a [liberação de memória](/pt-BR/concepts/memory) para que as notas sobrevivam.

**Precisa de um recomeço limpo?** `/new` inicia uma nova sessão sem compactar.

Para configuração avançada (tokens reservados, preservação de identificadores, mecanismos de contexto personalizados, compaction do lado do servidor OpenAI), consulte o [Aprofundamento em gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

## Relacionados

- [Sessão](/pt-BR/concepts/session): gerenciamento e ciclo de vida da sessão.
- [Poda de sessão](/pt-BR/concepts/session-pruning): recorte de resultados de ferramentas.
- [Contexto](/pt-BR/concepts/context): como o contexto é criado para turnos de agente.
- [Hooks](/pt-BR/automation/hooks): hooks de ciclo de vida de compaction (`before_compaction`, `after_compaction`).

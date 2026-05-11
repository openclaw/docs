---
read_when:
    - Você quer entender a compactação automática e /compact
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Cada modelo tem uma janela de contexto: o número máximo de tokens que ele pode processar. Quando uma conversa se aproxima desse limite, o OpenClaw faz **Compaction** de mensagens antigas em um resumo para que o chat possa continuar.

## Como funciona

1. Turnos mais antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. Mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de Compaction, ele mantém chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes. Se um ponto de divisão cair dentro de um bloco de ferramenta, o OpenClaw move o limite para que o par permaneça junto e a cauda atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. A Compaction só altera o que o modelo vê no próximo turno.

## Compaction automática

A Compaction automática vem ativada por padrão. Ela é executada quando a sessão se aproxima do limite de contexto, ou quando o modelo retorna um erro de estouro de contexto (nesse caso, o OpenClaw faz a Compaction e tenta novamente).

Você verá:

- `embedded run auto-compaction start` / `complete` nos logs normais do Gateway.
- `🧹 Auto-compaction complete` no modo detalhado.
- `/status` mostrando `🧹 Compactions: <count>`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar observações importantes em arquivos de [memória](/pt-BR/concepts/memory). Isso evita perda de contexto.
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

Digite `/compact` em qualquer chat para forçar uma Compaction. Adicione instruções para orientar o resumo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` está definido, a Compaction manual respeita esse ponto de corte do Pi e mantém a cauda recente no contexto reconstruído. Sem um orçamento explícito de manutenção, a Compaction manual se comporta como um checkpoint rígido e continua apenas a partir do novo resumo.

## Configuração

Configure a Compaction em `agents.defaults.compaction` no seu `openclaw.json`. Os controles mais comuns estão listados abaixo; para a referência completa, consulte [Análise detalhada de gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

### Usando um modelo diferente

Por padrão, a Compaction usa o modelo principal do agente. Defina `agents.defaults.compaction.model` para delegar a sumarização a um modelo mais capaz ou especializado. A substituição aceita qualquer string `provider/model-id`:

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

Isso também funciona com modelos locais, por exemplo um segundo modelo Ollama dedicado à sumarização:

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

Quando não definido, a Compaction começa com o modelo da sessão ativa. Se a sumarização falhar com um erro de provedor qualificado para fallback de modelo, o OpenClaw tenta novamente essa tentativa de Compaction pela cadeia de fallback de modelo existente da sessão. A escolha de fallback é temporária e não é gravada de volta no estado da sessão. Uma substituição explícita de `agents.defaults.compaction.model` permanece exata e não herda a cadeia de fallback da sessão.

### Preservação de identificadores

A sumarização de Compaction preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Substitua por `identifierPolicy: "off"` para desativar, ou por `identifierPolicy: "custom"` mais `identifierInstructions` para orientação personalizada.

### Proteção de bytes da transcrição ativa

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido, o OpenClaw aciona a Compaction local normal antes de uma execução se o JSONL ativo atingir esse tamanho. Isso é útil para sessões de longa duração em que o gerenciamento de contexto do lado do provedor pode manter o contexto do modelo saudável enquanto a transcrição local continua crescendo. Ele não divide bytes JSONL brutos; ele solicita ao pipeline normal de Compaction que crie um resumo semântico.

<Warning>
A proteção de bytes requer `truncateAfterCompaction: true`. Sem rotação da transcrição, o arquivo ativo não encolheria e a proteção permaneceria inativa.
</Warning>

### Transcrições sucessoras

Quando `agents.defaults.compaction.truncateAfterCompaction` está ativado, o OpenClaw não reescreve a transcrição existente no lugar. Ele cria uma nova transcrição sucessora ativa a partir do resumo de Compaction, do estado preservado e da cauda não resumida, e então mantém o JSONL anterior como a origem arquivada do checkpoint.
Transcrições sucessoras também descartam turnos longos de usuário exatamente duplicados que chegam
dentro de uma janela curta de nova tentativa, para que tempestades de retry de canal não sejam carregadas para a
próxima transcrição ativa após a Compaction.

Checkpoints pré-Compaction são mantidos apenas enquanto permanecerem abaixo do limite de tamanho de
checkpoint do OpenClaw; transcrições ativas grandes demais ainda passam por Compaction, mas o OpenClaw
ignora o snapshot grande de depuração em vez de dobrar o uso de disco.

### Avisos de Compaction

Por padrão, a Compaction é executada silenciosamente. Defina `notifyUser` para mostrar mensagens breves de status quando a Compaction começa e termina:

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

### Flush de memória

Antes da Compaction, o OpenClaw pode executar um turno de **flush silencioso de memória** para armazenar observações duráveis no disco. Defina `agents.defaults.compaction.memoryFlush.model` quando esse turno de manutenção deve usar um modelo local em vez do modelo da conversa ativa:

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

A substituição do modelo de flush de memória é exata e não herda a cadeia de fallback da sessão ativa. Consulte [Memória](/pt-BR/concepts/memory) para detalhes e configuração.

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction personalizado via `registerCompactionProvider()` na API do plugin. Quando um provedor é registrado e configurado, o OpenClaw delega a sumarização a ele em vez de usar o pipeline LLM integrado.

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

Definir um `provider` força automaticamente `mode: "safeguard"`. Provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores que o caminho integrado, e o OpenClaw ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.

<Note>
Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre à sumarização LLM integrada.
</Note>

## Compaction vs poda

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **O que faz**    | Resume conversas antigas      | Corta resultados antigos de ferramentas |
| **Salvo?**       | Sim (na transcrição da sessão) | Não (somente em memória, por solicitação) |
| **Escopo**       | Conversa inteira              | Somente resultados de ferramentas |

[A poda de sessão](/pt-BR/concepts/session-pruning) é um complemento mais leve que corta a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com frequência demais?** A janela de contexto do modelo pode ser pequena, ou as saídas das ferramentas podem ser grandes. Tente ativar a [poda de sessão](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a Compaction?** Use `/compact Focus on <topic>` para orientar o resumo, ou ative o [flush de memória](/pt-BR/concepts/memory) para que as observações sobrevivam.

**Precisa de um recomeço limpo?** `/new` inicia uma nova sessão sem fazer Compaction.

Para configuração avançada (tokens reservados, preservação de identificadores, mecanismos de contexto personalizados, Compaction do lado do servidor da OpenAI), consulte a [Análise detalhada de gerenciamento de sessão](/pt-BR/reference/session-management-compaction).

## Relacionados

- [Sessão](/pt-BR/concepts/session): gerenciamento e ciclo de vida da sessão.
- [Poda de sessão](/pt-BR/concepts/session-pruning): corte de resultados de ferramentas.
- [Contexto](/pt-BR/concepts/context): como o contexto é construído para turnos do agente.
- [Hooks](/pt-BR/automation/hooks): hooks de ciclo de vida de Compaction (`before_compaction`, `after_compaction`).

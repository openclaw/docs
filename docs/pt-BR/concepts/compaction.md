---
read_when:
    - Você quer entender a compactação automática e o comando /compact
    - Você está depurando sessões longas que atingem os limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compaction
x-i18n:
    generated_at: "2026-07-12T15:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Todo modelo tem uma janela de contexto: o número máximo de tokens que ele pode processar. Quando uma conversa se aproxima desse limite, o OpenClaw **compacta** as mensagens mais antigas em um resumo para que o chat possa continuar.

## Como funciona

1. Os turnos mais antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. As mensagens recentes são mantidas intactas.

O OpenClaw mantém as chamadas de ferramentas do assistente emparelhadas com as entradas `toolResult` correspondentes ao escolher um ponto de divisão para a compactação. Se o ponto ficar dentro de um bloco de ferramenta, o OpenClaw move o limite para que o par permaneça junto e a parte final atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. A compactação altera apenas o que o modelo vê no próximo turno.

<Note>
Por padrão, novas configurações definem `agents.defaults.compaction.mode` como `"safeguard"` (proteções mais rigorosas e auditorias da qualidade do resumo). Defina `mode: "default"` explicitamente para não usar esse modo.
</Note>

## Compactação automática

A compactação automática fica ativada por padrão. Ela é executada quando a sessão se aproxima do limite de contexto ou quando o modelo retorna um erro de estouro de contexto (nesse caso, o OpenClaw compacta e tenta novamente).

Você verá:

- `embedded run auto-compaction start` / `complete` nos logs normais do Gateway.
- `🧹 Auto-compaction complete` no modo detalhado.
- `/status` exibindo `🧹 Compactions: <count>`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar observações importantes em arquivos de [memória](/pt-BR/concepts/memory). Isso evita a perda de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Padrões de erro de estouro reconhecidos pelo OpenClaw">
    O OpenClaw identifica dezenas de mensagens de erro de estouro específicas de provedores (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter e outros). Exemplos comuns:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compactação manual

Digite `/compact` em qualquer chat para forçar uma compactação. Adicione instruções para orientar o resumo:

```text
/compact Concentre-se nas decisões de design da API
```

Quando `agents.defaults.compaction.keepRecentTokens` está definido (padrão: 20,000), a compactação manual respeita esse ponto de corte e mantém a parte final recente no contexto reconstruído. Sem um orçamento explícito de retenção, a compactação manual funciona como um ponto de verificação rígido e continua apenas a partir do novo resumo.

## Configuração

Configure a compactação em `agents.defaults.compaction` no seu `openclaw.json`. As opções mais comuns estão listadas abaixo; para consultar a referência completa, consulte [Análise detalhada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

### Uso de um modelo diferente

Por padrão, a compactação usa o modelo principal do agente. Defina `agents.defaults.compaction.model` para delegar o resumo a um modelo mais capacitado ou especializado. A substituição aceita uma string `provider/model-id` ou um alias simples configurado em `agents.defaults.models`:

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

Aliases simples configurados são resolvidos para o provedor e o modelo canônicos antes do início da compactação. Se um valor simples corresponder tanto a um alias quanto a um ID de modelo literal configurado, o ID de modelo literal prevalecerá. Um valor simples sem correspondência permanece como um ID de modelo no provedor ativo.

Isso também funciona com modelos locais, por exemplo, um segundo modelo Ollama dedicado ao resumo:

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

Quando essa opção não está definida, a compactação começa com o modelo ativo da sessão. Se o resumo falhar devido a um erro do provedor elegível para fallback de modelo, o OpenClaw tentará novamente essa compactação usando a cadeia de fallback de modelos existente da sessão. A escolha de fallback é temporária e não é gravada de volta no estado da sessão. Uma substituição explícita de `agents.defaults.compaction.model` permanece exata e não herda a cadeia de fallback da sessão.

### Preservação de identificadores

Por padrão, o resumo da compactação preserva identificadores opacos (`identifierPolicy: "strict"`). Substitua por `identifierPolicy: "off"` para desativar ou use `identifierPolicy: "custom"` com `identifierInstructions` para fornecer orientações personalizadas.

### Proteção por tamanho em bytes da transcrição ativa

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido, o OpenClaw
aciona a Compaction local normal antes de uma execução se o histórico da transcrição atingir
esse tamanho. Isso é útil para sessões de longa duração nas quais o gerenciamento de contexto
no lado do provedor pode manter o contexto do modelo saudável enquanto o histórico persistido
da transcrição continua crescendo. Ele não divide bytes brutos; solicita que o pipeline normal
de Compaction crie um resumo semântico.

<Warning>
A proteção por tamanho em bytes se aplica ao histórico da transcrição ativa no SQLite. Os artefatos
legados de ponto de verificação em JSONL não são o alvo ativo da Compaction.
</Warning>

### Transcrições sucessoras

Quando `agents.defaults.compaction.truncateAfterCompaction` está habilitado, o OpenClaw não regrava a transcrição existente no mesmo lugar. Ele cria uma nova transcrição sucessora ativa a partir do resumo da Compaction, do estado preservado e da parte final não resumida e, em seguida, registra metadados de ponto de verificação que direcionam os fluxos de ramificação/restauração para essa sucessora compactada.
As transcrições sucessoras também descartam turnos longos do usuário que sejam duplicatas exatas e cheguem
dentro de uma janela curta de repetição, para que tempestades de novas tentativas do canal não sejam levadas
para a próxima transcrição ativa após a Compaction.

O OpenClaw não grava mais cópias `.checkpoint.*.jsonl` separadas para novas
operações de Compaction. Os arquivos legados de ponto de verificação existentes ainda podem ser usados enquanto forem referenciados
e são removidos pela limpeza normal de sessões.

### Avisos de Compaction

Por padrão, a Compaction é executada silenciosamente. Defina `notifyUser` para exibir mensagens breves de status quando a Compaction começar e terminar, além de mostrar um aviso de degradação quando uma descarga de memória anterior à Compaction se esgotar, mas a resposta ainda prosseguir:

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

### Descarga de memória

Antes da Compaction, o OpenClaw pode executar um turno de **descarga silenciosa de memória** para armazenar notas duráveis em disco. Defina `agents.defaults.compaction.memoryFlush.model` quando esse turno de manutenção precisar usar um modelo local em vez do modelo da conversa ativa:

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

A substituição do modelo de descarga de memória é exata e não herda a cadeia de fallback da sessão ativa. Consulte [Memória](/pt-BR/concepts/memory) para obter detalhes e configurações.

## Provedores de Compaction conectáveis

Os Plugins podem registrar um provedor personalizado de Compaction por meio de `registerCompactionProvider()` na API do Plugin. Quando um provedor está registrado e configurado, o OpenClaw delega a ele a geração do resumo em vez de usar o pipeline de LLM integrado.

Para usar um provedor registrado, defina o respectivo id na configuração:

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

Definir um `provider` força automaticamente `mode: "safeguard"`. Os provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores que o caminho integrado, e o OpenClaw ainda preserva o contexto de sufixo dos turnos recentes e dos turnos divididos após a saída do provedor.

<Note>
Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre à geração de resumo por LLM integrada.
</Note>

## Compaction versus poda

|                  | Compaction                         | Poda                                  |
| ---------------- | ---------------------------------- | ------------------------------------- |
| **O que faz**    | Resume conversas mais antigas      | Remove resultados antigos de ferramentas |
| **É salvo?**     | Sim (na transcrição da sessão)      | Não (somente na memória, por solicitação) |
| **Escopo**       | Toda a conversa                    | Somente resultados de ferramentas     |

A [poda de sessão](/pt-BR/concepts/session-pruning) é um complemento mais leve que reduz a saída de ferramentas sem gerar um resumo.

## Solução de problemas

**A Compaction ocorre com muita frequência?** A janela de contexto do modelo pode ser pequena ou as saídas das ferramentas podem ser grandes. Tente habilitar a [poda de sessão](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a Compaction?** Use `/compact Focus on <topic>` para orientar o resumo ou habilite a [descarga de memória](/pt-BR/concepts/memory) para que as notas sejam preservadas.

**Precisa começar do zero?** `/new` inicia uma nova sessão sem executar a Compaction.

Para configurações avançadas (tokens reservados, preservação de identificadores, mecanismos de contexto personalizados e Compaction no lado do servidor da OpenAI), consulte o [guia detalhado sobre gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

## Relacionados

- [Sessão](/pt-BR/concepts/session): gerenciamento e ciclo de vida da sessão.
- [Poda de sessão](/pt-BR/concepts/session-pruning): redução dos resultados de ferramentas.
- [Contexto](/pt-BR/concepts/context): como o contexto é criado para os turnos do agente.
- [Hooks](/pt-BR/automation/hooks): hooks do ciclo de vida da Compaction (`before_compaction`, `after_compaction`).

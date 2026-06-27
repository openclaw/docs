---
read_when:
    - Você quer entender a compactação automática e /compact
    - Você está depurando sessões longas que atingem limites de contexto
summary: Como o OpenClaw resume conversas longas para permanecer dentro dos limites do modelo
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Todo modelo tem uma janela de contexto: o número máximo de tokens que ele consegue processar. Quando uma conversa se aproxima desse limite, o OpenClaw **compacta** mensagens mais antigas em um resumo para que o chat possa continuar.

## Como funciona

1. Turnos antigos da conversa são resumidos em uma entrada compacta.
2. O resumo é salvo na transcrição da sessão.
3. Mensagens recentes são mantidas intactas.

Quando o OpenClaw divide o histórico em blocos de Compaction, ele mantém as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes. Se um ponto de divisão cair dentro de um bloco de ferramenta, o OpenClaw move o limite para que o par permaneça junto e a cauda atual não resumida seja preservada.

O histórico completo da conversa permanece no disco. A Compaction só altera o que o modelo vê no próximo turno.

## Compaction automática

A Compaction automática fica ativada por padrão. Ela é executada quando a sessão se aproxima do limite de contexto ou quando o modelo retorna um erro de estouro de contexto; nesse caso, o OpenClaw compacta e tenta novamente.

Você verá:

- `embedded run auto-compaction start` / `complete` nos logs normais do Gateway.
- `🧹 Auto-compaction complete` no modo detalhado.
- `/status` mostrando `🧹 Compactions: <count>`.

<Info>
Antes de compactar, o OpenClaw lembra automaticamente o agente de salvar observações importantes em arquivos de [memória](/pt-BR/concepts/memory). Isso evita perda de contexto.
</Info>

<AccordionGroup>
  <Accordion title="Assinaturas de estouro reconhecidas">
    O OpenClaw detecta estouro de contexto a partir destes padrões de erro de provedores:

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

Quando `agents.defaults.compaction.keepRecentTokens` está definido, a Compaction manual respeita esse ponto de corte do OpenClaw e mantém a cauda recente no contexto reconstruído. Sem um orçamento explícito de retenção, a Compaction manual se comporta como um ponto de verificação rígido e continua apenas a partir do novo resumo.

## Configuração

Configure a Compaction em `agents.defaults.compaction` no seu `openclaw.json`. Os ajustes mais comuns estão listados abaixo; para a referência completa, consulte [Visão aprofundada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

### Usando um modelo diferente

Por padrão, a Compaction usa o modelo principal do agente. Defina `agents.defaults.compaction.model` para delegar o resumo a um modelo mais capaz ou especializado. A substituição aceita uma string `provider/model-id` ou um alias simples configurado em `agents.defaults.models`:

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

Aliases simples configurados são resolvidos para seu provedor e modelo canônicos antes do início da Compaction. Se um valor simples corresponder tanto a um alias quanto a um ID de modelo literal configurado, o ID de modelo literal vence. Um valor simples sem correspondência permanece como ID de modelo no provedor ativo.

Isso também funciona com modelos locais, por exemplo um segundo modelo Ollama dedicado a resumos:

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

Quando não configurada, a Compaction começa com o modelo ativo da sessão. Se o resumo falhar com um erro de provedor elegível para fallback de modelo, o OpenClaw tenta novamente essa tentativa de Compaction por meio da cadeia de fallback de modelo existente da sessão. A escolha de fallback é temporária e não é gravada de volta no estado da sessão. Uma substituição explícita de `agents.defaults.compaction.model` permanece exata e não herda a cadeia de fallback da sessão.

### Preservação de identificadores

O resumo da Compaction preserva identificadores opacos por padrão (`identifierPolicy: "strict"`). Substitua por `identifierPolicy: "off"` para desativar, ou `identifierPolicy: "custom"` mais `identifierInstructions` para orientação personalizada.

### Proteção por bytes da transcrição ativa

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido, o OpenClaw aciona a Compaction local normal antes de uma execução se o JSONL ativo atingir esse tamanho. Isso é útil para sessões de longa duração em que o gerenciamento de contexto do lado do provedor pode manter o contexto do modelo saudável enquanto a transcrição local continua crescendo. Ele não divide bytes JSONL brutos; ele solicita que o pipeline normal de Compaction crie um resumo semântico.

<Warning>
A proteção por bytes exige `truncateAfterCompaction: true`. Sem rotação de transcrição, o arquivo ativo não diminuiria e a proteção permaneceria inativa.
</Warning>

### Transcrições sucessoras

Quando `agents.defaults.compaction.truncateAfterCompaction` está ativado, o OpenClaw não reescreve a transcrição existente no lugar. Ele cria uma nova transcrição sucessora ativa a partir do resumo da Compaction, do estado preservado e da cauda não resumida, depois registra metadados de ponto de verificação que apontam fluxos de ramificação/restauração para essa sucessora compactada.
Transcrições sucessoras também descartam turnos longos de usuário exatamente duplicados que chegam
dentro de uma janela curta de nova tentativa, para que tempestades de novas tentativas do canal não sejam levadas para a
próxima transcrição ativa após a Compaction.

O OpenClaw não grava mais cópias `.checkpoint.*.jsonl` separadas para novas
Compactions. Arquivos de ponto de verificação legados existentes ainda podem ser usados enquanto referenciados
e são removidos pela limpeza normal de sessões.

### Avisos de Compaction

Por padrão, a Compaction é executada silenciosamente. Defina `notifyUser` para mostrar mensagens breves de status quando a Compaction começar e terminar:

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

Antes da Compaction, o OpenClaw pode executar um turno de **descarga silenciosa de memória** para armazenar observações duráveis em disco. Defina `agents.defaults.compaction.memoryFlush.model` quando esse turno de manutenção deve usar um modelo local em vez do modelo ativo da conversa:

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

A substituição do modelo de descarga de memória é exata e não herda a cadeia de fallback da sessão ativa. Consulte [Memória](/pt-BR/concepts/memory) para detalhes e configuração.

## Provedores de Compaction plugáveis

Plugins podem registrar um provedor de Compaction personalizado por meio de `registerCompactionProvider()` na API do Plugin. Quando um provedor é registrado e configurado, o OpenClaw delega o resumo a ele em vez de usar o pipeline de LLM integrado.

Para usar um provedor registrado, defina o ID dele na sua configuração:

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

Definir um `provider` força automaticamente `mode: "safeguard"`. Provedores recebem as mesmas instruções de Compaction e a mesma política de preservação de identificadores do caminho integrado, e o OpenClaw ainda preserva o contexto de sufixo de turnos recentes e turnos divididos após a saída do provedor.

<Note>
Se o provedor falhar ou retornar um resultado vazio, o OpenClaw recorre ao resumo por LLM integrado.
</Note>

## Compaction vs remoção

|                  | Compaction                    | Remoção                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **O que faz** | Resume conversas antigas | Corta resultados de ferramentas antigos           |
| **Salvo?**       | Sim (na transcrição da sessão)   | Não (apenas em memória, por solicitação) |
| **Escopo**        | Conversa inteira           | Apenas resultados de ferramentas                |

[A remoção de sessão](/pt-BR/concepts/session-pruning) é um complemento mais leve que corta a saída de ferramentas sem resumir.

## Solução de problemas

**Compactando com muita frequência?** A janela de contexto do modelo pode ser pequena, ou as saídas de ferramentas podem ser grandes. Tente ativar a [remoção de sessão](/pt-BR/concepts/session-pruning).

**O contexto parece desatualizado após a Compaction?** Use `/compact Focus on <topic>` para orientar o resumo, ou ative a [descarga de memória](/pt-BR/concepts/memory) para que as observações sobrevivam.

**Precisa de um início limpo?** `/new` inicia uma nova sessão sem compactar.

Para configuração avançada (tokens reservados, preservação de identificadores, mecanismos de contexto personalizados, Compaction do lado do servidor da OpenAI), consulte a [Visão aprofundada do gerenciamento de sessões](/pt-BR/reference/session-management-compaction).

## Relacionado

- [Sessão](/pt-BR/concepts/session): gerenciamento e ciclo de vida de sessões.
- [Remoção de sessão](/pt-BR/concepts/session-pruning): corte de resultados de ferramentas.
- [Contexto](/pt-BR/concepts/context): como o contexto é construído para turnos do agente.
- [Hooks](/pt-BR/automation/hooks): hooks do ciclo de vida da Compaction (`before_compaction`, `after_compaction`).

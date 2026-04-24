---
read_when:
    - Você quer uma etapa de LLM somente em JSON dentro de fluxos de trabalho
    - Você precisa de saída de LLM validada por schema para automação
summary: Tarefas de LLM somente em JSON para fluxos de trabalho (ferramenta opcional de Plugin)
title: Tarefa de LLM
x-i18n:
    generated_at: "2026-04-24T06:17:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` é uma **ferramenta opcional de Plugin** que executa uma tarefa de LLM somente em JSON e
retorna saída estruturada (opcionalmente validada por JSON Schema).

Isso é ideal para mecanismos de workflow como o Lobster: você pode adicionar uma única etapa de LLM
sem escrever código personalizado do OpenClaw para cada workflow.

## Habilitar o Plugin

1. Habilite o Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Coloque a ferramenta na lista de permissão (ela é registrada com `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Configuração (opcional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` é uma lista de permissão de strings `provider/model`. Se definida, qualquer solicitação
fora da lista é rejeitada.

## Parâmetros da ferramenta

- `prompt` (string, obrigatório)
- `input` (qualquer tipo, opcional)
- `schema` (objeto, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (number, opcional)
- `maxTokens` (number, opcional)
- `timeoutMs` (number, opcional)

`thinking` aceita os presets padrão de raciocínio do OpenClaw, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON analisado (e valida em relação a
`schema` quando fornecido).

## Exemplo: etapa de workflow no Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Observações de segurança

- A ferramenta é **somente JSON** e instrui o modelo a retornar apenas JSON (sem
  code fences, sem comentários).
- Nenhuma ferramenta é exposta ao modelo nesta execução.
- Trate a saída como não confiável, a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeito colateral (send, post, exec).

## Relacionado

- [Níveis de thinking](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
- [Comandos de barra](/pt-BR/tools/slash-commands)

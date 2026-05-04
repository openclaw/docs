---
read_when:
    - Você quer uma etapa de LLM somente JSON dentro de fluxos de trabalho
    - Você precisa de saída de LLM validada por esquema para automação
summary: Tarefas de LLM somente em JSON para fluxos de trabalho (ferramenta de Plugin opcional)
title: Tarefa de LLM
x-i18n:
    generated_at: "2026-05-04T05:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` é uma **ferramenta de Plugin opcional** que executa uma tarefa de LLM somente em JSON e
retorna saída estruturada (opcionalmente validada contra JSON Schema).

Isso é ideal para mecanismos de workflow como Lobster: você pode adicionar uma única etapa de LLM
sem escrever código OpenClaw personalizado para cada workflow.

## Habilite o Plugin

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

2. Permita a ferramenta opcional:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Use `tools.allow` somente quando quiser o modo de lista de permissões restritiva.

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

`allowedModels` é uma lista de permissões de strings `provider/model`. Se definida, qualquer solicitação
fora da lista é rejeitada.

## Parâmetros da ferramenta

- `prompt` (string, obrigatório)
- `input` (qualquer, opcional)
- `schema` (objeto, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (número, opcional)
- `maxTokens` (número, opcional)
- `timeoutMs` (número, opcional)

`thinking` aceita as predefinições padrão de raciocínio do OpenClaw, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON analisado (e valida contra
`schema` quando fornecido).

## Exemplo: etapa de workflow do Lobster

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

- A ferramenta é **somente JSON** e instrui o modelo a gerar apenas JSON (sem
  cercas de código, sem comentários).
- Nenhuma ferramenta é exposta ao modelo para esta execução.
- Trate a saída como não confiável, a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeitos colaterais (enviar, postar, executar).

## Relacionado

- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
- [Comandos slash](/pt-BR/tools/slash-commands)

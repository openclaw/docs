---
read_when:
    - Você quer uma etapa de LLM apenas em JSON dentro dos workflows
    - Você precisa de saída de LLM validada por esquema para automação
summary: Tarefas de LLM somente em JSON para fluxos de trabalho (ferramenta de Plugin opcional)
title: Tarefa de LLM
x-i18n:
    generated_at: "2026-06-27T18:16:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` é uma **ferramenta de Plugin opcional** que executa uma tarefa de LLM somente JSON e
retorna saída estruturada (opcionalmente validada contra JSON Schema).

Isso é ideal para mecanismos de workflow como Lobster: você pode adicionar uma única etapa de LLM
sem escrever código OpenClaw personalizado para cada workflow.

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
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
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
- `schema` (object, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (number, opcional)
- `maxTokens` (number, opcional)
- `timeoutMs` (number, opcional)

`thinking` aceita os presets padrão de raciocínio do OpenClaw, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON analisado (e valida contra
`schema` quando fornecido).

## Exemplo: etapa de workflow do Lobster

### Limitação importante

O exemplo abaixo pressupõe que a **CLI standalone do Lobster** está em execução em um ambiente onde `openclaw.invoke` já tem a URL do gateway e o contexto de autenticação corretos.

Para o executor Lobster **embutido** incluído no OpenClaw, esse padrão de CLI aninhada **não é confiável no momento**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Até que o Lobster embutido tenha uma ponte compatível para esse fluxo, prefira:

- chamadas diretas à ferramenta `llm-task` fora do Lobster, ou
- etapas do Lobster que não dependam de chamadas `openclaw.invoke` aninhadas.

Exemplo da CLI standalone do Lobster:

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
  blocos de código, sem comentários).
- Nenhuma ferramenta é exposta ao modelo para esta execução.
- Trate a saída como não confiável, a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeito colateral (enviar, publicar, executar).

## Relacionado

- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
- [Comandos de barra](/pt-BR/tools/slash-commands)

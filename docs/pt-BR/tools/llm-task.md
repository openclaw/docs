---
read_when:
    - Você quer uma etapa de LLM que produza apenas JSON dentro dos fluxos de trabalho
    - Você precisa de uma saída de LLM validada por esquema para automação
summary: Tarefas de LLM somente em JSON para fluxos de trabalho (ferramenta opcional de Plugin)
title: Tarefa do LLM
x-i18n:
    generated_at: "2026-07-12T00:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` é uma **ferramenta opcional de Plugin incluída** que executa uma única
chamada de LLM somente com JSON e retorna uma saída estruturada, opcionalmente
validada em relação a um JSON Schema. Ela oferece a mecanismos de fluxo de
trabalho como o Lobster uma etapa de LLM sem exigir código personalizado do
OpenClaw para cada fluxo de trabalho.

## Habilitar

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

2. Permita a ferramenta:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` adiciona `llm-task` ao perfil de ferramentas ativo sem restringir
outras ferramentas principais. Use `tools.allow` somente se quiser um modo
restritivo de lista de permissões.

## Configuração (opcional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` é uma lista de permissões de strings `provider/model`; uma
solicitação para qualquer outro modelo é rejeitada. Todas as outras chaves são
valores alternativos por chamada, usados quando a chamada da ferramenta omite
esse parâmetro.

## Parâmetros da ferramenta

| Parâmetro       | Tipo   | Observações                                                                                                                                                                  |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Obrigatório. Instrução da tarefa para o LLM.                                                                                                                                 |
| `input`         | any    | Carga útil opcional; serializada como JSON e anexada ao prompt.                                                                                                              |
| `schema`        | object | JSON Schema opcional em relação ao qual a saída analisada deve ser validada.                                                                                                 |
| `provider`      | string | Substitui `defaultProvider` / o provedor padrão do agente.                                                                                                                    |
| `model`         | string | Substitui `defaultModel`; aceita IDs de modelo simples, aliases ou uma referência `provider/model` (um prefixo de provedor duplicado é removido automaticamente).             |
| `thinking`      | string | Nível de raciocínio (por exemplo, `low`, `medium`); deve ser um dos níveis compatíveis com o modelo resolvido.                                                                |
| `authProfileId` | string | Substitui `defaultAuthProfileId`.                                                                                                                                             |
| `temperature`   | number | Aplicado quando possível; nem todos os provedores o respeitam.                                                                                                               |
| `maxTokens`     | number | Limite máximo de tokens de saída aplicado quando possível.                                                                                                                   |
| `timeoutMs`     | number | Tempo limite da execução; padrão `30000`.                                                                                                                                    |

## Saída

Retorna `details.json` (o JSON analisado e validado pelo esquema), além de
`details.provider` e `details.model`, que identificam o que realmente foi
executado.

## Exemplo: etapa de fluxo de trabalho do Lobster

### Limitação importante

O exemplo abaixo pressupõe que a **CLI autônoma do Lobster** esteja sendo
executada em um ambiente no qual `openclaw.invoke` já tenha o URL do Gateway e o
contexto de autenticação corretos.

Para o executor **incorporado** do Lobster incluído no OpenClaw, esse padrão de
CLI aninhada **não é confiável no momento**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Até que o Lobster incorporado tenha uma ponte compatível com esse fluxo,
prefira:

- chamadas diretas da ferramenta `llm-task` fora do Lobster; ou
- etapas do Lobster que não dependam de chamadas aninhadas de
  `openclaw.invoke`.

Exemplo da CLI autônoma do Lobster:

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

- **Somente JSON**: o modelo é instruído a retornar apenas um valor JSON, sem
  blocos de código nem comentários.
- **Sem ferramentas**: a execução subjacente mantém as ferramentas
  desabilitadas, portanto o modelo não pode fazer chamadas externas durante a
  tarefa.
- Trate a saída como não confiável, a menos que você a valide com `schema`.
- Coloque as aprovações antes de qualquer etapa com efeitos colaterais (enviar,
  publicar, executar) que consuma essa saída.

## Relacionado

- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
- [Comandos de barra](/pt-BR/tools/slash-commands)

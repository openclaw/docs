---
read_when:
    - Você quer uma etapa de LLM somente em JSON dentro dos fluxos de trabalho
    - Você precisa de uma saída de LLM validada por esquema para automação
summary: Tarefas de LLM somente com JSON para fluxos de trabalho (ferramenta de plugin opcional)
title: Tarefa de LLM
x-i18n:
    generated_at: "2026-07-12T15:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` é uma **ferramenta de plugin opcional** incluída que executa uma única chamada
a um LLM somente com JSON e retorna uma saída estruturada, opcionalmente validada em relação a um JSON
Schema. Ela fornece a mecanismos de fluxo de trabalho como o Lobster uma etapa de LLM sem código
OpenClaw personalizado para cada fluxo de trabalho.

## Habilitar

1. Habilite o plugin:

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

`alsoAllow` adiciona `llm-task` ao perfil de ferramentas ativo sem
restringir outras ferramentas principais. Use `tools.allow` somente se você quiser um modo restritivo
de lista de permissões.

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

`allowedModels` é uma lista de permissões de strings `provider/model`; uma solicitação para qualquer
outro modelo é rejeitada. Todas as outras chaves são valores alternativos por chamada, usados quando a
chamada da ferramenta omite esse parâmetro.

## Parâmetros da ferramenta

| Parâmetro       | Tipo   | Observações                                                                                                                                                             |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Obrigatório. Instrução da tarefa para o LLM.                                                                                                                            |
| `input`         | any    | Carga útil opcional; serializada como JSON e anexada ao prompt.                                                                                                         |
| `schema`        | object | JSON Schema opcional em relação ao qual a saída analisada deve ser validada.                                                                                            |
| `provider`      | string | Substitui `defaultProvider` / o provedor padrão do agente.                                                                                                              |
| `model`         | string | Substitui `defaultModel`; aceita ids de modelo simples, aliases ou uma referência `provider/model` (um prefixo de provedor duplicado é removido automaticamente).         |
| `thinking`      | string | Nível de raciocínio (por exemplo, `low`, `medium`); deve ser um dos níveis compatíveis com o modelo resolvido.                                                           |
| `authProfileId` | string | Substitui `defaultAuthProfileId`.                                                                                                                                       |
| `temperature`   | number | Aplicado quando possível; nem todos os provedores o respeitam.                                                                                                          |
| `maxTokens`     | number | Limite aplicado quando possível aos tokens de saída.                                                                                                                    |
| `timeoutMs`     | number | Tempo limite de execução; padrão `30000`.                                                                                                                               |

## Saída

Retorna `details.json` (o JSON analisado e validado pelo esquema), além de `details.provider`
e `details.model`, que identificam o que realmente foi executado.

## Exemplo: etapa de fluxo de trabalho do Lobster

### Limitação importante

O exemplo abaixo pressupõe que a **CLI independente do Lobster** esteja sendo executada onde
`openclaw.invoke` já tenha a URL do Gateway e o contexto de autenticação corretos.

Para o executor Lobster **incorporado** incluído no OpenClaw, este padrão de CLI
aninhada **não é confiável atualmente**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Até que o Lobster incorporado tenha uma ponte compatível com esse fluxo, prefira:

- chamadas diretas à ferramenta `llm-task` fora do Lobster; ou
- etapas do Lobster que não dependam de chamadas aninhadas a `openclaw.invoke`.

Exemplo da CLI independente do Lobster:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Dado o e-mail de entrada, retorne a intenção e um rascunho.",
  "thinking": "low",
  "input": {
    "subject": "Olá",
    "body": "Você pode ajudar?"
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

- **Somente JSON**: o modelo é instruído a retornar somente um valor JSON, sem
  cercas de código nem comentários.
- **Sem ferramentas**: a execução subjacente mantém as ferramentas desabilitadas, portanto o modelo não pode fazer
  chamadas externas durante a tarefa.
- Trate a saída como não confiável, a menos que você a valide com `schema`.
- Coloque as aprovações antes de qualquer etapa com efeitos colaterais (enviar, publicar, executar) que consuma
  essa saída.

## Relacionados

- [Níveis de raciocínio](/pt-BR/tools/thinking)
- [Subagentes](/pt-BR/tools/subagents)
- [Comandos de barra](/pt-BR/tools/slash-commands)

---
read_when:
    - Você está instalando, configurando ou auditando o plugin anthropic-vertex
summary: Plugin do provedor Anthropic Vertex do OpenClaw para modelos Claude no Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T12:43:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin de provedor Anthropic Vertex do OpenClaw para modelos Claude no Google Vertex AI.

## Distribuição

- Pacote: `@openclaw/anthropic-vertex-provider`
- Forma de instalação: npm; ClawHub

## Superfície

provedores: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Use `anthropic-vertex/claude-fable-5` onde o modelo estiver disponível na sua região do Google Cloud.
O Fable 5 sempre usa raciocínio adaptativo e adota por padrão o esforço `high`. `/think off` e
`/think minimal` usam o esforço `low`, pois o modelo não permite desativar o raciocínio.

## Claude Sonnet 5

Use `anthropic-vertex/claude-sonnet-5` com o endpoint `global`, `us` ou `eu`
do Vertex. O Sonnet 5 adota por padrão o raciocínio adaptativo com esforço `high` e oferece suporte a
`/think off` ou aos níveis nativos `/think xhigh|max`. O OpenClaw publica automaticamente sua
janela de contexto de 1.000.000 tokens e seu limite de saída de 128.000 tokens.

Os preços do catálogo seguem a tarifa global introdutória do Vertex de `$2/$10` por
milhão de tokens de entrada/saída até 31 de agosto de 2026 e, depois, `$3/$15` a partir de
1º de setembro. Os endpoints multirregionais `us` e `eu` usam o acréscimo
documentado de 10% do Vertex.

<!-- openclaw-plugin-reference:manual-end -->

---
read_when:
    - Você está instalando, configurando ou auditando o plugin anthropic-vertex
summary: Plugin de provedor Anthropic Vertex do OpenClaw para modelos Claude no Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:51:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin provedor Anthropic Vertex do OpenClaw para modelos Claude no Google Vertex AI.

## Distribuição

- Pacote: `@openclaw/anthropic-vertex-provider`
- Rota de instalação: npm; ClawHub

## Superfície

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Use `anthropic-vertex/claude-fable-5` onde o modelo estiver disponível na sua região do Google Cloud.
O Fable 5 sempre usa pensamento adaptativo e usa `high` como padrão de esforço. `/think off` e
`/think minimal` usam esforço `low` porque o modelo não oferece suporte à desativação do pensamento.

<!-- openclaw-plugin-reference:manual-end -->

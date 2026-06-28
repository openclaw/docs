---
read_when:
    - anthropic-vertex pluginini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı plugin'i.
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-06-28T00:57:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı Plugin’i.

## Dağıtım

- Paket: `@openclaw/anthropic-vertex-provider`
- Kurulum yolu: npm; ClawHub

## Yüzey

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Modelin Google Cloud bölgenizde kullanılabildiği yerlerde `anthropic-vertex/claude-fable-5` kullanın.
Fable 5 her zaman uyarlanabilir düşünmeyi kullanır ve varsayılan olarak `high` çabaya ayarlanır. `/think off` ve
`/think minimal`, model düşünmeyi devre dışı bırakmayı desteklemediği için `low` çaba kullanır.

<!-- openclaw-plugin-reference:manual-end -->

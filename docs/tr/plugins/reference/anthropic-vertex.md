---
read_when:
    - anthropic-vertex Plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı Plugin'i.
title: Anthropic Vertex plugini
x-i18n:
    generated_at: "2026-07-12T12:36:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı Plugin'i.

## Dağıtım

- Paket: `@openclaw/anthropic-vertex-provider`
- Kurulum yolu: npm; ClawHub

## Yüzey

sağlayıcılar: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Modelin Google Cloud bölgenizde kullanılabildiği yerlerde `anthropic-vertex/claude-fable-5` kullanın.
Fable 5 her zaman uyarlanabilir düşünmeyi kullanır ve varsayılan olarak `high` çaba düzeyini kullanır. Model düşünmeyi devre dışı bırakmayı desteklemediğinden `/think off` ve
`/think minimal`, `low` çaba düzeyini kullanır.

## Claude Sonnet 5

Vertex'in `global`, `us` veya `eu` uç noktasıyla `anthropic-vertex/claude-sonnet-5` kullanın. Sonnet 5, varsayılan olarak `high` çaba düzeyinde uyarlanabilir düşünmeyi kullanır ve
`/think off` ya da yerel `/think xhigh|max` düzeylerini destekler. OpenClaw,
1.000.000 tokenlık bağlam penceresini ve 128.000 tokenlık çıktı sınırını otomatik olarak yayımlar.

Katalog fiyatlandırması, 31 Ağustos 2026'ya kadar milyon giriş/çıkış tokenı başına Vertex'in başlangıç küresel tarifesi olan `$2/$10` değerini, 1 Eylül'den itibaren ise `$3/$15` değerini izler. `us` ve `eu` çok bölgeli uç noktaları, Vertex'in belgelenmiş %10 ek ücretini uygular.

<!-- openclaw-plugin-reference:manual-end -->

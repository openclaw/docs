---
read_when:
    - anthropic-vertex pluginini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı plugini.
title: Anthropic Vertex plugini
x-i18n:
    generated_at: "2026-07-16T17:28:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex plugin'i

Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı plugin'i.

## Dağıtım

- Paket: `@openclaw/anthropic-vertex-provider`
- Kurulum yolu: npm; ClawHub

## Yüzey

sağlayıcılar: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Modelin Google Cloud bölgenizde kullanılabildiği yerlerde `anthropic-vertex/claude-fable-5` kullanın.
Fable 5 her zaman uyarlanabilir düşünmeyi kullanır ve varsayılan olarak `high` efor düzeyini kullanır. Model düşünmenin devre dışı bırakılmasını desteklemediğinden `/think off` ve
`/think minimal`, `low` efor düzeyini kullanır.

## Claude Sonnet 5

Vertex'in `global`, `us` veya `eu`
uç noktasıyla `anthropic-vertex/claude-sonnet-5` kullanın. Sonnet 5, varsayılan olarak `high` efor düzeyinde uyarlanabilir düşünmeyi kullanır ve
`/think off` ya da yerel `/think xhigh|max` düzeylerini destekler. OpenClaw,
1.000.000 token'lık bağlam penceresini ve 128.000 token'lık çıktı sınırını otomatik olarak yayımlar.

Katalog fiyatlandırması, 31 Ağustos 2026'ya kadar milyon girdi/çıktı token'ı başına Vertex'in
`$2/$10` tutarındaki tanıtım amaçlı küresel ücretini, ardından 1 Eylül'den itibaren
`$3/$15` ücretini izler. `us` ve `eu` çok bölgeli uç noktaları, Vertex'in belgelenmiş
%10 ek ücretini uygular.

<!-- openclaw-plugin-reference:manual-end -->

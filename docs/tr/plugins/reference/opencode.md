---
read_when:
    - opencode pluginini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: OpenClaw'a OpenCode model sağlayıcısı desteği ekler.
title: OpenCode plugini
x-i18n:
    generated_at: "2026-07-16T17:31:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode plugin'i

OpenClaw'a OpenCode model sağlayıcısı desteği ekler.

## Dağıtım

- Paket: `@openclaw/opencode-provider`
- Kurulum yolu: OpenClaw'a dahildir

## Yüzey

sağlayıcılar: `opencode`; sözleşmeler: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Yerel oturumlar

OpenClaw, Gateway ve eşleştirilmiş Node'larda `opencode` CLI'yi otomatik olarak algılar. Ardından depolanan
oturumlar, resmi `opencode --pure db ... --format json`
ve `opencode --pure export` komutları aracılığıyla salt okunur
transkriptlere göz atma olanağıyla **OpenCode** oturumları kenar çubuğu grubunda görünür. Kısıtlı ortam ve `--pure`
modu, katalog taramasının proje plugin'lerini yüklemesini veya ilgisiz
Gateway kimlik bilgilerini devralmasını engeller.

Keşfi devre dışı bırakmak için **Config > Plugins > OpenCode** altındaki **OpenCode Session Catalog** seçeneğini kapatın.
Bu seçenek varsayılan olarak etkindir.

<!-- openclaw-plugin-reference:manual-end -->

## İlgili belgeler

- [opencode](/tr/providers/opencode)

---
read_when:
    - OpenClaw içinde Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw içinde xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-04-05T14:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw, Grok modelleri için paketlenmiş bir `xai` sağlayıcı eklentisiyle gelir.

## Kurulum

1. xAI konsolunda bir API anahtarı oluşturun.
2. `XAI_API_KEY` ayarlayın veya şunu çalıştırın:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Şunun gibi bir model seçin:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw artık paketlenmiş xAI taşıması olarak xAI Responses API'yi kullanıyor. Aynı
`XAI_API_KEY`, Grok destekli `web_search`, birinci sınıf `x_search`
ve uzak `code_execution` için de kullanılabilir.
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız,
paketlenmiş xAI model sağlayıcısı artık bu anahtarı da yedek olarak yeniden kullanır.
`code_execution` ayarları `plugins.entries.xai.config.codeExecution` altında bulunur.

## Mevcut paketlenmiş model kataloğu

OpenClaw artık kutudan çıktığı haliyle şu xAI model ailelerini içerir:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Eklenti ayrıca daha yeni `grok-4*` ve `grok-code-fast*` kimliklerini, aynı API şeklini
izlediklerinde ileri çözümlemeyle destekler.

Hızlı model notları:

- `grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*` varyantları,
  paketlenmiş katalogdaki mevcut görüntü destekli Grok başvurularıdır.
- `/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
  yerel xAI isteklerini şu şekilde yeniden yazar:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Eski uyumluluk takma adları hâlâ standart paketlenmiş kimliklere normalize edilir. Örneğin:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web arama

Paketlenmiş `grok` web arama sağlayıcısı da `XAI_API_KEY` kullanır:

```bash
openclaw config set tools.web.search.provider grok
```

## Bilinen sınırlamalar

- Kimlik doğrulama bugün yalnızca API anahtarıyladır. OpenClaw içinde henüz xAI OAuth/cihaz kodu akışı yoktur.
- `grok-4.20-multi-agent-experimental-beta-0304`, standart OpenClaw xAI taşımasından farklı bir upstream API yüzeyi gerektirdiği için normal xAI sağlayıcı yolunda desteklenmez.

## Notlar

- OpenClaw, paylaşılan çalıştırıcı yolunda xAI'ye özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini otomatik olarak uygular.
- Yerel xAI isteklerinde varsayılan olarak `tool_stream: true` kullanılır. Şunu
  `false` olarak ayarlayın: `agents.defaults.models["xai/<model>"].params.tool_stream`
  devre dışı bırakmak için.
- Paketlenmiş xAI sarmalayıcısı, yerel xAI isteklerini göndermeden önce desteklenmeyen strict araç şeması bayraklarını ve
  reasoning payload anahtarlarını temizler.
- `web_search`, `x_search` ve `code_execution`, OpenClaw araçları olarak sunulur. OpenClaw, her sohbet dönüşüne tüm yerel araçları eklemek yerine, her araç isteğinde ihtiyaç duyduğu belirli xAI yerleşik özelliğini etkinleştirir.
- `x_search` ve `code_execution`, çekirdek model çalışma zamanına sabit kodlanmış olmak yerine paketlenmiş xAI eklentisine aittir.
- `code_execution`, yerel [`exec`](/tools/exec) değil, uzak xAI sandbox yürütmesidir.
- Daha geniş sağlayıcı genel görünümü için bkz. [Model sağlayıcıları](/tr/providers/index).

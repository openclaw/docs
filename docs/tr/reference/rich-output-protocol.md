---
read_when:
    - Control UI’da yardımcı çıktı işlemesini değiştirme
    - '``[embed ...]``, ``MEDIA:``, yanıt veya ses sunum yönergelerinde hata ayıklama'
summary: Gömüler, medya, ses ipuçları ve yanıtlar için zengin çıktı shortcode protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-04-26T11:40:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Yardımcı çıktısı küçük bir teslim/işleme yönergesi kümesi taşıyabilir:

- ek teslimi için `MEDIA:`
- ses sunum ipuçları için `[[audio_as_voice]]`
- yanıt meta verisi için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin işlemesi için `[embed ...]`

Uzak `MEDIA:` ekleri herkese açık `https:` URL’leri olmalıdır. Düz `http:`,
loopback, link-local, private ve internal ana makine adları ek yönergeleri olarak yok sayılır;
sunucu tarafı medya getiriciler yine de kendi ağ korumalarını uygular.

Bu yönergeler birbirinden ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim meta verisi olarak kalır; `[embed ...]` yalnızca web’e özgü zengin işleme yoludur.
Güvenilen tool-result medyası da teslimden önce aynı `MEDIA:` / `[[audio_as_voice]]` ayrıştırıcısını kullanır; böylece metin araç çıktıları yine de bir ses ekini sesli not olarak işaretleyebilir.

Block streaming etkin olduğunda `MEDIA:`, bir dönüş için tek teslim meta verisi olarak kalır.
Aynı medya URL’si akışlı bir blokta gönderilir ve son yardımcı yükünde tekrar edilirse,
OpenClaw eki bir kez teslim eder ve yineleneni son yükten çıkarır.

## `[embed ...]`

`[embed ...]`, Control UI için aracıya dönük tek zengin işleme sözdizimidir.

Kendiliğinden kapanan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]`, yeni çıktı için artık geçerli değildir.
- Embed shortcode’ları yalnızca yardımcı mesaj yüzeyinde işlenir.
- Yalnızca URL destekli embed’ler işlenir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed shortcode’ları işlenmez.
- Web UI, shortcode’u görünür metinden çıkarır ve embed’i satır içinde işler.
- `MEDIA:`, embed takma adı değildir ve zengin embed işleme için kullanılmamalıdır.

## Saklanan işleme biçimi

Normalleştirilmiş/saklanan yardımcı içerik bloğu yapılandırılmış bir `canvas` öğesidir:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Saklanan/işlenen zengin bloklar bu `canvas` biçimini doğrudan kullanır. `present_view` tanınmaz.

## İlgili

- [RPC adapters](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)

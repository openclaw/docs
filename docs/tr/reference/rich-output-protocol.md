---
read_when:
    - Control UI'de asistan çıktısı işlemesini değiştirme
    - '`[embed ...]`, `MEDIA:`, yanıt veya sesli sunum yönergelerinde hata ayıklama'
summary: Yerleştirmeler, medya, ses ipuçları ve yanıtlar için zengin çıktı kısa kod protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-05-02T22:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Asistan çıktısı küçük bir teslim/işleme yönergeleri kümesi taşıyabilir:

- Ek teslimi için `MEDIA:`
- Ses sunumu ipuçları için `[[audio_as_voice]]`
- Yanıt metaverileri için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin işlemesi için `[embed ...]`

Uzak `MEDIA:` ekleri herkese açık `https:` URL'leri olmalıdır. Düz `http:`,
loopback, link-local, özel ve dahili ana makine adları ek yönergeleri olarak
yok sayılır; sunucu tarafı medya getiricileri yine de kendi ağ korumalarını
uygular.

Yerel `MEDIA:` ekleri mutlak yolları, çalışma alanına göreli yolları veya
ana dizine göreli `~/` yollarını kullanabilir. Teslimden önce yine de ajan
dosya okuma ilkesinden ve medya türü denetimlerinden geçerler.

Düz Markdown görsel sözdizimi varsayılan olarak metin kalır. Markdown görsel
yanıtlarını kasıtlı olarak medya eklerine eşleyen kanallar, bunu giden
adaptörlerinde etkinleştirir; Telegram bunu yapar, böylece `![alt](url)` yine de
bir medya yanıtına dönüşebilir.

Bu yönergeler ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim metaverisi olarak kalır; `[embed ...]` yalnızca web'e özgü zengin işleme yoludur.
Güvenilir araç sonucu medyası, teslimden önce aynı `MEDIA:` / `[[audio_as_voice]]` ayrıştırıcısını kullanır; böylece metin araç çıktıları yine de bir ses ekini sesli not olarak işaretleyebilir.

Blok akışı etkin olduğunda, `MEDIA:` bir tur için tek teslimlik metaveri olarak
kalır. Aynı medya URL'si akışla gönderilen bir blokta gönderilir ve son
asistan yükünde yinelenirse, OpenClaw eki bir kez teslim eder ve kopyayı son
yükten çıkarır.

## `[embed ...]`

`[embed ...]`, Control UI için ajana dönük tek zengin işleme sözdizimidir.

Kendi kendini kapatan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]` artık yeni çıktı için geçerli değildir.
- Embed kısa kodları yalnızca asistan mesaj yüzeyinde işlenir.
- Yalnızca URL destekli embed'ler işlenir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed kısa kodları işlenmez.
- Web kullanıcı arayüzü kısa kodu görünür metinden çıkarır ve embed'i satır içinde işler.
- `MEDIA:` bir embed takma adı değildir ve zengin embed işleme için kullanılmamalıdır.

## Saklanan işleme yapısı

Normalleştirilmiş/saklanan asistan içerik bloğu yapılandırılmış bir `canvas` öğesidir:

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

Saklanan/işlenen zengin bloklar bu `canvas` yapısını doğrudan kullanır. `present_view` tanınmaz.

## İlgili

- [RPC adaptörleri](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)

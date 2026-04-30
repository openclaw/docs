---
read_when:
    - Kontrol kullanıcı arayüzünde asistan çıktısı işlemenin değiştirilmesi
    - '`[embed ...]`, `MEDIA:`, yanıt veya ses sunumu yönergelerinde hata ayıklama'
summary: Yerleştirmeler, medya, ses ipuçları ve yanıtlar için zengin çıktı kısa kod protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-04-30T09:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Asistan çıktısı küçük bir teslim/görüntüleme yönergeleri kümesi taşıyabilir:

- Ek teslimi için `MEDIA:`
- Ses sunumu ipuçları için `[[audio_as_voice]]`
- Yanıt meta verileri için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin görüntüleme için `[embed ...]`

Uzak `MEDIA:` ekleri herkese açık `https:` URL'leri olmalıdır. Düz `http:`,
loopback, link-local, özel ve dahili ana makine adları ek yönergeleri olarak
yok sayılır; sunucu tarafı medya getiricileri yine de kendi ağ korumalarını uygular.

Düz Markdown görsel söz dizimi varsayılan olarak metin kalır. Markdown görsel
yanıtlarını bilerek medya eklerine eşleyen kanallar, giden bağdaştırıcılarında
bunu etkinleştirir; Telegram bunu yapar, böylece `![alt](url)` yine de bir medya
yanıtına dönüşebilir.

Bu yönergeler ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim meta verileri olarak kalır; `[embed ...]` yalnızca web'e yönelik zengin görüntüleme yoludur.
Güvenilir araç sonucu medyası, teslimden önce aynı `MEDIA:` / `[[audio_as_voice]]` ayrıştırıcısını kullanır; bu nedenle metin araç çıktıları yine de bir ses ekini sesli not olarak işaretleyebilir.

Blok akışı etkinleştirildiğinde, `MEDIA:` bir tur için tek teslimli meta veri
olarak kalır. Aynı medya URL'si akışla gönderilen bir blokta gönderilir ve son
asistan yükünde tekrarlanırsa, OpenClaw eki bir kez teslim eder ve yineleneni
son yükten çıkarır.

## `[embed ...]`

`[embed ...]`, Control UI için ajanların kullanabileceği tek zengin görüntüleme söz dizimidir.

Kendini kapatan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]` artık yeni çıktı için geçerli değildir.
- Embed kısa kodları yalnızca asistan mesajı yüzeyinde görüntülenir.
- Yalnızca URL destekli embed'ler görüntülenir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed kısa kodları görüntülenmez.
- Web kullanıcı arayüzü kısa kodu görünür metinden çıkarır ve embed'i satır içinde görüntüler.
- `MEDIA:` bir embed takma adı değildir ve zengin embed görüntüleme için kullanılmamalıdır.

## Saklanan görüntüleme biçimi

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

Saklanan/görüntülenen zengin bloklar bu `canvas` biçimini doğrudan kullanır. `present_view` tanınmaz.

## İlgili

- [RPC bağdaştırıcıları](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)

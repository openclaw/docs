---
read_when:
    - Control UI'da asistan çıktısı işlemeyi değiştirme
    - '`[embed ...]`, yapılandırılmış medya, yanıt veya ses sunumu yönergelerinde hata ayıklama'
summary: Yapılandırılmış medya, yerleştirmeler, ses ipuçları ve yanıtlar için zengin çıktı protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-06-28T01:15:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Asistan çıktısı küçük bir teslimat/işleme direktifleri kümesi taşıyabilir:

- ek teslimatı için yapılandırılmış `mediaUrl` / `mediaUrls` alanları
- ses sunumu ipuçları için `[[audio_as_voice]]`
- yanıt meta verileri için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin işlemesi için `[embed ...]`

Uzak medya ekleri herkese açık `https:` URL'leri olmalıdır. Düz `http:`,
loopback, link-local, özel ve dahili ana makine adları ek direktifleri olarak
yok sayılır; sunucu tarafı medya getiricileri yine de kendi ağ korumalarını uygular.

Yerel medya ekleri mutlak yollar, çalışma alanına göreli yollar veya
ana dizine göreli `~/` yolları kullanabilir. Teslimattan önce yine de ajan dosya okuma
politikasından ve medya türü kontrollerinden geçerler.

<Warning>
Araçlardan, plugins, akış bloklarından, tarayıcı çıktısından veya mesaj eylemlerinden
ekler için metin komutları yaymayın. Bunun yerine yapılandırılmış medya alanlarını kullanın.

Geçerli mesaj aracı yükü:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Eski nihai asistan yanıt metni uyumluluk için hâlâ normalleştirilebilir, ancak
genel bir plugin/araç protokolü değildir.
</Warning>

Düz Markdown görsel sözdizimi varsayılan olarak metin kalır. Markdown görsel
yanıtlarını bilinçli olarak medya eklerine eşleyen kanallar bunu giden
bağdaştırıcılarında etkinleştirir; Telegram bunu yapar, böylece `![alt](url)` yine de
bir medya yanıtına dönüşebilir.

Bu direktifler ayrıdır. Yapılandırılmış medya alanları ve yanıt/ses etiketleri
teslimat meta verileridir; `[embed ...]` yalnızca web'e özgü zengin işleme yoludur.

Blok akışı etkinleştirildiğinde, medya yapılandırılmış yük alanlarında taşınmalıdır.
Aynı medya URL'si bir akış bloğunda gönderilir ve nihai asistan yükünde tekrarlanırsa,
OpenClaw eki bir kez teslim eder ve kopyayı nihai yükten çıkarır.

## `[embed ...]`

`[embed ...]`, Control UI için ajanların kullanacağı tek zengin işleme sözdizimidir.

Kendi kendini kapatan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]` yeni çıktı için artık geçerli değildir.
- Embed kısa kodları yalnızca asistan mesaj yüzeyinde işlenir.
- Yalnızca URL destekli embed'ler işlenir. `ref="..."` veya `url="..."` kullanın.
- Blok biçimindeki satır içi HTML embed kısa kodları işlenmez.
- Web UI, kısa kodu görünür metinden çıkarır ve embed'i satır içinde işler.
- Yapılandırılmış medya bir embed takma adı değildir ve zengin embed işlemesi için kullanılmamalıdır.

## Saklanan işleme şekli

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

Saklanan/işlenen zengin bloklar bu `canvas` şeklini doğrudan kullanır. `present_view` tanınmaz.

## İlgili

- [RPC bağdaştırıcıları](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)

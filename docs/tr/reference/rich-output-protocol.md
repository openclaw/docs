---
read_when:
    - Control UI içinde asistan çıktı oluşturmasını değiştirme
    - '`[embed ...]`, `MEDIA:`, yanıt veya ses sunum yönergelerinde hata ayıklama'
summary: Gömüler, medya, ses ipuçları ve yanıtlar için zengin çıktı kısa kod protokolü
title: Zengin çıktı protokolü
x-i18n:
    generated_at: "2026-04-24T09:29:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Asistan çıktısı küçük bir teslim/oluşturma yönergesi kümesi taşıyabilir:

- Ek teslimi için `MEDIA:`
- Ses sunum ipuçları için `[[audio_as_voice]]`
- Yanıt metaverileri için `[[reply_to_current]]` / `[[reply_to:<id>]]`
- Control UI zengin oluşturma için `[embed ...]`

Bu yönergeler ayrıdır. `MEDIA:` ve yanıt/ses etiketleri teslim metaverisi olarak kalır; `[embed ...]` ise yalnızca web’e özgü zengin oluşturma yoludur.

## `[embed ...]`

`[embed ...]`, Control UI için aracıya dönük tek zengin oluşturma söz dizimidir.

Kendiliğinden kapanan örnek:

```text
[embed ref="cv_123" title="Status" /]
```

Kurallar:

- `[view ...]` artık yeni çıktı için geçerli değildir.
- Embed kısa kodları yalnızca asistan mesaj yüzeyinde oluşturulur.
- Yalnızca URL destekli embed’ler oluşturulur. `ref="..."` veya `url="..."` kullanın.
- Blok biçimli satır içi HTML embed kısa kodları oluşturulmaz.
- Web UI kısa kodu görünür metinden çıkarır ve embed’i satır içinde oluşturur.
- `MEDIA:` bir embed takma adı değildir ve zengin embed oluşturma için kullanılmamalıdır.

## Depolanan Oluşturma Şekli

Normalleştirilmiş/depolanmış asistan içerik bloğu yapılandırılmış bir `canvas` öğesidir:

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

Depolanan/oluşturulan zengin bloklar doğrudan bu `canvas` şeklini kullanır. `present_view` tanınmaz.

## İlgili

- [RPC adapters](/tr/reference/rpc)
- [Typebox](/tr/concepts/typebox)

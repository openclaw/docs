---
read_when:
    - Canlı OpenClaw belgelerini terminalden aramak istiyorsunuz
    - Belge CLI'sinin hangi barındırılan arama API'sini çağırdığını bilmeniz gerekir
summary: '`openclaw docs` için CLI başvurusu (canlı dokümanlar dizininde arama yapın)'
title: Belgeler
x-i18n:
    generated_at: "2026-06-28T00:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Terminalden canlı OpenClaw dokümanları dizininde arama yapın. Komut, OpenClaw'ın Cloudflare üzerinde barındırılan doküman arama API'sini çağırır ve sonuçları terminalinizde işler.

## Kullanım

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argümanlar:

| Argüman      | Açıklama                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | Serbest biçimli arama sorgusu. Çok sözcüklü sorgular boşluklarla birleştirilir ve tek parça olarak gönderilir. |

## Örnekler

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Sorgu olmadığında `openclaw docs`, arama çalıştırmak yerine doküman giriş noktası URL'sini ve örnek bir arama komutunu yazdırır.

## Nasıl çalışır?

`openclaw docs`, `https://docs.openclaw.ai/api/search` adresini çağırır ve JSON sonuçlarını işler. Arama çağrısı sabit 30 saniyelik zaman aşımı kullanır.

## Çıktı

Zengin (TTY) terminalde sonuçlar, bir başlığın ardından madde işaretli liste olarak işlenir. Her madde sayfa başlığını, bağlantılı doküman URL'sini ve sonraki satırda kısa bir parçayı gösterir. Boş sonuçlar "Sonuç yok." yazdırır.

Zengin olmayan çıktıda (pipe ile aktarılan, `--no-color`, betikler), aynı veri Markdown olarak işlenir:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Çıkış kodları

| Kod | Anlamı                                                            |
| --- | ----------------------------------------------------------------- |
| `0` | Arama başarılı oldu (sıfır sonuçlu yanıtlar dahil).               |
| `1` | Barındırılan doküman arama API çağrısı başarısız oldu; stderr satır içinde yazdırılır. |

## İlgili

- [CLI başvurusu](/tr/cli)
- [Canlı dokümanlar](https://docs.openclaw.ai)

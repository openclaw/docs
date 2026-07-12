---
read_when:
    - Terminalden canlı OpenClaw belgelerinde arama yapmak istiyorsunuz
    - Dokümanlar CLI'sinin hangi barındırılan arama API'sini çağırdığını bilmeniz gerekir
summary: '`openclaw docs` için CLI referansı (canlı dokümantasyon dizininde arama yapın)'
title: Belgeler
x-i18n:
    generated_at: "2026-07-12T11:34:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Canlı OpenClaw dokümantasyon dizininde terminalden arama yapın.

## Kullanım

```bash
openclaw docs                       # dokümantasyon giriş noktasını ve örnek aramayı yazdır
openclaw docs <query...>            # canlı dokümantasyon dizininde ara
```

| Argüman      | Açıklama                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `[query...]` | Serbest biçimli arama sorgusu. Birden çok sözcüklü sorgular boşluklarla birleştirilip tek sorgu olarak gönderilir. |

Sorgu verilmediğinde `openclaw docs`, arama çalıştırmak yerine dokümantasyon giriş noktası URL'sini ve örnek bir arama komutunu yazdırır.

## Örnekler

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Nasıl çalışır?

`openclaw docs`, `https://docs.openclaw.ai/api/search` adresini çağırır ve JSON sonuçlarını görüntüler. Arama isteği, sabit 30 saniyelik zaman aşımı kullanır.

## Çıktı

Zengin özellikli bir terminalde (TTY) sonuçlar, bir başlığın ardından madde işaretli liste olarak görüntülenir: sayfa başlığı, bağlantılı dokümantasyon URL'si ve sonraki satırda kısa bir alıntı. Sonuç yoksa "Sonuç yok." yazdırılır.

Zengin olmayan çıktıda (boruya aktarıldığında, `--no-color` kullanıldığında veya betiklerde) aynı veriler Markdown olarak görüntülenir:

```markdown
# Dokümantasyon araması: <query>

- [Başlık](https://docs.openclaw.ai/...) - alıntı
- [Başlık](https://docs.openclaw.ai/...) - alıntı
```

## Çıkış kodları

| Kod | Anlam                                                                                       |
| --- | ------------------------------------------------------------------------------------------- |
| `0` | Sıfır sonuç dönen yanıtlar dâhil olmak üzere arama başarıyla tamamlandı.                    |
| `1` | Barındırılan dokümantasyon arama API'si çağrısı başarısız oldu; hata iletisi stderr'e yazdırılır. |

## İlgili

- [CLI başvurusu](/tr/cli)
- [Canlı dokümantasyon](https://docs.openclaw.ai)

---
read_when:
    - Ruhları yayımlama
    - soul yayımlama hatalarında hata ayıklama
summary: Soul paketi biçimi, gerekli dosyalar, sınırlar.
x-i18n:
    generated_at: "2026-05-12T23:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Ruh biçimi

## Diskte

Bir ruh tek bir dosyadır:

- `SOUL.md` (veya `soul.md`)

Şimdilik onlycrabs.ai ek dosyaları reddeder.

## `SOUL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayınlama sırasında metadata'yı frontmatter'dan çıkarır.
- `description`, UI/arama içinde ruh özeti olarak kullanılır.

## Sınırlar

- Toplam bundle boyutu: 50MB.
- Gömme metni yalnızca `SOUL.md` içerir.

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL açısından güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayınlama yeni bir sürüm (semver) oluşturur.
- Etiketler bir sürüme işaret eden string göstergelerdir; `latest` yaygın olarak kullanılır.

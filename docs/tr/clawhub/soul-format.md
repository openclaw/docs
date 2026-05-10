---
read_when:
    - Ruhları yayımlama
    - Soul yayımlama hatalarında hata ayıklama
summary: Ruh paketi biçimi, gerekli dosyalar, sınırlar.
x-i18n:
    generated_at: "2026-05-10T19:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Soul biçimi

## Disk üzerinde

Bir ruh tek bir dosyadır:

- `SOUL.md` (veya `soul.md`)

Şimdilik onlycrabs.ai, ek dosyaları reddeder.

## `SOUL.md`

- İsteğe bağlı YAML frontmatter içeren Markdown.
- Sunucu, yayımlama sırasında metadata bilgilerini frontmatter'dan çıkarır.
- `description`, UI/aramada ruh özeti olarak kullanılır.

## Sınırlar

- Toplam paket boyutu: 50MB.
- Gömme metni yalnızca `SOUL.md` dosyasını içerir.

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL açısından güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayımlama yeni bir sürüm oluşturur (semver).
- Etiketler, bir sürüme işaret eden string işaretçileridir; `latest` yaygın olarak kullanılır.

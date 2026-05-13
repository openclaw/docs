---
read_when:
    - Ruhları yayımlama
    - soul publish hatalarını ayıklama
summary: Soul paketi biçimi, gerekli dosyalar, sınırlar.
x-i18n:
    generated_at: "2026-05-13T05:33:23Z"
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
- Sunucu, yayımlama sırasında metadata bilgilerini frontmatter içinden çıkarır.
- `description`, UI/aramada ruh özeti olarak kullanılır.

## Sınırlar

- Toplam paket boyutu: 50MB.
- Embedding metni yalnızca `SOUL.md` dosyasını içerir.

## Slug'lar

- Varsayılan olarak klasör adından türetilir.
- Küçük harfli ve URL güvenli olmalıdır: `^[a-z0-9][a-z0-9-]*$`.

## Sürümleme + etiketler

- Her yayımlama yeni bir sürüm (semver) oluşturur.
- Etiketler, bir sürüme işaret eden dize işaretçileridir; `latest` yaygın olarak kullanılır.

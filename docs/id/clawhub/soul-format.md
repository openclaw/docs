---
read_when:
    - Menerbitkan jiwa
    - Men-debug kegagalan publikasi soul
summary: Format bundel Soul, berkas wajib, batasan.
x-i18n:
    generated_at: "2026-05-12T04:10:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format soul

## Di disk

Soul adalah satu file:

- `SOUL.md` (atau `soul.md`)

Untuk saat ini, onlycrabs.ai menolak file tambahan apa pun.

## `SOUL.md`

- Markdown dengan frontmatter YAML opsional.
- Server mengekstrak metadata dari frontmatter saat publikasi.
- `description` digunakan sebagai ringkasan soul di UI/pencarian.

## Batas

- Ukuran total bundel: 50MB.
- Teks embedding hanya mencakup `SOUL.md`.

## Slug

- Secara default diturunkan dari nama folder.
- Harus huruf kecil dan aman untuk URL: `^[a-z0-9][a-z0-9-]*$`.

## Pembuatan versi + tag

- Setiap publikasi membuat versi baru (semver).
- Tag adalah penunjuk string ke suatu versi; `latest` umum digunakan.

---
read_when:
    - Anda ingin menghapus status lokal sambil tetap mempertahankan CLI terpasang
    - Anda menginginkan dry-run tentang apa yang akan dihapus
summary: Referensi CLI untuk `openclaw reset` (reset status/config lokal)
title: Reset
x-i18n:
    generated_at: "2026-04-24T09:02:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Reset config/status lokal (CLI tetap terpasang).

Opsi:

- `--scope <scope>`: `config`, `config+creds+sessions`, atau `full`
- `--yes`: lewati prompt konfirmasi
- `--non-interactive`: nonaktifkan prompt; memerlukan `--scope` dan `--yes`
- `--dry-run`: cetak tindakan tanpa menghapus file

Contoh:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Catatan:

- Jalankan `openclaw backup create` terlebih dahulu jika Anda menginginkan snapshot yang dapat dipulihkan sebelum menghapus status lokal.
- Jika Anda tidak memberikan `--scope`, `openclaw reset` menggunakan prompt interaktif untuk memilih apa yang akan dihapus.
- `--non-interactive` hanya valid saat `--scope` dan `--yes` sama-sama diatur.

## Terkait

- [Referensi CLI](/id/cli)

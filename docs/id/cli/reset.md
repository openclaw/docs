---
read_when:
    - Anda ingin menghapus status lokal sambil tetap mempertahankan CLI terinstal
    - Anda ingin melihat dry-run dari apa saja yang akan dihapus
summary: Referensi CLI untuk `openclaw reset` (mengatur ulang status/konfigurasi lokal)
title: reset
x-i18n:
    generated_at: "2026-04-05T13:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Atur ulang konfigurasi/status lokal (tetap mempertahankan CLI terinstal).

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
- Jika Anda tidak menyertakan `--scope`, `openclaw reset` menggunakan prompt interaktif untuk memilih apa yang akan dihapus.
- `--non-interactive` hanya valid jika `--scope` dan `--yes` sama-sama ditetapkan.

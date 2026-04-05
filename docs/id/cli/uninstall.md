---
read_when:
    - Anda ingin menghapus layanan gateway dan/atau state lokal
    - Anda ingin melakukan dry-run terlebih dahulu
summary: Referensi CLI untuk `openclaw uninstall` (hapus layanan gateway + data lokal)
title: uninstall
x-i18n:
    generated_at: "2026-04-05T13:49:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Copot layanan gateway + data lokal (CLI tetap ada).

Opsi:

- `--service`: hapus layanan gateway
- `--state`: hapus state dan config
- `--workspace`: hapus direktori workspace
- `--app`: hapus app macOS
- `--all`: hapus layanan, state, workspace, dan app
- `--yes`: lewati prompt konfirmasi
- `--non-interactive`: nonaktifkan prompt; memerlukan `--yes`
- `--dry-run`: tampilkan tindakan tanpa menghapus file

Contoh:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Catatan:

- Jalankan `openclaw backup create` terlebih dahulu jika Anda ingin snapshot yang dapat dipulihkan sebelum menghapus state atau workspace.
- `--all` adalah singkatan untuk menghapus layanan, state, workspace, dan app sekaligus.
- `--non-interactive` memerlukan `--yes`.

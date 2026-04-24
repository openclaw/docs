---
read_when:
    - Anda ingin menghapus layanan gateway dan/atau status lokal
    - Anda menginginkan dry-run terlebih dahulu
summary: Referensi CLI untuk `openclaw uninstall` (hapus layanan gateway + data lokal)
title: Uninstall
x-i18n:
    generated_at: "2026-04-24T09:03:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Copot layanan gateway + data lokal (CLI tetap ada).

Opsi:

- `--service`: hapus layanan gateway
- `--state`: hapus status dan config
- `--workspace`: hapus direktori workspace
- `--app`: hapus aplikasi macOS
- `--all`: hapus layanan, status, workspace, dan aplikasi
- `--yes`: lewati prompt konfirmasi
- `--non-interactive`: nonaktifkan prompt; memerlukan `--yes`
- `--dry-run`: cetak tindakan tanpa menghapus file

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

- Jalankan `openclaw backup create` terlebih dahulu jika Anda menginginkan snapshot yang dapat dipulihkan sebelum menghapus status atau workspace.
- `--all` adalah singkatan untuk menghapus layanan, status, workspace, dan aplikasi sekaligus.
- `--non-interactive` memerlukan `--yes`.

## Terkait

- [Referensi CLI](/id/cli)
- [Uninstall](/id/install/uninstall)

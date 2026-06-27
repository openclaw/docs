---
read_when:
    - Anda ingin menghapus layanan Gateway dan/atau state lokal
    - Anda ingin dry-run terlebih dahulu
summary: Referensi CLI untuk `openclaw uninstall` (hapus layanan gateway + data lokal)
title: Hapus instalasi
x-i18n:
    generated_at: "2026-06-27T17:21:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Copot pemasangan layanan gateway + data lokal (CLI tetap ada).

Opsi:

- `--service`: hapus layanan gateway
- `--state`: hapus state dan konfigurasi
- `--workspace`: hapus direktori workspace
- `--app`: hapus aplikasi macOS
- `--all`: hapus layanan, state, workspace, dan aplikasi
- `--yes`: lewati prompt konfirmasi
- `--non-interactive`: nonaktifkan prompt; memerlukan `--yes`
- `--dry-run`: cetak tindakan tanpa menghapus berkas

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

- Jalankan `openclaw backup create` terlebih dahulu jika Anda menginginkan snapshot yang dapat dipulihkan sebelum menghapus state atau workspace.
- `--state` mempertahankan direktori workspace yang dikonfigurasi kecuali `--workspace` juga dipilih.
- `--all` adalah singkatan untuk menghapus layanan, state, workspace, dan aplikasi sekaligus.
- `--non-interactive` memerlukan `--yes`.

## Terkait

- [Referensi CLI](/id/cli)
- [Copot pemasangan](/id/install/uninstall)

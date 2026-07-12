---
read_when:
    - Anda ingin menghapus layanan Gateway dan/atau status lokal
    - Anda ingin menjalankan simulasi terlebih dahulu
summary: Referensi CLI untuk `openclaw uninstall` (menghapus layanan Gateway + data lokal)
title: Copot pemasangan
x-i18n:
    generated_at: "2026-07-12T14:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Hapus instalasi layanan Gateway dan/atau data lokal. CLI itu sendiri tidak
dihapus; hapus instalasinya melalui npm/pnpm secara terpisah.

## Opsi

| Flag                | Bawaan  | Deskripsi                                                    |
| ------------------- | ------- | ------------------------------------------------------------ |
| `--service`         | `false` | Hapus layanan Gateway.                                       |
| `--state`           | `false` | Hapus status dan konfigurasi.                                |
| `--workspace`       | `false` | Hapus direktori ruang kerja.                                 |
| `--app`             | `false` | Hapus aplikasi macOS.                                        |
| `--all`             | `false` | Singkatan untuk `--service --state --workspace --app`.       |
| `--yes`             | `false` | Lewati permintaan konfirmasi.                                |
| `--non-interactive` | `false` | Nonaktifkan permintaan input; memerlukan `--yes`.             |
| `--dry-run`         | `false` | Tampilkan tindakan yang direncanakan tanpa menghapus berkas. |

Tanpa flag cakupan, pilihan jamak interaktif akan meminta komponen mana yang
akan dihapus (secara bawaan layanan, status, dan ruang kerja telah dipilih).

## Contoh

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Catatan

- Jalankan `openclaw backup create` terlebih dahulu untuk membuat snapshot yang dapat dipulihkan sebelum menghapus
  status atau ruang kerja.
- `--state` mempertahankan direktori ruang kerja yang dikonfigurasi kecuali jika `--workspace`
  juga dipilih.

## Terkait

- [Referensi CLI](/id/cli)
- [Hapus instalasi](/id/install/uninstall)

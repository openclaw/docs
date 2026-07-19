---
read_when:
    - Anda ingin menghapus status lokal sambil tetap mempertahankan CLI terinstal
    - Anda ingin melakukan uji coba untuk melihat apa yang akan dihapus
summary: Referensi CLI untuk `openclaw reset` (mengatur ulang status/konfigurasi lokal)
title: Atur Ulang
x-i18n:
    generated_at: "2026-07-19T04:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Atur ulang konfigurasi/status lokal (CLI tetap terinstal).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opsi

- `--scope <scope>`: `config`, `config+creds+sessions`, atau `full`
- `--yes`: lewati perintah konfirmasi
- `--non-interactive`: nonaktifkan perintah interaktif; memerlukan `--scope` dan `--yes`
- `--dry-run`: tampilkan tindakan tanpa menghapus berkas

## Cakupan

| Cakupan                 | Yang dihapus                                                               | Menghentikan Gateway terlebih dahulu |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------ |
| `config`                | hanya berkas konfigurasi                                                    | tidak                                |
| `config+creds+sessions` | berkas konfigurasi, direktori OAuth/kredensial, direktori sesi per agen     | ya                                   |
| `full`                  | direktori status (termasuk basis data SQLite bersama) beserta direktori ruang kerja | ya                                   |

`config+creds+sessions` dan `full` menghentikan layanan Gateway terkelola yang sedang berjalan sebelum menghapus status.

## Catatan

- Jalankan `openclaw backup create` terlebih dahulu untuk membuat snapshot yang dapat dipulihkan sebelum menghapus status lokal.
- Status penyiapan ruang kerja dan pengesahan merupakan baris dalam basis data SQLite bersama, sehingga `full` menghapusnya bersama direktori status; saat ini tidak ada berkas sidecar pengesahan yang perlu dihapus secara terpisah.
- Tanpa `--scope`, `openclaw reset` meminta cakupan yang akan dihapus secara interaktif.
- `--non-interactive` hanya valid jika `--scope` dan `--yes` ditetapkan.
- `config+creds+sessions` dan `full` menampilkan `Next: openclaw onboard --install-daemon` setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)

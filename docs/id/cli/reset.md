---
read_when:
    - Anda ingin menghapus status lokal sambil tetap mempertahankan CLI terinstal
    - Anda ingin melakukan uji coba untuk melihat apa saja yang akan dihapus
summary: Referensi CLI untuk `openclaw reset` (mengatur ulang status/konfigurasi lokal)
title: Atur Ulang
x-i18n:
    generated_at: "2026-07-12T14:07:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
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
- `--yes`: lewati permintaan konfirmasi
- `--non-interactive`: nonaktifkan permintaan input; memerlukan `--scope` dan `--yes`
- `--dry-run`: tampilkan tindakan tanpa menghapus berkas

## Cakupan

| Cakupan                 | Yang dihapus                                                                                                         | Menghentikan Gateway terlebih dahulu |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `config`                | hanya berkas konfigurasi                                                                                             | tidak                                |
| `config+creds+sessions` | berkas konfigurasi, direktori OAuth/kredensial, direktori sesi per agen                                              | ya                                   |
| `full`                  | direktori status (termasuk konfigurasi/kredensial jika berada di dalamnya), direktori ruang kerja, dan atestasi ruang kerja | ya                             |

`config+creds+sessions` dan `full` menghentikan layanan Gateway terkelola yang sedang berjalan sebelum menghapus status.

## Catatan

- Jalankan `openclaw backup create` terlebih dahulu untuk membuat snapshot yang dapat dipulihkan sebelum menghapus status lokal.
- Tanpa `--scope`, `openclaw reset` meminta cakupan yang akan dihapus secara interaktif.
- `--non-interactive` hanya valid jika `--scope` dan `--yes` telah ditetapkan.
- `config+creds+sessions` dan `full` menampilkan `Next: openclaw onboard --install-daemon` setelah selesai.

## Terkait

- [Referensi CLI](/id/cli)

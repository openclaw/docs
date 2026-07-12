---
read_when:
    - Anda melakukan penyiapan awal dengan wizard orientasi CLI
    - Anda ingin mengatur jalur ruang kerja default
    - Anda memerlukan flag penyiapan khusus baseline untuk skrip
summary: Referensi CLI untuk `openclaw setup` (alias untuk orientasi awal, dengan penyiapan dasar yang tersedia melalui flag)
title: Penyiapan
x-i18n:
    generated_at: "2026-07-12T14:03:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` menjalankan alur orientasi terpandu yang sama dengan `openclaw onboard`:
perintah ini terlebih dahulu memverifikasi dan menyimpan inferensi, lalu memulai Crestodian untuk mengonfigurasi
ruang kerja, Gateway, kanal, Skills, dan kesehatan. Gunakan `--baseline` jika Anda
hanya perlu menginisialisasi folder konfigurasi/ruang kerja tanpa wisaya.

Dalam mode terpandu, `--workspace <dir>` adalah ruang kerja yang diajukan kepada Crestodian;
ruang kerja tersebut hanya disimpan setelah Anda menyetujui usulan itu. Penyiapan baseline, klasik, dan
noninteraktif menyimpan ruang kerja yang diberikan melalui alur normal masing-masing.

`setup` menerima tanda orientasi yang sama dengan `openclaw onboard`, termasuk
autentikasi (`--auth-choice`, `--token`, tanda kunci penyedia), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), pengaturan ulang (`--reset`, `--reset-scope`), alur
(`--flow quickstart|advanced|manual|import`), dan tanda untuk melewati
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Lihat [Orientasi](/id/cli/onboard) dan
[Otomatisasi CLI](/id/start/wizard-cli-automation) untuk referensi lengkap tanda dan
contoh noninteraktif. `openclaw onboard --modern` adalah alias kompatibilitas
untuk asisten Crestodian yang dikendalikan inferensi dan tidak memiliki padanan `setup`.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan penyiapan karena berkas konfigurasi dikelola oleh Nix. Gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lain.
</Note>

## Opsi

| Tanda                      | Deskripsi                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Usulan ruang kerja dalam mode terpandu; disimpan secara langsung oleh penyiapan baseline, klasik, dan noninteraktif. |
| `--baseline`               | Buat folder konfigurasi/ruang kerja/sesi baseline tanpa orientasi.                                            |
| `--wizard`                 | Diterima untuk kompatibilitas; penyiapan menjalankan orientasi secara bawaan.                                  |
| `--non-interactive`        | Jalankan orientasi tanpa perintah interaktif.                                                                 |
| `--accept-risk`            | Akui risiko akses agen ke seluruh sistem; wajib digunakan bersama `--non-interactive`.                        |
| `--mode <mode>`            | Mode orientasi: `local` atau `remote`.                                                                        |
| `--flow <flow>`            | Alur orientasi: `quickstart`, `advanced`, `manual`, atau `import`.                                             |
| `--reset`                  | Atur ulang konfigurasi + kredensial + sesi sebelum orientasi (ruang kerja hanya dengan `--reset-scope full`). |
| `--reset-scope <scope>`    | Cakupan pengaturan ulang: `config`, `config+creds+sessions`, atau `full`.                                      |
| `--import-from <provider>` | Penyedia migrasi yang akan dijalankan selama orientasi.                                                       |
| `--import-source <path>`   | Direktori utama agen sumber untuk `--import-from`.                                                            |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi orientasi.                                                         |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                             |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                          |
| `--json`                   | Keluarkan ringkasan JSON.                                                                                     |

`--classic` dan `--non-interactive` tidak dapat digunakan bersamaan: mode klasik membuka
wisaya dengan perintah interaktif, sedangkan penyiapan noninteraktif menggunakan jalur otomatisasi.

### Mode baseline

`openclaw setup --baseline` mempertahankan perilaku lama yang hanya menjalankan baseline: perintah ini
membuat direktori konfigurasi, ruang kerja, dan sesi, lalu keluar tanpa
menjalankan orientasi.

## Contoh

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Catatan

- Setelah penyiapan baseline, jalankan `openclaw setup` atau `openclaw onboard` untuk seluruh proses terpandu, `openclaw configure` untuk perubahan tertentu, atau `openclaw channels add` untuk menambahkan akun kanal.
- Jika status Hermes terdeteksi, orientasi interaktif dapat menawarkan migrasi secara otomatis. Orientasi impor memerlukan penyiapan baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana uji coba, cadangan, dan mode penimpaan di luar orientasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Orientasi](/id/cli/onboard)
- [Orientasi (CLI)](/id/start/wizard)
- [Memulai](/id/start/getting-started)
- [Ringkasan instalasi](/id/install)

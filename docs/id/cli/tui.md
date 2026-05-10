---
read_when:
    - Anda menginginkan antarmuka terminal untuk Gateway (ramah untuk penggunaan jarak jauh)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tertanam lokal tanpa Gateway
    - Anda ingin menggunakan openclaw chat atau openclaw tui --local
summary: Referensi CLI untuk `openclaw tui` (UI terminal yang didukung Gateway atau tertanam secara lokal)
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway, atau jalankan dalam mode tertanam
lokal.

Terkait:

- Panduan TUI: [TUI](/id/web/tui)

## Opsi

| Flag                  | Default                                      | Deskripsi                                                                                         |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                      | Jalankan terhadap runtime agen tertanam lokal alih-alih Gateway.                                  |
| `--url <url>`         | `gateway.remote.url` dari konfigurasi        | URL WebSocket Gateway.                                                                            |
| `--token <token>`     | (tidak ada)                                  | Token Gateway jika diperlukan.                                                                    |
| `--password <pass>`   | (tidak ada)                                  | Kata sandi Gateway jika diperlukan.                                                               |
| `--session <key>`     | `main` (atau `global` saat cakupannya global) | Kunci sesi. Di dalam workspace agen, agen tersebut dipilih otomatis kecuali diberi prefiks.       |
| `--deliver`           | `false`                                      | Kirim balasan asisten melalui channel yang dikonfigurasi.                                         |
| `--thinking <level>`  | (default model)                              | Override tingkat berpikir.                                                                        |
| `--message <text>`    | (tidak ada)                                  | Kirim pesan awal setelah terhubung.                                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`             | Timeout agen. Nilai tidak valid akan mencatat peringatan dan diabaikan.                           |
| `--history-limit <n>` | `200`                                        | Entri riwayat yang dimuat saat melampirkan.                                                       |

Alias: `openclaw chat` dan `openclaw terminal` memanggil perintah yang sama dengan `--local` tersirat.

Catatan:

- `chat` dan `terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- `tui` menyelesaikan SecretRefs autentikasi gateway yang dikonfigurasi untuk autentikasi token/kata sandi saat memungkinkan (penyedia `env`/`file`/`exec`).
- Saat diluncurkan dari dalam direktori workspace agen yang dikonfigurasi, TUI otomatis memilih agen tersebut sebagai default kunci sesi (kecuali `--session` secara eksplisit berupa `agent:<id>:...`).
- Mode lokal menggunakan runtime agen tertanam secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur yang hanya tersedia di Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` di dalam permukaan perintah TUI.
- Gerbang persetujuan Plugin tetap berlaku dalam mode lokal. Alat yang memerlukan persetujuan meminta keputusan di terminal; tidak ada yang otomatis disetujui secara diam-diam hanya karena Gateway tidak terlibat.

## Contoh

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Loop perbaikan konfigurasi

Gunakan mode lokal saat konfigurasi saat ini sudah valid dan Anda ingin
agen tertanam memeriksanya, membandingkannya dengan docs, dan membantu memperbaikinya
dari terminal yang sama:

Jika `openclaw config validate` sudah gagal, gunakan `openclaw configure` atau
`openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati penjaga
konfigurasi tidak valid.

```bash
openclaw chat
```

Lalu di dalam TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Terapkan perbaikan tertarget dengan `openclaw config set` atau `openclaw configure`, lalu
jalankan ulang `openclaw config validate`. Lihat [TUI](/id/web/tui) dan [Konfigurasi](/id/cli/config).

## Terkait

- [Referensi CLI](/id/cli)
- [TUI](/id/web/tui)

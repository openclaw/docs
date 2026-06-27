---
read_when:
    - Anda menginginkan UI terminal untuk Gateway (ramah untuk penggunaan jarak jauh)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tertanam lokal tanpa Gateway
    - Anda ingin menggunakan openclaw chat atau openclaw tui --local
summary: Referensi CLI untuk `openclaw tui` (UI terminal tertanam lokal atau yang didukung Gateway)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:22:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway, atau jalankan dalam mode tertanam
lokal.

Terkait:

- Panduan TUI: [TUI](/id/web/tui)

## Opsi

| Flag                  | Default                                   | Deskripsi                                                                          |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Jalankan terhadap runtime agen tertanam lokal, bukan Gateway.                      |
| `--url <url>`         | `gateway.remote.url` from config          | URL WebSocket Gateway.                                                             |
| `--token <token>`     | (tidak ada)                               | Token Gateway jika diperlukan.                                                     |
| `--password <pass>`   | (tidak ada)                               | Kata sandi Gateway jika diperlukan.                                                |
| `--session <key>`     | `main` (atau `global` saat cakupan global) | Kunci sesi. Di dalam workspace agen, ini otomatis memilih agen tersebut kecuali diberi prefiks. |
| `--deliver`           | `false`                                   | Kirim balasan asisten melalui channel yang dikonfigurasi.                          |
| `--thinking <level>`  | (default model)                           | Override tingkat thinking.                                                         |
| `--message <text>`    | (tidak ada)                               | Kirim pesan awal setelah terhubung.                                                |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Timeout agen. Nilai tidak valid mencatat peringatan dan diabaikan.                 |
| `--history-limit <n>` | `200`                                     | Entri riwayat yang dimuat saat attach.                                             |

Alias: `openclaw chat` dan `openclaw terminal` menjalankan perintah yang sama dengan `--local` tersirat.

Catatan:

- `chat` dan `terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- `tui` menyelesaikan SecretRefs autentikasi gateway yang dikonfigurasi untuk autentikasi token/kata sandi jika memungkinkan (provider `env`/`file`/`exec`).
- Saat diluncurkan dari dalam direktori workspace agen yang dikonfigurasi, TUI otomatis memilih agen tersebut sebagai default kunci sesi (kecuali `--session` secara eksplisit berupa `agent:<id>:...`).
- Untuk menampilkan hostname Gateway di footer untuk koneksi non-lokal yang didukung URL, jalankan `openclaw config set tui.footer.showRemoteHost true`. Label host nonaktif secara default dan tidak pernah muncul untuk koneksi local loopback atau lokal tertanam.
- Mode lokal menggunakan runtime agen tertanam secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` di dalam permukaan perintah TUI.
- Gate persetujuan Plugin tetap berlaku dalam mode lokal. Alat yang memerlukan persetujuan meminta keputusan di terminal; tidak ada yang disetujui otomatis secara diam-diam hanya karena Gateway tidak dilibatkan.
- [Sasaran](/id/tools/goal) sesi muncul di footer dan dapat dikelola dengan `/goal`.

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

Gunakan mode lokal saat konfigurasi saat ini sudah tervalidasi dan Anda ingin
agen tertanam memeriksanya, membandingkannya dengan dokumentasi, dan membantu memperbaikinya
dari terminal yang sama:

Jika `openclaw config validate` sudah gagal, gunakan `openclaw configure` atau
`openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati guard
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

Terapkan perbaikan terarah dengan `openclaw config set` atau `openclaw configure`, lalu
jalankan ulang `openclaw config validate`. Lihat [TUI](/id/web/tui) dan [Konfigurasi](/id/cli/config).

## Terkait

- [Referensi CLI](/id/cli)
- [TUI](/id/web/tui)
- [Sasaran](/id/tools/goal)

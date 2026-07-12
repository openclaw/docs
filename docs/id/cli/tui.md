---
read_when:
    - Anda menginginkan antarmuka terminal untuk Gateway (cocok untuk akses jarak jauh)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tertanam lokal tanpa Gateway
    - Anda ingin menggunakan `openclaw chat` atau `openclaw tui --local`
summary: Referensi CLI untuk `openclaw tui` (antarmuka pengguna terminal tertanam lokal atau berbasis Gateway)
title: TUI
x-i18n:
    generated_at: "2026-07-12T14:03:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Buka antarmuka terminal yang terhubung ke Gateway, atau jalankan dalam mode
tertanam lokal.

Panduan terkait: [TUI](/id/web/tui)

## Opsi

| Flag                         | Bawaan                                    | Deskripsi                                                                                   |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Jalankan dengan runtime agen tertanam lokal, bukan Gateway.                                  |
| `--url <url>`                | `gateway.remote.url` dari konfigurasi     | URL WebSocket Gateway.                                                                      |
| `--token <token>`            | (tidak ada)                               | Token Gateway jika diperlukan.                                                              |
| `--password <pass>`          | (tidak ada)                               | Kata sandi Gateway jika diperlukan.                                                         |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Sidik jari sertifikat TLS yang diharapkan untuk Gateway `wss://` yang disematkan.             |
| `--session <key>`            | `main` (atau `global` saat cakupan global) | Kunci sesi. Di dalam ruang kerja agen, agen tersebut dipilih otomatis kecuali diberi prefiks. |
| `--deliver`                  | `false`                                   | Kirim balasan asisten melalui kanal yang dikonfigurasi.                                      |
| `--thinking <level>`         | (bawaan model)                            | Penggantian tingkat pemikiran.                                                              |
| `--message <text>`           | (tidak ada)                               | Kirim pesan awal setelah terhubung.                                                         |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Batas waktu agen. Nilai yang tidak valid mencatat peringatan dan diabaikan.                  |
| `--history-limit <n>`        | `200`                                     | Entri riwayat yang dimuat saat dilampirkan.                                                 |

Alias: `openclaw chat` dan `openclaw terminal` menjalankan perintah ini dengan
`--local` tersirat.

## Catatan

- `--local` tidak dapat digabungkan dengan `--url`, `--token`, `--password`, atau `--tls-fingerprint`.
- `tui` menyelesaikan SecretRef autentikasi Gateway yang dikonfigurasi untuk autentikasi token/kata sandi
  jika memungkinkan (penyedia `env`/`file`/`exec`).
- Tanpa URL atau port eksplisit, `tui` mengikuti port Gateway lokal aktif
  yang dicatat oleh Gateway yang sedang berjalan. `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT`, dan konfigurasi Gateway jarak jauh yang eksplisit tetap didahulukan.
- Saat dijalankan dari dalam direktori ruang kerja agen yang dikonfigurasi, TUI secara otomatis memilih
  agen tersebut sebagai bawaan kunci sesi (kecuali `--session` secara eksplisit berupa
  `agent:<id>:...`).
- Untuk menampilkan nama host Gateway di footer bagi koneksi berbasis URL
  nonlokal, jalankan `openclaw config set tui.footer.showRemoteHost true`. Dinonaktifkan secara
  bawaan; tidak pernah ditampilkan untuk koneksi local loopback atau koneksi lokal tertanam.
- Mode lokal menggunakan runtime agen tertanam secara langsung. Sebagian besar alat lokal berfungsi,
  tetapi fitur khusus Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` ke antarmuka perintah TUI.
- Gerbang persetujuan Plugin tetap berlaku dalam mode lokal: alat yang memerlukan persetujuan
  meminta keputusan di terminal, tidak ada yang disetujui otomatis secara diam-diam.
- [Tujuan](/id/tools/goal) sesi muncul di footer dan dapat dikelola dengan
  `/goal`.

## Contoh

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# saat dijalankan di dalam ruang kerja agen, menyimpulkan agen tersebut secara otomatis
openclaw tui --session bugfix
```

## Siklus perbaikan konfigurasi

Gunakan mode lokal agar agen tertanam memeriksa konfigurasi saat ini, membandingkannya
dengan dokumentasi, dan membantu memperbaikinya dari terminal yang sama.

Jika `openclaw config validate` sudah gagal, jalankan `openclaw configure` atau
`openclaw doctor --fix` terlebih dahulu; `openclaw chat` tidak melewati
pengaman konfigurasi tidak valid.

```bash
openclaw chat
```

Kemudian di dalam TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Terapkan perbaikan yang ditargetkan dengan `openclaw config set` atau `openclaw configure`, lalu
jalankan kembali `openclaw config validate`. Lihat [TUI](/id/web/tui) dan
[Konfigurasi](/id/cli/config).

## Terkait

- [Referensi CLI](/id/cli)
- [TUI](/id/web/tui)
- [Tujuan](/id/tools/goal)

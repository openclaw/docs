---
read_when:
    - Anda menginginkan UI terminal untuk Gateway (ramah untuk akses jarak jauh)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tertanam lokal tanpa Gateway
    - Anda ingin menggunakan openclaw chat atau openclaw tui --local
summary: Referensi CLI untuk `openclaw tui` (UI terminal tertanam lokal atau didukung Gateway)
title: TUI
x-i18n:
    generated_at: "2026-07-19T16:31:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5406f25bbd22c64867296c15112fafcaf8e1580c759e5fdc81fccfb62ae1e318
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway, atau jalankan dalam mode tersemat
lokal.

Panduan terkait: [TUI](/id/web/tui)

## Opsi

| Flag                         | Default                                   | Deskripsi                                                                          |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Jalankan dengan runtime agen tersemat lokal, bukan dengan Gateway.                  |
| `--url <url>`                | `gateway.remote.url` dari konfigurasi          | URL WebSocket Gateway.                                                             |
| `--token <token>`            | (tidak ada)                               | Token Gateway jika diperlukan.                                                     |
| `--password <pass>`          | (tidak ada)                               | Kata sandi Gateway jika diperlukan.                                                |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Sidik jari sertifikat TLS yang diharapkan untuk Gateway `wss://` yang disematkan. |
| `--session <key>`            | `main` (atau `global` saat cakupannya global) | Kunci sesi. Di dalam ruang kerja agen, agen tersebut dipilih secara otomatis kecuali diberi prefiks. |
| `--deliver`                  | `false`                                   | Kirim balasan asisten melalui saluran yang dikonfigurasi.                          |
| `--thinking <level>`         | (default model)                           | Penimpaan tingkat pemikiran.                                                       |
| `--message <text>`           | (tidak ada)                               | Kirim pesan awal setelah terhubung.                                                |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Batas waktu agen. Nilai yang tidak valid mencatat peringatan dan diabaikan.         |
| `--history-limit <n>`        | `200`                                     | Entri riwayat yang dimuat saat terhubung.                                          |

Alias: `openclaw chat` dan `openclaw terminal` menjalankan perintah ini dengan
`--local` tersirat.

## Catatan

- `--local` tidak dapat digabungkan dengan `--url`, `--token`, `--password`, atau `--tls-fingerprint`.
- `tui` menyelesaikan SecretRef autentikasi Gateway yang dikonfigurasi untuk autentikasi token/kata sandi
  jika memungkinkan (penyedia `env`/`file`/`exec`).
- Tanpa URL atau port eksplisit, `tui` mengikuti port Gateway lokal aktif
  yang dicatat oleh Gateway yang sedang berjalan. `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT`, dan konfigurasi Gateway jarak jauh yang eksplisit tetap diprioritaskan.
- Saat diluncurkan dari dalam direktori ruang kerja agen yang dikonfigurasi, TUI secara otomatis memilih
  agen tersebut sebagai default kunci sesi (kecuali `--session` secara eksplisit
  bernilai `agent:<id>:...`).
- Mode lokal menggunakan runtime agen tersemat secara langsung. Sebagian besar alat lokal berfungsi,
  tetapi fitur khusus Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` ke permukaan perintah TUI.
- Gerbang persetujuan Plugin tetap berlaku dalam mode lokal: alat yang memerlukan persetujuan
  meminta keputusan di terminal, tidak ada yang disetujui secara otomatis tanpa pemberitahuan.
- [Tujuan](/id/tools/goal) sesi muncul di bagian bawah dan dapat dikelola dengan
  `/goal`.

## Contoh

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Bandingkan konfigurasi saya dengan dokumentasi dan beri tahu apa yang harus diperbaiki"
# saat dijalankan di dalam ruang kerja agen, menyimpulkan agen tersebut secara otomatis
openclaw tui --session bugfix
```

## Siklus perbaikan konfigurasi

Gunakan mode lokal agar agen tersemat memeriksa konfigurasi saat ini, membandingkannya
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

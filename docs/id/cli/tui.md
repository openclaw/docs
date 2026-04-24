---
read_when:
    - Anda menginginkan UI terminal untuk Gateway (ramah remote)
    - Anda ingin meneruskan url/token/session dari skrip
    - Anda ingin menjalankan TUI dalam mode tersemat lokal tanpa Gateway
    - Anda ingin menggunakan openclaw chat atau openclaw tui --local
summary: Referensi CLI untuk `openclaw tui` (UI terminal tersemat lokal atau berbasis Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:03:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway, atau jalankan dalam
mode tersemat lokal.

Terkait:

- Panduan TUI: [TUI](/id/web/tui)

Catatan:

- `chat` dan `terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- `tui` me-resolve SecretRef autentikasi Gateway yang dikonfigurasi untuk autentikasi token/password jika memungkinkan (provider `env`/`file`/`exec`).
- Saat diluncurkan dari dalam direktori workspace agen yang dikonfigurasi, TUI otomatis memilih agen tersebut untuk default session key (kecuali `--session` secara eksplisit adalah `agent:<id>:...`).
- Mode lokal menggunakan runtime agen tersemat secara langsung. Sebagian besar tool lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.
- Mode lokal menambahkan `/auth [provider]` di dalam permukaan perintah TUI.
- Gate persetujuan Plugin tetap berlaku dalam mode lokal. Tool yang memerlukan persetujuan akan meminta keputusan di terminal; tidak ada yang otomatis disetujui secara diam-diam karena Gateway tidak terlibat.

## Contoh

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# saat dijalankan di dalam workspace agen, agen tersebut disimpulkan secara otomatis
openclaw tui --session bugfix
```

## Loop perbaikan konfigurasi

Gunakan mode lokal saat konfigurasi saat ini sudah valid dan Anda ingin agen
tersemat memeriksanya, membandingkannya dengan dokumentasi, dan membantu memperbaikinya
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

Terapkan perbaikan yang ditargetkan dengan `openclaw config set` atau `openclaw configure`, lalu
jalankan ulang `openclaw config validate`. Lihat [TUI](/id/web/tui) dan [Config](/id/cli/config).

## Terkait

- [Referensi CLI](/id/cli)
- [TUI](/id/web/tui)

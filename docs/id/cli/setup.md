---
read_when:
    - Anda sedang melakukan penyiapan awal dengan panduan orientasi CLI
    - Anda ingin menetapkan jalur ruang kerja default
    - Anda memerlukan flag penyiapan baseline-only untuk skrip
summary: Referensi CLI untuk `openclaw setup` (alias untuk onboarding, dengan penyiapan dasar tersedia melalui flag)
title: Penyiapan
x-i18n:
    generated_at: "2026-06-30T22:36:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Jalankan alur orientasi CLI lengkap. `openclaw setup` adalah alias untuk `openclaw onboard`; gunakan `--baseline` saat Anda hanya perlu menginisialisasi folder konfigurasi/ruang kerja tanpa wizard.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan setup karena file konfigurasi dikelola oleh Nix. Gunakan [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lain.
</Note>

## Opsi

| Opsi                       | Deskripsi                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Direktori ruang kerja agen (default `~/.openclaw/workspace`; disimpan sebagai `agents.defaults.workspace`). |
| `--baseline`               | Buat folder konfigurasi/ruang kerja/sesi dasar tanpa orientasi.                                |
| `--wizard`                 | Diterima untuk kompatibilitas; setup menjalankan orientasi secara default.                                       |
| `--non-interactive`        | Jalankan orientasi tanpa prompt.                                                                     |
| `--accept-risk`            | Akui risiko akses agen ke seluruh sistem; wajib dengan `--non-interactive`.                       |
| `--mode <mode>`            | Mode orientasi: `local` atau `remote`.                                                               |
| `--import-from <provider>` | Penyedia migrasi yang dijalankan selama orientasi.                                                        |
| `--import-source <path>`   | Beranda agen sumber untuk `--import-from`.                                                              |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi orientasi.                                               |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                       |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                    |

### Mode dasar

`openclaw setup --baseline` mempertahankan perilaku lama yang hanya membuat dasar: perintah ini membuat direktori konfigurasi, ruang kerja, dan sesi, lalu keluar tanpa menjalankan orientasi.

## Contoh

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Catatan

- `openclaw setup` biasa menjalankan perjalanan terpandu yang sama dengan `openclaw onboard`.
- Setelah setup dasar, jalankan `openclaw setup` atau `openclaw onboard` untuk perjalanan terpandu lengkap, `openclaw configure` untuk perubahan tertarget, atau `openclaw channels add` untuk menambahkan akun kanal.
- Jika state Hermes terdeteksi, orientasi interaktif dapat menawarkan migrasi secara otomatis. Orientasi impor memerlukan setup baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, cadangan, dan mode timpa di luar orientasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Orientasi (CLI)](/id/start/wizard)
- [Mulai menggunakan](/id/start/getting-started)
- [Ikhtisar instalasi](/id/install)

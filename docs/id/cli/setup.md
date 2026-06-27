---
read_when:
    - Anda melakukan penyiapan pertama kali tanpa onboarding CLI lengkap
    - Anda ingin mengatur jalur workspace default
    - Anda perlu setiap flag dan bagaimana penyiapan memutuskan antara mode baseline dan mode wizard
summary: Referensi CLI untuk `openclaw setup` (inisialisasi konfigurasi plus ruang kerja, secara opsional menjalankan onboarding)
title: Pengaturan
x-i18n:
    generated_at: "2026-06-27T17:21:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inisialisasi konfigurasi dasar dan ruang kerja agen. Jika ada flag onboarding, wizard juga dijalankan.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan setup karena file konfigurasi dikelola oleh Nix. Gunakan [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lain.
</Note>

## Opsi

| Flag                       | Deskripsi                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Direktori ruang kerja agen (default `~/.openclaw/workspace`; disimpan sebagai `agents.defaults.workspace`). |
| `--wizard`                 | Jalankan onboarding interaktif.                                                                         |
| `--non-interactive`        | Jalankan onboarding tanpa prompt.                                                                     |
| `--accept-risk`            | Mengakui risiko akses agen ke seluruh sistem; wajib dengan `--non-interactive`.                       |
| `--mode <mode>`            | Mode onboarding: `local` atau `remote`.                                                               |
| `--import-from <provider>` | Penyedia migrasi yang dijalankan selama onboarding.                                                        |
| `--import-source <path>`   | Home agen sumber untuk `--import-from`.                                                              |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi onboarding.                                               |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                       |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                    |

### Pemicu otomatis wizard

`openclaw setup` menjalankan wizard saat salah satu flag berikut ada secara eksplisit, bahkan tanpa `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Contoh

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Catatan

- `openclaw setup` biasa menginisialisasi konfigurasi dan ruang kerja tanpa menjalankan alur onboarding lengkap.
- Setelah setup biasa, jalankan `openclaw onboard` untuk perjalanan terpandu lengkap, `openclaw configure` untuk perubahan terarah, atau `openclaw channels add` untuk menambahkan akun channel.
- Jika status Hermes terdeteksi, onboarding interaktif dapat menawarkan migrasi secara otomatis. Onboarding impor memerlukan setup baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, cadangan, dan mode penimpaan di luar onboarding.

## Terkait

- [Referensi CLI](/id/cli)
- [Onboarding (CLI)](/id/start/wizard)
- [Mulai](/id/start/getting-started)
- [Ikhtisar instalasi](/id/install)

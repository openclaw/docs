---
read_when:
    - Anda sedang melakukan penyiapan pertama kali tanpa proses orientasi CLI lengkap
    - Anda ingin mengatur jalur ruang kerja default
    - Anda memerlukan setiap flag dan cara setup memutuskan antara mode baseline dan wizard
summary: Referensi CLI untuk `openclaw setup` (menginisialisasi konfigurasi beserta ruang kerja, secara opsional menjalankan proses orientasi)
title: Penyiapan
x-i18n:
    generated_at: "2026-05-10T19:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inisialisasi konfigurasi dasar dan ruang kerja agen. Jika ada flag orientasi awal, juga menjalankan wizard.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan setup karena file konfigurasi dikelola oleh Nix. Gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lain.
</Note>

## Opsi

| Flag                       | Deskripsi                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Direktori ruang kerja agen (default `~/.openclaw/workspace`; disimpan sebagai `agents.defaults.workspace`). |
| `--wizard`                 | Jalankan orientasi awal interaktif.                                                                        |
| `--non-interactive`        | Jalankan orientasi awal tanpa prompt.                                                                      |
| `--mode <mode>`            | Mode orientasi awal: `local` atau `remote`.                                                                |
| `--import-from <provider>` | Penyedia migrasi yang akan dijalankan selama orientasi awal.                                               |
| `--import-source <path>`   | Home agen sumber untuk `--import-from`.                                                                    |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi orientasi awal.                                                 |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                          |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                       |

### Pemicu otomatis wizard

`openclaw setup` menjalankan wizard ketika salah satu flag ini secara eksplisit ada, bahkan tanpa `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Contoh

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Catatan

- `openclaw setup` biasa menginisialisasi konfigurasi dan ruang kerja tanpa menjalankan alur orientasi awal penuh.
- Setelah setup biasa, jalankan `openclaw onboard` untuk perjalanan terpandu penuh, `openclaw configure` untuk perubahan tertarget, atau `openclaw channels add` untuk menambahkan akun saluran.
- Jika status Hermes terdeteksi, orientasi awal interaktif dapat menawarkan migrasi secara otomatis. Orientasi awal impor memerlukan setup baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, cadangan, dan mode timpa di luar orientasi awal.

## Terkait

- [Referensi CLI](/id/cli)
- [Orientasi awal (CLI)](/id/start/wizard)
- [Memulai](/id/start/getting-started)
- [Ikhtisar instalasi](/id/install)

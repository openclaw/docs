---
read_when:
    - Mengintegrasikan aplikasi mac dengan siklus hidup gateway
summary: Siklus hidup Gateway di macOS (launchd)
title: Siklus Hidup Gateway
x-i18n:
    generated_at: "2026-04-05T14:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Siklus hidup Gateway di macOS

Aplikasi macOS **mengelola Gateway melalui launchd** secara default dan tidak memunculkan
Gateway sebagai child process. Aplikasi ini pertama-tama mencoba menempel ke
Gateway yang sudah berjalan pada port yang dikonfigurasi; jika tidak ada yang dapat dijangkau,
aplikasi akan mengaktifkan layanan launchd melalui CLI `openclaw` eksternal (tanpa runtime tersemat). Ini memberi Anda
auto-start yang andal saat login dan restart saat crash.

Mode child-process (Gateway dimunculkan langsung oleh aplikasi) **tidak digunakan** saat ini.
Jika Anda memerlukan keterkaitan yang lebih erat dengan UI, jalankan Gateway secara manual di terminal.

## Perilaku default (launchd)

- Aplikasi menginstal LaunchAgent per pengguna dengan label `ai.openclaw.gateway`
  (atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` lama tetap didukung).
- Saat mode Local diaktifkan, aplikasi memastikan LaunchAgent dimuat dan
  memulai Gateway jika diperlukan.
- Log ditulis ke path log gateway launchd (terlihat di Pengaturan Debug).

Perintah umum:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profil bernama.

## Build dev tanpa tanda tangan

`scripts/restart-mac.sh --no-sign` adalah untuk build lokal cepat saat Anda tidak memiliki
kunci penandatanganan. Untuk mencegah launchd menunjuk ke biner relay tanpa tanda tangan, skrip ini:

- Menulis `~/.openclaw/disable-launchagent`.

Jalankan `scripts/restart-mac.sh` yang ditandatangani akan menghapus override ini jika marker tersebut
ada. Untuk mereset secara manual:

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode attach-only

Untuk memaksa aplikasi macOS **tidak pernah menginstal atau mengelola launchd**, jalankan
dengan `--attach-only` (atau `--no-launchd`). Ini akan menetapkan `~/.openclaw/disable-launchagent`,
sehingga aplikasi hanya menempel ke Gateway yang sudah berjalan. Anda dapat mengubah perilaku yang sama
di Pengaturan Debug.

## Mode remote

Mode remote tidak pernah memulai Gateway lokal. Aplikasi menggunakan tunnel SSH ke
host remote dan terhubung melalui tunnel tersebut.

## Mengapa kami memilih launchd

- Auto-start saat login.
- Semantik restart/KeepAlive bawaan.
- Log dan supervisi yang dapat diprediksi.

Jika mode child-process yang sesungguhnya diperlukan lagi di masa depan, mode itu harus didokumentasikan sebagai
mode khusus dev yang terpisah dan eksplisit.

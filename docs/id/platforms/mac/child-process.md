---
read_when:
    - Mengintegrasikan aplikasi Mac dengan siklus hidup Gateway
summary: Siklus hidup Gateway di macOS (launchd)
title: Siklus hidup Gateway di macOS
x-i18n:
    generated_at: "2026-07-12T14:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Aplikasi macOS mengelola Gateway melalui **launchd** secara default dan tidak
menjalankan Gateway sebagai proses anak. Aplikasi terlebih dahulu mencoba terhubung ke
Gateway yang sudah berjalan pada port yang dikonfigurasi; jika tidak ada yang dapat dijangkau, aplikasi
mengaktifkan layanan launchd melalui CLI `openclaw` eksternal (tanpa runtime
tertanam). Hal ini menyediakan mulai otomatis yang andal saat masuk dan mulai ulang ketika terjadi crash.

Mode proses anak (Gateway dijalankan langsung oleh aplikasi) **tidak digunakan**
saat ini. Jika Anda memerlukan integrasi yang lebih erat dengan UI, jalankan Gateway secara manual di
terminal.

## Perilaku default (launchd)

- Aplikasi memasang LaunchAgent per pengguna dengan label `ai.openclaw.gateway` (atau
  `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`).
- Saat mode Lokal diaktifkan, aplikasi memastikan LaunchAgent telah dimuat dan
  memulai Gateway jika diperlukan.
- Log ditulis ke jalur log gateway launchd (terlihat di Pengaturan Debug).

Perintah umum:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profil bernama.

## Build pengembangan tanpa tanda tangan

`scripts/restart-mac.sh --no-sign` digunakan untuk build lokal cepat tanpa kunci
penandatanganan. Agar launchd tidak mengarah ke biner relai tanpa tanda tangan, perintah ini menulis
`~/.openclaw/disable-launchagent`.

Eksekusi `scripts/restart-mac.sh` yang ditandatangani menghapus penimpaan ini jika penanda
tersebut ada. Untuk mengatur ulang secara manual:

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode hanya-terhubung

Untuk memaksa aplikasi macOS agar tidak pernah memasang atau mengelola launchd, jalankan dengan
`--attach-only` (atau `--no-launchd`). Tindakan ini menetapkan
`~/.openclaw/disable-launchagent`, sehingga aplikasi hanya terhubung ke Gateway yang sudah
berjalan. Aktifkan atau nonaktifkan perilaku yang sama di Pengaturan Debug.

## Mode jarak jauh

Mode jarak jauh tidak pernah memulai Gateway lokal. Aplikasi menggunakan terowongan SSH ke
host jarak jauh dan terhubung melalui terowongan tersebut.

## Mengapa kami memilih launchd

- Mulai otomatis saat masuk.
- Semantik mulai ulang/KeepAlive bawaan.
- Log dan supervisi yang dapat diprediksi.

Jika mode proses anak yang sebenarnya diperlukan lagi, mode tersebut harus didokumentasikan sebagai
mode khusus pengembangan yang terpisah dan eksplisit.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Panduan operasional Gateway](/id/gateway)

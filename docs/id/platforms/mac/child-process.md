---
read_when:
    - Mengintegrasikan aplikasi Mac dengan siklus hidup Gateway
summary: Siklus hidup Gateway di macOS (launchd)
title: Siklus hidup Gateway di macOS
x-i18n:
    generated_at: "2026-05-06T09:19:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Aplikasi macOS **mengelola Gateway melalui launchd** secara default dan tidak menjalankan Gateway sebagai proses anak. Aplikasi pertama-tama mencoba terhubung ke Gateway yang sudah berjalan pada port yang dikonfigurasi; jika tidak ada yang dapat dijangkau, aplikasi mengaktifkan layanan launchd melalui CLI `openclaw` eksternal (tanpa runtime tertanam). Ini memberi Anda mulai otomatis yang andal saat masuk dan mulai ulang saat terjadi kegagalan.

Mode proses anak (Gateway dijalankan langsung oleh aplikasi) **tidak digunakan** saat ini. Jika Anda memerlukan keterikatan yang lebih erat dengan UI, jalankan Gateway secara manual di terminal.

## Perilaku default (launchd)

- Aplikasi memasang LaunchAgent per pengguna berlabel `ai.openclaw.gateway`
  (atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` lama didukung).
- Saat mode Lokal diaktifkan, aplikasi memastikan LaunchAgent dimuat dan
  memulai Gateway jika diperlukan.
- Log ditulis ke jalur log Gateway launchd (terlihat di Pengaturan Debug).

Perintah umum:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profil bernama.

## Build dev tanpa tanda tangan

`scripts/restart-mac.sh --no-sign` ditujukan untuk build lokal cepat saat Anda tidak memiliki kunci penandatanganan. Untuk mencegah launchd mengarah ke biner relay tanpa tanda tangan, perintah ini:

- Menulis `~/.openclaw/disable-launchagent`.

Jalankan bertanda tangan dari `scripts/restart-mac.sh` akan menghapus pengesampingan ini jika marker ada. Untuk mengatur ulang secara manual:

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode hanya terhubung

Untuk memaksa aplikasi macOS **tidak pernah memasang atau mengelola launchd**, jalankan dengan `--attach-only` (atau `--no-launchd`). Ini menyetel `~/.openclaw/disable-launchagent`, sehingga aplikasi hanya terhubung ke Gateway yang sudah berjalan. Anda dapat mengaktifkan perilaku yang sama di Pengaturan Debug.

## Mode jarak jauh

Mode jarak jauh tidak pernah memulai Gateway lokal. Aplikasi menggunakan tunnel SSH ke host jarak jauh dan terhubung melalui tunnel tersebut.

## Mengapa kami memilih launchd

- Mulai otomatis saat masuk.
- Semantik mulai ulang/KeepAlive bawaan.
- Log dan supervisi yang dapat diprediksi.

Jika mode proses anak yang sebenarnya diperlukan lagi, mode tersebut harus didokumentasikan sebagai mode khusus pengembangan yang terpisah dan eksplisit.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Runbook Gateway](/id/gateway)

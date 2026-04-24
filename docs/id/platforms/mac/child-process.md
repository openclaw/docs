---
read_when:
    - Mengintegrasikan aplikasi Mac dengan siklus hidup Gateway
summary: Siklus hidup Gateway di macOS (`launchd`)
title: Siklus hidup Gateway
x-i18n:
    generated_at: "2026-04-24T09:16:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Siklus hidup Gateway di macOS

Aplikasi macOS **mengelola Gateway melalui `launchd`** secara default dan tidak memunculkan
Gateway sebagai proses child. Aplikasi ini pertama-tama mencoba menempel ke
Gateway yang sudah berjalan pada port yang dikonfigurasi; jika tidak ada yang dapat dijangkau, aplikasi ini mengaktifkan layanan `launchd`
melalui CLI `openclaw` eksternal (tanpa runtime tersemat). Ini memberi Anda
auto-start yang andal saat login dan restart saat crash.

Mode child-process (Gateway dimunculkan langsung oleh aplikasi) **tidak digunakan** saat ini.
Jika Anda memerlukan coupling yang lebih ketat ke UI, jalankan Gateway secara manual di terminal.

## Perilaku default (`launchd`)

- Aplikasi memasang LaunchAgent per-pengguna berlabel `ai.openclaw.gateway`
  (atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` legacy didukung).
- Saat mode Local diaktifkan, aplikasi memastikan LaunchAgent dimuat dan
  memulai Gateway jika diperlukan.
- Log ditulis ke path log gateway `launchd` (terlihat di Debug Settings).

Perintah umum:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profile bernama.

## Build dev tanpa tanda tangan

`scripts/restart-mac.sh --no-sign` digunakan untuk build lokal cepat saat Anda tidak memiliki
kunci penandatanganan. Untuk mencegah `launchd` menunjuk ke biner relay yang tidak ditandatangani, perintah ini:

- Menulis `~/.openclaw/disable-launchagent`.

Run `scripts/restart-mac.sh` yang ditandatangani akan menghapus override ini jika penanda
tersebut ada. Untuk mereset secara manual:

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode attach-only

Untuk memaksa aplikasi macOS **tidak pernah memasang atau mengelola `launchd`**, jalankan aplikasi dengan
`--attach-only` (atau `--no-launchd`). Ini menyetel `~/.openclaw/disable-launchagent`,
sehingga aplikasi hanya menempel ke Gateway yang sudah berjalan. Anda dapat mengubah perilaku yang sama
di Debug Settings.

## Mode remote

Mode remote tidak pernah memulai Gateway lokal. Aplikasi menggunakan tunnel SSH ke
host remote dan terhubung melalui tunnel tersebut.

## Mengapa kami memilih `launchd`

- Auto-start saat login.
- Semantik restart/KeepAlive bawaan.
- Log dan supervisi yang dapat diprediksi.

Jika mode child-process sejati suatu saat diperlukan lagi, mode tersebut seharusnya didokumentasikan sebagai
mode dev-only terpisah yang eksplisit.

## Terkait

- [macOS app](/id/platforms/macos)
- [Gateway runbook](/id/gateway)

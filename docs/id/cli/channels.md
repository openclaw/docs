---
read_when:
    - Anda ingin menambah/menghapus akun kanal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status kanal atau mengikuti log kanal secara real time
summary: Referensi CLI untuk `openclaw channels` (akun, status, login/logout, log)
title: Kanal-Kanal
x-i18n:
    generated_at: "2026-04-24T09:01:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Kelola akun kanal obrolan dan status runtime-nya di Gateway.

Dokumentasi terkait:

- Panduan kanal: [Channels](/id/channels/index)
- Konfigurasi Gateway: [Configuration](/id/gateway/configuration)

## Perintah umum

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan
`probeAccount` per akun dan pemeriksaan `auditAccount` opsional, sehingga output dapat mencakup status
transport serta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` fallback ke ringkasan berbasis konfigurasi
alih-alih output probe live.

## Tambah / hapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tip: `openclaw channels add --help` menampilkan flag per kanal (token, private key, app token, path signal-cli, dll).

Permukaan add non-interaktif umum mencakup:

- kanal bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- field transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- field Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- field Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- field Nostr: `--private-key`, `--relay-urls`
- field Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi berbasis env akun default jika didukung

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- ID akun per kanal yang dipilih
- nama tampilan opsional untuk akun-akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard akan menanyakan agen mana yang harus memiliki setiap akun kanal yang dikonfigurasi dan menulis binding routing bercakupan akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agents](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke kanal yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw akan mempromosikan nilai tingkat atas bercakupan akun ke dalam peta akun kanal sebelum menulis akun baru. Sebagian besar kanal menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi kanal bawaan dapat mempertahankan akun hasil promosi yang sudah cocok. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke key akun bernama yang sudah ada, promosi akan mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding kanal-saja yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak otomatis membuat atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif secara opsional dapat menambahkan binding bercakupan akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama sudah ada dan nilai akun tunggal tingkat atas masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai bercakupan akun ke akun hasil promosi yang dipilih untuk kanal tersebut. Sebagian besar kanal dipromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada.

## Login / logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Catatan:

- `channels login` mendukung `--verbose`.
- `channels login` / `logout` dapat menyimpulkan kanal ketika hanya satu target login yang didukung yang dikonfigurasi.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe yang luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan scope `user:profile`. Gunakan `--no-usage`, atau berikan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` fallback ke ringkasan berbasis konfigurasi ketika gateway tidak dapat dijangkau. Jika kredensial kanal yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia dalam jalur perintah saat ini, perintah melaporkan akun tersebut sebagai dikonfigurasi dengan catatan terdegradasi alih-alih menampilkannya sebagai tidak dikonfigurasi.

## Probe kemampuan

Ambil petunjuk kemampuan provider (intent/scope jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; kosongkan untuk mencantumkan setiap kanal (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau ID kanal numerik mentah dan hanya berlaku untuk Discord.
- Probe bersifat spesifik per provider: intent Discord + izin kanal opsional; scope bot + pengguna Slack; flag bot + webhook Telegram; versi daemon Signal; app token + role/scope Graph Microsoft Teams (dianotasi jika diketahui). Kanal tanpa probe melaporkan `Probe: unavailable`.

## Selesaikan nama ke ID

Selesaikan nama kanal/pengguna ke ID menggunakan direktori provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi memprioritaskan kecocokan aktif saat beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat read-only. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia dalam jalur perintah saat ini, perintah mengembalikan hasil unresolved terdegradasi dengan catatan alih-alih membatalkan seluruh proses.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar kanal](/id/channels)

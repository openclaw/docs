---
read_when:
    - Anda ingin menambah/menghapus akun channel (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status channel atau mengikuti log channel
summary: Referensi CLI untuk `openclaw channels` (akun, status, login/logout, log)
title: channels
x-i18n:
    generated_at: "2026-04-05T13:45:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Kelola akun chat channel dan status runtime-nya di Gateway.

Dokumentasi terkait:

- Panduan channel: [Channels](/channels/index)
- Konfigurasi Gateway: [Configuration](/gateway/configuration)

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

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan
pemeriksaan `probeAccount` per akun dan pemeriksaan `auditAccount` opsional, sehingga output dapat mencakup
status transport ditambah hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` akan fallback ke ringkasan berbasis konfigurasi
alih-alih output probe live.

## Menambah / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tips: `openclaw channels add --help` menampilkan flag per channel (token, private key, app token, path signal-cli, dll.).

Surface penambahan non-interaktif umum meliputi:

- channel berbasis bot token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- field transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- field Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- field Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- field Nostr: `--private-key`, `--relay-urls`
- field Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi akun default berbasis env jika didukung

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- ID akun per channel yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard akan menanyakan agent mana yang harus memiliki setiap akun channel yang dikonfigurasi dan menulis binding routing dengan cakupan akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agents](/cli/agents)).

Saat Anda menambahkan akun non-default ke channel yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas dengan cakupan akun ke dalam peta akun channel tersebut sebelum menulis akun baru. Sebagian besar channel menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi channel bawaan dapat mempertahankan akun hasil promosi yang cocok yang sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, proses promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus channel yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak otomatis membuat atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding dengan cakupan akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama ada dan nilai akun tunggal tingkat atas masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai dengan cakupan akun ke akun hasil promosi yang dipilih untuk channel itu. Sebagian besar channel dipromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada.

## Login / logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Catatan:

- `channels login` mendukung `--verbose`.
- `channels login` / `logout` dapat menyimpulkan channel saat hanya satu target login yang didukung yang dikonfigurasi.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe yang luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan scope `user:profile`. Gunakan `--no-usage`, atau sediakan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` akan fallback ke ringkasan berbasis konfigurasi saat gateway tidak dapat dijangkau. Jika kredensial channel yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia dalam jalur perintah saat ini, perintah akan melaporkan akun tersebut sebagai configured dengan catatan degraded alih-alih menampilkannya sebagai tidak dikonfigurasi.

## Probe capabilities

Ambil petunjuk capability provider (intent/scope jika tersedia) ditambah dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap channel (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau ID channel numerik mentah dan hanya berlaku untuk Discord.
- Probe bersifat spesifik provider: intent Discord + izin channel opsional; scope bot + pengguna Slack; flag bot Telegram + webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/scope Graph (diberi anotasi jika diketahui). Channel tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama menjadi ID

Resolve nama channel/pengguna menjadi ID menggunakan direktori provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolve lebih mengutamakan kecocokan aktif saat beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat read-only. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia dalam jalur perintah saat ini, perintah mengembalikan hasil unresolved degraded dengan catatan alih-alih membatalkan seluruh proses.

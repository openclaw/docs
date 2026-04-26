---
read_when:
    - Anda ingin menambahkan/menghapus akun channel (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau mengikuti log saluran secara real time
summary: Referensi CLI untuk `openclaw channels` (akun, status, login/logout, log)
title: Saluran
x-i18n:
    generated_at: "2026-04-26T12:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Kelola akun saluran chat dan status runtime-nya di Gateway.

Dokumen terkait:

- Panduan saluran: [Saluran](/id/channels/index)
- Konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)

## Perintah umum

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / kapabilitas / resolve / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` per akun dan pemeriksaan opsional `auditAccount`, sehingga output dapat mencakup status transport beserta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` akan kembali ke ringkasan berbasis konfigurasi saja alih-alih output probe live.

## Tambahkan / hapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tip: `openclaw channels add --help` menampilkan flag per saluran (token, private key, app token, path signal-cli, dll).

Permukaan penambahan non-interaktif yang umum mencakup:

- saluran bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- field transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- field Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- field Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- field Nostr: `--private-key`, `--relay-urls`
- field Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi berbasis env akun default jika didukung

Jika sebuah Plugin saluran perlu dipasang selama perintah add berbasis flag, OpenClaw menggunakan sumber instalasi default saluran tersebut tanpa membuka prompt instalasi Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun per saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard akan menanyakan agen mana yang harus memiliki setiap akun saluran yang dikonfigurasi dan menulis binding routing berbasis cakupan akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agents](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas yang dicakup akun ke dalam peta akun saluran sebelum menulis akun baru. Sebagian besar saluran menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi saluran bawaan dapat mempertahankan akun terpromosikan yang sudah ada dan cocok sebagai gantinya. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak otomatis membuat atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berbasis cakupan akun.

Jika konfigurasi Anda sudah berada dalam keadaan campuran (akun bernama sudah ada dan nilai akun tunggal tingkat atas masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai berbasis cakupan akun ke akun terpromosikan yang dipilih untuk saluran tersebut. Sebagian besar saluran mempromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login / logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Catatan:

- `channels login` mendukung `--verbose`.
- `channels login` / `logout` dapat menyimpulkan salurannya ketika hanya satu target login yang didukung dikonfigurasi.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe yang luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan cakupan `user:profile`. Gunakan `--no-usage`, atau berikan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` kembali ke ringkasan berbasis konfigurasi saja saat gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, perintah melaporkan akun tersebut sebagai telah dikonfigurasi dengan catatan degradasi alih-alih menampilkannya sebagai belum dikonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intent/cakupan jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap saluran (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau id saluran numerik mentah dan hanya berlaku untuk Discord.
- Probe bersifat spesifik penyedia: intent Discord + izin saluran opsional; cakupan bot + pengguna Slack; flag bot Telegram + webhook; versi daemon Signal; app token Microsoft Teams + peran/cakupan Graph (dianotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama menjadi ID

Resolve nama saluran/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi mengutamakan kecocokan aktif ketika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat read-only. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia pada jalur perintah saat ini, perintah mengembalikan hasil unresolved yang terdegradasi dengan catatan alih-alih membatalkan seluruh proses.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

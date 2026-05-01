---
read_when:
    - Anda ingin menambahkan/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau memantau log saluran secara langsung
summary: Referensi CLI untuk `openclaw channels` (akun, status, masuk/keluar, log)
title: Saluran
x-i18n:
    generated_at: "2026-05-01T09:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Kelola akun saluran chat dan status runtime-nya di Gateway.

Dokumentasi terkait:

- Panduan saluran: [Saluran](/id/channels)
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

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` per akun dan `auditAccount` opsional, sehingga output dapat mencakup status transport plus hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`. Jika gateway tidak dapat dijangkau, `channels status` kembali ke ringkasan khusus konfigurasi alih-alih output probe live.

## Menambah / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per saluran (token, kunci privat, token app, jalur signal-cli, dll).
</Tip>

`channels remove` hanya beroperasi pada Plugin saluran yang terpasang/terkonfigurasi. Gunakan `channels add` terlebih dahulu untuk saluran katalog yang dapat dipasang.

Surface penambahan non-interaktif umum meliputi:

- saluran bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Field transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Field Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Field Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Field Nostr: `--private-key`, `--relay-urls`
- Field Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi akun default berbasis env jika didukung

Jika Plugin saluran perlu dipasang selama perintah penambahan berbasis flag, OpenClaw menggunakan sumber pemasangan default saluran tersebut tanpa membuka prompt pemasangan Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun per saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi ikat sekarang, wizard menanyakan agen mana yang harus memiliki setiap akun saluran yang terkonfigurasi dan menulis binding routing berbasis cakupan akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berbasis cakupan akun ke dalam peta akun saluran sebelum menulis akun baru. Sebagian besar saluran menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi saluran bawaan dapat mempertahankan akun yang dipromosikan yang cocok dan sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak membuat otomatis atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berbasis cakupan akun.

Jika konfigurasi Anda sudah dalam keadaan campuran (akun bernama ada dan nilai akun tunggal tingkat atas masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai berbasis cakupan akun ke akun yang dipromosikan yang dipilih untuk saluran tersebut. Sebagian besar saluran mempromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan saluran ketika hanya satu target login yang didukung dikonfigurasi.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen native saluran, seperti `whatsapp_login`, sebaiknya digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan scope `user:profile`. Gunakan `--no-usage`, atau sediakan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` kembali ke ringkasan khusus konfigurasi saat gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi alih-alih menampilkannya sebagai tidak terkonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intent/scope jika tersedia) plus dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap saluran (termasuk extension).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau id saluran numerik mentah dan hanya berlaku untuk Discord.
- Probe bersifat spesifik penyedia: intent Discord + izin saluran opsional; scope bot + pengguna Slack; flag bot Telegram + Webhook; versi daemon Signal; token app Microsoft Teams + peran/scope Graph (diberi anotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama ke ID

Resolve nama saluran/pengguna ke ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi lebih memilih kecocokan aktif ketika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya-baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil unresolved yang terdegradasi dengan catatan alih-alih membatalkan seluruh run.
- `channels resolve` tidak memasang Plugin saluran. Gunakan `channels add --channel <name>` sebelum me-resolve nama untuk saluran katalog yang dapat dipasang.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

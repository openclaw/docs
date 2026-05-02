---
read_when:
    - Anda ingin menambah/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau mengikuti log saluran
summary: Referensi CLI untuk `openclaw channels` (akun, status, masuk/keluar, log)
title: Saluran
x-i18n:
    generated_at: "2026-05-02T09:14:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Kelola akun kanal chat dan status runtime-nya di Gateway.

Dokumentasi terkait:

- Panduan kanal: [Kanal](/id/channels)
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

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` per akun dan pemeriksaan `auditAccount` opsional, sehingga keluaran dapat menyertakan status transport beserta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` beralih ke ringkasan berbasis konfigurasi saja, bukan keluaran probe live.

Jangan gunakan `openclaw sessions`, Gateway `sessions.list`, atau alat `sessions_list` agen sebagai sinyal kesehatan socket kanal. Permukaan tersebut melaporkan baris percakapan yang tersimpan, bukan status runtime penyedia. Setelah penyedia Discord dimulai ulang, akun yang terhubung tetapi sedang diam mungkin sehat meskipun tidak ada baris sesi Discord yang muncul sampai peristiwa percakapan masuk atau keluar berikutnya.

## Menambah / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per kanal (token, kunci privat, token aplikasi, jalur signal-cli, dll.).
</Tip>

`channels remove` hanya beroperasi pada Plugin kanal yang terpasang/terkonfigurasi. Gunakan `channels add` terlebih dahulu untuk kanal katalog yang dapat dipasang.
Untuk Plugin kanal berbasis runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga menonaktifkan atau menghapus akun tidak membiarkan listener lama tetap aktif sampai restart.

Permukaan penambahan noninteraktif yang umum meliputi:

- kanal bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- kolom transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- kolom Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- kolom Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- kolom Nostr: `--private-key`, `--relay-urls`
- kolom Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi berbasis env akun default jika didukung

Jika Plugin kanal perlu dipasang selama perintah tambah berbasis flag, OpenClaw menggunakan sumber pemasangan default kanal tanpa membuka prompt pemasangan Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun per kanal yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard akan menanyakan agen mana yang harus memiliki setiap akun kanal yang dikonfigurasi dan menulis binding perutean berbatas akun.

Anda juga dapat mengelola aturan perutean yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke kanal yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berbatas akun ke dalam peta akun kanal sebelum menulis akun baru. Sebagian besar kanal menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi kanal bawaan dapat mempertahankan akun promosi yang cocok yang sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku perutean tetap konsisten:

- Binding khusus kanal yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak membuat otomatis atau menulis ulang binding dalam mode noninteraktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berbatas akun.

Jika konfigurasi Anda sudah berada dalam keadaan campuran (akun bernama ada dan nilai tingkat atas akun tunggal masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai berbatas akun ke akun promosi yang dipilih untuk kanal tersebut. Sebagian besar kanal mempromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan kanal saat hanya satu target login yang didukung dikonfigurasi.
- `channels logout` mengutamakan jalur Gateway live jika dapat dijangkau, sehingga logout menghentikan listener aktif sebelum menghapus status autentikasi kanal. Jika Gateway lokal tidak dapat dijangkau, perintah ini beralih ke pembersihan autentikasi lokal.
- Jalankan `channels login` dari terminal di host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen native kanal, seperti `whatsapp_login`, sebaiknya digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan cakupan `user:profile`. Gunakan `--no-usage`, atau berikan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` beralih ke ringkasan berbasis konfigurasi saja saat gateway tidak dapat dijangkau. Jika kredensial kanal yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi alih-alih menampilkannya sebagai tidak terkonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intents/scopes jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk menampilkan setiap kanal (termasuk extensions).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau id kanal numerik mentah dan hanya berlaku untuk Discord.
- Probe bersifat spesifik penyedia: intent Discord + izin kanal opsional; cakupan bot + pengguna Slack; flag bot Telegram + Webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/cakupan Graph (dianotasi jika diketahui). Kanal tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama menjadi ID

Resolve nama kanal/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi mengutamakan kecocokan aktif saat beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat baca-saja. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil tidak terselesaikan yang terdegradasi dengan catatan alih-alih membatalkan seluruh run.
- `channels resolve` tidak memasang Plugin kanal. Gunakan `channels add --channel <name>` sebelum me-resolve nama untuk kanal katalog yang dapat dipasang.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar kanal](/id/channels)

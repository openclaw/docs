---
read_when:
    - Anda ingin menambahkan/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau mengikuti log saluran
summary: Referensi CLI untuk `openclaw channels` (akun, status, masuk/keluar, log)
title: Saluran
x-i18n:
    generated_at: "2026-05-10T19:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` hanya menampilkan kanal chat: akun yang dikonfigurasi secara default, dengan tag status `installed`, `configured`, dan `enabled` per akun. Berikan `--all` untuk juga menampilkan kanal bawaan yang belum memiliki akun terkonfigurasi dan kanal katalog yang dapat diinstal tetapi belum ada di disk. Penyedia autentikasi (OAuth + kunci API) dan snapshot penggunaan/kuota penyedia model tidak lagi dicetak di sini; gunakan `openclaw models auth list` untuk profil autentikasi penyedia dan `openclaw status` atau `openclaw models list` untuk penggunaan.

## Status / kapabilitas / resolve / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur live: pada Gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan
`probeAccount` per akun dan `auditAccount` opsional, sehingga output dapat menyertakan status
transport plus hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika Gateway tidak dapat dijangkau, `channels status` kembali ke ringkasan khusus konfigurasi
alih-alih output probe live.

Jangan gunakan `openclaw sessions`, Gateway `sessions.list`, atau alat agent
`sessions_list` sebagai sinyal kesehatan soket kanal. Permukaan tersebut melaporkan
baris percakapan tersimpan, bukan status runtime penyedia. Setelah penyedia Discord
dimulai ulang, akun yang tersambung tetapi senyap mungkin sehat walaupun tidak ada baris
sesi Discord yang muncul sampai event percakapan masuk atau keluar berikutnya.

## Menambah / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per kanal (token, kunci privat, token aplikasi, jalur signal-cli, dll).
</Tip>

`channels remove` hanya beroperasi pada plugin kanal yang diinstal/dikonfigurasi. Gunakan `channels add` terlebih dahulu untuk kanal katalog yang dapat diinstal.
Untuk plugin kanal yang didukung runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga menonaktifkan atau menghapus akun tidak membiarkan listener lama tetap aktif sampai restart.

Permukaan tambah non-interaktif umum mencakup:

- kanal bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- kolom transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- kolom Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- kolom Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- kolom Nostr: `--private-key`, `--relay-urls`
- kolom Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi berbasis env akun default jika didukung

Jika plugin kanal perlu diinstal selama perintah tambah berbasis flag, OpenClaw menggunakan sumber instal default kanal tersebut tanpa membuka prompt instal plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun per kanal yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Route these channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard menanyakan agent mana yang harus memiliki setiap akun kanal terkonfigurasi dan menulis binding routing berbasis akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agent](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke kanal yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berbasis akun ke peta akun kanal sebelum menulis akun baru. Sebagian besar kanal menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi kanal bawaan dapat mempertahankan akun terpromosi yang cocok yang sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus kanal yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak membuat otomatis atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berbasis akun.

Jika konfigurasi Anda sudah dalam status campuran (akun bernama ada dan nilai akun tunggal tingkat atas masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai berbasis akun ke akun terpromosi yang dipilih untuk kanal tersebut. Sebagian besar kanal dipromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan kanal saat hanya satu target login yang didukung dikonfigurasi.
- `channels logout` memprioritaskan jalur Gateway live saat dapat dijangkau, sehingga logout menghentikan listener aktif sebelum menghapus status autentikasi kanal. Jika Gateway lokal tidak dapat dijangkau, perintah ini kembali ke pembersihan autentikasi lokal.
- Jalankan `channels login` dari terminal pada host gateway. Agent `exec` memblokir alur login interaktif ini; alat login native kanal untuk agent, seperti `whatsapp_login`, harus digunakan dari chat saat tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` tidak lagi mencetak snapshot penggunaan/kuota penyedia model. Untuk itu, gunakan `openclaw status` (gambaran umum) atau `openclaw models list` (per penyedia).
- `openclaw channels status` kembali ke ringkasan khusus konfigurasi saat gateway tidak dapat dijangkau. Jika kredensial kanal yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi alih-alih menampilkannya sebagai tidak terkonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intents/scopes jika tersedia) plus dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap kanal (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau id kanal numerik mentah dan hanya berlaku untuk Discord. Untuk kanal suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang hilang.
- Probe bersifat spesifik penyedia: intents Discord + izin kanal opsional; scopes bot + pengguna Slack; flag bot Telegram + webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/scopes Graph (diberi anotasi jika diketahui). Kanal tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama ke ID

Resolve nama kanal/pengguna ke ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa tipe target.
- Resolusi memprioritaskan kecocokan aktif saat beberapa entri berbagi nama yang sama.
- `channels resolve` bersifat hanya-baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil tidak terselesaikan yang terdegradasi dengan catatan alih-alih membatalkan seluruh proses.
- `channels resolve` tidak menginstal plugin kanal. Gunakan `channels add --channel <name>` sebelum me-resolve nama untuk kanal katalog yang dapat diinstal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar kanal](/id/channels)

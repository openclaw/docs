---
read_when:
    - Anda ingin menambahkan/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau memantau log saluran
summary: Referensi CLI untuk `openclaw channels` (akun, status, masuk/keluar, log)
title: Saluran
x-i18n:
    generated_at: "2026-05-11T20:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Kelola akun saluran chat dan status runtime-nya di Gateway.

Dokumen terkait:

- Panduan saluran: [Saluran](/id/channels)
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

`channels list` hanya menampilkan saluran chat: akun yang dikonfigurasi secara default, dengan tag status `installed`, `configured`, dan `enabled` per akun. Berikan `--all` untuk juga menampilkan saluran bawaan yang belum memiliki akun terkonfigurasi dan saluran katalog yang dapat diinstal yang belum ada di disk. Penyedia auth (OAuth + kunci API) dan snapshot penggunaan/kuota penyedia model tidak lagi dicetak di sini; gunakan `openclaw models auth list` untuk profil auth penyedia dan `openclaw status` atau `openclaw models list` untuk penggunaan.

## Status / kapabilitas / resolve / log

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur live: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` per akun dan `auditAccount` opsional, sehingga output dapat menyertakan status transport plus hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`. Jika gateway tidak dapat dijangkau, `channels status` kembali ke ringkasan khusus konfigurasi alih-alih output probe live.

Jangan gunakan `openclaw sessions`, Gateway `sessions.list`, atau alat agen `sessions_list` sebagai sinyal kesehatan soket saluran. Permukaan tersebut melaporkan baris percakapan tersimpan, bukan status runtime penyedia. Setelah penyedia Discord dimulai ulang, akun yang terhubung tetapi diam mungkin sehat meskipun tidak ada baris sesi Discord yang muncul sampai peristiwa percakapan masuk atau keluar berikutnya.

## Menambah / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per saluran (token, kunci privat, token aplikasi, path signal-cli, dll).
</Tip>

`channels remove` hanya beroperasi pada plugin saluran yang terinstal/terkonfigurasi. Gunakan `channels add` terlebih dahulu untuk saluran katalog yang dapat diinstal.
Untuk plugin saluran yang didukung runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga menonaktifkan atau menghapus akun tidak membiarkan listener lama tetap aktif sampai mulai ulang.

Permukaan penambahan non-interaktif yang umum meliputi:

- saluran bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Kolom transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Kolom Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Kolom Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Kolom Nostr: `--private-key`, `--relay-urls`
- Kolom Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk auth akun default yang didukung env jika didukung

Jika plugin saluran perlu diinstal selama perintah penambahan berbasis flag, OpenClaw menggunakan sumber instal default saluran tersebut tanpa membuka prompt instal plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- ID akun per saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Route these channel accounts to agents now?`

Jika Anda mengonfirmasi pengikatan sekarang, wizard menanyakan agen mana yang harus memiliki setiap akun saluran terkonfigurasi dan menulis binding routing berskala akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berskala akun ke dalam peta akun saluran sebelum menulis akun baru. Sebagian besar saluran menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi saluran bawaan dapat mempertahankan akun promosi yang sudah ada dan cocok. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak membuat atau menulis ulang binding secara otomatis dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berskala akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama ada dan nilai akun tunggal tingkat atas masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai berskala akun ke akun promosi yang dipilih untuk saluran tersebut. Sebagian besar saluran dipromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan saluran saat hanya satu target login yang didukung dikonfigurasi.
- `channels logout` mengutamakan jalur Gateway live saat dapat dijangkau, sehingga logout menghentikan listener aktif apa pun sebelum membersihkan status auth saluran. Jika Gateway lokal tidak dapat dijangkau, perintah ini kembali ke pembersihan auth lokal.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen bawaan saluran, seperti `whatsapp_login`, harus digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` tidak lagi mencetak snapshot penggunaan/kuota penyedia model. Untuk itu, gunakan `openclaw status` (ringkasan) atau `openclaw models list` (per penyedia).
- `openclaw channels status` kembali ke ringkasan khusus konfigurasi saat gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi alih-alih menampilkannya sebagai tidak terkonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intent/scope jika tersedia) plus dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap saluran (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau ID saluran numerik mentah dan hanya berlaku untuk Discord. Untuk saluran suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang hilang.
- Probe bersifat spesifik penyedia: intent Discord + izin saluran opsional; bot Slack + scope pengguna; flag bot Telegram + webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/scope Graph (diberi anotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama ke ID

Resolve nama saluran/pengguna ke ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi mengutamakan kecocokan aktif saat beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil tidak terselesaikan yang terdegradasi dengan catatan alih-alih membatalkan seluruh proses.
- `channels resolve` tidak menginstal plugin saluran. Gunakan `channels add --channel <name>` sebelum me-resolve nama untuk saluran katalog yang dapat diinstal.

## Terkait

- [Referensi CLI](/id/cli)
- [Gambaran umum saluran](/id/channels)

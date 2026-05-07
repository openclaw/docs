---
read_when:
    - Anda ingin menambahkan/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status kanal atau memantau log kanal secara langsung
summary: Referensi CLI untuk `openclaw channels` (akun, status, masuk/keluar, log)
title: Saluran
x-i18n:
    generated_at: "2026-05-07T13:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
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

`channels list` hanya menampilkan saluran chat: akun yang dikonfigurasi secara default, dengan tag status `installed`, `configured`, dan `enabled` per akun. Berikan `--all` untuk juga menampilkan saluran bawaan yang belum memiliki akun terkonfigurasi dan saluran katalog yang dapat diinstal tetapi belum ada di disk. Penyedia auth (OAuth + kunci API) dan snapshot penggunaan/kuota penyedia model tidak lagi dicetak di sini; gunakan `openclaw models auth list` untuk profil auth penyedia dan `openclaw status` atau `openclaw models list` untuk penggunaan.

## Status / kapabilitas / resolve / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur live: pada Gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` per akun dan `auditAccount` opsional, sehingga output dapat menyertakan status transport beserta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`. Jika Gateway tidak dapat dijangkau, `channels status` akan kembali ke ringkasan berbasis konfigurasi saja, bukan output probe live.

Jangan gunakan `openclaw sessions`, Gateway `sessions.list`, atau alat agen `sessions_list` sebagai sinyal kesehatan soket saluran. Permukaan tersebut melaporkan baris percakapan tersimpan, bukan status runtime penyedia. Setelah penyedia Discord dimulai ulang, akun yang terhubung tetapi sepi dapat tetap sehat meskipun tidak ada baris sesi Discord yang muncul sampai peristiwa percakapan masuk atau keluar berikutnya.

## Tambah / hapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per saluran (token, kunci privat, token aplikasi, path signal-cli, dan sebagainya).
</Tip>

`channels remove` hanya beroperasi pada Plugin saluran yang sudah diinstal/dikonfigurasi. Gunakan `channels add` terlebih dahulu untuk saluran katalog yang dapat diinstal.
Untuk Plugin saluran yang didukung runtime, `channels remove` juga meminta Gateway yang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga menonaktifkan atau menghapus akun tidak meninggalkan listener lama tetap aktif sampai restart.

Permukaan penambahan noninteraktif yang umum mencakup:

- saluran bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- kolom transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- kolom Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- kolom Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- kolom Nostr: `--private-key`, `--relay-urls`
- kolom Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk auth berbasis env akun default jika didukung

Jika Plugin saluran perlu diinstal selama perintah tambah berbasis flag, OpenClaw menggunakan sumber instal default saluran tersebut tanpa membuka prompt instalasi Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun per saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi bind sekarang, wizard akan menanyakan agen mana yang harus memiliki setiap akun saluran terkonfigurasi dan menulis binding routing berbasis akun.

Anda juga dapat mengelola aturan routing yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berbasis akun ke dalam peta akun saluran sebelum menulis akun baru. Sebagian besar saluran menaruh nilai tersebut di `channels.<channel>.accounts.default`, tetapi saluran bawaan dapat mempertahankan akun promosi yang cocok yang sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` menunjuk ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku routing tetap konsisten:

- Binding khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak otomatis membuat atau menulis ulang binding dalam mode noninteraktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berbasis akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama ada dan nilai akun tunggal tingkat atas masih disetel), jalankan `openclaw doctor --fix` untuk memindahkan nilai berbasis akun ke akun promosi yang dipilih untuk saluran tersebut. Sebagian besar saluran mempromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan saluran ketika hanya satu target login yang didukung dikonfigurasi.
- `channels logout` mengutamakan jalur Gateway live ketika dapat dijangkau, sehingga logout menghentikan listener aktif sebelum menghapus status auth saluran. Jika Gateway lokal tidak dapat dijangkau, perintah ini kembali ke pembersihan auth lokal.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen native saluran, seperti `whatsapp_login`, sebaiknya digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` tidak lagi mencetak snapshot penggunaan/kuota penyedia model. Untuk itu, gunakan `openclaw status` (ikhtisar) atau `openclaw models list` (per penyedia).
- `openclaw channels status` kembali ke ringkasan berbasis konfigurasi saja ketika Gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi, bukan menampilkannya sebagai tidak terkonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intent/scope jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap saluran (termasuk ekstensi).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau id saluran numerik mentah dan hanya berlaku untuk Discord. Untuk saluran suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang hilang.
- Probe bersifat spesifik penyedia: intent Discord + izin saluran opsional; bot Slack + scope pengguna; flag bot Telegram + Webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/scope Graph (dianotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Resolve nama ke ID

Resolve nama saluran/pengguna ke ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa tipe target.
- Resolusi mengutamakan kecocokan aktif ketika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil unresolved terdegradasi dengan catatan, bukan membatalkan seluruh run.
- `channels resolve` tidak menginstal Plugin saluran. Gunakan `channels add --channel <name>` sebelum me-resolve nama untuk saluran katalog yang dapat diinstal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

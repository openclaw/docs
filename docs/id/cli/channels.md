---
read_when:
    - Anda ingin menambahkan atau menghapus akun saluran (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp, dan lainnya)
    - Anda ingin memeriksa status saluran atau memantau log saluran secara langsung
    - Anda perlu memeriksa atau mengirim ulang peristiwa saluran masuk yang gagal
summary: Referensi CLI untuk `openclaw channels` (akun, status, surat gagal, kapabilitas, resolusi, log, masuk/keluar)
title: Saluran
x-i18n:
    generated_at: "2026-07-22T01:44:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 858f1f65de9b26dba3be712789141bc42cd0908c3a9284e40c3273c6972a0c65
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` hanya menampilkan saluran chat: akun yang dikonfigurasi secara default, dengan tag status `installed`, `configured`, dan `enabled` per akun (`--json` untuk keluaran mesin). Berikan `--all` untuk turut menampilkan saluran bawaan yang belum memiliki akun terkonfigurasi dan saluran katalog yang dapat diinstal tetapi belum tersedia di disk. Autentikasi penyedia dan penggunaan model berada di tempat lain: `openclaw models auth list` untuk profil autentikasi penyedia, `openclaw status` atau `openclaw models list` untuk penggunaan/kuota.

## Status / kapabilitas / penyelesaian / log

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (default `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (memerlukan `--channel`), `--target <dest>` (memerlukan `--channel`), `--timeout <ms>` (default `10000`, dibatasi hingga `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (default `auto`), `--json`
- `channels logs`: `--channel <name|all>` (default `all`), `--lines <n>` (default `200`), `--json`

`channels status --probe` adalah jalur langsung: pada gateway yang dapat dijangkau, jalur ini menjalankan pemeriksaan
`probeAccount` per akun dan pemeriksaan opsional `auditAccount`, sehingga keluaran dapat mencakup status
transportasi beserta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` beralih ke ringkasan berbasis konfigurasi saja
alih-alih keluaran probe langsung.

## Dead letter masuk

Peristiwa masuk yang telah menghabiskan kebijakan percobaan ulangnya tetap berada di basis data status bersama selama periode retensi entri gagal yang sudah berlaku pada antrean. Periksa satu akun saluran dengan:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

Tampilan teks menunjukkan ID peristiwa, alasan kegagalan, jumlah percobaan, dan usia kegagalan. Keluaran JSON juga menyertakan payload yang dipertahankan, metadata, lajur, dan stempel waktu percobaan untuk diagnostik.

Setelah memperbaiki masalah yang mendasarinya, masukkan kembali satu peristiwa ke antrean menggunakan ID peristiwa aslinya:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Jalankan perintah ini pada host Gateway agar perintah mengakses basis data status bersama yang sama dengan runtime saluran. Pengiriman ulang mempertahankan payload, metadata, dan lajur, tetapi mengatur ulang penghitung percobaan dan usia antrean. Pengiriman ulang secara atomik menggantikan penanda gagal peristiwa tersebut, sehingga mengulangi perintah saat peristiwa tertunda atau telah diklaim akan ditolak alih-alih membuat pengiriman kedua. Saluran yang sedang berjalan mengambilnya pada pengurasan masuk berikutnya. Peristiwa yang selesai tetap bersifat terminal dan tidak dapat dikirim ulang. Baris gagal yang dibuat sebelum retensi payload ditambahkan masih dapat muncul dalam daftar, tetapi pengiriman ulang akan menolaknya karena payload-nya tidak tersedia.

`openclaw health` melaporkan jumlah dead letter dan usia kegagalan tertua per akun saluran. `openclaw doctor` menyebutkan akun yang terdampak dan mengarahkan kembali ke perintah pemeriksaan.

Jangan gunakan `openclaw sessions`, `sessions.list` Gateway, atau alat agen
`sessions_list` sebagai sinyal kesehatan soket saluran. Permukaan tersebut melaporkan
baris percakapan tersimpan, bukan status runtime penyedia. Setelah penyedia Discord
dimulai ulang, akun yang terhubung tetapi tidak aktif mungkin sehat meskipun tidak ada baris sesi
Discord yang muncul hingga peristiwa percakapan masuk atau keluar berikutnya.

## Menambahkan / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per saluran (token, kunci privat, token aplikasi, jalur signal-cli, dan sebagainya).
</Tip>

`channels remove` hanya beroperasi pada plugin saluran yang terinstal/dikonfigurasi. Gunakan `channels add` terlebih dahulu untuk saluran katalog yang dapat diinstal. Tanpa `--delete`, perintah akan meminta konfirmasi untuk menonaktifkan akun dan mempertahankan konfigurasinya; `--delete` menghapus entri konfigurasi tanpa meminta konfirmasi.
Untuk plugin saluran berbasis runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga menonaktifkan atau menghapus akun tidak membiarkan listener lama tetap aktif hingga dimulai ulang.

Flag penambahan noninteraktif milik inti adalah `--account <id>`, `--name <name>`, `--token`, `--token-file`, dan `--use-env` (autentikasi berbasis variabel lingkungan, hanya akun default, jika didukung). Plugin saluran menyediakan flag penyiapannya sendiri, termasuk `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--workspace`, `--http-url`, dan `--auth-dir`. Flag khusus saluran mencakup:

| Saluran     | Flag                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Jika plugin saluran perlu diinstal selama perintah penambahan berbasis flag, OpenClaw menggunakan sumber instalasi default saluran tanpa membuka prompt instalasi plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa akun langsung, kredensial, atau flag konfigurasi saluran, wisaya interaktif dapat menampilkan prompt. ID saluran posisional dan `--channel <id>` sama-sama memilih saluran tersebut terlebih dahulu tanpa melewati panduan:

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

Wisaya dapat meminta:

- ID akun per saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Route these channel accounts to agents now?`

Jika Anda mengonfirmasi pengikatan sekarang, wisaya menanyakan agen mana yang harus memiliki setiap akun saluran terkonfigurasi dan menulis pengikatan perutean dengan cakupan akun.

Anda juga dapat mengelola aturan perutean yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas tersebut ke dalam peta akun saluran sebelum menulis akun baru. Promosi menggunakan kembali akun bernama yang ada jika saluran memiliki tepat satu akun, atau jika `defaultAccount` menunjuk ke salah satunya; jika tidak, nilai tersebut ditempatkan di `channels.<channel>.accounts.default`.

Perilaku perutean tetap konsisten:

- Pengikatan khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak secara otomatis membuat atau menulis ulang pengikatan dalam mode noninteraktif.
- Penyiapan interaktif dapat secara opsional menambahkan pengikatan dengan cakupan akun.

Jika konfigurasi Anda sudah berada dalam keadaan campuran (akun bernama tersedia dan nilai akun tunggal tingkat atas masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai dengan cakupan akun ke akun yang dipromosikan dan dipilih untuk saluran tersebut.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--account <id>` dan `--verbose`; `channels logout` mendukung `--account <id>`.
- `channels login` dan `logout` dapat menyimpulkan saluran jika hanya ada satu saluran terkonfigurasi yang mendukung tindakan tersebut; jika ada beberapa, berikan `--channel`.
- `channels logout` mengutamakan jalur Gateway langsung jika dapat dijangkau, sehingga logout menghentikan listener aktif sebelum menghapus status autentikasi saluran. Jika Gateway lokal tidak dapat dijangkau, perintah beralih ke pembersihan autentikasi lokal; dengan `gateway.mode: "remote"`, galat gateway akan menggagalkan perintah.
- Setelah login berhasil, CLI meminta Gateway lokal yang dapat dijangkau untuk memulai akun; dalam mode jarak jauh, CLI menyimpan autentikasi secara lokal dan mencatat bahwa runtime jarak jauh tidak dimulai ulang.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen bawaan saluran, seperti `whatsapp_login`, harus digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe menyeluruh.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels status` beralih ke ringkasan berbasis konfigurasi saja jika gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah melaporkan akun tersebut sebagai terkonfigurasi dengan catatan penurunan fungsi alih-alih menampilkannya sebagai belum dikonfigurasi.

## Probe kapabilitas

Ambil petunjuk kapabilitas penyedia (intent/cakupan jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; hilangkan untuk mencantumkan setiap saluran (termasuk saluran yang disediakan plugin).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau ID saluran numerik mentah dan hanya berlaku untuk Discord. Untuk saluran suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang tidak tersedia.
- Probe bersifat khusus penyedia: identitas bot + intent Discord beserta izin saluran opsional; cakupan bot + pengguna Slack; flag bot + webhook Telegram; versi daemon Signal; token aplikasi + peran/cakupan Graph Microsoft Teams (diberi anotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Menyelesaikan nama menjadi ID

Selesaikan nama saluran/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksakan tipe target.
- Resolusi memprioritaskan kecocokan aktif ketika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya-baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah akan mengembalikan hasil belum terselesaikan yang terdegradasi beserta catatan, alih-alih membatalkan seluruh proses.
- `channels resolve` tidak menginstal Plugin saluran. Gunakan `channels add --channel <name>` sebelum menyelesaikan nama untuk saluran katalog yang dapat diinstal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

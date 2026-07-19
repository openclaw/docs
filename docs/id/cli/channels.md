---
read_when:
    - Anda ingin menambahkan atau menghapus akun channel (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp, dan lainnya)
    - Anda ingin memeriksa status saluran atau mengikuti log saluran secara langsung
    - Anda perlu memeriksa atau mengirim ulang peristiwa saluran masuk yang gagal
summary: Referensi CLI untuk `openclaw channels` (akun, status, surat gagal, kapabilitas, resolusi, log, masuk/keluar)
title: Kanal
x-i18n:
    generated_at: "2026-07-19T05:00:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d276a1696aa9308867e5ec447788ffb3f2b8750c4d9744b2e68578b940558e8
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
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` hanya menampilkan kanal chat: akun yang dikonfigurasi secara default, dengan tag status `installed`, `configured`, dan `enabled` per akun (`--json` untuk keluaran mesin). Berikan `--all` untuk turut menampilkan kanal bawaan yang belum memiliki akun terkonfigurasi dan kanal katalog yang dapat diinstal tetapi belum tersedia di disk. Autentikasi penyedia dan penggunaan model berada di tempat lain: `openclaw models auth list` untuk profil autentikasi penyedia, `openclaw status` atau `openclaw models list` untuk penggunaan/kuota.

## Status / kemampuan / resolusi / log

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (default `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (memerlukan `--channel`), `--target <dest>` (memerlukan `--channel`), `--timeout <ms>` (default `10000`, dibatasi hingga `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (default `auto`), `--json`
- `channels logs`: `--channel <name|all>` (default `all`), `--lines <n>` (default `200`), `--json`

`channels status --probe` adalah jalur langsung: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan
`probeAccount` dan pemeriksaan opsional `auditAccount` untuk setiap akun, sehingga keluaran dapat mencakup status
transportasi serta hasil pemeriksaan seperti `works`, `probe failed`, `audit ok`, atau `audit failed`.
Jika gateway tidak dapat dijangkau, `channels status` beralih ke ringkasan khusus konfigurasi,
bukan keluaran pemeriksaan langsung.

## Dead letter masuk

Peristiwa masuk yang telah menghabiskan kebijakan percobaannya tetap berada dalam basis data status bersama selama periode retensi entri gagal yang berlaku pada antrean. Periksa satu akun kanal dengan:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

Tampilan teks menunjukkan ID peristiwa, alasan kegagalan, jumlah percobaan, dan usia kegagalan. Keluaran JSON juga mencakup payload yang dipertahankan, metadata, lajur, dan stempel waktu percobaan untuk diagnostik.

Setelah memperbaiki masalah yang mendasarinya, antrekan ulang satu peristiwa dengan ID peristiwa aslinya:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Jalankan perintah ini pada host Gateway agar perintah tersebut mengakses basis data status bersama yang sama dengan runtime kanal. Pengiriman ulang mempertahankan payload, metadata, dan lajur, tetapi mengatur ulang penghitung percobaan serta usia antrean. Tindakan ini secara atomik mengganti penanda gagal peristiwa tersebut, sehingga pengulangan perintah saat peristiwa masih tertunda atau telah diklaim akan ditolak, alih-alih membuat pengiriman kedua. Kanal yang sedang berjalan akan mengambilnya pada pengurasan ingress berikutnya. Peristiwa yang telah selesai tetap bersifat terminal dan tidak dapat dikirim ulang. Baris gagal yang dibuat sebelum retensi payload ditambahkan masih dapat muncul dalam daftar, tetapi pengiriman ulang akan ditolak karena payload-nya tidak tersedia.

`openclaw health` melaporkan jumlah dead letter dan usia kegagalan tertua per akun kanal. `openclaw doctor` menyebutkan akun yang terdampak dan merujuk kembali ke perintah pemeriksaan.

Jangan gunakan `openclaw sessions`, `sessions.list` Gateway, atau alat
`sessions_list` agen sebagai sinyal kesehatan soket kanal. Permukaan tersebut melaporkan
baris percakapan yang tersimpan, bukan status runtime penyedia. Setelah penyedia Discord
dimulai ulang, akun yang terhubung tetapi tidak aktif mungkin tetap sehat meskipun tidak ada baris sesi Discord
yang muncul hingga peristiwa percakapan masuk atau keluar berikutnya.

## Menambahkan / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per kanal (token, kunci privat, token aplikasi, jalur signal-cli, dan sebagainya).
</Tip>

`channels remove` hanya beroperasi pada plugin kanal yang telah diinstal/dikonfigurasi. Gunakan `channels add` terlebih dahulu untuk kanal katalog yang dapat diinstal. Tanpa `--delete`, perintah ini meminta konfirmasi untuk menonaktifkan akun dan mempertahankan konfigurasinya; `--delete` menghapus entri konfigurasi tanpa meminta konfirmasi.
Untuk plugin kanal yang didukung runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga penonaktifan atau penghapusan akun tidak membiarkan listener lama tetap aktif hingga dimulai ulang.

Flag penambahan noninteraktif yang digunakan bersama di seluruh kanal: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir`, dan `--use-env` (autentikasi berbasis lingkungan, hanya akun default, jika didukung). Flag khusus kanal mencakup:

| Kanal       | Flag                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Jika plugin kanal perlu diinstal selama perintah penambahan berbasis flag, OpenClaw menggunakan sumber instalasi default kanal tanpa membuka permintaan instalasi plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wisaya interaktif dapat meminta:

- ID akun per kanal yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Route these channel accounts to agents now?`

Jika Anda mengonfirmasi pengikatan sekarang, wisaya akan menanyakan agen mana yang harus memiliki setiap akun kanal terkonfigurasi dan menulis pengikatan perutean dalam cakupan akun.

Anda juga dapat mengelola aturan perutean yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke kanal yang masih menggunakan pengaturan tingkat atas untuk satu akun, OpenClaw mempromosikan nilai tingkat atas tersebut ke dalam peta akun kanal sebelum menulis akun baru. Promosi menggunakan kembali akun bernama yang sudah ada ketika kanal hanya memiliki satu akun, atau ketika `defaultAccount` menunjuk ke satu akun; jika tidak, nilai tersebut ditempatkan di `channels.<channel>.accounts.default`.

Perilaku perutean tetap konsisten:

- Pengikatan khusus kanal yang sudah ada (tanpa `accountId`) tetap cocok dengan akun default.
- `channels add` tidak membuat atau menulis ulang pengikatan secara otomatis dalam mode noninteraktif.
- Penyiapan interaktif dapat secara opsional menambahkan pengikatan dalam cakupan akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama tersedia dan nilai tingkat atas untuk satu akun masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai dalam cakupan akun ke akun hasil promosi yang dipilih untuk kanal tersebut.

## Masuk dan keluar (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--account <id>` dan `--verbose`; `channels logout` mendukung `--account <id>`.
- `channels login` dan `logout` dapat menyimpulkan kanal jika hanya satu kanal terkonfigurasi yang mendukung tindakan tersebut; jika ada beberapa, berikan `--channel`.
- `channels logout` mengutamakan jalur Gateway langsung ketika dapat dijangkau, sehingga keluar akan menghentikan listener aktif sebelum menghapus status autentikasi kanal. Jika Gateway lokal tidak dapat dijangkau, perintah ini beralih ke pembersihan autentikasi lokal; dengan `gateway.mode: "remote"`, galat gateway akan menggagalkan perintah.
- Setelah berhasil masuk, CLI meminta Gateway lokal yang dapat dijangkau untuk memulai akun; dalam mode jarak jauh, CLI menyimpan autentikasi secara lokal dan mencatat bahwa runtime jarak jauh tidak dimulai ulang.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur masuk interaktif ini; alat masuk agen bawaan kanal, seperti `whatsapp_login`, harus digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk pemeriksaan luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels status` beralih ke ringkasan khusus konfigurasi ketika gateway tidak dapat dijangkau. Jika kredensial kanal yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai terkonfigurasi dengan catatan penurunan fungsi, bukan menampilkannya sebagai tidak terkonfigurasi.

## Pemeriksaan kemampuan

Ambil petunjuk kemampuan penyedia (intent/cakupan jika tersedia) serta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; abaikan untuk mencantumkan setiap kanal (termasuk kanal yang disediakan plugin).
- `--account` hanya valid dengan `--channel`.
- `--target` menerima `channel:<id>` atau ID kanal numerik mentah dan hanya berlaku untuk Discord. Untuk kanal suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang tidak tersedia.
- Pemeriksaan bersifat khusus penyedia: identitas bot Discord + intent serta izin kanal opsional; cakupan bot + pengguna Slack; flag bot Telegram + webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/cakupan Graph (diberi anotasi jika diketahui). Kanal tanpa pemeriksaan melaporkan `Probe: unavailable`.

## Mengubah nama menjadi ID

Ubah nama kanal/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksakan jenis target.
- Resolusi mengutamakan kecocokan aktif ketika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya-baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia pada jalur perintah saat ini, perintah mengembalikan hasil yang tidak terselesaikan dengan penurunan fungsi beserta catatan, alih-alih membatalkan seluruh proses.
- `channels resolve` tidak menginstal plugin kanal. Gunakan `channels add --channel <name>` sebelum mengubah nama menjadi ID untuk kanal katalog yang dapat diinstal.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

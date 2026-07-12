---
read_when:
    - Anda ingin menambahkan atau menghapus akun saluran (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp, dan lainnya)
    - Anda ingin memeriksa status kanal atau memantau log kanal secara langsung
summary: Referensi CLI untuk `openclaw channels` (akun, status, kemampuan, resolusi, log, masuk/keluar)
title: Kanal
x-i18n:
    generated_at: "2026-07-12T14:03:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Kelola akun saluran obrolan dan status runtime-nya di Gateway.

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
```

`channels list` hanya menampilkan saluran obrolan: secara bawaan, akun yang telah dikonfigurasi, dengan tag status `installed`, `configured`, dan `enabled` untuk setiap akun (`--json` untuk keluaran mesin). Gunakan `--all` untuk turut menampilkan saluran bawaan yang belum memiliki akun terkonfigurasi dan saluran katalog yang dapat dipasang tetapi belum tersedia di disk. Autentikasi penyedia dan penggunaan model dikelola di tempat lain: `openclaw models auth list` untuk profil autentikasi penyedia, serta `openclaw status` atau `openclaw models list` untuk penggunaan/kuota.

## Status / kapabilitas / penyelesaian / log

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (bawaan `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (memerlukan `--channel`), `--target <dest>` (memerlukan `--channel`), `--timeout <ms>` (bawaan `10000`, dibatasi maksimum `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (bawaan `auto`), `--json`
- `channels logs`: `--channel <name|all>` (bawaan `all`), `--lines <n>` (bawaan `200`), `--json`

`channels status --probe` adalah jalur langsung: pada Gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` dan, bila tersedia, `auditAccount` untuk setiap akun, sehingga keluaran dapat mencakup status transportasi beserta hasil pemeriksaan seperti `works`, `probe failed`, `audit ok`, atau `audit failed`. Jika Gateway tidak dapat dijangkau, `channels status` menggunakan ringkasan berbasis konfigurasi saja sebagai pengganti keluaran pemeriksaan langsung.

Jangan gunakan `openclaw sessions`, `sessions.list` milik Gateway, atau alat `sessions_list` milik agen sebagai sinyal kesehatan soket saluran. Permukaan tersebut melaporkan baris percakapan yang tersimpan, bukan status runtime penyedia. Setelah penyedia Discord dimulai ulang, akun yang terhubung tetapi sedang tidak aktif mungkin tetap sehat meskipun tidak ada baris sesi Discord yang muncul hingga peristiwa percakapan masuk atau keluar berikutnya.

## Menambahkan / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag khusus setiap saluran (token, kunci privat, token aplikasi, jalur signal-cli, dan sebagainya).
</Tip>

`channels remove` hanya beroperasi pada Plugin saluran yang telah dipasang/dikonfigurasi. Gunakan `channels add` terlebih dahulu untuk saluran katalog yang dapat dipasang. Tanpa `--delete`, perintah ini meminta konfirmasi untuk menonaktifkan akun dan mempertahankan konfigurasinya; `--delete` menghapus entri konfigurasi tanpa meminta konfirmasi.
Untuk Plugin saluran yang didukung runtime, `channels remove` juga meminta Gateway yang sedang berjalan untuk menghentikan akun yang dipilih sebelum memperbarui konfigurasi, sehingga penonaktifan atau penghapusan akun tidak membiarkan listener lama tetap aktif hingga dimulai ulang.

Flag penambahan noninteraktif yang digunakan bersama oleh semua saluran: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir`, dan `--use-env` (autentikasi berbasis variabel lingkungan, hanya untuk akun bawaan, jika didukung). Flag khusus saluran meliputi:

| Saluran     | Flag                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Jika Plugin saluran perlu dipasang selama perintah penambahan berbasis flag, OpenClaw menggunakan sumber pemasangan bawaan saluran tanpa membuka permintaan pemasangan Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wisaya interaktif dapat meminta:

- ID akun untuk setiap saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Route these channel accounts to agents now?`

Jika Anda mengonfirmasi pengikatan saat itu juga, wisaya akan menanyakan agen yang harus memiliki setiap akun saluran terkonfigurasi dan menulis pengikatan perutean dengan cakupan akun.

Anda juga dapat mengelola aturan perutean yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun nonbawaan ke saluran yang masih menggunakan pengaturan tingkat atas untuk satu akun, OpenClaw memindahkan nilai tingkat atas tersebut ke peta akun saluran sebelum menulis akun baru. Proses ini menggunakan kembali akun bernama yang sudah ada jika saluran hanya memiliki tepat satu akun, atau jika `defaultAccount` menunjuk ke salah satunya; jika tidak, nilai tersebut ditempatkan di `channels.<channel>.accounts.default`.

Perilaku perutean tetap konsisten:

- Pengikatan khusus saluran yang sudah ada (tanpa `accountId`) tetap cocok dengan akun bawaan.
- `channels add` tidak secara otomatis membuat atau menulis ulang pengikatan dalam mode noninteraktif.
- Penyiapan interaktif dapat secara opsional menambahkan pengikatan dengan cakupan akun.

Jika konfigurasi Anda sudah berada dalam keadaan campuran (akun bernama tersedia sementara nilai tingkat atas untuk satu akun masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai dengan cakupan akun ke akun hasil pemindahan yang dipilih untuk saluran tersebut.

## Masuk dan keluar (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--account <id>` dan `--verbose`; `channels logout` mendukung `--account <id>`.
- `channels login` dan `logout` dapat menyimpulkan saluran jika hanya satu saluran terkonfigurasi yang mendukung tindakan tersebut; jika ada beberapa, gunakan `--channel`.
- `channels logout` mengutamakan jalur Gateway langsung jika dapat dijangkau, sehingga proses keluar menghentikan listener aktif sebelum menghapus status autentikasi saluran. Jika Gateway lokal tidak dapat dijangkau, perintah ini beralih ke pembersihan autentikasi lokal; dengan `gateway.mode: "remote"`, galat Gateway akan menggagalkan perintah.
- Setelah berhasil masuk, CLI meminta Gateway lokal yang dapat dijangkau untuk memulai akun; dalam mode jarak jauh, CLI menyimpan autentikasi secara lokal dan memberi tahu bahwa runtime jarak jauh tidak dimulai ulang.
- Jalankan `channels login` dari terminal pada hos Gateway. `exec` milik agen memblokir alur masuk interaktif ini; alat masuk agen bawaan saluran, seperti `whatsapp_login`, harus digunakan dari obrolan jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk pemeriksaan menyeluruh.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels status` beralih ke ringkasan berbasis konfigurasi saja jika Gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah ini melaporkan akun tersebut sebagai telah dikonfigurasi dengan catatan penurunan fungsi, alih-alih menampilkannya sebagai belum dikonfigurasi.

## Pemeriksaan kapabilitas

Ambil petunjuk kapabilitas penyedia (intensi/cakupan jika tersedia) beserta dukungan fitur statis:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Catatan:

- `--channel` bersifat opsional; abaikan untuk mencantumkan setiap saluran (termasuk saluran yang disediakan Plugin).
- `--account` hanya valid jika digunakan bersama `--channel`.
- `--target` menerima `channel:<id>` atau ID saluran numerik mentah dan hanya berlaku untuk Discord. Untuk saluran suara Discord, pemeriksaan izin menandai `ViewChannel`, `Connect`, `Speak`, `SendMessages`, dan `ReadMessageHistory` yang tidak tersedia.
- Pemeriksaan bersifat khusus penyedia: identitas bot + intensi Discord beserta izin saluran opsional; cakupan bot + pengguna Slack; flag bot + Webhook Telegram; versi daemon Signal; token aplikasi Microsoft Teams + peran/cakupan Graph (diberi anotasi jika diketahui). Saluran tanpa pemeriksaan melaporkan `Probe: unavailable`.

## Menyelesaikan nama menjadi ID

Selesaikan nama saluran/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksakan jenis target.
- Penyelesaian mengutamakan kecocokan aktif jika beberapa entri memiliki nama yang sama.
- `channels resolve` bersifat hanya-baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah akan mengembalikan hasil yang tidak terselesaikan dengan fungsi terbatas beserta catatan, alih-alih membatalkan seluruh proses.
- `channels resolve` tidak memasang Plugin saluran. Gunakan `channels add --channel <name>` sebelum menyelesaikan nama untuk saluran katalog yang dapat dipasang.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

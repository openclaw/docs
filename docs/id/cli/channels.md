---
read_when:
    - Anda ingin menambahkan/menghapus akun saluran (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Anda ingin memeriksa status saluran atau mengikuti log saluran
summary: Referensi CLI untuk `openclaw channels` (accounts, status, login/logout, logs)
title: Saluran
x-i18n:
    generated_at: "2026-04-30T09:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
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

## Status / kapabilitas / resolusi / log

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (hanya dengan `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` adalah jalur langsung: pada gateway yang dapat dijangkau, perintah ini menjalankan pemeriksaan `probeAccount` dan `auditAccount` opsional per akun, sehingga output dapat menyertakan status transport beserta hasil probe seperti `works`, `probe failed`, `audit ok`, atau `audit failed`. Jika gateway tidak dapat dijangkau, `channels status` beralih ke ringkasan khusus konfigurasi, bukan output probe langsung.

## Menambahkan / menghapus akun

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` menampilkan flag per saluran (token, kunci privat, token aplikasi, jalur signal-cli, dan sebagainya).
</Tip>

Permukaan penambahan non-interaktif umum mencakup:

- saluran bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Kolom transport Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Kolom Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Kolom Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Kolom Nostr: `--private-key`, `--relay-urls`
- Kolom Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` untuk autentikasi akun default berbasis env jika didukung

Jika Plugin saluran perlu diinstal selama perintah penambahan yang digerakkan oleh flag, OpenClaw menggunakan sumber instalasi default saluran tanpa membuka prompt instalasi Plugin interaktif.

Saat Anda menjalankan `openclaw channels add` tanpa flag, wizard interaktif dapat meminta:

- id akun untuk setiap saluran yang dipilih
- nama tampilan opsional untuk akun tersebut
- `Bind configured channel accounts to agents now?`

Jika Anda mengonfirmasi ikat sekarang, wizard menanyakan agen mana yang harus memiliki setiap akun saluran yang dikonfigurasi dan menulis binding perutean berlingkup akun.

Anda juga dapat mengelola aturan perutean yang sama nanti dengan `openclaw agents bindings`, `openclaw agents bind`, dan `openclaw agents unbind` (lihat [agen](/id/cli/agents)).

Saat Anda menambahkan akun non-default ke saluran yang masih menggunakan pengaturan tingkat atas akun tunggal, OpenClaw mempromosikan nilai tingkat atas berlingkup akun ke dalam peta akun saluran sebelum menulis akun baru. Sebagian besar saluran menempatkan nilai tersebut di `channels.<channel>.accounts.default`, tetapi saluran bawaan dapat mempertahankan akun promosi yang cocok yang sudah ada. Matrix adalah contoh saat ini: jika satu akun bernama sudah ada, atau `defaultAccount` mengarah ke akun bernama yang sudah ada, promosi mempertahankan akun tersebut alih-alih membuat `accounts.default` baru.

Perilaku perutean tetap konsisten:

- Binding khusus saluran yang sudah ada (tanpa `accountId`) terus cocok dengan akun default.
- `channels add` tidak membuat otomatis atau menulis ulang binding dalam mode non-interaktif.
- Penyiapan interaktif dapat secara opsional menambahkan binding berlingkup akun.

Jika konfigurasi Anda sudah berada dalam status campuran (akun bernama ada dan nilai tingkat atas akun tunggal masih ditetapkan), jalankan `openclaw doctor --fix` untuk memindahkan nilai berlingkup akun ke akun promosi yang dipilih untuk saluran tersebut. Sebagian besar saluran mempromosikan ke `accounts.default`; Matrix dapat mempertahankan target bernama/default yang sudah ada sebagai gantinya.

## Login dan logout (interaktif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` mendukung `--verbose`.
- `channels login` dan `logout` dapat menyimpulkan saluran saat hanya satu target login yang didukung dikonfigurasi.
- Jalankan `channels login` dari terminal pada host gateway. `exec` agen memblokir alur login interaktif ini; alat login agen native saluran, seperti `whatsapp_login`, harus digunakan dari chat jika tersedia.

## Pemecahan masalah

- Jalankan `openclaw status --deep` untuk probe luas.
- Gunakan `openclaw doctor` untuk perbaikan terpandu.
- `openclaw channels list` mencetak `Claude: HTTP 403 ... user:profile` → snapshot penggunaan memerlukan cakupan `user:profile`. Gunakan `--no-usage`, atau berikan kunci sesi claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), atau autentikasi ulang melalui Claude CLI.
- `openclaw channels status` beralih ke ringkasan khusus konfigurasi saat gateway tidak dapat dijangkau. Jika kredensial saluran yang didukung dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, perintah melaporkan akun tersebut sebagai terkonfigurasi dengan catatan terdegradasi, bukan menampilkannya sebagai tidak dikonfigurasi.

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
- Probe bersifat spesifik penyedia: intent Discord + izin saluran opsional; cakupan bot + pengguna Slack; flag bot Telegram + Webhook; versi daemon Signal; token aplikasi Microsoft Teams + peran/cakupan Graph (diberi anotasi jika diketahui). Saluran tanpa probe melaporkan `Probe: unavailable`.

## Menguraikan nama menjadi ID

Uraikan nama saluran/pengguna menjadi ID menggunakan direktori penyedia:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Catatan:

- Gunakan `--kind user|group|auto` untuk memaksa jenis target.
- Resolusi memprioritaskan kecocokan aktif saat beberapa entri berbagi nama yang sama.
- `channels resolve` bersifat hanya baca. Jika akun yang dipilih dikonfigurasi melalui SecretRef tetapi kredensial tersebut tidak tersedia di jalur perintah saat ini, perintah mengembalikan hasil tidak terselesaikan yang terdegradasi dengan catatan, bukan membatalkan seluruh proses.

## Terkait

- [Referensi CLI](/id/cli)
- [Ikhtisar saluran](/id/channels)

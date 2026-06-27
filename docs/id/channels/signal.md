---
read_when:
    - Menyiapkan dukungan Signal
    - Men-debug pengiriman/penerimaan Signal
summary: Dukungan Signal melalui signal-cli (daemon native atau container bbernhard), jalur penyiapan, dan model nomor
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:12:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Status: integrasi CLI eksternal. Gateway berbicara dengan `signal-cli` melalui HTTP — baik daemon native (JSON-RPC + SSE) atau container bbernhard/signal-cli-rest-api (REST + WebSocket).

## Prasyarat

- OpenClaw terpasang di server Anda (alur Linux di bawah diuji pada Ubuntu 24).
- Salah satu dari:
  - `signal-cli` tersedia di host (mode native), **atau**
  - container Docker `bbernhard/signal-cli-rest-api` (mode container).
- Nomor telepon yang dapat menerima satu SMS verifikasi (untuk jalur pendaftaran SMS).
- Akses browser untuk captcha Signal (`signalcaptchas.org`) selama pendaftaran.

## Penyiapan cepat (pemula)

1. Gunakan **nomor Signal terpisah** untuk bot (direkomendasikan).
2. Pasang Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Pasang `signal-cli` (Java diperlukan jika Anda menggunakan build JVM).
4. Pilih satu jalur penyiapan:
   - **Jalur A (tautan QR):** `signal-cli link -n "OpenClaw"` dan pindai dengan Signal.
   - **Jalur B (daftar SMS):** daftarkan nomor khusus dengan captcha + verifikasi SMS.
5. Konfigurasikan OpenClaw dan mulai ulang gateway.
6. Kirim DM pertama dan setujui pemasangan (`openclaw pairing approve signal <CODE>`).

Konfigurasi minimal:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Referensi bidang:

| Bidang       | Deskripsi                                                       |
| ------------ | --------------------------------------------------------------- |
| `account`    | Nomor telepon bot dalam format E.164 (`+15551234567`)           |
| `cliPath`    | Path ke `signal-cli` (`signal-cli` jika ada di `PATH`)          |
| `configPath` | Direktori config signal-cli yang diteruskan sebagai `--config`  |
| `dmPolicy`   | Kebijakan akses DM (`pairing` direkomendasikan)                 |
| `allowFrom`  | Nomor telepon atau nilai `uuid:<id>` yang diizinkan mengirim DM |

## Apa ini

- Kanal Signal melalui `signal-cli` (bukan libsignal tertanam).
- Perutean deterministik: balasan selalu kembali ke Signal.
- DM berbagi sesi utama agen; grup diisolasi (`agent:<agentId>:signal:group:<groupId>`).

## Penulisan config

Secara default, Signal diizinkan menulis pembaruan config yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model nomor (penting)

- Gateway terhubung ke **perangkat Signal** (akun `signal-cli`).
- Jika Anda menjalankan bot pada **akun Signal pribadi Anda**, bot akan mengabaikan pesan Anda sendiri (perlindungan loop).
- Untuk "Saya mengirim teks ke bot dan bot membalas," gunakan **nomor bot terpisah**.

## Jalur penyiapan A: tautkan akun Signal yang sudah ada (QR)

1. Pasang `signal-cli` (build JVM atau native).
2. Tautkan akun bot:
   - `signal-cli link -n "OpenClaw"` lalu pindai QR di Signal.
3. Konfigurasikan Signal dan mulai gateway.

Contoh:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Dukungan multi-akun: gunakan `channels.signal.accounts` dengan config per akun dan `name` opsional. Lihat [`gateway/configuration`](/id/gateway/config-channels#multi-account-all-channels) untuk pola bersama.

## Jalur penyiapan B: daftarkan nomor bot khusus (SMS, Linux)

Gunakan ini saat Anda menginginkan nomor bot khusus alih-alih menautkan akun aplikasi Signal yang sudah ada.

1. Dapatkan nomor yang dapat menerima SMS (atau verifikasi suara untuk telepon kabel).
   - Gunakan nomor bot khusus untuk menghindari konflik akun/sesi.
2. Pasang `signal-cli` pada host gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jika Anda menggunakan build JVM (`signal-cli-${VERSION}.tar.gz`), pasang JRE 25+ terlebih dahulu.
Jaga agar `signal-cli` tetap terbaru; upstream mencatat bahwa rilis lama dapat rusak saat API server Signal berubah.

3. Daftarkan dan verifikasi nomor:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jika captcha diperlukan:

1. Buka `https://signalcaptchas.org/registration/generate.html`.
2. Selesaikan captcha, salin target tautan `signalcaptcha://...` dari "Open Signal".
3. Jalankan dari IP eksternal yang sama dengan sesi browser jika memungkinkan.
4. Jalankan pendaftaran lagi segera (token captcha kedaluwarsa dengan cepat):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurasikan OpenClaw, mulai ulang gateway, verifikasi kanal:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Pasangkan pengirim DM Anda:
   - Kirim pesan apa pun ke nomor bot.
   - Setujui kode di server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Simpan nomor bot sebagai kontak di ponsel Anda untuk menghindari "Unknown contact".

<Warning>
Mendaftarkan akun nomor telepon dengan `signal-cli` dapat membatalkan autentikasi sesi aplikasi Signal utama untuk nomor tersebut. Lebih baik gunakan nomor bot khusus, atau gunakan mode tautan QR jika Anda perlu mempertahankan penyiapan aplikasi ponsel yang sudah ada.
</Warning>

Referensi upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Alur captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Alur penautan: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode daemon eksternal (httpUrl)

Jika Anda ingin mengelola `signal-cli` sendiri (cold start JVM lambat, init container, atau CPU bersama), jalankan daemon secara terpisah dan arahkan OpenClaw ke sana:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Ini melewati auto-spawn dan penantian startup di dalam OpenClaw. Untuk start lambat saat auto-spawning, atur `channels.signal.startupTimeoutMs`.

## Mode container (bbernhard/signal-cli-rest-api)

Alih-alih menjalankan `signal-cli` secara native, Anda dapat menggunakan container Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Ini membungkus `signal-cli` di balik REST API dan antarmuka WebSocket.

Persyaratan:

- Container **harus** berjalan dengan `MODE=json-rpc` untuk penerimaan pesan real-time.
- Daftarkan atau tautkan akun Signal Anda di dalam container sebelum menghubungkan OpenClaw.

Contoh layanan `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Config OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Bidang `apiMode` mengontrol protokol mana yang digunakan OpenClaw:

| Nilai         | Perilaku                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| `"auto"`      | (Default) Probe kedua transport; streaming memvalidasi penerimaan WebSocket container      |
| `"native"`    | Paksa signal-cli native (JSON-RPC di `/api/v1/rpc`, SSE di `/api/v1/events`)               |
| `"container"` | Paksa container bbernhard (REST di `/v2/send`, WebSocket di `/v1/receive/{account}`)        |

Saat `apiMode` adalah `"auto"`, OpenClaw menyimpan mode terdeteksi dalam cache selama 30 detik untuk menghindari probe berulang. Penerimaan container hanya dipilih untuk streaming setelah `/v1/receive/{account}` ditingkatkan ke WebSocket, yang memerlukan `MODE=json-rpc`.

Mode container mendukung operasi kanal Signal yang sama seperti mode native ketika container mengekspos API yang sesuai: pengiriman, penerimaan, lampiran, indikator mengetik, tanda terima dibaca/dilihat, reaksi, grup, dan teks bergaya. OpenClaw menerjemahkan panggilan RPC Signal native-nya menjadi payload REST container, termasuk ID grup `group.{base64(internal_id)}` dan `text_mode: "styled"` untuk teks berformat.

Catatan operasional:

- Gunakan `autoStart: false` dengan mode container. OpenClaw tidak boleh memunculkan daemon native saat `apiMode: "container"` dipilih.
- Gunakan `MODE=json-rpc` untuk menerima. `MODE=normal` dapat membuat `/v1/about` terlihat sehat, tetapi `/v1/receive/{account}` tidak melakukan upgrade ke WebSocket, sehingga OpenClaw tidak akan memilih streaming penerimaan container dalam mode `auto`.
- Atur `apiMode: "container"` saat Anda tahu `httpUrl` mengarah ke REST API bbernhard. Atur `apiMode: "native"` saat Anda tahu itu mengarah ke JSON-RPC/SSE `signal-cli` native. Gunakan `"auto"` saat deployment dapat bervariasi.
- Unduhan lampiran container mematuhi batas byte media yang sama seperti mode native. Respons yang terlalu besar ditolak sebelum dibuffer sepenuhnya saat server mengirim `Content-Length`, dan sebaliknya saat streaming.

## Kontrol akses (DM + grup)

DM:

- Default: `channels.signal.dmPolicy = "pairing"`.
- Pengirim tidak dikenal menerima kode pemasangan; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pemasangan adalah pertukaran token default untuk DM Signal. Detail: [Pemasangan](/id/channels/pairing)
- Pengirim hanya UUID (dari `sourceUuid`) disimpan sebagai `uuid:<id>` di `channels.signal.allowFrom`.

Grup:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` mengontrol grup atau pengirim mana yang dapat memicu balasan grup saat `allowlist` diatur; entri dapat berupa ID grup Signal (mentah, `group:<id>`, atau `signal:group:<id>`), nomor telepon pengirim, nilai `uuid:<id>`, atau `*`.
- `channels.signal.groups["<group-id>" | "*"]` dapat menimpa perilaku grup dengan `requireMention`, `tools`, dan `toolsBySender`.
- Gunakan `channels.signal.accounts.<id>.groups` untuk penimpaan per akun dalam penyiapan multi-akun.
- Memasukkan grup Signal ke allowlist melalui `groupAllowFrom` tidak menonaktifkan gating mention dengan sendirinya. Entri `channels.signal.groups["<group-id>"]` yang dikonfigurasi secara spesifik memproses setiap pesan grup kecuali `requireMention=true` diatur.
- Catatan runtime: jika `channels.signal` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` diatur).

## Cara kerjanya (perilaku)

- Mode native: `signal-cli` berjalan sebagai daemon; gateway membaca event melalui SSE.
- Mode container: gateway mengirim melalui REST API dan menerima melalui WebSocket.
- Pesan masuk dinormalisasi ke dalam envelope kanal bersama.
- Balasan selalu dirutekan kembali ke nomor atau grup yang sama.

## Media + batas

- Teks keluar dipecah menjadi potongan sesuai `channels.signal.textChunkLimit` (default 4000).
- Pemotongan baris baru opsional: atur `channels.signal.chunkMode="newline"` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan panjang.
- Lampiran didukung (base64 diambil dari `signal-cli`).
- Lampiran voice-note menggunakan nama file `signal-cli` sebagai fallback MIME saat `contentType` tidak ada, sehingga transkripsi audio masih dapat mengklasifikasikan memo suara AAC.
- Batas media default: `channels.signal.mediaMaxMb` (default 8).
- Gunakan `channels.signal.ignoreAttachments` untuk melewati pengunduhan media.
- Konteks riwayat grup menggunakan `channels.signal.historyLimit` (atau `channels.signal.accounts.*.historyLimit`), dengan fallback ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkan (default 50).

## Mengetik + tanda terima dibaca

- **Indikator pengetikan**: OpenClaw mengirim sinyal pengetikan melalui `signal-cli sendTyping` dan menyegarkannya saat balasan sedang berjalan.
- **Tanda terima baca**: ketika `channels.signal.sendReadReceipts` bernilai true, OpenClaw meneruskan tanda terima baca untuk DM yang diizinkan.
- Signal-cli tidak mengekspos tanda terima baca untuk grup.

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=signal`.
- Target: E.164 pengirim atau UUID (gunakan `uuid:<id>` dari keluaran penyandingan; UUID polos juga berfungsi).
- `messageId` adalah stempel waktu Signal untuk pesan yang Anda reaksikan.
- Reaksi grup memerlukan `targetAuthor` atau `targetAuthorUuid`.

Contoh:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfigurasi:

- `channels.signal.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` menonaktifkan reaksi agen (alat pesan `react` akan menghasilkan kesalahan).
  - `minimal`/`extensive` mengaktifkan reaksi agen dan menetapkan tingkat panduan.
- Penggantian per akun: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reaksi persetujuan

Prompt persetujuan eksekusi Signal dan Plugin menggunakan blok perutean tingkat atas `approvals.exec` dan
`approvals.plugin`. Signal tidak memiliki blok
`channels.signal.execApprovals`.

- `👍` menyetujui sekali.
- `👎` menolak.
- Gunakan `/approve <id> allow-always` ketika sebuah permintaan menawarkan persetujuan persisten.

Resolusi reaksi persetujuan memerlukan pemberi persetujuan Signal eksplisit dari
`channels.signal.allowFrom`, `channels.signal.defaultTo`, atau kolom tingkat akun yang cocok.
Prompt persetujuan eksekusi langsung di obrolan yang sama tetap dapat menyembunyikan fallback lokal `/approve` duplikat
tanpa pemberi persetujuan eksplisit; persetujuan grup tanpa pemberi persetujuan tetap menampilkan fallback lokal.

## Target pengiriman (CLI/cron)

- DM: `signal:+15551234567` (atau E.164 biasa).
- DM UUID: `uuid:<id>` (atau UUID polos).
- Grup: `signal:group:<groupId>`.
- Nama pengguna: `username:<name>` (jika didukung oleh akun Signal Anda).

## Pemecahan masalah

Jalankan tangga ini terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Lalu konfirmasi status penyandingan DM jika diperlukan:

```bash
openclaw pairing list signal
```

Kegagalan umum:

- Daemon dapat dijangkau tetapi tidak ada balasan: verifikasi pengaturan akun/daemon (`httpUrl`, `account`) dan mode penerimaan.
- DM diabaikan: pengirim menunggu persetujuan penyandingan.
- Pesan grup diabaikan: gating pengirim/mention grup memblokir pengiriman.
- Kesalahan validasi konfigurasi setelah pengeditan: jalankan `openclaw doctor --fix`.
- Signal hilang dari diagnostik: konfirmasi `channels.signal.enabled: true`.

Pemeriksaan tambahan:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Untuk alur triase: [/channels/troubleshooting](/id/channels/troubleshooting).

## Catatan keamanan

- `signal-cli` menyimpan kunci akun secara lokal (biasanya `~/.local/share/signal-cli/data/`).
- Cadangkan status akun Signal sebelum migrasi atau pembangunan ulang server.
- Pertahankan `channels.signal.dmPolicy: "pairing"` kecuali Anda secara eksplisit menginginkan akses DM yang lebih luas.
- Verifikasi SMS hanya diperlukan untuk alur pendaftaran atau pemulihan, tetapi kehilangan kendali atas nomor/akun dapat mempersulit pendaftaran ulang.

## Referensi konfigurasi (Signal)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.signal.enabled`: aktifkan/nonaktifkan startup kanal.
- `channels.signal.apiMode`: `auto | native | container` (default: auto). Lihat [Mode container](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 untuk akun bot.
- `channels.signal.cliPath`: jalur ke `signal-cli`.
- `channels.signal.configPath`: direktori opsional `signal-cli --config`.
- `channels.signal.httpUrl`: URL daemon lengkap (mengganti host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind daemon (default 127.0.0.1:8080).
- `channels.signal.autoStart`: spawn daemon otomatis (default true jika `httpUrl` tidak disetel).
- `channels.signal.startupTimeoutMs`: batas waktu tunggu startup dalam ms (batas 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: lewati unduhan lampiran.
- `channels.signal.ignoreStories`: abaikan story dari daemon.
- `channels.signal.sendReadReceipts`: teruskan tanda terima baca.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.signal.allowFrom`: allowlist DM (E.164 atau `uuid:<id>`). `open` memerlukan `"*"`. Signal tidak memiliki nama pengguna; gunakan ID telepon/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (default: allowlist).
- `channels.signal.groupAllowFrom`: allowlist grup; menerima ID grup Signal (mentah, `group:<id>`, atau `signal:group:<id>`), nomor E.164 pengirim, atau nilai `uuid:<id>`.
- `channels.signal.groups`: penggantian per grup dengan kunci id grup Signal (atau `"*"`). Kolom yang didukung: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versi per akun dari `channels.signal.groups` untuk setup multi-akun.
- `channels.signal.historyLimit`: jumlah maksimum pesan grup yang disertakan sebagai konteks (0 menonaktifkan).
- `channels.signal.dmHistoryLimit`: batas riwayat DM dalam giliran pengguna. Penggantian per pengguna: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ukuran chunk keluar (karakter).
- `channels.signal.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.signal.mediaMaxMb`: batas media masuk/keluar (MB).

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (Signal tidak mendukung mention native).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Penyandingan](/id/channels/pairing) — autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan

---
read_when:
    - Menyiapkan dukungan Signal
    - Men-debug pengiriman/penerimaan Signal
summary: Dukungan Signal melalui signal-cli (JSON-RPC + SSE), jalur penyiapan, dan model nomor
title: Signal
x-i18n:
    generated_at: "2026-04-30T09:35:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Status: integrasi CLI eksternal. Gateway berbicara dengan `signal-cli` melalui HTTP JSON-RPC + SSE.

## Prasyarat

- OpenClaw terpasang di server Anda (alur Linux di bawah diuji pada Ubuntu 24).
- `signal-cli` tersedia pada host tempat Gateway berjalan.
- Nomor telepon yang dapat menerima satu SMS verifikasi (untuk jalur pendaftaran SMS).
- Akses browser untuk captcha Signal (`signalcaptchas.org`) selama pendaftaran.

## Penyiapan cepat (pemula)

1. Gunakan **nomor Signal terpisah** untuk bot (direkomendasikan).
2. Pasang `signal-cli` (Java diperlukan jika Anda menggunakan build JVM).
3. Pilih satu jalur penyiapan:
   - **Jalur A (tautan QR):** `signal-cli link -n "OpenClaw"` dan pindai dengan Signal.
   - **Jalur B (daftar SMS):** daftarkan nomor khusus dengan captcha + verifikasi SMS.
4. Konfigurasikan OpenClaw dan mulai ulang Gateway.
5. Kirim DM pertama dan setujui pemasangan (`openclaw pairing approve signal <CODE>`).

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

| Bidang      | Deskripsi                                         |
| ----------- | ------------------------------------------------- |
| `account`   | Nomor telepon bot dalam format E.164 (`+15551234567`) |
| `cliPath`   | Jalur ke `signal-cli` (`signal-cli` jika ada di `PATH`) |
| `dmPolicy`  | Kebijakan akses DM (`pairing` direkomendasikan)   |
| `allowFrom` | Nomor telepon atau nilai `uuid:<id>` yang diizinkan untuk DM |

## Apa ini

- Kanal Signal melalui `signal-cli` (bukan libsignal tertanam).
- Perutean deterministik: balasan selalu kembali ke Signal.
- DM berbagi sesi utama agen; grup diisolasi (`agent:<agentId>:signal:group:<groupId>`).

## Penulisan konfigurasi

Secara default, Signal diizinkan menulis pembaruan konfigurasi yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Model nomor (penting)

- Gateway terhubung ke **perangkat Signal** (akun `signal-cli`).
- Jika Anda menjalankan bot pada **akun Signal pribadi Anda**, bot akan mengabaikan pesan Anda sendiri (perlindungan loop).
- Untuk "saya mengirim pesan ke bot dan bot membalas," gunakan **nomor bot terpisah**.

## Jalur penyiapan A: tautkan akun Signal yang ada (QR)

1. Pasang `signal-cli` (build JVM atau native).
2. Tautkan akun bot:
   - `signal-cli link -n "OpenClaw"` lalu pindai QR di Signal.
3. Konfigurasikan Signal dan mulai Gateway.

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

Dukungan multi-akun: gunakan `channels.signal.accounts` dengan konfigurasi per akun dan `name` opsional. Lihat [`gateway/configuration`](/id/gateway/config-channels#multi-account-all-channels) untuk pola bersama.

## Jalur penyiapan B: daftarkan nomor bot khusus (SMS, Linux)

Gunakan ini ketika Anda menginginkan nomor bot khusus alih-alih menautkan akun aplikasi Signal yang ada.

1. Dapatkan nomor yang dapat menerima SMS (atau verifikasi suara untuk telepon rumah).
   - Gunakan nomor bot khusus untuk menghindari konflik akun/sesi.
2. Pasang `signal-cli` pada host Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jika Anda menggunakan build JVM (`signal-cli-${VERSION}.tar.gz`), pasang JRE 25+ terlebih dahulu.
Tetap perbarui `signal-cli`; upstream mencatat bahwa rilis lama dapat rusak ketika API server Signal berubah.

3. Daftarkan dan verifikasi nomor:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jika captcha diperlukan:

1. Buka `https://signalcaptchas.org/registration/generate.html`.
2. Selesaikan captcha, salin target tautan `signalcaptcha://...` dari "Open Signal".
3. Jalankan dari IP eksternal yang sama dengan sesi browser jika memungkinkan.
4. Jalankan pendaftaran lagi segera (token captcha cepat kedaluwarsa):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurasikan OpenClaw, mulai ulang Gateway, verifikasi kanal:

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
Mendaftarkan akun nomor telepon dengan `signal-cli` dapat membatalkan autentikasi sesi aplikasi Signal utama untuk nomor tersebut. Sebaiknya gunakan nomor bot khusus, atau gunakan mode tautan QR jika Anda perlu mempertahankan penyiapan aplikasi ponsel yang ada.
</Warning>

Referensi upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Alur captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Alur penautan: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode daemon eksternal (httpUrl)

Jika Anda ingin mengelola `signal-cli` sendiri (cold start JVM yang lambat, init container, atau CPU bersama), jalankan daemon secara terpisah dan arahkan OpenClaw ke sana:

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

Ini melewati auto-spawn dan waktu tunggu startup di dalam OpenClaw. Untuk startup lambat saat auto-spawn, atur `channels.signal.startupTimeoutMs`.

## Kontrol akses (DM + grup)

DM:

- Default: `channels.signal.dmPolicy = "pairing"`.
- Pengirim yang tidak dikenal menerima kode pemasangan; pesan diabaikan hingga disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pemasangan adalah pertukaran token default untuk DM Signal. Detail: [Pemasangan](/id/channels/pairing)
- Pengirim khusus UUID (dari `sourceUuid`) disimpan sebagai `uuid:<id>` di `channels.signal.allowFrom`.

Grup:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` mengontrol siapa yang dapat memicu di grup ketika `allowlist` diatur.
- `channels.signal.groups["<group-id>" | "*"]` dapat mengganti perilaku grup dengan `requireMention`, `tools`, dan `toolsBySender`.
- Gunakan `channels.signal.accounts.<id>.groups` untuk penggantian per akun dalam penyiapan multi-akun.
- Catatan runtime: jika `channels.signal` sama sekali tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` diatur).

## Cara kerjanya (perilaku)

- `signal-cli` berjalan sebagai daemon; Gateway membaca peristiwa melalui SSE.
- Pesan masuk dinormalisasi ke dalam envelope kanal bersama.
- Balasan selalu dirutekan kembali ke nomor atau grup yang sama.

## Media + batas

- Teks keluar dipecah menjadi potongan hingga `channels.signal.textChunkLimit` (default 4000).
- Pemecahan opsional berdasarkan baris baru: atur `channels.signal.chunkMode="newline"` untuk memecah pada baris kosong (batas paragraf) sebelum pemecahan berdasarkan panjang.
- Lampiran didukung (base64 diambil dari `signal-cli`).
- Lampiran catatan suara menggunakan nama file `signal-cli` sebagai fallback MIME ketika `contentType` tidak ada, sehingga transkripsi audio tetap dapat mengklasifikasikan memo suara AAC.
- Batas media default: `channels.signal.mediaMaxMb` (default 8).
- Gunakan `channels.signal.ignoreAttachments` untuk melewati pengunduhan media.
- Konteks riwayat grup menggunakan `channels.signal.historyLimit` (atau `channels.signal.accounts.*.historyLimit`), dengan fallback ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkan (default 50).

## Indikator mengetik + tanda dibaca

- **Indikator mengetik**: OpenClaw mengirim sinyal mengetik melalui `signal-cli sendTyping` dan menyegarkannya saat balasan sedang berjalan.
- **Tanda dibaca**: ketika `channels.signal.sendReadReceipts` bernilai true, OpenClaw meneruskan tanda dibaca untuk DM yang diizinkan.
- Signal-cli tidak mengekspos tanda dibaca untuk grup.

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=signal`.
- Target: pengirim E.164 atau UUID (gunakan `uuid:<id>` dari output pemasangan; UUID polos juga berfungsi).
- `messageId` adalah timestamp Signal untuk pesan yang Anda reaksikan.
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
  - `off`/`ack` menonaktifkan reaksi agen (alat pesan `react` akan error).
  - `minimal`/`extensive` mengaktifkan reaksi agen dan mengatur tingkat panduan.
- Penggantian per akun: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Target pengiriman (CLI/cron)

- DM: `signal:+15551234567` (atau E.164 polos).
- DM UUID: `uuid:<id>` (atau UUID polos).
- Grup: `signal:group:<groupId>`.
- Nama pengguna: `username:<name>` (jika didukung oleh akun Signal Anda).

## Pemecahan masalah

Jalankan urutan ini terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Lalu konfirmasi status pemasangan DM jika diperlukan:

```bash
openclaw pairing list signal
```

Kegagalan umum:

- Daemon dapat dijangkau tetapi tidak ada balasan: verifikasi pengaturan akun/daemon (`httpUrl`, `account`) dan mode penerimaan.
- DM diabaikan: pengirim menunggu persetujuan pemasangan.
- Pesan grup diabaikan: pembatasan pengirim/mention grup memblokir pengiriman.
- Error validasi konfigurasi setelah pengeditan: jalankan `openclaw doctor --fix`.
- Signal tidak ada dari diagnostik: konfirmasi `channels.signal.enabled: true`.

Pemeriksaan tambahan:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Untuk alur triase: [/channels/troubleshooting](/id/channels/troubleshooting).

## Catatan keamanan

- `signal-cli` menyimpan kunci akun secara lokal (biasanya `~/.local/share/signal-cli/data/`).
- Cadangkan status akun Signal sebelum migrasi atau rebuild server.
- Pertahankan `channels.signal.dmPolicy: "pairing"` kecuali Anda secara eksplisit menginginkan akses DM yang lebih luas.
- Verifikasi SMS hanya diperlukan untuk alur pendaftaran atau pemulihan, tetapi kehilangan kendali atas nomor/akun dapat mempersulit pendaftaran ulang.

## Referensi konfigurasi (Signal)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.signal.enabled`: aktifkan/nonaktifkan startup saluran.
- `channels.signal.account`: E.164 untuk akun bot.
- `channels.signal.cliPath`: jalur ke `signal-cli`.
- `channels.signal.httpUrl`: URL daemon lengkap (menimpa host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind daemon (default 127.0.0.1:8080).
- `channels.signal.autoStart`: jalankan daemon otomatis (default true jika `httpUrl` tidak diatur).
- `channels.signal.startupTimeoutMs`: batas waktu tunggu startup dalam ms (batas 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: lewati pengunduhan lampiran.
- `channels.signal.ignoreStories`: abaikan cerita dari daemon.
- `channels.signal.sendReadReceipts`: teruskan tanda terima baca.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.signal.allowFrom`: daftar izin DM (E.164 atau `uuid:<id>`). `open` memerlukan `"*"`. Signal tidak memiliki nama pengguna; gunakan id telepon/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (default: allowlist).
- `channels.signal.groupAllowFrom`: daftar izin pengirim grup.
- `channels.signal.groups`: penimpaan per grup yang dikunci oleh id grup Signal (atau `"*"`). Bidang yang didukung: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versi per akun dari `channels.signal.groups` untuk penyiapan multi-akun.
- `channels.signal.historyLimit`: jumlah maksimum pesan grup yang disertakan sebagai konteks (0 menonaktifkan).
- `channels.signal.dmHistoryLimit`: batas riwayat DM dalam giliran pengguna. Penimpaan per pengguna: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ukuran potongan keluar (karakter).
- `channels.signal.chunkMode`: `length` (default) atau `newline` untuk memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.signal.mediaMaxMb`: batas media masuk/keluar (MB).

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (Signal tidak mendukung mention native).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan

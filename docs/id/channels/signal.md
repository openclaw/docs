---
read_when:
    - Menyiapkan dukungan Signal
    - Men-debug pengiriman/penerimaan Signal
summary: Dukungan Signal melalui signal-cli (daemon native atau kontainer bbernhard), jalur penyiapan, dan model nomor
title: Signal
x-i18n:
    generated_at: "2026-07-19T04:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bbae246e797f79e68b1b217006450b557021a5587467975b79840672ac34d75
    source_path: channels/signal.md
    workflow: 16
---

Signal adalah plugin saluran yang dapat diunduh (`@openclaw/signal`). Gateway berkomunikasi dengan `signal-cli` melalui HTTP: baik daemon native (JSON-RPC + SSE) maupun kontainer [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw tidak menyematkan libsignal.

## Model nomor (baca ini terlebih dahulu)

- Gateway terhubung ke **perangkat Signal**: akun `signal-cli`.
- Menjalankan bot pada **akun Signal pribadi Anda** membuatnya mengabaikan pesan Anda sendiri (perlindungan loop).
- Untuk "Saya mengirim pesan teks ke bot dan bot membalas," gunakan **nomor bot terpisah**.

## Instalasi

```bash
openclaw plugins install @openclaw/signal
```

Spesifikasi plugin tanpa kualifikasi mencoba ClawHub terlebih dahulu, lalu beralih ke npm. Paksa sumber dengan `openclaw plugins install clawhub:@openclaw/signal` atau `npm:@openclaw/signal`. `plugins install` mendaftarkan dan mengaktifkan plugin; tidak diperlukan langkah `enable` terpisah. Lihat [Plugin](/id/tools/plugin) untuk aturan instalasi umum.

## Penyiapan cepat

<Steps>
  <Step title="Pilih nomor">
    Gunakan **nomor Signal terpisah** untuk bot (disarankan).
  </Step>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Jalankan penyiapan terpandu">
    ```bash
    openclaw channels add
    ```
    Wizard mendeteksi apakah `signal-cli` tersedia di `PATH` dan, jika tidak ada, menawarkan untuk menginstalnya: mengunduh build native GraalVM resmi pada Linux x86-64, atau menginstalnya melalui Homebrew pada macOS dan arsitektur lainnya. Kemudian wizard meminta nomor bot dan jalur `signal-cli`.

    Untuk penyiapan noninteraktif, `openclaw channels add --channel signal` juga menerima `--signal-number <e164>` untuk nomor telepon bot, serta `--http-host <host>` dan `--http-port <port>` untuk endpoint daemon Signal (default `127.0.0.1:8080`).

  </Step>
  <Step title="Tautkan atau daftarkan akun">
    - **Penautan QR (tercepat):** `signal-cli link -n "OpenClaw"`, lalu pindai dengan Signal. Lihat [Jalur A](#setup-path-a-link-existing-signal-account-qr).
    - **Pendaftaran SMS:** nomor khusus dengan captcha + verifikasi SMS. Lihat [Jalur B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Verifikasi dan pasangkan">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Kirim DM pertama dan setujui pemasangan: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

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

| Bidang       | Deskripsi                                         |
| ------------ | ------------------------------------------------- |
| `account`    | Nomor telepon bot dalam format E.164 (`+15551234567`) |
| `cliPath`    | Jalur ke `signal-cli` (`signal-cli` jika tersedia di `PATH`)  |
| `configPath` | Direktori konfigurasi signal-cli yang diteruskan sebagai `--config`        |
| `dmPolicy`   | Kebijakan akses DM (`pairing` disarankan)          |
| `allowFrom`  | Nomor telepon atau nilai `uuid:<id>` yang diizinkan mengirim DM |

Dukungan multiakun: gunakan `channels.signal.accounts` dengan konfigurasi per akun dan `name` opsional. Lihat [Saluran multiakun](/id/gateway/config-channels#multi-account-all-channels) untuk pola bersama.

## Apa fungsinya

- Perutean deterministik: balasan selalu dikirim kembali ke Signal.
- DM berbagi sesi utama agen; grup diisolasi (`agent:<agentId>:signal:group:<groupId>`).
- Secara default, Signal dapat menulis pembaruan konfigurasi yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`). Nonaktifkan dengan `channels.signal.configWrites: false`.

## Jalur penyiapan A: tautkan akun Signal yang sudah ada (QR)

1. Instal `signal-cli` (build JVM atau native), atau biarkan `openclaw channels add` menginstalnya untuk Anda.
2. Tautkan akun bot: `signal-cli link -n "OpenClaw"`, lalu pindai QR di Signal.
3. Konfigurasikan Signal dan mulai Gateway.

## Jalur penyiapan B: daftarkan nomor bot khusus (SMS, Linux)

Gunakan ini untuk nomor bot khusus alih-alih menautkan akun aplikasi Signal yang sudah ada. Alur berikut telah diuji pada Ubuntu 24.

1. Dapatkan nomor yang dapat menerima SMS (atau verifikasi suara untuk telepon rumah). Nomor bot khusus menghindari konflik akun/sesi.
2. Instal `signal-cli` pada host Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Jika Anda menggunakan build JVM (`signal-cli-${VERSION}.tar.gz`), instal JRE terlebih dahulu. Selalu perbarui `signal-cli`; dokumentasi upstream mencatat bahwa rilis lama dapat berhenti berfungsi seiring perubahan API server Signal.

3. Daftarkan dan verifikasi nomor:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Jika captcha diperlukan (akses browser diperlukan untuk menyelesaikan langkah ini):

1. Buka `https://signalcaptchas.org/registration/generate.html`.
2. Selesaikan captcha, salin target tautan `signalcaptcha://...` dari "Open Signal".
3. Jalankan dari IP eksternal yang sama dengan sesi browser jika memungkinkan (token captcha cepat kedaluwarsa).
4. Segera daftarkan dan verifikasi:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurasikan OpenClaw, mulai ulang Gateway, verifikasi saluran:

```bash
# Jika Anda menjalankan Gateway sebagai layanan systemd pengguna:
systemctl --user restart openclaw-gateway.service

# Kemudian verifikasi:
openclaw doctor
openclaw channels status --probe
```

5. Pasangkan pengirim DM Anda:
   - Kirim pesan apa pun ke nomor bot.
   - Setujui di server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Simpan nomor bot sebagai kontak di ponsel Anda untuk menghindari "Unknown contact".

<Warning>
Mendaftarkan akun nomor telepon dengan `signal-cli` dapat membatalkan autentikasi sesi aplikasi Signal utama untuk nomor tersebut. Sebaiknya gunakan nomor bot khusus, atau gunakan mode penautan QR agar penyiapan aplikasi ponsel Anda yang sudah ada tetap dipertahankan.
</Warning>

Referensi upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Alur captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Alur penautan: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode daemon eksternal (httpUrl)

Untuk mengelola `signal-cli` sendiri (cold start JVM yang lambat, inisialisasi kontainer, CPU bersama), jalankan daemon secara terpisah dan arahkan OpenClaw ke daemon tersebut:

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

Ini melewati pemunculan otomatis dan waktu tunggu startup OpenClaw. Untuk startup lambat yang dimunculkan secara otomatis, atur `channels.signal.startupTimeoutMs`.

## Mode kontainer (bbernhard/signal-cli-rest-api)

Alih-alih menjalankan `signal-cli` secara native, gunakan kontainer Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), yang membungkus `signal-cli` di balik antarmuka REST + WebSocket.

Persyaratan:

- Kontainer **harus** berjalan dengan `MODE=json-rpc` agar dapat menerima pesan secara waktu nyata.
- Daftarkan atau tautkan akun Signal Anda di dalam kontainer sebelum menghubungkan OpenClaw.

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

Konfigurasi OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // atau "auto" untuk mendeteksi secara otomatis
    },
  },
}
```

`apiMode` mengontrol protokol yang digunakan OpenClaw:

| Nilai         | Perilaku                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Default) Memeriksa kedua transportasi; streaming memvalidasi penerimaan WebSocket kontainer    |
| `"native"`    | Memaksa signal-cli native (JSON-RPC di `/api/v1/rpc`, SSE di `/api/v1/events`)         |
| `"container"` | Memaksa kontainer bbernhard (REST di `/v2/send`, WebSocket di `/v1/receive/{account}`) |

Saat `apiMode` bernilai `"auto"`, OpenClaw menyimpan mode yang terdeteksi dalam cache selama 30 detik per URL daemon untuk menghindari pemeriksaan berulang (native diutamakan ketika kedua transportasi sehat). Penerimaan kontainer hanya dipilih untuk streaming setelah `/v1/receive/{account}` ditingkatkan ke WebSocket, yang memerlukan `MODE=json-rpc`.

Mode kontainer mendukung operasi Signal yang sama dengan mode native jika kontainer mengekspos API yang sesuai: mengirim, menerima, lampiran, indikator pengetikan, tanda terima telah dibaca/dilihat, reaksi, grup, dan teks bergaya. OpenClaw menerjemahkan panggilan RPC Signal native menjadi payload REST kontainer, termasuk ID grup `group.{base64(internal_id)}` dan `text_mode: "styled"` untuk teks berformat.

Catatan operasional:

- Gunakan `autoStart: false` dengan mode kontainer; OpenClaw tidak boleh memunculkan daemon native ketika `apiMode: "container"` dipilih.
- Gunakan `MODE=json-rpc` untuk menerima. `MODE=normal` dapat membuat `/v1/about` tampak sehat, tetapi `/v1/receive/{account}` tidak akan ditingkatkan ke WebSocket, sehingga OpenClaw tidak akan memilih streaming penerimaan kontainer dalam mode `auto`.
- Atur `apiMode: "container"` ketika `httpUrl` mengarah ke API REST bbernhard, `"native"` ketika mengarah ke JSON-RPC/SSE `signal-cli` native, dan `"auto"` ketika deployment dapat bervariasi.
- Pengunduhan lampiran kontainer mematuhi batas byte media yang sama dengan mode native. Respons yang terlalu besar ditolak sebelum sepenuhnya dimuat ke buffer ketika server mengirim `Content-Length`, dan saat streaming jika tidak.

## Kontrol akses (DM + grup)

DM:

- Default: `channels.signal.dmPolicy = "pairing"`.
- Pengirim yang tidak dikenal menerima kode pemasangan; pesan diabaikan hingga disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui `openclaw pairing list signal` dan `openclaw pairing approve signal <CODE>`.
- Pemasangan adalah pertukaran token default untuk DM Signal. Detail: [Pemasangan](/id/channels/pairing)
- Pengirim khusus UUID (dari `sourceUuid`) disimpan sebagai `uuid:<id>` di `channels.signal.allowFrom`.

Grup:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` mengontrol grup atau pengirim mana yang dapat memicu balasan grup saat `allowlist` ditetapkan; entri dapat berupa ID grup Signal (mentah, `group:<id>`, atau `signal:group:<id>`), nomor telepon pengirim, nilai `uuid:<id>`, atau `*`.
- `channels.signal.groups["<group-id>" | "*"]` dapat mengganti perilaku grup dengan `requireMention`, `tools`, dan `toolsBySender`.
- Gunakan `channels.signal.accounts.<id>.groups` untuk penggantian per akun dalam penyiapan multiakun.
- Memasukkan grup Signal ke daftar yang diizinkan melalui `groupAllowFrom` tidak dengan sendirinya menonaktifkan pembatasan penyebutan. Entri `channels.signal.groups["<group-id>"]` yang dikonfigurasi secara khusus memproses setiap pesan grup kecuali `requireMention=true` ditetapkan.
- Dengan `requireMention=true`, @mention native Signal dicocokkan dari metadata penyebutan terstruktur terhadap telepon akun bot atau `accountUuid`. `mentionPatterns` yang dikonfigurasi tetap menjadi fallback teks biasa.
- Catatan runtime: jika `channels.signal` sama sekali tidak ada, runtime beralih ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` ditetapkan).

Grup dengan pembatasan penyebutan dan konteks terbatas:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Pesan grup yang diizinkan tetapi tidak menyebut bot tidak akan ditanggapi dan hanya disimpan dalam jendela riwayat tertunda yang terbatas. Ketika @mention native atau penyebutan teks cadangan berikutnya memicu bot, OpenClaw menyertakan konteks terbaru tersebut dan membalas ke grup yang sama. Isi lampiran yang dilewati tidak diunduh; lampiran tersebut mungkin hanya muncul sebagai placeholder media ringkas dalam konteks tertunda.

## Cara kerjanya (perilaku)

- Mode native: `signal-cli` berjalan sebagai daemon; Gateway membaca peristiwa melalui SSE.
- Mode kontainer: Gateway mengirim melalui REST API dan menerima melalui WebSocket.
- Pesan masuk dinormalisasi ke dalam amplop channel bersama.
- Balasan selalu dirutekan kembali ke nomor atau grup yang sama.
- Balasan terhadap pesan masuk menyertakan metadata kutipan Signal native ketika backend menerima stempel waktu dan penulis pesan masuk; jika metadata kutipan tidak ada atau ditolak, OpenClaw mengirim balasan sebagai pesan biasa.
- Konfigurasikan penggunaan kutipan native dengan `channels.signal.replyToMode = off | first | all | batched`, atau `channels.signal.replyToModeByChatType.direct/group` untuk penggantian per jenis obrolan. Nilai tingkat akun di bawah `channels.signal.accounts.<id>` diutamakan.

## Media + batas

- Teks keluar dipecah sesuai `channels.signal.textChunkLimit` (default 4000).
- Pemecahan opsional berdasarkan baris baru: atur `channels.signal.streaming.chunkMode="newline"` untuk memecah pada baris kosong (batas paragraf) sebelum pemecahan berdasarkan panjang.
- Lampiran didukung (base64 diambil dari `signal-cli`).
- Lampiran catatan suara menggunakan nama berkas `signal-cli` sebagai cadangan MIME ketika `contentType` tidak ada, sehingga transkripsi audio tetap dapat mengklasifikasikan memo suara AAC.
- Batas media default: `channels.signal.mediaMaxMb` (default 8).
- Gunakan `channels.signal.ignoreAttachments` untuk melewati pengunduhan media.
- Konteks riwayat grup menggunakan `channels.signal.historyLimit` (atau `channels.signal.accounts.*.historyLimit`), dengan cadangan ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkannya (default 50).

## Indikator pengetikan + tanda terima telah dibaca

- **Indikator pengetikan**: OpenClaw mengirim sinyal pengetikan melalui `signal-cli sendTyping` dan menyegarkannya selama balasan sedang diproses.
- **Tanda terima telah dibaca**: ketika `channels.signal.sendReadReceipts` bernilai true, OpenClaw meneruskan tanda terima telah dibaca untuk DM yang diizinkan.
- `signal-cli` tidak menyediakan tanda terima telah dibaca untuk grup.

## Reaksi status siklus hidup

Atur `messages.statusReactions.enabled: true` agar Signal menampilkan siklus hidup reaksi bersama antre/berpikir/alat/compaction/selesai/kesalahan pada giliran masuk. Signal menggunakan stempel waktu pesan masuk sebagai target reaksi; reaksi grup dikirim dengan ID grup Signal serta pengirim asli sebagai penulis target.

Reaksi status juga memerlukan reaksi pengakuan dan `messages.ackReactionScope` yang cocok (`direct`, `group-all`, `group-mentions`, atau `all`). Atur `channels.signal.reactionLevel: "off"` untuk menonaktifkan reaksi status Signal.

`messages.removeAckAfterReply: true` menghapus reaksi status akhir setelah waktu tunggu yang dikonfigurasi. Jika tidak, Signal memulihkan reaksi pengakuan awal setelah status akhir selesai/kesalahan.

## Reaksi (alat pesan)

Gunakan `message action=react` dengan `channel=signal`.

- Target: E.164 atau UUID pengirim (gunakan `uuid:<id>` dari keluaran pemasangan; UUID tanpa awalan juga dapat digunakan).
- `messageId` adalah stempel waktu Signal untuk pesan yang Anda reaksikan.
- Reaksi grup memerlukan `targetAuthor` atau `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfigurasi:

- `channels.signal.actions.reactions`: aktifkan/nonaktifkan tindakan reaksi (default true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (default `minimal`).
  - `off`/`ack` menonaktifkan reaksi agen (alat pesan `react` menghasilkan kesalahan).
  - `minimal`/`extensive` mengaktifkan reaksi agen dan menetapkan tingkat panduan.
- Penggantian per akun: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Reaksi persetujuan

Prompt persetujuan eksekusi dan Plugin Signal menggunakan blok perutean tingkat atas `approvals.exec` dan `approvals.plugin`. Signal tidak memiliki blok `channels.signal.execApprovals`.

- `👍` menyetujui satu kali.
- `👎` menolak.
- Gunakan `/approve <id> allow-always` ketika permintaan menawarkan persetujuan persisten.

Penyelesaian reaksi persetujuan memerlukan pemberi persetujuan Signal eksplisit dari `channels.signal.allowFrom`, `channels.signal.defaultTo`, atau bidang tingkat akun yang cocok. Prompt persetujuan eksekusi langsung dalam obrolan yang sama tetap dapat menyembunyikan cadangan lokal `/approve` yang duplikat tanpa pemberi persetujuan eksplisit; persetujuan grup tanpa pemberi persetujuan tetap menampilkan cadangan lokal.

## Reaksi pertanyaan

Untuk prompt `ask_user` dengan satu pertanyaan pilihan tunggal yang tidak bersifat rahasia dan satu hingga empat opsi, Signal menampilkan `1️⃣` hingga `4️⃣` di samping label opsi. Berikan reaksi pada prompt yang dikirim dengan nomor yang cocok untuk menjawabnya. OpenClaw memverifikasi bahwa reaksi menargetkan pesan yang ditulis bot, lalu memetakan nomor tersebut ke opsi kanonis melalui Gateway. Ketukan kedaluwarsa atau duplikat diabaikan. Prompt dengan beberapa pertanyaan, beberapa pilihan, dan teks bebas tetap hanya dapat dijawab melalui teks; aturan penerimaan DM/grup Signal biasa mengotorisasi pengirim.

## Target pengiriman (CLI/cron)

- DM: `signal:+15551234567` (atau E.164 biasa).
- DM UUID: `uuid:<id>` (atau UUID tanpa awalan).
- Grup: `signal:group:<groupId>`.
- Nama pengguna: `username:<name>` (jika didukung oleh akun Signal Anda).

## Alias

Konfigurasikan alias untuk nama stabil pada target Signal berulang. Alias hanya merupakan konfigurasi di sisi OpenClaw; alias tidak membuat atau mengedit kontak Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Gunakan alias di mana pun target pengiriman Signal diterima:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment selesai"
```

Alias per akun mewarisi alias tingkat atas dan dapat menambahkan atau mengganti nama:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` dan `openclaw directory groups list --channel signal` mencantumkan alias yang dikonfigurasi. Direktori Signal didukung oleh konfigurasi; direktori ini tidak meminta data kontak Signal secara langsung atau mengubah akun Signal.

## Pemecahan masalah

Jalankan urutan ini terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Kemudian konfirmasikan status pemasangan DM jika diperlukan:

```bash
openclaw pairing list signal
```

Kegagalan umum:

- Daemon dapat dijangkau tetapi tidak ada balasan: verifikasi pengaturan akun/daemon (`httpUrl`, `account`) dan mode penerimaan.
- DM diabaikan: pengirim sedang menunggu persetujuan pemasangan.
- Pesan grup diabaikan: pembatasan pengirim/penyebutan grup memblokir pengiriman.
- Kesalahan validasi konfigurasi setelah pengeditan: jalankan `openclaw doctor --fix`.
- Signal tidak ada dalam diagnostik: konfirmasikan `channels.signal.enabled: true`.

Pemeriksaan tambahan:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Untuk alur triase: [Pemecahan Masalah Channel](/id/channels/troubleshooting).

## Catatan keamanan

- `signal-cli` menyimpan kunci akun secara lokal (biasanya `~/.local/share/signal-cli/data/`).
- Cadangkan status akun Signal sebelum migrasi atau pembangunan ulang server.
- Pertahankan `channels.signal.dmPolicy: "pairing"` kecuali Anda secara eksplisit menginginkan akses DM yang lebih luas.
- Verifikasi SMS hanya diperlukan untuk alur pendaftaran atau pemulihan, tetapi kehilangan kendali atas nomor/akun dapat mempersulit pendaftaran ulang.

## Referensi konfigurasi (Signal)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.signal.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.signal.apiMode`: `auto | native | container` (default: otomatis). Lihat [Mode kontainer](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 untuk akun bot.
- `channels.signal.accountUuid`: UUID akun bot opsional untuk deteksi @mention native dan perlindungan loop.
- `channels.signal.cliPath`: jalur ke `signal-cli`.
- `channels.signal.configPath`: direktori `signal-cli --config` opsional.
- `channels.signal.httpUrl`: URL daemon lengkap (menggantikan host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: alamat bind daemon (default `127.0.0.1:8080`).
- `channels.signal.autoStart`: jalankan daemon secara otomatis (default true jika `httpUrl` tidak ditetapkan).
- `channels.signal.startupTimeoutMs`: batas waktu tunggu startup dalam ms (min 1000, maks 120000; default 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: lewati pengunduhan lampiran.
- `channels.signal.ignoreStories`: abaikan story dari daemon.
- `channels.signal.sendReadReceipts`: teruskan tanda terima baca.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (default: pemasangan).
- `channels.signal.allowFrom`: daftar yang diizinkan untuk DM (E.164 atau `uuid:<id>`). `open` memerlukan `"*"`. Signal tidak memiliki nama pengguna; gunakan ID telepon/UUID.
- `channels.signal.aliases`: alias sisi OpenClaw untuk target pengiriman DM atau grup.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (default: daftar yang diizinkan).
- `channels.signal.groupAllowFrom`: daftar grup yang diizinkan; menerima ID grup Signal (mentah, `group:<id>`, atau `signal:group:<id>`), nomor E.164 pengirim, atau nilai `uuid:<id>`.
- `channels.signal.groups`: penggantian per grup yang dikunci berdasarkan ID grup Signal (atau `"*"`). Bidang yang didukung: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versi `channels.signal.groups` per akun untuk konfigurasi multiakun.
- `channels.signal.accounts.<id>.aliases`: alias per akun, digabungkan dengan alias tingkat atas.
- `channels.signal.replyToMode`: mode kutipan balasan native, `off | first | all | batched` (default: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: penggantian kutipan balasan native per jenis obrolan.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: penggantian kutipan balasan per akun.
- `channels.signal.historyLimit`: jumlah maksimum pesan grup yang disertakan sebagai konteks (0 menonaktifkan).
- `channels.signal.dmHistoryLimit`: batas riwayat DM dalam giliran pengguna. Penggantian per pengguna: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: ukuran potongan keluar dalam karakter (default 4000).
- `channels.signal.streaming.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.signal.mediaMaxMb`: batas media masuk/keluar dalam MB (default 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (default `minimal`). Lihat [Reaksi](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (default `own`) - saat agen diberi tahu tentang reaksi masuk dari pihak lain.
- `channels.signal.reactionAllowlist`: pengirim yang reaksinya memberi tahu agen ketika `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: kontrol streaming mode blok yang digunakan bersama di seluruh channel. Lihat [Streaming](/id/concepts/streaming).

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (fallback teks biasa; @mention native Signal dideteksi dari metadata terstruktur ketika identitas akun bot dikonfigurasi).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Terkait

- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan

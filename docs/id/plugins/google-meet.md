---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan pengaturan bawaan respons suara agen'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-19T05:23:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2210e0f8148cfa016c418c23cf4019f16e1cd1182888f376d7ef2f436b9b54d7
    source_path: plugins/google-meet.md
    workflow: 16
---

Plugin `google-meet` bergabung ke URL Meet eksplisit atas nama agen OpenClaw. Cakupannya sengaja dibatasi:

- Plugin ini hanya bergabung ke URL `https://meet.google.com/...`; plugin ini tidak pernah melakukan panggilan masuk ke rapat dari nomor telepon yang ditemukannya sendiri.
- `googlemeet create` dapat membuat URL Meet baru melalui Google Meet API (atau mekanisme cadangan browser) dan secara default bergabung ke URL tersebut.
- Partisipasi Chrome menggunakan profil Chrome yang sudah login, secara opsional pada node yang dipasangkan. Partisipasi Twilio memanggil nomor telepon beserta PIN/DTMF melalui [Plugin panggilan suara](/id/plugins/voice-call); Twilio tidak dapat memanggil URL Meet secara langsung.
- `mode: "agent"` (default) mentranskripsikan ucapan peserta dengan penyedia realtime, meneruskannya ke agen OpenClaw yang dikonfigurasi, lalu mengucapkan jawaban dengan TTS OpenClaw biasa. `mode: "bidi"` memungkinkan model suara realtime menjawab secara langsung. `mode: "transcribe"` bergabung hanya sebagai pengamat tanpa balasan suara.
- Tidak ada pengumuman persetujuan otomatis saat plugin bergabung ke panggilan.
- Perintah CLI-nya adalah `googlemeet`; `meet` disediakan untuk alur kerja telekonferensi agen yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal, lalu tetapkan kunci penyedia realtime. OpenAI adalah penyedia transkripsi default untuk mode `agent`; Google Gemini Live tersedia sebagai penyedia suara mode `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# hanya diperlukan ketika realtime.voiceProvider adalah "google" untuk mode bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch` yang digunakan sebagai jalur audio Chrome. Penginstal Homebrew memerlukan mulai ulang sebelum macOS menampilkan perangkat tersebut:

```bash
sudo reboot
```

Setelah mulai ulang, verifikasi kedua komponen:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktifkan plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Periksa penyiapan, lalu bergabung:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Output `setup` dapat dibaca agen serta mempertimbangkan mode/transport: output ini melaporkan profil Chrome, penyematan node, dan, untuk sesi Chrome realtime, jembatan audio BlackHole/SoX serta pemeriksaan pengantar tertunda. Sesi hanya-pengamat melewati prasyarat realtime:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Saat delegasi Twilio dikonfigurasi, `setup` juga melaporkan apakah `voice-call`, kredensial Twilio, dan eksposur Webhook publik sudah siap. Perlakukan setiap pemeriksaan `ok: false` sebagai penghalang bagi transport/mode tersebut sebelum agen bergabung. Gunakan `--json` untuk output yang dapat dibaca mesin, dan `--transport chrome|chrome-node|twilio` untuk memeriksa lebih awal transport tertentu:

```bash
openclaw googlemeet setup --transport twilio
```

Atau biarkan agen bergabung melalui alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Pada host Gateway non-macOS, `google_meet` tetap tersedia untuk tindakan artefak, kalender, penyiapan, transkripsi, Twilio, dan `chrome-node`, tetapi balasan suara Chrome lokal (`transport: "chrome"` dengan `mode: "agent"` atau `"bidi"`) diblokir sebelum mencapai jembatan audio karena jalur tersebut saat ini bergantung pada `BlackHole 2ch` macOS. Gunakan `mode: "transcribe"`, panggilan masuk Twilio, atau host `chrome-node` macOS sebagai gantinya.

### Membuat rapat

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` memiliki dua jalur, yang dilaporkan dalam bidang `source` pada hasil:

- **`api`**: digunakan saat kredensial OAuth Google Meet dikonfigurasi. Deterministik; tidak bergantung pada status UI browser.
- **`browser`**: digunakan tanpa kredensial OAuth. OpenClaw membuka `https://meet.google.com/new` pada node Chrome yang disematkan dan menunggu Google mengalihkan ke URL kode rapat yang sebenarnya; profil Chrome OpenClaw pada node tersebut harus sudah login ke Google. Proses bergabung dan membuat sama-sama menggunakan kembali tab Meet yang sudah ada (atau tab perintah `.../new` / akun Google yang sedang berlangsung) sebelum membuka tab baru; pencocokan tab mengabaikan string kueri yang tidak berbahaya seperti `authuser`.

`create` bergabung secara default dan mengembalikan `joined: true` beserta sesi bergabung. Teruskan `--no-join` (CLI) atau `"join": false` (alat) untuk hanya membuat URL.

Untuk ruang yang dibuat melalui API, tetapkan kebijakan akses eksplisit alih-alih mewarisi default akun Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Siapa yang dapat bergabung tanpa meminta izin                         |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Siapa pun yang memiliki URL Meet                                    |
| `TRUSTED`       | Pengguna tepercaya dari organisasi host, pengguna eksternal yang diundang, dan pengguna panggilan masuk |
| `RESTRICTED`    | Hanya orang yang diundang                                           |

Ini hanya berlaku untuk ruang yang dibuat melalui API, sehingga OAuth harus dikonfigurasi. Jika Anda melakukan autentikasi sebelum opsi ini tersedia, jalankan ulang `openclaw googlemeet auth login --json` setelah menambahkan cakupan `meetings.space.settings` ke layar persetujuan OAuth.

Jika mekanisme cadangan browser mengalami penghalang login Google atau izin Meet, alat akan mengembalikan `manualActionRequired: true` dengan `manualActionReason`, `manualActionMessage`, dan `browser.nodeId`/`browser.targetId`/`browserUrl`. Laporkan pesan tersebut dan berhenti membuka tab Meet baru hingga operator menyelesaikan langkah di browser.

### Bergabung hanya sebagai pengamat

Tetapkan `"mode": "transcribe"` untuk melewati jembatan realtime dupleks (tidak memerlukan BlackHole/SoX dan tanpa balasan suara). Sesi Chrome mode transkripsi juga melewati pemberian izin mikrofon/kamera oleh OpenClaw dan jalur Meet **Use microphone**; jika Meet menampilkan layar perantara pilihan audio, otomatisasi terlebih dahulu mencoba **Continue without microphone**. Transport Chrome terkelola dalam mode ini memasang pengamat teks layar Meet dengan upaya terbaik. `googlemeet status --json` dan `googlemeet doctor` melaporkan `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`, dan ekor `recentTranscript`.

Untuk transkrip sesi terbatas, baca tab Meet terlacak yang tepat:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Pengamat menyimpan paling banyak 2.000 baris teks layar yang selesai pada halaman Meet. Teks progresif yang terlihat tetap berada di ekor kesehatan status hingga baris teks layar selesai, sehingga menyimpan `nextIndex` tidak dapat melewatkan perluasan teks berikutnya; keluar akan menyelesaikan baris yang terlihat sebelum snapshot. `droppedLines` melaporkan baris yang hilang dari bagian awal ketika batas terlampaui. Transkrip dari empat sesi yang paling baru berakhir tetap dapat dibaca hingga Gateway dimulai ulang. Transkrip sesi lama yang telah berakhir mengembalikan `evicted: true`. Ini sengaja menggunakan memori runtime, bukan penyimpanan riwayat rapat yang tahan lama: memulai ulang Gateway, menutup tab sebelum snapshot, atau melampaui batas yang didokumentasikan dapat menghilangkan teks layar.

Untuk pemeriksaan dengar ya/tidak:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Perintah ini bergabung dalam mode transkripsi, menunggu pergerakan teks layar/transkrip baru, lalu mengembalikan `listenVerified`, `listenTimedOut`, bidang tindakan manual, dan kesehatan teks layar saat ini.

### Kesehatan sesi realtime

Selama sesi balasan suara, status `google_meet` melaporkan kesehatan Chrome/jembatan audio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, stempel waktu input/output terakhir, penghitung byte, dan status jembatan tertutup. Sesi Chrome terkelola hanya mengucapkan frasa pengantar/pengujian setelah kesehatan melaporkan `inCall: true`; jika tidak, `speechReady: false` dan upaya pengucapan diblokir alih-alih tidak melakukan apa pun secara diam-diam.

Sesi Chrome lokal menggunakan profil browser OpenClaw yang sudah login dan memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker. Satu perangkat BlackHole cukup untuk pengujian awal, tetapi dapat menimbulkan gema; gunakan perangkat virtual terpisah atau grafik bergaya Loopback untuk audio dupleks yang bersih.

## Gateway lokal + Chrome Parallels

Gateway lengkap atau kunci API model tidak diperlukan di dalam VM macOS jika hanya digunakan untuk menyediakan Chrome. Jalankan Gateway dan agen secara lokal; jalankan host node di VM.

| Dijalankan di mana   | Komponen                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Host Gateway         | OpenClaw Gateway, ruang kerja agen, kunci model/API, penyedia realtime, konfigurasi plugin Google Meet |
| VM macOS Parallels   | CLI/host node OpenClaw, Chrome, SoX, BlackHole 2ch, profil Chrome yang sudah login ke Google    |
| Tidak diperlukan di VM | Layanan Gateway, konfigurasi agen, penyiapan penyedia model                                   |

Instal dependensi VM, mulai ulang, lalu verifikasi:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktifkan plugin di VM dan mulai host node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN tanpa TLS, aktifkan secara eksplisit untuk jaringan privat tepercaya tersebut:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan flag yang sama saat menginstal sebagai LaunchAgent (ini adalah lingkungan proses, disimpan di lingkungan LaunchAgent jika ada pada perintah instalasi, bukan pengaturan `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Setujui node dari host Gateway, lalu pastikan node tersebut mengiklankan `googlemeet.chrome` serta kemampuan browser/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Arahkan Meet melalui node tersebut:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Sekarang bergabung seperti biasa dari host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Untuk pengujian satu perintah yang membuat atau menggunakan kembali sesi, mengucapkan frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama proses bergabung realtime, otomatisasi browser mengisi nama tamu, mengeklik Join/Ask to join, dan menerima perintah "Use microphone" Meet saat pertama kali digunakan jika muncul (atau "Continue without microphone" selama sesi hanya-pengamat dan pembuatan rapat hanya melalui browser). Jika profil telah logout, Meet menunggu persetujuan host, Chrome memerlukan izin mikrofon/kamera, atau Meet macet pada perintah yang belum diselesaikan, hasil akan melaporkan `manualActionRequired: true` dengan `manualActionReason` dan `manualActionMessage`. Hentikan percobaan ulang, laporkan pesan tersebut beserta `browserUrl`/`browserTitle`, dan coba lagi hanya setelah tindakan manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih secara otomatis hanya ketika tepat satu node yang terhubung mengiklankan `googlemeet.chrome` sekaligus kontrol browser; tetapkan `chromeNode.node` (ID node, nama tampilan, atau IP jarak jauh) ketika beberapa node yang mampu terhubung.

### Pemeriksaan kegagalan umum

| Gejala                                                   | Perbaikan                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Node yang ditetapkan dikenali tetapi tidak tersedia. Laporkan penghambat penyiapan; jangan diam-diam beralih ke transport lain kecuali diminta.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Jalankan `openclaw node run` di VM, setujui pemasangan pasangan, lalu jalankan `openclaw plugins enable google-meet` dan `openclaw plugins enable browser` di sana. Pastikan `gateway.nodes.allowCommands` mencakup `googlemeet.chrome` dan `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Instal `blackhole-2ch` pada host yang diperiksa, lalu mulai ulang.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Instal `blackhole-2ch` di VM, lalu mulai ulang VM.                                                                                                                                                                                                                |
| Chrome terbuka tetapi tidak dapat bergabung                             | Masuk ke profil browser di VM, atau biarkan `chrome.guestName` tetap ditetapkan. Bergabung otomatis oleh guest menggunakan otomatisasi browser OpenClaw melalui proksi browser node; arahkan `browser.defaultProfile` milik node (atau profil sesi yang sudah ada dan diberi nama) ke profil yang Anda inginkan. |
| Tab Meet duplikat                                      | Biarkan `chrome.reuseExistingTab: true`. OpenClaw mengaktifkan tab yang sudah ada untuk URL yang sama, dan pembuatan menggunakan kembali `.../new` yang sedang berlangsung atau tab perintah akun Google, sebelum membuka tab lain.                                                                      |
| Tidak ada audio                                                 | Rutekan mikrofon/speaker Meet melalui jalur audio virtual yang digunakan OpenClaw; gunakan perangkat virtual terpisah atau perutean bergaya Loopback untuk audio dupleks yang bersih.                                                                                                              |

## Catatan instalasi

Konfigurasi bawaan respons suara Chrome menggunakan dua alat eksternal yang tidak dibundel atau didistribusikan ulang oleh OpenClaw; instal alat tersebut sebagai dependensi host melalui Homebrew:

- `sox`: utilitas audio baris perintah. Plugin mengeluarkan perintah perangkat CoreAudio eksplisit untuk jembatan audio PCM16 24 kHz bawaan.
- `blackhole-2ch`: driver audio virtual macOS yang menyediakan perangkat `BlackHole 2ch` untuk dirutekan melalui Chrome/Meet.

SoX dilisensikan berdasarkan `LGPL-2.0-only AND GPL-2.0-only`; BlackHole menggunakan GPL-3.0. Jika Anda membuat penginstal atau appliance yang membundel BlackHole dengan OpenClaw, tinjau lisensi hulu BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

| Transport     | Gunakan ketika                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/audio berjalan pada host Gateway                                                        |
| `chrome-node` | Chrome/audio berjalan pada node yang dipasangkan (misalnya VM macOS Parallels)                        |
| `twilio`      | Fallback panggilan masuk telepon melalui Plugin Voice Call, ketika partisipasi Chrome tidak tersedia |

### Chrome

Membuka URL Meet melalui kontrol browser OpenClaw dan bergabung sebagai profil browser OpenClaw yang sudah masuk. Pada macOS, Plugin memeriksa `BlackHole 2ch` sebelum peluncuran dan, jika dikonfigurasi, menjalankan perintah kesehatan/permulaan jembatan audio sebelum membuka Chrome. Untuk Chrome lokal, pilih profil dengan `browser.defaultProfile`; sebagai gantinya, `chrome.browserProfile` diteruskan ke host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Audio mikrofon/speaker Chrome dirutekan melalui jembatan audio OpenClaw lokal. Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan kesalahan penyiapan, alih-alih bergabung tanpa jalur audio.

### Twilio

Rencana panggilan ketat yang didelegasikan kepada [Plugin panggilan suara](/id/plugins/voice-call). Rencana ini tidak mengurai halaman Meet untuk mencari nomor telepon; Google Meet harus menyediakan nomor telepon panggilan masuk dan PIN untuk rapat.

Aktifkan Voice Call pada host Gateway, bukan node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // atau tetapkan "twilio" jika Twilio harus menjadi bawaan
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Bergabunglah ke Google Meet ini sebagai agen OpenClaw. Sampaikan dengan singkat.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Berikan kredensial Twilio melalui lingkungan agar rahasia tidak disimpan di `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Sebagai gantinya, gunakan `realtime.provider: "openai"` dengan `OPENAI_API_KEY` jika OpenAI adalah penyedia suara waktu nyata.

Mulai ulang atau muat ulang Gateway setelah mengaktifkan `voice-call`; perubahan konfigurasi Plugin tidak berlaku hingga dimuat ulang. Verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Ketika delegasi Twilio sudah terhubung, `googlemeet setup` mencakup pemeriksaan `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` untuk urutan khusus, dengan `w` di awal atau koma untuk jeda sebelum PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan pra-pemeriksaan

OAuth bersifat opsional untuk membuat tautan Meet, karena `googlemeet create` dapat beralih ke otomatisasi browser sebagai fallback. Konfigurasikan OAuth untuk pembuatan melalui API resmi, resolusi ruang, atau pra-pemeriksaan Meet Media API. Proses bergabung melalui Chrome/Chrome-node tidak pernah bergantung pada OAuth; proses tersebut tetap menggunakan profil Chrome yang sudah masuk, BlackHole/SoX, dan (untuk `chrome-node`) node yang terhubung.

### Membuat kredensial Google

Di Google Cloud Console:

<Steps>
<Step title="Buat atau pilih proyek">
</Step>
<Step title="Aktifkan Google Meet REST API">
</Step>
<Step title="Konfigurasikan layar persetujuan OAuth">
Internal adalah pilihan paling sederhana untuk organisasi Google Workspace. External dapat digunakan untuk penyiapan pribadi/pengujian; selama aplikasi berada dalam Testing, tambahkan setiap akun Google yang akan memberikan otorisasi sebagai pengguna uji.
</Step>
<Step title="Tambahkan cakupan yang diminta">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (pencarian Kalender)
- `https://www.googleapis.com/auth/drive.meet.readonly` (ekspor isi dokumen transkrip/catatan pintar)

</Step>
<Step title="Buat ID klien OAuth">
Jenis aplikasi **Web application**. URI pengalihan yang diotorisasi:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Salin ID klien dan rahasia klien">
</Step>
</Steps>

`meetings.space.created` diwajibkan oleh `spaces.create`. `meetings.space.readonly` menguraikan URL/kode Meet menjadi ruang. `meetings.space.settings` memungkinkan OpenClaw meneruskan pengaturan `SpaceConfig` seperti `accessType` selama pembuatan ruang melalui API. `meetings.conference.media.readonly` digunakan untuk pra-pemeriksaan Meet Media API dan pekerjaan media; Google mungkin mewajibkan pendaftaran Developer Preview untuk penggunaan Media API yang sebenarnya. `calendar.events.readonly` hanya diperlukan untuk pencarian kalender `--today`/`--event`. `drive.meet.readonly` hanya diperlukan untuk ekspor `--include-doc-bodies`. Jika Anda hanya memerlukan proses bergabung berbasis browser melalui Chrome, lewati OAuth sepenuhnya.

### Membuat token penyegaran

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret` (atau teruskan sebagai variabel lingkungan), lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini menjalankan alur PKCE dengan callback localhost pada `http://localhost:8085/oauth2callback`, lalu mencetak blok konfigurasi `oauth` dengan token penyegaran. Tambahkan `--manual` untuk alur salin/tempel ketika browser tidak dapat menjangkau callback lokal:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Keluaran JSON:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Simpan objek `oauth` di bawah konfigurasi Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Utamakan variabel lingkungan jika Anda tidak ingin token penyegaran berada dalam konfigurasi; konfigurasi diselesaikan terlebih dahulu, lalu lingkungan digunakan sebagai fallback. Jika Anda melakukan autentikasi sebelum dukungan pembuatan rapat, pencarian kalender, atau ekspor isi dokumen tersedia, jalankan kembali `openclaw googlemeet auth login --json` agar token penyegaran mencakup rangkaian cakupan saat ini.

### Memverifikasi OAuth dengan doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Perintah ini memeriksa bahwa konfigurasi OAuth tersedia dan token penyegaran dapat membuat token akses, tanpa memuat runtime Chrome atau memerlukan node yang terhubung. Laporan hanya mencakup kolom status (`ok`, `configured`, `tokenSource`, `expiresAt`, pesan pemeriksaan) dan tidak pernah mencetak token akses, token penyegaran, atau rahasia klien.

| Pemeriksaan                | Arti                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` beserta `oauth.refreshToken`, atau token akses yang disimpan dalam cache, tersedia |
| `oauth-token`        | Token akses yang disimpan dalam cache masih valid, atau token penyegaran membuat token baru    |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` berhasil menguraikan ruang Meet yang sudah ada                       |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` berhasil membuat ruang Meet baru                         |

Buktikan pengaktifan Meet API dan cakupan `spaces.create` dengan pemeriksaan pembuatan yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Buktikan akses baca ke ruang yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`403` dari pemeriksaan ini biasanya berarti Meet REST API dinonaktifkan, token penyegaran tidak memiliki cakupan yang diperlukan, atau akun Google tidak dapat mengakses ruang tersebut. Kesalahan token penyegaran berarti jalankan ulang `openclaw googlemeet auth login --json` dan simpan blok `oauth` yang baru.

OAuth tidak diperlukan untuk fallback browser; autentikasi Google di sana berasal dari profil Chrome yang telah masuk pada node yang dipilih, bukan dari konfigurasi OpenClaw.

Variabel lingkungan berikut diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

### Mengurai, melakukan prapemeriksaan, dan membaca artefak

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Setelah Meet membuat catatan konferensi:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Dengan `--meeting`, `artifacts`, dan `attendance`, catatan konferensi terbaru digunakan secara default; berikan `--all-conference-records` untuk setiap catatan yang dipertahankan.

Pencarian Kalender mengurai URL rapat dari Google Calendar sebelum membaca artefak (memerlukan token penyegaran yang menyertakan cakupan baca-saja acara Kalender):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari acara dengan tautan Meet dalam kalender `primary` hari ini; `--event <query>` mencari teks acara yang cocok; `--calendar <id>` menargetkan kalender nonutama. `calendar-events` menampilkan pratinjau acara yang cocok dan menandai acara yang akan dipilih oleh `latest`/`artifacts`/`attendance`/`export`.

Jika Anda sudah mengetahui ID catatan konferensi, akses secara langsung:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Tutup ruang untuk ruang yang dibuat melalui API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Memanggil `spaces.endActiveConference` dan memerlukan OAuth dengan cakupan `meetings.space.created` untuk ruang yang dapat dikelola oleh akun yang diotorisasi. Menerima URL Meet, kode rapat, atau `spaces/{id}`, lalu terlebih dahulu mengurainya menjadi sumber daya ruang API. Ini terpisah dari `googlemeet leave`: `leave` menghentikan partisipasi lokal/sesi OpenClaw; `end-active-conference` meminta Google Meet mengakhiri konferensi aktif untuk ruang tersebut.

Tulis laporan yang mudah dibaca:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` mengembalikan metadata catatan konferensi beserta metadata sumber daya peserta, rekaman, transkrip, entri transkrip terstruktur, dan catatan cerdas saat Google menyediakannya. `--no-transcript-entries` melewati pencarian entri untuk rapat besar. `attendance` mengembangkan peserta menjadi baris sesi peserta dengan waktu pertama/terakhir terlihat, total durasi sesi, penanda terlambat/keluar lebih awal, serta menggabungkan sumber daya peserta duplikat berdasarkan pengguna yang masuk atau nama tampilan; `--no-merge-duplicates` mempertahankan sumber daya mentah secara terpisah, sedangkan `--late-after-minutes`/`--early-before-minutes` menyesuaikan ambang batas.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`. `manifest.json` mencatat masukan yang dipilih, opsi ekspor, catatan konferensi, berkas keluaran, jumlah, sumber token, acara Kalender yang digunakan, dan peringatan pengambilan parsial. `--zip` juga menulis arsip portabel di samping folder. `--include-doc-bodies` mengekspor teks Google Docs dari transkrip/catatan cerdas tertaut melalui Drive `files.export` (memerlukan cakupan baca-saja Drive Meet); tanpanya, ekspor hanya menyertakan metadata Meet dan entri transkrip terstruktur. Kegagalan artefak parsial (kesalahan pencantuman catatan cerdas, entri transkrip, atau isi dokumen) mempertahankan peringatan dalam ringkasan/manifes alih-alih menggagalkan seluruh ekspor. `--dry-run` mengambil data yang sama dan mencetak JSON manifes tanpa membuat folder atau ZIP.

Agen menggunakan tindakan yang sama melalui alat `google_meet` (`export`, `create` dengan `accessType`, `end_active_conference`, `test_listen`); lihat [Alat](#tool).

### Uji singkat langsung

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variabel                                                                                                                  | Tujuan                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Mengaktifkan pengujian langsung yang dilindungi                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL Meet, kode, atau `spaces/{id}` yang dipertahankan                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | ID klien OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token penyegaran                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Opsional; nama fallback yang sama tanpa prefiks `OPENCLAW_` juga berfungsi |

Uji singkat artefak/kehadiran dasar memerlukan `meetings.space.readonly` dan `meetings.conference.media.readonly`. Pencarian Kalender memerlukan `calendar.events.readonly`. Ekspor isi dokumen Drive memerlukan `drive.meet.readonly`.

### Contoh pembuatan

```bash
openclaw googlemeet create
```

Mencetak URI rapat baru, sumber, dan sesi bergabung. Dengan OAuth, perintah ini menggunakan Meet API; tanpanya, perintah ini menggunakan profil yang telah masuk pada node Chrome yang disematkan. JSON fallback browser:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Jika fallback browser lebih dahulu menemui login Google atau penghalang izin Meet, `google_meet` mengembalikan detail terstruktur, bukan string biasa:

```json
{
  "source": "browser",
  "error": "google-login-required: Masuk ke Google di profil browser OpenClaw, lalu coba lagi pembuatan rapat.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Masuk ke Google di profil browser OpenClaw, lalu coba lagi pembuatan rapat.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON pembuatan melalui API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Pembuatan akan bergabung secara default, tetapi Chrome/Chrome-node tetap memerlukan profil Google yang telah masuk untuk bergabung melalui browser; jika telah keluar, OpenClaw melaporkan `manualActionRequired: true` atau kesalahan fallback browser dan meminta operator menyelesaikan login Google sebelum mencoba lagi.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah memastikan proyek Cloud, prinsipal OAuth, dan peserta rapat Anda terdaftar dalam Google Workspace Developer Preview Program untuk API media Meet.

## Konfigurasi

Jalur agen Chrome umum hanya memerlukan Plugin diaktifkan, BlackHole, SoX, kunci penyedia waktu nyata, dan penyedia TTS OpenClaw yang dikonfigurasi:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

### Default

| Kunci                               | Default                                  | Catatan                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` diterima sebagai alias lama untuk `"agent"`; pemanggil baru sebaiknya menggunakan `"agent"`                                                                                                                        |
| `chromeNode.node`                 | tidak disetel                                    | Id/nama/IP Node untuk `chrome-node`; wajib ketika lebih dari satu node berkemampuan mungkin terhubung                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Luncurkan Chrome untuk bergabung; setel `false` hanya ketika menggunakan kembali sesi yang sudah terbuka                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Ditampilkan pada layar tamu Meet yang belum masuk                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | Upaya terbaik untuk mengisi nama tamu dan mengeklik Join Now pada `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Mengaktifkan tab Meet yang ada alih-alih membuka duplikat                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Tunggu hingga tab Meet melaporkan bahwa panggilan telah berlangsung sebelum intro respons suara diputar                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Format audio pasangan perintah; `"g711-ulaw-8khz"` hanya untuk pasangan perintah lama/kustom yang menghasilkan audio telefoni                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | Buffer pemrosesan SoX untuk perintah audio pasangan perintah yang dihasilkan (setengah dari buffer default SoX sebesar 8192 byte, sehingga menurunkan latensi pipe); nilai dibatasi hingga minimum 17 byte                                         |
| `chrome.audioInputCommand`        | perintah SoX yang dihasilkan                    | Membaca dari CoreAudio `BlackHole 2ch`, menulis audio dalam `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | perintah SoX yang dihasilkan                    | Membaca audio dalam `chrome.audioFormat`, menulis ke CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | tidak disetel                                    | Perintah mikrofon lokal opsional yang menulis PCM mono little-endian 16-bit bertanda untuk mendeteksi interupsi manusia selama pemutaran asisten; berlaku pada jembatan pasangan perintah yang dihosting Gateway                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Level RMS yang dianggap sebagai interupsi manusia                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Level puncak yang dianggap sebagai interupsi manusia                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | Jeda minimum antara penghapusan interupsi berulang                                                                                                                                                                |
| `mode` (per permintaan)              | `"agent"`                                | Mode respons suara; lihat tabel [Mode agen dan bidi](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | Fallback kompatibilitas yang digunakan ketika bidang dengan cakupan di bawah tidak disetel                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | Id penyedia yang digunakan oleh mode `agent` untuk transkripsi waktu nyata                                                                                                                                                       |
| `realtime.voiceProvider`          | tidak disetel                                    | Id penyedia yang digunakan oleh mode `bidi` untuk suara waktu nyata langsung; setel ke `"google"` untuk Gemini Live sambil mempertahankan transkripsi mode agen pada OpenAI. Pasangkan dengan `realtime.model` untuk memilih model Gemini Live tertentu. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Lihat [Mode agen dan bidi](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | instruksi singkat untuk jawaban lisan          | Memerintahkan model untuk berbicara secara ringkas dan menggunakan `openclaw_agent_consult` untuk jawaban yang lebih mendalam                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Diucapkan sekali ketika jembatan waktu nyata terhubung; setel ke `""` untuk bergabung tanpa suara                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | Id agen OpenClaw yang digunakan untuk `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | Mendelegasikan panggilan PSTN Twilio, DTMF, dan salam pembuka ke plugin Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Waktu tunggu awal sebelum memutar urutan DTMF yang berasal dari PIN melalui Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Jeda sebelum meminta salam pembuka waktu nyata setelah Voice Call memulai jalur Twilio                                                                                                                        |

`chrome.audioBridgeCommand` dan `chrome.audioBridgeHealthCommand` memungkinkan jembatan eksternal mengendalikan seluruh jalur audio lokal sebagai pengganti `chrome.audioInputCommand`/`chrome.audioOutputCommand`; lihat [Catatan](#notes) untuk batasan mengenai mode yang dapat menggunakannya.

Tersedia migrasi `openclaw doctor --fix` untuk bentuk lama `realtime.provider: "google"`: migrasi tersebut memindahkan maksud itu ke `realtime.voiceProvider: "google"` beserta `realtime.transcriptionProvider: "openai"` ketika bidang-bidang tersebut belum disetel.

### Penggantian opsional

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Ucapkan persis: Saya di sini.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs untuk mendengarkan dan berbicara dalam mode agen:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Suara Meet persisten berasal dari `messages.tts.providers.elevenlabs.speakerVoiceId`. Jawaban agen juga dapat menggunakan arahan `[[tts:speakerVoiceId=... model=eleven_v3]]` per jawaban ketika penggantian model TTS diaktifkan, tetapi konfigurasi merupakan default deterministik untuk rapat. Saat bergabung, log menampilkan `transcriptionProvider=elevenlabs`, dan setiap jawaban lisan dicatat sebagai `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Konfigurasi khusus Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

Dengan `voiceCall.enabled: true` (default) dan transport Twilio, Voice Call menjalankan urutan DTMF sebelum membuka aliran media waktu nyata, lalu menggunakan teks pembuka yang tersimpan sebagai salam awal waktu nyata. Jika `voice-call` tidak diaktifkan, Google Meet tetap dapat memvalidasi dan mencatat rencana panggilan, tetapi tidak dapat melakukan panggilan Twilio.

Biarkan `voiceCall.gatewayUrl` tidak disetel untuk menggunakan runtime Gateway tepercaya lokal, yang mempertahankan
agen pemanggil selama keseluruhan panggilan. URL Gateway yang dikonfigurasi tetap menjadi target WebSocket eksplisit dan
tidak dapat mengautentikasi asal-usul plugin; penggabungan agen non-default gagal secara tertutup alih-alih secara diam-diam
menggunakan agen lain. Jalankan Google Meet dan Voice Call dalam proses Gateway yang sama ketika perutean per agen
diperlukan.

## Alat

Agen menggunakan alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Tujuan                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Bergabung ke URL Meet eksplisit                                                                         |
| `create`                | Membuat ruang (dan bergabung secara default); mendukung `accessType`/`entryPointAccess`                    |
| `status`                | Mencantumkan sesi aktif, atau memeriksa salah satunya berdasarkan `sessionId`                                               |
| `setup_status`          | Menjalankan pemeriksaan yang sama dengan `googlemeet setup`                                                         |
| `resolve_space`         | Menguraikan URL/kode/`spaces/{id}` melalui `spaces.get`                                                 |
| `preflight`             | Memvalidasi prasyarat OAuth + resolusi rapat                                                 |
| `latest`                | Menemukan catatan konferensi terbaru untuk rapat                                                   |
| `calendar_events`       | Mempratinjau acara Calendar dengan tautan Meet                                                           |
| `artifacts`             | Mencantumkan catatan konferensi serta metadata peserta/rekaman/transkrip/catatan pintar                  |
| `attendance`            | Mencantumkan peserta dan sesi peserta                                                        |
| `export`                | Menulis bundel artefak/kehadiran/transkrip/manifes; setel `"dryRun": true` hanya untuk manifes |
| `recover_current_tab`   | Memfokuskan/memeriksa tab Meet yang ada tanpa membuka tab baru                                      |
| `transcript`            | Membaca transkrip teks layar berbatas; `sinceIndex` melanjutkan dari `nextIndex` sebelumnya           |
| `leave`                 | Mengakhiri sesi (Chrome mengeklik tombol Keluar; hanya menutup tab yang dibukanya; Twilio menutup panggilan)                  |
| `end_active_conference` | Mengakhiri konferensi Google Meet aktif untuk ruang yang dikelola API                                    |
| `speak`                 | Membuat agen waktu nyata langsung berbicara, dengan `sessionId` dan `message`                        |
| `test_speech`           | Membuat/menggunakan kembali sesi, memicu frasa yang diketahui, mengembalikan status Chrome                              |
| `test_listen`           | Membuat/menggunakan kembali sesi khusus pengamatan, menunggu pergerakan teks layar/transkrip                        |

`test_speech` selalu memaksakan `mode: "agent"` atau `"bidi"` dan gagal jika diminta berjalan dalam `mode: "transcribe"`, karena sesi khusus pengamatan tidak dapat menghasilkan ucapan. Hasil `speechOutputVerified` didasarkan pada peningkatan byte keluaran audio waktu nyata selama panggilan tersebut, sehingga sesi yang digunakan kembali dengan audio lama tidak dihitung sebagai pemeriksaan baru.

Untuk transportasi Chrome, `leave` membiarkan tab milik pengguna yang digunakan kembali tetap terbuka setelah mengeklik tombol keluar dari panggilan milik Meet. Tab yang dibuka oleh OpenClaw ditutup setelah keluar.

Gunakan `transport: "chrome"` ketika Chrome berjalan pada host Gateway, `transport: "chrome-node"` ketika berjalan pada node yang dipasangkan. Dalam kedua kasus, penyedia model dan `openclaw_agent_consult` berjalan pada host Gateway, sehingga kredensial model tetap berada di sana. Log mode agen menyertakan penyedia/model transkripsi yang telah diuraikan saat bridge dimulai serta penyedia/model/suara/format keluaran/laju sampel TTS setelah setiap balasan yang disintesis. `mode: "realtime"` mentah masih diterima sebagai alias kompatibilitas lama untuk `mode: "agent"`, tetapi tidak lagi ditampilkan dalam enum `mode` milik alat.

`create` dengan ruang yang didukung API dan kebijakan akses eksplisit:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Mengakhiri konferensi aktif ruang yang diketahui:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Validasi dengarkan-dahulu sebelum menyatakan suatu rapat berguna:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Berbicara sesuai permintaan:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Ucapkan persis: Saya di sini dan sedang mendengarkan."
}
```

`status` menyertakan status Chrome jika tersedia:

| Bidang                                                                 | Arti                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome tampaknya berada di dalam panggilan Meet                                                                              |
| `micMuted`                                                            | Status mikrofon Meet berdasarkan upaya terbaik                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Profil browser memerlukan login manual, penerimaan oleh host Meet, izin, atau perbaikan kontrol browser sebelum ucapan dapat berfungsi |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Apakah ucapan Chrome terkelola diizinkan saat ini; `speechReady: false` berarti OpenClaw tidak mengirim frasa pengantar/pengujian   |
| `providerConnected` / `realtimeReady`                                 | Status bridge suara waktu nyata                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | Audio terakhir yang terlihat dari/dikirim ke bridge                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Apakah keluaran media tab Meet dirutekan secara aktif ke perangkat BlackHole milik bridge                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Masukan loopback diabaikan saat pemutaran asisten aktif                                                              |

## Mode agen dan bidi

| Mode    | Siapa yang menentukan jawaban        | Jalur keluaran ucapan                     | Gunakan ketika                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Agen OpenClaw yang dikonfigurasi | Runtime TTS OpenClaw normal            | Anda menginginkan perilaku "agen saya berada dalam rapat"        |
| `bidi`  | Model suara waktu nyata      | Respons audio penyedia suara waktu nyata | Anda menginginkan loop suara percakapan dengan latensi terendah |

Mode `agent`: penyedia transkripsi waktu nyata mendengar audio rapat, transkrip akhir peserta dirutekan melalui agen OpenClaw yang dikonfigurasi, dan jawaban diucapkan melalui TTS OpenClaw biasa. Fragmen transkrip akhir yang berdekatan digabungkan sebelum konsultasi agar satu giliran ucapan tidak menghasilkan beberapa jawaban parsial yang kedaluwarsa; masukan waktu nyata ditekan saat audio asisten dalam antrean masih diputar, dan gema transkrip terbaru yang menyerupai asisten diabaikan sebelum konsultasi agar loopback BlackHole tidak membuat agen menjawab ucapannya sendiri.

Mode `bidi`: model suara waktu nyata menjawab secara langsung dan dapat memanggil `openclaw_agent_consult` untuk penalaran yang lebih mendalam, informasi terkini, atau alat OpenClaw normal. Alat konsultasi menjalankan agen OpenClaw biasa di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan yang ringkas; dalam mode `agent`, OpenClaw mengirim jawaban tersebut langsung ke TTS, sedangkan dalam mode `bidi`, model suara waktu nyata dapat mengucapkannya kembali. Mode ini menggunakan mekanisme konsultasi bersama yang sama dengan Voice Call.

Secara default, konsultasi dijalankan terhadap agen `main`; setel `realtime.agentId` untuk mengarahkan jalur Meet ke ruang kerja agen khusus, default model, kebijakan alat, memori, dan riwayat sesi. Konsultasi mode agen menggunakan kunci sesi `agent:<id>:subagent:google-meet:<session>` per rapat agar pertanyaan lanjutan mempertahankan konteks rapat sekaligus mewarisi kebijakan agen normal. Ketika agen memanggil `google_meet` dalam mode agen, sesi konsultan membuat percabangan dari transkrip pemanggil saat ini sebelum menjawab ucapan peserta; sesi Meet tetap terpisah agar tindak lanjut rapat tidak secara langsung mengubah transkrip pemanggil.

`realtime.toolPolicy` mengontrol proses konsultasi:

| Kebijakan           | Perilaku                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Menampilkan alat konsultasi; membatasi agen biasa pada `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Menampilkan alat konsultasi; mengizinkan agen biasa menggunakan kebijakan alat normalnya                                                        |
| `none`           | Tidak menampilkan alat konsultasi kepada model suara waktu nyata                                                                       |

Kunci sesi konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

Paksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pengujian singkat bergabung-dan-berbicara lengkap:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Daftar periksa pengujian langsung

Sebelum menyerahkan rapat kepada agen tanpa pengawasan:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Status Chrome-node yang diharapkan:

- `googlemeet setup` seluruhnya hijau, dan menyertakan `chrome-node-connected` ketika Chrome-node merupakan transportasi default atau sebuah node disematkan.
- `nodes status` menampilkan node yang dipilih dalam keadaan terhubung, mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung, dan `test-speech` mengembalikan status Chrome dengan `inCall: true`.

Untuk host Chrome jarak jauh seperti VM macOS Parallels, pemeriksaan aman tersingkat setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Hal tersebut membuktikan bahwa plugin Gateway telah dimuat, node VM terhubung dengan token saat ini, dan bridge audio Meet tersedia sebelum agen membuka tab rapat nyata.

Untuk pengujian singkat Twilio, gunakan rapat yang menyediakan detail bergabung melalui telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` mencakup pemeriksaan `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan `twilio-voice-call-webhook` berwarna hijau.
- `voicecall` tersedia di CLI setelah Gateway dimuat ulang.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan sebuah `twilio.voiceCallId`.
- `openclaw logs --follow` menunjukkan TwiML DTMF disajikan sebelum TwiML waktu nyata, lalu bridge waktu nyata dengan salam awal dimasukkan ke antrean.
- `googlemeet leave <sessionId>` mengakhiri panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat alat Google Meet

Pastikan plugin diaktifkan dan muat ulang Gateway; agen yang sedang berjalan hanya melihat alat plugin yang didaftarkan oleh proses Gateway saat ini:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Pada host Gateway non-macOS, `google_meet` tetap terlihat, tetapi tindakan bicara balik Chrome lokal diblokir sebelum mencapai bridge audio. Gunakan `mode: "transcribe"`, panggilan masuk Twilio, atau host `chrome-node` macOS sebagai pengganti jalur agen Chrome lokal default.

### Tidak ada Node berkemampuan Google Meet yang terhubung

Pada host Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Pada host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node harus terhubung dan mencantumkan `googlemeet.chrome` serta `browser.proxy`; konfigurasi Gateway harus mengizinkan keduanya:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jika `googlemeet setup` gagal pada `chrome-node-connected`, atau log Gateway melaporkan `gateway token mismatch`, instal ulang atau mulai ulang Node dengan token Gateway saat ini:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Kemudian muat ulang layanan Node dan jalankan kembali:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-listen` untuk bergabung hanya sebagai pengamat atau `googlemeet test-speech` untuk bergabung secara waktu nyata, lalu periksa status kesehatan Chrome yang dikembalikan. Jika salah satunya melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator dan hentikan percobaan ulang hingga tindakan browser selesai.

Tindakan manual umum: masuk ke profil Chrome; izinkan tamu masuk dari akun host Meet; berikan izin mikrofon/kamera Chrome ketika dialog native muncul; tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "belum masuk" hanya karena Meet bertanya "Do you want people to hear you in the meeting?"; itu adalah layar perantara pilihan audio Meet. OpenClaw mengeklik **Use microphone** melalui otomatisasi browser jika tersedia dan terus menunggu status rapat yang sebenarnya; untuk fallback browser khusus pembuatan, OpenClaw mungkin mengeklik **Continue without microphone** sebagai gantinya karena pembuatan URL tidak memerlukan jalur audio waktu nyata.

### Pembuatan rapat gagal

`googlemeet create` menggunakan API Meet `spaces.create` ketika OAuth dikonfigurasi; jika tidak, browser Node Chrome yang disematkan digunakan. Pastikan:

- **Pembuatan melalui API**: `oauth.clientId` dan `oauth.refreshToken` (atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang sesuai) tersedia, dan token penyegaran dibuat setelah dukungan pembuatan ditambahkan; token lama mungkin tidak memiliki `meetings.space.created`, jadi jalankan kembali `openclaw googlemeet auth login --json`.
- **Fallback browser**: `defaultTransport: "chrome-node"` dan `chromeNode.node` mengarah ke Node terhubung yang memiliki `browser.proxy` dan `googlemeet.chrome`; profil Chrome OpenClaw pada Node tersebut sudah masuk dan dapat membuka `https://meet.google.com/new`.
- **Percobaan ulang fallback browser**: gunakan kembali tab prompt `.../new` atau akun Google yang sudah ada sebelum membuka tab baru; coba ulang panggilan alat, bukan membuka tab lain secara manual.
- **Tindakan manual**: jika alat mengembalikan `manualActionRequired: true`, gunakan `browser.nodeId`, `browser.targetId`, `browserUrl`, dan `manualActionMessage` untuk memandu operator; jangan mencoba ulang dalam perulangan.
- **Layar perantara pilihan audio**: jika Meet menampilkan "Do you want people to hear you in the meeting?", biarkan tab tetap terbuka. OpenClaw seharusnya mengeklik **Use microphone** atau (khusus pembuatan) **Continue without microphone** dan terus menunggu URL yang dihasilkan; jika tidak dapat melakukannya, galat seharusnya menyebutkan `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "agent"` untuk jalur STT -> agen OpenClaw -> TTS, dan `mode: "bidi"` untuk fallback suara waktu nyata langsung. `mode: "transcribe"` sengaja tidak memulai bridge bicara balik. Untuk debugging hanya sebagai pengamat, jalankan `openclaw googlemeet status --json <session-id>` setelah peserta berbicara dan periksa `captioning`, `transcriptLines`, `lastCaptionText`. Jika `inCall` bernilai true tetapi `transcriptLines` tetap `0`, teks layar Meet mungkin dinonaktifkan, belum ada yang berbicara sejak pengamat dipasang, UI Meet berubah, atau teks layar langsung tidak tersedia untuk bahasa/akun rapat tersebut.

`googlemeet test-speech` selalu memeriksa jalur waktu nyata dan melaporkan apakah byte keluaran bridge teramati untuk pemanggilan tersebut. Jika `speechOutputVerified` bernilai false dan `speechOutputTimedOut` bernilai true, penyedia waktu nyata mungkin telah menerima ucapan tersebut, tetapi OpenClaw tidak melihat byte keluaran baru mencapai bridge audio Chrome.

Pastikan juga: kunci penyedia waktu nyata (`OPENAI_API_KEY` atau `GEMINI_API_KEY`) tersedia pada host Gateway; `BlackHole 2ch` terlihat pada host Chrome; `sox` tersedia di sana; mikrofon/speaker Meet dirutekan melalui jalur audio virtual (`doctor` seharusnya menampilkan `meet output routed: yes` untuk proses bergabung waktu nyata melalui Chrome lokal).

`googlemeet doctor [session-id]` mencetak sesi, Node, status dalam panggilan, alasan tindakan manual, koneksi penyedia waktu nyata, `realtimeReady`, aktivitas masukan/keluaran audio, stempel waktu audio terakhir, penghitung byte, dan URL browser. Gunakan `googlemeet status [session-id] --json` untuk JSON mentah, serta `googlemeet doctor --oauth` (tambahkan `--meeting` atau `--create-space`) untuk memverifikasi penyegaran OAuth tanpa mengekspos token.

Jika waktu agen habis dan tab Meet sudah terbuka, periksa tab tersebut tanpa membuka tab lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Tindakan alat yang setara adalah `recover_current_tab`: tindakan ini memfokuskan dan memeriksa tab Meet yang sudah ada untuk transport yang dipilih (kontrol browser lokal untuk `chrome`, Node yang dikonfigurasi untuk `chrome-node`) tanpa membuka tab atau sesi baru, serta melaporkan penghambat saat ini (login, izin bergabung, perizinan, status pilihan audio). Perintah CLI berkomunikasi dengan Gateway yang dikonfigurasi, yang harus sedang berjalan; `chrome-node` juga mengharuskan Node terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal ketika `voice-call` tidak diizinkan atau tidak diaktifkan: tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, lalu muat ulang Gateway.

`twilio-voice-call-credentials` gagal ketika backend Twilio tidak memiliki SID akun, token autentikasi, atau nomor penelepon:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` gagal ketika `voice-call` tidak memiliki eksposur Webhook publik, atau `publicUrl` mengarah ke ruang jaringan loopback/pribadi. Jangan gunakan `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, atau `fd00::/8` sebagai `publicUrl`; callback operator telepon tidak dapat menjangkaunya. Atur `plugins.entries.voice-call.config.publicUrl` ke URL publik, atau konfigurasikan eksposur tunnel/Tailscale:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Untuk pengembangan lokal, gunakan eksposur tunnel atau Tailscale sebagai pengganti URL host pribadi:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // atau
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Mulai ulang atau muat ulang Gateway, lalu:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Secara default, `voicecall smoke` hanya memeriksa kesiapan. Lakukan uji coba tanpa eksekusi untuk nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya jika Anda sengaja ingin melakukan panggilan keluar langsung:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah memasuki rapat

Pastikan acara Meet menyediakan detail panggilan masuk telepon, lalu teruskan nomor panggilan masuk serta PIN yang tepat atau urutan DTMF khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan `w` di awal atau koma dalam `--dtmf-sequence` untuk memberi jeda sebelum PIN.

Jika panggilan dibuat tetapi daftar peserta Meet tidak pernah menampilkan peserta panggilan masuk:

- `openclaw googlemeet doctor <session-id>`: pastikan ID panggilan Twilio yang didelegasikan, apakah DTMF dimasukkan ke antrean, dan apakah salam pembuka diminta.
- `openclaw voicecall status --call-id <id>`: pastikan panggilan masih aktif.
- `openclaw voicecall tail`: pastikan Webhook Twilio tiba di Gateway.
- `openclaw logs --follow`: cari urutan Twilio Meet: Google Meet mendelegasikan proses bergabung, Voice Call menyimpan dan menyajikan TwiML DTMF prapenyambungan, Voice Call menyajikan TwiML waktu nyata untuk panggilan Twilio, lalu Google Meet meminta ucapan pembuka dengan `voicecall.speak`.
- Jalankan kembali `openclaw googlemeet setup --transport twilio`; pemeriksaan penyiapan berwarna hijau diwajibkan, tetapi tidak membuktikan bahwa urutan PIN rapat sudah benar.
- Pastikan nomor panggilan masuk berasal dari undangan dan wilayah Meet yang sama dengan PIN.
- Naikkan `voiceCall.dtmfDelayMs` dari nilai default 12 detik jika Meet lambat menjawab atau transkrip panggilan masih menampilkan prompt PIN setelah DTMF prapenyambungan dikirim.
- Jika peserta berhasil bergabung tetapi salam tidak terdengar, periksa `openclaw logs --follow` untuk permintaan `voicecall.speak` pasca-DTMF dan pemutaran TTS aliran media atau fallback `<Say>` Twilio. Jika transkrip masih menampilkan "enter the meeting PIN", sambungan telepon belum bergabung ke ruang Meet, sehingga peserta tidak akan mendengar ucapan.

Jika Webhook tidak tiba, debug plugin Voice Call terlebih dahulu: penyedia harus dapat mencapai `plugins.entries.voice-call.config.publicUrl` atau tunnel yang dikonfigurasi. Lihat [Pemecahan masalah panggilan suara](/id/plugins/voice-call#troubleshooting).

## Catatan

API media resmi Google Meet berorientasi pada penerimaan, sehingga berbicara ke dalam panggilan tetap memerlukan jalur peserta. Plugin ini membuat batas tersebut tetap terlihat: Chrome menangani partisipasi melalui browser dan perutean audio lokal; Twilio menangani partisipasi melalui panggilan masuk telepon.

Mode bicara balik Chrome memerlukan `BlackHole 2ch` serta salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw mengelola bridge dan menyalurkan audio dalam `chrome.audioFormat` antara perintah-perintah tersebut dan penyedia yang dipilih. Mode `agent` menggunakan transkripsi waktu nyata serta TTS reguler; mode `bidi` menggunakan penyedia suara waktu nyata. Jalur default adalah PCM16 24 kHz dengan `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah bridge eksternal mengelola seluruh jalur audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya. Hanya valid untuk `bidi`, karena mode `agent` memerlukan akses langsung ke pasangan perintah untuk TTS.

Dengan bridge Chrome berbasis pasangan perintah, `chrome.bargeInInputCommand` dapat mendengarkan mikrofon lokal terpisah dan menghentikan pemutaran asisten saat seseorang mulai berbicara, sehingga ucapan manusia tetap didahulukan daripada keluaran asisten meskipun input loopback BlackHole bersama dinonaktifkan sementara selama pemutaran asisten. Seperti `chrome.audioInputCommand`/`chrome.audioOutputCommand`, ini adalah perintah lokal yang dikonfigurasi operator: gunakan jalur perintah tepercaya atau daftar argumen yang eksplisit, jangan pernah menggunakan skrip dari lokasi yang tidak tepercaya.

Untuk audio dupleks yang bersih, rutekan keluaran Meet dan mikrofon Meet melalui perangkat virtual terpisah atau grafik perangkat virtual bergaya Loopback; satu perangkat BlackHole bersama dapat memantulkan suara peserta lain kembali ke panggilan.

`googlemeet speak` memicu bridge audio balas bicara yang aktif untuk sesi Chrome; `googlemeet leave` menghentikannya (dan, untuk sesi Twilio yang didelegasikan melalui Voice Call, mengakhiri panggilan yang mendasarinya). Gunakan `googlemeet end-active-conference` untuk sekaligus menutup konferensi Google Meet yang aktif pada ruang yang dikelola melalui API.

## Terkait

- [Ikhtisar Plugin rapat](/id/plugins/meeting-plugins)
- [Plugin panggilan suara](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun Plugin](/id/plugins/building-plugins)

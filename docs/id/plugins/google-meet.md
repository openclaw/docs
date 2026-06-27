---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung dengan URL Meet eksplisit melalui Chrome atau Twilio dengan default talk-back agen'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Dukungan peserta Google Meet untuk OpenClaw — plugin ini dibuat eksplisit sesuai desain:

- Hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke URL
  yang dikembalikan.
- `agent` adalah mode balas-bicara default: transkripsi realtime mendengarkan,
  agent OpenClaw yang dikonfigurasi menjawab, dan TTS OpenClaw biasa berbicara ke Meet.
- `bidi` tetap tersedia sebagai mode cadangan model suara realtime langsung.
- Agent memilih perilaku bergabung dengan `mode`: gunakan `agent` untuk
  dengar/balas-bicara langsung, `bidi` untuk cadangan suara realtime langsung, atau `transcribe`
  untuk bergabung/mengendalikan browser tanpa jembatan balas-bicara.
- Auth dimulai sebagai OAuth Google pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau di host node yang dipasangkan.
- Twilio menerima nomor dial-in ditambah PIN atau urutan DTMF opsional; Twilio
  tidak dapat menghubungi URL Meet secara langsung.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja telekonferensi agent
  yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan konfigurasikan penyedia transkripsi realtime
ditambah TTS OpenClaw biasa. OpenAI adalah penyedia transkripsi default; Google Gemini Live juga berfungsi sebagai cadangan suara `bidi` terpisah dengan
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch`. Penginstal
Homebrew memerlukan reboot sebelum macOS menampilkan perangkat tersebut:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua komponen:

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

Periksa penyiapan:

```bash
openclaw googlemeet setup
```

Output penyiapan dimaksudkan agar dapat dibaca agent dan peka mode. Output ini melaporkan profil Chrome
, penyematan node, dan, untuk bergabung Chrome realtime, jembatan audio BlackHole/SoX
serta pemeriksaan intro realtime tertunda. Untuk bergabung hanya-observasi, periksa transport yang sama
dengan `--mode transcribe`; mode itu melewati prasyarat audio realtime
karena tidak mendengarkan melalui atau berbicara melalui jembatan:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Ketika delegasi Twilio dikonfigurasi, penyiapan juga melaporkan apakah
plugin `voice-call`, kredensial Twilio, dan eksposur Webhook publik sudah siap.
Perlakukan pemeriksaan `ok: false` apa pun sebagai pemblokir untuk transport dan mode yang diperiksa
sebelum meminta agent bergabung. Gunakan `openclaw googlemeet setup --json` untuk
skrip atau output yang dapat dibaca mesin. Gunakan `--transport chrome`,
`--transport chrome-node`, atau `--transport twilio` untuk melakukan preflight transport tertentu
sebelum agent mencobanya.

Untuk Twilio, selalu lakukan preflight transport secara eksplisit ketika transport default
adalah Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Ini menangkap wiring `voice-call` yang hilang, kredensial Twilio, atau eksposur
Webhook yang tidak dapat dijangkau sebelum agent mencoba menghubungi rapat.

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agent bergabung melalui tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Tool `google_meet` yang menghadap agent tetap tersedia pada host non-macOS untuk
alur artefak, kalender, penyiapan, transkripsi, Twilio, dan `chrome-node`. Tindakan
balas-bicara Chrome lokal diblokir di sana karena jalur audio Chrome bawaan
saat ini bergantung pada `BlackHole 2ch` macOS. Di Linux, gunakan `mode: "transcribe"`,
dial-in Twilio, atau host `chrome-node` macOS untuk partisipasi balas-bicara
Chrome.

Buat rapat baru dan bergabung:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Untuk ruang yang dibuat API, gunakan Google Meet `SpaceConfig.accessType` ketika Anda ingin
kebijakan tanpa-ketuk ruang tersebut eksplisit alih-alih diwarisi dari default akun Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` memungkinkan siapa pun yang memiliki URL Meet bergabung tanpa mengetuk. `TRUSTED` memungkinkan
pengguna tepercaya organisasi host, pengguna eksternal yang diundang, dan pengguna dial-in
bergabung tanpa mengetuk. `RESTRICTED` membatasi masuk tanpa-ketuk hanya untuk undangan. Pengaturan ini
hanya berlaku pada jalur pembuatan Google Meet API resmi, jadi kredensial OAuth
harus dikonfigurasi.

Jika Anda mengautentikasi Google Meet sebelum opsi ini tersedia, jalankan ulang
`openclaw googlemeet auth login --json` setelah menambahkan scope
`meetings.space.settings` ke layar persetujuan Google OAuth Anda.

Buat hanya URL tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Buat API: digunakan ketika kredensial OAuth Google Meet dikonfigurasi. Ini adalah
  jalur paling deterministik dan tidak bergantung pada status UI browser.
- Cadangan browser: digunakan ketika kredensial OAuth tidak ada. OpenClaw menggunakan
  node Chrome yang disematkan, membuka `https://meet.google.com/new`, menunggu Google
  mengalihkan ke URL kode rapat nyata, lalu mengembalikan URL tersebut. Jalur ini mengharuskan
  profil Chrome OpenClaw di node sudah masuk ke Google.
  Otomasi browser menangani prompt mikrofon penggunaan pertama milik Meet; prompt tersebut
  tidak diperlakukan sebagai kegagalan login Google.
  Alur bergabung dan buat juga mencoba menggunakan ulang tab Meet yang ada sebelum membuka
  yang baru. Pencocokan mengabaikan string kueri URL yang tidak berbahaya seperti `authuser`, sehingga
  percobaan ulang agent seharusnya memfokuskan rapat yang sudah terbuka alih-alih membuat tab
  Chrome kedua.

Output perintah/tool menyertakan field `source` (`api` atau `browser`) sehingga agent
dapat menjelaskan jalur mana yang digunakan. `create` bergabung ke rapat baru secara default dan
mengembalikan `joined: true` ditambah sesi bergabung. Untuk hanya mencetak URL, gunakan
`create --no-join` pada CLI atau berikan `"join": false` ke tool.

Atau beri tahu agent: "Buat Google Meet, bergabunglah dengan mode balas-bicara agent,
dan kirim tautannya kepada saya." Agent seharusnya memanggil `google_meet` dengan
`action: "create"` lalu membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Untuk bergabung hanya-observasi/kontrol-browser, atur `"mode": "transcribe"`. Itu
tidak memulai jembatan suara realtime dupleks, tidak memerlukan BlackHole atau SoX,
dan tidak akan berbicara balik ke rapat. Bergabung Chrome dalam mode ini juga menghindari
pemberian izin mikrofon/kamera OpenClaw dan menghindari jalur **Gunakan
mikrofon** Meet. Jika Meet menampilkan interstisial pilihan audio, otomasi mencoba
jalur tanpa-mikrofon dan jika tidak berhasil melaporkan tindakan manual alih-alih membuka
mikrofon lokal. Dalam mode transkripsi, transport Chrome terkelola juga memasang
observer caption Meet dengan upaya terbaik. `googlemeet status --json` dan
`googlemeet doctor` menampilkan `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
dan ekor `recentTranscript` singkat sehingga operator dapat mengetahui apakah browser
bergabung ke panggilan dan apakah caption Meet menghasilkan teks.
Gunakan `openclaw googlemeet test-listen <meet-url> --transport chrome-node` ketika
Anda memerlukan probe ya/tidak: perintah ini bergabung dalam mode transkripsi, menunggu caption baru atau
pergerakan transkrip, dan mengembalikan `listenVerified`, `listenTimedOut`, field
tindakan manual, serta kesehatan caption terbaru.

Selama sesi realtime, status `google_meet` menyertakan kesehatan browser dan jembatan audio
seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output terakhir,
penghitung byte, dan status jembatan tertutup. Jika prompt halaman Meet yang aman
muncul, otomasi browser menanganinya jika bisa. Login, penerimaan host, dan
prompt izin browser/OS dilaporkan sebagai tindakan manual dengan alasan dan
pesan untuk diteruskan agent. Sesi Chrome terkelola hanya mengeluarkan frasa intro atau
uji setelah kesehatan browser melaporkan `inCall: true`; jika tidak, status melaporkan
`speechReady: false` dan percobaan bicara diblokir alih-alih berpura-pura
agent berbicara ke rapat.

Bergabung Chrome lokal melalui profil browser OpenClaw yang sudah masuk. Mode realtime
memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan oleh OpenClaw. Untuk
audio dupleks yang bersih, gunakan perangkat virtual terpisah atau grafik bergaya Loopback; satu
perangkat BlackHole cukup untuk uji smoke pertama tetapi dapat menimbulkan gema.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau kunci API model di dalam VM macOS
hanya untuk membuat VM memiliki Chrome. Jalankan Gateway dan agent secara lokal, lalu jalankan
host node di VM. Aktifkan plugin bawaan di VM sekali agar node
mengiklankan perintah Chrome:

Yang berjalan di mana:

- Host Gateway: Gateway OpenClaw, ruang kerja agent, kunci model/API, penyedia realtime, dan konfigurasi plugin Google Meet.
- VM macOS Parallels: CLI/host node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agent, kunci OpenAI/GPT, atau penyiapan
  penyedia model.

Instal dependensi VM:

```bash
brew install blackhole-2ch sox
```

Reboot VM setelah menginstal BlackHole agar macOS menampilkan `BlackHole 2ch`:

```bash
sudo reboot
```

Setelah reboot, verifikasi VM dapat melihat perangkat audio dan perintah SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instal atau perbarui OpenClaw di VM, lalu aktifkan plugin bawaan di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, node menolak
WebSocket plaintext kecuali Anda ikut serta untuk jaringan privat tepercaya tersebut:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan variabel lingkungan yang sama saat menginstal node sebagai LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah lingkungan proses, bukan pengaturan
`openclaw.json`. `openclaw node install` menyimpannya di lingkungan LaunchAgent
ketika variabel itu ada pada perintah instal.

Setujui node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat node dan node itu mengiklankan `googlemeet.chrome`
serta kapabilitas browser/`browser.proxy`:

```bash
openclaw nodes status
```

Rutekan Meet melalui node itu pada host Gateway:

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

atau minta agent menggunakan tool `google_meet` dengan `transport: "chrome-node"`.

Untuk uji smoke satu perintah yang membuat atau menggunakan ulang sesi, mengucapkan frasa
yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama bergabung realtime, otomasi peramban OpenClaw mengisi nama tamu, mengklik
Join/Ask to join, dan menerima pilihan pertama Meet "Use microphone" saat
prompt tersebut muncul. Selama bergabung hanya-amati atau pembuatan rapat
hanya-peramban, otomasi melanjutkan melewati prompt yang sama tanpa mikrofon
saat pilihan tersebut tersedia. Jika profil peramban belum masuk, Meet sedang
menunggu persetujuan host, Chrome memerlukan izin mikrofon/kamera untuk
bergabung realtime, atau Meet macet pada prompt yang tidak dapat diselesaikan
otomasi, hasil join/test-speech melaporkan `manualActionRequired: true` dengan
`manualActionReason` dan `manualActionMessage`. Agen harus berhenti mencoba
ulang bergabung, melaporkan pesan persis itu beserta `browserUrl`/`browserTitle`
saat ini, dan mencoba ulang hanya setelah tindakan peramban manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya saat tepat
satu Node terhubung mengiklankan `googlemeet.chrome` dan kontrol peramban. Jika
beberapa Node yang mampu terhubung, atur `chromeNode.node` ke id Node, nama
tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: Node yang dipasangkan
  diketahui oleh Gateway tetapi tidak tersedia. Agen harus memperlakukan Node
  tersebut sebagai status diagnostik, bukan sebagai host Chrome yang dapat
  digunakan, dan melaporkan penghambat penyiapan alih-alih beralih ke transport
  lain kecuali pengguna memintanya.
- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` telah dijalankan di VM. Konfirmasi juga
  bahwa host Gateway mengizinkan kedua perintah Node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host yang
  diperiksa dan mulai ulang sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan mulai ulang VM.
- Chrome terbuka tetapi tidak dapat bergabung: masuk ke profil peramban di
  dalam VM, atau biarkan `chrome.guestName` tetap diatur untuk bergabung sebagai
  tamu. Bergabung otomatis sebagai tamu menggunakan otomasi peramban OpenClaw
  melalui proxy peramban Node; pastikan konfigurasi peramban Node menunjuk ke
  profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil sesi-eksisting bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` tetap aktif.
  OpenClaw mengaktifkan tab yang ada untuk URL Meet yang sama sebelum membuka
  tab baru, dan pembuatan rapat peramban menggunakan kembali tab
  `https://meet.google.com/new` yang sedang berjalan atau tab prompt akun Google
  sebelum membuka tab lain.
- Tidak ada audio: di Meet, rutekan audio mikrofon/speaker melalui jalur
  perangkat audio virtual yang digunakan OpenClaw; gunakan perangkat virtual
  terpisah atau perutean bergaya Loopback untuk audio dupleks yang bersih.

## Catatan instalasi

Default bicara-balik Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio baris perintah. Plugin menggunakan perintah perangkat
  CoreAudio eksplisit untuk bridge audio PCM16 24 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio
  `BlackHole 2ch` yang dapat dirutekan oleh Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang salah satu paket tersebut.
Dokumentasi meminta pengguna menginstalnya sebagai dependensi host melalui
Homebrew. SoX dilisensikan sebagai `LGPL-2.0-only AND GPL-2.0-only`; BlackHole
adalah GPL-3.0. Jika Anda membuat installer atau appliance yang membundel
BlackHole dengan OpenClaw, tinjau ketentuan lisensi upstream BlackHole atau
dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet melalui kontrol peramban OpenClaw dan
bergabung sebagai profil peramban OpenClaw yang sudah masuk. Di macOS, Plugin
memeriksa `BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, Plugin juga
menjalankan perintah kesehatan bridge audio dan perintah startup sebelum
membuka Chrome. Gunakan `chrome` saat Chrome/audio berada di host Gateway;
gunakan `chrome-node` saat Chrome/audio berada di Node yang dipasangkan seperti
VM Parallels macOS. Untuk Chrome lokal, pilih profil dengan
`browser.defaultProfile`; `chrome.browserProfile` diteruskan ke host
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan galat
penyiapan alih-alih bergabung diam-diam tanpa jalur audio.

### Twilio

Transport Twilio adalah rencana panggilan ketat yang didelegasikan ke Plugin
Voice Call. Ini tidak mengurai halaman Meet untuk nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan
fallback dial-in telepon. Google Meet harus mengekspos nomor dial-in telepon dan
PIN untuk rapat; OpenClaw tidak menemukannya dari halaman Meet.

Aktifkan Plugin Voice Call pada host Gateway, bukan pada Node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
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
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Berikan kredensial Twilio melalui lingkungan atau konfigurasi. Lingkungan
menjaga rahasia tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gunakan `realtime.provider: "openai"` dengan Plugin penyedia OpenAI dan
`OPENAI_API_KEY` sebagai gantinya jika itu adalah penyedia suara realtime Anda.

Mulai ulang atau muat ulang Gateway setelah mengaktifkan `voice-call`;
perubahan konfigurasi Plugin tidak muncul dalam proses Gateway yang sudah
berjalan hingga proses tersebut dimuat ulang.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Saat delegasi Twilio terhubung, `googlemeet setup` menyertakan pemeriksaan
`twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan
`twilio-voice-call-webhook` yang berhasil.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` saat rapat memerlukan urutan khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

OAuth bersifat opsional untuk membuat tautan Meet karena `googlemeet create`
dapat fallback ke otomasi peramban. Konfigurasikan OAuth saat Anda menginginkan
pembuatan API resmi, resolusi space, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta cakupan yang diperlukan, otorisasi akun Google, lalu simpan refresh token
yang dihasilkan di konfigurasi Plugin Google Meet atau berikan variabel
lingkungan `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur bergabung Chrome. Transport Chrome dan
Chrome-node tetap bergabung melalui profil Chrome yang sudah masuk,
BlackHole/SoX, dan Node terhubung saat Anda menggunakan partisipasi peramban.
OAuth hanya untuk jalur Google Meet API resmi: membuat space rapat,
menyelesaikan space, dan menjalankan pemeriksaan preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih proyek Google Cloud.
2. Aktifkan **Google Meet REST API** untuk proyek tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan pribadi/tes; saat aplikasi berada
     dalam Testing, tambahkan setiap akun Google yang akan mengotorisasi
     aplikasi sebagai pengguna tes.
4. Tambahkan cakupan yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat ID klien OAuth.
   - Jenis aplikasi: **Web application**.
   - URI redirect yang diotorisasi:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin ID klien dan secret klien.

`meetings.space.created` diperlukan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw menyelesaikan URL/kode Meet ke
space. `meetings.space.settings` memungkinkan OpenClaw meneruskan pengaturan
`SpaceConfig` seperti `accessType` selama pembuatan ruang API.
`meetings.conference.media.readonly` digunakan untuk preflight Meet Media API
dan pekerjaan media; Google mungkin memerlukan pendaftaran Developer Preview
untuk penggunaan Media API aktual. Jika Anda hanya memerlukan bergabung Chrome
berbasis peramban, lewati OAuth sepenuhnya.

### Terbitkan refresh token

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, atau
teruskan sebagai variabel lingkungan, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah mencetak blok konfigurasi `oauth` dengan refresh token. Perintah ini
menggunakan PKCE, callback localhost pada
`http://localhost:8085/oauth2callback`, dan alur salin/tempel manual dengan
`--manual`.

Contoh:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gunakan mode manual saat peramban tidak dapat mencapai callback lokal:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Output JSON mencakup:

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

Simpan objek `oauth` di bawah konfigurasi Plugin Google Meet:

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

Utamakan variabel lingkungan saat Anda tidak ingin refresh token berada di
konfigurasi. Jika nilai konfigurasi dan lingkungan sama-sama ada, Plugin
menyelesaikan konfigurasi terlebih dahulu lalu fallback lingkungan.

Persetujuan OAuth mencakup pembuatan space Meet, akses baca space Meet, dan
akses baca media konferensi Meet. Jika Anda melakukan autentikasi sebelum
dukungan pembuatan rapat tersedia, jalankan ulang
`openclaw googlemeet auth login --json` agar refresh token memiliki cakupan
`meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan doctor OAuth saat Anda menginginkan pemeriksaan kesehatan cepat tanpa
rahasia:

```bash
openclaw googlemeet doctor --oauth --json
```

Ini tidak memuat runtime Chrome atau memerlukan Node Chrome yang terhubung. Ini
memeriksa bahwa konfigurasi OAuth ada dan refresh token dapat menerbitkan access
token. Laporan JSON hanya mencakup bidang status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; laporan tidak mencetak access
token, refresh token, atau secret klien.

Hasil umum:

| Pemeriksaan          | Makna                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau token akses yang di-cache, tersedia.   |
| `oauth-token`        | Token akses yang di-cache masih valid, atau token refresh menerbitkan token akses baru. |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` menemukan ruang Meet yang sudah ada.                   |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat ruang Meet baru.                          |

Untuk membuktikan pengaktifan Google Meet API dan cakupan `spaces.create` juga, jalankan
pemeriksaan pembuatan yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sementara. Gunakan saat Anda perlu mengonfirmasi
bahwa proyek Google Cloud telah mengaktifkan Meet API dan bahwa akun yang diotorisasi
memiliki cakupan `meetings.space.created`.

Untuk membuktikan akses baca bagi ruang rapat yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke ruang yang sudah ada
yang dapat diakses oleh akun Google yang diotorisasi. `403` dari pemeriksaan ini
biasanya berarti Google Meet REST API dinonaktifkan, token refresh yang disetujui
tidak memiliki cakupan yang diperlukan, atau akun Google tidak dapat mengakses ruang Meet
tersebut. Kesalahan token refresh berarti jalankan ulang `openclaw googlemeet auth login
--json` dan simpan blok `oauth` yang baru.

Tidak diperlukan kredensial OAuth untuk fallback browser. Dalam mode tersebut, autentikasi Google
berasal dari profil Chrome yang sudah login di node yang dipilih, bukan dari
konfigurasi OpenClaw.

Variabel lingkungan ini diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Selesaikan URL Meet, kode, atau `spaces/{id}` melalui `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Jalankan preflight sebelum pekerjaan media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Cantumkan artefak rapat dan kehadiran setelah Meet membuat catatan konferensi:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Dengan `--meeting`, `artifacts` dan `attendance` menggunakan catatan konferensi terbaru
secara default. Berikan `--all-conference-records` saat Anda menginginkan semua catatan yang disimpan
untuk rapat tersebut.

Pencarian Kalender dapat menyelesaikan URL rapat dari Google Calendar sebelum membaca
artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari kalender `primary` hari ini untuk acara Calendar dengan tautan
Google Meet. Gunakan `--event <query>` untuk mencari teks acara yang cocok, dan
`--calendar <id>` untuk kalender non-primer. Pencarian Kalender memerlukan login
OAuth baru yang mencakup cakupan hanya-baca acara Calendar.
`calendar-events` mempratinjau acara Meet yang cocok dan menandai acara yang akan dipilih oleh
`latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id catatan konferensi, alamatkan langsung:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Akhiri konferensi aktif untuk ruang yang dibuat API saat Anda ingin menutup
ruang setelah panggilan:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Ini memanggil Google Meet `spaces.endActiveConference` dan memerlukan OAuth dengan
cakupan `meetings.space.created` untuk ruang yang dapat dikelola oleh akun yang diotorisasi.
OpenClaw menerima URL Meet, kode rapat, atau input `spaces/{id}` dan menyelesaikannya
menjadi resource ruang API sebelum mengakhiri konferensi aktif.
Ini terpisah dari `googlemeet leave`: `leave` menghentikan partisipasi lokal/sesi
OpenClaw, sedangkan `end-active-conference` meminta Google Meet untuk mengakhiri konferensi aktif
untuk ruang tersebut.

Tulis laporan yang mudah dibaca:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` mengembalikan metadata catatan konferensi plus metadata resource peserta, rekaman,
transkrip, entri transkrip terstruktur, dan catatan pintar saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries` untuk melewati
pencarian entri untuk rapat besar. `attendance` memperluas peserta menjadi
baris sesi peserta dengan waktu pertama/terakhir terlihat, total durasi sesi,
penanda terlambat/keluar-lebih-awal, dan resource peserta duplikat yang digabung berdasarkan pengguna
yang login atau nama tampilan. Berikan `--no-merge-duplicates` untuk mempertahankan resource peserta mentah
secara terpisah, `--late-after-minutes` untuk menyesuaikan deteksi terlambat, dan
`--early-before-minutes` untuk menyesuaikan deteksi keluar lebih awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, catatan konferensi,
file output, jumlah, sumber token, acara Calendar saat digunakan, dan peringatan
pengambilan parsial apa pun. Berikan `--zip` untuk juga menulis arsip portabel di sebelah
folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs transkrip dan
catatan pintar tertaut melalui Google Drive `files.export`; ini memerlukan
login OAuth baru yang mencakup cakupan hanya-baca Drive Meet. Tanpa
`--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri transkrip
terstruktur. Jika Google mengembalikan kegagalan artefak parsial, seperti kesalahan daftar
catatan pintar, entri transkrip, atau isi dokumen Drive, ringkasan dan
manifest menyimpan peringatan alih-alih menggagalkan seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
JSON manifest tanpa membuat folder atau ZIP. Itu berguna sebelum menulis
ekspor besar atau saat agen hanya memerlukan jumlah, catatan yang dipilih, dan
peringatan.

Agen juga dapat membuat bundel yang sama melalui tool `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Tetapkan `"dryRun": true` untuk hanya mengembalikan manifest ekspor dan melewati penulisan file.

Agen juga dapat membuat ruang yang didukung API dengan kebijakan akses eksplisit:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Dan mereka dapat mengakhiri konferensi aktif untuk ruang yang diketahui:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Untuk validasi dengarkan-terlebih-dahulu, agen harus menggunakan `test_listen` sebelum mengklaim bahwa
rapat tersebut berguna:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Jalankan live smoke yang dijaga terhadap rapat nyata yang dipertahankan:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Jalankan probe browser live dengarkan-terlebih-dahulu terhadap rapat tempat seseorang akan
berbicara dengan teks Meet tersedia:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Lingkungan live smoke:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan pengujian live yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL Meet, kode, atau
  `spaces/{id}` yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan id klien OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN` menyediakan
  token refresh.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang sama
  tanpa prefiks `OPENCLAW_`.

Live smoke artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Pencarian Kalender
memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`. Ekspor
isi dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah ini mencetak `meeting uri` baru, sumber, dan sesi bergabung. Dengan kredensial
OAuth, perintah ini menggunakan Google Meet API resmi. Tanpa kredensial OAuth, perintah ini
menggunakan profil browser node Chrome tersemat yang sudah login sebagai fallback. Agen dapat
menggunakan tool `google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
langkah. Untuk pembuatan hanya URL, berikan `"join": false`.

Contoh output JSON dari fallback browser:

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

Jika fallback browser terkena pemblokir login Google atau izin Meet sebelum dapat
membuat URL, metode Gateway mengembalikan respons gagal dan tool
`google_meet` mengembalikan detail terstruktur alih-alih string biasa:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Saat agen melihat `manualActionRequired: true`, agen harus melaporkan
`manualActionMessage` plus konteks node/tab browser dan berhenti membuka tab
Meet baru hingga operator menyelesaikan langkah browser.

Contoh output JSON dari pembuatan API:

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

Membuat Meet bergabung secara default. Transport Chrome atau Chrome-node tetap
memerlukan profil Google Chrome yang sudah masuk untuk bergabung melalui browser. Jika
profil keluar, OpenClaw melaporkan `manualActionRequired: true` atau
kesalahan fallback browser dan meminta operator menyelesaikan login Google sebelum
mencoba ulang.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi bahwa project Cloud
Anda, prinsipal OAuth, dan peserta rapat terdaftar dalam Google
Workspace Developer Preview Program untuk API media Meet.

## Konfigurasi

Jalur agen Chrome umum hanya memerlukan plugin diaktifkan, BlackHole, SoX, kunci
penyedia transkripsi realtime, dan penyedia TTS OpenClaw yang dikonfigurasi.
OpenAI adalah penyedia transkripsi default; tetapkan `realtime.voiceProvider` ke
`"google"` dan `realtime.model` untuk menggunakan Google Gemini Live bagi mode `bidi`
tanpa mengubah penyedia transkripsi mode agen default:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Tetapkan konfigurasi plugin di bawah `plugins.entries.google-meet.config`:

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

Default:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` diterima hanya sebagai alias kompatibilitas
  lama untuk `"agent"`; panggilan alat baru sebaiknya menyebut `"agent"`)
- `chromeNode.node`: id/nama/IP node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet
  yang belum masuk
- `chrome.autoJoin: true`: pengisian nama tamu dan klik Join Now secara upaya terbaik
  melalui otomasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang ada alih-alih
  membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu tab Meet melaporkan dalam panggilan
  sebelum intro balasan suara dipicu
- `chrome.audioFormat: "pcm16-24khz"`: format audio pasangan perintah. Gunakan
  `"g711-ulaw-8khz"` hanya untuk pasangan perintah lama/kustom yang masih mengeluarkan
  audio telepon.
- `chrome.audioBufferBytes: 4096`: buffer pemrosesan SoX untuk perintah audio
  pasangan perintah Chrome yang dihasilkan. Ini adalah separuh dari buffer default SoX 8192 byte,
  mengurangi latensi pipe default sambil tetap menyisakan ruang untuk menaikkannya pada host sibuk.
  Nilai di bawah minimum SoX dibatasi menjadi 17 byte.
- `chrome.audioInputCommand`: perintah SoX yang membaca dari CoreAudio `BlackHole 2ch`
  dan menulis audio dalam `chrome.audioFormat`
- `chrome.audioOutputCommand`: perintah SoX yang membaca audio dalam `chrome.audioFormat`
  dan menulis ke CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: perintah mikrofon lokal opsional yang menulis
  PCM mono little-endian 16-bit bertanda untuk deteksi interupsi manusia saat
  pemutaran asisten aktif. Saat ini berlaku untuk bridge pasangan perintah
  `chrome` yang dihosting Gateway.
- `chrome.bargeInRmsThreshold: 650`: level RMS yang dihitung sebagai interupsi manusia
  pada `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: level puncak yang dihitung sebagai interupsi manusia
  pada `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: jeda minimum antara pembersihan interupsi manusia
  berulang
- `mode: "agent"`: mode balasan suara default. Ucapan peserta ditranskripsikan oleh
  penyedia transkripsi realtime yang dikonfigurasi, dikirim ke agen OpenClaw yang
  dikonfigurasi dalam sesi sub-agen per rapat, dan diucapkan kembali melalui
  runtime TTS OpenClaw normal.
- `mode: "bidi"`: mode fallback model realtime dua arah langsung. Penyedia suara
  realtime menjawab ucapan peserta secara langsung dan dapat memanggil
  `openclaw_agent_consult` untuk jawaban yang lebih dalam/berbasis alat.
- `mode: "transcribe"`: mode hanya observasi tanpa bridge balasan suara.
- `realtime.provider: "openai"`: fallback kompatibilitas yang digunakan saat field
  penyedia berskala di bawah ini belum ditetapkan.
- `realtime.transcriptionProvider: "openai"`: id penyedia yang digunakan oleh mode `agent`
  untuk transkripsi realtime.
- `realtime.voiceProvider`: id penyedia yang digunakan oleh mode `bidi` untuk suara
  realtime langsung. Tetapkan ini ke `"google"` untuk menggunakan Gemini Live sambil mempertahankan
  transkripsi mode agen pada OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih dalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime
  terhubung; tetapkan ke `""` untuk bergabung tanpa suara
- `realtime.agentId`: id agen OpenClaw opsional untuk
  `openclaw_agent_consult`; default ke `main`

Override opsional:

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
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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

Suara Meet persisten berasal dari
`messages.tts.providers.elevenlabs.speakerVoiceId`. Balasan agen juga dapat menggunakan
direktif per balasan `[[tts:speakerVoiceId=... model=eleven_v3]]` saat override model TTS
diaktifkan, tetapi konfigurasi adalah default deterministik untuk rapat.
Saat bergabung, log seharusnya menampilkan `transcriptionProvider=elevenlabs` dan setiap
balasan lisan seharusnya mencatat `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

`voiceCall.enabled` default ke `true`; dengan transport Twilio, ini mendelegasikan
panggilan PSTN aktual, DTMF, dan salam intro ke plugin Voice Call. Voice Call
memutar urutan DTMF sebelum membuka stream media realtime, lalu menggunakan teks
intro yang disimpan sebagai salam realtime awal. Jika `voice-call` tidak
diaktifkan, Google Meet masih dapat memvalidasi dan merekam rencana dial, tetapi tidak dapat
melakukan panggilan Twilio.

## Alat

Agen dapat menggunakan alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Gunakan `transport: "chrome"` saat Chrome berjalan pada host Gateway. Gunakan
`transport: "chrome-node"` saat Chrome berjalan pada node yang dipasangkan seperti VM Parallels.
Dalam kedua kasus, penyedia model dan `openclaw_agent_consult` berjalan pada
host Gateway, sehingga kredensial model tetap berada di sana. Dengan `mode: "agent"` default,
penyedia transkripsi realtime menangani pendengaran, agen OpenClaw yang dikonfigurasi
menghasilkan jawaban, dan TTS OpenClaw reguler mengucapkannya ke Meet. Gunakan
`mode: "bidi"` saat Anda ingin model suara realtime menjawab secara langsung.
`mode: "realtime"` mentah tetap diterima sebagai alias kompatibilitas lama untuk
`mode: "agent"`, tetapi tidak lagi diiklankan dalam skema alat agen.
Log mode agen menyertakan penyedia/model transkripsi yang diselesaikan saat bridge
dimulai dan penyedia TTS, model, suara, format output, dan laju sampel setelah
setiap balasan yang disintesis.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan
`action: "speak"` dengan `sessionId` dan `message` untuk membuat agen realtime
segera berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan ulang sesi,
memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat
melaporkannya. `test_speech` selalu memaksa `mode: "agent"` dan gagal jika diminta
berjalan dalam `mode: "transcribe"` karena sesi hanya observasi memang tidak dapat
mengeluarkan ucapan. Hasil `speechOutputVerified` didasarkan pada byte output audio realtime
yang meningkat selama panggilan pengujian ini, sehingga sesi yang digunakan ulang dengan audio lama
tidak dihitung sebagai pemeriksaan ucapan sukses yang baru. Gunakan `action: "leave"` untuk menandai
sesi berakhir.

`status` menyertakan kesehatan Chrome saat tersedia:

- `inCall`: Chrome tampaknya berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet secara upaya terbaik
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  browser memerlukan login manual, penerimaan host Meet, izin, atau
  perbaikan kontrol browser sebelum ucapan dapat bekerja
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: apakah
  ucapan Chrome terkelola diizinkan sekarang. `speechReady: false` berarti OpenClaw tidak
  mengirim frasa intro/tes ke bridge audio.
- `providerConnected` / `realtimeReady`: status bridge suara realtime
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke bridge
- `audioOutputRouted` / `audioOutputDeviceLabel`: apakah output media tab Meet
  secara aktif dirutekan ke perangkat BlackHole yang digunakan oleh bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input loopback yang diabaikan saat
  pemutaran asisten aktif

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Mode agen dan bidi

Mode Chrome `agent` dioptimalkan untuk perilaku "agen saya ada di rapat". Penyedia
transkripsi realtime mendengar audio rapat, transkrip akhir peserta
dirutekan melalui agen OpenClaw yang dikonfigurasi, dan jawaban
diucapkan melalui runtime TTS OpenClaw normal. Tetapkan `mode: "bidi"` saat Anda ingin
model suara realtime menjawab secara langsung.
Fragmen transkrip akhir yang berdekatan digabungkan sebelum konsultasi agar satu giliran
lisan tidak menghasilkan beberapa jawaban parsial yang basi. Input realtime juga
ditekan saat audio asisten yang antre masih diputar,
dan gema transkrip yang mirip asisten baru-baru ini diabaikan sebelum konsultasi agen
agar loopback BlackHole tidak membuat agen menjawab ucapannya sendiri.

| Mode    | Siapa yang menentukan jawaban  | Jalur output ucapan                    | Gunakan saat                                           |
| ------- | ------------------------------ | -------------------------------------- | ------------------------------------------------------ |
| `agent` | Agen OpenClaw yang dikonfigurasi | Runtime TTS OpenClaw normal            | Anda menginginkan perilaku "agen saya ada di rapat"    |
| `bidi`  | Model suara realtime           | Respons audio penyedia suara realtime  | Anda menginginkan loop suara percakapan berlatensi terendah |

Dalam mode `bidi`, saat model realtime memerlukan penalaran lebih dalam, informasi
terkini, atau alat OpenClaw normal, model dapat memanggil `openclaw_agent_consult`.

Alat consult menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan yang ringkas. Dalam mode `agent`, OpenClaw mengirim jawaban itu langsung ke runtime TTS; dalam mode `bidi`, model suara realtime dapat mengucapkan hasil consult kembali ke dalam rapat. Ini menggunakan mesin consult bersama yang sama seperti Voice Call.

Secara default, consult berjalan terhadap agen `main`. Atur `realtime.agentId` ketika lane Meet harus berkonsultasi dengan workspace agen OpenClaw khusus, default model, kebijakan alat, memori, dan riwayat sesi.

Consult mode agen menggunakan kunci sesi per rapat `agent:<id>:subagent:google-meet:<session>` sehingga pertanyaan lanjutan mempertahankan konteks rapat sambil mewarisi kebijakan agen normal dari agen yang dikonfigurasi.

`realtime.toolPolicy` mengontrol jalannya consult:

- `safe-read-only`: ekspos alat consult dan batasi agen reguler ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: ekspos alat consult dan biarkan agen reguler menggunakan kebijakan
  alat agen normal.
- `none`: jangan ekspos alat consult ke model suara realtime.

Kunci sesi consult dicakup per sesi Meet, sehingga panggilan consult lanjutan dapat menggunakan kembali konteks consult sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Untuk smoke join-and-speak lengkap:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Daftar periksa pengujian live

Gunakan urutan ini sebelum menyerahkan rapat ke agen tanpa pengawasan:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Status Chrome-node yang diharapkan:

- `googlemeet setup` semuanya hijau.
- `googlemeet setup` menyertakan `chrome-node-connected` saat Chrome-node adalah
  transport default atau sebuah node dipasangkan.
- `nodes status` menampilkan node yang dipilih terhubung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan
  `inCall: true`.

Untuk host Chrome jarak jauh seperti VM macOS Parallels, ini adalah pemeriksaan aman tersingkat setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Itu membuktikan Plugin Gateway dimuat, node VM terhubung dengan token saat ini, dan jembatan audio Meet tersedia sebelum agen membuka tab rapat nyata.

Untuk smoke Twilio, gunakan rapat yang mengekspos detail dial-in telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` menyertakan pemeriksaan hijau `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials`, dan `twilio-voice-call-webhook`.
- `voicecall` tersedia di CLI setelah Gateway dimuat ulang.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `openclaw logs --follow` menampilkan TwiML DTMF disajikan sebelum TwiML realtime, lalu
  jembatan realtime dengan sapaan awal diantrekan.
- `googlemeet leave <sessionId>` memutus panggilan suara yang didelegasikan.

## Pemecahan Masalah

### Agen tidak dapat melihat alat Google Meet

Konfirmasikan Plugin diaktifkan di konfigurasi Gateway dan muat ulang Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, mulai ulang atau muat ulang Gateway. Agen yang berjalan hanya melihat alat Plugin yang terdaftar oleh proses Gateway saat ini.

Pada host Gateway non-macOS, alat `google_meet` yang menghadap agen tetap terlihat, tetapi tindakan talk-back Chrome lokal diblokir sebelum mencapai jembatan audio. Audio talk-back Chrome lokal saat ini bergantung pada macOS `BlackHole 2ch`, jadi agen Linux sebaiknya menggunakan `mode: "transcribe"`, dial-in Twilio, atau host `chrome-node` macOS sebagai ganti jalur agen Chrome lokal default.

### Tidak ada node berkemampuan Google Meet yang terhubung

Pada host node, jalankan:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Pada host Gateway, setujui node dan verifikasi perintah:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node harus terhubung dan mencantumkan `googlemeet.chrome` plus `browser.proxy`.
Konfigurasi Gateway harus mengizinkan perintah node tersebut:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jika `googlemeet setup` gagal pada `chrome-node-connected` atau log Gateway melaporkan
`gateway token mismatch`, instal ulang atau mulai ulang node dengan token Gateway saat ini. Untuk Gateway LAN, ini biasanya berarti:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Lalu muat ulang layanan node dan jalankan ulang:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-listen` untuk join observe-only atau `googlemeet test-speech` untuk join realtime, lalu periksa kesehatan Chrome yang dikembalikan. Jika salah satu probe melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator dan hentikan percobaan ulang hingga tindakan browser selesai.

Tindakan manual umum:

- Masuk ke profil Chrome.
- Izinkan tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "not signed in" hanya karena Meet menampilkan "Do you want people to
hear you in the meeting?" Itu adalah interstitial pilihan audio Meet; OpenClaw mengklik **Use microphone** melalui otomasi browser saat tersedia dan terus menunggu status rapat sebenarnya. Untuk fallback browser khusus pembuatan, OpenClaw dapat mengklik **Continue without microphone** karena pembuatan URL tidak memerlukan jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama menggunakan endpoint Google Meet API `spaces.create`
saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, ini fallback ke browser node Chrome yang dipasangkan. Konfirmasikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang sesuai tersedia.
- Untuk pembuatan API: refresh token dibuat setelah dukungan pembuatan
  ditambahkan. Token lama mungkin tidak memiliki cakupan `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` menunjuk ke node terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw pada node tersebut sudah masuk
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan kembali tab prompt akun Google atau
  `https://meet.google.com/new` yang ada sebelum membuka tab baru. Jika agen timeout,
  coba ulangi panggilan alat alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika alat mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan coba ulang dalam loop hingga tindakan itu selesai.
- Untuk fallback browser: jika Meet menampilkan "Do you want people to hear you in the
  meeting?", biarkan tab tetap terbuka. OpenClaw seharusnya mengklik **Use microphone** atau, untuk
  fallback khusus pembuatan, **Continue without microphone** melalui otomasi browser dan terus menunggu URL Meet yang dihasilkan. Jika tidak bisa, error seharusnya menyebutkan `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "agent"` untuk jalur talk-back normal STT -> agen OpenClaw -> TTS,
atau `mode: "bidi"` untuk fallback suara realtime langsung. `mode: "transcribe"`
secara sengaja tidak memulai jembatan talk-back. Untuk debugging observe-only,
jalankan `openclaw googlemeet status --json <session-id>` setelah peserta berbicara
dan periksa `captioning`, `transcriptLines`, dan `lastCaptionText`. Jika `inCall`
true tetapi `transcriptLines` tetap `0`, teks Meet mungkin dinonaktifkan, belum ada yang
berbicara sejak observer dipasang, UI Meet berubah, atau teks live tidak tersedia untuk bahasa/akun rapat.

`googlemeet test-speech` selalu memeriksa jalur realtime dan melaporkan apakah
byte output bridge diamati untuk pemanggilan tersebut. Jika `speechOutputVerified` false dan
`speechOutputTimedOut` true, penyedia realtime mungkin telah menerima ujaran tetapi OpenClaw tidak melihat byte output baru mencapai jembatan audio Chrome.

Verifikasi juga:

- Kunci penyedia realtime tersedia pada host Gateway, seperti
  `OPENAI_API_KEY` atau `GEMINI_API_KEY`.
- `BlackHole 2ch` terlihat pada host Chrome.
- `sox` ada pada host Chrome.
- Mikrofon dan speaker Meet dirutekan melalui jalur audio virtual yang digunakan oleh
  OpenClaw. `doctor` seharusnya menampilkan `meet output routed: yes` untuk join realtime Chrome lokal.

`googlemeet doctor [session-id]` mencetak sesi, node, status dalam panggilan,
alasan tindakan manual, koneksi penyedia realtime, `realtimeReady`, aktivitas
input/output audio, timestamp audio terakhir, penghitung byte, dan URL browser.
Gunakan `googlemeet status [session-id] --json` saat Anda memerlukan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh OAuth Google Meet
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga memerlukan bukti Google Meet API.

Jika agen timeout dan Anda dapat melihat tab Meet sudah terbuka, periksa tab itu
tanpa membuka yang lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Tindakan alat yang setara adalah `recover_current_tab`. Ini memfokuskan dan memeriksa tab Meet yang ada untuk transport yang dipilih. Dengan `chrome`, ini menggunakan kontrol browser lokal melalui Gateway; dengan `chrome-node`, ini menggunakan node Chrome yang dikonfigurasi. Ini tidak membuka tab baru atau membuat sesi baru; ini melaporkan penghalang saat ini, seperti login, admisi, izin, atau status pilihan audio. Perintah CLI berbicara ke Gateway yang dikonfigurasi, jadi Gateway harus berjalan;
`chrome-node` juga memerlukan node Chrome untuk terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan muat ulang Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki account
SID, auth token, atau nomor pemanggil. Atur ini pada host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` gagal saat `voice-call` tidak memiliki paparan Webhook publik, atau saat `publicUrl` menunjuk ke local loopback atau ruang jaringan privat.
Atur `plugins.entries.voice-call.config.publicUrl` ke URL penyedia publik atau
konfigurasikan tunnel/Tailscale exposure `voice-call`.

URL loopback dan privat tidak valid untuk callback operator. Jangan gunakan
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, atau `fd00::/8` sebagai `publicUrl`.

Untuk URL publik yang stabil:

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

Untuk pengembangan lokal, gunakan tunnel atau eksposur Tailscale sebagai ganti
URL host privat:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Lalu mulai ulang atau muat ulang Gateway dan jalankan:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` secara default hanya memeriksa kesiapan. Untuk melakukan simulasi pada nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya saat Anda memang ingin melakukan panggilan notifikasi
keluar secara langsung:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Pastikan acara Meet mengekspos detail dial-in telepon. Berikan nomor dial-in
dan PIN yang persis, atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan awalan `w` atau koma di `--dtmf-sequence` jika penyedia memerlukan jeda
sebelum memasukkan PIN.

Jika panggilan telepon dibuat tetapi daftar peserta Meet tidak pernah menampilkan
peserta dial-in:

- Jalankan `openclaw googlemeet doctor <session-id>` untuk memastikan ID
  panggilan Twilio yang didelegasikan, apakah DTMF telah masuk antrean, dan
  apakah sapaan pembuka diminta.
- Jalankan `openclaw voicecall status --call-id <id>` dan pastikan panggilan
  masih aktif.
- Jalankan `openclaw voicecall tail` dan periksa bahwa Webhook Twilio tiba di
  Gateway.
- Jalankan `openclaw logs --follow` dan cari urutan Twilio Meet: Google Meet
  mendelegasikan join, Voice Call menyimpan dan menyajikan TwiML DTMF pra-koneksi,
  Voice Call menyajikan TwiML realtime untuk panggilan Twilio, lalu Google Meet
  meminta ucapan pembuka dengan `voicecall.speak`.
- Jalankan ulang `openclaw googlemeet setup --transport twilio`; pemeriksaan
  setup hijau wajib, tetapi tidak membuktikan bahwa urutan PIN rapat sudah benar.
- Pastikan nomor dial-in berasal dari undangan Meet dan wilayah yang sama dengan
  PIN.
- Tingkatkan `voiceCall.dtmfDelayMs` dari default 12 detik jika Meet menjawab
  lambat atau transkrip panggilan masih menampilkan prompt yang meminta PIN
  setelah DTMF pra-koneksi dikirim.
- Jika peserta berhasil masuk tetapi Anda tidak mendengar sapaan, periksa
  `openclaw logs --follow` untuk permintaan `voicecall.speak` pasca-DTMF serta
  pemutaran TTS media-stream atau fallback Twilio `<Say>`. Jika transkrip
  panggilan masih berisi "enter the meeting PIN", sambungan telepon belum
  masuk ke ruang Meet, sehingga peserta rapat tidak akan mendengar ucapan.

Jika Webhook tidak tiba, debug Plugin Voice Call terlebih dahulu: penyedia harus
dapat menjangkau `plugins.entries.voice-call.config.publicUrl` atau tunnel yang
dikonfigurasi. Lihat [Pemecahan masalah panggilan suara](/id/plugins/voice-call#troubleshooting).

## Catatan

API media resmi Google Meet berorientasi penerimaan, sehingga berbicara ke dalam
panggilan Meet tetap memerlukan jalur peserta. Plugin ini membuat batas tersebut
tetap terlihat: Chrome menangani partisipasi browser dan perutean audio lokal;
Twilio menangani partisipasi dial-in telepon.

Mode bicara-balik Chrome memerlukan `BlackHole 2ch` ditambah salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki
  bridge dan menyalurkan audio dalam `chrome.audioFormat` antara perintah tersebut
  dan penyedia yang dipilih. Mode agen menggunakan transkripsi realtime plus TTS
  reguler; mode bidi menggunakan penyedia suara realtime. Jalur Chrome default
  adalah PCM16 24 kHz dengan `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz
  tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya. Ini
  hanya valid untuk `bidi` karena mode `agent` memerlukan akses pasangan perintah
  langsung untuk TTS.

Saat agen memanggil alat `google_meet` dalam mode agen, sesi konsultan rapat
menduplikasi transkrip pemanggil saat ini sebelum menjawab ucapan peserta.
Sesi Meet tetap terpisah (`agent:<agentId>:subagent:google-meet:<sessionId>`)
sehingga tindak lanjut rapat tidak langsung mengubah transkrip pemanggil.

Untuk audio duplex yang bersih, rutekan keluaran Meet dan mikrofon Meet melalui
perangkat virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu
perangkat BlackHole bersama dapat memantulkan suara peserta lain kembali ke
panggilan.

Dengan bridge Chrome pasangan perintah, `chrome.bargeInInputCommand` dapat
mendengarkan mikrofon lokal terpisah dan menghapus pemutaran asisten saat manusia
mulai berbicara. Ini menjaga ucapan manusia tetap mendahului keluaran asisten
bahkan ketika input loopback BlackHole bersama sementara ditekan selama pemutaran
asisten. Seperti `chrome.audioInputCommand` dan `chrome.audioOutputCommand`, ini
adalah perintah lokal yang dikonfigurasi operator. Gunakan jalur perintah tepercaya
atau daftar argumen yang eksplisit, dan jangan mengarahkannya ke skrip dari lokasi
yang tidak tepercaya.

`googlemeet speak` memicu bridge audio bicara-balik aktif untuk sesi Chrome.
`googlemeet leave` menghentikan bridge tersebut. Untuk sesi Twilio yang
didelegasikan melalui Plugin Voice Call, `leave` juga menutup panggilan suara
yang mendasarinya. Gunakan `googlemeet end-active-conference` saat Anda juga ingin
menutup konferensi Google Meet aktif untuk ruang yang dikelola API.

## Terkait

- [Plugin panggilan suara](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun plugin](/id/plugins/building-plugins)

---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, Node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara waktu nyata'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T20:47:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Dukungan peserta Google Meet untuk OpenClaw — Plugin ini eksplisit berdasarkan desain:

- Hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- `realtime` voice adalah mode default.
- Realtime voice dapat memanggil kembali ke agen OpenClaw penuh saat penalaran
  yang lebih mendalam atau alat diperlukan.
- Agen memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk
  mendengarkan/berbicara balik secara live, atau `transcribe` untuk bergabung/mengontrol browser tanpa
  jembatan realtime voice.
- Auth dimulai sebagai Google OAuth pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host Node yang dipasangkan.
- Twilio menerima nomor dial-in plus PIN opsional atau urutan DTMF; Twilio
  tidak dapat menghubungi URL Meet secara langsung.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja
  telekonferensi agen yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan konfigurasikan penyedia realtime voice
backend. OpenAI adalah default; Google Gemini Live juga berfungsi dengan
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch`. Penginstal
Homebrew memerlukan reboot sebelum macOS mengekspos perangkat tersebut:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua komponen:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktifkan Plugin:

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

Output penyiapan dimaksudkan agar dapat dibaca agen dan sadar mode. Output ini melaporkan profil Chrome
, penyematan Node, dan, untuk bergabung Chrome realtime, jembatan audio
BlackHole/SoX serta pemeriksaan intro realtime tertunda. Untuk bergabung hanya-observasi, periksa
transport yang sama dengan `--mode transcribe`; mode itu melewati prasyarat audio realtime
karena tidak mendengarkan melalui atau berbicara melalui jembatan:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Saat delegasi Twilio dikonfigurasi, penyiapan juga melaporkan apakah Plugin
`voice-call`, kredensial Twilio, dan eksposur Webhook publik sudah siap.
Perlakukan pemeriksaan `ok: false` apa pun sebagai pemblokir untuk transport dan mode
yang diperiksa sebelum meminta agen bergabung. Gunakan `openclaw googlemeet setup --json` untuk
skrip atau output yang dapat dibaca mesin. Gunakan `--transport chrome`,
`--transport chrome-node`, atau `--transport twilio` untuk melakukan preflight transport tertentu
sebelum agen mencobanya.

Untuk Twilio, selalu lakukan preflight transport secara eksplisit saat transport default
adalah Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Itu menangkap wiring `voice-call` yang hilang, kredensial Twilio, atau eksposur
Webhook yang tidak dapat dijangkau sebelum agen mencoba menghubungi rapat.

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agen bergabung melalui alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Alat `google_meet` yang menghadap agen tetap tersedia pada host non-macOS untuk
alur artefak, kalender, penyiapan, transkripsi, Twilio, dan `chrome-node`. Tindakan
Chrome realtime lokal diblokir di sana karena jalur audio Chrome realtime
bawaan saat ini bergantung pada `BlackHole 2ch` macOS. Di Linux, gunakan
`mode: "transcribe"`, dial-in Twilio, atau host `chrome-node` macOS untuk partisipasi
Chrome realtime.

Buat rapat baru dan bergabung:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Untuk ruang yang dibuat API, gunakan Google Meet `SpaceConfig.accessType` saat Anda ingin
kebijakan tanpa-ketuk ruang dibuat eksplisit alih-alih diwarisi dari default akun
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` memungkinkan siapa pun dengan URL Meet bergabung tanpa mengetuk. `TRUSTED` memungkinkan
pengguna tepercaya organisasi host, pengguna eksternal yang diundang, dan pengguna dial-in
bergabung tanpa mengetuk. `RESTRICTED` membatasi entri tanpa-ketuk hanya untuk undangan. Pengaturan ini
hanya berlaku untuk jalur pembuatan Google Meet API resmi, sehingga kredensial OAuth
harus dikonfigurasi.

Jika Anda mengautentikasi Google Meet sebelum opsi ini tersedia, jalankan ulang
`openclaw googlemeet auth login --json` setelah menambahkan cakupan
`meetings.space.settings` ke layar persetujuan Google OAuth Anda.

Hanya buat URL tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Buat API: digunakan saat kredensial Google Meet OAuth dikonfigurasi. Ini adalah
  jalur paling deterministik dan tidak bergantung pada status UI browser.
- Fallback browser: digunakan saat kredensial OAuth tidak ada. OpenClaw menggunakan
  Node Chrome yang disematkan, membuka `https://meet.google.com/new`, menunggu Google
  mengalihkan ke URL kode rapat nyata, lalu mengembalikan URL tersebut. Jalur ini mengharuskan
  profil Chrome OpenClaw pada Node sudah masuk ke Google.
  Otomasi browser menangani prompt mikrofon first-run milik Meet; prompt itu
  tidak diperlakukan sebagai kegagalan login Google.
  Alur bergabung dan buat juga mencoba menggunakan ulang tab Meet yang sudah ada sebelum membuka
  yang baru. Pencocokan mengabaikan string kueri URL yang tidak berbahaya seperti `authuser`, sehingga
  percobaan ulang agen seharusnya memfokuskan rapat yang sudah terbuka alih-alih membuat tab
  Chrome kedua.

Output perintah/alat menyertakan bidang `source` (`api` atau `browser`) sehingga agen
dapat menjelaskan jalur mana yang digunakan. `create` bergabung ke rapat baru secara default dan
mengembalikan `joined: true` plus sesi bergabung. Untuk hanya menerbitkan URL, gunakan
`create --no-join` pada CLI atau teruskan `"join": false` ke alat.

Atau beri tahu agen: "Buat Google Meet, bergabung dengan realtime voice, dan kirim
tautannya kepada saya." Agen harus memanggil `google_meet` dengan `action: "create"` dan
lalu membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk bergabung hanya-observasi/kontrol-browser, tetapkan `"mode": "transcribe"`. Itu tidak
memulai jembatan model realtime dupleks, tidak memerlukan BlackHole atau SoX,
dan tidak akan berbicara balik ke rapat. Bergabung Chrome dalam mode ini juga menghindari
pemberian izin mikrofon/kamera OpenClaw dan menghindari jalur **Gunakan
mikrofon** Meet. Jika Meet menampilkan interstisial pilihan audio, otomasi mencoba
jalur tanpa mikrofon dan jika tidak berhasil melaporkan tindakan manual alih-alih membuka
mikrofon lokal. Dalam mode transcribe, transport Chrome terkelola juga menginstal
pengamat caption Meet best-effort. `googlemeet status --json` dan
`googlemeet doctor` menampilkan `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
dan ekor `recentTranscript` singkat sehingga operator dapat mengetahui apakah browser
bergabung ke panggilan dan apakah caption Meet menghasilkan teks.
Gunakan `openclaw googlemeet test-listen <meet-url> --transport chrome-node` saat
Anda memerlukan probe ya/tidak: perintah ini bergabung dalam mode transcribe, menunggu pergerakan caption atau
transkrip baru, dan mengembalikan `listenVerified`, `listenTimedOut`, bidang
tindakan manual, serta kesehatan caption terbaru.

Selama sesi realtime, status `google_meet` menyertakan kesehatan browser dan jembatan audio
seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output
terakhir, penghitung byte, dan status jembatan tertutup. Jika prompt halaman Meet yang aman
muncul, otomasi browser menanganinya saat memungkinkan. Login, penerimaan host, dan
prompt izin browser/OS dilaporkan sebagai tindakan manual dengan alasan dan
pesan untuk disampaikan agen. Sesi Chrome terkelola hanya memancarkan intro atau
frasa uji setelah kesehatan browser melaporkan `inCall: true`; jika tidak, status melaporkan
`speechReady: false` dan upaya bicara diblokir alih-alih berpura-pura bahwa
agen berbicara ke dalam rapat.

Bergabung Chrome lokal melalui profil browser OpenClaw yang sudah masuk. Mode realtime
memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan oleh OpenClaw. Untuk
audio dupleks yang bersih, gunakan perangkat virtual terpisah atau grafik gaya Loopback; satu
perangkat BlackHole cukup untuk smoke test pertama tetapi dapat menimbulkan echo.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau kunci API model di dalam VM macOS
hanya untuk membuat VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu jalankan
host Node di VM. Aktifkan Plugin bawaan pada VM satu kali agar Node
mengiklankan perintah Chrome:

Apa yang berjalan di mana:

- Host Gateway: Gateway OpenClaw, workspace agen, kunci model/API, penyedia realtime,
  dan konfigurasi Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agen, kunci OpenAI/GPT, atau penyiapan
  penyedia model.

Instal dependensi VM:

```bash
brew install blackhole-2ch sox
```

Reboot VM setelah menginstal BlackHole agar macOS mengekspos `BlackHole 2ch`:

```bash
sudo reboot
```

Setelah reboot, verifikasi VM dapat melihat perangkat audio dan perintah SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instal atau perbarui OpenClaw di VM, lalu aktifkan Plugin bawaan di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host Node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, Node menolak
WebSocket plaintext kecuali Anda ikut serta untuk jaringan privat tepercaya itu:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan variabel lingkungan yang sama saat menginstal Node sebagai LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah lingkungan proses, bukan pengaturan
`openclaw.json`. `openclaw node install` menyimpannya dalam lingkungan LaunchAgent
saat variabel itu ada pada perintah instal.

Setujui Node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat Node dan bahwa Node mengiklankan `googlemeet.chrome`
serta kapabilitas browser/`browser.proxy`:

```bash
openclaw nodes status
```

Rutekan Meet melalui Node tersebut pada host Gateway:

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

atau minta agen menggunakan alat `google_meet` dengan `transport: "chrome-node"`.

Untuk smoke test satu-perintah yang membuat atau menggunakan ulang sesi, mengucapkan frasa yang diketahui
, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama bergabung realtime, otomatisasi browser OpenClaw mengisi nama tamu, mengeklik
Join/Ask to join, dan menerima pilihan "Use microphone" first-run Meet saat
prompt tersebut muncul. Selama bergabung observe-only atau pembuatan rapat hanya-browser, otomatisasi
melanjutkan melewati prompt yang sama tanpa mikrofon saat pilihan tersebut tersedia.
Jika profil browser belum masuk, Meet sedang menunggu penerimaan host,
Chrome memerlukan izin mikrofon/kamera untuk bergabung realtime, atau Meet macet
pada prompt yang tidak dapat diselesaikan otomatisasi, hasil join/test-speech melaporkan
`manualActionRequired: true` dengan `manualActionReason` dan
`manualActionMessage`. Agent harus berhenti mencoba ulang proses bergabung, melaporkan pesan persis
tersebut beserta `browserUrl`/`browserTitle` saat ini, dan mencoba ulang hanya setelah
tindakan browser manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya saat tepat satu
node tersambung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa node yang mampu tersambung, atur `chromeNode.node` ke id node,
nama tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: node yang dipatok
  dikenal oleh Gateway tetapi tidak tersedia. Agent harus memperlakukan node tersebut sebagai
  status diagnostik, bukan sebagai host Chrome yang dapat digunakan, dan melaporkan penghalang penyiapan
  alih-alih beralih ke transport lain kecuali pengguna memintanya.
- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` telah dijalankan di VM. Konfirmasi juga bahwa
  host Gateway mengizinkan kedua perintah node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host
  yang sedang diperiksa dan reboot sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan reboot VM.
- Chrome terbuka tetapi tidak dapat bergabung: masuk ke profil browser di dalam VM, atau
  tetap tetapkan `chrome.guestName` untuk bergabung sebagai tamu. Auto-join tamu menggunakan otomatisasi
  browser OpenClaw melalui proxy browser node; pastikan konfigurasi browser node
  menunjuk ke profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil existing-session bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` aktif. OpenClaw
  mengaktifkan tab yang ada untuk URL Meet yang sama sebelum membuka yang baru, dan
  pembuatan rapat browser menggunakan ulang tab `https://meet.google.com/new`
  yang sedang berjalan atau tab prompt akun Google sebelum membuka tab lain.
- Tidak ada audio: di Meet, arahkan mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau routing bergaya Loopback
  untuk audio dupleks yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio baris perintah. Plugin menggunakan perintah perangkat CoreAudio
  eksplisit untuk bridge audio PCM16 24 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio `BlackHole 2ch`
  yang dapat dirutekan oleh Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang salah satu paket tersebut. Dokumentasi meminta pengguna
menginstalnya sebagai dependensi host melalui Homebrew. SoX dilisensikan sebagai
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membuat
installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi
upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet melalui kontrol browser OpenClaw dan bergabung
sebagai profil browser OpenClaw yang sudah masuk. Di macOS, Plugin memeriksa
`BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, Plugin juga menjalankan perintah kesehatan
bridge audio dan perintah startup sebelum membuka Chrome. Gunakan `chrome` saat
Chrome/audio berada di host Gateway; gunakan `chrome-node` saat Chrome/audio berada
di node yang dipasangkan seperti VM macOS Parallels. Untuk Chrome lokal, pilih
profil dengan `browser.defaultProfile`; `chrome.browserProfile` diteruskan ke
host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan error penyiapan
alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah dial plan ketat yang didelegasikan ke Plugin Voice Call. Ini
tidak mengurai halaman Meet untuk nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan fallback dial-in
telepon. Google Meet harus mengekspos nomor dial-in telepon dan PIN untuk
rapat; OpenClaw tidak menemukan itu dari halaman Meet.

Aktifkan Plugin Voice Call pada host Gateway, bukan pada node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

Sediakan kredensial Twilio melalui environment atau config. Environment menjaga
rahasia tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Restart atau muat ulang Gateway setelah mengaktifkan `voice-call`; perubahan config Plugin
tidak muncul dalam proses Gateway yang sudah berjalan sampai proses tersebut dimuat ulang.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Saat delegasi Twilio sudah terhubung, `googlemeet setup` menyertakan pemeriksaan
`twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan
`twilio-voice-call-webhook` yang berhasil.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` saat rapat memerlukan urutan kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

OAuth bersifat opsional untuk membuat tautan Meet karena `googlemeet create` dapat
fallback ke otomatisasi browser. Konfigurasikan OAuth saat Anda menginginkan pembuatan API resmi,
resolusi space, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta scope yang diperlukan, otorisasi akun Google, lalu simpan
refresh token yang dihasilkan dalam config Plugin Google Meet atau sediakan
variabel environment `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur bergabung Chrome. Transport Chrome dan Chrome-node
tetap bergabung melalui profil Chrome yang sudah masuk, BlackHole/SoX, dan node
tersambung saat Anda menggunakan partisipasi browser. OAuth hanya untuk jalur Google
Meet API resmi: membuat meeting spaces, meresolusi spaces, dan menjalankan pemeriksaan
preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih project Google Cloud.
2. Aktifkan **Google Meet REST API** untuk project tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan pribadi/test; saat app berada dalam Testing,
     tambahkan setiap akun Google yang akan mengotorisasi app sebagai test user.
4. Tambahkan scope yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat OAuth client ID.
   - Jenis aplikasi: **Web application**.
   - Authorized redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin client ID dan client secret.

`meetings.space.created` diperlukan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw meresolusi URL/kode Meet ke spaces.
`meetings.space.settings` memungkinkan OpenClaw meneruskan pengaturan `SpaceConfig` seperti
`accessType` selama pembuatan ruang API.
`meetings.conference.media.readonly` adalah untuk preflight Meet Media API dan pekerjaan
media; Google mungkin memerlukan pendaftaran Developer Preview untuk penggunaan Media API sebenarnya.
Jika Anda hanya memerlukan proses bergabung Chrome berbasis browser, lewati OAuth sepenuhnya.

### Buat refresh token

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, atau teruskan sebagai
variabel environment, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah mencetak blok config `oauth` dengan refresh token. Perintah ini menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
copy/paste manual dengan `--manual`.

Contoh:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gunakan mode manual saat browser tidak dapat menjangkau callback lokal:

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

Simpan objek `oauth` di bawah config Plugin Google Meet:

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

Pilih variabel environment saat Anda tidak ingin refresh token berada dalam config.
Jika nilai config dan environment sama-sama ada, Plugin meresolusi config
terlebih dahulu lalu fallback environment.

Persetujuan OAuth mencakup pembuatan space Meet, akses baca space Meet, dan akses baca media
konferensi Meet. Jika Anda melakukan autentikasi sebelum dukungan pembuatan rapat
tersedia, jalankan ulang `openclaw googlemeet auth login --json` agar refresh
token memiliki scope `meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan doctor OAuth saat Anda menginginkan pemeriksaan kesehatan cepat tanpa rahasia:

```bash
openclaw googlemeet doctor --oauth --json
```

Ini tidak memuat runtime Chrome atau memerlukan node Chrome tersambung. Ini
memeriksa bahwa config OAuth ada dan refresh token dapat membuat access
token. Laporan JSON hanya mencakup field status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; laporan tersebut tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Arti                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau access token cache, tersedia.          |
| `oauth-token`        | Access token cache masih valid, atau refresh token membuat access token baru.           |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` meresolusi space Meet yang ada.                        |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat space Meet baru.                          |

Untuk membuktikan pengaktifan Google Meet API dan scope `spaces.create` juga, jalankan
pemeriksaan create yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sementara. Gunakan saat Anda perlu memastikan
bahwa project Google Cloud telah mengaktifkan Meet API dan bahwa akun yang
diotorisasi memiliki cakupan `meetings.space.created`.

Untuk membuktikan akses baca bagi ruang rapat yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke ruang
yang sudah ada dan dapat diakses oleh akun Google yang diotorisasi. Respons
`403` dari pemeriksaan ini biasanya berarti Google Meet REST API dinonaktifkan,
refresh token yang disetujui tidak memiliki cakupan yang diperlukan, atau akun
Google tidak dapat mengakses ruang Meet tersebut. Error refresh-token berarti
jalankan ulang `openclaw googlemeet auth login --json` dan simpan blok `oauth`
baru.

Kredensial OAuth tidak diperlukan untuk fallback browser. Dalam mode itu,
autentikasi Google berasal dari profil Chrome yang sudah login pada node yang
dipilih, bukan dari konfigurasi OpenClaw.

Variabel lingkungan ini diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Resolusi URL Meet, kode, atau `spaces/{id}` melalui `spaces.get`:

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

Dengan `--meeting`, `artifacts` dan `attendance` menggunakan catatan konferensi
terbaru secara default. Berikan `--all-conference-records` saat Anda menginginkan
setiap catatan yang dipertahankan untuk rapat tersebut.

Pencarian Calendar dapat menyelesaikan URL rapat dari Google Calendar sebelum
membaca artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari kalender `primary` hari ini untuk acara Calendar yang memiliki
tautan Google Meet. Gunakan `--event <query>` untuk mencari teks acara yang
cocok, dan `--calendar <id>` untuk kalender non-utama. Pencarian Calendar
memerlukan login OAuth baru yang menyertakan cakupan hanya-baca acara Calendar.
`calendar-events` mempratinjau acara Meet yang cocok dan menandai acara yang
akan dipilih oleh `latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui ID catatan konferensi, alamatkan secara langsung:

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

Ini memanggil Google Meet `spaces.endActiveConference` dan memerlukan OAuth
dengan cakupan `meetings.space.created` untuk ruang yang dapat dikelola oleh akun
yang diotorisasi. OpenClaw menerima input URL Meet, kode rapat, atau
`spaces/{id}` dan menyelesaikannya ke sumber daya ruang API sebelum mengakhiri
konferensi aktif.
Ini terpisah dari `googlemeet leave`: `leave` menghentikan partisipasi
lokal/sesi OpenClaw, sedangkan `end-active-conference` meminta Google Meet untuk
mengakhiri konferensi aktif bagi ruang tersebut.

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

`artifacts` mengembalikan metadata catatan konferensi plus metadata sumber daya
peserta, rekaman, transkrip, entri transkrip terstruktur, dan catatan pintar saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries`
untuk melewati pencarian entri bagi rapat besar. `attendance` memperluas peserta
menjadi baris sesi-peserta dengan waktu pertama/terakhir terlihat, total durasi
sesi, flag terlambat/pulang lebih awal, dan sumber daya peserta duplikat yang
digabung berdasarkan pengguna yang login atau nama tampilan. Berikan
`--no-merge-duplicates` untuk menjaga sumber daya peserta mentah tetap terpisah,
`--late-after-minutes` untuk menyesuaikan deteksi keterlambatan, dan
`--early-before-minutes` untuk menyesuaikan deteksi pulang lebih awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, catatan konferensi,
file output, jumlah, sumber token, acara Calendar saat digunakan, dan peringatan
pengambilan parsial. Berikan `--zip` untuk juga menulis arsip portabel di
sebelah folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs
transkrip tertaut dan catatan pintar melalui Google Drive `files.export`; ini
memerlukan login OAuth baru yang menyertakan cakupan hanya-baca Drive Meet.
Tanpa `--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri
transkrip terstruktur. Jika Google mengembalikan kegagalan artefak parsial,
seperti error pencantuman catatan pintar, entri transkrip, atau isi dokumen
Drive, ringkasan dan manifes mempertahankan peringatan alih-alih menggagalkan
seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan
mencetak JSON manifes tanpa membuat folder atau ZIP. Itu berguna sebelum menulis
ekspor besar atau saat agen hanya membutuhkan jumlah, catatan yang dipilih, dan
peringatan.

Agen juga dapat membuat bundel yang sama melalui alat `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Tetapkan `"dryRun": true` untuk hanya mengembalikan manifes ekspor dan melewati
penulisan file.

Agen juga dapat membuat ruang berbasis API dengan kebijakan akses eksplisit:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

Untuk validasi dengarkan-dulu, agen harus menggunakan `test_listen` sebelum
mengklaim rapat itu berguna:

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

Jalankan probe browser dengarkan-dulu secara live terhadap rapat tempat seseorang
akan berbicara dengan teks Meet tersedia:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Lingkungan live smoke:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan pengujian live yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL Meet, kode, atau
  `spaces/{id}` yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan ID
  klien OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
  menyediakan refresh token.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang
  sama tanpa prefiks `OPENCLAW_`.

Live smoke artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Pencarian
Calendar memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`.
Ekspor isi dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah mencetak `meeting uri`, sumber, dan sesi bergabung baru. Dengan
kredensial OAuth, perintah menggunakan Google Meet API resmi. Tanpa kredensial
OAuth, perintah menggunakan profil browser yang sudah login pada node Chrome
yang dipinkan sebagai fallback. Agen dapat menggunakan alat `google_meet` dengan
`action: "create"` untuk membuat dan bergabung dalam satu langkah. Untuk
pembuatan hanya-URL, berikan `"join": false`.

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

Jika fallback browser menemui login Google atau penghambat izin Meet sebelum
dapat membuat URL, metode Gateway mengembalikan respons gagal dan alat
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
`manualActionMessage` beserta konteks node/tab browser dan berhenti membuka tab
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

Membuat Meet akan bergabung secara default. Transport Chrome atau Chrome-node
tetap memerlukan profil Google Chrome yang sudah login untuk bergabung melalui
browser. Jika profil sudah logout, OpenClaw melaporkan
`manualActionRequired: true` atau error fallback browser dan meminta operator
menyelesaikan login Google sebelum mencoba lagi.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi
bahwa project Cloud, principal OAuth, dan peserta rapat Anda terdaftar dalam
Google Workspace Developer Preview Program untuk Meet media APIs.

## Konfigurasi

Jalur realtime Chrome umum hanya memerlukan Plugin diaktifkan, BlackHole, SoX,
dan kunci penyedia suara realtime backend. OpenAI adalah default; tetapkan
`realtime.provider: "google"` untuk menggunakan Google Gemini Live:

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

Nilai default:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nama/IP node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet yang belum masuk
- `chrome.autoJoin: true`: upaya terbaik untuk mengisi nama tamu dan mengeklik Gabung Sekarang melalui otomatisasi browser OpenClaw di `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang sudah ada alih-alih membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu tab Meet melaporkan sudah dalam panggilan sebelum intro waktu nyata dipicu
- `chrome.audioFormat: "pcm16-24khz"`: format audio pasangan perintah. Gunakan `"g711-ulaw-8khz"` hanya untuk pasangan perintah lama/kustom yang masih menghasilkan audio telepon.
- `chrome.audioInputCommand`: perintah SoX yang membaca dari CoreAudio `BlackHole 2ch` dan menulis audio dalam `chrome.audioFormat`
- `chrome.audioOutputCommand`: perintah SoX yang membaca audio dalam `chrome.audioFormat` dan menulis ke CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: perintah mikrofon lokal opsional yang menulis PCM mono little-endian 16-bit bertanda untuk deteksi interupsi manusia saat pemutaran asisten aktif. Ini saat ini berlaku untuk jembatan pasangan perintah `chrome` yang dihosting Gateway.
- `chrome.bargeInRmsThreshold: 650`: level RMS yang dihitung sebagai interupsi manusia pada `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: level puncak yang dihitung sebagai interupsi manusia pada `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: jeda minimum antara pembersihan interupsi manusia berulang
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat jembatan waktu nyata tersambung; atur ke `""` untuk bergabung tanpa suara
- `realtime.agentId`: id agen OpenClaw opsional untuk `openclaw_agent_consult`; default ke `main`

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
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

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

`voiceCall.enabled` default ke `true`; dengan transport Twilio, ini mendelegasikan panggilan PSTN, DTMF, dan sapaan intro yang sebenarnya ke plugin Voice Call. Voice Call memutar urutan DTMF sebelum membuka stream media waktu nyata, lalu menggunakan teks intro yang tersimpan sebagai sapaan waktu nyata awal. Jika `voice-call` tidak diaktifkan, Google Meet masih dapat memvalidasi dan merekam rencana panggilan, tetapi tidak dapat melakukan panggilan Twilio.

## Alat

Agen dapat menggunakan alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan `transport: "chrome-node"` saat Chrome berjalan di node yang dipasangkan seperti VM Parallels. Dalam kedua kasus, model waktu nyata dan `openclaw_agent_consult` berjalan di host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan `action: "speak"` dengan `sessionId` dan `message` untuk membuat agen waktu nyata langsung berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan kembali sesi, memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat melaporkannya. `test_speech` selalu memaksa `mode: "realtime"` dan gagal jika diminta berjalan dalam `mode: "transcribe"` karena sesi hanya-observasi secara sengaja tidak dapat menghasilkan ucapan. Hasil `speechOutputVerified` didasarkan pada byte keluaran audio waktu nyata yang meningkat selama panggilan uji ini, sehingga sesi yang digunakan kembali dengan audio lama tidak dihitung sebagai pemeriksaan ucapan baru yang berhasil. Gunakan `action: "leave"` untuk menandai sesi berakhir.

`status` menyertakan kesehatan Chrome jika tersedia:

- `inCall`: Chrome tampaknya berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet berdasarkan upaya terbaik
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil browser memerlukan login manual, penerimaan host Meet, izin, atau perbaikan kontrol browser sebelum ucapan dapat berfungsi
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: apakah ucapan Chrome terkelola diizinkan sekarang. `speechReady: false` berarti OpenClaw tidak mengirim frasa intro/uji ke jembatan audio.
- `providerConnected` / `realtimeReady`: status jembatan suara waktu nyata
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke jembatan
- `lastSuppressedInputAt` / `suppressedInputBytes`: input loopback yang diabaikan saat pemutaran asisten aktif

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen waktu nyata

Mode waktu nyata Chrome dioptimalkan untuk loop suara langsung. Penyedia suara waktu nyata mendengar audio rapat dan berbicara melalui jembatan audio yang dikonfigurasi. Saat model waktu nyata membutuhkan penalaran yang lebih mendalam, informasi terkini, atau alat OpenClaw normal, model tersebut dapat memanggil `openclaw_agent_consult`.

Alat konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan ringkas ke sesi suara waktu nyata. Model suara kemudian dapat mengucapkan jawaban itu kembali ke rapat. Ini menggunakan alat konsultasi waktu nyata bersama yang sama seperti Voice Call.

Secara default, konsultasi berjalan pada agen `main`. Tetapkan `realtime.agentId` saat jalur Meet harus berkonsultasi dengan workspace agen OpenClaw khusus, default model, kebijakan alat, memori, dan riwayat sesi.

`realtime.toolPolicy` mengontrol proses konsultasi:

- `safe-read-only`: tampilkan alat konsultasi dan batasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`.
- `owner`: tampilkan alat konsultasi dan izinkan agen reguler menggunakan kebijakan alat agen normal.
- `none`: jangan tampilkan alat konsultasi ke model suara waktu nyata.

Kunci sesi konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan dapat menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Untuk smoke join-and-speak penuh:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Daftar periksa uji live

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
- `googlemeet setup` menyertakan `chrome-node-connected` saat Chrome-node adalah transport default atau sebuah node dipin.
- `nodes status` menampilkan node yang dipilih tersambung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan `inCall: true`.

Untuk host Chrome jarak jauh seperti VM Parallels macOS, ini adalah pemeriksaan aman tersingkat setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Itu membuktikan plugin Gateway dimuat, node VM tersambung dengan token saat ini, dan jembatan audio Meet tersedia sebelum agen membuka tab rapat sungguhan.

Untuk smoke Twilio, gunakan rapat yang menampilkan detail dial-in telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` menyertakan pemeriksaan hijau `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan `twilio-voice-call-webhook`.
- `voicecall` tersedia di CLI setelah Gateway dimuat ulang.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `openclaw logs --follow` menampilkan DTMF TwiML disajikan sebelum TwiML waktu nyata, lalu jembatan waktu nyata dengan sapaan awal diantrikan.
- `googlemeet leave <sessionId>` menutup panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat alat Google Meet

Pastikan plugin diaktifkan dalam konfigurasi Gateway dan muat ulang Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, mulai ulang atau muat ulang Gateway. Agen yang berjalan hanya melihat alat plugin yang didaftarkan oleh proses Gateway saat ini.

Pada host Gateway non-macOS, alat `google_meet` yang menghadap agen tetap terlihat, tetapi tindakan waktu nyata Chrome lokal diblokir sebelum mencapai jembatan audio. Audio waktu nyata Chrome lokal saat ini bergantung pada `BlackHole 2ch` macOS, sehingga agen Linux sebaiknya menggunakan `mode: "transcribe"`, dial-in Twilio, atau host `chrome-node` macOS alih-alih jalur waktu nyata Chrome lokal default.

### Tidak ada node yang mendukung Google Meet dan tersambung

Di host node, jalankan:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Di host Gateway, setujui node dan verifikasi perintah:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node harus tersambung dan mencantumkan `googlemeet.chrome` plus `browser.proxy`. Konfigurasi Gateway harus mengizinkan perintah node tersebut:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jika `googlemeet setup` gagal pada `chrome-node-connected` atau log Gateway melaporkan `gateway token mismatch`, instal ulang atau mulai ulang node dengan token Gateway saat ini. Untuk Gateway LAN, ini biasanya berarti:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Lalu muat ulang layanan node dan jalankan kembali:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-listen` untuk join hanya-observasi atau `googlemeet test-speech` untuk join waktu nyata, lalu periksa kesehatan Chrome yang dikembalikan. Jika salah satu probe melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator dan berhenti mencoba ulang hingga tindakan browser selesai.

Tindakan manual umum:

- Masuk ke profil Chrome.
- Terima tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "belum masuk" hanya karena Meet menampilkan "Apakah Anda ingin orang lain
mendengar Anda dalam rapat?" Itu adalah interstisial pilihan audio Meet; OpenClaw
mengklik **Gunakan mikrofon** melalui otomasi browser saat tersedia dan tetap
menunggu status rapat yang sebenarnya. Untuk fallback browser khusus pembuatan, OpenClaw
dapat mengklik **Lanjutkan tanpa mikrofon** karena membuat URL tidak memerlukan
jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create`
saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, perintah ini melakukan fallback
ke browser node Chrome yang dipin. Konfirmasikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang cocok tersedia.
- Untuk pembuatan API: token refresh dibuat setelah dukungan pembuatan
  ditambahkan. Token lama mungkin tidak memiliki cakupan `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` menunjuk ke node yang terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw di node tersebut sudah masuk
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan kembali tab
  `https://meet.google.com/new` atau prompt akun Google yang sudah ada sebelum membuka tab baru. Jika agen kehabisan waktu,
  coba ulang panggilan tool alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika tool mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan mencoba ulang dalam loop sampai
  tindakan tersebut selesai.
- Untuk fallback browser: jika Meet menampilkan "Apakah Anda ingin orang lain mendengar Anda dalam
  rapat?", biarkan tab tetap terbuka. OpenClaw seharusnya mengklik **Gunakan mikrofon** atau, untuk
  fallback khusus pembuatan, **Lanjutkan tanpa mikrofon** melalui otomasi browser
  dan terus menunggu URL Meet yang dihasilkan. Jika tidak bisa, kesalahan
  harus menyebutkan `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk mendengarkan/berbicara balik. `mode: "transcribe"` sengaja
tidak memulai jembatan suara realtime dupleks. Untuk debugging hanya-observasi,
jalankan `openclaw googlemeet status --json <session-id>` setelah peserta berbicara
dan periksa `captioning`, `transcriptLines`, dan `lastCaptionText`. Jika `inCall`
bernilai true tetapi `transcriptLines` tetap `0`, teks Meet mungkin dinonaktifkan, belum ada orang
yang berbicara sejak observer dipasang, UI Meet berubah, atau live
captions tidak tersedia untuk bahasa/akun rapat tersebut.

`googlemeet test-speech` selalu memeriksa jalur realtime dan melaporkan apakah
byte keluaran jembatan teramati untuk invocation tersebut. Jika `speechOutputVerified` bernilai false dan
`speechOutputTimedOut` bernilai true, penyedia realtime mungkin sudah menerima
ucapan, tetapi OpenClaw tidak melihat byte keluaran baru mencapai jembatan audio
Chrome.

Verifikasi juga:

- Kunci penyedia realtime tersedia di host Gateway, seperti
  `OPENAI_API_KEY` atau `GEMINI_API_KEY`.
- `BlackHole 2ch` terlihat di host Chrome.
- `sox` ada di host Chrome.
- Mikrofon dan speaker Meet dirutekan melalui jalur audio virtual yang digunakan oleh
  OpenClaw.

`googlemeet doctor [session-id]` mencetak sesi, node, status dalam panggilan,
alasan tindakan manual, koneksi penyedia realtime, `realtimeReady`, aktivitas
input/output audio, timestamp audio terakhir, penghitung byte, dan URL browser.
Gunakan `googlemeet status [session-id] --json` saat Anda memerlukan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh OAuth Google Meet
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga memerlukan
bukti Google Meet API.

Jika agen kehabisan waktu dan Anda melihat tab Meet sudah terbuka, inspeksi tab tersebut
tanpa membuka tab lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Tindakan tool yang setara adalah `recover_current_tab`. Tindakan ini memfokuskan dan menginspeksi
tab Meet yang sudah ada untuk transport yang dipilih. Dengan `chrome`, tindakan ini menggunakan kontrol
browser lokal melalui Gateway; dengan `chrome-node`, tindakan ini menggunakan node Chrome yang dikonfigurasi. Tindakan ini tidak membuka tab baru atau membuat sesi baru; tindakan ini melaporkan
pemblokir saat ini, seperti login, penerimaan, izin, atau status pilihan audio.
Perintah CLI berbicara ke Gateway yang dikonfigurasi, jadi Gateway harus berjalan;
`chrome-node` juga mengharuskan node Chrome terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan muat ulang
Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki account
SID, auth token, atau nomor pemanggil. Atur ini di host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` gagal saat `voice-call` tidak memiliki eksposur Webhook
publik, atau saat `publicUrl` menunjuk ke local loopback atau ruang jaringan privat.
Atur `plugins.entries.voice-call.config.publicUrl` ke URL penyedia publik atau
konfigurasikan tunnel/eksposur Tailscale `voice-call`.

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

Untuk pengembangan lokal, gunakan tunnel atau eksposur Tailscale alih-alih URL host
privat:

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

`voicecall smoke` secara default hanya memeriksa kesiapan. Untuk dry-run nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya saat Anda sengaja ingin melakukan panggilan pemberitahuan
keluar langsung:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Konfirmasikan bahwa acara Meet mengekspos detail dial-in telepon. Teruskan nomor dial-in
dan PIN yang tepat atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan awalan `w` atau koma di `--dtmf-sequence` jika penyedia memerlukan jeda
sebelum memasukkan PIN.

Jika panggilan telepon dibuat tetapi daftar peserta Meet tidak pernah menampilkan peserta
dial-in:

- Jalankan `openclaw googlemeet doctor <session-id>` untuk mengonfirmasi ID panggilan Twilio
  yang didelegasikan, apakah DTMF diantrekan, dan apakah salam pembuka diminta.
- Jalankan `openclaw voicecall status --call-id <id>` dan konfirmasikan panggilan masih
  aktif.
- Jalankan `openclaw voicecall tail` dan periksa bahwa Webhook Twilio tiba di
  Gateway.
- Jalankan `openclaw logs --follow` dan cari urutan Twilio Meet: Google
  Meet mendelegasikan join, Voice Call memulai leg telepon, Google Meet menunggu
  `voiceCall.dtmfDelayMs`, mengirim DTMF dengan `voicecall.dtmf`, menunggu
  `voiceCall.postDtmfSpeechDelayMs`, lalu meminta ucapan pembuka dengan
  `voicecall.speak`.
- Jalankan ulang `openclaw googlemeet setup --transport twilio`; pemeriksaan penyiapan yang hijau
  diperlukan tetapi tidak membuktikan urutan PIN rapat benar.
- Konfirmasikan nomor dial-in berasal dari undangan dan wilayah Meet yang sama dengan
  PIN.
- Tingkatkan `voiceCall.dtmfDelayMs` jika Meet menjawab lambat atau transkrip panggilan
  masih menampilkan prompt yang meminta PIN setelah DTMF dikirim.
- Jika peserta bergabung tetapi Anda tidak mendengar salam, periksa
  `openclaw logs --follow` untuk permintaan `voicecall.speak` pasca-DTMF dan
  baik pemutaran TTS media-stream maupun fallback Twilio `<Say>`. Jika transkrip panggilan
  masih berisi "masukkan PIN rapat", leg telepon belum bergabung
  ke ruang Meet, jadi peserta rapat tidak akan mendengar ucapan.

Jika Webhook tidak tiba, debug Plugin Voice Call terlebih dahulu: penyedia harus
mencapai `plugins.entries.voice-call.config.publicUrl` atau tunnel yang dikonfigurasi.
Lihat [Pemecahan masalah panggilan suara](/id/plugins/voice-call#troubleshooting).

## Catatan

Media API resmi Google Meet berorientasi pada penerimaan, jadi berbicara ke panggilan Meet
tetap memerlukan jalur peserta. Plugin ini membuat batas tersebut tetap terlihat:
Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome memerlukan `BlackHole 2ch` plus salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki
  jembatan model realtime dan menyalurkan audio dalam `chrome.audioFormat` antara perintah tersebut
  dan penyedia suara realtime yang dipilih. Jalur Chrome default adalah
  PCM16 24 kHz; G.711 mu-law 8 kHz tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah jembatan eksternal memiliki seluruh jalur audio
  lokal dan harus keluar setelah memulai atau memvalidasi daemonnya.

Untuk audio dupleks yang bersih, rutekan keluaran Meet dan mikrofon Meet melalui perangkat
virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat memantulkan audio peserta lain kembali ke panggilan.

Dengan jembatan Chrome pasangan perintah, `chrome.bargeInInputCommand` dapat mendengarkan
mikrofon lokal terpisah dan membersihkan pemutaran asisten saat manusia mulai
berbicara. Ini menjaga ucapan manusia tetap mendahului keluaran asisten bahkan saat input
local loopback BlackHole bersama ditekan sementara selama pemutaran asisten.
Seperti `chrome.audioInputCommand` dan `chrome.audioOutputCommand`, ini adalah
perintah lokal yang dikonfigurasi operator. Gunakan path perintah tepercaya yang eksplisit atau
daftar argumen, dan jangan arahkan ke skrip dari lokasi yang tidak tepercaya.

`googlemeet speak` memicu jembatan audio realtime aktif untuk sesi Chrome.
`googlemeet leave` menghentikan jembatan tersebut. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.
Gunakan `googlemeet end-active-conference` saat Anda juga ingin menutup konferensi
Google Meet aktif untuk ruang yang dikelola API.

## Terkait

- [Plugin panggilan suara](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun Plugin](/id/plugins/building-plugins)

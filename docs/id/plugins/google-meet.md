---
read_when:
    - Anda ingin agen OpenClaw bergabung dalam panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, Chrome node, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T09:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef6945172fed00e5583f655789fab9734e5232c6820bd3fafe7d7c4a48e2f33a
    source_path: plugins/google-meet.md
    workflow: 16
---

Dukungan peserta Google Meet untuk OpenClaw - Plugin ini secara desain bersifat eksplisit:

- Plugin ini hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin ini dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- Suara `realtime` adalah mode bawaan.
- Suara realtime dapat memanggil kembali agen OpenClaw penuh saat penalaran yang lebih
  dalam atau alat diperlukan.
- Agen memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk mendengar/
  berbicara balik secara langsung, atau `transcribe` untuk bergabung/mengendalikan
  browser tanpa bridge suara realtime.
- Auth dimulai sebagai Google OAuth pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome bawaan adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host Node yang dipasangkan.
- Twilio menerima nomor dial-in ditambah PIN atau urutan DTMF opsional.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur telekonferensi
  agen yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan konfigurasikan penyedia suara realtime backend.
OpenAI adalah bawaan; Google Gemini Live juga berfungsi dengan
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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

Output penyiapan dimaksudkan agar dapat dibaca agen dan sadar mode. Output ini
melaporkan profil Chrome, pinning Node, dan, untuk bergabung Chrome realtime,
bridge audio BlackHole/SoX serta pemeriksaan intro realtime tertunda. Untuk
bergabung hanya-observasi, periksa transport yang sama dengan `--mode transcribe`;
mode tersebut melewati prasyarat audio realtime karena tidak mendengar melalui
atau berbicara melalui bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Saat delegasi Twilio dikonfigurasi, penyiapan juga melaporkan apakah Plugin
`voice-call`, kredensial Twilio, dan eksposur Webhook publik sudah siap.
Anggap setiap pemeriksaan `ok: false` sebagai pemblokir untuk transport dan mode
yang diperiksa sebelum meminta agen bergabung. Gunakan `openclaw googlemeet setup --json` untuk
skrip atau output yang dapat dibaca mesin. Gunakan `--transport chrome`,
`--transport chrome-node`, atau `--transport twilio` untuk memeriksa awal transport
tertentu sebelum agen mencobanya.

Untuk Twilio, selalu periksa awal transport secara eksplisit saat transport bawaan
adalah Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Ini menangkap wiring `voice-call` yang hilang, kredensial Twilio, atau eksposur
Webhook yang tidak dapat dijangkau sebelum agen mencoba menelepon rapat.

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

Alat `google_meet` yang dihadapkan ke agen tetap tersedia pada host non-macOS
untuk alur artefak, kalender, penyiapan, transkripsi, Twilio, dan `chrome-node`.
Tindakan Chrome realtime lokal diblokir di sana karena jalur audio Chrome realtime
bawaan saat ini bergantung pada macOS `BlackHole 2ch`. Di Linux, gunakan
`mode: "transcribe"`, dial-in Twilio, atau host macOS `chrome-node` untuk
partisipasi Chrome realtime.

Buat rapat baru dan bergabung ke dalamnya:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Untuk ruang yang dibuat API, gunakan Google Meet `SpaceConfig.accessType` saat Anda ingin
kebijakan tanpa-ketuk ruang tersebut eksplisit, bukan diwarisi dari bawaan akun
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` memungkinkan siapa pun dengan URL Meet bergabung tanpa mengetuk. `TRUSTED`
memungkinkan pengguna tepercaya organisasi host, pengguna eksternal yang diundang,
dan pengguna dial-in bergabung tanpa mengetuk. `RESTRICTED` membatasi masuk
tanpa-ketuk hanya untuk undangan. Pengaturan ini hanya berlaku untuk jalur pembuatan
Google Meet API resmi, jadi kredensial OAuth harus dikonfigurasi.

Jika Anda mengautentikasi Google Meet sebelum opsi ini tersedia, jalankan ulang
`openclaw googlemeet auth login --json` setelah menambahkan scope
`meetings.space.settings` ke layar persetujuan Google OAuth Anda.

Buat URL saja tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Buat API: digunakan saat kredensial Google Meet OAuth dikonfigurasi. Ini adalah
  jalur yang paling deterministik dan tidak bergantung pada status UI browser.
- Fallback browser: digunakan saat kredensial OAuth tidak ada. OpenClaw menggunakan
  Node Chrome yang dipin, membuka `https://meet.google.com/new`, menunggu Google
  mengalihkan ke URL kode rapat nyata, lalu mengembalikan URL tersebut. Jalur ini
  mengharuskan profil Chrome OpenClaw pada Node sudah masuk ke Google. Otomasi
  browser menangani prompt mikrofon pertama milik Meet; prompt tersebut tidak
  diperlakukan sebagai kegagalan login Google.
  Alur bergabung dan membuat juga mencoba menggunakan ulang tab Meet yang sudah ada
  sebelum membuka yang baru. Pencocokan mengabaikan string kueri URL yang tidak
  berbahaya seperti `authuser`, sehingga percobaan ulang agen seharusnya memfokuskan
  rapat yang sudah terbuka, bukan membuat tab Chrome kedua.

Output perintah/alat menyertakan field `source` (`api` atau `browser`) sehingga
agen dapat menjelaskan jalur mana yang digunakan. `create` secara bawaan bergabung
ke rapat baru dan mengembalikan `joined: true` plus sesi bergabung. Untuk hanya
menerbitkan URL, gunakan `create --no-join` pada CLI atau teruskan `"join": false`
ke alat.

Atau beri tahu agen: "Buat Google Meet, bergabung dengan suara realtime, dan kirim
tautannya kepada saya." Agen harus memanggil `google_meet` dengan `action: "create"`
lalu membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk bergabung hanya-observasi/kontrol-browser, tetapkan `"mode": "transcribe"`.
Itu tidak memulai bridge model realtime dupleks, tidak memerlukan BlackHole atau SoX,
dan tidak akan berbicara balik ke rapat. Bergabung Chrome dalam mode ini juga
menghindari pemberian izin mikrofon/kamera OpenClaw dan menghindari jalur Meet
**Gunakan mikrofon**. Jika Meet menampilkan interstisial pilihan audio, otomasi
mencoba jalur tanpa mikrofon dan jika tidak bisa akan melaporkan tindakan manual
alih-alih membuka mikrofon lokal. Dalam mode transkripsi, transport Chrome terkelola
juga memasang pengamat caption Meet upaya-terbaik. `googlemeet status --json` dan
`googlemeet doctor` menampilkan `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
dan ekor `recentTranscript` pendek sehingga operator dapat mengetahui apakah browser
bergabung ke panggilan dan apakah caption Meet menghasilkan teks.
Gunakan `openclaw googlemeet test-listen <meet-url> --transport chrome-node` saat
Anda memerlukan probe ya/tidak: perintah ini bergabung dalam mode transkripsi,
menunggu caption baru atau pergerakan transkrip, dan mengembalikan `listenVerified`,
`listenTimedOut`, field tindakan manual, serta kesehatan caption terbaru.

Selama sesi realtime, status `google_meet` menyertakan kesehatan browser dan bridge
audio seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output
terakhir, penghitung byte, dan status bridge tertutup. Jika prompt halaman Meet yang
aman muncul, otomasi browser menanganinya saat mampu. Prompt login, penerimaan host,
dan izin browser/OS dilaporkan sebagai tindakan manual dengan alasan dan pesan untuk
disampaikan agen. Sesi Chrome terkelola hanya memancarkan intro atau frasa uji
setelah kesehatan browser melaporkan `inCall: true`; jika tidak, status melaporkan
`speechReady: false` dan percobaan bicara diblokir alih-alih berpura-pura agen
berbicara ke rapat.

Bergabung Chrome lokal melalui profil browser OpenClaw yang sudah masuk. Mode realtime
memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan OpenClaw.
Untuk audio dupleks yang bersih, gunakan perangkat virtual terpisah atau grafik
bergaya Loopback; satu perangkat BlackHole cukup untuk uji smoke pertama tetapi dapat
menimbulkan gema.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau kunci API model di dalam VM
macOS hanya agar VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu
jalankan host Node di VM. Aktifkan Plugin bawaan pada VM sekali agar Node
mengiklankan perintah Chrome:

Yang berjalan di mana:

- Host Gateway: Gateway OpenClaw, workspace agen, kunci model/API, penyedia realtime,
  dan konfigurasi Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang sudah masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agen, kunci OpenAI/GPT, atau
  penyiapan penyedia model.

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

Instal atau perbarui OpenClaw di VM, lalu aktifkan Plugin bawaan di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host Node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, Node menolak
WebSocket teks polos kecuali Anda ikut serta untuk jaringan pribadi tepercaya itu:

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
`openclaw.json`. `openclaw node install` menyimpannya di lingkungan LaunchAgent
saat variabel itu ada pada perintah instal.

Setujui Node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pastikan Gateway melihat Node tersebut dan Node mengiklankan `googlemeet.chrome`
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

Untuk uji smoke satu perintah yang membuat atau menggunakan ulang sesi, mengucapkan
frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama join realtime, automasi browser OpenClaw mengisi nama tamu, mengeklik
Join/Ask to join, dan menerima pilihan "Use microphone" first-run Meet saat
prompt itu muncul. Selama join observe-only atau pembuatan rapat browser-only,
automasi melanjutkan melewati prompt yang sama tanpa mikrofon saat pilihan itu tersedia.
Jika profil browser belum masuk, Meet menunggu penerimaan host,
Chrome memerlukan izin mikrofon/kamera untuk join realtime, atau Meet tertahan
pada prompt yang tidak dapat diselesaikan automasi, hasil join/test-speech melaporkan
`manualActionRequired: true` dengan `manualActionReason` dan
`manualActionMessage`. Agent harus berhenti mencoba ulang join, melaporkan pesan persis itu
ditambah `browserUrl`/`browserTitle` saat ini, dan mencoba ulang hanya setelah
tindakan browser manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya saat tepat satu
node terhubung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa node yang mampu terhubung, atur `chromeNode.node` ke id node,
nama tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: node yang dipin
  diketahui oleh Gateway tetapi tidak tersedia. Agent harus memperlakukan node itu sebagai
  keadaan diagnostik, bukan sebagai host Chrome yang dapat digunakan, dan melaporkan blocker setup
  alih-alih fallback ke transport lain kecuali pengguna memintanya.
- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` dijalankan di VM. Pastikan juga host
  Gateway mengizinkan kedua perintah node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host
  yang sedang diperiksa dan reboot sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan reboot VM.
- Chrome terbuka tetapi tidak dapat join: masuk ke profil browser di dalam VM, atau
  biarkan `chrome.guestName` diatur untuk join sebagai tamu. Auto-join tamu menggunakan automasi
  browser OpenClaw melalui proxy browser node; pastikan konfigurasi browser node
  mengarah ke profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil existing-session bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` aktif. OpenClaw
  mengaktifkan tab yang sudah ada untuk URL Meet yang sama sebelum membuka tab baru, dan
  pembuatan rapat browser menggunakan ulang tab `https://meet.google.com/new`
  yang sedang berjalan atau prompt akun Google sebelum membuka tab lain.
- Tidak ada audio: di Meet, arahkan audio mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau routing bergaya Loopback
  untuk audio duplex yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio baris perintah. Plugin menggunakan perintah perangkat CoreAudio
  eksplisit untuk bridge audio PCM16 24 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio `BlackHole 2ch`
  yang dapat digunakan Chrome/Meet sebagai rute.

OpenClaw tidak membundel atau mendistribusikan ulang kedua paket tersebut. Dokumentasi meminta pengguna untuk
menginstalnya sebagai dependensi host melalui Homebrew. SoX dilisensikan sebagai
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membuat
installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi
upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet melalui kontrol browser OpenClaw dan join
sebagai profil browser OpenClaw yang sudah masuk. Di macOS, Plugin memeriksa
`BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, Plugin juga menjalankan perintah
kesehatan bridge audio dan perintah startup sebelum membuka Chrome. Gunakan `chrome` saat
Chrome/audio berada di host Gateway; gunakan `chrome-node` saat Chrome/audio berada
di node yang dipasangkan seperti VM macOS Parallels. Untuk Chrome lokal, pilih
profil dengan `browser.defaultProfile`; `chrome.browserProfile` diteruskan ke
host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Arahkan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, join gagal dengan error setup
alih-alih diam-diam join tanpa jalur audio.

### Twilio

Transport Twilio adalah dial plan ketat yang didelegasikan ke Plugin Voice Call. Ini
tidak mem-parse halaman Meet untuk nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan fallback dial-in
telepon. Google Meet harus mengekspos nomor dial-in telepon dan PIN untuk
rapat; OpenClaw tidak menemukan keduanya dari halaman Meet.

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

Sediakan kredensial Twilio melalui environment atau konfigurasi. Environment menjaga
rahasia tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Restart atau reload Gateway setelah mengaktifkan `voice-call`; perubahan konfigurasi plugin
tidak muncul dalam proses Gateway yang sudah berjalan sampai proses tersebut reload.

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

OAuth opsional untuk membuat tautan Meet karena `googlemeet create` dapat fallback
ke automasi browser. Konfigurasikan OAuth saat Anda menginginkan pembuatan API resmi,
resolusi space, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta scope yang diperlukan, otorisasi akun Google, lalu simpan
refresh token yang dihasilkan di konfigurasi Plugin Google Meet atau sediakan
variabel environment `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur join Chrome. Transport Chrome dan Chrome-node
tetap join melalui profil Chrome yang sudah masuk, BlackHole/SoX, dan node yang terhubung
saat Anda menggunakan partisipasi browser. OAuth hanya untuk jalur Google
Meet API resmi: membuat meeting spaces, me-resolve spaces, dan menjalankan pemeriksaan preflight
Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih proyek Google Cloud.
2. Aktifkan **Google Meet REST API** untuk proyek tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** adalah yang paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk setup pribadi/pengujian; saat aplikasi berada dalam Testing,
     tambahkan setiap akun Google yang akan mengotorisasi aplikasi sebagai test user.
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
`meetings.space.readonly` memungkinkan OpenClaw me-resolve URL/kode Meet ke spaces.
`meetings.space.settings` memungkinkan OpenClaw meneruskan pengaturan `SpaceConfig` seperti
`accessType` selama pembuatan room API.
`meetings.conference.media.readonly` untuk preflight Meet Media API dan pekerjaan media;
Google mungkin memerlukan pendaftaran Developer Preview untuk penggunaan Media API sebenarnya.
Jika Anda hanya membutuhkan join Chrome berbasis browser, lewati OAuth sepenuhnya.

### Buat refresh token

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, atau teruskan sebagai
variabel environment, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok konfigurasi `oauth` dengan refresh token. Perintah menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
salin/tempel manual dengan `--manual`.

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

Lebih baik gunakan variabel environment saat Anda tidak ingin refresh token berada dalam konfigurasi.
Jika nilai konfigurasi dan environment sama-sama ada, Plugin menyelesaikan konfigurasi
terlebih dahulu lalu fallback ke environment.

Persetujuan OAuth mencakup pembuatan space Meet, akses baca space Meet, dan akses baca media
konferensi Meet. Jika Anda melakukan autentikasi sebelum dukungan pembuatan rapat
ada, jalankan ulang `openclaw googlemeet auth login --json` agar refresh
token memiliki scope `meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan doctor OAuth saat Anda menginginkan pemeriksaan kesehatan yang cepat dan tanpa rahasia:

```bash
openclaw googlemeet doctor --oauth --json
```

Ini tidak memuat runtime Chrome atau memerlukan node Chrome yang terhubung. Perintah
memeriksa bahwa konfigurasi OAuth ada dan refresh token dapat membuat access
token. Laporan JSON hanya mencakup field status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; laporan tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Makna                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ditambah `oauth.refreshToken`, atau cached access token, ada.          |
| `oauth-token`        | Cached access token masih valid, atau refresh token membuat access token baru.          |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` me-resolve space Meet yang ada.                        |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat space Meet baru.                          |

Untuk membuktikan pengaktifan Google Meet API dan scope `spaces.create` juga, jalankan
pemeriksaan create yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sekali pakai. Gunakan saat Anda perlu mengonfirmasi
bahwa proyek Google Cloud telah mengaktifkan Meet API dan akun yang diotorisasi
memiliki cakupan `meetings.space.created`.

Untuk membuktikan akses baca ke ruang rapat yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke
ruang yang sudah ada yang dapat diakses akun Google yang diotorisasi. `403` dari
pemeriksaan ini biasanya berarti Google Meet REST API dinonaktifkan, token
refresh yang disetujui tidak memiliki cakupan yang diperlukan, atau akun Google
tidak dapat mengakses ruang Meet tersebut. Error token refresh berarti jalankan
ulang `openclaw googlemeet auth login --json` dan simpan blok `oauth` baru.

Tidak diperlukan kredensial OAuth untuk fallback browser. Dalam mode itu, auth
Google berasal dari profil Chrome yang sudah login pada Node yang dipilih, bukan
dari konfigurasi OpenClaw.

Variabel lingkungan ini diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Resolve URL Meet, kode, atau `spaces/{id}` melalui `spaces.get`:

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

Lookup Calendar dapat me-resolve URL rapat dari Google Calendar sebelum membaca
artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari kalender `primary` hari ini untuk event Calendar dengan tautan
Google Meet. Gunakan `--event <query>` untuk mencari teks event yang cocok, dan
`--calendar <id>` untuk kalender non-primer. Lookup Calendar memerlukan login
OAuth baru yang menyertakan cakupan readonly event Calendar.
`calendar-events` mempratinjau event Meet yang cocok dan menandai event yang akan
dipilih oleh `latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id catatan konferensi, alamatkan secara langsung:

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
dengan cakupan `meetings.space.created` untuk ruang yang dapat dikelola akun yang
diotorisasi. OpenClaw menerima input URL Meet, kode rapat, atau `spaces/{id}` dan
me-resolve-nya ke resource ruang API sebelum mengakhiri konferensi aktif.
Ini terpisah dari `googlemeet leave`: `leave` menghentikan partisipasi
lokal/sesi OpenClaw, sedangkan `end-active-conference` meminta Google Meet untuk
mengakhiri konferensi aktif untuk ruang tersebut.

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

`artifacts` mengembalikan metadata catatan konferensi plus metadata resource
peserta, rekaman, transkrip, entri transkrip terstruktur, dan catatan pintar saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries`
untuk melewati lookup entri untuk rapat besar. `attendance` memperluas peserta
menjadi baris sesi peserta dengan waktu pertama/terakhir terlihat, total durasi
sesi, flag terlambat/keluar lebih awal, dan resource peserta duplikat yang
digabung berdasarkan pengguna yang login atau nama tampilan. Berikan
`--no-merge-duplicates` untuk tetap memisahkan resource peserta mentah,
`--late-after-minutes` untuk menyesuaikan deteksi keterlambatan, dan
`--early-before-minutes` untuk menyesuaikan deteksi keluar lebih awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, catatan konferensi,
file output, jumlah, sumber token, event Calendar saat digunakan, dan peringatan
pengambilan parsial apa pun. Berikan `--zip` untuk juga menulis arsip portabel
di samping folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google
Docs transkrip dan catatan pintar tertaut melalui Google Drive `files.export`;
ini memerlukan login OAuth baru yang menyertakan cakupan readonly Drive Meet.
Tanpa `--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri
transkrip terstruktur. Jika Google mengembalikan kegagalan artefak parsial,
seperti error daftar catatan pintar, entri transkrip, atau isi dokumen Drive,
ringkasan dan manifes menyimpan peringatan alih-alih menggagalkan seluruh
ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
JSON manifes tanpa membuat folder atau ZIP. Ini berguna sebelum menulis ekspor
besar atau saat agen hanya memerlukan jumlah, catatan yang dipilih, dan
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

Tetapkan `"dryRun": true` untuk hanya mengembalikan manifes ekspor dan melewati
penulisan file.

Agen juga dapat membuat ruang yang didukung API dengan kebijakan akses eksplisit:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Dan agen dapat mengakhiri konferensi aktif untuk ruang yang diketahui:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Untuk validasi dengar-dulu, agen harus menggunakan `test_listen` sebelum
mengklaim rapat tersebut berguna:

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

Jalankan probe browser live dengar-dulu terhadap rapat tempat seseorang akan
berbicara dengan caption Meet tersedia:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Lingkungan live smoke:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan live test yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` mengarah ke URL Meet, kode, atau
  `spaces/{id}` yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan id
  klien OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
  menyediakan token refresh.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang
  sama tanpa prefiks `OPENCLAW_`.

Live smoke artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Lookup
Calendar memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`.
Ekspor isi dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah ini mencetak `meeting uri` baru, sumber, dan sesi bergabung. Dengan
kredensial OAuth, perintah ini menggunakan Google Meet API resmi. Tanpa
kredensial OAuth, perintah ini menggunakan profil browser yang sudah login pada
Node Chrome yang dipin sebagai fallback. Agen dapat menggunakan tool
`google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
langkah. Untuk pembuatan URL-saja, berikan `"join": false`.

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

Jika fallback browser mengenai login Google atau pemblokir izin Meet sebelum
dapat membuat URL, metode Gateway mengembalikan respons gagal dan tool
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
`manualActionMessage` plus konteks Node/tab browser dan berhenti membuka tab Meet
baru hingga operator menyelesaikan langkah browser.

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

Pembuatan Meet bergabung secara default. Transport Chrome atau Chrome-node tetap
memerlukan profil Google Chrome yang sudah login untuk bergabung melalui browser.
Jika profil logout, OpenClaw melaporkan `manualActionRequired: true` atau error
fallback browser dan meminta operator menyelesaikan login Google sebelum mencoba
ulang.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi
proyek Cloud, principal OAuth, dan peserta rapat Anda terdaftar dalam Google
Workspace Developer Preview Program untuk Meet media APIs.

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

Atur konfigurasi Plugin di bawah `plugins.entries.google-meet.config`:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nama/IP node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet yang belum masuk
- `chrome.autoJoin: true`: pengisian nama tamu dan klik Join Now dengan upaya terbaik melalui otomatisasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang sudah ada alih-alih membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu tab Meet melaporkan status dalam panggilan sebelum intro realtime dipicu
- `chrome.audioFormat: "pcm16-24khz"`: format audio pasangan perintah. Gunakan `"g711-ulaw-8khz"` hanya untuk pasangan perintah legacy/kustom yang masih memancarkan audio telepon.
- `chrome.audioInputCommand`: perintah SoX yang membaca dari CoreAudio `BlackHole 2ch` dan menulis audio dalam `chrome.audioFormat`
- `chrome.audioOutputCommand`: perintah SoX yang membaca audio dalam `chrome.audioFormat` dan menulis ke CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: perintah mikrofon lokal opsional yang menulis PCM mono little-endian 16-bit bertanda untuk deteksi interupsi manusia saat pemutaran asisten aktif. Ini saat ini berlaku untuk bridge pasangan perintah `chrome` yang di-host oleh Gateway.
- `chrome.bargeInRmsThreshold: 650`: level RMS yang dihitung sebagai interupsi manusia pada `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: level puncak yang dihitung sebagai interupsi manusia pada `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: jeda minimum antara pembersihan interupsi manusia berulang
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime terhubung; atur ke `""` untuk bergabung tanpa suara
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

`voiceCall.enabled` default ke `true`; dengan transport Twilio, ini mendelegasikan panggilan PSTN aktual, DTMF, dan salam intro ke Plugin Voice Call. Voice Call memutar urutan DTMF sebelum membuka stream media realtime, lalu menggunakan teks intro yang disimpan sebagai salam realtime awal. Jika `voice-call` tidak diaktifkan, Google Meet masih dapat memvalidasi dan merekam rencana panggilan, tetapi tidak dapat melakukan panggilan Twilio.

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

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan `transport: "chrome-node"` saat Chrome berjalan pada node berpasangan seperti VM Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan di host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan `action: "speak"` dengan `sessionId` dan `message` agar agen realtime langsung berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan ulang sesi, memicu frasa yang sudah diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat melaporkannya. `test_speech` selalu memaksa `mode: "realtime"` dan gagal jika diminta berjalan dalam `mode: "transcribe"` karena sesi hanya-observasi sengaja tidak dapat memancarkan ucapan. Hasil `speechOutputVerified` didasarkan pada peningkatan byte output audio realtime selama panggilan uji ini, sehingga sesi yang digunakan ulang dengan audio lama tidak dihitung sebagai pemeriksaan ucapan sukses yang baru. Gunakan `action: "leave"` untuk menandai sesi berakhir.

`status` menyertakan kesehatan Chrome bila tersedia:

- `inCall`: Chrome tampaknya berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet dengan upaya terbaik
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil browser memerlukan login manual, admisi host Meet, izin, atau perbaikan kontrol browser sebelum ucapan dapat berfungsi
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: apakah ucapan Chrome terkelola diizinkan sekarang. `speechReady: false` berarti OpenClaw tidak mengirim frasa intro/uji ke bridge audio.
- `providerConnected` / `realtimeReady`: status bridge suara realtime
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input loopback yang diabaikan saat pemutaran asisten aktif

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara langsung. Penyedia suara realtime mendengar audio rapat dan berbicara melalui bridge audio yang dikonfigurasi. Saat model realtime memerlukan penalaran yang lebih mendalam, informasi terkini, atau alat OpenClaw normal, model dapat memanggil `openclaw_agent_consult`.

Alat konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan singkat ke sesi suara realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke rapat. Ini menggunakan alat konsultasi realtime bersama yang sama seperti Voice Call.

Secara default, konsultasi berjalan terhadap agen `main`. Atur `realtime.agentId` saat jalur Meet harus berkonsultasi dengan workspace agen OpenClaw khusus, default model, kebijakan alat, memori, dan riwayat sesi.

`realtime.toolPolicy` mengontrol jalannya konsultasi:

- `safe-read-only`: ekspos alat konsultasi dan batasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`.
- `owner`: ekspos alat konsultasi dan biarkan agen reguler menggunakan kebijakan alat agen normal.
- `none`: jangan ekspos alat konsultasi ke model suara realtime.

Kunci sesi konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan dapat menggunakan ulang konteks konsultasi sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Untuk smoke bergabung-dan-berbicara lengkap:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist uji langsung

Gunakan urutan ini sebelum menyerahkan rapat kepada agen tanpa pengawasan:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Status Chrome-node yang diharapkan:

- `googlemeet setup` semuanya hijau.
- `googlemeet setup` menyertakan `chrome-node-connected` saat Chrome-node adalah transport default atau node disematkan.
- `nodes status` menampilkan node terpilih terhubung.
- Node terpilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
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

Itu membuktikan Plugin Gateway dimuat, node VM terhubung dengan token saat ini, dan bridge audio Meet tersedia sebelum agen membuka tab rapat nyata.

Untuk smoke Twilio, gunakan rapat yang mengekspos detail panggilan telepon masuk:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` menyertakan pemeriksaan `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan `twilio-voice-call-webhook` berwarna hijau.
- `voicecall` tersedia di CLI setelah Gateway dimuat ulang.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `openclaw logs --follow` menampilkan DTMF TwiML disajikan sebelum TwiML realtime, lalu bridge realtime dengan salam awal diantrekan.
- `googlemeet leave <sessionId>` memutus panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat alat Google Meet

Konfirmasi Plugin diaktifkan dalam konfigurasi Gateway dan muat ulang Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, mulai ulang atau muat ulang Gateway. Agen yang berjalan hanya melihat alat Plugin yang didaftarkan oleh proses Gateway saat ini.

Pada host Gateway non-macOS, alat `google_meet` yang menghadap agen tetap terlihat, tetapi tindakan realtime Chrome lokal diblokir sebelum mencapai bridge audio. Audio realtime Chrome lokal saat ini bergantung pada `BlackHole 2ch` macOS, sehingga agen Linux harus menggunakan `mode: "transcribe"`, panggilan masuk Twilio, atau host `chrome-node` macOS alih-alih jalur realtime Chrome lokal default.

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

Node harus terhubung dan mencantumkan `googlemeet.chrome` plus `browser.proxy`. Konfigurasi Gateway harus mengizinkan perintah node tersebut:

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

Lalu muat ulang layanan node dan jalankan ulang:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-listen` untuk bergabung hanya-observasi atau `googlemeet test-speech` untuk bergabung realtime, lalu periksa kesehatan Chrome yang dikembalikan. Jika salah satu probe melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator dan hentikan percobaan ulang sampai tindakan browser selesai.

Tindakan manual umum:

- Masuk ke profil Chrome.
- Izinkan tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "belum masuk" hanya karena Meet menampilkan "Apakah Anda ingin orang mendengar Anda di rapat?" Itu adalah layar sela pilihan audio milik Meet; OpenClaw mengeklik **Gunakan mikrofon** melalui otomasi browser saat tersedia dan tetap menunggu status rapat yang sebenarnya. Untuk fallback browser khusus pembuatan, OpenClaw dapat mengeklik **Lanjutkan tanpa mikrofon** karena membuat URL tidak memerlukan jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create` saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, ia beralih ke fallback browser node Chrome yang dipin. Pastikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang sesuai tersedia.
- Untuk pembuatan API: token penyegaran dibuat setelah dukungan pembuatan
  ditambahkan. Token lama mungkin tidak memiliki scope `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` mengarah ke node yang terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil OpenClaw Chrome pada node tersebut sudah masuk
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan ulang tab `https://meet.google.com/new`
  atau tab permintaan akun Google yang sudah ada sebelum membuka tab baru. Jika agen mengalami timeout,
  coba ulang pemanggilan tool alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika tool mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan mencoba ulang dalam loop sampai
  tindakan tersebut selesai.
- Untuk fallback browser: jika Meet menampilkan "Apakah Anda ingin orang mendengar Anda di
  rapat?", biarkan tab tetap terbuka. OpenClaw seharusnya mengeklik **Gunakan mikrofon** atau, untuk
  fallback khusus pembuatan, **Lanjutkan tanpa mikrofon** melalui otomasi browser
  dan terus menunggu URL Meet yang dibuat. Jika tidak dapat melakukannya,
  kesalahan harus menyebutkan `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk mendengarkan/berbicara balik. `mode: "transcribe"` memang
tidak memulai jembatan suara realtime dupleks. Untuk debugging khusus observasi,
jalankan `openclaw googlemeet status --json <session-id>` setelah peserta berbicara
dan periksa `captioning`, `transcriptLines`, dan `lastCaptionText`. Jika `inCall`
bernilai true tetapi `transcriptLines` tetap `0`, caption Meet mungkin dinonaktifkan, belum ada yang
berbicara sejak observer dipasang, UI Meet berubah, atau caption langsung
tidak tersedia untuk bahasa/akun rapat tersebut.

`googlemeet test-speech` selalu memeriksa jalur realtime dan melaporkan apakah
byte keluaran bridge teramati untuk pemanggilan tersebut. Jika `speechOutputVerified` false dan
`speechOutputTimedOut` true, penyedia realtime mungkin telah menerima
ucapan tersebut tetapi OpenClaw tidak melihat byte keluaran baru mencapai bridge audio
Chrome.

Pastikan juga:

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
`googlemeet doctor --oauth` saat Anda perlu memverifikasi penyegaran OAuth Google Meet
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga memerlukan
bukti Google Meet API.

Jika agen mengalami timeout dan Anda dapat melihat tab Meet sudah terbuka, periksa tab tersebut
tanpa membuka tab lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Aksi tool yang setara adalah `recover_current_tab`. Ia memfokuskan dan memeriksa
tab Meet yang sudah ada untuk transport yang dipilih. Dengan `chrome`, ia menggunakan kontrol
browser lokal melalui Gateway; dengan `chrome-node`, ia menggunakan node Chrome yang dikonfigurasi.
Ia tidak membuka tab baru atau membuat sesi baru; ia melaporkan
pemblokir saat ini, seperti status login, penerimaan, izin, atau pilihan audio.
Perintah CLI berbicara ke Gateway yang dikonfigurasi, jadi Gateway harus berjalan;
`chrome-node` juga memerlukan node Chrome yang terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan muat ulang
Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki account
SID, token auth, atau nomor pemanggil. Atur ini pada host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` gagal saat `voice-call` tidak memiliki eksposur Webhook
publik, atau saat `publicUrl` mengarah ke local loopback atau ruang jaringan privat.
Atur `plugins.entries.voice-call.config.publicUrl` ke URL penyedia publik atau
konfigurasikan eksposur tunnel/Tailscale `voice-call`.

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

Untuk pengembangan lokal, gunakan tunnel atau eksposur Tailscale alih-alih URL
host privat:

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

Kemudian mulai ulang atau muat ulang Gateway dan jalankan:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` secara default hanya memeriksa kesiapan. Untuk dry-run nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya saat Anda sengaja ingin melakukan panggilan notifikasi
keluar live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Pastikan acara Meet mengekspos detail dial-in telepon. Berikan nomor dial-in
dan PIN persisnya atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan `w` di awal atau koma dalam `--dtmf-sequence` jika penyedia memerlukan jeda
sebelum memasukkan PIN.

Jika panggilan telepon dibuat tetapi daftar peserta Meet tidak pernah menampilkan peserta
dial-in:

- Jalankan `openclaw googlemeet doctor <session-id>` untuk memastikan ID panggilan Twilio
  yang didelegasikan, apakah DTMF sudah diantrekan, dan apakah sapaan intro diminta.
- Jalankan `openclaw voicecall status --call-id <id>` dan pastikan panggilan masih
  aktif.
- Jalankan `openclaw voicecall tail` dan periksa bahwa Webhook Twilio tiba di
  Gateway.
- Jalankan `openclaw logs --follow` dan cari urutan Twilio Meet: Google
  Meet mendelegasikan join, Voice Call menyimpan TwiML DTMF pra-koneksi, menyajikan
  TwiML awal tersebut, lalu menyajikan TwiML realtime dan memulai bridge realtime
  dengan `initialGreeting=queued`.
- Jalankan ulang `openclaw googlemeet setup --transport twilio`; pemeriksaan penyiapan hijau
  diperlukan tetapi tidak membuktikan urutan PIN rapat benar.
- Pastikan nomor dial-in milik undangan Meet dan wilayah yang sama dengan
  PIN.
- Tingkatkan jeda awal dalam `--dtmf-sequence` jika Meet menjawab lambat, misalnya
  `wwww123456#`.
- Jika peserta bergabung tetapi Anda tidak mendengar sapaan, periksa
  `openclaw logs --follow` untuk TwiML realtime, startup bridge realtime, dan
  `initialGreeting=queued`. Sapaan dibuat dari pesan awal
  `voicecall.start` setelah bridge realtime terhubung.

Jika Webhook tidak tiba, debug Plugin Voice Call terlebih dahulu: penyedia harus
menjangkau `plugins.entries.voice-call.config.publicUrl` atau tunnel yang dikonfigurasi.
Lihat [Pemecahan masalah panggilan suara](/id/plugins/voice-call#troubleshooting).

## Catatan

API media resmi Google Meet berorientasi penerimaan, jadi berbicara ke dalam panggilan Meet
tetap memerlukan jalur peserta. Plugin ini menjaga batas itu tetap terlihat:
Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome memerlukan `BlackHole 2ch` plus salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki
  bridge model realtime dan mem-pipe audio dalam `chrome.audioFormat` antara perintah-perintah tersebut
  dan penyedia suara realtime yang dipilih. Jalur Chrome default adalah
  PCM16 24 kHz; G.711 mu-law 8 kHz tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio dupleks yang bersih, rutekan output Meet dan mikrofon Meet melalui perangkat
virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat menggemakan peserta lain kembali ke dalam panggilan.

Dengan bridge Chrome pasangan perintah, `chrome.bargeInInputCommand` dapat mendengarkan
mikrofon lokal terpisah dan menghapus pemutaran asisten saat manusia mulai
berbicara. Ini menjaga ucapan manusia tetap mendahului output asisten bahkan saat input
loopback BlackHole bersama sementara ditekan selama pemutaran asisten.
Seperti `chrome.audioInputCommand` dan `chrome.audioOutputCommand`, ini adalah
perintah lokal yang dikonfigurasi operator. Gunakan path perintah atau daftar
argumen tepercaya yang eksplisit, dan jangan mengarahkannya ke skrip dari lokasi yang tidak tepercaya.

`googlemeet speak` memicu bridge audio realtime aktif untuk sesi Chrome.
`googlemeet leave` menghentikan bridge tersebut. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.
Gunakan `googlemeet end-active-conference` saat Anda juga ingin menutup konferensi
Google Meet aktif untuk ruang yang dikelola API.

## Terkait

- [Plugin panggilan suara](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun Plugin](/id/plugins/building-plugins)

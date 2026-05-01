---
read_when:
    - Anda ingin agen OpenClaw bergabung dalam panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Google Meet Plugin: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan setelan default suara waktu nyata'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T09:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Dukungan peserta Google Meet untuk OpenClaw — Plugin ini dibuat eksplisit secara sengaja:

- Plugin hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali agent OpenClaw penuh ketika penalaran
  atau alat yang lebih mendalam diperlukan.
- Agent memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk
  mendengarkan/berbicara balik secara langsung, atau `transcribe` untuk
  bergabung/mengontrol browser tanpa jembatan suara realtime.
- Auth dimulai sebagai Google OAuth pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host Node yang dipasangkan.
- Twilio menerima nomor dial-in plus PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja
  telekonferensi agent yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan konfigurasikan penyedia suara realtime
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

Setelah reboot, verifikasi kedua bagian:

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

Output penyiapan dimaksudkan agar dapat dibaca agent dan sadar mode. Output ini
melaporkan profil Chrome, penyematan Node, dan, untuk bergabung Chrome realtime,
jembatan audio BlackHole/SoX serta pemeriksaan intro realtime tertunda. Untuk
bergabung hanya-amati, periksa transport yang sama dengan `--mode transcribe`;
mode tersebut melewati prasyarat audio realtime karena tidak mendengarkan
melalui atau berbicara melalui jembatan:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Ketika delegasi Twilio dikonfigurasi, penyiapan juga melaporkan apakah Plugin
`voice-call`, kredensial Twilio, dan eksposur Webhook publik sudah siap.
Perlakukan pemeriksaan `ok: false` apa pun sebagai pemblokir untuk transport dan
mode yang diperiksa sebelum meminta agent bergabung. Gunakan
`openclaw googlemeet setup --json` untuk skrip atau output yang dapat dibaca
mesin. Gunakan `--transport chrome`, `--transport chrome-node`, atau
`--transport twilio` untuk melakukan preflight transport tertentu sebelum agent
mencobanya.

Untuk Twilio, selalu lakukan preflight transport secara eksplisit ketika
transport default adalah Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Itu menangkap wiring `voice-call` yang hilang, kredensial Twilio, atau eksposur
Webhook yang tidak dapat dijangkau sebelum agent mencoba menghubungi rapat.

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agent bergabung melalui alat `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Buat rapat baru dan bergabung ke dalamnya:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Hanya buat URL tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Buat via API: digunakan ketika kredensial Google Meet OAuth dikonfigurasi. Ini
  adalah jalur paling deterministik dan tidak bergantung pada status UI browser.
- Fallback browser: digunakan ketika kredensial OAuth tidak ada. OpenClaw
  menggunakan Node Chrome yang disematkan, membuka `https://meet.google.com/new`,
  menunggu Google mengalihkan ke URL kode rapat nyata, lalu mengembalikan URL
  tersebut. Jalur ini mengharuskan profil Chrome OpenClaw pada Node sudah masuk
  ke Google. Otomatisasi browser menangani prompt mikrofon pertama kali milik
  Meet; prompt tersebut tidak diperlakukan sebagai kegagalan login Google.
  Alur bergabung dan buat juga mencoba menggunakan ulang tab Meet yang ada
  sebelum membuka yang baru. Pencocokan mengabaikan string kueri URL yang tidak
  berbahaya seperti `authuser`, sehingga percobaan ulang agent seharusnya
  memfokuskan rapat yang sudah terbuka alih-alih membuat tab Chrome kedua.

Output perintah/alat menyertakan field `source` (`api` atau `browser`) sehingga
agent dapat menjelaskan jalur mana yang digunakan. `create` bergabung ke rapat
baru secara default dan mengembalikan `joined: true` plus sesi bergabung. Untuk
hanya menerbitkan URL, gunakan `create --no-join` pada CLI atau teruskan
`"join": false` ke alat.

Atau beri tahu agent: "Buat Google Meet, bergabung dengan suara realtime, dan
kirimkan tautannya kepada saya." Agent seharusnya memanggil `google_meet` dengan
`action: "create"` lalu membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk bergabung hanya-amati/kontrol-browser, atur `"mode": "transcribe"`. Itu
tidak memulai jembatan model realtime dupleks, tidak memerlukan BlackHole atau
SoX, dan tidak akan berbicara balik ke dalam rapat. Bergabung Chrome dalam mode
ini juga menghindari pemberian izin mikrofon/kamera OpenClaw dan menghindari
jalur **Use microphone** Meet. Jika Meet menampilkan interstisial pilihan audio,
otomatisasi mencoba jalur tanpa-mikrofon dan jika tidak berhasil melaporkan
tindakan manual alih-alih membuka mikrofon lokal.

Selama sesi realtime, status `google_meet` menyertakan kesehatan browser dan
jembatan audio seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output
terakhir, penghitung byte, dan status jembatan tertutup. Jika prompt halaman
Meet yang aman muncul, otomatisasi browser menanganinya ketika memungkinkan.
Login, penerimaan host, dan prompt izin browser/OS dilaporkan sebagai tindakan
manual dengan alasan dan pesan untuk diteruskan oleh agent. Sesi Chrome
terkelola hanya mengeluarkan intro atau frasa uji setelah kesehatan browser
melaporkan `inCall: true`; jika tidak, status melaporkan `speechReady: false`
dan upaya bicara diblokir alih-alih berpura-pura agent berbicara ke dalam rapat.

Bergabung Chrome lokal melalui profil browser OpenClaw yang sudah masuk. Mode
realtime memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan
oleh OpenClaw. Untuk audio dupleks yang bersih, gunakan perangkat virtual
terpisah atau grafik bergaya Loopback; satu perangkat BlackHole cukup untuk uji
smoke pertama tetapi dapat menghasilkan gema.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau kunci API model di dalam
VM macOS hanya untuk membuat VM memiliki Chrome. Jalankan Gateway dan agent
secara lokal, lalu jalankan host Node di VM. Aktifkan Plugin bawaan pada VM satu
kali agar Node mengiklankan perintah Chrome:

Yang berjalan di mana:

- Host Gateway: OpenClaw Gateway, workspace agent, kunci model/API, penyedia
  realtime, dan config Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, config agent, kunci OpenAI/GPT, atau
  penyiapan penyedia model.

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah lingkungan proses, bukan
pengaturan `openclaw.json`. `openclaw node install` menyimpannya di lingkungan
LaunchAgent ketika variabel tersebut ada pada perintah instal.

Setujui Node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat Node dan Node mengiklankan `googlemeet.chrome` serta
kapabilitas browser/`browser.proxy`:

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

atau minta agent menggunakan alat `google_meet` dengan `transport: "chrome-node"`.

Untuk uji smoke satu perintah yang membuat atau menggunakan ulang sesi,
mengucapkan frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama bergabung realtime, otomatisasi browser OpenClaw mengisi nama tamu,
mengklik Join/Ask to join, dan menerima pilihan "Use microphone" pertama kali
Meet ketika prompt itu muncul. Selama bergabung hanya-amati atau pembuatan rapat
hanya-browser, otomatisasi melanjutkan melewati prompt yang sama tanpa mikrofon
ketika pilihan itu tersedia. Jika profil browser belum masuk, Meet menunggu
penerimaan host, Chrome memerlukan izin mikrofon/kamera untuk bergabung
realtime, atau Meet tertahan pada prompt yang tidak dapat diselesaikan
otomatisasi, hasil bergabung/test-speech melaporkan
`manualActionRequired: true` dengan `manualActionReason` dan
`manualActionMessage`. Agent harus berhenti mencoba ulang bergabung, melaporkan
pesan persis itu plus `browserUrl`/`browserTitle` saat ini, dan mencoba ulang
hanya setelah tindakan browser manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya ketika tepat
satu Node terhubung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa Node yang mampu terhubung, atur `chromeNode.node` ke id Node, nama
tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: node yang dipasangi pin
  diketahui oleh Gateway tetapi tidak tersedia. Agen harus memperlakukan node
  tersebut sebagai status diagnostik, bukan sebagai host Chrome yang dapat
  digunakan, dan melaporkan penghalang penyiapan alih-alih beralih ke transport
  lain kecuali pengguna memintanya.
- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` dijalankan di VM. Konfirmasikan juga bahwa
  host Gateway mengizinkan kedua perintah node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host
  yang sedang diperiksa dan reboot sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan reboot VM tersebut.
- Chrome terbuka tetapi tidak dapat bergabung: masuk ke profil browser di dalam
  VM, atau pertahankan `chrome.guestName` tetap diatur untuk bergabung sebagai
  tamu. Gabung otomatis sebagai tamu menggunakan otomatisasi browser OpenClaw
  melalui proxy browser node; pastikan config browser node mengarah ke profil
  yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil existing-session bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` tetap diaktifkan.
  OpenClaw mengaktifkan tab yang sudah ada untuk URL Meet yang sama sebelum
  membuka tab baru, dan pembuatan rapat browser menggunakan kembali tab
  `https://meet.google.com/new` yang sedang berjalan atau tab prompt akun
  Google sebelum membuka tab lain.
- Tidak ada audio: di Meet, arahkan audio mikrofon/speaker melalui jalur
  perangkat audio virtual yang digunakan oleh OpenClaw; gunakan perangkat
  virtual terpisah atau routing bergaya Loopback untuk audio dupleks yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio command-line. Plugin menggunakan perintah perangkat
  CoreAudio eksplisit untuk bridge audio PCM16 default 24 kHz.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio
  `BlackHole 2ch` yang dapat dirutekan oleh Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang paket mana pun. Dokumentasi
meminta pengguna untuk menginstalnya sebagai dependensi host melalui Homebrew.
SoX dilisensikan sebagai `LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah
GPL-3.0. Jika Anda membuat installer atau appliance yang membundel BlackHole
dengan OpenClaw, tinjau ketentuan lisensi upstream BlackHole atau dapatkan
lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet melalui kontrol browser OpenClaw dan bergabung
sebagai profil browser OpenClaw yang sudah masuk. Pada macOS, Plugin memeriksa
`BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, Plugin juga menjalankan
perintah kesehatan bridge audio dan perintah startup sebelum membuka Chrome.
Gunakan `chrome` ketika Chrome/audio berada di host Gateway; gunakan
`chrome-node` ketika Chrome/audio berada di node yang dipairing seperti VM
macOS Parallels. Untuk Chrome lokal, pilih profil dengan
`browser.defaultProfile`; `chrome.browserProfile` diteruskan ke host
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan kesalahan
penyiapan alih-alih bergabung diam-diam tanpa jalur audio.

### Twilio

Transport Twilio adalah dial plan ketat yang didelegasikan ke Plugin Voice Call.
Ini tidak mengurai halaman Meet untuk mencari nomor telepon.

Gunakan ini ketika partisipasi Chrome tidak tersedia atau Anda menginginkan
fallback dial-in telepon. Google Meet harus menyediakan nomor dial-in telepon
dan PIN untuk rapat tersebut; OpenClaw tidak menemukan data tersebut dari
halaman Meet.

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

Berikan kredensial Twilio melalui environment atau config. Environment menjaga
secret tetap berada di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Restart atau reload Gateway setelah mengaktifkan `voice-call`; perubahan config
Plugin tidak muncul dalam proses Gateway yang sudah berjalan sampai proses itu
direload.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Ketika delegasi Twilio sudah tersambung, `googlemeet setup` menyertakan
pemeriksaan `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, dan
`twilio-voice-call-webhook` yang berhasil.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` ketika rapat membutuhkan urutan khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

OAuth bersifat opsional untuk membuat tautan Meet karena `googlemeet create`
dapat melakukan fallback ke otomatisasi browser. Konfigurasikan OAuth ketika
Anda menginginkan pembuatan melalui API resmi, resolusi space, atau pemeriksaan
preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat client OAuth Google
Cloud, minta scope yang diperlukan, otorisasi akun Google, lalu simpan refresh
token yang dihasilkan dalam config Plugin Google Meet atau sediakan variabel
environment `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur bergabung Chrome. Transport Chrome dan
Chrome-node tetap bergabung melalui profil Chrome yang sudah masuk,
BlackHole/SoX, dan node yang tersambung ketika Anda menggunakan partisipasi
browser. OAuth hanya untuk jalur Google Meet API resmi: membuat meeting space,
menyelesaikan space, dan menjalankan pemeriksaan preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih project Google Cloud.
2. Aktifkan **Google Meet REST API** untuk project tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** adalah yang paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan personal/test; saat aplikasi berada dalam Testing,
     tambahkan setiap akun Google yang akan mengotorisasi aplikasi sebagai test user.
4. Tambahkan scope yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat OAuth client ID.
   - Jenis aplikasi: **Web application**.
   - URI redirect resmi:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin client ID dan client secret.

`meetings.space.created` diperlukan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw menyelesaikan URL/kode Meet
menjadi space. `meetings.conference.media.readonly` ditujukan untuk preflight
Meet Media API dan pekerjaan media; Google dapat mewajibkan pendaftaran
Developer Preview untuk penggunaan Media API yang sebenarnya. Jika Anda hanya
membutuhkan gabung Chrome berbasis browser, lewati OAuth sepenuhnya.

### Terbitkan refresh token

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, atau
teruskan keduanya sebagai variabel environment, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok config `oauth` dengan refresh token. Perintah ini
menggunakan PKCE, callback localhost di `http://localhost:8085/oauth2callback`,
dan alur copy/paste manual dengan `--manual`.

Contoh:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gunakan mode manual ketika browser tidak dapat menjangkau callback lokal:

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

Utamakan variabel environment ketika Anda tidak ingin refresh token berada dalam
config. Jika nilai config dan environment sama-sama ada, Plugin menyelesaikan
config terlebih dahulu lalu fallback ke environment.

Persetujuan OAuth mencakup pembuatan Meet space, akses baca Meet space, dan
akses baca media konferensi Meet. Jika Anda melakukan autentikasi sebelum
dukungan pembuatan rapat tersedia, jalankan ulang
`openclaw googlemeet auth login --json` agar refresh token memiliki scope
`meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan doctor OAuth ketika Anda menginginkan pemeriksaan kesehatan cepat tanpa
secret:

```bash
openclaw googlemeet doctor --oauth --json
```

Ini tidak memuat runtime Chrome atau memerlukan node Chrome yang tersambung. Ini
memeriksa bahwa config OAuth ada dan refresh token dapat menerbitkan access
token. Laporan JSON hanya menyertakan kolom status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; laporan tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Arti                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau access token yang di-cache, tersedia.  |
| `oauth-token`        | Access token yang di-cache masih valid, atau refresh token menerbitkan access token baru. |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` menyelesaikan Meet space yang sudah ada.               |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat Meet space baru.                          |

Untuk membuktikan enablement Google Meet API dan scope `spaces.create` juga,
jalankan pemeriksaan create yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sekali pakai. Gunakan ini ketika Anda perlu
mengonfirmasi bahwa project Google Cloud mengaktifkan Meet API dan akun yang
diotorisasi memiliki scope `meetings.space.created`.

Untuk membuktikan akses baca untuk meeting space yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke space
yang sudah ada yang dapat diakses akun Google yang diotorisasi. `403` dari
pemeriksaan ini biasanya berarti Google Meet REST API dinonaktifkan, refresh
token yang disetujui tidak memiliki scope yang diperlukan, atau akun Google
tidak dapat mengakses Meet space tersebut. Kesalahan refresh-token berarti
jalankan ulang `openclaw googlemeet auth login --json` dan simpan blok `oauth`
baru.

Tidak ada kredensial OAuth yang diperlukan untuk fallback browser. Dalam mode
tersebut, autentikasi Google berasal dari profil Chrome yang sudah masuk pada
node yang dipilih, bukan dari config OpenClaw.

Variabel environment berikut diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Resolusikan URL Meet, kode, atau `spaces/{id}` melalui `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Jalankan prapemeriksaan sebelum pekerjaan media:

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
secara default. Berikan `--all-conference-records` saat Anda menginginkan setiap catatan yang dipertahankan
untuk rapat tersebut.

Pencarian Calendar dapat meresolusikan URL rapat dari Google Calendar sebelum membaca
artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari kalender `primary` hari ini untuk event Calendar dengan tautan
Google Meet. Gunakan `--event <query>` untuk mencari teks event yang cocok, dan
`--calendar <id>` untuk kalender non-primer. Pencarian Calendar memerlukan login
OAuth baru yang menyertakan scope baca-saja event Calendar.
`calendar-events` mempratinjau event Meet yang cocok dan menandai event yang akan
dipilih oleh `latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id catatan konferensi, alamatkan secara langsung:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` mengembalikan metadata catatan konferensi beserta metadata resource peserta,
rekaman, transkrip, entri transkrip terstruktur, dan catatan cerdas saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries` untuk melewati
pencarian entri bagi rapat besar. `attendance` mengembangkan peserta menjadi
baris sesi-peserta dengan waktu pertama/terakhir terlihat, total durasi sesi,
flag terlambat/pulang-awal, dan resource peserta duplikat yang digabung berdasarkan pengguna
yang sudah masuk atau nama tampilan. Berikan `--no-merge-duplicates` untuk menjaga resource
peserta mentah tetap terpisah, `--late-after-minutes` untuk menyesuaikan deteksi keterlambatan, dan
`--early-before-minutes` untuk menyesuaikan deteksi pulang awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, catatan konferensi,
file keluaran, jumlah, sumber token, event Calendar saat digunakan, dan
peringatan pengambilan parsial apa pun. Berikan `--zip` untuk juga menulis arsip portabel di sebelah
folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs transkrip tertaut dan
catatan cerdas melalui Google Drive `files.export`; ini memerlukan
login OAuth baru yang menyertakan scope baca-saja Drive Meet. Tanpa
`--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri transkrip
terstruktur. Jika Google mengembalikan kegagalan artefak parsial, seperti kesalahan daftar
catatan cerdas, entri transkrip, atau isi dokumen Drive, ringkasan dan
manifes mempertahankan peringatan tersebut alih-alih menggagalkan seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
JSON manifes tanpa membuat folder atau ZIP. Ini berguna sebelum menulis
ekspor besar atau saat agen hanya memerlukan jumlah, catatan yang dipilih, dan
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

Tetapkan `"dryRun": true` untuk hanya mengembalikan manifes ekspor dan melewati penulisan file.

Jalankan smoke langsung yang dijaga terhadap rapat nyata yang dipertahankan:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Lingkungan smoke langsung:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan pengujian langsung yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL Meet, kode, atau
  `spaces/{id}` yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan id klien
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN` menyediakan
  refresh token.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang sama
  tanpa prefiks `OPENCLAW_`.

Smoke langsung artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Pencarian Calendar
memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`. Ekspor
isi dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah mencetak `meeting uri`, sumber, dan sesi bergabung baru. Dengan kredensial OAuth
perintah ini menggunakan API resmi Google Meet. Tanpa kredensial OAuth, perintah ini
menggunakan profil browser yang sudah masuk dari node Chrome yang dipinkan sebagai fallback. Agen dapat
menggunakan alat `google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
langkah. Untuk pembuatan URL saja, berikan `"join": false`.

Contoh keluaran JSON dari fallback browser:

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

Jika fallback browser terkena login Google atau pemblokir izin Meet sebelum dapat
membuat URL, metode Gateway mengembalikan respons gagal dan alat
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

Contoh keluaran JSON dari pembuatan API:

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
memerlukan profil Google Chrome yang sudah masuk untuk bergabung melalui browser. Jika
profil keluar, OpenClaw melaporkan `manualActionRequired: true` atau kesalahan
fallback browser dan meminta operator menyelesaikan login Google sebelum
mencoba lagi.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi bahwa proyek Cloud,
prinsipal OAuth, dan peserta rapat Anda terdaftar di Google
Workspace Developer Preview Program untuk API media Meet.

## Konfigurasi

Jalur realtime Chrome umum hanya memerlukan plugin yang diaktifkan, BlackHole, SoX,
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

Default:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nama/IP node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet yang
  belum masuk
- `chrome.autoJoin: true`: pengisian nama tamu dan klik Join Now dengan upaya terbaik
  melalui otomatisasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang sudah ada alih-alih
  membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu tab Meet melaporkan sedang dalam panggilan
  sebelum intro realtime dipicu
- `chrome.audioFormat: "pcm16-24khz"`: format audio pasangan perintah. Gunakan
  `"g711-ulaw-8khz"` hanya untuk pasangan perintah lama/kustom yang masih memancarkan
  audio telepon.
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
  yang berulang
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime
  terhubung; tetapkan ke `""` untuk bergabung secara senyap
- `realtime.agentId`: id agen OpenClaw opsional untuk
  `openclaw_agent_consult`; default ke `main`

Penggantian opsional:

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

`voiceCall.enabled` secara default adalah `true`; dengan transport Twilio, ini mendelegasikan panggilan PSTN aktual, DTMF, dan salam pembuka ke Plugin Voice Call. Voice Call memutar urutan DTMF sebelum membuka aliran media realtime, lalu menggunakan teks pembuka yang tersimpan sebagai salam realtime awal. Jika `voice-call` tidak diaktifkan, Google Meet masih dapat memvalidasi dan merekam rencana panggilan, tetapi tidak dapat melakukan panggilan Twilio.

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

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan `transport: "chrome-node"` saat Chrome berjalan di node yang dipasangkan seperti VM Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan di host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan `action: "speak"` dengan `sessionId` dan `message` agar agen realtime langsung berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan kembali sesi, memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat melaporkannya. `test_speech` selalu memaksa `mode: "realtime"` dan gagal jika diminta berjalan dalam `mode: "transcribe"` karena sesi hanya-observasi sengaja tidak dapat mengeluarkan ujaran. Hasil `speechOutputVerified` didasarkan pada peningkatan byte output audio realtime selama panggilan uji ini, sehingga sesi yang digunakan kembali dengan audio lama tidak dihitung sebagai pemeriksaan ujaran baru yang berhasil. Gunakan `action: "leave"` untuk menandai sesi telah berakhir.

`status` menyertakan kesehatan Chrome jika tersedia:

- `inCall`: Chrome tampaknya berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet berdasarkan upaya terbaik
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil browser memerlukan login manual, penerimaan oleh host Meet, izin, atau perbaikan kontrol browser sebelum ujaran dapat berfungsi
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: apakah ujaran Chrome terkelola diizinkan sekarang. `speechReady: false` berarti OpenClaw tidak mengirim frasa pembuka/uji ke bridge audio.
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

Alat konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan yang ringkas ke sesi suara realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke rapat. Ini menggunakan alat konsultasi realtime bersama yang sama dengan Voice Call.

Secara default, konsultasi dijalankan terhadap agen `main`. Tetapkan `realtime.agentId` saat jalur Meet harus berkonsultasi dengan ruang kerja agen OpenClaw khusus, default model, kebijakan alat, memori, dan riwayat sesi.

`realtime.toolPolicy` mengontrol proses konsultasi:

- `safe-read-only`: tampilkan alat konsultasi dan batasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`.
- `owner`: tampilkan alat konsultasi dan biarkan agen reguler menggunakan kebijakan alat agen normal.
- `none`: jangan tampilkan alat konsultasi ke model suara realtime.

Kunci sesi konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan dapat menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

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
- `googlemeet setup` menyertakan `chrome-node-connected` saat Chrome-node adalah transport default atau node dipasangkan.
- `nodes status` menampilkan node yang dipilih terhubung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan `inCall: true`.

Untuk host Chrome jarak jauh seperti VM Parallels macOS, ini adalah pemeriksaan aman paling singkat setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Itu membuktikan Plugin Gateway dimuat, node VM terhubung dengan token saat ini, dan bridge audio Meet tersedia sebelum agen membuka tab rapat sungguhan.

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
- `openclaw logs --follow` menampilkan DTMF TwiML disajikan sebelum TwiML realtime, lalu bridge realtime dengan salam awal yang diantrekan.
- `googlemeet leave <sessionId>` menutup panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat alat Google Meet

Pastikan Plugin diaktifkan dalam konfigurasi Gateway dan muat ulang Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, mulai ulang atau muat ulang Gateway. Agen yang sedang berjalan hanya melihat alat Plugin yang didaftarkan oleh proses Gateway saat ini.

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

Kemudian muat ulang layanan node dan jalankan ulang:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-speech` dan periksa kesehatan Chrome yang dikembalikan. Jika melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator dan hentikan percobaan ulang hingga tindakan browser selesai.

Tindakan manual umum:

- Masuk ke profil Chrome.
- Terima tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "not signed in" hanya karena Meet menampilkan "Do you want people to hear you in the meeting?" Itu adalah interstisial pilihan audio Meet; OpenClaw mengeklik **Use microphone** melalui otomatisasi browser saat tersedia dan terus menunggu status rapat sebenarnya. Untuk fallback browser khusus pembuatan, OpenClaw dapat mengeklik **Continue without microphone** karena pembuatan URL tidak memerlukan jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create` saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, perintah akan fallback ke browser node Chrome yang dipasangkan. Pastikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi, atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang cocok tersedia.
- Untuk pembuatan API: token refresh dibuat setelah dukungan pembuatan ditambahkan. Token lama mungkin tidak memiliki cakupan `meetings.space.created`; jalankan ulang `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan `chromeNode.node` menunjuk ke node terhubung dengan `browser.proxy` dan `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw pada node tersebut sudah masuk ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan kembali tab `https://meet.google.com/new` atau prompt akun Google yang sudah ada sebelum membuka tab baru. Jika agen kehabisan waktu, coba ulang panggilan alat alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika alat mengembalikan `manualActionRequired: true`, gunakan `browser.nodeId`, `browser.targetId`, `browserUrl`, dan `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan mencoba ulang dalam loop hingga tindakan tersebut selesai.
- Untuk fallback browser: jika Meet menampilkan "Do you want people to hear you in the meeting?", biarkan tab tetap terbuka. OpenClaw seharusnya mengeklik **Use microphone** atau, untuk fallback khusus pembuatan, **Continue without microphone** melalui otomatisasi browser dan terus menunggu URL Meet yang dibuat. Jika tidak bisa, kesalahan harus menyebutkan `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk mendengarkan/berbicara balik. `mode: "transcribe"` sengaja
tidak memulai jembatan suara realtime dupleks. `googlemeet test-speech`
selalu memeriksa jalur realtime dan melaporkan apakah byte keluaran jembatan
teramati untuk pemanggilan tersebut. Jika `speechOutputVerified` bernilai false dan
`speechOutputTimedOut` bernilai true, penyedia realtime mungkin telah menerima
ujaran tersebut tetapi OpenClaw tidak melihat byte keluaran baru mencapai jembatan
audio Chrome.

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
Gunakan `googlemeet status [session-id] --json` saat Anda membutuhkan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh OAuth Google Meet
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga membutuhkan
bukti API Google Meet.

Jika agen mengalami timeout dan Anda dapat melihat tab Meet sudah terbuka, periksa tab itu
tanpa membuka tab lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Aksi alat yang setara adalah `recover_current_tab`. Aksi ini memfokuskan dan memeriksa
tab Meet yang ada untuk transport yang dipilih. Dengan `chrome`, aksi ini menggunakan kontrol
browser lokal melalui Gateway; dengan `chrome-node`, aksi ini menggunakan node
Chrome yang dikonfigurasi. Aksi ini tidak membuka tab baru atau membuat sesi baru; aksi ini melaporkan
pemblokir saat ini, seperti login, penerimaan masuk, izin, atau status pilihan audio.
Perintah CLI berbicara dengan Gateway yang dikonfigurasi, jadi Gateway harus berjalan;
`chrome-node` juga mengharuskan node Chrome terhubung.

### Pemeriksaan pengaturan Twilio gagal

`twilio-voice-call-plugin` gagal ketika `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan muat ulang
Gateway.

`twilio-voice-call-credentials` gagal ketika backend Twilio tidak memiliki account
SID, token auth, atau nomor pemanggil. Atur ini di host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` gagal ketika `voice-call` tidak memiliki eksposur Webhook
publik, atau ketika `publicUrl` mengarah ke loopback atau ruang jaringan privat.
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
          // or
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

Tambahkan `--yes` hanya ketika Anda memang ingin melakukan panggilan notifikasi
keluar live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Pastikan peristiwa Meet mengekspos detail dial-in telepon. Teruskan nomor dial-in
dan PIN persisnya atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan awalan `w` atau koma di `--dtmf-sequence` jika penyedia membutuhkan jeda
sebelum memasukkan PIN.

Jika panggilan telepon dibuat tetapi daftar peserta Meet tidak pernah menampilkan peserta
dial-in:

- Jalankan `openclaw voicecall status --call-id <id>` dan pastikan panggilan masih
  aktif.
- Jalankan `openclaw voicecall tail` dan periksa bahwa Webhook Twilio tiba di
  Gateway.
- Jalankan `openclaw logs --follow` dan cari urutan Twilio Meet: Google
  Meet mendelegasikan join, Voice Call menyimpan TwiML DTMF prapenyambungan, menyajikan
  TwiML awal itu, lalu menyajikan TwiML realtime dan memulai jembatan realtime
  dengan `initialGreeting=queued`.
- Jalankan ulang `openclaw googlemeet setup --transport twilio`; pemeriksaan pengaturan hijau
  wajib, tetapi tidak membuktikan bahwa urutan PIN rapat benar.
- Pastikan nomor dial-in berasal dari undangan dan wilayah Meet yang sama dengan
  PIN.
- Tambahkan jeda awalan di `--dtmf-sequence` jika Meet menjawab lambat, misalnya
  `wwww123456#`.
- Jika peserta bergabung tetapi Anda tidak mendengar sapaan, periksa
  `openclaw logs --follow` untuk TwiML realtime, startup jembatan realtime, dan
  `initialGreeting=queued`. Sapaan dibuat dari pesan awal
  `voicecall.start` setelah jembatan realtime terhubung.

Jika Webhook tidak tiba, debug plugin Voice Call terlebih dahulu: penyedia harus
menjangkau `plugins.entries.voice-call.config.publicUrl` atau tunnel yang dikonfigurasi.
Lihat [Pemecahan masalah voice call](/id/plugins/voice-call#troubleshooting).

## Catatan

API media resmi Google Meet berorientasi penerimaan, jadi berbicara ke dalam panggilan
Meet tetap membutuhkan jalur peserta. Plugin ini menjaga batas itu tetap terlihat:
Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome membutuhkan `BlackHole 2ch` ditambah salah satu dari:

- `chrome.audioInputCommand` ditambah `chrome.audioOutputCommand`: OpenClaw memiliki
  jembatan model realtime dan menyalurkan audio dalam `chrome.audioFormat` antara
  perintah tersebut dan penyedia suara realtime yang dipilih. Jalur Chrome default adalah
  PCM16 24 kHz; G.711 mu-law 8 kHz tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah jembatan eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio dupleks yang bersih, rutekan keluaran Meet dan mikrofon Meet melalui perangkat
virtual terpisah atau grafik perangkat virtual gaya Loopback. Satu perangkat
BlackHole bersama dapat memantulkan peserta lain kembali ke dalam panggilan.

Dengan jembatan Chrome pasangan perintah, `chrome.bargeInInputCommand` dapat mendengarkan
mikrofon lokal terpisah dan menghapus pemutaran asisten ketika manusia mulai
berbicara. Ini menjaga ucapan manusia tetap mendahului keluaran asisten bahkan ketika input
loopback BlackHole bersama sementara ditekan selama pemutaran asisten.
Seperti `chrome.audioInputCommand` dan `chrome.audioOutputCommand`, ini adalah
perintah lokal yang dikonfigurasi operator. Gunakan path perintah tepercaya yang eksplisit atau
daftar argumen, dan jangan arahkan ke skrip dari lokasi yang tidak tepercaya.

`googlemeet speak` memicu jembatan audio realtime aktif untuk sesi Chrome.
`googlemeet leave` menghentikan jembatan itu. Untuk sesi Twilio yang didelegasikan
melalui plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Plugin voice call](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun plugin](/id/plugins/building-plugins)

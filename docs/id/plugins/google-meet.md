---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, Chrome Node, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-26T11:34:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Dukungan peserta Google Meet untuk OpenClaw — Plugin ini sengaja dibuat eksplisit:

- Plugin ini hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin ini dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali ke agen OpenClaw penuh saat reasoning atau tool yang lebih dalam diperlukan.
- Agen memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk
  dengar/balas langsung secara live, atau `transcribe` untuk bergabung/mengendalikan browser tanpa bridge suara realtime.
- Auth dimulai sebagai OAuth Google pribadi atau profil Chrome yang sudah login.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host Node yang dipairing.
- Twilio menerima nomor dial-in plus PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja konferensi agen yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan konfigurasikan provider suara realtime backend.
OpenAI adalah default; Google Gemini Live juga berfungsi dengan
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch`. Installer
Homebrew memerlukan reboot sebelum macOS menampilkan perangkat itu:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua bagiannya:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Output penyiapan dimaksudkan agar dapat dibaca agen. Output ini melaporkan profil Chrome,
bridge audio, pinning Node, intro realtime tertunda, dan, saat delegasi Twilio
dikonfigurasi, apakah Plugin `voice-call` dan kredensial Twilio sudah siap.
Perlakukan pemeriksaan `ok: false` apa pun sebagai penghalang sebelum meminta agen bergabung.
Gunakan `openclaw googlemeet setup --json` untuk skrip atau output yang dapat dibaca mesin.
Gunakan `--transport chrome`, `--transport chrome-node`, atau `--transport twilio`
untuk preflight transport tertentu sebelum agen mencobanya.

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agen bergabung melalui tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Buat rapat baru dan bergabung ke sana:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Buat hanya URL tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua path:

- Pembuatan API: digunakan saat kredensial OAuth Google Meet dikonfigurasi. Ini adalah
  path yang paling deterministik dan tidak bergantung pada state UI browser.
- Fallback browser: digunakan saat kredensial OAuth tidak ada. OpenClaw menggunakan
  Chrome Node yang dipin, membuka `https://meet.google.com/new`, menunggu Google
  mengalihkan ke URL kode rapat yang nyata, lalu mengembalikan URL tersebut. Path ini memerlukan
  profil Chrome OpenClaw pada Node sudah login ke Google.
  Automasi browser menangani prompt mikrofon pertama milik Meet sendiri; prompt itu
  tidak diperlakukan sebagai kegagalan login Google.
  Alur join dan create juga mencoba menggunakan kembali tab Meet yang sudah ada sebelum membuka
  yang baru. Pencocokan mengabaikan query string URL yang tidak berbahaya seperti `authuser`, sehingga
  percobaan ulang agen seharusnya memfokuskan rapat yang sudah terbuka alih-alih membuat tab Chrome kedua.

Output perintah/tool menyertakan field `source` (`api` atau `browser`) sehingga agen
dapat menjelaskan path mana yang digunakan. `create` bergabung ke rapat baru secara default dan
mengembalikan `joined: true` plus sesi join. Untuk hanya mencetak URL, gunakan
`create --no-join` pada CLI atau berikan `"join": false` ke tool.

Atau beri tahu agen: "Buat Google Meet, gabung ke sana dengan suara realtime, dan kirim
tautannya kepada saya." Agen harus memanggil `google_meet` dengan `action: "create"` lalu
membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk join observe-only/kontrol browser, setel `"mode": "transcribe"`. Ini
tidak memulai bridge model realtime dupleks, sehingga tidak akan berbicara kembali ke
rapat.

Selama sesi realtime, status `google_meet` mencakup kesehatan browser dan bridge audio
seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output
terakhir, penghitung byte, dan state bridge tertutup. Jika prompt halaman Meet yang aman
muncul, automasi browser menanganinya bila bisa. Prompt login, penerimaan host, dan izin browser/OS
dilaporkan sebagai tindakan manual dengan alasan dan
pesan agar agen dapat menyampaikannya.

Chrome bergabung sebagai profil Chrome yang sudah login. Di Meet, pilih `BlackHole 2ch` untuk
jalur mikrofon/speaker yang digunakan oleh OpenClaw. Untuk audio dupleks yang bersih, gunakan
perangkat virtual terpisah atau grafik bergaya Loopback; satu perangkat BlackHole sudah
cukup untuk smoke test pertama tetapi dapat menimbulkan gema.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau API key model di dalam macOS VM
hanya agar VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu jalankan
host Node di VM. Aktifkan Plugin bawaan pada VM sekali agar Node
mengiklankan perintah Chrome:

Apa yang berjalan di mana:

- Host Gateway: OpenClaw Gateway, workspace agen, model/API key, provider
  realtime, dan config Plugin Google Meet.
- macOS VM Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang login ke Google.
- Tidak diperlukan di VM: layanan Gateway, config agen, key OpenAI/GPT, atau penyiapan
  provider model.

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
command -v rec play
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
WebSocket plaintext kecuali Anda memilih masuk untuk jaringan privat tepercaya tersebut:

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
LaunchAgent saat ada pada perintah instalasi.

Setujui Node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat Node dan bahwa Node mengiklankan capability `googlemeet.chrome`
dan browser/`browser.proxy`:

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

atau minta agen menggunakan tool `google_meet` dengan `transport: "chrome-node"`.

Untuk smoke test satu perintah yang membuat atau menggunakan kembali sesi, mengucapkan
frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama join, automasi browser OpenClaw mengisi nama tamu, mengklik Join/Ask
to join, dan menerima pilihan pertama "Use microphone" milik Meet saat prompt itu
muncul. Selama pembuatan rapat khusus browser, automasi juga dapat melanjutkan melewati
prompt yang sama tanpa mikrofon jika Meet tidak menampilkan tombol use-microphone.
Jika profil browser belum login, Meet sedang menunggu
penerimaan host, Chrome memerlukan izin mikrofon/kamera, atau Meet macet pada
prompt yang tidak dapat diselesaikan automasi, hasil join/test-speech melaporkan
`manualActionRequired: true` dengan `manualActionReason` dan
`manualActionMessage`. Agen harus berhenti mencoba ulang join,
melaporkan pesan tersebut beserta `browserUrl`/`browserTitle` saat ini, dan
mencoba ulang hanya setelah tindakan browser manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya ketika tepat satu
Node yang terhubung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa Node yang mampu terhubung, setel `chromeNode.node` ke id Node,
nama tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: Node yang dipin
  dikenal oleh Gateway tetapi tidak tersedia. Agen harus memperlakukan Node itu sebagai
  state diagnostik, bukan host Chrome yang dapat digunakan, dan melaporkan penghalang penyiapan
  alih-alih fallback ke transport lain kecuali pengguna meminta itu.
- `No connected Google Meet-capable node`: mulai `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` telah dijalankan di VM. Juga konfirmasi
  host Gateway mengizinkan kedua perintah Node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host
  yang sedang diperiksa dan reboot sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan reboot VM.
- Chrome terbuka tetapi tidak dapat bergabung: login ke profil browser di dalam VM, atau
  pertahankan `chrome.guestName` disetel untuk join tamu. Auto-join tamu menggunakan automasi browser OpenClaw
  melalui proxy browser Node; pastikan config browser Node
  menunjuk ke profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil existing-session bernama.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` tetap aktif. OpenClaw
  mengaktifkan tab yang sudah ada untuk URL Meet yang sama sebelum membuka yang baru, dan
  pembuatan rapat browser menggunakan kembali tab `https://meet.google.com/new`
  yang sedang berlangsung atau tab prompt akun Google sebelum membuka yang lain.
- Tidak ada audio: di Meet, rutekan mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau perutean bergaya Loopback
  untuk audio dupleks yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua tool eksternal:

- `sox`: utilitas audio command-line. Plugin ini menggunakan perintah `rec` dan `play`
  untuk bridge audio G.711 mu-law 8 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Driver ini membuat perangkat audio `BlackHole 2ch`
  yang dapat dirutekan oleh Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang kedua paket tersebut. Dokumen meminta pengguna
menginstalnya sebagai dependensi host melalui Homebrew. SoX dilisensikan sebagai
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membangun
installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi upstream
BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet di Google Chrome dan bergabung sebagai profil
Chrome yang sudah login. Di macOS, Plugin memeriksa `BlackHole 2ch` sebelum meluncurkan.
Jika dikonfigurasi, Plugin juga menjalankan perintah pemeriksaan kesehatan bridge audio dan perintah startup
sebelum membuka Chrome. Gunakan `chrome` saat Chrome/audio berada di host Gateway;
gunakan `chrome-node` saat Chrome/audio berada di Node yang dipairing seperti
macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, join gagal dengan error penyiapan
alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah dial plan ketat yang didelegasikan ke Plugin Voice Call. Transport ini
tidak mengurai halaman Meet untuk nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan fallback
dial-in telepon. Google Meet harus menampilkan nomor dial-in telepon dan PIN untuk
rapat tersebut; OpenClaw tidak menemukannya dari halaman Meet.

Aktifkan Plugin Voice Call pada host Gateway, bukan pada Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // atau setel "twilio" jika Twilio harus menjadi default
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
secret tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Restart atau reload Gateway setelah mengaktifkan `voice-call`; perubahan config Plugin
tidak muncul dalam proses Gateway yang sudah berjalan sampai proses tersebut di-reload.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Saat delegasi Twilio sudah terhubung, `googlemeet setup` mencakup pemeriksaan
`twilio-voice-call-plugin` dan `twilio-voice-call-credentials` yang berhasil.

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
fallback ke automasi browser. Konfigurasikan OAuth saat Anda menginginkan pembuatan API resmi,
resolusi space, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta scope yang diperlukan, otorisasi akun Google, lalu simpan
refresh token yang dihasilkan di config Plugin Google Meet atau berikan
variabel lingkungan `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan path join Chrome. Transport Chrome dan Chrome-node
tetap bergabung melalui profil Chrome yang sudah login, BlackHole/SoX, dan Node yang terhubung
saat Anda menggunakan partisipasi browser. OAuth hanya untuk path Google
Meet API resmi: membuat ruang rapat, resolve space, dan menjalankan pemeriksaan
preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih project Google Cloud.
2. Aktifkan **Google Meet REST API** untuk project tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** adalah yang paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan pribadi/pengujian; saat aplikasi masih dalam mode Testing,
     tambahkan setiap akun Google yang akan mengotorisasi aplikasi sebagai pengguna uji.
4. Tambahkan scope yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat OAuth client ID.
   - Jenis aplikasi: **Web application**.
   - URI redirect yang diotorisasi:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin client ID dan client secret.

`meetings.space.created` diperlukan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw melakukan resolve URL/kode Meet ke space.
`meetings.conference.media.readonly` digunakan untuk preflight Meet Media API dan pekerjaan media;
Google mungkin memerlukan pendaftaran Developer Preview untuk penggunaan Media API yang sebenarnya.
Jika Anda hanya memerlukan join Chrome berbasis browser, lewati OAuth sepenuhnya.

### Cetak refresh token

Konfigurasikan `oauth.clientId` dan opsional `oauth.clientSecret`, atau berikan sebagai
variabel lingkungan, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok config `oauth` dengan refresh token. Perintah ini menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
salin/tempel manual dengan `--manual`.

Contoh:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gunakan mode manual saat browser tidak dapat mencapai callback lokal:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Output JSON menyertakan:

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

Pilih variabel lingkungan saat Anda tidak ingin refresh token berada di config.
Jika nilai config dan environment sama-sama ada, Plugin me-resolve config
terlebih dahulu lalu fallback ke environment.

Persetujuan OAuth mencakup pembuatan space Meet, akses baca space Meet, dan akses baca media konferensi Meet. Jika Anda mengautentikasi sebelum dukungan
pembuatan rapat ada, jalankan ulang `openclaw googlemeet auth login --json` agar refresh
token memiliki scope `meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan OAuth doctor saat Anda menginginkan pemeriksaan kesehatan cepat tanpa secret:

```bash
openclaw googlemeet doctor --oauth --json
```

Perintah ini tidak memuat runtime Chrome atau memerlukan Chrome Node yang terhubung. Perintah ini
memeriksa bahwa config OAuth ada dan bahwa refresh token dapat mencetak access
token. Laporan JSON hanya menyertakan field status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Arti                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau access token yang di-cache, tersedia. |
| `oauth-token`        | Access token yang di-cache masih valid, atau refresh token mencetak access token baru.  |
| `meet-spaces-get`    | Pemeriksaan `--meeting` opsional me-resolve space Meet yang sudah ada.                  |
| `meet-spaces-create` | Pemeriksaan `--create-space` opsional membuat space Meet baru.                          |

Untuk membuktikan pengaktifan Google Meet API dan scope `spaces.create` juga, jalankan
pemeriksaan create yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sementara. Gunakan ini saat Anda perlu mengonfirmasi
bahwa project Google Cloud mengaktifkan Meet API dan bahwa akun yang diotorisasi
memiliki scope `meetings.space.created`.

Untuk membuktikan akses baca ke space rapat yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke space
yang sudah ada yang dapat diakses oleh akun Google yang diotorisasi. `403` dari pemeriksaan ini
biasanya berarti Google Meet REST API dinonaktifkan, refresh token hasil consent
tidak memiliki scope yang diperlukan, atau akun Google tidak dapat mengakses space
Meet tersebut. Error refresh-token berarti jalankan ulang `openclaw googlemeet auth login
--json` dan simpan blok `oauth` baru.

Tidak diperlukan kredensial OAuth untuk fallback browser. Dalam mode itu, auth Google
berasal dari profil Chrome yang sudah login pada Node yang dipilih, bukan dari
config OpenClaw.

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

Daftar artefak rapat dan kehadiran setelah Meet membuat conference record:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Dengan `--meeting`, `artifacts` dan `attendance` menggunakan conference record
terbaru secara default. Berikan `--all-conference-records` saat Anda menginginkan setiap record yang dipertahankan
untuk rapat tersebut.

Lookup kalender dapat me-resolve URL rapat dari Google Calendar sebelum membaca
artefak Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` mencari kalender `primary` hari ini untuk Calendar event dengan
tautan Google Meet. Gunakan `--event <query>` untuk mencari teks event yang cocok, dan
`--calendar <id>` untuk kalender non-primary. Lookup kalender memerlukan
login OAuth baru yang menyertakan scope readonly Calendar events.
`calendar-events` menampilkan pratinjau event Meet yang cocok dan menandai event yang akan
dipilih oleh `latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id conference record, alamatkan langsung:

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

`artifacts` mengembalikan metadata conference record plus metadata resource peserta,
rekaman, transkrip, entri transkrip terstruktur, dan smart-note saat
Google mengeksposnya untuk rapat tersebut. Gunakan `--no-transcript-entries` untuk melewati
lookup entri untuk rapat besar. `attendance` memperluas peserta menjadi
baris sesi peserta dengan waktu pertama/terakhir terlihat, total durasi sesi,
flag terlambat/pulang lebih awal, dan resource peserta duplikat yang digabungkan berdasarkan pengguna yang login
atau nama tampilan. Berikan `--no-merge-duplicates` untuk mempertahankan resource peserta mentah
tetap terpisah, `--late-after-minutes` untuk menyetel deteksi terlambat, dan
`--early-before-minutes` untuk menyetel deteksi pulang lebih awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, conference record,
file output, jumlah, sumber token, Calendar event saat digunakan, dan
peringatan pengambilan parsial. Berikan `--zip` untuk juga menulis arsip portabel
di samping folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs
transkrip dan smart-note yang ditautkan melalui Google Drive `files.export`; ini memerlukan
login OAuth baru yang mencakup scope readonly Drive Meet. Tanpa
`--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri transkrip terstruktur.
Jika Google mengembalikan kegagalan artefak parsial, seperti error listing smart-note,
entri transkrip, atau body dokumen Drive, ringkasan dan
manifest mempertahankan peringatan itu alih-alih menggagalkan seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
manifest JSON tanpa membuat folder atau ZIP. Ini berguna sebelum menulis
ekspor besar atau saat agen hanya memerlukan jumlah, record yang dipilih, dan
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

Setel `"dryRun": true` untuk hanya mengembalikan manifest ekspor dan melewati penulisan file.

Jalankan smoke live yang dijaga terhadap rapat nyata yang dipertahankan:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Lingkungan smoke live:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan tes live yang dijaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL, kode, atau
  `spaces/{id}` Meet yang dipertahankan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN` menyediakan
  refresh token.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang sama
  tanpa prefiks `OPENCLAW_`.

Smoke live artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Lookup
kalender memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`. Ekspor
body dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat space Meet baru:

```bash
openclaw googlemeet create
```

Perintah ini mencetak `meeting uri`, sumber, dan sesi join yang baru. Dengan kredensial
OAuth perintah ini menggunakan Google Meet API resmi. Tanpa kredensial OAuth, perintah ini
menggunakan fallback profil browser yang sudah login pada Chrome Node yang dipin. Agen dapat
menggunakan tool `google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
langkah. Untuk pembuatan URL saja, berikan `"join": false`.

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

Jika fallback browser menemui login Google atau penghalang izin Meet sebelum
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
`manualActionMessage` beserta konteks Node/tab browser dan berhenti membuka tab
Meet baru sampai operator menyelesaikan langkah browser tersebut.

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

Membuat Meet secara default juga melakukan join. Transport Chrome atau Chrome-node tetap
memerlukan profil Google Chrome yang sudah login untuk bergabung melalui browser. Jika
profil logout, OpenClaw melaporkan `manualActionRequired: true` atau
error fallback browser dan meminta operator menyelesaikan login Google sebelum
mencoba lagi.

Setel `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi bahwa Cloud
project, principal OAuth, dan peserta rapat Anda terdaftar dalam Google
Workspace Developer Preview Program untuk Meet media APIs.

## Config

Path realtime Chrome yang umum hanya memerlukan Plugin diaktifkan, BlackHole, SoX,
dan key provider suara realtime backend. OpenAI adalah default; setel
`realtime.provider: "google"` untuk menggunakan Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Setel config Plugin di bawah `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/nama/IP Node opsional untuk `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu
  Meet dalam keadaan logout
- `chrome.autoJoin: true`: pengisian nama tamu dan klik Join Now best-effort
  melalui automasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang sudah ada alih-alih
  membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu sampai tab Meet melaporkan in-call
  sebelum intro realtime dipicu
- `chrome.audioInputCommand`: perintah SoX `rec` yang menulis audio
  G.711 mu-law 8 kHz ke stdout
- `chrome.audioOutputCommand`: perintah SoX `play` yang membaca audio
  G.711 mu-law 8 kHz dari stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih dalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime
  terhubung; setel ke `""` untuk bergabung secara diam-diam

Override opsional:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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

Config khusus Twilio:

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
panggilan PSTN aktual dan DTMF ke Plugin Voice Call. Jika `voice-call` tidak
diaktifkan, Google Meet tetap dapat memvalidasi dan merekam dial plan, tetapi
tidak dapat melakukan panggilan Twilio.

## Tool

Agen dapat menggunakan tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Gunakan `transport: "chrome"` saat Chrome berjalan pada host Gateway. Gunakan
`transport: "chrome-node"` saat Chrome berjalan pada Node yang dipairing seperti
VM Parallels. Dalam kedua kasus tersebut model realtime dan `openclaw_agent_consult` berjalan pada
host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan
`action: "speak"` dengan `sessionId` dan `message` agar agen realtime
segera berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan kembali sesi,
memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host
Chrome dapat melaporkannya. Gunakan `action: "leave"` untuk menandai sesi berakhir.

`status` mencakup kesehatan Chrome saat tersedia:

- `inCall`: Chrome tampak berada di dalam panggilan Meet
- `micMuted`: state mikrofon Meet best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  browser memerlukan login manual, penerimaan host Meet, izin, atau
  perbaikan kontrol browser sebelum ucapan dapat berfungsi
- `providerConnected` / `realtimeReady`: state bridge suara realtime
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara live. Provider suara realtime
mendengar audio rapat dan berbicara melalui bridge audio yang dikonfigurasi.
Saat model realtime membutuhkan reasoning yang lebih dalam, informasi terkini, atau tool OpenClaw normal, model dapat memanggil `openclaw_agent_consult`.

Tool konsultasi menjalankan agen OpenClaw biasa di balik layar dengan konteks
transkrip rapat terbaru dan mengembalikan jawaban lisan ringkas ke sesi suara
realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke rapat.
Tool ini menggunakan tool konsultasi realtime bersama yang sama seperti Voice Call.

`realtime.toolPolicy` mengontrol eksekusi konsultasi:

- `safe-read-only`: tampilkan tool konsultasi dan batasi agen biasa ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: tampilkan tool konsultasi dan biarkan agen biasa menggunakan
  kebijakan tool agen normal.
- `none`: jangan tampilkan tool konsultasi ke model suara realtime.

Kunci sesi konsultasi diberi cakupan per sesi Meet, sehingga panggilan konsultasi lanjutan
dapat menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

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

## Checklist tes live

Gunakan urutan ini sebelum menyerahkan rapat ke agen tanpa pengawasan:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

State `chrome-node` yang diharapkan:

- `googlemeet setup` semuanya hijau.
- `googlemeet setup` mencakup `chrome-node-connected` saat `chrome-node` adalah
  transport default atau sebuah Node dipin.
- `nodes status` menunjukkan Node yang dipilih terhubung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan
  `inCall: true`.

Untuk host Chrome jarak jauh seperti macOS VM Parallels, ini adalah pemeriksaan aman
terpendek setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Ini membuktikan bahwa Plugin Gateway dimuat, VM Node terhubung dengan
token saat ini, dan bridge audio Meet tersedia sebelum agen membuka tab rapat
nyata.

Untuk smoke Twilio, gunakan rapat yang menampilkan detail dial-in telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

State Twilio yang diharapkan:

- `googlemeet setup` mencakup pemeriksaan `twilio-voice-call-plugin` dan
  `twilio-voice-call-credentials` yang hijau.
- `voicecall` tersedia di CLI setelah reload Gateway.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` menutup panggilan suara yang didelegasikan.

## Pemecahan masalah

### Agen tidak dapat melihat tool Google Meet

Konfirmasikan Plugin diaktifkan dalam config Gateway dan reload Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, restart atau reload Gateway.
Agen yang sedang berjalan hanya melihat tool Plugin yang didaftarkan oleh proses Gateway
saat ini.

### Tidak ada Node yang terhubung dan mampu Google Meet

Pada host Node, jalankan:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Pada host Gateway, setujui Node dan verifikasi perintah:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node harus terhubung dan mencantumkan `googlemeet.chrome` plus `browser.proxy`.
Config Gateway harus mengizinkan perintah Node tersebut:

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
`gateway token mismatch`, instal ulang atau restart Node dengan token Gateway
saat ini. Untuk Gateway LAN biasanya ini berarti:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Lalu reload layanan Node dan jalankan ulang:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser terbuka tetapi agen tidak dapat bergabung

Jalankan `googlemeet test-speech` dan periksa kesehatan Chrome yang dikembalikan. Jika
laporan menyatakan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator
dan hentikan percobaan ulang sampai tindakan browser selesai.

Tindakan manual yang umum:

- Login ke profil Chrome.
- Terima tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome
  muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "belum login" hanya karena Meet menampilkan "Do you want people to
hear you in the meeting?" Itu adalah interstitial pilihan audio milik Meet; OpenClaw
mengklik **Use microphone** melalui automasi browser saat tersedia dan tetap
menunggu state rapat yang sebenarnya. Untuk fallback browser create-only, OpenClaw
dapat mengklik **Continue without microphone** karena pembuatan URL tidak memerlukan
jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create`
saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, perintah ini fallback
ke browser Chrome Node yang dipin. Konfirmasikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang sesuai tersedia.
- Untuk pembuatan API: refresh token dibuat setelah dukungan create
  ditambahkan. Token lama mungkin tidak memiliki scope `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui config Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` menunjuk ke Node terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw pada Node tersebut sudah login
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan kembali tab `https://meet.google.com/new`
  atau prompt akun Google yang sudah ada sebelum membuka tab baru. Jika agen timeout,
  coba ulang panggilan tool alih-alih membuka tab Meet lain secara manual.
- Untuk fallback browser: jika tool mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan retry dalam loop sampai
  tindakan itu selesai.
- Untuk fallback browser: jika Meet menampilkan "Do you want people to hear you in the
  meeting?", biarkan tab tetap terbuka. OpenClaw seharusnya mengklik **Use microphone** atau, untuk
  fallback create-only, **Continue without microphone** melalui automasi browser
  dan terus menunggu URL Meet yang dihasilkan. Jika tidak bisa, error
  seharusnya menyebut `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa path realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk dengar/balas langsung. `mode: "transcribe"` memang
tidak memulai bridge suara realtime dupleks.

Verifikasi juga:

- Key provider realtime tersedia pada host Gateway, seperti
  `OPENAI_API_KEY` atau `GEMINI_API_KEY`.
- `BlackHole 2ch` terlihat pada host Chrome.
- `rec` dan `play` ada pada host Chrome.
- Mikrofon dan speaker Meet dirutekan melalui jalur audio virtual yang digunakan oleh
  OpenClaw.

`googlemeet doctor [session-id]` mencetak sesi, Node, state in-call,
alasan tindakan manual, koneksi provider realtime, `realtimeReady`, aktivitas audio
input/output, timestamp audio terakhir, penghitung byte, dan URL browser.
Gunakan `googlemeet status [session-id]` saat Anda memerlukan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh Google Meet OAuth
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda
juga memerlukan bukti Google Meet API.

Jika agen timeout dan Anda dapat melihat tab Meet sudah terbuka, periksa tab itu
tanpa membuka yang lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Tindakan tool yang setara adalah `recover_current_tab`. Tindakan ini memfokuskan dan memeriksa
tab Meet yang sudah ada untuk transport yang dipilih. Dengan `chrome`, tindakan ini menggunakan
kontrol browser lokal melalui Gateway; dengan `chrome-node`, tindakan ini menggunakan
Chrome Node yang dikonfigurasi. Tindakan ini tidak membuka tab baru atau membuat sesi baru; tindakan ini melaporkan
penghalang saat ini, seperti login, penerimaan, izin, atau state pilihan audio.
Perintah CLI berbicara ke Gateway yang dikonfigurasi, jadi Gateway harus berjalan;
`chrome-node` juga mengharuskan Chrome Node terhubung.

### Pemeriksaan penyiapan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, dan reload
Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki account
SID, auth token, atau nomor penelepon. Setel ini pada host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Lalu restart atau reload Gateway dan jalankan:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` hanya untuk kesiapan secara default. Untuk dry-run nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Tambahkan `--yes` hanya saat Anda benar-benar ingin melakukan panggilan notifikasi keluar live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Konfirmasikan event Meet menampilkan detail dial-in telepon. Berikan nomor dial-in
yang tepat dan PIN atau urutan DTMF kustom:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan `w` di depan atau koma dalam `--dtmf-sequence` jika provider memerlukan jeda
sebelum memasukkan PIN.

## Catatan

Media API resmi Google Meet berorientasi penerimaan, jadi berbicara ke panggilan Meet
tetap memerlukan path peserta. Plugin ini menjaga batas itu tetap terlihat:
Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome memerlukan salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki
  bridge model realtime dan mem-pipe audio G.711 mu-law 8 kHz di antara perintah tersebut
  dan provider suara realtime yang dipilih.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio dupleks yang bersih, rutekan output Meet dan mikrofon Meet melalui
perangkat virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat memantulkan peserta lain kembali ke panggilan.

`googlemeet speak` memicu bridge audio realtime aktif untuk sesi
Chrome. `googlemeet leave` menghentikan bridge tersebut. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Voice call plugin](/id/plugins/voice-call)
- [Talk mode](/id/nodes/talk)
- [Building plugins](/id/plugins/building-plugins)

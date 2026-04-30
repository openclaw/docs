---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda ingin agen OpenClaw membuat panggilan Google Meet baru
    - Anda sedang mengonfigurasi Chrome, Node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan pengaturan default suara waktu nyata'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T10:01:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Dukungan peserta Google Meet untuk OpenClaw — plugin ini eksplisit secara desain:

- Plugin hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Plugin dapat membuat ruang Meet baru melalui Google Meet API, lalu bergabung ke
  URL yang dikembalikan.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali agen OpenClaw lengkap ketika penalaran
  lebih dalam atau alat diperlukan.
- Agen memilih perilaku bergabung dengan `mode`: gunakan `realtime` untuk
  mendengarkan/berbicara balik secara langsung, atau `transcribe` untuk
  bergabung/mengontrol browser tanpa jembatan suara realtime.
- Auth dimulai sebagai Google OAuth pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau di host node yang dipasangkan.
- Twilio menerima nomor dial-in plus PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja
  telekonferensi agen yang lebih luas.

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
Homebrew memerlukan reboot sebelum macOS mengekspos perangkat tersebut:

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

Periksa setup:

```bash
openclaw googlemeet setup
```

Output setup dimaksudkan agar dapat dibaca agen dan memahami mode. Output
melaporkan profil Chrome, penguncian node, dan, untuk bergabung Chrome realtime,
jembatan audio BlackHole/SoX serta pemeriksaan intro realtime tertunda. Untuk
bergabung hanya observasi, periksa transport yang sama dengan `--mode transcribe`;
mode itu melewati prasyarat audio realtime karena tidak mendengarkan melalui atau
berbicara melalui jembatan:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Ketika delegasi Twilio dikonfigurasi, setup juga melaporkan apakah plugin
`voice-call` dan kredensial Twilio siap. Perlakukan setiap pemeriksaan `ok: false`
sebagai pemblokir untuk transport dan mode yang diperiksa sebelum meminta agen
bergabung. Gunakan `openclaw googlemeet setup --json` untuk skrip atau output yang
dapat dibaca mesin. Gunakan `--transport chrome`, `--transport chrome-node`, atau
`--transport twilio` untuk preflight transport tertentu sebelum agen mencobanya.

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

Buat rapat baru dan bergabung ke dalamnya:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Buat URL saja tanpa bergabung:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` memiliki dua jalur:

- Buat via API: digunakan ketika kredensial Google Meet OAuth dikonfigurasi. Ini
  adalah jalur paling deterministik dan tidak bergantung pada status UI browser.
- Fallback browser: digunakan ketika kredensial OAuth tidak ada. OpenClaw
  menggunakan node Chrome yang dikunci, membuka `https://meet.google.com/new`,
  menunggu Google mengalihkan ke URL kode rapat nyata, lalu mengembalikan URL
  tersebut. Jalur ini mengharuskan profil Chrome OpenClaw di node sudah masuk ke
  Google. Otomasi browser menangani prompt mikrofon first-run milik Meet; prompt
  itu tidak diperlakukan sebagai kegagalan login Google.
  Alur bergabung dan buat juga mencoba menggunakan kembali tab Meet yang ada
  sebelum membuka tab baru. Pencocokan mengabaikan string kueri URL yang tidak
  berbahaya seperti `authuser`, sehingga percobaan ulang agen seharusnya
  memfokuskan rapat yang sudah terbuka alih-alih membuat tab Chrome kedua.

Output perintah/alat menyertakan bidang `source` (`api` atau `browser`) sehingga
agen dapat menjelaskan jalur mana yang digunakan. `create` bergabung ke rapat
baru secara default dan mengembalikan `joined: true` plus sesi bergabung. Untuk
hanya menerbitkan URL, gunakan `create --no-join` di CLI atau teruskan
`"join": false` ke alat.

Atau beri tahu agen: "Buat Google Meet, bergabung dengan suara realtime, dan
kirim tautannya kepada saya." Agen seharusnya memanggil `google_meet` dengan
`action: "create"` lalu membagikan `meetingUri` yang dikembalikan.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Untuk bergabung hanya observasi/kontrol browser, atur `"mode": "transcribe"`. Itu
tidak memulai jembatan model realtime dupleks, tidak memerlukan BlackHole atau
SoX, dan tidak akan berbicara balik ke rapat. Bergabung Chrome dalam mode ini
juga menghindari pemberian izin mikrofon/kamera OpenClaw dan menghindari jalur
Meet **Use microphone**. Jika Meet menampilkan interstitial pilihan audio,
otomasi mencoba jalur tanpa mikrofon dan jika tidak bisa melaporkan tindakan
manual alih-alih membuka mikrofon lokal.

Selama sesi realtime, status `google_meet` menyertakan kesehatan browser dan
jembatan audio seperti `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp input/output
terakhir, penghitung byte, dan status jembatan tertutup. Jika prompt halaman Meet
yang aman muncul, otomasi browser menanganinya ketika bisa. Login, penerimaan
host, dan prompt izin browser/OS dilaporkan sebagai tindakan manual dengan alasan
dan pesan untuk diteruskan agen. Sesi Chrome terkelola hanya mengeluarkan intro
atau frasa uji setelah kesehatan browser melaporkan `inCall: true`; jika tidak,
status melaporkan `speechReady: false` dan percobaan bicara diblokir alih-alih
berpura-pura agen berbicara ke rapat.

Bergabung Chrome lokal melalui profil browser OpenClaw yang sudah masuk. Mode
realtime memerlukan `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan
oleh OpenClaw. Untuk audio dupleks yang bersih, gunakan perangkat virtual
terpisah atau grafik bergaya Loopback; satu perangkat BlackHole cukup untuk
smoke test pertama tetapi dapat menimbulkan gema.

### Gateway lokal + Parallels Chrome

Anda **tidak** memerlukan Gateway OpenClaw lengkap atau kunci API model di dalam
VM macOS hanya untuk membuat VM memiliki Chrome. Jalankan Gateway dan agen secara
lokal, lalu jalankan host node di VM. Aktifkan plugin bundel di VM sekali agar
node mengiklankan perintah Chrome:

Yang berjalan di mana:

- Host Gateway: OpenClaw Gateway, workspace agen, kunci model/API, provider
  realtime, dan konfigurasi plugin Google Meet.
- VM macOS Parallels: CLI/host node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agen, kunci OpenAI/GPT,
  atau setup provider model.

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

Instal atau perbarui OpenClaw di VM, lalu aktifkan plugin bundel di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, node menolak
WebSocket plaintext kecuali Anda ikut serta untuk jaringan privat tepercaya itu:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah environment proses, bukan pengaturan
`openclaw.json`. `openclaw node install` menyimpannya di environment LaunchAgent
ketika variabel tersebut ada pada perintah instal.

Setujui node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasi Gateway melihat node dan node tersebut mengiklankan
`googlemeet.chrome` serta kapabilitas browser/`browser.proxy`:

```bash
openclaw nodes status
```

Rutekan Meet melalui node itu di host Gateway:

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

Untuk smoke test satu perintah yang membuat atau menggunakan kembali sesi,
mengucapkan frasa yang diketahui, dan mencetak kesehatan sesi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Selama bergabung realtime, otomasi browser OpenClaw mengisi nama tamu, mengeklik
Join/Ask to join, dan menerima pilihan "Use microphone" first-run Meet ketika
prompt itu muncul. Selama bergabung hanya observasi atau pembuatan rapat hanya
browser, otomasi terus melewati prompt yang sama tanpa mikrofon ketika pilihan
itu tersedia. Jika profil browser belum masuk, Meet sedang menunggu penerimaan
host, Chrome memerlukan izin mikrofon/kamera untuk bergabung realtime, atau Meet
tertahan pada prompt yang tidak dapat diselesaikan otomasi, hasil
join/test-speech melaporkan `manualActionRequired: true` dengan
`manualActionReason` dan `manualActionMessage`. Agen harus berhenti mencoba ulang
bergabung, melaporkan pesan persis itu plus `browserUrl`/`browserTitle` saat ini,
dan mencoba ulang hanya setelah tindakan browser manual selesai.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya ketika tepat
satu node terhubung mengiklankan `googlemeet.chrome` dan kontrol browser. Jika
beberapa node yang mampu terhubung, atur `chromeNode.node` ke id node, nama
tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `Configured Google Meet node ... is not usable: offline`: node yang dipasangkan
  diketahui oleh Gateway tetapi tidak tersedia. Agents harus memperlakukan node itu sebagai
  status diagnostik, bukan sebagai host Chrome yang dapat digunakan, dan melaporkan penghambat penyiapan
  alih-alih kembali ke transport lain kecuali pengguna memintanya.
- `No connected Google Meet-capable node`: jalankan `openclaw node run` di VM,
  setujui pemasangan, dan pastikan `openclaw plugins enable google-meet` serta
  `openclaw plugins enable browser` sudah dijalankan di VM. Konfirmasi juga bahwa
  host Gateway mengizinkan kedua perintah node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instal `blackhole-2ch` pada host
  yang sedang diperiksa dan mulai ulang sebelum menggunakan audio Chrome lokal.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan mulai ulang VM.
- Chrome terbuka tetapi tidak dapat bergabung: masuk ke profil peramban di dalam VM, atau
  tetap tetapkan `chrome.guestName` untuk bergabung sebagai tamu. Bergabung otomatis sebagai tamu menggunakan automasi peramban OpenClaw
  melalui proksi peramban node; pastikan konfigurasi peramban node
  mengarah ke profil yang Anda inginkan, misalnya
  `browser.defaultProfile: "user"` atau profil sesi-berjalan bernama yang sudah ada.
- Tab Meet duplikat: biarkan `chrome.reuseExistingTab: true` tetap aktif. OpenClaw
  mengaktifkan tab yang sudah ada untuk URL Meet yang sama sebelum membuka yang baru, dan
  pembuatan rapat peramban menggunakan kembali tab `https://meet.google.com/new`
  yang sedang berlangsung atau tab prompt akun Google sebelum membuka tab lain.
- Tidak ada audio: di Meet, arahkan mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau perutean bergaya Loopback
  untuk audio dupleks yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua alat eksternal:

- `sox`: utilitas audio baris perintah. Plugin menggunakan perintah perangkat CoreAudio
  eksplisit untuk bridge audio PCM16 24 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Ini membuat perangkat audio `BlackHole 2ch`
  yang dapat dirutekan melalui Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang kedua paket tersebut. Dokumentasi meminta pengguna untuk
menginstalnya sebagai dependensi host melalui Homebrew. SoX dilisensikan sebagai
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membuat
installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi
upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet melalui kontrol peramban OpenClaw dan bergabung
sebagai profil peramban OpenClaw yang sudah masuk. Di macOS, plugin memeriksa
`BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, plugin juga menjalankan perintah kesehatan
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
Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan kesalahan penyiapan
alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah rencana panggilan ketat yang didelegasikan ke Plugin Voice Call. Transport ini
tidak mengurai halaman Meet untuk nomor telepon.

Gunakan ini saat partisipasi Chrome tidak tersedia atau Anda menginginkan fallback dial-in
telepon. Google Meet harus menampilkan nomor dial-in telepon dan PIN untuk
rapat; OpenClaw tidak menemukannya dari halaman Meet.

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

Berikan kredensial Twilio melalui environment atau konfigurasi. Environment menjaga
rahasia tetap di luar `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Mulai ulang atau muat ulang Gateway setelah mengaktifkan `voice-call`; perubahan konfigurasi plugin
tidak muncul di proses Gateway yang sudah berjalan sampai proses itu dimuat ulang.

Lalu verifikasi:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Saat delegasi Twilio sudah tersambung, `googlemeet setup` menyertakan pemeriksaan
`twilio-voice-call-plugin` dan `twilio-voice-call-credentials` yang berhasil.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` saat rapat membutuhkan urutan khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

OAuth bersifat opsional untuk membuat tautan Meet karena `googlemeet create` dapat menggunakan
fallback ke automasi peramban. Konfigurasikan OAuth saat Anda menginginkan pembuatan API resmi,
resolusi space, atau pemeriksaan preflight Meet Media API.

Akses Google Meet API menggunakan OAuth pengguna: buat klien OAuth Google Cloud,
minta scope yang diperlukan, otorisasi akun Google, lalu simpan
refresh token yang dihasilkan di konfigurasi Plugin Google Meet atau berikan
variabel environment `OPENCLAW_GOOGLE_MEET_*`.

OAuth tidak menggantikan jalur bergabung Chrome. Transport Chrome dan Chrome-node
tetap bergabung melalui profil Chrome yang sudah masuk, BlackHole/SoX, dan node yang terhubung
saat Anda menggunakan partisipasi peramban. OAuth hanya untuk jalur Google
Meet API resmi: membuat space rapat, menyelesaikan space, dan menjalankan pemeriksaan
preflight Meet Media API.

### Buat kredensial Google

Di Google Cloud Console:

1. Buat atau pilih proyek Google Cloud.
2. Aktifkan **Google Meet REST API** untuk proyek tersebut.
3. Konfigurasikan layar persetujuan OAuth.
   - **Internal** paling sederhana untuk organisasi Google Workspace.
   - **External** berfungsi untuk penyiapan pribadi/uji; saat aplikasi berada dalam Testing,
     tambahkan setiap akun Google yang akan mengotorisasi aplikasi sebagai pengguna uji.
4. Tambahkan scope yang diminta OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Buat OAuth client ID.
   - Jenis aplikasi: **Web application**.
   - URI pengalihan yang diotorisasi:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Salin client ID dan client secret.

`meetings.space.created` diperlukan oleh Google Meet `spaces.create`.
`meetings.space.readonly` memungkinkan OpenClaw menyelesaikan URL/kode Meet menjadi space.
`meetings.conference.media.readonly` digunakan untuk preflight Meet Media API dan pekerjaan media;
Google mungkin mengharuskan pendaftaran Developer Preview untuk penggunaan Media API sebenarnya.
Jika Anda hanya membutuhkan proses bergabung Chrome berbasis peramban, lewati OAuth sepenuhnya.

### Buat refresh token

Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, atau teruskan sebagai
variabel environment, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok konfigurasi `oauth` dengan refresh token. Perintah ini menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
salin/tempel manual dengan `--manual`.

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

Utamakan variabel environment saat Anda tidak ingin refresh token berada di konfigurasi.
Jika nilai konfigurasi dan environment sama-sama ada, plugin menyelesaikan konfigurasi
terlebih dahulu lalu fallback environment.

Persetujuan OAuth mencakup pembuatan space Meet, akses baca space Meet, dan akses baca media
konferensi Meet. Jika Anda mengautentikasi sebelum dukungan pembuatan rapat
tersedia, jalankan ulang `openclaw googlemeet auth login --json` agar refresh
token memiliki scope `meetings.space.created`.

### Verifikasi OAuth dengan doctor

Jalankan doctor OAuth saat Anda menginginkan pemeriksaan kesehatan cepat tanpa rahasia:

```bash
openclaw googlemeet doctor --oauth --json
```

Ini tidak memuat runtime Chrome atau memerlukan node Chrome yang terhubung. Ini
memeriksa bahwa konfigurasi OAuth ada dan bahwa refresh token dapat membuat access
token. Laporan JSON hanya menyertakan kolom status seperti `ok`, `configured`,
`tokenSource`, `expiresAt`, dan pesan pemeriksaan; laporan ini tidak mencetak access
token, refresh token, atau client secret.

Hasil umum:

| Pemeriksaan          | Arti                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, atau access token yang di-cache, ada.       |
| `oauth-token`        | Access token yang di-cache masih valid, atau refresh token membuat access token baru.   |
| `meet-spaces-get`    | Pemeriksaan opsional `--meeting` menyelesaikan space Meet yang sudah ada.              |
| `meet-spaces-create` | Pemeriksaan opsional `--create-space` membuat space Meet baru.                         |

Untuk membuktikan pengaktifan Google Meet API dan scope `spaces.create` juga, jalankan
pemeriksaan pembuatan yang memiliki efek samping:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` membuat URL Meet sekali pakai. Gunakan ini saat Anda perlu mengonfirmasi
bahwa proyek Google Cloud telah mengaktifkan Meet API dan bahwa akun yang diotorisasi
memiliki scope `meetings.space.created`.

Untuk membuktikan akses baca untuk space rapat yang sudah ada:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` dan `resolve-space` membuktikan akses baca ke space
yang sudah ada yang dapat diakses akun Google yang diotorisasi. `403` dari pemeriksaan ini
biasanya berarti Google Meet REST API dinonaktifkan, refresh token yang disetujui
kehilangan scope yang diperlukan, atau akun Google tidak dapat mengakses space Meet tersebut.
Kesalahan refresh-token berarti jalankan ulang `openclaw googlemeet auth login
--json` dan simpan blok `oauth` baru.

Tidak diperlukan kredensial OAuth untuk fallback peramban. Dalam mode itu, autentikasi Google
berasal dari profil Chrome yang sudah masuk pada node yang dipilih, bukan dari
konfigurasi OpenClaw.

Variabel environment berikut diterima sebagai fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` atau `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` atau `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` atau
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` atau `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` atau `GOOGLE_MEET_PREVIEW_ACK`

Resolve URL, kode, atau `spaces/{id}` Meet melalui `spaces.get`:

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
secara default. Berikan `--all-conference-records` saat Anda menginginkan setiap catatan yang disimpan
untuk rapat tersebut.

Pencarian Calendar dapat me-resolve URL rapat dari Google Calendar sebelum membaca
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
OAuth baru yang menyertakan cakupan readonly event Calendar.
`calendar-events` mempratinjau event Meet yang cocok dan menandai event yang akan dipilih oleh
`latest`, `artifacts`, `attendance`, atau `export`.

Jika Anda sudah mengetahui id catatan konferensi, alamatkan langsung:

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

`artifacts` mengembalikan metadata catatan konferensi ditambah metadata resource peserta, rekaman,
transkrip, entri transkrip terstruktur, dan catatan pintar saat
Google mengeksposnya untuk rapat. Gunakan `--no-transcript-entries` untuk melewati
pencarian entri untuk rapat besar. `attendance` memperluas peserta menjadi
baris sesi peserta dengan waktu pertama/terakhir terlihat, total durasi sesi,
flag terlambat/pulang-awal, dan resource peserta duplikat yang digabung berdasarkan pengguna yang masuk
atau nama tampilan. Berikan `--no-merge-duplicates` untuk mempertahankan resource peserta mentah
secara terpisah, `--late-after-minutes` untuk menyesuaikan deteksi keterlambatan, dan
`--early-before-minutes` untuk menyesuaikan deteksi pulang awal.

`export` menulis folder yang berisi `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, dan `manifest.json`.
`manifest.json` mencatat input yang dipilih, opsi ekspor, catatan konferensi,
file output, jumlah, sumber token, event Calendar saat digunakan, dan
peringatan pengambilan sebagian apa pun. Berikan `--zip` untuk juga menulis arsip portabel
di samping folder. Berikan `--include-doc-bodies` untuk mengekspor teks Google Docs
transkrip dan catatan pintar yang tertaut melalui Google Drive `files.export`; ini memerlukan
login OAuth baru yang menyertakan cakupan readonly Drive Meet. Tanpa
`--include-doc-bodies`, ekspor hanya menyertakan metadata Meet dan entri transkrip
terstruktur. Jika Google mengembalikan kegagalan artefak sebagian, seperti kesalahan daftar
catatan pintar, entri transkrip, atau isi dokumen Drive, ringkasan dan
manifest mempertahankan peringatan alih-alih menggagalkan seluruh ekspor.
Gunakan `--dry-run` untuk mengambil data artefak/kehadiran yang sama dan mencetak
JSON manifest tanpa membuat folder atau ZIP. Itu berguna sebelum menulis
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

Tetapkan `"dryRun": true` untuk hanya mengembalikan manifest ekspor dan melewati penulisan file.

Jalankan uji smoke live terjaga terhadap rapat nyata yang disimpan:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Lingkungan uji smoke live:

- `OPENCLAW_LIVE_TEST=1` mengaktifkan pengujian live terjaga.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` menunjuk ke URL, kode, atau
  `spaces/{id}` Meet yang disimpan.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` atau `GOOGLE_MEET_CLIENT_ID` menyediakan id klien
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` atau `GOOGLE_MEET_REFRESH_TOKEN` menyediakan
  token refresh.
- Opsional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, dan
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` menggunakan nama fallback yang sama
  tanpa prefiks `OPENCLAW_`.

Uji smoke live artefak/kehadiran dasar memerlukan
`https://www.googleapis.com/auth/meetings.space.readonly` dan
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Pencarian Calendar
memerlukan `https://www.googleapis.com/auth/calendar.events.readonly`. Ekspor
isi dokumen Drive memerlukan
`https://www.googleapis.com/auth/drive.meet.readonly`.

Buat ruang Meet baru:

```bash
openclaw googlemeet create
```

Perintah mencetak `meeting uri` baru, sumber, dan sesi bergabung. Dengan kredensial OAuth,
perintah ini menggunakan API Google Meet resmi. Tanpa kredensial OAuth, perintah ini
menggunakan profil browser yang sudah masuk milik Node Chrome yang dipin sebagai fallback. Agen dapat
menggunakan alat `google_meet` dengan `action: "create"` untuk membuat dan bergabung dalam satu
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

Jika fallback browser menemui login Google atau pemblokir izin Meet sebelum
dapat membuat URL, metode Gateway mengembalikan respons gagal dan alat
`google_meet` mengembalikan detail terstruktur alih-alih string polos:

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
Meet baru sampai operator menyelesaikan langkah browser.

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

Pembuatan Meet bergabung secara default. Transport Chrome atau Chrome-node masih
memerlukan profil Google Chrome yang sudah masuk untuk bergabung melalui browser. Jika
profil sudah keluar, OpenClaw melaporkan `manualActionRequired: true` atau
kesalahan fallback browser dan meminta operator menyelesaikan login Google sebelum
mencoba lagi.

Tetapkan `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi bahwa project Cloud,
principal OAuth, dan peserta rapat Anda terdaftar dalam Google
Workspace Developer Preview Program untuk API media Meet.

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

Tetapkan konfigurasi Plugin di bawah `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: nama yang digunakan pada layar tamu Meet
  yang belum masuk
- `chrome.autoJoin: true`: pengisian nama tamu dan klik Join Now secara best-effort
  melalui automasi browser OpenClaw pada `chrome-node`
- `chrome.reuseExistingTab: true`: aktifkan tab Meet yang ada alih-alih
  membuka duplikat
- `chrome.waitForInCallMs: 20000`: tunggu tab Meet melaporkan in-call
  sebelum intro realtime dipicu
- `chrome.audioFormat: "pcm16-24khz"`: format audio pasangan perintah. Gunakan
  `"g711-ulaw-8khz"` hanya untuk pasangan perintah lawas/kustom yang masih memancarkan
  audio telepon.
- `chrome.audioInputCommand`: perintah SoX yang membaca dari CoreAudio `BlackHole 2ch`
  dan menulis audio dalam `chrome.audioFormat`
- `chrome.audioOutputCommand`: perintah SoX yang membaca audio dalam `chrome.audioFormat`
  dan menulis ke CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime
  terhubung; tetapkan ke `""` untuk bergabung secara diam-diam
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

`voiceCall.enabled` default ke `true`; dengan transport Twilio, ini mendelegasikan
panggilan PSTN aktual dan DTMF ke Plugin Voice Call. Jika `voice-call` tidak
diaktifkan, Google Meet masih dapat memvalidasi dan merekam rencana panggilan, tetapi tidak dapat
melakukan panggilan Twilio.

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

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan
`transport: "chrome-node"` saat Chrome berjalan di node yang dipasangkan seperti VM
Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan
di host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan
`action: "speak"` dengan `sessionId` dan `message` agar agen realtime langsung
berbicara. Gunakan `action: "test_speech"` untuk membuat atau menggunakan kembali sesi,
memicu frasa yang diketahui, dan mengembalikan kesehatan `inCall` saat host Chrome dapat
melaporkannya. `test_speech` selalu memaksa `mode: "realtime"` dan gagal jika diminta
berjalan dalam `mode: "transcribe"` karena sesi hanya-observasi secara sengaja tidak dapat
mengeluarkan ucapan. Hasil `speechOutputVerified` didasarkan pada byte output audio realtime
yang meningkat selama panggilan pengujian ini, sehingga sesi yang digunakan kembali dengan audio lama
tidak dihitung sebagai pemeriksaan ucapan baru yang berhasil. Gunakan `action: "leave"` untuk menandai
sesi telah berakhir.

`status` menyertakan kesehatan Chrome saat tersedia:

- `inCall`: Chrome tampaknya berada di dalam panggilan Meet
- `micMuted`: status mikrofon Meet secara upaya terbaik
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  browser memerlukan login manual, penerimaan oleh host Meet, izin, atau
  perbaikan kontrol browser sebelum ucapan dapat berfungsi
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: apakah
  ucapan Chrome terkelola diizinkan saat ini. `speechReady: false` berarti OpenClaw tidak
  mengirim frasa intro/pengujian ke bridge audio.
- `providerConnected` / `realtimeReady`: status bridge suara realtime
- `lastInputAt` / `lastOutputAt`: audio terakhir yang terlihat dari atau dikirim ke bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara langsung. Penyedia suara realtime
mendengar audio rapat dan berbicara melalui bridge audio yang dikonfigurasi.
Saat model realtime memerlukan penalaran lebih dalam, informasi terkini, atau alat
OpenClaw normal, model dapat memanggil `openclaw_agent_consult`.

Alat konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks
transkrip rapat terbaru dan mengembalikan jawaban lisan ringkas ke sesi suara
realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke rapat.
Ini menggunakan alat konsultasi realtime bersama yang sama dengan Voice Call.

Secara default, konsultasi berjalan terhadap agen `main`. Atur `realtime.agentId` saat
lane Meet harus berkonsultasi dengan workspace agen OpenClaw khusus, default model,
kebijakan alat, memori, dan riwayat sesi.

`realtime.toolPolicy` mengontrol proses konsultasi:

- `safe-read-only`: mengekspos alat konsultasi dan membatasi agen reguler ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: mengekspos alat konsultasi dan membiarkan agen reguler menggunakan kebijakan
  alat agen normal.
- `none`: jangan mengekspos alat konsultasi ke model suara realtime.

Kunci sesi konsultasi diberi cakupan per sesi Meet, sehingga panggilan konsultasi lanjutan
dapat menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

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
- `googlemeet setup` menyertakan `chrome-node-connected` saat Chrome-node adalah
  transport default atau node dipasangi pin.
- `nodes status` menampilkan node yang dipilih terhubung.
- Node yang dipilih mengiklankan `googlemeet.chrome` dan `browser.proxy`.
- Tab Meet bergabung ke panggilan dan `test-speech` mengembalikan kesehatan Chrome dengan
  `inCall: true`.

Untuk host Chrome jarak jauh seperti VM macOS Parallels, ini adalah pemeriksaan aman
terpendek setelah memperbarui Gateway atau VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Itu membuktikan Plugin Gateway dimuat, node VM terhubung dengan token
saat ini, dan bridge audio Meet tersedia sebelum agen membuka tab rapat
nyata.

Untuk smoke Twilio, gunakan rapat yang mengekspos detail panggilan masuk telepon:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Status Twilio yang diharapkan:

- `googlemeet setup` menyertakan pemeriksaan `twilio-voice-call-plugin` dan
  `twilio-voice-call-credentials` hijau.
- `voicecall` tersedia di CLI setelah Gateway dimuat ulang.
- Sesi yang dikembalikan memiliki `transport: "twilio"` dan `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` menutup panggilan suara yang didelegasikan.

## Pemecahan Masalah

### Agen tidak dapat melihat alat Google Meet

Pastikan Plugin diaktifkan dalam konfigurasi Gateway dan muat ulang Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jika Anda baru saja mengedit `plugins.entries.google-meet`, mulai ulang atau muat ulang Gateway.
Agen yang sedang berjalan hanya melihat alat Plugin yang didaftarkan oleh proses Gateway
saat ini.

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
`gateway token mismatch`, instal ulang atau mulai ulang node dengan token Gateway
saat ini. Untuk Gateway LAN, ini biasanya berarti:

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

Jalankan `googlemeet test-speech` dan periksa kesehatan Chrome yang dikembalikan. Jika itu
melaporkan `manualActionRequired: true`, tampilkan `manualActionMessage` kepada operator
dan berhenti mencoba lagi hingga tindakan browser selesai.

Tindakan manual umum:

- Masuk ke profil Chrome.
- Terima tamu dari akun host Meet.
- Berikan izin mikrofon/kamera Chrome saat prompt izin native Chrome
  muncul.
- Tutup atau perbaiki dialog izin Meet yang macet.

Jangan laporkan "not signed in" hanya karena Meet menampilkan "Do you want people to
hear you in the meeting?" Itu adalah interstisial pilihan audio Meet; OpenClaw
mengklik **Use microphone** melalui otomatisasi browser saat tersedia dan tetap
menunggu status rapat yang sebenarnya. Untuk fallback browser khusus-buat, OpenClaw
dapat mengklik **Continue without microphone** karena pembuatan URL tidak memerlukan
jalur audio realtime.

### Pembuatan rapat gagal

`googlemeet create` pertama-tama menggunakan endpoint Google Meet API `spaces.create`
saat kredensial OAuth dikonfigurasi. Tanpa kredensial OAuth, perintah ini fallback
ke browser node Chrome yang dipasangi pin. Pastikan:

- Untuk pembuatan API: `oauth.clientId` dan `oauth.refreshToken` dikonfigurasi,
  atau variabel lingkungan `OPENCLAW_GOOGLE_MEET_*` yang cocok tersedia.
- Untuk pembuatan API: refresh token dibuat setelah dukungan pembuatan
  ditambahkan. Token lama mungkin tidak memiliki scope `meetings.space.created`; jalankan ulang
  `openclaw googlemeet auth login --json` dan perbarui konfigurasi Plugin.
- Untuk fallback browser: `defaultTransport: "chrome-node"` dan
  `chromeNode.node` menunjuk ke node terhubung dengan `browser.proxy` dan
  `googlemeet.chrome`.
- Untuk fallback browser: profil Chrome OpenClaw pada node tersebut masuk
  ke Google dan dapat membuka `https://meet.google.com/new`.
- Untuk fallback browser: percobaan ulang menggunakan kembali tab
  `https://meet.google.com/new` atau prompt akun Google yang sudah ada sebelum membuka tab baru. Jika agen mengalami timeout,
  coba ulang panggilan alat daripada membuka tab Meet lain secara manual.
- Untuk fallback browser: jika alat mengembalikan `manualActionRequired: true`, gunakan
  `browser.nodeId`, `browser.targetId`, `browserUrl`, dan
  `manualActionMessage` yang dikembalikan untuk memandu operator. Jangan mencoba ulang dalam loop hingga tindakan itu
  selesai.
- Untuk fallback browser: jika Meet menampilkan "Do you want people to hear you in the
  meeting?", biarkan tab tetap terbuka. OpenClaw harus mengklik **Use microphone** atau, untuk
  fallback khusus-buat, **Continue without microphone** melalui otomatisasi browser
  dan terus menunggu URL Meet yang dihasilkan. Jika tidak bisa, kesalahan harus menyebut
  `meet-audio-choice-required`, bukan `google-login-required`.

### Agen bergabung tetapi tidak berbicara

Periksa jalur realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gunakan `mode: "realtime"` untuk mendengarkan/berbicara balik. `mode: "transcribe"` secara sengaja
tidak memulai bridge suara realtime dupleks. `googlemeet test-speech`
selalu memeriksa jalur realtime dan melaporkan apakah byte output bridge
teramati untuk invokasi tersebut. Jika `speechOutputVerified` false dan
`speechOutputTimedOut` true, penyedia realtime mungkin telah menerima
ucapan tetapi OpenClaw tidak melihat byte output baru mencapai bridge audio
Chrome.

Verifikasi juga:

- Kunci penyedia realtime tersedia di host Gateway, seperti
  `OPENAI_API_KEY` atau `GEMINI_API_KEY`.
- `BlackHole 2ch` terlihat pada host Chrome.
- `sox` ada pada host Chrome.
- Mikrofon dan speaker Meet dirutekan melalui jalur audio virtual yang digunakan oleh
  OpenClaw.

`googlemeet doctor [session-id]` mencetak sesi, node, status dalam panggilan,
alasan tindakan manual, koneksi penyedia realtime, `realtimeReady`, aktivitas
input/output audio, timestamp audio terakhir, penghitung byte, dan URL browser.
Gunakan `googlemeet status [session-id]` saat Anda memerlukan JSON mentah. Gunakan
`googlemeet doctor --oauth` saat Anda perlu memverifikasi refresh OAuth Google Meet
tanpa mengekspos token; tambahkan `--meeting` atau `--create-space` saat Anda juga memerlukan
bukti Google Meet API.

Jika agen mengalami timeout dan Anda dapat melihat tab Meet sudah terbuka, periksa tab itu
tanpa membuka tab lain:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Tindakan alat yang setara adalah `recover_current_tab`. Ini memfokuskan dan memeriksa
tab Meet yang ada untuk transport yang dipilih. Dengan `chrome`, ini menggunakan kontrol
browser lokal melalui Gateway; dengan `chrome-node`, ini menggunakan node Chrome yang dikonfigurasi.
Ini tidak membuka tab baru atau membuat sesi baru; ini melaporkan
pemblokir saat ini, seperti login, penerimaan, izin, atau status pilihan audio.
Perintah CLI berbicara dengan Gateway yang dikonfigurasi, sehingga Gateway harus berjalan;
`chrome-node` juga memerlukan node Chrome untuk terhubung.

### Pemeriksaan pengaturan Twilio gagal

`twilio-voice-call-plugin` gagal saat `voice-call` tidak diizinkan atau tidak diaktifkan.
Tambahkan ke `plugins.allow`, aktifkan `plugins.entries.voice-call`, lalu muat ulang
Gateway.

`twilio-voice-call-credentials` gagal saat backend Twilio tidak memiliki SID akun,
token auth, atau nomor pemanggil. Atur ini di host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Lalu mulai ulang atau muat ulang Gateway dan jalankan:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` secara bawaan hanya memeriksa kesiapan. Untuk melakukan uji coba tanpa menjalankan pada nomor tertentu:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Hanya tambahkan `--yes` saat Anda memang ingin melakukan panggilan notifikasi
keluar secara langsung:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat

Pastikan acara Meet menampilkan detail panggilan masuk telepon. Berikan nomor
panggilan masuk dan PIN persisnya atau urutan DTMF khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gunakan awalan `w` atau koma di `--dtmf-sequence` jika penyedia membutuhkan jeda
sebelum memasukkan PIN.

## Catatan

API media resmi Google Meet berorientasi penerimaan, sehingga berbicara ke dalam
panggilan Meet tetap membutuhkan jalur peserta. Plugin ini membuat batas tersebut
tetap terlihat: Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani
partisipasi panggilan masuk telepon.

Mode waktu nyata Chrome membutuhkan `BlackHole 2ch` ditambah salah satu dari:

- `chrome.audioInputCommand` ditambah `chrome.audioOutputCommand`: OpenClaw memiliki
  bridge model waktu nyata dan menyalurkan audio dalam `chrome.audioFormat` di antara
  perintah tersebut dan penyedia suara waktu nyata yang dipilih. Jalur Chrome bawaan adalah
  PCM16 24 kHz; G.711 mu-law 8 kHz tetap tersedia untuk pasangan perintah lama.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemonnya.

Untuk audio dupleks yang bersih, rutekan keluaran Meet dan mikrofon Meet melalui perangkat
virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat memantulkan peserta lain kembali ke panggilan.

`googlemeet speak` memicu bridge audio waktu nyata aktif untuk sesi Chrome.
`googlemeet leave` menghentikan bridge tersebut. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Plugin panggilan suara](/id/plugins/voice-call)
- [Mode bicara](/id/nodes/talk)
- [Membangun Plugin](/id/plugins/building-plugins)

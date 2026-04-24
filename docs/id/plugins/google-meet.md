---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda sedang mengonfigurasi Chrome, Node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:18:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Dukungan peserta Google Meet untuk OpenClaw.

Plugin ini sengaja dibuat eksplisit:

- Plugin ini hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali ke agen OpenClaw penuh saat diperlukan
  reasoning atau tool yang lebih mendalam.
- Auth dimulai sebagai OAuth Google pribadi atau profil Chrome yang sudah login.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau pada host Node yang dipasangkan.
- Twilio menerima nomor dial-in ditambah PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur kerja
  telekonferensi agen yang lebih luas.

## Mulai cepat

Instal dependensi audio lokal dan pastikan provider realtime dapat menggunakan
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch`. Installer
Homebrew memerlukan reboot sebelum macOS mengekspos perangkat tersebut:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua komponen:

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

Bergabung ke rapat:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Atau biarkan agen bergabung melalui tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome bergabung sebagai profil Chrome yang sudah login. Di Meet, pilih `BlackHole 2ch` untuk
jalur mikrofon/speaker yang digunakan oleh OpenClaw. Untuk audio duplex yang bersih, gunakan
perangkat virtual terpisah atau graph bergaya Loopback; satu perangkat BlackHole saja
cukup untuk smoke test awal tetapi dapat menimbulkan echo.

### Gateway lokal + Chrome Parallels

Anda **tidak** memerlukan Gateway OpenClaw penuh atau API key model di dalam VM macOS
hanya agar VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu jalankan
host Node di VM. Aktifkan Plugin bawaan di VM sekali agar Node
mengiklankan perintah Chrome:

Apa yang berjalan di mana:

- Host Gateway: Gateway OpenClaw, workspace agen, API key model, provider realtime,
  dan konfigurasi Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  dan profil Chrome yang sudah login ke Google.
- Tidak diperlukan di VM: service Gateway, konfigurasi agen, key OpenAI/GPT, atau penyiapan
  provider model.

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
WebSocket plaintext kecuali Anda opt-in untuk jaringan privat tepercaya tersebut:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan variabel environment yang sama saat menginstal Node sebagai LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah environment proses, bukan
pengaturan `openclaw.json`. `openclaw node install` menyimpannya dalam environment
LaunchAgent saat variabel itu ada pada perintah install.

Setujui Node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pastikan Gateway melihat Node dan Node tersebut mengiklankan `googlemeet.chrome`:

```bash
openclaw nodes status
```

Rutekan Meet melalui Node tersebut pada host Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Sekarang bergabunglah seperti biasa dari host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

atau minta agen menggunakan tool `google_meet` dengan `transport: "chrome-node"`.

Jika `chromeNode.node` dihilangkan, OpenClaw memilih otomatis hanya jika tepat satu
Node yang terhubung mengiklankan `googlemeet.chrome`. Jika beberapa Node yang mampu
terhubung, setel `chromeNode.node` ke id Node, display name, atau IP remote.

Pemeriksaan kegagalan umum:

- `No connected Google Meet-capable node`: mulai `openclaw node run` di VM,
  setujui pairing, dan pastikan `openclaw plugins enable google-meet` telah dijalankan
  di VM. Pastikan juga host Gateway mengizinkan perintah Node dengan
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch`
  di VM dan reboot VM.
- Chrome terbuka tetapi tidak dapat bergabung: login ke Chrome di dalam VM dan pastikan
  profil tersebut dapat bergabung ke URL Meet secara manual.
- Tidak ada audio: di Meet, rutekan mikrofon/speaker melalui jalur perangkat audio virtual
  yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau routing bergaya Loopback
  untuk duplex yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua tool eksternal:

- `sox`: utilitas audio command-line. Plugin ini menggunakan perintah `rec` dan `play`
  untuk bridge audio default 8 kHz G.711 mu-law.
- `blackhole-2ch`: driver audio virtual macOS. Driver ini membuat perangkat audio `BlackHole 2ch`
  yang dapat dirutekan oleh Chrome/Meet.

OpenClaw tidak membundel atau mendistribusikan ulang salah satu paket tersebut. Dokumen ini meminta pengguna
menginstalnya sebagai dependensi host melalui Homebrew. SoX berlisensi
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole berlisensi GPL-3.0. Jika Anda membangun
installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi
upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transports

### Chrome

Transport Chrome membuka URL Meet di Google Chrome dan bergabung sebagai profil
Chrome yang sudah login. Di macOS, Plugin memeriksa `BlackHole 2ch` sebelum peluncuran.
Jika dikonfigurasi, Plugin juga menjalankan perintah health bridge audio dan perintah startup
sebelum membuka Chrome. Gunakan `chrome` saat Chrome/audio berada di host Gateway;
gunakan `chrome-node` saat Chrome/audio berada di Node yang dipasangkan seperti VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Rutekan audio mikrofon dan speaker Chrome melalui bridge audio OpenClaw lokal.
Jika `BlackHole 2ch` tidak terinstal, proses join gagal dengan error penyiapan
alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah dial plan ketat yang didelegasikan ke Plugin Voice Call. Transport ini
tidak mem-parse halaman Meet untuk nomor telepon.

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

Akses Google Meet Media API menggunakan klien OAuth pribadi terlebih dahulu. Konfigurasikan
`oauth.clientId` dan opsional `oauth.clientSecret`, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah ini mencetak blok konfigurasi `oauth` dengan refresh token. Perintah ini menggunakan PKCE,
callback localhost pada `http://localhost:8085/oauth2callback`, dan alur
copy/paste manual dengan `--manual`.

Variabel environment berikut diterima sebagai fallback:

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

Setel `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi project Cloud, principal OAuth, dan peserta rapat Anda terdaftar dalam Google Workspace Developer Preview Program untuk Meet media APIs.

## Konfigurasi

Jalur realtime Chrome yang umum hanya memerlukan Plugin diaktifkan, BlackHole, SoX,
dan key OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Setel konfigurasi Plugin di bawah `plugins.entries.google-meet.config`:

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
- `chrome.audioInputCommand`: perintah SoX `rec` yang menulis audio
  8 kHz G.711 mu-law ke stdout
- `chrome.audioOutputCommand`: perintah SoX `play` yang membaca audio
  8 kHz G.711 mu-law dari stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan
  `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat bridge realtime
  terhubung; setel ke `""` untuk bergabung secara senyap

Override opsional:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan
`transport: "chrome-node"` saat Chrome berjalan pada Node yang dipasangkan seperti VM
Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan di
host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk menampilkan sesi aktif atau memeriksa id sesi. Gunakan
`action: "speak"` dengan `sessionId` dan `message` untuk membuat agen realtime
langsung berbicara. Gunakan `action: "leave"` untuk menandai sesi selesai.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara langsung. Provider suara realtime
mendengar audio rapat dan berbicara melalui bridge audio yang dikonfigurasi.
Saat model realtime memerlukan reasoning yang lebih mendalam, informasi terkini, atau
tool OpenClaw normal, model dapat memanggil `openclaw_agent_consult`.

Tool consult menjalankan agen OpenClaw biasa di belakang layar dengan konteks
transkrip rapat terbaru dan mengembalikan jawaban lisan singkat ke sesi suara
realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke dalam rapat.

`realtime.toolPolicy` mengontrol proses consult:

- `safe-read-only`: tampilkan tool consult dan batasi agen biasa ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: tampilkan tool consult dan biarkan agen biasa menggunakan kebijakan tool agen
  normal.
- `none`: jangan tampilkan tool consult ke model suara realtime.

Session key consult diberi cakupan per sesi Meet, sehingga pemanggilan consult lanjutan
dapat menggunakan kembali konteks consult sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome benar-benar bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Catatan

Media API resmi Google Meet berorientasi menerima, jadi berbicara ke dalam
panggilan Meet tetap memerlukan jalur peserta. Plugin ini menjaga batas itu tetap terlihat:
Chrome menangani partisipasi browser dan routing audio lokal; Twilio menangani
partisipasi dial-in telepon.

Mode realtime Chrome memerlukan salah satu dari:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki bridge model
  realtime dan menyalurkan audio 8 kHz G.711 mu-law di antara perintah-perintah
  tersebut dan provider suara realtime yang dipilih.
- `chrome.audioBridgeCommand`: perintah bridge eksternal memiliki seluruh jalur
  audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio duplex yang bersih, rutekan output Meet dan mikrofon Meet melalui
perangkat virtual yang terpisah atau graph perangkat virtual bergaya Loopback. Satu perangkat
BlackHole bersama dapat menyebabkan echo peserta lain kembali ke panggilan.

`googlemeet speak` memicu bridge audio realtime aktif untuk sesi Chrome.
`googlemeet leave` menghentikan bridge tersebut. Untuk sesi Twilio yang didelegasikan
melalui Plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Plugin Voice Call](/id/plugins/voice-call)
- [Mode Talk](/id/nodes/talk)
- [Membangun Plugins](/id/plugins/building-plugins)

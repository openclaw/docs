---
read_when:
    - Anda ingin agen OpenClaw bergabung ke panggilan Google Meet
    - Anda sedang mengonfigurasi Chrome, Node Chrome, atau Twilio sebagai transport Google Meet
summary: 'Plugin Google Meet: bergabung ke URL Meet eksplisit melalui Chrome atau Twilio dengan default suara realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T10:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (plugin)

Dukungan peserta Google Meet untuk OpenClaw.

Plugin ini sengaja dibuat eksplisit:

- Hanya bergabung ke URL `https://meet.google.com/...` yang eksplisit.
- Suara `realtime` adalah mode default.
- Suara realtime dapat memanggil kembali ke agen OpenClaw penuh saat penalaran yang lebih mendalam atau tool diperlukan.
- Autentikasi dimulai sebagai OAuth Google pribadi atau profil Chrome yang sudah masuk.
- Tidak ada pengumuman persetujuan otomatis.
- Backend audio Chrome default adalah `BlackHole 2ch`.
- Chrome dapat berjalan secara lokal atau di host Node yang dipasangkan.
- Twilio menerima nomor dial-in ditambah PIN opsional atau urutan DTMF.
- Perintah CLI adalah `googlemeet`; `meet` dicadangkan untuk alur konferensi telepon agen yang lebih luas.

## Memulai dengan cepat

Instal dependensi audio lokal dan konfigurasikan penyedia suara realtime backend.
OpenAI adalah default; Google Gemini Live juga berfungsi dengan
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# atau
export GEMINI_API_KEY=...
```

`blackhole-2ch` menginstal perangkat audio virtual `BlackHole 2ch`. Penginstal
Homebrew memerlukan reboot sebelum macOS menampilkan perangkat tersebut:

```bash
sudo reboot
```

Setelah reboot, verifikasi kedua bagian:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Chrome bergabung sebagai profil Chrome yang sedang masuk. Di Meet, pilih `BlackHole 2ch` untuk jalur mikrofon/speaker yang digunakan oleh OpenClaw. Untuk audio duplex yang bersih, gunakan perangkat virtual terpisah atau grafik bergaya Loopback; satu perangkat BlackHole saja cukup untuk pengujian asap awal, tetapi dapat menimbulkan gema.

### Gateway Lokal + Chrome Parallels

Anda **tidak** memerlukan OpenClaw Gateway penuh atau kunci API model di dalam VM macOS hanya agar VM memiliki Chrome. Jalankan Gateway dan agen secara lokal, lalu jalankan host node di VM. Aktifkan plugin bawaan di VM sekali agar node mengiklankan perintah Chrome:

Apa yang berjalan di mana:

- Host Gateway: OpenClaw Gateway, ruang kerja agen, kunci model/API, penyedia realtime, dan konfigurasi plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/host node, Google Chrome, SoX, BlackHole 2ch, dan profil Chrome yang masuk ke Google.
- Tidak diperlukan di VM: layanan Gateway, konfigurasi agen, kunci OpenAI/GPT, atau penyiapan penyedia model.

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

Instal atau perbarui OpenClaw di VM, lalu aktifkan plugin bawaan di sana:

```bash
openclaw plugins enable google-meet
```

Mulai host node di VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jika `<gateway-host>` adalah IP LAN dan Anda tidak menggunakan TLS, node menolak WebSocket plaintext kecuali Anda ikut serta untuk jaringan privat tepercaya tersebut:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gunakan variabel environment yang sama saat memasang node sebagai LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` adalah environment proses, bukan pengaturan `openclaw.json`. `openclaw node install` menyimpannya di environment LaunchAgent ketika variabel tersebut ada pada perintah instalasi.

Setujui node dari host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Konfirmasikan Gateway melihat node dan bahwa node tersebut mengiklankan `googlemeet.chrome`:

```bash
openclaw nodes status
```

Arahkan Meet melalui node tersebut di host Gateway:

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

Sekarang bergabung seperti biasa dari host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

atau minta agen menggunakan tool `google_meet` dengan `transport: "chrome-node"`.

Jika `chromeNode.node` dihilangkan, OpenClaw hanya memilih otomatis saat tepat satu node terhubung mengiklankan `googlemeet.chrome`. Jika beberapa node yang mampu terhubung, atur `chromeNode.node` ke id node, nama tampilan, atau IP jarak jauh.

Pemeriksaan kegagalan umum:

- `No connected Google Meet-capable node`: mulai `openclaw node run` di VM, setujui pemasangan, dan pastikan `openclaw plugins enable google-meet` telah dijalankan di VM. Konfirmasikan juga host Gateway mengizinkan perintah node dengan `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instal `blackhole-2ch` di VM dan reboot VM.
- Chrome terbuka tetapi tidak dapat bergabung: masuk ke Chrome di dalam VM dan konfirmasikan profil tersebut dapat bergabung ke URL Meet secara manual.
- Tidak ada audio: di Meet, arahkan mikrofon/speaker melalui jalur perangkat audio virtual yang digunakan oleh OpenClaw; gunakan perangkat virtual terpisah atau perutean bergaya Loopback untuk audio duplex yang bersih.

## Catatan instalasi

Default realtime Chrome menggunakan dua tool eksternal:

- `sox`: utilitas audio command-line. Plugin menggunakan perintah `rec` dan `play` untuk jembatan audio G.711 mu-law 8 kHz default.
- `blackhole-2ch`: driver audio virtual macOS. Driver ini membuat perangkat audio `BlackHole 2ch` yang dapat digunakan Chrome/Meet untuk perutean.

OpenClaw tidak membundel atau mendistribusikan ulang kedua paket tersebut. Dokumentasi meminta pengguna menginstalnya sebagai dependensi host melalui Homebrew. SoX dilisensikan sebagai `LGPL-2.0-only AND GPL-2.0-only`; BlackHole adalah GPL-3.0. Jika Anda membangun installer atau appliance yang membundel BlackHole dengan OpenClaw, tinjau ketentuan lisensi upstream BlackHole atau dapatkan lisensi terpisah dari Existential Audio.

## Transport

### Chrome

Transport Chrome membuka URL Meet di Google Chrome dan bergabung sebagai profil Chrome yang sedang masuk. Di macOS, plugin memeriksa `BlackHole 2ch` sebelum peluncuran. Jika dikonfigurasi, plugin juga menjalankan perintah pemeriksaan kesehatan jembatan audio dan perintah startup sebelum membuka Chrome. Gunakan `chrome` saat Chrome/audio berjalan di host Gateway; gunakan `chrome-node` saat Chrome/audio berjalan di node yang dipasangkan seperti VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Arahkan audio mikrofon dan speaker Chrome melalui jembatan audio OpenClaw lokal. Jika `BlackHole 2ch` tidak terinstal, proses bergabung gagal dengan galat penyiapan alih-alih diam-diam bergabung tanpa jalur audio.

### Twilio

Transport Twilio adalah rencana panggilan ketat yang didelegasikan ke plugin Voice Call. Transport ini tidak mengurai halaman Meet untuk nomor telepon.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gunakan `--dtmf-sequence` ketika rapat memerlukan urutan khusus:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth dan preflight

Akses Google Meet Media API menggunakan klien OAuth pribadi terlebih dahulu. Konfigurasikan `oauth.clientId` dan secara opsional `oauth.clientSecret`, lalu jalankan:

```bash
openclaw googlemeet auth login --json
```

Perintah tersebut mencetak blok konfigurasi `oauth` dengan refresh token. Perintah ini menggunakan PKCE, callback localhost pada `http://localhost:8085/oauth2callback`, dan alur salin/tempel manual dengan `--manual`.

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

Atur `preview.enrollmentAcknowledged: true` hanya setelah mengonfirmasi project Cloud Anda, principal OAuth, dan peserta rapat terdaftar dalam Google Workspace Developer Preview Program untuk Meet media APIs.

## Konfigurasi

Jalur realtime Chrome umum hanya memerlukan plugin diaktifkan, BlackHole, SoX, dan kunci penyedia suara realtime backend. OpenAI adalah default; atur `realtime.provider: "google"` untuk menggunakan Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# atau
export GEMINI_API_KEY=...
```

Atur konfigurasi plugin di bawah `plugins.entries.google-meet.config`:

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
- `chrome.audioInputCommand`: perintah SoX `rec` yang menulis audio G.711 mu-law 8 kHz ke stdout
- `chrome.audioOutputCommand`: perintah SoX `play` yang membaca audio G.711 mu-law 8 kHz dari stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: balasan lisan singkat, dengan `openclaw_agent_consult` untuk jawaban yang lebih mendalam
- `realtime.introMessage`: pemeriksaan kesiapan lisan singkat saat jembatan realtime terhubung; atur ke `""` untuk bergabung tanpa suara

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

Gunakan `transport: "chrome"` saat Chrome berjalan di host Gateway. Gunakan `transport: "chrome-node"` saat Chrome berjalan di node yang dipasangkan seperti VM Parallels. Dalam kedua kasus, model realtime dan `openclaw_agent_consult` berjalan di host Gateway, sehingga kredensial model tetap berada di sana.

Gunakan `action: "status"` untuk mencantumkan sesi aktif atau memeriksa ID sesi. Gunakan `action: "speak"` dengan `sessionId` dan `message` agar agen realtime segera berbicara. Gunakan `action: "leave"` untuk menandai sesi telah berakhir.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultasi agen realtime

Mode realtime Chrome dioptimalkan untuk loop suara langsung. Penyedia suara realtime mendengar audio rapat dan berbicara melalui jembatan audio yang dikonfigurasi. Saat model realtime memerlukan penalaran yang lebih mendalam, informasi terkini, atau tool OpenClaw normal, model tersebut dapat memanggil `openclaw_agent_consult`.

Tool konsultasi menjalankan agen OpenClaw reguler di balik layar dengan konteks transkrip rapat terbaru dan mengembalikan jawaban lisan singkat ke sesi suara realtime. Model suara kemudian dapat mengucapkan jawaban itu kembali ke dalam rapat.

`realtime.toolPolicy` mengontrol proses konsultasi:

- `safe-read-only`: tampilkan tool konsultasi dan batasi agen reguler ke
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan
  `memory_get`.
- `owner`: tampilkan tool konsultasi dan izinkan agen reguler menggunakan
  kebijakan tool agen normal.
- `none`: jangan tampilkan tool konsultasi ke model suara realtime.

Kunci sesi konsultasi dicakup per sesi Meet, sehingga panggilan konsultasi lanjutan dapat menggunakan kembali konteks konsultasi sebelumnya selama rapat yang sama.

Untuk memaksa pemeriksaan kesiapan lisan setelah Chrome sepenuhnya bergabung ke panggilan:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Catatan

Media API resmi Google Meet berorientasi pada penerimaan, jadi berbicara ke dalam panggilan Meet tetap memerlukan jalur peserta. Plugin ini menjaga batas itu tetap terlihat: Chrome menangani partisipasi browser dan perutean audio lokal; Twilio menangani partisipasi dial-in telepon.

Mode realtime Chrome memerlukan salah satu dari berikut ini:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw memiliki jembatan model realtime dan menyalurkan audio G.711 mu-law 8 kHz antara perintah-perintah tersebut dan penyedia suara realtime yang dipilih.
- `chrome.audioBridgeCommand`: perintah jembatan eksternal memiliki seluruh jalur audio lokal dan harus keluar setelah memulai atau memvalidasi daemon-nya.

Untuk audio duplex yang bersih, arahkan output Meet dan mikrofon Meet melalui perangkat virtual terpisah atau grafik perangkat virtual bergaya Loopback. Satu perangkat BlackHole bersama dapat menggaungkan peserta lain kembali ke dalam panggilan.

`googlemeet speak` memicu jembatan audio realtime aktif untuk sesi Chrome. `googlemeet leave` menghentikan jembatan tersebut. Untuk sesi Twilio yang didelegasikan melalui plugin Voice Call, `leave` juga menutup panggilan suara yang mendasarinya.

## Terkait

- [Plugin Voice Call](/id/plugins/voice-call)
- [Mode Talk](/id/nodes/talk)
- [Membangun plugin](/id/plugins/building-plugins)

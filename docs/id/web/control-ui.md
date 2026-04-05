---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa tunnel SSH
summary: UI kontrol berbasis browser untuk Gateway (chat, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-04-05T14:10:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# UI Kontrol (browser)

UI Kontrol adalah aplikasi halaman tunggal kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefix opsional: tetapkan `gateway.controlUi.basePath` (misalnya `/openclaw`)

UI ini berbicara **langsung ke WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Autentikasi disuplai selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini
dan URL gateway yang dipilih; password tidak dipersistenkan. Onboarding biasanya
menghasilkan token gateway untuk autentikasi shared-secret pada koneksi pertama, tetapi
autentikasi password juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway
memerlukan **persetujuan pairing satu kali** — bahkan jika Anda berada di Tailnet yang sama
dengan `gateway.auth.allowTailscale: true`. Ini adalah langkah keamanan untuk mencegah
akses tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

**Untuk menyetujui perangkat:**

```bash
# Daftar permintaan yang tertunda
openclaw devices list

# Setujui berdasarkan ID permintaan
openclaw devices approve <requestId>
```

Jika browser mencoba pairing ulang dengan detail autentikasi yang berubah (role/scopes/public
key), permintaan tertunda sebelumnya akan digantikan dan `requestId` baru
dibuat. Jalankan ulang `openclaw devices list` sebelum menyetujui.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali
Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat
[Devices CLI](/cli/devices) untuk rotasi token dan pencabutan.

**Catatan:**

- Koneksi browser loopback lokal langsung (`127.0.0.1` / `localhost`) akan
  disetujui otomatis.
- Koneksi browser Tailnet dan LAN tetap memerlukan persetujuan eksplisit, bahkan saat
  berasal dari mesin yang sama.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berpindah browser atau
  menghapus data browser akan memerlukan pairing ulang.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya sendiri saat pemuatan pertama berdasarkan lokal browser Anda, dan Anda dapat menimpanya nanti dari pemilih bahasa di kartu Access.

- Lokal yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Lokal yang dipilih disimpan di storage browser dan digunakan kembali pada kunjungan mendatang.
- Key terjemahan yang hilang akan fallback ke bahasa Inggris.

## Yang dapat dilakukan (saat ini)

- Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Stream panggilan tool + kartu output tool langsung di Chat (peristiwa agen)
- Channel: status channel bawaan plus channel plugin bawaan/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`)
- Instance: daftar presence + refresh (`system-presence`)
- Sesi: daftar + override model/thinking/fast/verbose/reasoning per sesi (`sessions.list`, `sessions.patch`)
- Pekerjaan cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat run (`cron.*`)
- Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`)
- Node: daftar + kapabilitas (`node.list`)
- Persetujuan exec: edit allowlist gateway atau node + kebijakan ask untuk `exec host=gateway/node` (`exec.approvals.*`)
- Konfigurasi: lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Konfigurasi: terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir
- Penulisan konfigurasi menyertakan penjaga base-hash untuk mencegah penimpaan edit yang bersamaan
- Penulisan konfigurasi (`config.set`/`config.apply`/`config.patch`) juga melakukan preflight resolusi SecretRef aktif untuk referensi dalam payload konfigurasi yang dikirim; referensi aktif yang tidak terurai dalam payload yang dikirim ditolak sebelum penulisan
- Skema konfigurasi + perenderan formulir (`config.schema` / `config.schema.lookup`,
  termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung,
  metadata dokumen pada node objek/wildcard/array/composition bertingkat,
  plus skema plugin + channel saat tersedia); editor JSON Raw
  hanya tersedia saat snapshot memiliki round-trip raw yang aman
- Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, UI Kontrol memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut
- Nilai objek SecretRef terstruktur dirender hanya-baca di input teks formulir untuk mencegah kerusakan tidak sengaja dari objek menjadi string
- Debug: snapshot status/health/models + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`)
- Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`)
- Update: jalankan update package/git + restart (`update.run`) dengan laporan restart

Catatan panel pekerjaan cron:

- Untuk pekerjaan terisolasi, pengiriman default adalah mengumumkan ringkasan. Anda dapat mengubahnya ke none jika ingin run internal saja.
- Field channel/target muncul saat announce dipilih.
- Mode webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
- Untuk pekerjaan sesi utama, mode pengiriman webhook dan none tersedia.
- Kontrol edit lanjutan mencakup delete-after-run, hapus override agen, opsi cron exact/stagger,
  override model/thinking agen, dan toggle pengiriman best-effort.
- Validasi formulir bersifat inline dengan kesalahan per field; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
- Tetapkan `cron.webhookToken` untuk mengirim token bearer khusus, jika dihilangkan webhook dikirim tanpa header auth.
- Fallback deprecated: pekerjaan lama yang tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

## Perilaku chat

- `chat.send` **non-blocking**: langsung mengakui dengan `{ runId, status: "started" }` dan respons di-stream melalui peristiwa `chat`.
- Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
- Respons `chat.history` dibatasi ukurannya demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
- `chat.history` juga menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan tool dalam teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang terpotong), serta menghilangkan token kontrol model ASCII/full-width yang bocor, dan mengabaikan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
- `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa run agen, tanpa pengiriman channel).
- Pemilih model dan thinking di header chat langsung mem-patch sesi aktif melalui `sessions.patch`; ini adalah override sesi yang persisten, bukan opsi pengiriman sekali putaran.
- Stop:
  - Klik **Stop** (memanggil `chat.abort`)
  - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk abort di luar band
  - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut
- Retensi parsial saat abort:
  - Saat run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI
  - Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output yang dibuffer ada
  - Entri yang dipersistenkan menyertakan metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal

## Akses Tailnet (direkomendasikan)

### Tailscale Serve terintegrasi (disarankan)

Biarkan Gateway tetap di loopback dan biarkan Tailscale Serve memproksikannya dengan HTTPS:

```bash
openclaw gateway --tailscale serve
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Secara default, permintaan Serve UI Kontrol/WebSocket dapat diautentikasi melalui header identitas Tailscale
(`tailscale-user-login`) saat `gateway.auth.allowTailscale` adalah `true`. OpenClaw
memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan
`tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat
permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Tetapkan
`gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit
bahkan untuk lalu lintas Serve. Lalu gunakan `gateway.auth.mode: "token"` atau
`"password"`.
Untuk jalur identitas Serve async itu, percobaan autentikasi yang gagal untuk IP klien
dan cakupan auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan buruk bersamaan
dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua
alih-alih dua ketidakcocokan biasa yang berpacu secara paralel.
Autentikasi Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
dapat berjalan pada host tersebut, wajibkan autentikasi token/password.

### Bind ke tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Lalu buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Tempel shared secret yang cocok ke pengaturan UI (dikirim sebagai
`connect.params.auth.token` atau `connect.params.auth.password`).

## HTTP tidak aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`),
browser berjalan dalam **konteks non-aman** dan memblokir WebCrypto. Secara default,
OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi UI Kontrol operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host gateway)

**Perilaku toggle insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` hanyalah toggle kompatibilitas lokal:

- Ini memungkinkan sesi UI Kontrol localhost berlanjut tanpa identitas perangkat dalam
  konteks HTTP non-aman.
- Ini tidak melewati pemeriksaan pairing.
- Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

**Hanya break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat UI Kontrol dan merupakan
penurunan keamanan yang berat. Kembalikan dengan cepat setelah penggunaan darurat.

Catatan trusted-proxy:

- autentikasi trusted-proxy yang berhasil dapat mengizinkan sesi UI Kontrol **operator** tanpa
  identitas perangkat
- ini **tidak** berlaku untuk sesi UI Kontrol role node
- reverse proxy loopback host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat
  [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build # otomatis menginstal dependensi UI saat pertama kali dijalankan
```

Base absolut opsional (saat Anda ingin URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev # otomatis menginstal dependensi UI saat pertama kali dijalankan
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/testing: server dev + Gateway jarak jauh

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan bisa
berbeda dari origin HTTP. Ini berguna saat Anda ingin server dev Vite
secara lokal tetapi Gateway berjalan di tempat lain.

1. Jalankan server dev UI: `pnpm ui:dev`
2. Buka URL seperti:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autentikasi satu kali opsional (jika diperlukan):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Catatan:

- `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
- `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter query lama `?token=` masih diimpor sekali demi kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
- `password` hanya disimpan di memori.
- Saat `gatewayUrl` ditetapkan, UI tidak fallback ke konfigurasi atau kredensial lingkungan.
  Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang tidak ada adalah kesalahan.
- Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
- `gatewayUrl` hanya diterima di jendela tingkat atas (bukan tertanam) untuk mencegah clickjacking.
- Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Ini termasuk penyiapan dev jarak jauh.
- Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal
  yang sangat terkontrol. Artinya mengizinkan origin browser apa pun, bukan “cocokkan host apa pun yang sedang saya
  gunakan.”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin Host-header, tetapi ini adalah mode keamanan yang berbahaya.

Contoh:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detail penyiapan akses jarak jauh: [Akses jarak jauh](/id/gateway/remote).

## Terkait

- [Dashboard](/web/dashboard) — dasbor gateway
- [WebChat](/web/webchat) — antarmuka chat berbasis browser
- [TUI](/web/tui) — antarmuka pengguna terminal
- [Health Checks](/id/gateway/health) — pemantauan kesehatan gateway

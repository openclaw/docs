---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
summary: Control UI berbasis browser untuk Gateway (chat, node, konfigurasi)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:34:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UI adalah aplikasi single-page **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: tetapkan `gateway.controlUi.basePath` (misalnya `/openclaw`)

UI ini berbicara **langsung ke WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

Auth disuplai selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- Header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini
dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya
menghasilkan token gateway untuk auth shared-secret pada koneksi pertama, tetapi
auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway
memerlukan **persetujuan pairing satu kali** — bahkan jika Anda berada di Tailnet yang sama
dengan `gateway.auth.allowTailscale: true`. Ini adalah langkah keamanan untuk mencegah
akses tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

**Untuk menyetujui perangkat:**

```bash
# Daftar permintaan tertunda
openclaw devices list

# Setujui berdasarkan ID permintaan
openclaw devices approve <requestId>
```

Jika browser mencoba pairing ulang dengan detail auth yang berubah (role/scopes/public
key), permintaan tertunda sebelumnya akan digantikan dan `requestId` baru akan
dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca ke
akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan
koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas,
dan meminta Anda menyetujui set scope baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali
Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat
[CLI Devices](/id/cli/devices) untuk rotasi token dan pencabutan.

**Catatan:**

- Koneksi browser loopback lokal langsung (`127.0.0.1` / `localhost`) akan
  disetujui otomatis.
- Koneksi browser Tailnet dan LAN tetap memerlukan persetujuan eksplisit, bahkan saat
  berasal dari mesin yang sama.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berpindah browser atau
  membersihkan data browser akan memerlukan pairing ulang.

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan
avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Ini
berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak
disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata
kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Membersihkan data situs atau
berpindah browser akan meresetnya menjadi kosong.

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari
`/__openclaw/control-ui-config.json`. Endpoint itu dikendalikan oleh auth gateway yang sama
seperti seluruh surface HTTP lainnya: browser yang tidak terautentikasi tidak dapat
mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid,
identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya sendiri pada muatan pertama berdasarkan locale browser Anda.
Untuk menggantinya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih
locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Terjemahan non-Inggris di-load secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

## Yang dapat dilakukannya (saat ini)

- Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Berbicara ke OpenAI Realtime langsung dari browser melalui WebRTC. Gateway
  mencetak secret klien Realtime berumur pendek dengan `talk.realtime.session`; browser
  mengirim audio mikrofon langsung ke OpenAI dan meneruskan panggilan alat
  `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw
  terkonfigurasi yang lebih besar.
- Stream pemanggilan alat + kartu output alat live di Chat (peristiwa agen)
- Channel: status channel bawaan plus Plugin bundel/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`)
- Instance: daftar presence + refresh (`system-presence`)
- Sesi: daftar + override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`)
- Dreams: status Dreaming, tombol aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat run (`cron.*`)
- Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`)
- Node: daftar + caps (`node.list`)
- Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`)
- Konfigurasi: lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Konfigurasi: terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir
- Penulisan konfigurasi menyertakan penjaga base-hash untuk mencegah concurrent edit tertimpa
- Penulisan konfigurasi (`config.set`/`config.apply`/`config.patch`) juga melakukan preflight terhadap resolusi SecretRef aktif untuk ref di payload konfigurasi yang dikirim; ref aktif yang belum ter-resolve di payload yang dikirim ditolak sebelum penulisan
- Skema konfigurasi + rendering formulir (`config.schema` / `config.schema.lookup`,
  termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child
  langsung, metadata dokumen pada node nested object/wildcard/array/composition,
  plus skema Plugin + channel saat tersedia); editor Raw JSON
  hanya tersedia saat snapshot memiliki raw round-trip yang aman
- Jika snapshot tidak dapat melakukan raw round-trip dengan aman, Control UI memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut
- Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis raw (formatting, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan saat reset ketika snapshot dapat melakukan raw round-trip dengan aman
- Nilai object SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah kerusakan object-ke-string yang tidak disengaja
- Debug: snapshot status/health/models + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`)
- Log: tail live log file gateway dengan filter/ekspor (`logs.tail`)
- Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart

Catatan panel job Cron:

- Untuk job terisolasi, pengiriman default adalah mengumumkan ringkasan. Anda dapat menggantinya ke none jika ingin run internal saja.
- Field channel/target muncul saat announce dipilih.
- Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL Webhook HTTP(S) yang valid.
- Untuk job sesi utama, mode pengiriman webhook dan none tersedia.
- Kontrol edit lanjutan mencakup delete-after-run, clear agent override, opsi exact/stagger Cron,
  override model/thinking agen, dan toggle pengiriman best-effort.
- Validasi formulir bersifat inline dengan error tingkat field; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
- Tetapkan `cron.webhookToken` untuk mengirim bearer token khusus; jika dihilangkan Webhook dikirim tanpa header auth.
- Fallback yang deprecated: job legacy tersimpan dengan `notify: true` tetap dapat menggunakan `cron.webhook` sampai dimigrasikan.

## Perilaku chat

- `chat.send` bersifat **non-blocking**: ia langsung ack dengan `{ runId, status: "started" }` dan respons di-stream melalui peristiwa `chat`.
- Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
- Respons `chat.history` dibatasi ukurannya untuk keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan oversized dengan placeholder (`[chat.history omitted: message too large]`).
- Gambar asisten/tergenerasi dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway yang terautentikasi, sehingga reload tidak bergantung pada payload gambar base64 mentah yang tetap berada di respons riwayat chat.
- `chat.history` juga menghapus tag directive inline yang hanya untuk tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
- `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa run agen, tanpa pengiriman channel).
- Picker model dan thinking di header chat langsung mem-patch sesi aktif melalui `sessions.patch`; ini adalah override sesi persisten, bukan opsi pengiriman satu giliran saja.
- Mode Talk menggunakan provider voice realtime terdaftar yang mendukung sesi
  WebRTC browser. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, atau gunakan kembali konfigurasi provider realtime Voice Call.
  Browser tidak pernah menerima API key OpenAI standar; browser hanya menerima
  secret klien Realtime yang ephemeral. Google Live voice realtime didukung
  untuk backend Voice Call dan bridge Google Meet, tetapi belum untuk jalur
  WebRTC browser ini. Prompt sesi Realtime dirakit oleh Gateway;
  `talk.realtime.session` tidak menerima override instruksi yang diberikan pemanggil.
- Di composer Chat, kontrol Talk adalah tombol gelombang di samping tombol
  dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan
  `Connecting Talk...`, lalu `Talk live` saat audio terhubung, atau
  `Asking OpenClaw...` saat pemanggilan alat realtime sedang berkonsultasi dengan
  model terkonfigurasi yang lebih besar melalui `chat.send`.
- Hentikan:
  - Klik **Stop** (memanggil `chat.abort`)
  - Saat run aktif, tindak lanjut normal akan diantrikan. Klik **Steer** pada pesan yang diantrikan untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
  - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk menghentikan out-of-band
  - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk menghentikan semua run aktif untuk sesi itu
- Retensi parsial abort:
  - Saat run dihentikan, teks asisten parsial tetap dapat ditampilkan di UI
  - Gateway mempersistenkan teks asisten parsial yang dihentikan ke riwayat transkrip saat output buffer tersedia
  - Entri yang dipersistenkan menyertakan metadata abort agar konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal

## Embed terhosting

Pesan asisten dapat merender konten web terhosting secara inline dengan shortcode
`[embed ...]`. Kebijakan sandbox iframe dikontrol oleh
`gateway.controlUi.embedSandbox`:

- `strict`: menonaktifkan eksekusi skrip di dalam embed terhosting
- `scripts`: mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini
  adalah default dan biasanya cukup untuk game/widget browser mandiri
- `trusted`: menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen situs yang sama
  yang memang membutuhkan hak istimewa lebih kuat

Contoh:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Gunakan `trusted` hanya saat dokumen yang di-embed benar-benar membutuhkan
perilaku same-origin. Untuk sebagian besar game yang dihasilkan agen dan kanvas interaktif, `scripts` adalah
pilihan yang lebih aman.

URL embed `http(s)` eksternal absolut tetap diblokir secara default. Jika Anda
memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, tetapkan
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Akses Tailnet (direkomendasikan)

### Tailscale Serve terintegrasi (disarankan)

Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

```bash
openclaw gateway --tailscale serve
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Secara default, permintaan Serve Control UI/WebSocket dapat diautentikasi melalui header identitas Tailscale
(`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw
memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan
`tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat
permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Tetapkan
`gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret
eksplisit bahkan untuk trafik Serve. Lalu gunakan `gateway.auth.mode: "token"` atau
`"password"`.
Untuk jalur identitas Serve async tersebut, upaya auth yang gagal untuk IP klien
dan scope auth yang sama diserialisasikan sebelum penulisan rate-limit. Oleh karena itu,
retry buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua
alih-alih dua ketidakcocokan biasa yang berjalan paralel.
Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
mungkin berjalan di host itu, wajibkan auth token/kata sandi.

### Bind ke tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Lalu buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Tempel shared secret yang sesuai ke pengaturan UI (dikirim sebagai
`connect.params.auth.token` atau `connect.params.auth.password`).

## HTTP tidak aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`),
browser berjalan dalam **konteks non-aman** dan memblokir WebCrypto. Secara default,
OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth operator Control UI yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host gateway)

**Perilaku toggle auth tidak aman:**

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

- Ini memungkinkan sesi Control UI localhost berlanjut tanpa identitas perangkat dalam
  konteks HTTP non-aman.
- Ini tidak melewati pemeriksaan pairing.
- Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

**Hanya untuk break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan
penurunan keamanan yang serius. Kembalikan dengan cepat setelah penggunaan darurat.

Catatan trusted-proxy:

- auth trusted-proxy yang berhasil dapat menerima sesi Control UI **operator** tanpa
  identitas perangkat
- ini **tidak** berlaku untuk sesi Control UI role node
- reverse proxy loopback host yang sama tetap tidak memenuhi auth trusted-proxy; lihat
  [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Content Security Policy

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin** dan URL `data:` yang diizinkan. URL gambar `http(s)` jarak jauh dan protocol-relative ditolak oleh browser dan tidak mengeluarkan fetch jaringan.

Apa artinya ini dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender.
- URL `data:image/...` inline tetap dirender (berguna untuk payload dalam protokol).
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus pada helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar jarak jauh arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth route avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu route ditolak (sesuai dengan route sibling assistant-media). Ini mencegah route avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob yang terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan auth gateway (tidak direkomendasikan pada host bersama), route avatar juga menjadi tidak terautentikasi, selaras dengan gateway lainnya.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Base absolut opsional (saat Anda ingin URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan bisa
berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite
secara lokal tetapi Gateway berjalan di tempat lain.

1. Mulai server dev UI: `pnpm ui:dev`
2. Buka URL seperti:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Auth satu kali opsional (jika diperlukan):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Catatan:

- `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
- `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, yang menghindari kebocoran log permintaan dan Referer. Param kueri legacy `?token=` tetap diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan segera dihapus setelah bootstrap.
- `password` hanya disimpan di memori.
- Saat `gatewayUrl` ditetapkan, UI tidak fallback ke kredensial konfigurasi atau lingkungan.
  Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
- Gunakan `wss://` saat Gateway berada di balik TLS (Tailscale Serve, proxy HTTPS, dll.).
- `gatewayUrl` hanya diterima di jendela tingkat atas (bukan di-embed) untuk mencegah clickjacking.
- Deployment Control UI non-loopback harus menetapkan `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Ini termasuk penyiapan dev jarak jauh.
- Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian
  lokal yang sangat terkontrol. Ini berarti mengizinkan origin browser apa pun, bukan “cocokkan host apa pun yang sedang saya gunakan.”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin Host-header, tetapi ini adalah mode keamanan berbahaya.

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

- [Dashboard](/id/web/dashboard) — dasbor gateway
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan gateway

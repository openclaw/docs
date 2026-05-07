---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda ingin akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-05-07T13:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi halaman tunggal kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

Auth disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve ketika `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy ketika `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL Gateway yang dipilih; kata sandi tidak dipertahankan. Onboarding biasanya menghasilkan token Gateway untuk auth shared-secret saat koneksi pertama, tetapi auth kata sandi juga berfungsi ketika `gateway.auth.mode` adalah `"password"`.

## Pemasangan perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pemasangan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Cantumkan permintaan tertunda">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Setujui berdasarkan ID permintaan">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jika browser mencoba ulang pemasangan dengan detail auth yang berubah (role/scopes/public key), permintaan tertunda sebelumnya akan digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan bolak-balik pemasangan untuk sesi operator Control UI ketika `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi mengganti browser atau menghapus data browser akan memerlukan pemasangan ulang.

</Note>

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipertahankan di sisi server di luar metadata penulis transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau mengganti browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk penimpaan avatar asisten. Avatar asisten yang diunggah menumpuk di atas identitas yang diselesaikan Gateway hanya pada browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti Gateway berskrip atau dasbor khusus).

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtimenya dari `/__openclaw/control-ui-config.json`. Endpoint itu dibatasi oleh auth Gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi Gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya saat pemuatan pertama berdasarkan locale browser Anda. Untuk menimpanya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan ulang pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk set locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thailand (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; keduanya mungkin tidak muncul di pemilih tersebut sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Appearance mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, dan tempel tautan tema yang disalin ke Appearance. Pengimpor juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke konfigurasi Gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukannya (hari ini)

<AccordionGroup>
  <Accordion title="Chat dan Talk">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan agar sesi besar tidak memaksa browser merender payload transkrip penuh sebelum chat dapat digunakan.
    - Talk melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan Plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider milik klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay menyimpan kredensial provider di Gateway sementara browser melakukan streaming PCM mikrofon melalui `talk.session.appendAudio` dan meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar.
    - Streaming panggilan tool + kartu output tool langsung di Chat (event agen).

  </Accordion>
  <Accordion title="Channel, instance, sesi, dream">
    - Channel: bawaan plus status channel Plugin bundled/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel menjaga snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label ketika probe atau audit melampaui anggaran UI-nya.
    - Instance: daftar presence + penyegaran (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang stale, dan menerapkan penimpaan model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status Dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: cantumkan/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist Gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi terakhir yang aktif.
    - Penulisan menyertakan penjaga base-hash untuk mencegah menimpa edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim; ref terkirim aktif yang tidak terselesaikan ditolak sebelum penulisan.
    - Schema + rendering form (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, hint UI yang cocok, ringkasan child langsung, metadata docs pada node object/wildcard/array/composition bertingkat, plus schema Plugin + channel jika tersedia); editor Raw JSON hanya tersedia ketika snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut.
    - Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis mentah (formatting, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan setelah reset ketika snapshot dapat melakukan round-trip dengan aman.
    - Nilai object SecretRef terstruktur dirender read-only di input teks form untuk mencegah korupsi object-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event menyertakan timing penyegaran/RPC Control UI, timing render chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau task panjang ketika browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail langsung log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart, lalu polling `update.status` setelah koneksi ulang untuk memverifikasi versi Gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, delivery default-nya adalah announce summary. Anda dapat beralih ke none jika menginginkan eksekusi hanya internal.
    - Field channel/target muncul ketika announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL Webhook HTTP(S) yang valid.
    - Untuk job sesi utama, mode delivery webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup delete-after-run, clear agent override, opsi cron exact/stagger, penimpaan model/thinking agen, dan toggle delivery best-effort.
    - Validasi form bersifat inline dengan error tingkat field; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim bearer token khusus; jika dihilangkan Webhook dikirim tanpa header auth.
    - Fallback yang tidak digunakan lagi: job legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung memberi ack dengan `{ runId, status: "started" }` dan respons dialirkan melalui event `chat`.
    - Unggahan chat menerima gambar serta file non-video. Gambar mempertahankan path gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Ketika entri transkrip terlalu besar, Gateway dapat memotong kolom teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada di respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat final, tampilan chat tetap menampilkan pesan pengguna/asisten optimistis lokal jika `chat.history` sebentar mengembalikan snapshot lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` live adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang tahan lama. Setelah event tool-final, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa agent run, tanpa pengiriman channel).
    - Header chat menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agen yang dipilih. Beralih agen hanya menampilkan sesi yang terkait dengan agen tersebut dan kembali ke sesi utama agen itu ketika belum memiliki sesi dasbor tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan teks-saja duplikat yang berurutan dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output tool, atau pratinjau canvas dibiarkan tidak diciutkan.
    - Pemilih model dan thinking pada header chat langsung mem-patch sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim satu giliran saja.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dasbor baru yang sama seperti New Chat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi di Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` ditambah provider dengan auth yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Ketika laporan penggunaan sesi Gateway terbaru menyertakan token konteks saat ini, area composer chat menampilkan indikator penggunaan konteks ringkas. Indikator beralih ke gaya peringatan saat tekanan konteks tinggi dan, pada level compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur compaction sesi normal. Snapshot token basi disembunyikan sampai Gateway melaporkan penggunaan terbaru lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey`, atau konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima rahasia klien Realtime ephemeral untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi tool dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Ketika Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat tool call realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal masuk antrean. Klik **Steer** pada pesan yang mengantre untuk menyisipkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Ketika run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika output tertahan di buffer.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instal PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan ketika tab atau jendela browser tidak terbuka.

| Permukaan                                             | Yang dilakukan                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifes PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Keypair VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipertahankan.                     |

Override keypair VAPID melalui env vars pada proses Gateway saat Anda ingin mematok kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway berpagar cakupan berikut untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
</Note>

## Embed terhosting

Pesan asisten dapat merender konten web terhosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi script di dalam embed terhosting.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang sengaja membutuhkan hak istimewa lebih kuat.
  </Tab>
</Tabs>

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

<Warning>
Gunakan `trusted` hanya ketika dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk kebanyakan game yang dihasilkan agen dan canvas interaktif, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat meng-override-nya tanpa mem-patch CSS bawaan dengan mengatur `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang biasa dan persentase seperti `960px` atau `82%`, plus ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat melakukan autentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerima ini ketika permintaan mengenai loopback dengan header `x-forwarded-*` Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati perjalanan bolak-balik pairing perangkat; browser tanpa perangkat dan koneksi role node tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve async tersebut, upaya auth yang gagal untuk IP klien dan cakupan auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua mismatch biasa yang berlomba secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal tidak tepercaya mungkin berjalan pada host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempelkan shared secret yang sesuai ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP Tidak Aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi UI Kontrol operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host gateway)

<AccordionGroup>
  <Accordion title="Perilaku toggle autentikasi tidak aman">
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

    - Ini memungkinkan sesi UI Kontrol localhost berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

  </Accordion>
  <Accordion title="Hanya break-glass">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat UI Kontrol dan merupakan penurunan keamanan yang berat. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan trusted-proxy">
    - Autentikasi trusted-proxy yang berhasil dapat menerima sesi UI Kontrol **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi UI Kontrol dengan peran node.
    - Proxy balik loopback host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat [Autentikasi trusted proxy](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

UI Kontrol dikirimkan dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak memicu pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah jalur relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh UI Kontrol tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus di helper avatar UI Kontrol dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sembarang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi gateway dikonfigurasikan, endpoint avatar UI Kontrol memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tanpa autentikasi ke kedua rute ditolak (sesuai dengan rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agent pada host yang seharusnya terlindungi.
- UI Kontrol sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tidak terautentikasi, selaras dengan gateway lainnya.

## Autentikasi rute media assistant

Saat autentikasi gateway dikonfigurasikan, pratinjau media lokal assistant menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator UI Kontrol normal. Browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi ke jalur sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi gateway aktif. Tiket kedaluwarsa dengan cepat dan tidak dapat mengotorisasi sumber lain.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menaruh kredensial gateway yang dapat digunakan ulang di URL media yang terlihat.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Base absolut opsional (saat Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (mis. `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

<Steps>
  <Step title="Mulai server dev UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Buka dengan gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autentikasi satu kali opsional (jika diperlukan):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, URL-encode nilai `gatewayUrl` agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri legacy `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat menanamkan origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol ketat. Artinya mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host, tetapi ini adalah mode keamanan yang berbahaya.

  </Accordion>
</AccordionGroup>

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

- [Dasbor](/id/web/dashboard) — dasbor gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

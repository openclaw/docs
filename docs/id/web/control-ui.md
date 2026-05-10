---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: Antarmuka kontrol berbasis browser untuk Gateway (obrolan, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-05-10T19:57:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

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

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak disimpan. Onboarding biasanya membuat token gateway untuk auth rahasia bersama pada koneksi pertama, tetapi auth kata sandi juga berfungsi ketika `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Ketika Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pairing satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

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

Jika browser mencoba ulang pairing dengan detail auth yang berubah (role/scope/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipairing dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set scope baru secara eksplisit.

Setelah disetujui, perangkat diingat dan tidak akan memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan bolak-balik pairing untuk sesi operator UI Kontrol ketika `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi mengganti browser atau menghapus data browser akan memerlukan pairing ulang.

</Note>

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dibatasi ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau disimpan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau mengganti browser akan mengatur ulangnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk penggantian avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diresolusikan gateway hanya di browser lokal dan tidak pernah melakukan perjalanan bolak-balik melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dasbor kustom).

## Endpoint konfigurasi runtime

UI Kontrol mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint tersebut dijaga oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya saat pemuatan pertama berdasarkan locale browser Anda. Untuk menimpanya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk set locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; keduanya mungkin tidak muncul di pemilih itu sampai Mintlify mendukung kode tersebut.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, dan tempel tautan tema yang disalin ke Tampilan. Pengimpor juga menerima URL registri `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema impor sedang dipilih.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Talk">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan sehingga sesi besar tidak memaksa browser merender payload transkrip penuh sebelum chat dapat digunakan.
    - Talk melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider milik klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay menjaga kredensial provider tetap di Gateway saat browser melakukan streaming PCM mikrofon melalui `talk.session.appendAudio` dan meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar.
    - Streaming panggilan tool + kartu output tool langsung di Chat (event agen).

  </Accordion>
  <Accordion title="Channel, instance, sesi, mimpi">
    - Channel: status channel bawaan plus plugin bawaan/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label ketika probe atau audit melampaui anggaran UI-nya.
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Mimpi: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, persetujuan exec">
    - Pekerjaan Cron: cantumkan/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat run (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan guard hash dasar untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim; ref terkirim aktif yang tidak terselesaikan ditolak sebelum penulisan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung, metadata docs pada node objek/wildcard/array/komposisi bersarang, plus skema plugin + channel saat tersedia); editor JSON Mentah hanya tersedia ketika snapshot memiliki perjalanan bolak-balik mentah yang aman.
    - Jika snapshot tidak dapat melakukan perjalanan bolak-balik teks mentah secara aman, UI Kontrol memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor JSON Mentah "Reset ke tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan dari reset ketika snapshot dapat melakukan perjalanan bolak-balik secara aman.
    - Nilai objek SecretRef terstruktur dirender baca-saja di input teks formulir untuk mencegah kerusakan objek-menjadi-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/models + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event mencakup timing refresh/RPC UI Kontrol, timing render chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau task panjang ketika browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah tersambung ulang untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, delivery default-nya adalah mengumumkan ringkasan. Anda dapat beralih ke none jika menginginkan run internal saja.
    - Field channel/target muncul ketika announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode delivery webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-run, hapus override agen, opsi cron exact/stagger, override model/thinking agen, dan toggle delivery upaya terbaik.
    - Validasi formulir bersifat inline dengan error tingkat field; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback yang tidak digunakan lagi: pekerjaan legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: perintah ini langsung mengakui dengan `{ runId, status: "started" }` dan respons dialirkan melalui event `chat`.
    - Unggahan chat menerima gambar plus file non-video. Gambar mempertahankan path gambar asli; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong bidang teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway yang diautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong), serta token kontrol model ASCII/lebar penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan penyegaran riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sesaat mengembalikan snapshot lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` live adalah status pengiriman, sementara `chat.history` dibangun ulang dari transkrip sesi yang tahan lama. Setelah event final alat, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa run agen, tanpa pengiriman channel).
    - Header chat menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agen yang dipilih. Beralih agen hanya menampilkan sesi yang terkait dengan agen tersebut dan kembali ke sesi utama agen itu ketika belum ada sesi dasbor tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir ke atas, kembali ke bagian atas, atau mencapai bagian bawah memulihkan kontrol.
    - Pesan teks saja duplikat yang berurutan dirender sebagai satu gelembung dengan badge hitungan. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau canvas tidak diciutkan.
    - Pemilih model dan thinking di header chat langsung menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi pengiriman satu giliran saja.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dasbor baru yang sama seperti New Chat, kecuali ketika `session.dmScope: "main"` dikonfigurasi dan parent saat ini adalah sesi utama agen; dalam kasus itu, perintah ini mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog berbasis provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog penuh tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway baru menyertakan token konteks saat ini, area composer chat menampilkan indikator penggunaan konteks yang ringkas. Indikator ini beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada level Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token basi disembunyikan hingga Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode Talk (realtime browser)">
    Mode Talk menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus salah satu dari `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY`, atau profil OAuth `openai-codex`; konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway yang diautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Composer Chat menyertakan tombol opsi Talk di sebelah tombol mulai/berhenti Talk. Opsi tersebut berlaku untuk sesi Talk berikutnya dan dapat meng-override provider, transport, model, suara, upaya reasoning, ambang VAD, durasi senyap, dan padding prefix. Saat sebuah opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default provider. Memilih relay Gateway memaksa jalur relay backend; memilih WebRTC mempertahankan sesi sebagai milik klien dan gagal alih-alih diam-diam kembali ke relay jika provider tidak dapat membuat sesi browser.

    Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio terhubung, atau `Asking OpenClaw...` saat panggilan alat realtime sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adaptor browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan abort">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat sebuah run aktif, follow-up normal masuk antrean. Klik **Steer** pada pesan yang diantrekan untuk menyisipkan follow-up tersebut ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk melakukan abort out-of-band.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk meng-abort semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial abort">
    - Saat sebuah run di-abort, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang di-abort ke dalam riwayat transkrip saat output buffer ada.
    - Entri yang dipertahankan menyertakan metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah dir status OpenClaw) | Keypair VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint subscription browser yang dipertahankan.                  |

Override keypair VAPID melalui env var pada proses Gateway saat Anda ingin mematok kunci (untuk deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway berbatas scope ini untuk mendaftarkan dan menguji subscription browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke subscription pemanggil.

<Note>
Web Push bersifat independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push yang didukung relay) dan metode `push.test` yang sudah ada, yang menargetkan pairing seluler native.
</Note>

## Embed ter-host

Pesan asisten dapat merender konten web ter-host secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed ter-host.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang memang membutuhkan privilese lebih kuat.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan canvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat berkelompok menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat meng-override-nya tanpa menambal CSS bawaan dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang dan persentase biasa seperti `960px` atau `82%`, plus ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses Tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (lebih disukai)">
    Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya ketika permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve yang terverifikasi ini juga melewati perjalanan pulang-pergi pairing perangkat; browser tanpa perangkat dan koneksi berperan node tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk lalu lintas Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, upaya autentikasi gagal untuk IP klien dan cakupan autentikasi yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk yang serentak dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua ketidakcocokan biasa yang berpacu secara paralel.

    <Warning>
    Autentikasi Serve tanpa token mengasumsikan host Gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan di host tersebut, wajibkan autentikasi token/kata sandi.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempelkan shared secret yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP Tidak Aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host Gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` hanya toggle kompatibilitas lokal:

    - Ini memungkinkan sesi Control UI localhost berjalan tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang berat. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Autentikasi trusted-proxy yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI berperan node.
    - Proxy balik loopback pada host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar jarak jauh `http(s)` dan protocol-relative ditolak oleh browser dan tidak mengeluarkan pengambilan jaringan.

Arti praktisnya:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk route avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sembarang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi route avatar

Ketika autentikasi Gateway dikonfigurasi, endpoint avatar Control UI memerlukan token Gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu route ditolak (mencocokkan route assistant-media saudaranya). Ini mencegah route avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- Control UI sendiri meneruskan token Gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi Gateway (tidak direkomendasikan pada host bersama), route avatar juga menjadi tidak terautentikasi, selaras dengan Gateway lainnya.

## Autentikasi route media asisten

Ketika autentikasi Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan route dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator Control UI normal. Browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dicakup ke path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi Gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber berbeda.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menaruh kredensial Gateway yang dapat digunakan kembali di URL media yang terlihat.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build
```

Base absolut opsional (ketika Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (mis. `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna ketika Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - Jika Anda meneruskan endpoint penuh `ws://` atau `wss://` melalui `gatewayUrl`, URL-encode nilai `gatewayUrl` agar browser mem-parse string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) kapan pun memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran request-log dan Referer. Parameter kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan segera dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Ketika `gatewayUrl` diatur, UI tidak fallback ke kredensial konfigurasi atau lingkungan. Sediakan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` ketika Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela top-level (tidak di-embed) untuk mencegah clickjacking.
    - Deployment Control UI non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat menanam origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap membutuhkan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikendalikan ketat. Artinya mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
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

- [Dasbor](/id/web/dashboard) — dasbor Gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan Gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

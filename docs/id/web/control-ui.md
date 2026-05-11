---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda menginginkan akses Tailnet tanpa terowongan SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, node, konfigurasi)
title: Antarmuka Kontrol
x-i18n:
    generated_at: "2026-05-11T20:38:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman kecil **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Auth diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas proxy tepercaya saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dashboard menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak disimpan. Onboarding biasanya menghasilkan token gateway untuk auth rahasia bersama pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Penyandingan perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan penyandingan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

**Yang akan Anda lihat:** "terputus (1008): penyandingan diperlukan"

<Steps>
  <Step title="Daftar permintaan tertunda">
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

Jika browser mencoba ulang penyandingan dengan detail auth yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum menyetujui.

Jika browser sudah disandingkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan penyambungan ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir penyambungan ulang yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati putaran penyandingan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi mengganti browser atau menghapus data browser akan memerlukan penyandingan ulang.

</Note>

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini disimpan di penyimpanan browser, dibatasi pada profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau beralih browser akan mengosongkannya kembali.

Pola lokal-browser yang sama berlaku untuk penggantian avatar asisten. Avatar asisten yang diunggah menimpa identitas yang di-resolve Gateway hanya pada browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti Gateway terskrip atau dasbor khusus).

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint tersebut dijaga oleh autentikasi Gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi Gateway yang sudah valid, identitas Tailscale Serve, atau identitas proksi tepercaya.

## Dukungan bahasa

Control UI dapat melokalkan dirinya saat pemuatan pertama berdasarkan lokal browser Anda. Untuk menggantinya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih lokal berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Lokal yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara malas di browser.
- Lokal yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk set lokal non-Inggris yang sama, tetapi pemilih bahasa bawaan Mintlify pada situs docs dibatasi pada kode lokal yang diterima Mintlify. Docs bahasa Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; keduanya mungkin belum muncul di pemilih tersebut sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal-browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, lalu tempel tautan tema yang disalin ke Tampilan. Pengimpor juga menerima URL registri `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke konfigurasi Gateway dan tidak disinkronkan lintas perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal tersebut; menghapusnya mengembalikan tema aktif ke Claw jika tema impor sedang dipilih.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Bicara">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan sehingga sesi besar tidak memaksa browser merender payload transkrip penuh sebelum chat dapat digunakan.
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relai Gateway. Sesi penyedia milik klien dimulai dengan `talk.client.create`; sesi relai Gateway dimulai dengan `talk.session.create`. Relai menjaga kredensial penyedia tetap di Gateway sementara browser melakukan streaming PCM mikrofon melalui `talk.session.appendAudio` dan meneruskan panggilan tool penyedia `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar.
    - Streaming panggilan tool + kartu output tool langsung di Chat (event agen).

  </Accordion>
  <Accordion title="Channel, instance, sesi, dream">
    - Channel: status channel bawaan plus plugin bundel/eksternal, login QR, dan konfigurasi per-channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan penyedia yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melampaui anggaran UI-nya.
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist Gateway atau node + kebijakan permintaan untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi terakhir yang aktif.
    - Penulisan menyertakan guard base-hash untuk mencegah menimpa edit serentak.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirimkan; ref terkirim aktif yang tidak terselesaikan ditolak sebelum penulisan.
    - Schema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, hint UI yang cocok, ringkasan anak langsung, metadata docs pada node objek bersarang/wildcard/array/komposisi, plus schema plugin + channel bila tersedia); editor JSON mentah hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor JSON mentah "Reset ke tersimpan" mempertahankan bentuk yang dibuat mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan setelah reset ketika snapshot dapat melakukan round-trip dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah korupsi tidak disengaja dari objek menjadi string.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event mencakup timing refresh/RPC Control UI, timing render chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau tugas panjang saat browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail langsung log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah tersambung kembali untuk memverifikasi versi Gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, pengiriman default mengumumkan ringkasan. Anda dapat beralih ke tidak ada jika menginginkan eksekusi khusus internal.
    - Field channel/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk job sesi utama, mode pengiriman webhook dan tidak ada tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-eksekusi, hapus override agen, opsi cron exact/stagger, override model/thinking agen, dan toggle pengiriman upaya-terbaik.
    - Validasi formulir bersifat inline dengan error tingkat-field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header autentikasi.
    - Fallback yang tidak digunakan lagi: job warisan tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengakui dengan `{ runId, status: "started" }` dan respons mengalir melalui event `chat`.
    - Unggahan chat menerima gambar serta file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Ketika entri transkrip terlalu besar, Gateway dapat memotong bidang teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML tool-call teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta token kontrol model ASCII/lebar penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat final, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sempat mengembalikan snapshot lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` langsung adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang tahan lama. Setelah event tool-final, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa agent run, tanpa pengiriman channel).
    - Header chat menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agen yang dipilih. Beralih agen hanya menampilkan sesi yang terkait dengan agen tersebut dan kembali ke sesi utama agen itu ketika belum memiliki sesi dashboard tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan diciutkan saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan teks saja yang berduplikat berturut-turut dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output tool, atau pratinjau kanvas tidak diciutkan.
    - Pemilih model dan thinking di header chat segera menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi yang persisten, bukan opsi pengiriman satu giliran saja.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti New Chat, kecuali saat `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu, sesi utama direset di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog dalam cakupan provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway yang segar menyertakan token konteks saat ini, area composer chat menampilkan indikator penggunaan konteks yang ringkas. Indikator beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token usang disembunyikan sampai Gateway melaporkan penggunaan segar lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus salah satu dari `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY`, atau profil OAuth `openai-codex`; konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi tool dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan soket vendor tetap di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Composer Chat menyertakan tombol opsi Talk di samping tombol mulai/berhenti Talk. Opsi tersebut berlaku untuk sesi Talk berikutnya dan dapat mengoverride provider, transport, model, voice, reasoning effort, ambang VAD, durasi senyap, dan padding awalan. Saat opsi kosong, Gateway menggunakan default terkonfigurasi jika tersedia atau default provider. Memilih relay Gateway memaksa jalur relay backend; memilih WebRTC mempertahankan sesi dimiliki klien dan gagal alih-alih diam-diam fallback ke relay jika provider tidak dapat membuat sesi browser.

    Di composer Chat, kontrol Talk adalah tombol gelombang di samping tombol dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat tool call realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke langsung maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah hanya mencetak status provider dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat sebuah run aktif, tindak lanjut normal masuk antrean. Klik **Steer** pada pesan yang mengantre untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Saat sebuah run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output buffer ada.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI mengirimkan `manifest.webmanifest` dan service worker, sehingga browser modern dapat memasangnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terpasang dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah dir state OpenClaw)  | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipertahankan.                     |

Override pasangan kunci VAPID melalui env var pada proses Gateway saat Anda ingin mematok kunci (untuk deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway berpagar cakupan ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang ada, yang menargetkan pairing mobile native.
</Note>

## Embed yang dihosting

Pesan asisten dapat merender konten web yang dihosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed yang dihosting.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan kanvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat mengoverride-nya tanpa menambal CSS bawaan dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

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

## Akses Tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (lebih disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Serve UI Kontrol/WebSocket dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan menyelesaikan alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya saat permintaan masuk melalui loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator UI Kontrol dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati perjalanan bolak-balik pemasangan perangkat; browser tanpa perangkat dan koneksi peran node tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial rahasia bersama eksplisit bahkan untuk lalu lintas Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, percobaan autentikasi yang gagal untuk IP klien dan cakupan autentikasi yang sama diserialkan sebelum penulisan pembatasan laju. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua ketidakcocokan biasa yang berpacu secara paralel.

    <Warning>
    Autentikasi Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan di host tersebut, wajibkan autentikasi token/kata sandi.
    </Warning>

  </Tab>
  <Tab title="Ikat ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempelkan rahasia bersama yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi UI Kontrol operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- darurat `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` hanya merupakan toggle kompatibilitas lokal:

    - Ini memungkinkan sesi UI Kontrol localhost dilanjutkan tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pemasangan.
    - Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

  </Accordion>
  <Accordion title="Hanya darurat">
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat UI Kontrol dan merupakan penurunan keamanan yang serius. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan proxy tepercaya">
    - Autentikasi trusted-proxy yang berhasil dapat mengizinkan sesi UI Kontrol **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi UI Kontrol peran node.
    - Proxy balik loopback pada host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

UI Kontrol dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak memicu pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan melalui path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh UI Kontrol tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata saluran dihapus pada helper avatar UI Kontrol dan diganti dengan logo/badge bawaan, sehingga saluran yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sembarang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi gateway dikonfigurasi, endpoint avatar UI Kontrol memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute saudara assistant-media). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya terlindungi.
- UI Kontrol sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tidak terautentikasi, selaras dengan bagian gateway lainnya.

## Autentikasi rute media asisten

Saat autentikasi gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator UI Kontrol normal. Browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dicakup ke path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber yang berbeda.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menempatkan kredensial gateway yang dapat digunakan ulang dalam URL media yang terlihat.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Basis absolut opsional (saat Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (mis. `ws://127.0.0.1:18789`).

## Halaman UI Kontrol kosong

Jika browser memuat dasbor kosong dan DevTools tidak menampilkan kesalahan yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan tindakan **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dasbor yang sama setelah perubahan browser.

## Debug/pengujian: server dev + Gateway jarak jauh

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna saat Anda ingin server dev Vite berjalan lokal tetapi Gateway berjalan di tempat lain.

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
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Param kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan segera dihapus setelah bootstrap.
    - `password` hanya disimpan dalam memori.
    - Saat `gatewayUrl` diatur, UI tidak kembali ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
    - Gunakan `wss://` saat Gateway berada di balik TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat menanam origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang sangat terkendali. Itu berarti mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
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

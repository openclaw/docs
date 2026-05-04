---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: Antarmuka kontrol berbasis browser untuk Gateway (obrolan, Node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-05-04T09:34:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman kecil **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Ini berkomunikasi **langsung dengan Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Autentikasi diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya menghasilkan token gateway untuk autentikasi shared-secret pada koneksi pertama, tetapi autentikasi kata sandi juga berfungsi saat `gateway.auth.mode` bernilai `"password"`.

## Penyandingan perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan penyandingan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tanpa izin.

**Yang akan Anda lihat:** "terputus (1008): penyandingan diperlukan"

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

Jika browser mencoba ulang penyandingan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah disandingkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak akan memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati bolak-balik penyandingan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berganti browser atau menghapus data browser akan memerlukan penyandingan ulang.

</Note>

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakupkan ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berganti browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk penggantian avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan gateway hanya pada browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dasbor khusus).

## Endpoint konfigurasi runtime

UI Kontrol mengambil pengaturan runtime dari `/__openclaw/control-ui-config.json`. Endpoint itu dibatasi oleh autentikasi gateway yang sama seperti seluruh permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya pada pemuatan pertama berdasarkan lokal browser Anda. Untuk menimpanya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih lokal berada di kartu Gateway Access, bukan di bawah Appearance.

- Lokal yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Lokal yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan dokumen dibuat untuk set lokal non-Inggris yang sama, tetapi pemilih bahasa bawaan situs dokumen Mintlify terbatas pada kode lokal yang diterima Mintlify. Dokumen Thai (`th`) dan Persian (`fa`) tetap dibuat di repo publikasi; dokumen tersebut mungkin belum muncul di pemilih itu sampai Mintlify mendukung kode tersebut.

## Tema tampilan

Panel Appearance mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, lalu tempel tautan tema yang disalin ke Appearance. Pengimpor juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema impor sedang dipilih.

## Yang dapat dilakukan (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Talk">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Berbicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser satu kali yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Relay menjaga kredensial provider di Gateway sementara browser mengalirkan PCM mikrofon melalui RPC `talk.realtime.relay*` dan mengirim tool call `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw lebih besar yang dikonfigurasi.
    - Streaming tool call + kartu keluaran tool langsung di Chat (event agen).

  </Accordion>
  <Accordion title="Channel, instans, sesi, dream">
    - Channel: status channel plugin bawaan plus bundled/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Instans: daftar kehadiran + refresh (`system-presence`).
    - Sesi: daftar + override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga base-hash untuk mencegah menimpa edit yang berlangsung bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirimkan; ref aktif yang dikirimkan dan tidak terselesaikan ditolak sebelum penulisan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung, metadata dokumen pada node objek bertingkat/wildcard/array/komposisi, ditambah skema plugin + channel jika tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki bolak-balik raw yang aman.
    - Jika snapshot tidak dapat bolak-balik teks raw dengan aman, UI Kontrol memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut.
    - Editor Raw JSON "Reset ke yang disimpan" mempertahankan bentuk yang ditulis raw (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan dari reset saat snapshot dapat bolak-balik dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya baca dalam input teks formulir untuk mencegah kerusakan objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event mencakup timing refresh/RPC UI Kontrol plus entri responsivitas browser untuk frame animasi panjang atau tugas panjang saat browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah koneksi ulang untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, delivery defaultnya mengumumkan ringkasan. Anda dapat beralih ke none jika menginginkan eksekusi hanya internal.
    - Field channel/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk job sesi utama, mode delivery webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup delete-after-run, hapus override agen, opsi cron exact/stagger, override model/thinking agen, dan toggle delivery best-effort.
    - Validasi formulir bersifat inline dengan error tingkat field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback yang usang: job legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku Chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengakui dengan `{ runId, status: "started" }` dan respons dialirkan melalui peristiwa `chat`.
    - Unggahan chat menerima gambar serta file non-video. Gambar mempertahankan jalur gambar asli; file lain disimpan sebagai media terkelola dan ditampilkan di riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Ketika entri transkrip terlalu besar, Gateway dapat memangkas bidang teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/terhasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada di respons riwayat chat.
    - `chat.history` juga menghapus tag arahan inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpangkas), serta token kontrol model ASCII/lebar-penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
    - Selama pengiriman aktif dan penyegaran riwayat akhir, tampilan chat tetap menampilkan pesan pengguna/asisten optimistis lokal jika `chat.history` sebentar mengembalikan snapshot yang lebih lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang tahan lama. Setelah peristiwa final alat, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa proses agent, tanpa pengiriman channel).
    - Header chat menampilkan filter agent sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agent yang dipilih. Beralih agent hanya menampilkan sesi yang terkait dengan agent tersebut dan kembali ke sesi utama agent itu ketika belum memiliki sesi dasbor tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada pada satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah akan memulihkan kontrol.
    - Pesan teks saja yang duplikat dan berurutan dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau canvas dibiarkan tidak diciutkan.
    - Pemilih model dan thinking pada header chat langsung melakukan patch sesi aktif melalui `sessions.patch`; ini adalah override sesi persisten, bukan opsi pengiriman satu giliran saja.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dasbor baru yang sama seperti New Chat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan autentikasi yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Ketika laporan penggunaan sesi Gateway baru menunjukkan tekanan konteks tinggi, area composer chat menampilkan pemberitahuan konteks dan, pada level compaction yang direkomendasikan, tombol ringkas yang menjalankan jalur compaction sesi normal. Snapshot token basi disembunyikan sampai Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, atau konfigurasikan Google dengan `talk.provider: "google"` plus `talk.providers.google.apiKey`; konfigurasi provider realtime Voice Call tetap dapat digunakan ulang sebagai fallback. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token autentikasi Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat yang dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos jembatan realtime backend berjalan melalui transport relai Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.realtime.session` tidak menerima override instruksi yang diberikan pemanggil.

    Di composer Chat, kontrol Bicara adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Bicara dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat pemanggilan alat realtime sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `chat.send`.

    Smoke langsung maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token-terbatas Google Live, dan adaptor browser relai Gateway dengan media mikrofon palsu. Perintah hanya mencetak status provider dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat proses berjalan aktif, tindak lanjut normal masuk antrean. Klik **Steer** pada pesan antrean untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua proses aktif bagi sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Ketika proses dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika output yang dibuffer ada.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI mengirimkan `manifest.webmanifest` dan service worker, sehingga browser modern dapat memasangnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terpasang dengan notifikasi bahkan ketika tab atau jendela browser tidak terbuka.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifes PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani peristiwa `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah direktori status OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipertahankan.                     |

Override pasangan kunci VAPID melalui env var pada proses Gateway ketika Anda ingin mengunci kunci (untuk deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway yang dibatasi scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi pengujian ke langganan pemanggil.

<Note>
Web Push independen dari jalur relai APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push yang didukung relai) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
</Note>

## Embed ter-hosting

Pesan asisten dapat merender konten web ter-hosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi script di dalam embed ter-hosting.
  </Tab>
  <Tab title="scripts (bawaan)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang sengaja membutuhkan hak lebih kuat.
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
Gunakan `trusted` hanya ketika dokumen yang di-embed benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game yang dibuat agent dan canvas interaktif, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat berkelompok menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat meng-override-nya tanpa patch CSS bundel dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang dan persentase biasa seperti `960px` atau `82%`, plus ekspresi lebar `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)` yang dibatasi.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (lebih disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerimanya ketika permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati round trip pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Setel `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve async tersebut, upaya autentikasi gagal untuk IP klien dan scope autentikasi yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua mismatch biasa yang berlomba secara paralel.

    <Warning>
    Autentikasi Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal tidak tepercaya mungkin berjalan pada host tersebut, wajibkan autentikasi token/password.
    </Warning>

  </Tab>
  <Tab title="Bind ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Tempelkan shared secret yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP Tidak Aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi UI Kontrol operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (pada host Gateway)

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

    - Ini mengizinkan sesi UI Kontrol localhost berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat UI Kontrol dan merupakan penurunan keamanan yang serius. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Autentikasi trusted-proxy yang berhasil dapat mengizinkan sesi UI Kontrol **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi UI Kontrol dengan peran node.
    - Reverse proxy loopback host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

UI Kontrol dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak melakukan pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh UI Kontrol tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dibuang oleh helper avatar UI Kontrol dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sembarang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Ketika autentikasi gateway dikonfigurasi, endpoint avatar UI Kontrol memerlukan token Gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- UI Kontrol sendiri meneruskan token Gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi Gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan bagian Gateway lainnya.

## Autentikasi rute media asisten

Ketika autentikasi Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator UI Kontrol normal. Browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi ke path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi Gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber lain.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media bawaan browser tanpa menaruh kredensial Gateway yang dapat digunakan ulang di URL media yang terlihat.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Basis absolut opsional (ketika Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (mis. `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna ketika Anda ingin server dev Vite berjalan lokal tetapi Gateway berjalan di tempat lain.

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
    - `gatewayUrl` disimpan di localStorage setelah pemuatan dan dihapus dari URL.
    - Jika Anda meneruskan endpoint lengkap `ws://` atau `wss://` melalui `gatewayUrl`, URL-encode nilai `gatewayUrl` agar browser mengurai string kueri dengan benar.
    - `token` harus diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Param kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dibuang setelah bootstrap.
    - `password` hanya disimpan dalam memori.
    - Ketika `gatewayUrl` ditetapkan, UI tidak fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` ketika Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat melakukan seed origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap membutuhkan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang sangat terkendali. Ini berarti mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin Host-header, tetapi ini adalah mode keamanan yang berbahaya.

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
- [Health Checks](/id/gateway/health) — pemantauan kesehatan gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, node, konfigurasi)
title: Antarmuka Kontrol
x-i18n:
    generated_at: "2026-04-30T10:18:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Aplikasi ini berbicara **langsung ke WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

Autentikasi diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya menghasilkan token gateway untuk autentikasi rahasia bersama pada koneksi pertama, tetapi autentikasi kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pemasangan perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pemasangan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

**Yang akan Anda lihat:** "terputus (1008): pemasangan diperlukan"

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

Jika browser mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw menjaga persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan pulang-pergi pemasangan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi beralih browser atau menghapus data browser akan memerlukan pemasangan ulang.

</Note>

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau beralih browser akan mengembalikannya menjadi kosong.

Pola lokal browser yang sama berlaku untuk penggantian avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan gateway hanya pada browser lokal dan tidak pernah melakukan perjalanan pulang-pergi melalui `config.patch`. Bidang konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis bidang tersebut secara langsung (seperti gateway berskrip atau dasbor kustom).

## Endpoint konfigurasi runtime

UI Kontrol mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint itu dilindungi oleh autentikasi gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya pada pemuatan pertama berdasarkan lokal browser Anda. Untuk menimpanya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih lokal berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Lokal yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara malas di browser.
- Lokal yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang kembali ke bahasa Inggris.

Terjemahan dokumen dibuat untuk set lokal non-Inggris yang sama, tetapi pemilih bahasa bawaan situs dokumentasi Mintlify terbatas pada kode lokal yang diterima Mintlify. Dokumentasi Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; keduanya mungkin tidak muncul di pemilih tersebut sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, plus satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [tema tweakcn](https://tweakcn.com/themes), pilih atau buat tema, klik **Bagikan**, lalu tempel tautan tema yang disalin ke Tampilan. Pengimpor juga menerima URL registri `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke konfigurasi gateway dan tidak disinkronkan lintas perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukan (saat ini)

<AccordionGroup>
  <Accordion title="Obrolan dan Bicara">
    - Mengobrol dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai terbatas melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relai Gateway. Relai menyimpan kredensial penyedia di Gateway sementara browser mengalirkan PCM mikrofon melalui RPC `talk.realtime.relay*` dan mengirim panggilan tool `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw lebih besar yang dikonfigurasi.
    - Streaming panggilan tool + kartu keluaran tool langsung di Obrolan (peristiwa agen).

  </Accordion>
  <Accordion title="Channel, instans, sesi, mimpi">
    - Channel: status channel bawaan plus plugin yang dibundel/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Instans: daftar kehadiran + refresh (`system-presence`).
    - Sesi: daftar + override model/thinking/cepat/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Mimpi: status dreaming, toggle aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, persetujuan exec">
    - Pekerjaan Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga hash dasar untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirimkan; ref terkirim aktif yang tidak terselesaikan ditolak sebelum penulisan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk `title` / `description` bidang, petunjuk UI yang cocok, ringkasan anak langsung, metadata dokumentasi pada node objek/wildcard/array/komposisi bertingkat, plus skema plugin + channel saat tersedia); editor JSON mentah hanya tersedia saat snapshot memiliki perjalanan pulang-pergi mentah yang aman.
    - Jika snapshot tidak dapat melakukan perjalanan pulang-pergi teks mentah dengan aman, UI Kontrol memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor JSON mentah "Atur ulang ke yang tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan dari reset saat snapshot dapat melakukan perjalanan pulang-pergi dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya baca dalam input teks formulir untuk mencegah kerusakan objek-menjadi-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah koneksi ulang untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, pengiriman default ke ringkasan pengumuman. Anda dapat beralih ke tidak ada jika menginginkan eksekusi hanya internal.
    - Bidang channel/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode pengiriman webhook dan tidak ada tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-jalankan, hapus override agen, opsi cron tepat/bertahap, override model/thinking agen, dan toggle pengiriman upaya terbaik.
    - Validasi formulir bersifat inline dengan error tingkat bidang; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header autentikasi.
    - Fallback usang: pekerjaan lama tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku obrolan

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: ia mengakui segera dengan `{ runId, status: "started" }` dan respons dialirkan melalui peristiwa `chat`.
    - Unggahan chat menerima gambar plus file non-video. Gambar mempertahankan path gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong bidang teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat chat.
    - `chat.history` juga menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), serta token kontrol model ASCII/lebar-penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
    - Selama pengiriman aktif dan penyegaran riwayat final, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal agar tetap terlihat jika `chat.history` sesaat mengembalikan snapshot yang lebih lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa agent run, tanpa pengiriman kanal).
    - Pemilih model dan thinking di header chat langsung menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim khusus satu giliran.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, daftar izin tersebut menggerakkan pemilih. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus penyedia dengan autentikasi yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway yang segar menunjukkan tekanan konteks tinggi, area composer chat menampilkan pemberitahuan konteks dan, pada tingkat Compaction yang direkomendasikan, tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token basi disembunyikan sampai Gateway melaporkan penggunaan segar lagi.

  </Accordion>
  <Accordion title="Mode Talk (waktu nyata browser)">
    Mode Talk menggunakan penyedia suara waktu nyata terdaftar. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, atau konfigurasikan Google dengan `talk.provider: "google"` plus `talk.providers.google.apiKey`; konfigurasi penyedia waktu nyata Voice Call masih dapat digunakan kembali sebagai fallback. Browser tidak pernah menerima kunci API penyedia standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token autentikasi Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat dikunci ke dalam token oleh Gateway. Penyedia yang hanya mengekspos bridge waktu nyata backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.realtime.session` tidak menerima override instruksi yang disediakan pemanggil.

    Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat pemanggilan alat waktu nyata sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `chat.send`.

    Smoke langsung maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adaptor browser relay Gateway dengan media mikrofon palsu. Perintah hanya mencetak status penyedia dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal masuk antrean. Klik **Arahkan** pada pesan antrean untuk menyisipkan tindak lanjut tersebut ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Saat run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output yang dibuffer ada.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instal PWA dan push web

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

| Surface                                               | Yang dilakukan                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani peristiwa `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipertahankan.                     |

Override pasangan kunci VAPID melalui env vars pada proses Gateway saat Anda ingin mengunci kunci (untuk deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway yang dibatasi cakupan ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang ada, yang menargetkan pairing mobile native.
</Note>

## Embed ter-hosting

Pesan asisten dapat merender konten web ter-hosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="ketat">
    Menonaktifkan eksekusi skrip di dalam embed ter-hosting.
  </Tab>
  <Tab title="skrip (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="terpercaya">
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
Gunakan `trusted` hanya saat dokumen yang di-embed benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan kanvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat permintaan mengenai loopback dengan header `x-forwarded-*` Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati putaran pairing perangkat; browser tanpa perangkat dan koneksi peran node tetap mengikuti pemeriksaan perangkat normal. Setel `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial rahasia bersama eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, upaya autentikasi gagal untuk IP klien dan cakupan autentikasi yang sama diserialisasi sebelum penulisan batas laju. Karena itu, retry buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua mismatch biasa yang berpacu secara paralel.

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

    Tempel rahasia bersama yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (pada host gateway)

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

    `allowInsecureAuth` hanya toggle kompatibilitas lokal:

    - Ini mengizinkan sesi Control UI localhost untuk berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat remote (non-localhost).

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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang berat. Pulihkan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan proxy tepercaya">
    - Autentikasi proxy tepercaya yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI dengan peran node.
    - Proxy balik loopback host yang sama tetap tidak memenuhi autentikasi proxy tepercaya; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirimkan dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif-protokol ditolak oleh browser dan tidak memicu pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah jalur relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL `data:image/...` inline tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata kanal dihapus di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga kanal yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh sewenang-wenang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya terlindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan autentikasi gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan gateway lainnya.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

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

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna saat Anda ingin menggunakan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, encode nilai `gatewayUrl` sebagai URL agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (bukan tertanam) untuk mencegah clickjacking.
    - Deployment Control UI non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat mengisi origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol ketat. Itu berarti mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
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

- [Dashboard](/id/web/dashboard) — dashboard gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

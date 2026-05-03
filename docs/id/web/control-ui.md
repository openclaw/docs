---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda ingin akses Tailnet tanpa terowongan SSH
sidebarTitle: Control UI
summary: Antarmuka kontrol berbasis browser untuk Gateway (obrolan, node, konfigurasi)
title: Antarmuka Kontrol
x-i18n:
    generated_at: "2026-05-03T09:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Auth disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL Gateway yang dipilih; kata sandi tidak disimpan. Onboarding biasanya menghasilkan token Gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pemasangan perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pemasangan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tanpa izin.

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

Jika browser mencoba ulang pemasangan dengan detail auth yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati alur pemasangan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berpindah browser atau menghapus data browser akan memerlukan pemasangan ulang.

</Note>

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau disimpan di sisi server selain metadata kepenulisan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berpindah browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan Gateway hanya di browser lokal dan tidak pernah melakukan round-trip melalui `config.patch`. Field config bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti Gateway terskrip atau dasbor kustom).

## Endpoint config runtime

UI Kontrol mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint itu dijaga oleh auth Gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi Gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya saat pemuatan pertama berdasarkan locale browser Anda. Untuk menggantinya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan ulang pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk set locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs dari Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publish; keduanya mungkin belum muncul di pemilih tersebut sampai Mintlify mendukung kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [tema tweakcn](https://tweakcn.com/themes), pilih atau buat tema, klik **Bagikan**, dan tempel tautan tema yang disalin ke Tampilan. Importer juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke config Gateway dan tidak disinkronkan lintas perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Bicara">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai terbatas melalui WebSocket, dan Plugin suara realtime khusus backend menggunakan transport relay Gateway. Relay menjaga kredensial penyedia tetap di Gateway sementara browser melakukan stream PCM mikrofon melalui RPC `talk.realtime.relay*` dan mengirim tool call `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw terkonfigurasi yang lebih besar.
    - Streaming tool call + kartu output tool live di Chat (event agen).

  </Accordion>
  <Accordion title="Channel, instance, sesi, dream">
    - Channel: status channel bawaan plus channel Plugin bundel/eksternal, login QR, dan config per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: daftar + override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat run (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist Gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga base-hash untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirim; ref aktif terkirim yang belum terselesaikan ditolak sebelum penulisan.
    - Schema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, hint UI yang cocok, ringkasan anak langsung, metadata docs pada node object/wildcard/array/composition bersarang, plus schema Plugin + channel jika tersedia); editor JSON mentah hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, UI Kontrol memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor JSON mentah "Reset ke tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan saat snapshot dapat melakukan round-trip dengan aman.
    - Nilai object SecretRef terstruktur dirender read-only dalam input teks formulir untuk mencegah korupsi object-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log: live tail log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah terhubung ulang untuk memverifikasi versi Gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, delivery default ke ringkasan pengumuman. Anda dapat beralih ke none jika menginginkan run hanya internal.
    - Field channel/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL Webhook HTTP(S) yang valid.
    - Untuk job sesi utama, mode delivery webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup delete-after-run, hapus override agen, opsi cron exact/stagger, override model/thinking agen, dan toggle delivery best-effort.
    - Validasi formulir bersifat inline dengan error tingkat field; nilai tidak valid menonaktifkan tombol simpan hingga diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback usang: job legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung melakukan ack dengan `{ runId, status: "started" }` dan respons mengalir melalui event `chat`.
    - Unggahan chat menerima gambar serta file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan di riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya untuk keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/yang dihasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada di respons riwayat chat.
    - `chat.history` juga menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
    - Selama pengiriman aktif dan refresh riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sebentar mengembalikan snapshot lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman channel).
    - Pemilih model header chat dan thinking segera mem-patch sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi pengiriman hanya satu giliran.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti New Chat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan autentikasi yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway baru menunjukkan tekanan konteks tinggi, area penyusun chat menampilkan pemberitahuan konteks dan, pada tingkat compaction yang direkomendasikan, tombol ringkas yang menjalankan jalur compaction sesi normal. Snapshot token usang disembunyikan sampai Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, atau konfigurasikan Google dengan `talk.provider: "google"` plus `talk.providers.google.apiKey`; konfigurasi provider realtime Voice Call masih dapat digunakan kembali sebagai fallback. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token autentikasi Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi tool dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos jembatan realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.realtime.session` tidak menerima override instruksi yang disediakan pemanggil.

    Di penyusun Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status penyusun menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan tool realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `chat.send`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token-terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat rahasia.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal akan mengantre. Klik **Steer** pada pesan antrean untuk menyuntikkan tindak lanjut tersebut ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar band.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif bagi sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Saat run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output buffer ada.
    - Entri yang dipertahankan menyertakan metadata pembatalan agar konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan push web

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat memasangnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terpasang dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

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

Control UI menggunakan metode Gateway yang dibatasi scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang ada, yang menargetkan pairing mobile native.
</Note>

## Embed yang di-host

Pesan asisten dapat merender konten web yang di-host secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed yang di-host.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang memang membutuhkan hak istimewa lebih kuat.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game yang dihasilkan agen dan kanvas interaktif, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

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
  <Tab title="Tailscale Serve terintegrasi (disarankan)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerimanya saat permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati putaran pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, percobaan auth gagal untuk IP klien dan scope auth yang sama diserialkan sebelum penulisan batas laju. Karena itu, percobaan ulang buruk serentak dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua mismatch biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal tidak tepercaya dapat berjalan pada host tersebut, wajibkan auth token/password.
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

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
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

    `allowInsecureAuth` hanya merupakan toggle kompatibilitas lokal:

    - Ini memungkinkan sesi Control UI localhost untuk berlanjut tanpa identitas perangkat dalam konteks HTTP yang tidak aman.
    - Ini tidak melewati pemeriksaan pemasangan.
    - Ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

  </Accordion>
  <Accordion title="Hanya untuk keadaan darurat">
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang serius. Pulihkan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan proxy tepercaya">
    - Autentikasi proxy tepercaya yang berhasil dapat menerima sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI dengan peran node.
    - Proxy balik loopback host yang sama tetap tidak memenuhi autentikasi proxy tepercaya; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI disertai kebijakan `img-src` yang ketat: hanya aset **asal yang sama**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak memicu pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah jalur relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus oleh helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi Gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

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

Kemudian arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari asal HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, lakukan URL-encode pada nilai `gatewayUrl` agar browser mem-parse string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Param kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` disetel, UI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI non-loopback harus menyetel `gateway.controlUi.allowedOrigins` secara eksplisit (asal lengkap). Ini mencakup penyiapan dev jarak jauh.
    - Startup Gateway dapat menanam asal lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi asal browser jarak jauh tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol ketat. Itu berarti mengizinkan asal browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback asal header Host, tetapi ini adalah mode keamanan yang berbahaya.

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

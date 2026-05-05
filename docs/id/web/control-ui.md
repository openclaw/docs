---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa terowongan SSH
sidebarTitle: Control UI
summary: Antarmuka kontrol berbasis peramban untuk Gateway (obrolan, Node, konfigurasi)
title: Antarmuka Kontrol
x-i18n:
    generated_at: "2026-05-05T06:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi satu halaman kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Ia berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Auth disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipertahankan. Onboarding biasanya menghasilkan token gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Penyandingan perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan penyandingan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

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

Jika browser sudah disandingkan dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan pulang-pergi penyandingan untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berganti browser atau menghapus data browser akan memerlukan penyandingan ulang.

</Note>

## Identitas personal (lokal browser)

Control UI mendukung identitas personal per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipertahankan di sisi server di luar metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berganti browser akan mengosongkannya kembali.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan gateway hanya pada browser lokal dan tidak pernah pulang-pergi melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dasbor khusus).

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint itu dijaga oleh auth gateway yang sama dengan permukaan HTTP lainnya: browser yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya saat pemuatan pertama berdasarkan locale browser Anda. Untuk mengesampingkannya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk kumpulan locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs dari Mintlify terbatas pada kode locale yang diterima Mintlify. Docs bahasa Thai (`th`) dan Persia (`fa`) tetap dibuat di repo publikasi; keduanya mungkin tidak muncul di pemilih itu sampai Mintlify mendukung kode tersebut.

## Tema tampilan

Panel Appearance menyimpan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, dan tempel tautan tema yang disalin ke Appearance. Importir juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke konfigurasi gateway dan tidak disinkronkan lintas perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema impor sedang dipilih.

## Yang bisa dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Talk">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Talk melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai terbatas melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Relay menyimpan kredensial penyedia di Gateway sementara browser mengalirkan PCM mikrofon melalui RPC `talk.realtime.relay*` dan mengirim panggilan alat `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw yang dikonfigurasi lebih besar.
    - Streaming panggilan alat + kartu output alat live di Chat (peristiwa agen).

  </Accordion>
  <Accordion title="Kanal, instans, sesi, dreams">
    - Kanal: bawaan plus status kanal plugin bundel/eksternal, login QR, dan konfigurasi per kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Instans: daftar presence + refresh (`system-presence`).
    - Sesi: daftar + override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dreams: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + caps (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan guard base-hash untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim; ref terkirim aktif yang tidak terselesaikan ditolak sebelum penulisan.
    - Render skema + formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child langsung, metadata docs pada node objek bersarang/wildcard/array/komposisi, plus skema plugin + kanal jika tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut.
    - Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan setelah reset saat snapshot dapat melakukan round-trip dengan aman.
    - Nilai objek SecretRef terstruktur dirender read-only dalam input teks formulir untuk mencegah korupsi objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/model + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log peristiwa mencakup timing refresh/RPC Control UI plus entri responsivitas browser untuk frame animasi panjang atau task panjang saat browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail live log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah koneksi ulang untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, pengiriman default-nya adalah mengumumkan ringkasan. Anda dapat beralih ke none jika menginginkan eksekusi internal saja.
    - Field kanal/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` disetel ke URL webhook HTTP(S) yang valid.
    - Untuk job sesi utama, mode pengiriman webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-jalan, hapus override agen, opsi cron exact/stagger, override model/thinking agen, dan toggle pengiriman best-effort.
    - Validasi formulir bersifat inline dengan error tingkat field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Setel `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback usang: job legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

  </Accordion>
</AccordionGroup>

## Perilaku Chat

<AccordionGroup>
  <Accordion title="Semantik pengiriman dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengirim ack dengan `{ runId, status: "started" }` dan respons mengalir melalui peristiwa `chat`.
    - Unggahan chat menerima gambar plus berkas non-video. Gambar mempertahankan path gambar asli; berkas lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Ketika entri transkrip terlalu besar, Gateway dapat memotong bidang teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/hasil generasi dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada di respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong), serta token kontrol model ASCII/lebar penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan penyegaran riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal agar tetap terlihat jika `chat.history` sebentar mengembalikan snapshot yang lebih lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi yang tahan lama. Setelah peristiwa akhir alat, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa agent run, tanpa pengiriman kanal).
    - Header chat menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agen yang dipilih. Mengganti agen hanya menampilkan sesi yang terkait dengan agen tersebut dan kembali ke sesi utama agen tersebut saat belum memiliki sesi dasbor tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan diciutkan saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bagian bawah memulihkan kontrol.
    - Pesan teks-saja duplikat berurutan dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau kanvas tidak diciutkan.
    - Pemilih model dan thinking di header chat langsung menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi pengiriman khusus satu giliran.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dasbor baru yang sama seperti Obrolan Baru. Mengetik `/reset` mempertahankan reset in-place eksplisit Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model terkonfigurasi milik Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus penyedia dengan autentikasi yang dapat digunakan. Katalog penuh tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Ketika laporan penggunaan sesi Gateway baru menunjukkan tekanan konteks tinggi, area composer chat menampilkan pemberitahuan konteks dan, pada level Compaction yang direkomendasikan, tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token usang disembunyikan sampai Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode Talk (realtime browser)">
    Mode Talk menggunakan penyedia suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, atau konfigurasikan Google dengan `talk.provider: "google"` plus `talk.providers.google.apiKey`; konfigurasi penyedia realtime Voice Call tetap dapat digunakan ulang sebagai fallback. Browser tidak pernah menerima kunci API penyedia standar. OpenAI menerima secret klien Realtime sementara untuk WebRTC. Google Live menerima token autentikasi Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat yang dikunci ke dalam token oleh Gateway. Penyedia yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.realtime.session` tidak menerima override instruksi yang diberikan pemanggil.

    Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio terhubung, atau `Asking OpenClaw...` saat panggilan alat realtime sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `chat.send`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status penyedia dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal masuk antrean. Klik **Arahkan** pada pesan antrean untuk menyuntikkan tindak lanjut tersebut ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Saat run dibatalkan, teks asisten parsial tetap dapat ditampilkan di UI.
    - Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika ada output yang di-buffer.
    - Entri yang dipersistenkan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani peristiwa `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah dir state OpenClaw) | Keypair VAPID yang dibuat otomatis dan digunakan untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipersistenkan.                    |

Override keypair VAPID melalui env var pada proses Gateway saat Anda ingin mematok kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway berbatas scope ini untuk mendaftarkan dan menguji langganan browser:

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
  <Tab title="ketat">
    Menonaktifkan eksekusi skrip di dalam embed terhosting.
  </Tab>
  <Tab title="skrip (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="tepercaya">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang memang memerlukan hak istimewa lebih kuat.
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
Gunakan `trusted` hanya ketika dokumen yang disematkan benar-benar memerlukan perilaku same-origin. Untuk sebagian besar game dan kanvas interaktif yang dibuat agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat meng-override-nya tanpa menambal CSS bundel dengan mengatur `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilainya divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang dan persentase biasa seperti `960px` atau `82%`, plus ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (lebih disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Secara default, permintaan Control UI/WebSocket Serve dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` adalah `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya ketika permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati round trip pairing perangkat; browser tanpa perangkat dan koneksi peran node tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, upaya autentikasi yang gagal untuk IP klien dan scope auth yang sama diserialisasi sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, bukan dua mismatch biasa yang berpacu paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal tidak tepercaya dapat berjalan pada host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempelkan rahasia bersama yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP Tidak Aman

Jika Anda membuka dasbor melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- autentikasi UI Kontrol operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- akses darurat `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

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

    - Ini mengizinkan sesi UI Kontrol localhost untuk berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pemasangan.
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
    - Ini **tidak** berlaku untuk sesi UI Kontrol berperan node.
    - Proxy balik local loopback host yang sama tetap tidak memenuhi autentikasi trusted-proxy; lihat [Autentikasi proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

UI Kontrol dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dihasilkan secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak memicu fetch jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI lalu dikonversi menjadi URL `blob:` lokal.
- URL `data:image/...` inline tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh UI Kontrol tetap dirender.
- URL avatar jarak jauh yang dipancarkan oleh metadata kanal dihapus di helper avatar UI Kontrol dan diganti dengan logo/badge bawaan, sehingga kanal yang disusupi atau berbahaya tidak dapat memaksa fetch gambar jarak jauh sewenang-wenang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Autentikasi rute avatar

Saat autentikasi Gateway dikonfigurasi, endpoint avatar UI Kontrol memerlukan token Gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tidak terautentikasi ke kedua rute ditolak (sesuai dengan rute assistant-media terkait). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- UI Kontrol itu sendiri meneruskan token Gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan autentikasi Gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, selaras dengan Gateway lainnya.

## Autentikasi rute media asisten

Saat autentikasi Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator UI Kontrol normal. Browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi ke path sumber yang tepat tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi Gateway aktif. Tiket kedaluwarsa dengan cepat dan tidak dapat mengotorisasi sumber yang berbeda.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media bawaan browser tanpa menaruh kredensial Gateway yang dapat digunakan ulang di URL media yang terlihat.

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

## Debugging/pengujian: server dev + Gateway jarak jauh

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan bisa berbeda dari origin HTTP. Ini berguna saat Anda ingin server dev Vite berjalan lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, encode nilai `gatewayUrl` sebagai URL agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Param kueri lama `?token=` masih diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (bukan disematkan) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev jarak jauh.
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

- [Dasbor](/id/web/dashboard) — dasbor Gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan Gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

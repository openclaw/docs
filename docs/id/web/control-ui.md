---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (chat, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-07-04T20:44:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- bawaan: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada ikatan LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi masih dapat memblokir URL LAN yang diiklankan meskipun `127.0.0.1` berfungsi pada host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidaksesuaian profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Autentikasi disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dashboard menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipertahankan. Onboarding biasanya menghasilkan token gateway untuk autentikasi shared-secret pada koneksi pertama, tetapi autentikasi kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

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

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak akan memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi token dan pencabutan.

Agen Paperclip yang terhubung melalui adapter `openclaw_gateway` menggunakan alur persetujuan penggunaan pertama yang sama. Setelah percobaan koneksi awal, jalankan `openclaw devices approve --latest` untuk meninjau permintaan tertunda, lalu jalankan ulang perintah `openclaw devices approve <requestId>` yang dicetak untuk menyetujuinya. Berikan nilai `--url` dan `--token` eksplisit untuk gateway jarak jauh. Agar persetujuan tetap stabil di antara mulai ulang, konfigurasikan `adapterConfig.devicePrivateKeyPem` persisten di Paperclip alih-alih membiarkannya menghasilkan identitas perangkat sementara baru setiap kali dijalankan.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan bolak-balik pemasangan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Ikatan Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berpindah browser atau menghapus data browser akan memerlukan pemasangan ulang.

</Note>

## Pasangkan perangkat seluler

Administrator yang sudah dipasangkan dapat membuat QR koneksi iOS/Android tanpa
membuka terminal:

<Steps>
  <Step title="Buka pemasangan seluler">
    Pilih **Node**, lalu klik **Pasangkan perangkat seluler** di kartu **Perangkat**.
  </Step>
  <Step title="Hubungkan ponsel">
    Di aplikasi seluler OpenClaw, buka **Pengaturan** → **Gateway** dan pindai kode QR
    tersebut. Anda juga dapat menyalin dan menempelkan kode penyiapan sebagai gantinya.
  </Step>
  <Step title="Konfirmasi koneksi">
    Aplikasi iOS/Android resmi terhubung secara otomatis. Jika **Perangkat** menampilkan
    permintaan tertunda, tinjau peran dan cakupannya sebelum menyetujuinya.
  </Step>
</Steps>

Pembuatan kode penyiapan memerlukan `operator.admin`; tombol dinonaktifkan untuk
sesi yang tidak memilikinya. Kode penyiapan berisi kredensial bootstrap berumur pendek,
jadi perlakukan QR dan kode yang disalin seperti kata sandi selama masih valid. Untuk
pemasangan jarak jauh, Gateway harus terselesaikan ke `wss://` (misalnya, melalui Tailscale
Serve/Funnel); `ws://` biasa terbatas pada loopback dan alamat LAN privat.
Lihat [Pemasangan](/id/channels/pairing#pair-from-the-control-ui-recommended) untuk
detail keamanan dan fallback lengkap.

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dibatasi ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipertahankan di sisi server selain metadata kepenulisan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berpindah browser akan mengatur ulangnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan gateway hanya pada browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Bidang konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis bidang tersebut secara langsung (seperti gateway berskrip atau dashboard kustom).

## Endpoint konfigurasi runtime

UI Kontrol mengambil pengaturan runtime dari `/control-ui-config.json`, yang diselesaikan relatif terhadap path dasar UI Kontrol gateway (misalnya `/__openclaw__/control-ui-config.json` saat UI disajikan di bawah `/__openclaw__/`). Endpoint tersebut dibatasi oleh autentikasi gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya pada pemuatan pertama berdasarkan locale browser Anda. Untuk menggantinya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan ulang pada kunjungan mendatang.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dihasilkan untuk set locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persia (`fa`) tetap dihasilkan di repo publish; keduanya mungkin belum muncul di pemilih tersebut sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, dan tempel tautan tema yang disalin ke Tampilan. Pengimpor juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema bawaan seperti `amethyst-haze`.

Tampilan juga menyertakan pengaturan Ukuran teks lokal browser. Pengaturan ini disimpan bersama preferensi UI Kontrol lainnya, diterapkan pada teks chat, teks composer, kartu tool, dan sidebar chat, serta menjaga input teks minimal 16px agar Safari seluler tidak melakukan zoom otomatis saat fokus.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukan (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Bicara">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan sehingga sesi besar tidak memaksa browser merender payload transkrip lengkap sebelum chat dapat digunakan.
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai terbatas melalui WebSocket, dan Plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider milik klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay menjaga kredensial provider di Gateway sementara browser melakukan streaming PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan pengarahan suara active-run melalui `talk.client.steer` atau `talk.session.steer`.
    - Streaming panggilan tool + kartu output tool langsung di Chat (peristiwa agen).
    - Tab aktivitas dengan ringkasan lokal browser, redaction-first, dari aktivitas tool langsung dari pengiriman peristiwa `session.tool` / tool yang ada.

  </Accordion>
  <Accordion title="Channel, instans, sesi, mimpi">
    - Channel: status channel bawaan plus Plugin channel bundled/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melampaui anggaran UI-nya.
    - Instans: daftar kehadiran + penyegaran (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara bawaan, menyematkan sesi yang sering digunakan, mengganti namanya, mengarsipkan atau memulihkan sesi tidak aktif, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`). Sesi yang disematkan diurutkan di atas sesi terbaru yang tidak disematkan; sesi yang diarsipkan berada di tampilan arsip halaman Sesi dan mempertahankan transkripnya.
    - Mimpi: status dreaming, toggle aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: cantumkan/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: cantumkan + kapabilitas (`node.list`), buat kode penyiapan seluler, dan setujui pemasangan perangkat (`device.pair.*`).
    - Persetujuan exec: edit daftar izin gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP memiliki halaman pengaturan khusus untuk server yang dikonfigurasi, pengaktifan, ringkasan OAuth/filter/paralel, perintah operator umum, dan editor konfigurasi `mcp` berskala.
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga hash dasar untuk mencegah penimpaan edit serentak.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim; ref aktif yang dikirim dan tidak terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder tersunting usang yang tidak dapat dipulihkan dari konfigurasi tersimpan sambil mempertahankan nilai tersunting yang masih dipetakan ke rahasia tersimpan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung, metadata docs pada node objek bersarang/wildcard/array/komposisi, plus skema plugin + channel bila tersedia); editor JSON mentah hanya tersedia ketika snapshot memiliki round-trip mentah yang aman.
    - Jika sebuah snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor JSON mentah "Reset ke tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan setelah reset ketika snapshot dapat melakukan round-trip dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah kerusakan objek-menjadi-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log peristiwa menyertakan waktu refresh/RPC Control UI, waktu render chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau tugas panjang ketika browser mengekspos jenis entri PerformanceObserver tersebut.
    - Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah tersambung kembali untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, pengiriman defaultnya mengumumkan ringkasan. Anda dapat beralih ke tidak ada jika menginginkan run internal saja.
    - Field channel/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode pengiriman webhook dan tidak ada tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-run, hapus override agent, opsi cron persis/tersebar, override model/thinking agent, dan toggle pengiriman best-effort.
    - Validasi formulir bersifat inline dengan error tingkat field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback usang: jalankan `openclaw doctor --fix` untuk memigrasikan pekerjaan legacy tersimpan dengan `notify: true` dari `cron.webhook` ke webhook per-pekerjaan eksplisit atau pengiriman penyelesaian.

  </Accordion>
</AccordionGroup>

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` ketika Anda membutuhkan bukti server langsung.

Alur kerja umum:

1. Buka **MCP** dari sidebar.
2. Periksa kartu ringkasan untuk jumlah total, aktif, OAuth, dan server terfilter.
3. Tinjau setiap baris server untuk transport, pengaktifan, auth, filter, timeout, dan petunjuk perintah.
4. Toggle pengaktifan ketika server harus tetap dikonfigurasi tetapi tetap dikeluarkan dari discovery runtime.
5. Edit bagian konfigurasi `mcp` berskala untuk definisi server, header, jalur TLS/mTLS, metadata OAuth, filter tool, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan konfigurasi, atau **Simpan & Publikasikan** ketika Gateway yang berjalan harus menerapkan konfigurasi yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal ketika proses yang diedit membutuhkan diagnostik statis, bukti langsung, atau pembuangan runtime yang di-cache.

Halaman ini menyunting nilai mirip URL yang memuat kredensial sebelum rendering dan mengapit nama server dengan tanda kutip dalam snippet perintah sehingga perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi CLI dan konfigurasi lengkap ada di [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas adalah observer browser-lokal sementara untuk aktivitas tool langsung. Tab ini diturunkan dari stream peristiwa `session.tool` / tool Gateway yang sama yang mendukung kartu tool Chat; tab ini tidak menambahkan keluarga peristiwa Gateway lain, endpoint, penyimpanan aktivitas tahan lama, feed metrik, atau stream observer eksternal.

Entri Aktivitas hanya menyimpan ringkasan yang disanitasi dan pratinjau output yang disunting serta dipotong. Nilai argumen tool tidak disimpan dalam status Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah field argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan saat navigasi di dalam Control UI, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Perilaku Chat

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengirim ack dengan `{ runId, status: "started" }` dan respons mengalir melalui peristiwa `chat`. Klien Control UI tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Upload chat menerima gambar plus file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan di riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Ketika entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Ketika pesan asisten yang terlihat dipotong di `chat.history`, pembaca samping dapat mengambil entri transkrip penuh yang dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif bila diperlukan, dan `messageId` transkrip. Jika Gateway masih tidak dapat mengembalikan lebih banyak, pembaca menampilkan status tidak tersedia yang eksplisit alih-alih diam-diam mengulangi pratinjau yang dipotong.
    - Gambar asisten/tergenerasi dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token acknowledgement heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat final, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sebentar mengembalikan snapshot yang lebih lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi tahan lama. Setelah peristiwa final-tool, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan hanya-UI (tanpa run agent, tanpa pengiriman channel).
    - Sidebar mencantumkan sesi terbaru dengan tindakan Sesi Baru, tautan Semua Sesi, dan tombol pencarian sesi yang membuka pemilih sesi penuh (dibatasi oleh agent yang dipilih, dengan pencarian dan paginasi). Mengganti agent hanya menampilkan sesi yang terikat ke agent tersebut dan fallback ke sesi utama agent itu ketika belum memiliki sesi dashboard tersimpan.
    - Setiap baris pemilih sesi dapat mengganti nama, menyematkan, atau mengarsipkan sesi. Run aktif dan sesi utama agent tidak dapat diarsipkan. Mengarsipkan sesi yang saat ini dipilih mengalihkan Chat kembali ke sesi utama agent tersebut.
    - Pada lebar desktop, kontrol chat tetap berada pada satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan teks-saja duplikat berurutan dirender sebagai satu bubble dengan badge jumlah. Pesan yang membawa gambar, lampiran, output tool, atau pratinjau canvas dibiarkan tidak diciutkan.
    - Pemilih model dan thinking di header chat segera menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim hanya satu giliran.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` sehingga pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti Chat Baru, kecuali ketika `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agent; dalam kasus itu, perintah tersebut mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset di tempat eksplisit Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist itu menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog berskala provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog penuh tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Ketika laporan penggunaan sesi Gateway yang baru menyertakan token konteks saat ini, toolbar composer chat menampilkan ring penggunaan konteks kecil dengan persentase yang digunakan; detail token lengkap ada di tooltip-nya. Ring beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada level Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token usang disembunyikan sampai Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode bicara (browser realtime)">
    Mode bicara menggunakan provider suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus profil auth kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`; profil OAuth OpenAI tidak mengonfigurasi suara Realtime. Konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima secret klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi tool dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Komposer Chat menyertakan tombol opsi Bicara di sebelah tombol mulai/henti Bicara. Opsi berlaku untuk sesi Bicara berikutnya dan dapat menimpa provider, transport, model, voice, reasoning effort, ambang VAD, durasi senyap, dan prefix padding. Ketika sebuah opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default provider. Memilih Gateway relay memaksa jalur relay backend; memilih WebRTC menjaga sesi tetap dimiliki klien dan gagal alih-alih diam-diam beralih ke relay jika provider tidak dapat membuat sesi browser.

    Di komposer Chat, kontrol Bicara adalah tombol gelombang di sebelah tombol dikte mikrofon. Ketika Bicara dimulai, baris status komposer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan alat realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi jembatan WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adaptor browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal akan masuk antrean. Klik **Arahkan** pada pesan yang diantrekan untuk menyuntikkan tindak lanjut itu ke turn yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial saat pembatalan">
    - Ketika run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika ada output yang dibuffer.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI mengirimkan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan ketika tab atau jendela browser tidak terbuka.

Jika halaman menampilkan **Ketidakcocokan protokol** tepat setelah pembaruan OpenClaw, pertama buka ulang dashboard dengan `openclaw dashboard` dan lakukan hard-refresh halaman. Jika masih gagal, hapus data situs untuk origin dashboard atau uji di jendela browser privat; tab lama atau cache service-worker browser dapat terus menjalankan bundle Control UI pra-pembaruan terhadap Gateway yang lebih baru.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah dir state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipertahankan.                     |

Timpa pasangan kunci VAPID melalui env var pada proses Gateway ketika Anda ingin mengunci kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway berbatas scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
</Note>

## Embed yang dihosting

Pesan asisten dapat merender konten web yang dihosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="ketat">
    Menonaktifkan eksekusi skrip di dalam embed yang dihosting.
  </Tab>
  <Tab title="skrip (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="tepercaya">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang memang membutuhkan privilege lebih kuat.
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
Gunakan `trusted` hanya ketika dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game yang dibuat agent dan canvas interaktif, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan Chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat menimpanya tanpa menambal CSS bawaan dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang biasa dan persentase seperti `960px` atau `82%`, plus ekspresi lebar `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)` yang dibatasi.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (disukai)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Serve Control UI/WebSocket dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) ketika `gateway.auth.allowTailscale` adalah `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerimanya ketika permintaan mengenai loopback dengan header `x-forwarded-*` Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati perjalanan bolak-balik pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Setel `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk trafik Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron itu, percobaan autentikasi gagal untuk IP klien dan scope auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, retry buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua mismatch biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Tempel shared secret yang cocok ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host gateway)

<AccordionGroup>
  <Accordion title="Perilaku toggle insecure-auth">
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

    - Ini memungkinkan sesi Control UI localhost berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang parah. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan trusted-proxy">
    - Auth trusted-proxy yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI node-role.
    - Reverse proxy loopback host yang sama tetap tidak memenuhi auth trusted-proxy; lihat [Auth trusted proxy](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` remote dan protocol-relative ditolak oleh browser dan tidak menerbitkan fetch jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk route avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar remote yang dipancarkan oleh metadata channel dikupas di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar remote arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth route avatar

Ketika auth gateway dikonfigurasi, endpoint avatar Control UI mewajibkan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tidak terautentikasi ke salah satu route ditolak (cocok dengan route assistant-media sibling). Ini mencegah route avatar membocorkan identitas agent pada host yang selain itu dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan autentikasi gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan bagian gateway lainnya.

## Autentikasi rute media asisten

Saat autentikasi gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator Control UI normal. Browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi untuk path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber lain.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media bawaan browser tanpa menaruh kredensial gateway yang dapat digunakan kembali di URL media yang terlihat.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

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

## Halaman Control UI kosong

Jika browser memuat dashboard kosong dan DevTools tidak menampilkan error yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan tindakan **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dashboard yang sama setelah perubahan browser.

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan bisa berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, encode URL nilai `gatewayUrl` agar browser mengurai query string dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Param query lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` diatur, UI tidak fallback ke kredensial config atau environment. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela level atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Muatan LAN/Tailnet privat same-origin dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host Tailscale CGNAT diterima tanpa mengaktifkan fallback header Host.
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

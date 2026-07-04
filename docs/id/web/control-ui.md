---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-07-04T18:21:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi satu halaman kecil **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Aplikasi ini berkomunikasi **langsung dengan WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada bind LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi tetap dapat memblokir URL LAN yang diiklankan meskipun `127.0.0.1` berfungsi pada host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidakcocokan profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Auth disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya menghasilkan token gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pairing satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

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

Jika browser mencoba ulang pairing dengan detail auth yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum menyetujui.

Jika browser sudah dipairing dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan rekoneksi diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir rekoneksi yang lebih luas, dan meminta Anda menyetujui set cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

Agen Paperclip yang terhubung melalui adapter `openclaw_gateway` menggunakan alur persetujuan pertama yang sama. Setelah percobaan koneksi awal, jalankan `openclaw devices approve --latest` untuk meninjau permintaan tertunda, lalu jalankan ulang perintah `openclaw devices approve <requestId>` yang dicetak untuk menyetujuinya. Berikan nilai `--url` dan `--token` eksplisit untuk gateway jarak jauh. Agar persetujuan tetap stabil di antara restart, konfigurasikan `adapterConfig.devicePrivateKeyPem` persisten di Paperclip, alih-alih membiarkannya menghasilkan identitas perangkat sementara baru setiap kali berjalan.

<Note>
- Koneksi browser direct local loopback (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati round trip pairing untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berpindah browser atau menghapus data browser akan memerlukan pairing ulang.

</Note>

## Pairing perangkat seluler

Administrator yang sudah dipairing dapat membuat QR koneksi iOS/Android tanpa
membuka terminal:

<Steps>
  <Step title="Buka pairing seluler">
    Pilih **Node**, lalu klik **Pairing perangkat seluler** di kartu **Perangkat**.
  </Step>
  <Step title="Hubungkan ponsel">
    Di aplikasi seluler OpenClaw, buka **Pengaturan** → **Gateway** dan pindai kode QR.
    Anda juga dapat menyalin dan menempelkan kode penyiapan sebagai gantinya.
  </Step>
  <Step title="Konfirmasi koneksi">
    Aplikasi resmi iOS/Android terhubung otomatis. Jika **Perangkat** menampilkan
    permintaan tertunda, tinjau peran dan cakupannya sebelum menyetujuinya.
  </Step>
</Steps>

Membuat kode penyiapan memerlukan `operator.admin`; tombol dinonaktifkan untuk
sesi yang tidak memilikinya. Kode penyiapan berisi kredensial bootstrap berumur pendek,
jadi perlakukan QR dan kode yang disalin seperti kata sandi selama masih valid. Untuk
pairing jarak jauh, Gateway harus resolve ke `wss://` (misalnya, melalui Tailscale
Serve/Funnel); `ws://` biasa dibatasi untuk loopback dan alamat LAN privat.
Lihat [Pairing](/id/channels/pairing#pair-from-the-control-ui-recommended) untuk
detail keamanan dan fallback lengkap.

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dibatasi ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server di luar metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berpindah browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah menimpa identitas yang di-resolve gateway hanya di browser lokal dan tidak pernah melakukan round-trip melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia bagi klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dasbor kustom).

## Endpoint konfigurasi runtime

Control UI mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang di-resolve relatif terhadap path dasar Control UI gateway (misalnya `/__openclaw__/control-ui-config.json` saat UI disajikan di bawah `/__openclaw__/`). Endpoint itu dilindungi oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya pada pemuatan pertama berdasarkan locale browser Anda. Untuk mengubahnya nanti, buka **Ringkasan -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan ulang pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk set locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify dibatasi pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persian (`fa`) tetap dibuat di repo publikasi; keduanya mungkin belum muncul di pemilih tersebut hingga Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, lalu tempel tautan tema yang disalin ke Tampilan. Importer juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tampilan juga menyertakan pengaturan Ukuran teks lokal browser. Pengaturan ini disimpan bersama preferensi Control UI lainnya, diterapkan ke teks chat, teks composer, kartu tool, dan sidebar chat, serta menjaga input teks setidaknya 16px agar Safari seluler tidak melakukan auto-zoom saat fokus.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke konfigurasi gateway dan tidak disinkronkan antar perangkat. Mengganti tema impor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema impor sedang dipilih.

## Yang dapat dilakukan (hari ini)

<AccordionGroup>
  <Accordion title="Chat dan Bicara">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan agar sesi besar tidak memaksa browser merender payload transkrip penuh sebelum chat dapat digunakan.
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider milik klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay menyimpan kredensial provider di Gateway sementara browser men-stream PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan pengarah suara active-run melalui `talk.client.steer` atau `talk.session.steer`.
    - Streaming panggilan tool + kartu output tool live di Chat (event agen).
    - Tab Aktivitas dengan ringkasan lokal browser yang mengutamakan redaksi dari aktivitas tool live dari pengiriman event `session.tool` / tool yang ada.

  </Accordion>
  <Accordion title="Channel, instans, sesi, mimpi">
    - Channel: status channel bawaan plus plugin bundled/eksternal, login QR, dan konfigurasi per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melampaui anggaran UI-nya.
    - Instans: daftar presence + refresh (`system-presence`).
    - Sesi: menampilkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Mimpi: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`), buat kode penyiapan seluler, dan setujui pairing perangkat (`device.pair.*`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP memiliki halaman pengaturan khusus untuk server yang dikonfigurasi, pengaktifan, ringkasan OAuth/filter/paralel, perintah operator umum, dan editor konfigurasi `mcp` bercakupan.
    - Terapkan + mulai ulang dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga hash dasar untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirimkan; ref aktif terkirim yang tidak terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder tersamarkan lama yang tidak dapat dipulihkan dari konfigurasi tersimpan sambil mempertahankan nilai tersamarkan yang masih dipetakan ke rahasia tersimpan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung, metadata docs pada node objek/wildcard/array/komposisi bersarang, plus skema plugin + channel jika tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor Raw JSON "Reset ke yang tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan setelah reset saat snapshot dapat melakukan round-trip dengan aman.
    - Nilai objek SecretRef terstruktur dirender hanya-baca dalam input teks formulir untuk mencegah korupsi objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log peristiwa + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log peristiwa mencakup timing refresh/RPC Control UI, timing render chat/konfigurasi yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau tugas panjang saat browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan paket/git + mulai ulang (`update.run`) dengan laporan mulai ulang, lalu polling `update.status` setelah tersambung ulang untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, pengiriman defaultnya adalah mengumumkan ringkasan. Anda dapat beralih ke tidak ada jika menginginkan eksekusi khusus internal.
    - Field channel/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode pengiriman webhook dan tidak ada tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-jalan, hapus override agen, opsi cron exact/stagger, override model/berpikir agen, dan toggle pengiriman upaya-terbaik.
    - Validasi formulir bersifat inline dengan error tingkat-field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus, jika dihilangkan webhook dikirim tanpa header auth.
    - Fallback usang: jalankan `openclaw doctor --fix` untuk memigrasikan pekerjaan lama yang tersimpan dengan `notify: true` dari `cron.webhook` ke webhook per-pekerjaan eksplisit atau pengiriman penyelesaian.

  </Accordion>
</AccordionGroup>

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP sendiri; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` saat Anda membutuhkan bukti server langsung.

Alur kerja umum:

1. Buka **MCP** dari bilah samping.
2. Periksa kartu ringkasan untuk jumlah total, diaktifkan, OAuth, dan server yang difilter.
3. Tinjau setiap baris server untuk transport, pengaktifan, auth, filter, timeout, dan petunjuk perintah.
4. Alihkan pengaktifan saat server harus tetap dikonfigurasi tetapi tidak ikut dalam penemuan runtime.
5. Edit bagian konfigurasi `mcp` bercakupan untuk definisi server, header, jalur TLS/mTLS, metadata OAuth, filter alat, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan konfigurasi, atau **Simpan & Publikasikan** saat Gateway yang berjalan harus menerapkan konfigurasi yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal saat proses yang diedit membutuhkan diagnostik statis, bukti langsung, atau pembuangan runtime-cache.

Halaman ini menyamarkan nilai mirip-URL yang membawa kredensial sebelum merender dan mengutip nama server dalam cuplikan perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi CLI dan konfigurasi lengkap ada di [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas adalah pengamat lokal-browser sementara untuk aktivitas alat langsung. Tab ini diturunkan dari stream peristiwa Gateway `session.tool` / alat yang sama yang mendukung kartu alat Chat; tab ini tidak menambahkan keluarga peristiwa Gateway, endpoint, penyimpanan aktivitas tahan lama, feed metrik, atau stream pengamat eksternal lain.

Entri Aktivitas hanya menyimpan ringkasan yang disanitasi dan pratinjau output yang disamarkan serta dipotong. Nilai argumen alat tidak disimpan dalam state Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah field argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan selama navigasi dalam Control UI, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengirim ack dengan `{ runId, status: "started" }` dan respons mengalir melalui peristiwa `chat`. Klien Control UI tepercaya juga dapat menerima metadata timing ACK opsional untuk diagnostik lokal.
    - Unggahan Chat menerima gambar plus file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan di riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Saat pesan asisten yang terlihat dipotong di `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang dinormalkan untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif saat diperlukan, dan `messageId` transkrip. Jika Gateway masih tidak dapat mengembalikan lebih banyak, pembaca menampilkan state tidak tersedia yang eksplisit alih-alih mengulang pratinjau yang dipotong secara diam-diam.
    - Gambar asisten/tergenerasi dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag directive inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan-alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan-alat yang terpotong), serta token kontrol model ASCII/lebar-penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat final, tampilan chat menjaga pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sebentar mengembalikan snapshot yang lebih lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Peristiwa `chat` langsung adalah state pengiriman, sementara `chat.history` dibangun ulang dari transkrip sesi tahan lama. Setelah peristiwa final alat, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan peristiwa `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman channel).
    - Bilah samping mencantumkan sesi terbaru dengan aksi Sesi Baru, tautan Semua Sesi, dan tombol pencarian sesi yang membuka pemilih sesi penuh (dibatasi oleh agen yang dipilih, dengan pencarian dan paginasi). Beralih agen hanya menampilkan sesi yang terikat ke agen tersebut dan kembali ke sesi utama agen itu saat belum memiliki sesi dashboard tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada pada satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan berurutan duplikat yang hanya berisi teks dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau kanvas dibiarkan tidak diciutkan.
    - Pemilih model dan berpikir di header chat langsung menambal sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim khusus satu giliran.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti Chat Baru, kecuali saat `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu, tindakan ini mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model Gateway yang dikonfigurasi. Jika `agents.defaults.models` ada, allowlist itu menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog bercakupan-provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway yang baru menyertakan token konteks saat ini, toolbar composer chat menampilkan cincin kecil penggunaan konteks dengan persentase yang digunakan; detail token lengkap ada di tooltip-nya. Cincin beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token lama disembunyikan sampai Gateway melaporkan penggunaan baru lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan penyedia suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus profil auth kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`; profil OAuth OpenAI tidak mengonfigurasi suara Realtime. Konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API penyedia standar. OpenAI menerima rahasia klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat dikunci ke dalam token oleh Gateway. Penyedia yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan soket vendor tetap di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Komposer Chat menyertakan tombol opsi Talk di sebelah tombol mulai/berhenti Talk. Opsi berlaku untuk sesi Talk berikutnya dan dapat mengganti provider, transport, model, voice, reasoning effort, ambang VAD, durasi hening, dan padding prefiks. Saat suatu opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default provider. Memilih relai Gateway memaksa jalur relai backend; memilih WebRTC menjaga sesi tetap dimiliki klien dan gagal alih-alih diam-diam beralih ke relai jika provider tidak dapat membuat sesi browser.

    Di komposer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status komposer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan tool realtime sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke langsung maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser Google Live dengan token terbatas, dan adapter browser relai Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal masuk antrean. Klik **Steer** pada pesan yang mengantre untuk menyuntikkan tindak lanjut itu ke dalam giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk melakukan abort di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk melakukan abort pada semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Saat run di-abort, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway menyimpan teks asisten parsial yang di-abort ke riwayat transkrip saat output yang dibuffer tersedia.
    - Entri yang disimpan menyertakan metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instal PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat memasangnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terpasang dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

Jika halaman menampilkan **Protocol mismatch** tepat setelah pembaruan OpenClaw, pertama buka ulang dashboard dengan `openclaw dashboard` dan lakukan hard-refresh pada halaman. Jika masih gagal, hapus data situs untuk origin dashboard atau uji di jendela browser privat; tab lama atau cache service worker browser dapat terus menjalankan bundle Control UI sebelum pembaruan terhadap Gateway yang lebih baru.

| Surface                                               | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang disimpan.                          |

Ganti pasangan kunci VAPID melalui env var pada proses Gateway saat Anda ingin menetapkan kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway yang dibatasi scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint yang terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relai APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relai) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
</Note>

## Embed yang di-host

Pesan asisten dapat merender konten web yang di-host secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi script di dalam embed yang di-host.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil tetap menjaga isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
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
Gunakan `trusted` hanya saat dokumen yang di-embed benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan canvas interaktif yang dibuat agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan Chat

Pesan Chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat menggantinya tanpa menambal CSS bundle dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

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
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Serve Control UI/WebSocket dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerimanya saat permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve yang terverifikasi ini juga melewati round trip pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Setel `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve async tersebut, upaya auth yang gagal untuk IP klien dan scope auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua mismatch biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host itu, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
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

    - Ini mengizinkan sesi Control UI localhost untuk berjalan tanpa identitas perangkat dalam konteks HTTP tidak aman.
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
    - Auth trusted-proxy yang berhasil dapat menerima sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI node-role.
    - Reverse proxy loopback same-host tetap tidak memenuhi auth trusted-proxy; lihat [auth proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar remote `http(s)` dan protocol-relative ditolak oleh browser dan tidak mengeluarkan fetch jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk route avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar remote yang dikeluarkan oleh metadata channel disaring di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar remote sembarang dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth route avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI membutuhkan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tidak terautentikasi ke salah satu route ditolak (sesuai dengan route assistant-media sibling). Ini mencegah route avatar membocorkan identitas agen pada host yang sebaliknya terlindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan autentikasi Gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tanpa autentikasi, selaras dengan bagian Gateway lainnya.

## Autentikasi rute media asisten

Saat autentikasi Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan autentikasi operator Control UI normal. Browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur singkat yang dibatasi ke path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi Gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber lain.

Ini menjaga perenderan media normal tetap kompatibel dengan elemen media bawaan browser tanpa menaruh kredensial Gateway yang dapat digunakan ulang di URL media yang terlihat.

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

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Halaman Control UI kosong

Jika browser memuat dasbor kosong dan DevTools tidak menunjukkan galat yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan tindakan **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dasbor yang sama setelah perubahan browser.

## Debug/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari asal HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, enkode-URL nilai `gatewayUrl` agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah galat.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proksi HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (asal lengkap). Pemuatan LAN/Tailnet privat dengan asal yang sama dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
    - Startup Gateway dapat mengisi asal lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi asal browser jarak jauh tetap memerlukan entri eksplisit.
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

- [Dasbor](/id/web/dashboard) — dasbor Gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan Gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

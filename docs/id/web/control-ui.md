---
read_when:
    - Anda ingin mengoperasikan Gateway dari peramban
    - Anda ingin akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-07-03T10:00:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah aplikasi satu halaman kecil **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Aplikasi ini berbicara **langsung ke Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada bind LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi masih dapat memblokir URL LAN yang diiklankan meskipun `127.0.0.1` berfungsi di host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidakcocokan profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Auth diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya menghasilkan token gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pemasangan perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pemasangan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tidak sah.

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

Jika browser mencoba ulang pemasangan dengan detail auth yang berubah (role/scopes/public key), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

Agen Paperclip yang terhubung melalui adapter `openclaw_gateway` menggunakan alur persetujuan pertama yang sama. Setelah percobaan koneksi awal, jalankan `openclaw devices approve --latest` untuk meninjau permintaan tertunda, lalu jalankan kembali perintah `openclaw devices approve <requestId>` yang dicetak untuk menyetujuinya. Berikan nilai `--url` dan `--token` eksplisit untuk gateway jarak jauh. Agar persetujuan tetap stabil di antara restart, konfigurasi `adapterConfig.devicePrivateKeyPem` yang persisten di Paperclip alih-alih membiarkannya menghasilkan identitas perangkat sementara baru pada setiap eksekusi.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan bolak-balik pemasangan untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berpindah browser atau menghapus data browser akan memerlukan pemasangan ulang.

</Note>

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dibatasi pada profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata kepenulisan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berpindah browser akan mengaturnya ulang menjadi kosong.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah melapisi identitas yang diselesaikan gateway hanya di browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Field config bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dasbor kustom).

## Endpoint config runtime

Control UI mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang diselesaikan relatif terhadap base path Control UI gateway (misalnya `/__openclaw__/control-ui-config.json` saat UI disajikan di bawah `/__openclaw__/`). Endpoint tersebut dilindungi oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya pada pemuatan pertama berdasarkan locale browser Anda. Untuk menggantinya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dibuat untuk kumpulan locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs dari Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persian (`fa`) tetap dibuat di repo publikasi; keduanya mungkin tidak muncul di pemilih tersebut sampai Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Tampilan menyimpan tema bawaan Claw, Knot, dan Dash, ditambah satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, dan tempel tautan tema yang disalin ke Tampilan. Importer juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tampilan juga mencakup pengaturan Ukuran teks lokal browser. Pengaturan ini disimpan bersama preferensi Control UI lainnya, diterapkan pada teks chat, teks composer, kartu tool, dan sidebar chat, serta menjaga input teks minimal 16px agar Safari seluler tidak melakukan zoom otomatis saat fokus.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke config gateway dan tidak disinkronkan antarperangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukannya (hari ini)

<AccordionGroup>
  <Accordion title="Chat dan Bicara">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Penyegaran riwayat chat meminta jendela terbaru yang dibatasi dengan batas teks per pesan sehingga sesi besar tidak memaksa browser merender payload transkrip penuh sebelum chat dapat digunakan.
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider milik klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay menjaga kredensial provider di Gateway sementara browser mengalirkan PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw yang dikonfigurasi lebih besar, serta merutekan pengarahan suara active-run melalui `talk.client.steer` atau `talk.session.steer`.
    - Streaming panggilan tool + kartu output tool langsung di Chat (event agen).
    - Tab Aktivitas dengan ringkasan lokal browser, redaction-first, dari aktivitas tool langsung dari pengiriman event `session.tool` / tool yang ada.

  </Accordion>
  <Accordion title="Channel, instance, sesi, dream">
    - Channel: status channel bawaan plus plugin bundled/eksternal, login QR, dan config per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Penyegaran probe channel menjaga snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melampaui anggaran UI-nya.
    - Instance: daftar presence + penyegaran (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Cron job: cantumkan/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan permintaan untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP memiliki halaman pengaturan khusus untuk server yang dikonfigurasi, pengaktifan, ringkasan OAuth/filter/paralel, perintah operator umum, dan editor config `mcp` tercakup.
    - Terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan pelindung base-hash untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirim; ref aktif yang dikirim tetapi tidak dapat diselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder yang disunting yang basi dan tidak dapat dipulihkan dari config tersimpan sambil mempertahankan nilai yang disunting yang masih memetakan ke secret tersimpan.
    - Rendering skema + formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, hint UI yang cocok, ringkasan turunan langsung, metadata docs pada node objek nested/wildcard/array/komposisi, plus skema plugin + channel saat tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Formulir dan menonaktifkan mode Raw untuk snapshot tersebut.
    - Editor Raw JSON "Reset ke tersimpan" mempertahankan bentuk yang ditulis secara mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan setelah reset saat snapshot dapat melakukan round-trip dengan aman.
    - Nilai objek SecretRef terstruktur dirender read-only dalam input teks formulir untuk mencegah korupsi objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event mencakup timing penyegaran/RPC Control UI, timing render chat/config yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau task panjang saat browser mengekspos tipe entri PerformanceObserver tersebut.
    - Log: live tail log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart, lalu polling `update.status` setelah tersambung kembali untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel tugas Cron">
    - Untuk tugas terisolasi, pengiriman secara default mengumumkan ringkasan. Anda dapat mengubahnya menjadi none jika menginginkan run khusus internal.
    - Kolom channel/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk tugas sesi utama, mode pengiriman webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-run, hapus override agent, opsi cron exact/stagger, override model/thinking agent, dan toggle pengiriman best-effort.
    - Validasi formulir bersifat inline dengan error tingkat kolom; nilai tidak valid menonaktifkan tombol simpan hingga diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus, jika dihilangkan webhook dikirim tanpa header auth.
    - Fallback yang tidak digunakan lagi: jalankan `openclaw doctor --fix` untuk memigrasikan tugas legacy tersimpan dengan `notify: true` dari `cron.webhook` ke webhook per tugas eksplisit atau pengiriman penyelesaian.

  </Accordion>
</AccordionGroup>

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` saat Anda memerlukan bukti server langsung.

Alur kerja umum:

1. Buka **MCP** dari sidebar.
2. Periksa kartu ringkasan untuk jumlah total, aktif, OAuth, dan server terfilter.
3. Tinjau setiap baris server untuk transport, status aktif, auth, filter, timeout, dan petunjuk perintah.
4. Toggle status aktif saat server harus tetap dikonfigurasi tetapi tidak ikut dalam discovery runtime.
5. Edit bagian konfigurasi `mcp` tercakup untuk definisi server, header, jalur TLS/mTLS, metadata OAuth, filter tool, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk menulis konfigurasi, atau **Simpan & Publikasikan** saat Gateway yang sedang berjalan harus menerapkan konfigurasi yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal saat proses yang diedit memerlukan diagnostik statis, bukti langsung, atau pembuangan cached-runtime.

Halaman ini meredaksi nilai mirip URL yang membawa kredensial sebelum merender dan mengutip nama server dalam snippet perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi CLI dan konfigurasi lengkap ada di [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas adalah pengamat browser-lokal sementara untuk aktivitas tool langsung. Tab ini berasal dari stream event Gateway `session.tool` / tool yang sama yang mendukung kartu tool Chat; tab ini tidak menambahkan keluarga event Gateway lain, endpoint, penyimpanan aktivitas tahan lama, feed metrik, atau stream pengamat eksternal.

Entri aktivitas hanya menyimpan ringkasan yang telah disanitasi serta pratinjau output yang diredaksi dan dipangkas. Nilai argumen tool tidak disimpan dalam status Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah kolom argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan saat navigasi di dalam Control UI, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Perilaku Chat

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung mengirim ack dengan `{ runId, status: "started" }` dan respons mengalir melalui event `chat`. Klien Control UI tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Upload Chat menerima gambar plus file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat sedang berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memangkas kolom teks panjang, menghilangkan blok metadata berat, dan mengganti pesan terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Saat pesan asisten yang terlihat dipangkas dalam `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang telah dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` menggunakan `sessionKey`, `agentId` aktif bila diperlukan, dan `messageId` transkrip. Jika Gateway tetap tidak dapat mengembalikan lebih banyak, pembaca menampilkan status tidak tersedia yang eksplisit alih-alih diam-diam mengulang pratinjau terpangkas.
    - Gambar asisten/yang dihasilkan dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan-tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan-tool terpangkas), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token diam persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat akhir, tampilan chat menjaga pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sebentar mengembalikan snapshot lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` langsung adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi tahan lama. Setelah event tool-final, Control UI memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa run agent, tanpa pengiriman channel).
    - Sidebar mencantumkan sesi terbaru dengan tindakan Sesi Baru, tautan Semua Sesi, dan tombol pencarian sesi yang membuka pemilih sesi lengkap (dicakup oleh agent yang dipilih, dengan pencarian dan paginasi). Mengganti agent hanya menampilkan sesi yang terkait dengan agent tersebut dan fallback ke sesi utama agent tersebut saat belum ada sesi dashboard tersimpan.
    - Pada lebar desktop, kontrol chat tetap dalam satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan teks-saja duplikat berurutan dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output tool, atau pratinjau canvas tidak diciutkan.
    - Pemilih model dan thinking di header chat langsung menambal sesi aktif melalui `sessions.patch`; itu adalah override sesi persisten, bukan opsi kirim satu giliran saja.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti Chat Baru, kecuali saat `session.dmScope: "main"` dikonfigurasi dan parent saat ini adalah sesi utama agent; dalam kasus itu, sesi utama direset di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist itu menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog bercakupan provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway baru menyertakan token konteks saat ini, toolbar composer chat menampilkan cincin kecil penggunaan konteks dengan persentase terpakai; detail token lengkap ada di tooltip-nya. Cincin beralih ke gaya peringatan saat tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token basi disembunyikan hingga Gateway kembali melaporkan penggunaan baru.

  </Accordion>
  <Accordion title="Mode Bicara (waktu nyata browser)">
    Mode Bicara menggunakan provider suara waktu nyata terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus profil auth kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`; profil OAuth OpenAI tidak mengonfigurasi suara Realtime. Konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima secret klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API sekali pakai yang dibatasi untuk sesi WebSocket browser, dengan instruksi dan deklarasi tool dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime disusun oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Composer Chat menyertakan tombol opsi Bicara di sebelah tombol mulai/berhenti Bicara. Opsi berlaku untuk sesi Bicara berikutnya dan dapat meng-override provider, transport, model, suara, reasoning effort, ambang VAD, durasi senyap, dan padding prefiks. Saat opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default provider. Memilih relay Gateway memaksa jalur relay backend; memilih WebRTC menjaga sesi tetap dimiliki klien dan gagal alih-alih diam-diam fallback ke relay jika provider tidak dapat membuat sesi browser.

    Di composer Chat, kontrol Bicara adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Bicara dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan tool realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke langsung maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat run aktif, tindak lanjut normal masuk antrean. Klik **Arahkan** pada pesan antrean untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar band.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif bagi sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial abort">
    - Saat run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output buffer ada.
    - Entri yang dipersistenkan menyertakan metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

Control UI mengirimkan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

Jika halaman menampilkan **Ketidakcocokan protokol** tepat setelah pembaruan OpenClaw, pertama buka ulang dasbor dengan `openclaw dashboard` dan lakukan hard-refresh pada halaman. Jika masih gagal, hapus data situs untuk origin dasbor atau uji di jendela browser privat; tab lama atau cache service worker browser dapat tetap menjalankan bundle Control UI pra-pembaruan terhadap Gateway yang lebih baru.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifes PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani peristiwa `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah dir state OpenClaw)  | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipersistenkan.                    |

Timpa pasangan kunci VAPID melalui env var pada proses Gateway saat Anda ingin mematok kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway yang dibatasi cakupan ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` beserta `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint yang terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang sudah ada, yang menargetkan pemasangan native mobile.
</Note>

## Embed yang dihosting

Pesan asisten dapat merender konten web yang dihosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed yang dihosting.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen situs yang sama yang memang membutuhkan privilege lebih kuat.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan kanvas interaktif yang dibuat agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, atur `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat menimpanya tanpa menambal CSS bawaan dengan mengatur `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang dan persentase polos seperti `960px` atau `82%`, ditambah ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Serve Control UI/WebSocket dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerimanya saat permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve yang terverifikasi ini juga melewati round trip pemasangan perangkat; browser tanpa perangkat dan koneksi peran node tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve async tersebut, upaya auth yang gagal untuk IP klien dan cakupan auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk yang bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, bukan dua mismatch polos yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host Gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan di host tersebut, wajibkan auth token/password.
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

Jika Anda membuka dasbor melalui HTTP polos (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` hanyalah toggle kompatibilitas lokal:

    - Ini mengizinkan sesi Control UI localhost untuk berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
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
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan penurunan keamanan yang serius. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Auth trusted-proxy yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI peran node.
    - Reverse proxy loopback host yang sama tetap tidak memenuhi auth trusted-proxy; lihat [Auth proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan relatif protokol ditolak oleh browser dan tidak melakukan fetch jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dikupas di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar jarak jauh arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth Gateway dikonfigurasi, endpoint avatar Control UI membutuhkan token Gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute assistant-media saudara). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya terlindungi.
- Control UI sendiri meneruskan token Gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dasbor.

Jika Anda menonaktifkan auth Gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan Gateway lainnya.

## Auth rute media asisten

Saat auth Gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` membutuhkan auth operator Control UI normal. Browser mengirim token Gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi ke path sumber tepat tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau password Gateway aktif. Tiket kedaluwarsa dengan cepat dan tidak dapat mengotorisasi sumber lain.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menaruh kredensial Gateway yang dapat digunakan ulang di URL media yang terlihat.

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

## Halaman Control UI kosong

Jika browser memuat dasbor kosong dan DevTools tidak menampilkan error yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML polos yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan aksi **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dasbor yang sama setelah perubahan browser.

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan bisa berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite lokal tetapi Gateway berjalan di tempat lain.

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

    Auth satu kali opsional (jika diperlukan):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, encode nilai `gatewayUrl` sebagai URL agar browser mengurai query string dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri lama `?token=` masih diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` diatur, UI tidak melakukan fallback ke kredensial konfigurasi atau environment. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Pemuatan LAN/Tailnet privat dengan origin yang sama dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
    - Startup Gateway dapat melakukan seed origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
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

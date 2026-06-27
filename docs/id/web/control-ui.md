---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (obrolan, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-06-27T18:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI adalah app satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

App ini berbicara **langsung ke Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

Auth diberikan selama WebSocket handshake melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL Gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya membuat token Gateway untuk auth rahasia bersama pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Penyandingan perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan penyandingan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tanpa izin.

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

Jika browser mencoba ulang penyandingan dengan detail auth yang berubah (peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum menyetujui.

Jika browser sudah disandingkan dan Anda mengubahnya dari akses baca menjadi akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan penyambungan ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir penyambungan ulang yang lebih luas, dan meminta Anda menyetujui kumpulan cakupan baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

Agen Paperclip yang terhubung melalui adapter `openclaw_gateway` menggunakan alur persetujuan pertama yang sama. Setelah percobaan koneksi awal, jalankan `openclaw devices approve --latest` untuk melihat pratinjau permintaan tertunda, lalu jalankan kembali perintah `openclaw devices approve <requestId>` yang dicetak untuk menyetujuinya. Berikan nilai `--url` dan `--token` eksplisit untuk Gateway jarak jauh. Agar persetujuan stabil di antara restart, konfigurasikan `adapterConfig.devicePrivateKeyPem` persisten di Paperclip alih-alih membiarkannya membuat identitas perangkat ephemeral baru pada setiap eksekusi.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati putaran penyandingan untuk sesi operator Control UI saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berpindah browser atau menghapus data browser akan memerlukan penyandingan ulang.

</Note>

## Identitas personal (lokal browser)

Control UI mendukung identitas personal per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berpindah browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk penimpaan avatar asisten. Avatar asisten yang diunggah menimpa identitas yang diselesaikan Gateway hanya pada browser lokal dan tidak pernah pulang-pergi melalui `config.patch`. Field config bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti Gateway berskrip atau dasbor kustom).

## Endpoint config runtime

Control UI mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang diselesaikan relatif terhadap path dasar Control UI milik Gateway (misalnya `/__openclaw__/control-ui-config.json` saat UI disajikan di bawah `/__openclaw__/`). Endpoint itu digating oleh auth Gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi Gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya pada pemuatan pertama berdasarkan locale browser Anda. Untuk menimpanya nanti, buka **Ikhtisar -> Akses Gateway -> Bahasa**. Pemilih locale berada di kartu Akses Gateway, bukan di bawah Tampilan.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat malas di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan ulang pada kunjungan berikutnya.
- Kunci terjemahan yang hilang kembali ke bahasa Inggris.

Terjemahan docs dibuat untuk kumpulan locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persian (`fa`) tetap dibuat di repo publikasi; keduanya mungkin belum muncul di pemilih tersebut sampai Mintlify mendukung kode itu.

## Tema tampilan

Panel Tampilan mempertahankan tema bawaan Claw, Knot, dan Dash, plus satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Bagikan**, dan tempel tautan tema yang disalin ke Tampilan. Pengimpor juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Tampilan juga mencakup pengaturan Ukuran teks lokal browser. Pengaturan ini disimpan bersama preferensi Control UI lainnya, berlaku untuk teks obrolan, teks composer, kartu alat, dan sidebar obrolan, serta menjaga input teks minimal 16px agar Safari seluler tidak melakukan zoom otomatis saat fokus.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tidak ditulis ke config Gateway dan tidak disinkronkan antar perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukannya (hari ini)

<AccordionGroup>
  <Accordion title="Obrolan dan Bicara">
    - Mengobrol dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Refresh riwayat obrolan meminta jendela terbaru yang dibatasi dengan batas teks per pesan agar sesi besar tidak memaksa browser merender payload transkrip penuh sebelum obrolan dapat digunakan.
    - Bicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai terbatas melalui WebSocket, dan Plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider yang dimiliki klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay mempertahankan kredensial provider di Gateway sementara browser mengalirkan PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan alat provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan pengarahan suara active-run melalui `talk.client.steer` atau `talk.session.steer`.
    - Mengalirkan panggilan alat + kartu output alat langsung di Obrolan (event agen).
    - Tab aktivitas dengan ringkasan lokal browser yang mengutamakan redaksi dari aktivitas alat langsung dari pengiriman event `session.tool` / alat yang sudah ada.

  </Accordion>
  <Accordion title="Channel, instance, sesi, mimpi">
    - Channel: status channel Plugin bawaan plus bundled/eksternal, login QR, dan config per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Refresh probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melebihi anggaran UI-nya.
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: mencantumkan sesi agen terkonfigurasi secara default, fallback dari kunci sesi agen tidak terkonfigurasi yang basi, dan menerapkan penimpaan model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Mimpi: status Dreaming, toggle aktif/nonaktif, dan pembaca Buku Harian Mimpi (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan kunci API (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist Gateway atau Node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP memiliki halaman pengaturan khusus untuk server yang dikonfigurasi, pengaktifan, ringkasan OAuth/filter/paralel, perintah operator umum, dan editor config `mcp` tercakup.
    - Terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan penjaga hash dasar untuk mencegah penimpaan edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirimkan; ref aktif yang dikirimkan tetapi tidak terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder teredaksi basi yang tidak dapat dipulihkan dari config tersimpan sambil mempertahankan nilai teredaksi yang masih memetakan ke rahasia tersimpan.
    - Skema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan anak langsung, metadata docs pada node objek bersarang/wildcard/array/komposisi, plus skema Plugin + channel saat tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki pulang-pergi mentah yang aman.
    - Jika snapshot tidak dapat melakukan pulang-pergi teks mentah dengan aman, Control UI memaksa mode Formulir dan menonaktifkan mode Mentah untuk snapshot tersebut.
    - Editor Raw JSON "Reset ke tersimpan" mempertahankan bentuk yang ditulis mentah (pemformatan, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan setelah reset saat snapshot dapat melakukan pulang-pergi dengan aman.
    - Nilai objek SecretRef terstruktur dirender baca-saja dalam input teks formulir untuk mencegah korupsi objek-ke-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/kesehatan/model + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event mencakup timing refresh/RPC Control UI, timing render obrolan/config yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau tugas panjang saat browser mengekspos jenis entri PerformanceObserver tersebut.
    - Log: tail langsung log file Gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart, lalu polling `update.status` setelah tersambung ulang untuk memverifikasi versi Gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, pengiriman default-nya adalah mengumumkan ringkasan. Anda dapat mengalihkannya ke none jika menginginkan proses khusus internal.
    - Kolom channel/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` yang diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode pengiriman webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-jalan, hapus override agen, opsi cron tepat/bertahap, override model/thinking agen, dan toggle pengiriman upaya-terbaik.
    - Validasi formulir bersifat inline dengan galat tingkat-kolom; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback yang tidak digunakan lagi: jalankan `openclaw doctor --fix` untuk memigrasikan pekerjaan lama tersimpan dengan `notify: true` dari `cron.webhook` ke webhook per-pekerjaan eksplisit atau pengiriman penyelesaian.

  </Accordion>
</AccordionGroup>

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit konfigurasi tersimpan, lalu gunakan `openclaw mcp doctor --probe` saat Anda membutuhkan bukti server live.

Alur kerja umum:

1. Buka **MCP** dari bilah samping.
2. Periksa kartu ringkasan untuk jumlah server total, diaktifkan, OAuth, dan terfilter.
3. Tinjau setiap baris server untuk transport, status aktif, auth, filter, timeout, dan petunjuk perintah.
4. Toggle status aktif saat sebuah server harus tetap dikonfigurasi tetapi tidak ikut dalam penemuan runtime.
5. Edit bagian konfigurasi `mcp` yang terscope untuk definisi server, header, jalur TLS/mTLS, metadata OAuth, filter alat, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan konfigurasi, atau **Simpan & Terbitkan** saat Gateway yang sedang berjalan harus menerapkan konfigurasi yang berubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal saat proses yang diedit membutuhkan diagnostik statis, bukti live, atau pembuangan runtime yang di-cache.

Halaman ini menyunting nilai mirip URL yang membawa kredensial sebelum dirender dan mengutip nama server dalam cuplikan perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi lengkap CLI dan konfigurasi ada di [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas adalah pengamat sementara lokal-browser untuk aktivitas alat live. Tab ini diturunkan dari stream event Gateway `session.tool` / tool yang sama yang mendukung kartu alat Chat; tab ini tidak menambahkan keluarga event Gateway, endpoint, penyimpanan aktivitas tahan lama, feed metrik, atau stream pengamat eksternal lain.

Entri Aktivitas hanya menyimpan ringkasan yang disanitasi serta pratinjau output yang disunting dan dipotong. Nilai argumen alat tidak disimpan dalam status Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah kolom argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan saat navigasi di dalam Control UI, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Perilaku Chat

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: ia langsung meng-ack dengan `{ runId, status: "started" }` dan respons mengalir melalui event `chat`. Klien Control UI tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Upload Chat menerima gambar plus file non-video. Gambar mempertahankan jalur gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong kolom teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Saat pesan asisten yang terlihat dipotong di `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif saat diperlukan, dan `messageId` transkrip. Jika Gateway masih tidak dapat mengembalikan lebih banyak, pembaca menampilkan status tidak tersedia yang eksplisit alih-alih diam-diam mengulang pratinjau yang dipotong.
    - Gambar asisten/terhasilkan dipertahankan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap berada dalam respons riwayat chat.
    - Saat merender `chat.history`, Control UI menghapus tag direktif inline khusus-tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan alat teks polos (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang dipotong), serta token kontrol model ASCII/lebar-penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat akhir, tampilan chat menjaga pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sebentar mengembalikan snapshot lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` live adalah status pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi tahan lama. Setelah event tool-final, Control UI memuat ulang riwayat dan hanya menggabungkan tail optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus-UI (tanpa run agen, tanpa pengiriman channel).
    - Header chat menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi di-scope oleh agen yang dipilih. Mengganti agen hanya menampilkan sesi yang terikat ke agen tersebut dan fallback ke sesi utama agen itu saat belum memiliki sesi dashboard tersimpan.
    - Pada lebar desktop, kontrol chat tetap berada dalam satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir naik, kembali ke atas, atau mencapai bawah memulihkan kontrol.
    - Pesan berurutan yang duplikat dan hanya berisi teks dirender sebagai satu gelembung dengan badge jumlah. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau canvas dibiarkan tidak diciutkan.
    - Pemilih model dan thinking di header chat langsung mem-patch sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim khusus satu giliran.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi itu sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Control UI membuat dan beralih ke sesi dashboard baru yang sama seperti Obrolan Baru, kecuali saat `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu, tindakan ini mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset eksplisit di tempat milik Gateway untuk sesi saat ini.
    - Pemilih model chat meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog terscope-provider tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus provider dengan auth yang dapat digunakan. Katalog penuh tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway yang segar menyertakan token konteks saat ini, area composer chat menampilkan indikator penggunaan konteks ringkas. Indikator ini beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada tingkat Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token usang disembunyikan sampai Gateway melaporkan penggunaan segar lagi.

  </Accordion>
  <Accordion title="Mode bicara (waktu nyata browser)">
    Mode bicara menggunakan provider suara waktu nyata terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus profil auth kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`; profil OAuth OpenAI tidak mengonfigurasi suara Realtime. Konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API provider standar. OpenAI menerima secret klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat yang dikunci ke dalam token oleh Gateway. Provider yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan socket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.client.create` tidak menerima override instruksi yang disediakan pemanggil.

    Composer Chat menyertakan tombol opsi Bicara di sebelah tombol mulai/berhenti Bicara. Opsi berlaku untuk sesi Bicara berikutnya dan dapat meng-override provider, transport, model, suara, upaya penalaran, ambang VAD, durasi senyap, dan padding prefiks. Saat opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default provider. Memilih relay Gateway memaksa jalur relay backend; memilih WebRTC mempertahankan sesi sebagai milik klien dan gagal alih-alih diam-diam fallback ke relay jika provider tidak dapat membuat sesi browser.

    Di composer Chat, kontrol Bicara adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Bicara dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan alat realtime sedang berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token-terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status provider dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat sebuah run aktif, tindak lanjut normal masuk antrean. Klik **Arahkan** pada pesan yang mengantre untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa pembatalan mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua run aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial pembatalan">
    - Saat sebuah run dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempertahankan teks asisten parsial yang dibatalkan ke dalam riwayat transkrip saat output yang di-buffer ada.
    - Entri yang dipertahankan menyertakan metadata pembatalan sehingga konsumen transkrip dapat membedakan parsial pembatalan dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instal PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

Jika halaman menampilkan **Ketidakcocokan protokol** tepat setelah pembaruan OpenClaw, pertama buka ulang dashboard dengan `openclaw dashboard` dan hard-refresh halaman. Jika masih gagal, hapus data situs untuk origin dashboard atau uji di jendela browser privat; tab lama atau cache service-worker browser dapat terus menjalankan bundle Control UI pra-pembaruan terhadap Gateway yang lebih baru.

| Permukaan                                             | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifes PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah dir state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipersistenkan.                    |

Timpa pasangan kunci VAPID melalui env vars pada proses Gateway saat Anda ingin mengunci kunci (untuk deployment multi-host, rotasi rahasia, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway yang dibatasi cakupan ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID yang aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
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
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen same-site yang memang memerlukan privilese lebih kuat.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar memerlukan perilaku same-origin. Untuk sebagian besar game dan canvas interaktif yang dibuat agen, `scripts` adalah pilihan yang lebih aman.
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

Nilainya divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang biasa dan persentase seperti `960px` atau `82%`, plus ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

    Secara default, permintaan Control UI/WebSocket Serve dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` adalah `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati perjalanan bolak-balik pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Atur `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial rahasia bersama eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve async tersebut, upaya autentikasi yang gagal untuk IP klien dan cakupan auth yang sama diserialkan sebelum penulisan rate-limit. Retry buruk yang serentak dari browser yang sama karenanya dapat menampilkan `retry later` pada permintaan kedua alih-alih dua ketidakcocokan biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
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
- auth operator Control UI yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- darurat `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` hanyalah toggle kompatibilitas lokal:

    - Ini mengizinkan sesi Control UI localhost untuk berjalan tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat remote (non-localhost).

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
    - Auth trusted-proxy yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI node-role.
    - Reverse proxy loopback same-host tetap tidak memenuhi auth trusted-proxy; lihat [Auth proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirimkan dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar remote `http(s)` dan protocol-relative ditolak oleh browser dan tidak mengeluarkan fetch jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar remote yang dikeluarkan oleh metadata channel dihapus di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar remote arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar di bawah aturan yang sama.
- Permintaan tidak terautentikasi ke salah satu rute ditolak (sesuai rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang sebaliknya dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi agar gambar tetap dirender di dashboard.

Jika Anda menonaktifkan auth gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan gateway lainnya.

## Auth rute media asisten

Saat auth gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` memerlukan auth operator Control UI normal. Browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dicakupkan ke path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau password gateway aktif. Tiket kedaluwarsa dengan cepat dan tidak dapat mengotorisasi sumber berbeda.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menempatkan kredensial gateway yang dapat digunakan ulang dalam URL media yang terlihat.

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

Jika browser memuat dashboard kosong dan DevTools tidak menunjukkan error yang berguna, ekstensi atau skrip konten awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan aksi **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan skrip konten `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dashboard yang sama setelah perubahan browser.

## Debugging/pengujian: server dev + Gateway remote

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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
    - Jika Anda meneruskan endpoint lengkap `ws://` atau `wss://` melalui `gatewayUrl`, enkode URL nilai `gatewayUrl` agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang tidak ada adalah kesalahan.
    - Gunakan `wss://` saat Gateway berada di balik TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak disematkan) untuk mencegah clickjacking.
    - Deployment Control UI publik non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Muatan LAN/Tailnet privat dengan origin yang sama dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
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

- [Dasbor](/id/web/dashboard) — dasbor Gateway
- [Pemeriksaan Kesehatan](/id/gateway/health) — pemantauan kesehatan Gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser

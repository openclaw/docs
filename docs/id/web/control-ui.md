---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis peramban untuk Gateway (chat, aktivitas, node, konfigurasi)
title: UI Kontrol
x-i18n:
    generated_at: "2026-07-02T01:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

UI Kontrol adalah aplikasi satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (mis. `/openclaw`)

Ini berkomunikasi **langsung dengan Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

<Note>
Pada bind LAN Windows native, Windows Firewall atau Group Policy yang dikelola organisasi masih dapat memblokir URL LAN yang diiklankan meskipun `127.0.0.1` berfungsi pada host Gateway. Jalankan `openclaw gateway status --deep` pada host Windows; perintah ini melaporkan port yang kemungkinan diblokir, ketidakcocokan profil, dan aturan firewall lokal yang mungkin diabaikan oleh kebijakan.
</Note>

Auth disediakan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dasbor menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; kata sandi tidak dipersistenkan. Onboarding biasanya menghasilkan token gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Penyandingan perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan penyandingan satu kali**. Ini adalah langkah keamanan untuk mencegah akses tanpa izin.

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

Jika browser mencoba ulang penyandingan dengan detail auth yang berubah (role/scopes/public key), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah disandingkan dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan reconnect diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir reconnect yang lebih luas, dan meminta Anda menyetujui kumpulan scope baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Perangkat](/id/cli/devices) untuk rotasi dan pencabutan token.

Agen Paperclip yang terhubung melalui adapter `openclaw_gateway` menggunakan alur persetujuan run pertama yang sama. Setelah percobaan koneksi awal, jalankan `openclaw devices approve --latest` untuk melihat pratinjau permintaan tertunda, lalu jalankan ulang perintah `openclaw devices approve <requestId>` yang dicetak untuk menyetujuinya. Berikan nilai `--url` dan `--token` eksplisit untuk gateway jarak jauh. Agar persetujuan tetap stabil di antara restart, konfigurasikan `adapterConfig.devicePrivateKeyPem` persisten di Paperclip alih-alih membiarkannya menghasilkan identitas perangkat ephemeral baru pada setiap run.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati perjalanan bolak-balik penyandingan untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menyajikan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga beralih browser atau menghapus data browser akan memerlukan penyandingan ulang.

</Note>

## Identitas pribadi (lokal browser)

UI Kontrol mendukung identitas pribadi per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau dipersistenkan di sisi server di luar metadata kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau beralih browser akan meresetnya menjadi kosong.

Pola lokal browser yang sama berlaku untuk override avatar asisten. Avatar asisten yang diunggah menimpa identitas yang di-resolve gateway hanya pada browser lokal dan tidak pernah bolak-balik melalui `config.patch`. Field config bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway terskrip atau dasbor kustom).

## Endpoint config runtime

UI Kontrol mengambil pengaturan runtime-nya dari `/control-ui-config.json`, yang di-resolve relatif terhadap path dasar UI Kontrol gateway (misalnya `/__openclaw__/control-ui-config.json` saat UI disajikan di bawah `/__openclaw__/`). Endpoint tersebut digating oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan fetch yang berhasil memerlukan token/kata sandi gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya pada pemuatan pertama berdasarkan locale browser Anda. Untuk mengesampingkannya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Terjemahan non-Inggris dimuat secara malas di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Key terjemahan yang hilang fallback ke bahasa Inggris.

Terjemahan docs dihasilkan untuk kumpulan locale non-Inggris yang sama, tetapi pemilih bahasa bawaan situs docs Mintlify terbatas pada kode locale yang diterima Mintlify. Docs Thai (`th`) dan Persian (`fa`) tetap dihasilkan di repo publish; keduanya mungkin tidak muncul di pemilih tersebut hingga Mintlify mendukung kode-kode itu.

## Tema tampilan

Panel Appearance mempertahankan tema bawaan Claw, Knot, dan Dash, plus satu slot impor tweakcn lokal browser. Untuk mengimpor tema, buka [editor tweakcn](https://tweakcn.com/editor/theme), pilih atau buat tema, klik **Share**, dan tempel tautan tema yang disalin ke Appearance. Importer juga menerima URL registry `https://tweakcn.com/r/themes/<id>`, URL editor seperti `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path relatif `/themes/<id>`, ID tema mentah, dan nama tema default seperti `amethyst-haze`.

Appearance juga menyertakan pengaturan Text size lokal browser. Pengaturan ini disimpan bersama preferensi UI Kontrol lainnya, diterapkan ke teks obrolan, teks composer, kartu tool, dan sidebar obrolan, serta mempertahankan input teks setidaknya 16px agar Safari seluler tidak melakukan auto-zoom saat fokus.

Tema yang diimpor hanya disimpan di profil browser saat ini. Tema tersebut tidak ditulis ke config gateway dan tidak disinkronkan lintas perangkat. Mengganti tema yang diimpor memperbarui satu slot lokal; menghapusnya mengalihkan tema aktif kembali ke Claw jika tema yang diimpor sedang dipilih.

## Yang dapat dilakukannya (saat ini)

<AccordionGroup>
  <Accordion title="Obrolan dan Bicara">
    - Mengobrol dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Refresh riwayat obrolan meminta jendela terbaru yang dibatasi dengan batas teks per pesan agar sesi besar tidak memaksa browser merender payload transkrip penuh sebelum obrolan dapat digunakan.
    - Berbicara melalui sesi realtime browser. OpenAI menggunakan WebRTC langsung, Google Live menggunakan token browser sekali pakai yang dibatasi melalui WebSocket, dan plugin suara realtime khusus backend menggunakan transport relay Gateway. Sesi provider yang dimiliki klien dimulai dengan `talk.client.create`; sesi relay Gateway dimulai dengan `talk.session.create`. Relay mempertahankan kredensial provider di Gateway sementara browser melakukan streaming PCM mikrofon melalui `talk.session.appendAudio`, meneruskan panggilan tool provider `openclaw_agent_consult` melalui `talk.client.toolCall` untuk kebijakan Gateway dan model OpenClaw terkonfigurasi yang lebih besar, serta merutekan kendali suara active-run melalui `talk.client.steer` atau `talk.session.steer`.
    - Melakukan streaming panggilan tool + kartu output tool live di Obrolan (event agen).
    - Tab Activity dengan ringkasan lokal browser yang mengutamakan redaksi untuk aktivitas tool live dari pengiriman event `session.tool` / tool yang ada.

  </Accordion>
  <Accordion title="Channel, instance, sesi, mimpi">
    - Channel: status channel bawaan plus plugin bundled/eksternal, login QR, dan config per channel (`channels.status`, `web.login.*`, `config.patch`).
    - Refresh probe channel mempertahankan snapshot sebelumnya tetap terlihat saat pemeriksaan provider yang lambat selesai, dan snapshot parsial diberi label saat probe atau audit melampaui anggaran UI-nya.
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: mencantumkan sesi configured-agent secara default, fallback dari key sesi agen tidak terkonfigurasi yang basi, dan menerapkan override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Mimpi: status dreaming, toggle aktifkan/nonaktifkan, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, persetujuan exec">
    - Job Cron: cantumkan/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat run (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan tanya untuk `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP memiliki halaman pengaturan khusus untuk server terkonfigurasi, enablement, ringkasan OAuth/filter/paralel, perintah operator umum, dan editor config `mcp` yang dicakup.
    - Terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi terakhir yang aktif.
    - Penulisan menyertakan guard base-hash untuk mencegah menimpa edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirimkan; ref aktif yang dikirimkan tetapi tidak terselesaikan ditolak sebelum penulisan.
    - Penyimpanan formulir membuang placeholder teredaksi basi yang tidak dapat dipulihkan dari config tersimpan sambil mempertahankan nilai teredaksi yang masih memetakan ke secret tersimpan.
    - Schema + rendering formulir (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child langsung, metadata docs pada node object/wildcard/array/composition bertingkat, plus schema plugin + channel saat tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki round-trip mentah yang aman.
    - Jika snapshot tidak dapat melakukan round-trip teks mentah dengan aman, UI Kontrol memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut.
    - Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis mentah (formatting, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan setelah reset saat snapshot dapat melakukan round-trip dengan aman.
    - Nilai object SecretRef terstruktur dirender read-only dalam input teks formulir untuk mencegah korupsi object-to-string yang tidak disengaja.

  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/models + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log event menyertakan timing refresh/RPC UI Kontrol, timing render obrolan/config yang lambat, dan entri responsivitas browser untuk frame animasi panjang atau task panjang saat browser mengekspos jenis entri PerformanceObserver tersebut.
    - Log: tail live log file gateway dengan filter/export (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart, lalu poll `update.status` setelah reconnect untuk memverifikasi versi gateway yang berjalan.

  </Accordion>
  <Accordion title="Catatan panel pekerjaan Cron">
    - Untuk pekerjaan terisolasi, pengiriman default mengumumkan ringkasan. Anda dapat beralih ke tidak ada jika menginginkan eksekusi internal saja.
    - Kolom kanal/target muncul saat pengumuman dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL webhook HTTP(S) yang valid.
    - Untuk pekerjaan sesi utama, mode pengiriman webhook dan tidak ada tersedia.
    - Kontrol edit lanjutan mencakup hapus-setelah-eksekusi, hapus penggantian agen, opsi cron eksak/bertahap, penggantian model/pemikiran agen, dan toggle pengiriman upaya terbaik.
    - Validasi formulir bersifat inline dengan error tingkat kolom; nilai yang tidak valid menonaktifkan tombol simpan hingga diperbaiki.
    - Atur `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
    - Fallback usang: jalankan `openclaw doctor --fix` untuk memigrasikan pekerjaan legacy tersimpan dengan `notify: true` dari `cron.webhook` ke webhook per pekerjaan eksplisit atau pengiriman penyelesaian.

  </Accordion>
</AccordionGroup>

## Halaman MCP

Halaman MCP khusus adalah tampilan operator untuk server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Halaman ini tidak memulai transport MCP dengan sendirinya; gunakan untuk memeriksa dan mengedit config tersimpan, lalu gunakan `openclaw mcp doctor --probe` saat Anda memerlukan bukti server live.

Alur kerja umum:

1. Buka **MCP** dari sidebar.
2. Periksa kartu ringkasan untuk jumlah server total, aktif, OAuth, dan terfilter.
3. Tinjau setiap baris server untuk transport, status aktif, auth, filter, timeout, dan petunjuk perintah.
4. Toggle status aktif saat server harus tetap dikonfigurasi tetapi dikeluarkan dari penemuan runtime.
5. Edit bagian config `mcp` terscope untuk definisi server, header, path TLS/mTLS, metadata OAuth, filter alat, dan metadata proyeksi Codex.
6. Gunakan **Simpan** untuk penulisan config, atau **Simpan & Publikasikan** saat Gateway yang berjalan harus menerapkan config yang diubah.
7. Jalankan `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, atau `openclaw mcp reload` dari terminal saat proses yang diedit memerlukan diagnostik statis, bukti live, atau pembuangan runtime cache.

Halaman ini meredaksi nilai mirip URL yang membawa kredensial sebelum dirender dan mengutip nama server dalam cuplikan perintah agar perintah yang disalin tetap berfungsi dengan spasi atau metakarakter shell. Referensi CLI dan config lengkap tersedia di [MCP](/id/cli/mcp).

## Tab Aktivitas

Tab Aktivitas adalah pengamat sementara lokal browser untuk aktivitas alat live. Tab ini diturunkan dari stream event Gateway `session.tool` / alat yang sama yang menggerakkan kartu alat Obrolan; tab ini tidak menambahkan keluarga event Gateway lain, endpoint, penyimpanan aktivitas tahan lama, feed metrik, atau stream pengamat eksternal.

Entri Aktivitas hanya menyimpan ringkasan yang telah disanitasi dan pratinjau output yang direduksi serta dipotong. Nilai argumen alat tidak disimpan dalam state Aktivitas; UI menunjukkan bahwa argumen disembunyikan dan hanya mencatat jumlah kolom argumen. Daftar dalam memori mengikuti tab browser saat ini, bertahan saat navigasi di dalam Antarmuka Kontrol, dan direset saat halaman dimuat ulang, sesi diganti, atau **Hapus**.

## Perilaku obrolan

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung memberi ack dengan `{ runId, status: "started" }` dan respons di-stream melalui event `chat`. Klien Antarmuka Kontrol tepercaya juga dapat menerima metadata waktu ACK opsional untuk diagnostik lokal.
    - Unggahan obrolan menerima gambar plus file non-video. Gambar mempertahankan path gambar native; file lain disimpan sebagai media terkelola dan ditampilkan dalam riwayat sebagai tautan lampiran.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukuran demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong kolom teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Saat pesan asisten yang terlihat dipotong dalam `chat.history`, pembaca samping dapat mengambil entri transkrip lengkap yang dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` berdasarkan `sessionKey`, `agentId` aktif saat diperlukan, dan `messageId` transkrip. Jika Gateway masih tidak dapat mengembalikan lebih banyak, pembaca menampilkan status tidak tersedia yang eksplisit alih-alih diam-diam mengulang pratinjau yang dipotong.
    - Gambar asisten/terhasilkan dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway terautentikasi, sehingga pemuatan ulang tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat obrolan.
    - Saat merender `chat.history`, Antarmuka Kontrol menghapus tag direktif inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan alat yang dipotong), serta token kontrol model ASCII/lebar-penuh yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply` atau token pengakuan Heartbeat `HEARTBEAT_OK`.
    - Selama pengiriman aktif dan refresh riwayat akhir, tampilan obrolan mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sesaat mengembalikan snapshot lama; transkrip kanonis mengganti pesan lokal tersebut setelah riwayat Gateway menyusul.
    - Event `chat` live adalah state pengiriman, sedangkan `chat.history` dibangun ulang dari transkrip sesi tahan lama. Setelah event final alat, Antarmuka Kontrol memuat ulang riwayat dan hanya menggabungkan ekor optimistis kecil; batas transkrip didokumentasikan di [WebChat](/id/web/webchat).
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman kanal).
    - Header obrolan menampilkan filter agen sebelum pemilih sesi, dan pemilih sesi dibatasi oleh agen yang dipilih. Beralih agen hanya menampilkan sesi yang terikat ke agen tersebut dan fallback ke sesi utama agen tersebut saat belum memiliki sesi dashboard tersimpan.
    - Pada lebar desktop, kontrol obrolan tetap berada dalam satu baris ringkas dan menciut saat menggulir turun transkrip; menggulir ke atas, kembali ke bagian atas, atau mencapai bagian bawah memulihkan kontrol.
    - Pesan teks saja duplikat yang berurutan dirender sebagai satu gelembung dengan badge hitungan. Pesan yang membawa gambar, lampiran, output alat, atau pratinjau kanvas dibiarkan tidak diciutkan.
    - Pemilih model dan pemikiran di header obrolan langsung menambal sesi aktif melalui `sessions.patch`; keduanya adalah penggantian sesi persisten, bukan opsi kirim satu giliran saja.
    - Jika Anda mengirim pesan saat perubahan pemilih model untuk sesi yang sama masih disimpan, composer menunggu patch sesi tersebut sebelum memanggil `chat.send` agar pengiriman menggunakan model yang dipilih.
    - Mengetik `/new` di Antarmuka Kontrol membuat dan beralih ke sesi dashboard segar yang sama seperti Obrolan Baru, kecuali saat `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu, tindakan ini mereset sesi utama di tempat. Mengetik `/reset` mempertahankan reset eksplisit Gateway di tempat untuk sesi saat ini.
    - Pemilih model obrolan meminta tampilan model yang dikonfigurasi Gateway. Jika `agents.defaults.models` ada, allowlist tersebut menggerakkan pemilih, termasuk entri `provider/*` yang menjaga katalog terscope penyedia tetap dinamis. Jika tidak, pemilih menampilkan entri eksplisit `models.providers.*.models` plus penyedia dengan auth yang dapat digunakan. Katalog lengkap tetap tersedia melalui RPC debug `models.list` dengan `view: "all"`.
    - Saat laporan penggunaan sesi Gateway yang segar menyertakan token konteks saat ini, area composer obrolan menampilkan indikator penggunaan konteks yang ringkas. Indikator beralih ke gaya peringatan pada tekanan konteks tinggi dan, pada level Compaction yang direkomendasikan, menampilkan tombol ringkas yang menjalankan jalur Compaction sesi normal. Snapshot token usang disembunyikan hingga Gateway melaporkan penggunaan segar lagi.

  </Accordion>
  <Accordion title="Mode bicara (realtime browser)">
    Mode bicara menggunakan penyedia suara realtime terdaftar. Konfigurasikan OpenAI dengan `talk.realtime.provider: "openai"` plus profil auth kunci API `openai`, `talk.realtime.providers.openai.apiKey`, atau `OPENAI_API_KEY`; profil OAuth OpenAI tidak mengonfigurasi suara Realtime. Konfigurasikan Google dengan `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. Browser tidak pernah menerima kunci API penyedia standar. OpenAI menerima secret klien Realtime sementara untuk WebRTC. Google Live menerima token auth Live API terbatas sekali pakai untuk sesi WebSocket browser, dengan instruksi dan deklarasi alat yang dikunci ke dalam token oleh Gateway. Penyedia yang hanya mengekspos bridge realtime backend berjalan melalui transport relay Gateway, sehingga kredensial dan soket vendor tetap berada di sisi server sementara audio browser bergerak melalui RPC Gateway terautentikasi. Prompt sesi Realtime dirakit oleh Gateway; `talk.client.create` tidak menerima penggantian instruksi yang diberikan pemanggil.

    Composer Obrolan menyertakan tombol opsi Bicara di sebelah tombol mulai/henti Bicara. Opsi berlaku untuk sesi Bicara berikutnya dan dapat mengganti penyedia, transport, model, suara, upaya penalaran, ambang VAD, durasi senyap, dan padding prefiks. Saat sebuah opsi kosong, Gateway menggunakan default yang dikonfigurasi jika tersedia atau default penyedia. Memilih relay Gateway memaksa jalur relay backend; memilih WebRTC menjaga sesi dimiliki klien dan gagal alih-alih diam-diam fallback ke relay jika penyedia tidak dapat membuat sesi browser.

    Di composer Obrolan, kontrol Bicara adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Bicara dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio tersambung, atau `Asking OpenClaw...` saat panggilan alat realtime berkonsultasi dengan model lebih besar yang dikonfigurasi melalui `talk.client.toolCall`.

    Smoke live maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` memverifikasi bridge WebSocket backend OpenAI, pertukaran SDP WebRTC browser OpenAI, penyiapan WebSocket browser token terbatas Google Live, dan adapter browser relay Gateway dengan media mikrofon palsu. Perintah ini hanya mencetak status penyedia dan tidak mencatat secret.

  </Accordion>
  <Accordion title="Hentikan dan batalkan">
    - Klik **Hentikan** (memanggil `chat.abort`).
    - Saat eksekusi aktif, tindak lanjut normal masuk antrean. Klik **Arahkan** pada pesan antrean untuk menyuntikkan tindak lanjut tersebut ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa batal mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar jalur.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua eksekusi aktif untuk sesi tersebut.

  </Accordion>
  <Accordion title="Retensi parsial saat batal">
    - Saat eksekusi dibatalkan, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output buffer ada.
    - Entri yang dipersistenkan menyertakan metadata pembatalan agar konsumen transkrip dapat membedakan parsial batal dari output penyelesaian normal.

  </Accordion>
</AccordionGroup>

## Instal PWA dan push web

Antarmuka Kontrol menyertakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

Jika halaman menampilkan **Ketidakcocokan protokol** tepat setelah pembaruan OpenClaw, pertama buka ulang dashboard dengan `openclaw dashboard` dan lakukan hard-refresh halaman. Jika masih gagal, hapus data situs untuk origin dashboard atau uji di jendela browser privat; tab lama atau cache service worker browser dapat terus menjalankan bundle Antarmuka Kontrol pra-pembaruan terhadap Gateway yang lebih baru.

| Permukaan                                            | Fungsinya                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Browser menawarkan "Instal aplikasi" setelah dapat dijangkau. |
| `ui/public/sw.js`                                     | Service worker yang menangani event `push` dan klik notifikasi. |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint langganan browser yang dipersistenkan.                    |

Timpa pasangan kunci VAPID melalui variabel env pada proses Gateway saat Anda ingin menetapkan kunci (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `https://openclaw.ai`)

Control UI menggunakan metode Gateway yang dibatasi scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID yang aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` beserta `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push terpisah dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang ada, yang menargetkan pairing mobile native.
</Note>

## Embed ter-hosting

Pesan asisten dapat merender konten web ter-hosting secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikontrol oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed ter-hosting.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil tetap mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
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
Gunakan `trusted` hanya saat dokumen yang disematkan benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan canvas interaktif yang dibuat agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel `gateway.controlUi.allowExternalEmbedUrls: true`.

## Lebar pesan chat

Pesan chat yang dikelompokkan menggunakan max-width default yang mudah dibaca. Deployment monitor lebar dapat menimpanya tanpa mem-patch CSS bawaan dengan menyetel `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Nilai divalidasi sebelum mencapai browser. Nilai yang didukung mencakup panjang dan persentase biasa seperti `960px` atau `82%`, serta ekspresi lebar terbatas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, dan `fit-content(...)`.

## Akses tailnet (direkomendasikan)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pertahankan Gateway pada loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Secara default, permintaan Control UI/WebSocket Serve dapat mengautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator Control UI dengan identitas perangkat browser, jalur Serve yang terverifikasi ini juga melewati perjalanan bolak-balik pairing perangkat; browser tanpa perangkat dan koneksi node-role tetap mengikuti pemeriksaan perangkat normal. Setel `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk traffic Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, percobaan auth yang gagal untuk IP klien dan scope auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan ulang buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua, alih-alih dua mismatch biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan pada host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempelkan shared secret yang sesuai ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks non-aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian terdokumentasi:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth Control UI operator yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (pada host gateway)

<AccordionGroup>
  <Accordion title="Perilaku toggle auth tidak aman">
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

    - Ini mengizinkan sesi Control UI localhost berjalan tanpa identitas perangkat dalam konteks HTTP non-aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat remote (non-localhost).

  </Accordion>
  <Accordion title="Khusus break-glass">
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
  <Accordion title="Catatan trusted-proxy">
    - Auth trusted-proxy yang berhasil dapat menerima sesi Control UI **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi Control UI node-role.
    - Proxy balik loopback pada host yang sama tetap tidak memenuhi auth trusted-proxy; lihat [Auth proxy tepercaya](/id/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Kebijakan keamanan konten

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar remote `http(s)` dan relatif protokol ditolak oleh browser dan tidak memicu pengambilan jaringan.

Artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan dikonversi menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar remote yang dikeluarkan metadata channel dihapus di helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar remote arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — perilaku ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI mewajibkan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan tidak terautentikasi ke salah satu rute ditolak (sesuai rute assistant-media saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang selebihnya dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob terautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan auth gateway (tidak direkomendasikan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan gateway lainnya.

## Auth rute media asisten

Saat auth gateway dikonfigurasi, pratinjau media lokal asisten menggunakan rute dua langkah:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` mewajibkan auth operator Control UI normal. Browser mengirim token gateway sebagai header bearer saat memeriksa ketersediaan.
- Respons metadata yang berhasil menyertakan `mediaTicket` berumur pendek yang dibatasi untuk path sumber persis tersebut.
- URL gambar, audio, video, dan dokumen yang dirender browser menggunakan `mediaTicket=<ticket>` alih-alih token atau kata sandi gateway aktif. Tiket cepat kedaluwarsa dan tidak dapat mengotorisasi sumber yang berbeda.

Ini menjaga rendering media normal tetap kompatibel dengan elemen media native browser tanpa menaruh kredensial gateway yang dapat digunakan ulang di URL media yang terlihat.

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

Jika browser memuat dashboard kosong dan DevTools tidak menampilkan error yang berguna, ekstensi atau content script awal mungkin telah mencegah aplikasi modul JavaScript dievaluasi. Halaman statis menyertakan panel pemulihan HTML biasa yang muncul saat `<openclaw-app>` tidak terdaftar setelah startup.

Gunakan aksi **Coba lagi** pada panel setelah mengubah lingkungan browser, atau muat ulang secara manual setelah pemeriksaan ini:

- Nonaktifkan ekstensi yang menyuntikkan ke semua halaman, terutama ekstensi dengan content script `<all_urls>`.
- Coba jendela privat, profil browser bersih, atau browser lain.
- Biarkan Gateway tetap berjalan dan verifikasi URL dashboard yang sama setelah perubahan browser.

## Debugging/pengujian: server dev + Gateway remote

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan bisa berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite secara lokal tetapi Gateway berjalan di tempat lain.

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

    Auth satu kali opsional (jika diperlukan):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - Jika Anda meneruskan endpoint `ws://` atau `wss://` lengkap melalui `gatewayUrl`, lakukan enkode URL pada nilai `gatewayUrl` agar browser mengurai string kueri dengan benar.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter kueri lama `?token=` masih diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak melakukan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang tidak ada merupakan kesalahan.
    - Gunakan `wss://` saat Gateway berada di balik TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (bukan disematkan) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback publik harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Pemuatan LAN/Tailnet origin-sama privat dari loopback, RFC1918/link-local, `.local`, `.ts.net`, atau host CGNAT Tailscale diterima tanpa mengaktifkan fallback header Host.
    - Startup Gateway dapat menyemai origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime efektif, tetapi origin browser jarak jauh tetap memerlukan entri eksplisit.
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

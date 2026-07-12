---
description: Real-world OpenClaw projects from the community
read_when:
    - Mencari contoh penggunaan nyata OpenClaw
    - Memperbarui sorotan proyek komunitas
summary: Proyek dan integrasi buatan komunitas yang didukung oleh OpenClaw
title: Etalase
x-i18n:
    generated_at: "2026-07-12T14:43:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Proyek OpenClaw buatan komunitas: alur peninjauan PR, aplikasi seluler, otomatisasi rumah, sistem suara, alat pengembang, dan alur kerja memori, yang dibangun secara natif untuk percakapan di Telegram, WhatsApp, Discord, dan terminal.

<Info>
**Ingin ditampilkan?** Bagikan proyek Anda di [#self-promotion di Discord](https://discord.gg/clawd) atau [tandai @openclaw di X](https://x.com/openclaw).
</Info>

## Terbaru dari Discord

Proyek unggulan terbaru dalam pengodean, alat pengembang, perangkat seluler, dan pengembangan produk yang natif untuk percakapan.

<CardGroup cols={2}>

<Card title="Penerapan HTML instan Dropage" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Beri tahu agen Anda "terapkan HTML ini" dan dapatkan URL publik dalam waktu sekitar satu detik. Halaman kedaluwarsa secara otomatis setelah satu jam — tanpa server, tanpa konfigurasi, tanpa pendaftaran.
</Card>

<Card title="Pemeriksa URL antipenipuan" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Tempelkan URL apa pun dan dapatkan penilaian. Lebih dari 2,5 juta domain penipuan dari 38 umpan (PhishTank, OpenPhish, CERT.PL, dan lainnya), dicocokkan secara lokal sehingga riwayat penelusuran tidak pernah meninggalkan mesin.
</Card>

<Card title="Skills penalaran desain produk" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Tiga perangkat untuk pekerjaan produk: [Dialog Sokratis](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) menguji sebuah pertanyaan secara mendalam sebelum menjawab, [Ahli Strategi Model Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) memilah fitur berdasarkan kelayakannya untuk dipertahankan, dan [Keluaran Agen yang Mudah Dibaca](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) menulis ulang keluaran agen ke dalam bahasa yang lugas.
</Card>

<Card title="Perantara kotak surat untuk subagen" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Mencegah orkestrator menganggur saat subagen bekerja: mekanisme panggilan balik asinkron yang menempatkan hasil di kotak surat alih-alih memblokir agen induk.
</Card>

<Card title="mode ringan untuk mesin dengan RAM rendah" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Menjaga OpenClaw tetap dapat digunakan pada mesin dengan RAM 2–4 GB: memeriksa memori bebas dan memangkas fitur berat sebelum mesin mulai menggunakan ruang swap. [Sumber di GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="pelacak biaya tokenomics" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Pelacak biaya token dari seorang insinyur NVIDIA dengan dukungan kelas satu untuk OpenClaw: lihat secara tepat ke mana pengeluaran agen Anda dialokasikan, per model dan per sesi.
</Card>

<Card title="Generator diagram Excalidraw" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Jelaskan diagram dalam percakapan dan dapatkan sketsa Excalidraw yang dibuat secara terprogram.
</Card>

<Card title="Skill analitik GA4" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Meminta OpenClaw membuat alat kueri Google Analytics miliknya sendiri, lalu mengemas dan menerbitkannya ke ClawHub.
</Card>

<Card title="Peringkat model ClawEval" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Membandingkan model dalam 59 peran agen untuk menjawab "LLM mana yang cocok untuk GPU saya?". Favorit komunitas untuk memilih model lokal.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Pembuatan lagu yang tidak bergantung pada penyedia: rencanakan lagu, susun struktur lirik, dan revisi hasil yang minim alih-alih menggunakan perintah sekali jalan. Menyertakan [varian MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) dengan kontrol BPM, tangga nada, struktur, dan campuran lagu.
</Card>

<Card title="Dari Peninjauan PR ke Umpan Balik Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode menyelesaikan perubahan dan membuka PR, lalu OpenClaw meninjau perbedaannya serta membalas di Telegram dengan saran dan keputusan penggabungan yang jelas.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Umpan balik peninjauan PR OpenClaw yang dikirim melalui Telegram" />
</Card>

<Card title="Skill Gudang Anggur dalam Hitungan Menit" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Meminta "Robby" (@openclaw) membuat skill gudang anggur lokal. Agen meminta contoh ekspor CSV dan jalur penyimpanan, lalu membuat dan menguji skill tersebut (962 botol dalam contoh).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw membuat skill gudang anggur lokal dari CSV" />
</Card>

<Card title="Autopilot Belanja Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Rencana makan mingguan, barang langganan, pemesanan jadwal pengiriman, dan konfirmasi pesanan. Tanpa API, hanya kendali peramban.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Otomatisasi belanja Tesco melalui percakapan" />
</Card>

<Card title="SNAG dari tangkapan layar ke Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Pilih area layar dengan tombol pintas, proses dengan visi Gemini, lalu dapatkan Markdown seketika di papan klip Anda.

  <img src="/assets/showcase/snag.png" alt="Alat SNAG untuk mengubah tangkapan layar menjadi Markdown" />
</Card>

<Card title="Antarmuka Agen" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikasi desktop untuk mengelola Skills dan perintah di berbagai Agen, Claude, Codex, dan OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikasi Antarmuka Agen" />
</Card>

<Card title="Pesan suara Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Komunitas** • `voice` `tts` `telegram`

Membungkus TTS papla.media dan mengirimkan hasil sebagai pesan suara Telegram (tanpa pemutaran otomatis yang mengganggu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Keluaran pesan suara Telegram dari TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Alat bantu yang dipasang melalui Homebrew untuk mencantumkan, memeriksa, dan memantau sesi OpenAI Codex lokal (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor di ClawHub" />
</Card>

<Card title="Kendali Printer 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Kendalikan dan atasi masalah printer BambuLab: status, pekerjaan, kamera, AMS, kalibrasi, dan lainnya.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI di ClawHub" />
</Card>

<Card title="Transportasi Wina (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Keberangkatan waktu nyata, gangguan, status lift, dan perencanaan rute untuk transportasi umum Wina.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien di ClawHub" />
</Card>

<Card title="Makanan sekolah ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Pemesanan makanan sekolah di Inggris secara otomatis melalui ParentPay. Menggunakan koordinat tetikus agar sel tabel dapat diklik secara andal.
</Card>

<Card title="Unggahan R2 (Kirimkan Berkas Saya)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Unggah ke Cloudflare R2/S3 dan buat tautan unduhan aman yang telah ditandatangani sebelumnya. Berguna untuk instans OpenClaw jarak jauh.

  <img src="/assets/showcase/r2-upload.png" alt="Skill unggahan R2 di ClawHub" />
</Card>

<Card title="Aplikasi iOS melalui Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Membuat aplikasi iOS lengkap dengan peta dan perekaman suara, serta menyiapkannya untuk distribusi App Store sepenuhnya melalui percakapan Telegram.
</Card>

<Card title="Asisten kesehatan Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asisten kesehatan AI pribadi yang mengintegrasikan data cincin Oura dengan kalender, janji temu, dan jadwal pusat kebugaran.

  <img src="/assets/showcase/oura-health.png" alt="Asisten kesehatan cincin Oura" />
</Card>

<Card title="Tim Impian Kev (14+ agen)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Lebih dari 14 agen di bawah satu Gateway dengan orkestrator Opus 4.5 yang mendelegasikan tugas kepada pekerja Codex. Lihat [ulasan teknis](https://github.com/adam91holt/orchestrated-ai-articles) dan [Clawdspace](https://github.com/adam91holt/clawdspace) untuk isolasi agen.
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI untuk Linear yang terintegrasi dengan alur kerja agen (Claude Code, OpenClaw). Kelola masalah, proyek, dan alur kerja dari terminal.
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Baca, kirim, dan arsipkan pesan melalui Beeper Desktop. Menggunakan API MCP lokal Beeper agar agen dapat mengelola semua percakapan Anda (iMessage, WhatsApp, dan lainnya) di satu tempat.
</Card>

</CardGroup>

## Otomatisasi dan alur kerja

Penjadwalan, kendali peramban, alur dukungan, dan sisi produk yang "cukup kerjakan tugasnya untuk saya".

<CardGroup cols={2}>

<Card title="Kendali pemurni udara Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code menemukan dan mengonfirmasi kendali pemurni udara, lalu OpenClaw mengambil alih untuk mengelola kualitas udara ruangan.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Kendali pemurni udara Winix melalui OpenClaw" />
</Card>

<Card title="Foto langit yang indah dari kamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Dipicu oleh kamera atap: minta OpenClaw mengambil foto langit setiap kali terlihat indah. OpenClaw merancang skill dan mengambil fotonya.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Potret langit dari kamera atap yang diambil oleh OpenClaw" />
</Card>

<Card title="Adegan pengarahan pagi visual" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Perintah terjadwal menghasilkan satu gambar adegan setiap pagi (cuaca, tugas, tanggal, kiriman atau kutipan favorit) melalui sebuah persona OpenClaw.
</Card>

<Card title="Pemesanan lapangan padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Pemeriksa ketersediaan Playtomic sekaligus CLI pemesanan. Jangan sampai melewatkan lapangan kosong lagi.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Tangkapan layar padel-cli" />
</Card>

<Card title="Penerimaan dokumen akuntansi" icon="file-invoice-dollar">
  **Komunitas** • `automation` `email` `pdf`

Mengumpulkan PDF dari surel dan menyiapkan dokumen untuk konsultan pajak. Akuntansi bulanan berjalan otomatis.
</Card>

<Card title="Mode pengembang sambil bersantai" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Membangun ulang seluruh situs pribadi melalui Telegram sambil menonton Netflix — dari Notion ke Astro, memigrasikan 18 kiriman, serta memindahkan DNS ke Cloudflare. Sama sekali tidak membuka laptop.
</Card>

<Card title="Agen pencarian pekerjaan" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Mencari lowongan pekerjaan, mencocokkannya dengan kata kunci CV, dan mengembalikan peluang yang relevan beserta tautan. Dibuat dalam 30 menit menggunakan API JSearch.
</Card>

<Card title="Pembuat skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw terhubung ke Jira, lalu membuat skill baru secara langsung saat dibutuhkan (sebelum tersedia di ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Mengotomatiskan tugas Todoist dan meminta OpenClaw membuat skill tersebut langsung di percakapan Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Masuk ke TradingView melalui otomatisasi peramban, mengambil tangkapan layar grafik, dan melakukan analisis teknis sesuai permintaan. Tidak memerlukan API — cukup kendali peramban.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Memberi OpenClaw kebebasan menangani dealer mobil: OpenClaw mengurus negosiasi bolak-balik dan berhasil memangkas harga sebesar $4.200.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Menemukan penerbangan berikutnya di surel, menjalankan proses lapor masuk daring, dan memilih kursi dekat jendela — tanpa memerlukan aplikasi maskapai.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Mengajukan klaim asuransi dan menjadwalkan janji temu tindak lanjut secara mandiri.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI API Idealista untuk kueri dan penilaian properti, dikemas sebagai skill agar agen dapat mencari rumah melalui percakapan.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Memantau Gmail untuk pesanan kerja, menganalisis foto properti yang dikirim melalui Telegram, menulis PDF penawaran LaTeX berhalaman banyak, dan membuat faktur melalui Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Memantau kanal Slack perusahaan, memberikan tanggapan yang membantu, dan meneruskan notifikasi ke Telegram. Secara mandiri memperbaiki kutu produksi dalam aplikasi yang telah diterapkan tanpa diminta.
</Card>

</CardGroup>

## Pengetahuan dan memori

Sistem yang mengindeks, mencari, mengingat, dan menalar pengetahuan pribadi atau tim.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mesin pembelajaran bahasa Mandarin dengan umpan balik pelafalan dan alur belajar melalui OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Mengambil 4 juta kiriman dari 100 akun X teratas dan mengubahnya menjadi alur analisis yang dapat dikueri.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Menata hasil pemeriksaan laboratorium darah selama bertahun-tahun ke dalam basis data Notion yang terstruktur.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Asisten harian di WhatsApp dengan seluruh memori disimpan sebagai markdown dalam brankas Obsidian yang dikendalikan versinya: pelacakan kalori dan olahraga, daftar tugas, serta pengelolaan urusan sehari-hari.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Berada dalam percakapan grup keluarga di Telegram, mendokumentasikan kisah dari lebih dari 50 kerabat, dan mengajukan pertanyaan tindak lanjut berdasarkan informasi yang tersedia — dengan tanggapan dalam bahasa Nepali bagi penutur asli.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Komunitas** • `memory` `transcription` `indexing`

Mengimpor seluruh ekspor WhatsApp, mentranskripsikan lebih dari 1.000 catatan suara, melakukan pemeriksaan silang dengan log git, dan menghasilkan laporan markdown yang saling tertaut.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Menambahkan pencarian vektor ke markah Karakeep menggunakan Qdrant beserta embedding OpenAI atau Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Komunitas** • `memory` `beliefs` `self-model`

Pengelola memori terpisah yang mengubah berkas sesi menjadi memori, kemudian keyakinan, lalu model diri yang terus berkembang.
</Card>

</CardGroup>

## Suara dan telepon

Titik masuk yang mengutamakan suara, penghubung telepon, dan alur kerja yang sarat transkripsi.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Satu ketukan pada Pebble Ring memulai percakapan suara dengan OpenClaw — akses ke agen dari perangkat sandang.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Studio media lengkap dalam percakapan: TTS, transkripsi, dan otomatisasi peramban yang terhubung ke Codex 5.2 dan MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Tombol Tindakan iPhone terhubung ke OpenClaw: tekan, bicara, dan agen menjawab seperti radio dua arah.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Penghubung asisten suara Vapi ke HTTP OpenClaw. Panggilan telepon dengan agen Anda dalam waktu hampir nyata.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transkripsi audio multibahasa melalui OpenRouter (Gemini dan lainnya). Tersedia di ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastruktur dan penerapan

Pengemasan, penerapan, dan integrasi yang memudahkan OpenClaw untuk dijalankan dan diperluas.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw yang berjalan di Home Assistant OS dengan dukungan terowongan SSH dan status persisten.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Mengendalikan dan mengotomatiskan perangkat Home Assistant melalui bahasa alami.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Aplikasi bilah menu Swift natif yang menampilkan status agen beserta kendali cepat.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Konfigurasi OpenClaw berbasis Nix yang lengkap untuk penerapan yang dapat direproduksi.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill kalender yang menggunakan khal dan vdirsyncer. Integrasi kalender yang dihosting sendiri.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Rumah dan perangkat keras

Sisi dunia fisik OpenClaw: rumah, sensor, kamera, penyedot debu, dan perangkat lainnya.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw menemukan HomePod di jaringan lokal dan membuat sendiri skill untuk mengendalikannya.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Kubus holografis murah sebagai wajah fisik agen di atas meja.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Otomatisasi rumah natif Nix dengan OpenClaw sebagai antarmuka, ditambah dasbor Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Mengendalikan robot penyedot debu Roborock melalui percakapan alami.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Proyek komunitas

Hal-hal yang berkembang dari satu alur kerja menjadi produk atau ekosistem yang lebih luas.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Komunitas** • `marketplace` `astronomy` `webapp`

Pasar lengkap untuk perlengkapan astronomi. Dibangun dengan dan di sekitar ekosistem OpenClaw.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Negosiasi terbuka antaragen: agen Anda menawar kesepakatan, jadwal, dan perjanjian layanan dengan Node lain serta menandatangani hasilnya secara kriptografis — Anda hanya perlu menyetujui atau menolaknya.
</Card>

</CardGroup>

## Kirim proyek Anda

<Steps>
  <Step title="Share it">
    Kirimkan di [#self-promotion di Discord](https://discord.gg/clawd) atau [buat kiriman X yang menyebut @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Beri tahu kami fungsinya, sertakan tautan ke repositori atau demo, dan bagikan tangkapan layar jika tersedia.
  </Step>
  <Step title="Get featured">
    Kami akan menambahkan proyek yang menonjol ke halaman ini.
  </Step>
</Steps>

## Terkait

- [Memulai](/id/start/getting-started)
- [OpenClaw](/id/start/openclaw)
- [Galeri lengkap X di openclaw.ai](https://openclaw.ai/showcase/)

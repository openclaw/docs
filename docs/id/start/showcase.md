---
description: Real-world OpenClaw projects from the community
read_when:
    - Mencari contoh penggunaan OpenClaw di dunia nyata
    - Memperbarui sorotan proyek komunitas
summary: Proyek dan integrasi buatan komunitas yang didukung oleh OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-24T09:28:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

Proyek OpenClaw bukan demo main-main. Orang-orang mengirim loop review PR, aplikasi seluler, otomasi rumah, sistem suara, devtools, dan alur kerja berat memori dari channel yang sudah mereka gunakan — build native-chat di Telegram, WhatsApp, Discord, dan terminal; otomasi nyata untuk pemesanan, belanja, dan dukungan tanpa menunggu API; serta integrasi dunia fisik dengan printer, vacuum, kamera, dan sistem rumah.

<Info>
**Ingin ditampilkan?** Bagikan proyek Anda di [#self-promotion on Discord](https://discord.gg/clawd) atau [tag @openclaw on X](https://x.com/openclaw).
</Info>

## Video

Mulai di sini jika Anda ingin jalur terpendek dari "apa ini?" ke "oke, saya paham."

<CardGroup cols={3}>

<Card title="Panduan penyiapan lengkap" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 menit. Instal, onboarding, dan sampai ke asisten pertama yang berfungsi secara end-to-end.
</Card>

<Card title="Reel showcase komunitas" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Ringkasan lebih cepat tentang proyek nyata, permukaan, dan alur kerja yang dibangun di sekitar OpenClaw.
</Card>

<Card title="Proyek di alam nyata" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Contoh dari komunitas, mulai dari loop coding native-chat hingga hardware dan otomasi pribadi.
</Card>

</CardGroup>

## Yang terbaru dari Discord

Sorotan terbaru di coding, devtools, seluler, dan pembangunan produk native-chat.

<CardGroup cols={2}>

<Card title="Review PR ke Umpan Balik Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode menyelesaikan perubahan, membuka PR, OpenClaw meninjau diff dan membalas di Telegram dengan saran plus keputusan merge yang jelas.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Umpan balik review PR OpenClaw dikirimkan di Telegram" />
</Card>

<Card title="Skill Gudang Anggur dalam Hitungan Menit" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Meminta "Robby" (@openclaw) untuk skill gudang anggur lokal. Ia meminta contoh ekspor CSV dan path penyimpanan, lalu membangun dan menguji skill tersebut (962 botol dalam contoh).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw membangun skill gudang anggur lokal dari CSV" />
</Card>

<Card title="Autopilot Belanja Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Rencana makan mingguan, langganan tetap, pesan slot pengantaran, konfirmasi pesanan. Tanpa API, hanya kontrol browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Otomasi belanja Tesco melalui chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tombol pintas area layar, visi Gemini, Markdown instan di clipboard Anda.

  <img src="/assets/showcase/snag.png" alt="Alat screenshot-to-markdown SNAG" />
</Card>

<Card title="UI Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikasi desktop untuk mengelola skill dan perintah di Agents, Claude, Codex, dan OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikasi UI Agents" />
</Card>

<Card title="Voice note Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Komunitas** • `voice` `tts` `telegram`

Membungkus TTS papla.media dan mengirim hasil sebagai voice note Telegram (tanpa autoplay yang mengganggu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output voice note Telegram dari TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper yang diinstal via Homebrew untuk mencantumkan, memeriksa, dan memantau sesi OpenAI Codex lokal (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor di ClawHub" />
</Card>

<Card title="Kontrol Printer 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Mengontrol dan men-debug printer BambuLab: status, pekerjaan, kamera, AMS, kalibrasi, dan lainnya.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI di ClawHub" />
</Card>

<Card title="Transportasi Wina (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Keberangkatan realtime, gangguan, status lift, dan routing untuk transportasi umum Wina.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien di ClawHub" />
</Card>

<Card title="Makanan sekolah ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Otomasi pemesanan makan sekolah di UK melalui ParentPay. Menggunakan koordinat mouse untuk klik sel tabel yang andal.
</Card>

<Card title="Upload R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Unggah ke Cloudflare R2/S3 dan hasilkan tautan unduhan presigned yang aman. Berguna untuk instance OpenClaw jarak jauh.
</Card>

<Card title="Aplikasi iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Membangun aplikasi iOS lengkap dengan peta dan perekaman suara, diterapkan ke TestFlight sepenuhnya melalui chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Aplikasi iOS di TestFlight" />
</Card>

<Card title="Asisten kesehatan Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asisten kesehatan AI pribadi yang mengintegrasikan data Oura ring dengan kalender, janji temu, dan jadwal gym.

  <img src="/assets/showcase/oura-health.png" alt="Asisten kesehatan Oura ring" />
</Card>

<Card title="Tim Impian Kev (14+ agen)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agen di bawah satu gateway dengan orkestrator Opus 4.5 yang mendelegasikan ke worker Codex. Lihat [tulisan teknisnya](https://github.com/adam91holt/orchestrated-ai-articles) dan [Clawdspace](https://github.com/adam91holt/clawdspace) untuk sandboxing agen.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI untuk Linear yang terintegrasi dengan alur kerja agentic (Claude Code, OpenClaw). Kelola issue, proyek, dan alur kerja dari terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Baca, kirim, dan arsipkan pesan melalui Beeper Desktop. Menggunakan Beeper local MCP API sehingga agen dapat mengelola semua chat Anda (iMessage, WhatsApp, dan lainnya) di satu tempat.
</Card>

</CardGroup>

## Otomasi dan alur kerja

Penjadwalan, kontrol browser, loop dukungan, dan sisi produk "kerjakan saja tugasnya untuk saya".

<CardGroup cols={2}>

<Card title="Kontrol pembersih udara Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code menemukan dan mengonfirmasi kontrol pembersih udara, lalu OpenClaw mengambil alih untuk mengelola kualitas udara ruangan.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Kontrol pembersih udara Winix melalui OpenClaw" />
</Card>

<Card title="Foto kamera langit yang indah" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Dipicu oleh kamera atap: minta OpenClaw mengambil foto langit kapan pun terlihat indah. Ia merancang skill dan mengambil fotonya.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Snapshot langit dari kamera atap yang diambil oleh OpenClaw" />
</Card>

<Card title="Adegan briefing pagi visual" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Prompt terjadwal menghasilkan satu gambar adegan setiap pagi (cuaca, tugas, tanggal, postingan favorit atau kutipan) melalui persona OpenClaw.
</Card>

<Card title="Pemesanan lapangan padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Pemeriksa ketersediaan Playtomic plus CLI pemesanan. Jangan pernah melewatkan lapangan kosong lagi.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Tangkapan layar padel-cli" />
</Card>

<Card title="Intake akuntansi" icon="file-invoice-dollar">
  **Komunitas** • `automation` `email` `pdf`

Mengumpulkan PDF dari email, menyiapkan dokumen untuk konsultan pajak. Akuntansi bulanan dengan autopilot.
</Card>

<Card title="Mode dev santai di sofa" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Membangun ulang seluruh situs pribadi melalui Telegram sambil menonton Netflix — Notion ke Astro, 18 posting dipindahkan, DNS ke Cloudflare. Tidak pernah membuka laptop.
</Card>

<Card title="Agen pencarian kerja" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Mencari lowongan kerja, mencocokkan dengan kata kunci CV, dan mengembalikan peluang yang relevan dengan tautan. Dibuat dalam 30 menit menggunakan JSearch API.
</Card>

<Card title="Pembuat skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw terhubung ke Jira, lalu menghasilkan skill baru secara langsung (sebelum skill itu ada di ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Mengotomatiskan tugas Todoist dan meminta OpenClaw menghasilkan skill langsung di chat Telegram.
</Card>

<Card title="Analisis TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Masuk ke TradingView melalui otomasi browser, mengambil tangkapan layar grafik, dan melakukan analisis teknikal sesuai permintaan. Tidak perlu API — cukup kontrol browser.
</Card>

<Card title="Auto-support Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Memantau channel Slack perusahaan, merespons dengan membantu, dan meneruskan notifikasi ke Telegram. Secara otonom memperbaiki bug produksi di aplikasi yang sudah diterapkan tanpa diminta.
</Card>

</CardGroup>

## Pengetahuan dan memori

Sistem yang mengindeks, mencari, mengingat, dan menalar atas pengetahuan pribadi atau tim.

<CardGroup cols={2}>

<Card title="Pembelajaran bahasa Mandarin xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mesin pembelajaran bahasa Mandarin dengan umpan balik pengucapan dan alur belajar melalui OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Umpan balik pengucapan xuezh" />
</Card>

<Card title="Brankas memori WhatsApp" icon="vault">
  **Komunitas** • `memory` `transcription` `indexing`

Mengambil seluruh ekspor WhatsApp, mentranskripsikan 1k+ voice note, memeriksa silang dengan git log, menghasilkan laporan markdown yang saling terhubung.
</Card>

<Card title="Pencarian semantik Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Menambahkan pencarian vektor ke bookmark Karakeep menggunakan Qdrant plus embedding OpenAI atau Ollama.
</Card>

<Card title="Memori Inside-Out-2" icon="brain">
  **Komunitas** • `memory` `beliefs` `self-model`

Manajer memori terpisah yang mengubah file sesi menjadi memori, lalu keyakinan, lalu model diri yang terus berkembang.
</Card>

</CardGroup>

## Suara dan telepon

Titik masuk yang mengutamakan ucapan, bridge telepon, dan alur kerja berat transkripsi.

<CardGroup cols={2}>

<Card title="Bridge telepon Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Bridge HTTP asisten suara Vapi ke OpenClaw. Panggilan telepon hampir realtime dengan agen Anda.
</Card>

<Card title="Transkripsi OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transkripsi audio multibahasa melalui OpenRouter (Gemini, dan lainnya). Tersedia di ClawHub.
</Card>

</CardGroup>

## Infrastruktur dan deployment

Packaging, deployment, dan integrasi yang membuat OpenClaw lebih mudah dijalankan dan diperluas.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw berjalan di Home Assistant OS dengan dukungan SSH tunnel dan state persisten.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Kontrol dan otomatiskan perangkat Home Assistant melalui bahasa alami.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Konfigurasi OpenClaw bergaya Nix lengkap untuk deployment yang dapat direproduksi.
</Card>

<Card title="Kalender CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill kalender menggunakan khal dan vdirsyncer. Integrasi kalender self-hosted.
</Card>

</CardGroup>

## Rumah dan hardware

Sisi dunia fisik OpenClaw: rumah, sensor, kamera, vacuum, dan perangkat lainnya.

<CardGroup cols={2}>

<Card title="Otomasi GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Otomasi rumah native Nix dengan OpenClaw sebagai antarmuka, plus dashboard Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana GoHome" />
</Card>

<Card title="Vacuum Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Kontrol robot vacuum Roborock Anda melalui percakapan alami.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status Roborock" />
</Card>

</CardGroup>

## Proyek komunitas

Hal-hal yang berkembang melampaui satu alur kerja menjadi produk atau ekosistem yang lebih luas.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Komunitas** • `marketplace` `astronomy` `webapp`

Marketplace perlengkapan astronomi lengkap. Dibangun dengan dan di sekitar ekosistem OpenClaw.
</Card>

</CardGroup>

## Kirimkan proyek Anda

<Steps>
  <Step title="Bagikan">
    Posting di [#self-promotion on Discord](https://discord.gg/clawd) atau [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Sertakan detail">
    Beri tahu kami apa fungsinya, tautkan ke repo atau demo, dan bagikan tangkapan layar jika Anda punya.
  </Step>
  <Step title="Dapatkan sorotan">
    Kami akan menambahkan proyek unggulan ke halaman ini.
  </Step>
</Steps>

## Terkait

- [Memulai](/id/start/getting-started)
- [OpenClaw](/id/start/openclaw)

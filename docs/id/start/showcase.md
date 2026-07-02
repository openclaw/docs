---
description: Real-world OpenClaw projects from the community
read_when:
    - Mencari contoh penggunaan OpenClaw nyata
    - Memperbarui sorotan proyek komunitas
summary: Proyek dan integrasi buatan komunitas yang didukung oleh OpenClaw
title: Etalase
x-i18n:
    generated_at: "2026-07-02T08:53:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Proyek OpenClaw bukan demo mainan. Orang-orang mengirim loop peninjauan PR, aplikasi seluler, otomasi rumah, sistem suara, devtool, dan alur kerja berat memori dari kanal yang sudah mereka gunakan — build native chat di Telegram, WhatsApp, Discord, dan terminal; otomasi nyata untuk pemesanan, belanja, dan dukungan tanpa menunggu API; serta integrasi dunia fisik dengan printer, vakum, kamera, dan sistem rumah.

<Info>
**Ingin ditampilkan?** Bagikan proyek Anda di [#self-promotion di Discord](https://discord.gg/clawd) atau [tag @openclaw di X](https://x.com/openclaw).
</Info>

## Terbaru dari Discord

Sorotan terbaru di bidang coding, devtool, seluler, dan pembangunan produk native chat.

<CardGroup cols={2}>

<Card title="Umpan Balik Peninjauan PR ke Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode menyelesaikan perubahan, membuka PR, OpenClaw meninjau diff dan membalas di Telegram dengan saran plus putusan merge yang jelas.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Umpan balik peninjauan PR OpenClaw dikirimkan di Telegram" />
</Card>

<Card title="Skill Gudang Anggur dalam Hitungan Menit" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Meminta "Robby" (@openclaw) untuk Skills gudang anggur lokal. Ia meminta contoh ekspor CSV dan path penyimpanan, lalu membangun dan menguji Skills tersebut (962 botol dalam contoh).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw membangun Skills gudang anggur lokal dari CSV" />
</Card>

<Card title="Autopilot Belanja Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Rencana makan mingguan, item rutin, pesan slot pengiriman, konfirmasi pesanan. Tanpa API, hanya kontrol browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Otomasi belanja Tesco melalui chat" />
</Card>

<Card title="SNAG tangkapan layar-ke-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Hotkey wilayah layar, visi Gemini, Markdown instan di clipboard Anda.

  <img src="/assets/showcase/snag.png" alt="Alat SNAG tangkapan layar-ke-markdown" />
</Card>

<Card title="UI Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikasi desktop untuk mengelola Skills dan perintah di Agents, Claude, Codex, dan OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikasi UI Agents" />
</Card>

<Card title="Catatan suara Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Membungkus TTS papla.media dan mengirim hasil sebagai catatan suara Telegram (tanpa autoplay yang mengganggu).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output catatan suara Telegram dari TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper yang diinstal Homebrew untuk mencantumkan, memeriksa, dan memantau sesi OpenAI Codex lokal (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor di ClawHub" />
</Card>

<Card title="Kontrol Printer 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Kendalikan dan pecahkan masalah printer BambuLab: status, pekerjaan, kamera, AMS, kalibrasi, dan lainnya.

  <img src="/assets/showcase/bambu-cli.png" alt="Skills Bambu CLI di ClawHub" />
</Card>

<Card title="Transportasi Wina (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Keberangkatan waktu nyata, gangguan, status lift, dan perutean untuk transportasi umum Wina.

  <img src="/assets/showcase/wienerlinien.png" alt="Skills Wiener Linien di ClawHub" />
</Card>

<Card title="Makan siang sekolah ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Pemesanan makan siang sekolah UK otomatis melalui ParentPay. Menggunakan koordinat mouse untuk mengklik sel tabel secara andal.
</Card>

<Card title="Unggah R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Unggah ke Cloudflare R2/S3 dan hasilkan tautan unduhan presigned yang aman. Berguna untuk instans OpenClaw jarak jauh.

  <img src="/assets/showcase/r2-upload.png" alt="Skills unggah R2 di ClawHub" />
</Card>

<Card title="Aplikasi iOS melalui Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Membangun aplikasi iOS lengkap dengan peta dan perekaman suara, disiapkan untuk distribusi App Store sepenuhnya melalui chat Telegram.
</Card>

<Card title="Asisten kesehatan Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Asisten kesehatan AI pribadi yang mengintegrasikan data cincin Oura dengan kalender, janji temu, dan jadwal gym.

  <img src="/assets/showcase/oura-health.png" alt="Asisten kesehatan cincin Oura" />
</Card>

<Card title="Dream Team Kev (14+ agen)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agen di bawah satu Gateway dengan orkestrator Opus 4.5 yang mendelegasikan ke worker Codex. Lihat [tulisan teknis](https://github.com/adam91holt/orchestrated-ai-articles) dan [Clawdspace](https://github.com/adam91holt/clawdspace) untuk sandboxing agen.
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI untuk Linear yang terintegrasi dengan alur kerja agen (Claude Code, OpenClaw). Kelola issue, proyek, dan alur kerja dari terminal.
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Baca, kirim, dan arsipkan pesan melalui Beeper Desktop. Menggunakan API MCP lokal Beeper sehingga agen dapat mengelola semua chat Anda (iMessage, WhatsApp, dan lainnya) di satu tempat.
</Card>

</CardGroup>

## Otomasi dan alur kerja

Penjadwalan, kontrol browser, loop dukungan, dan sisi produk "lakukan saja tugas ini untuk saya".

<CardGroup cols={2}>

<Card title="Kontrol pemurni udara Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code menemukan dan mengonfirmasi kontrol pemurni, lalu OpenClaw mengambil alih untuk mengelola kualitas udara ruangan.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Kontrol pemurni udara Winix melalui OpenClaw" />
</Card>

<Card title="Jepretan kamera langit yang indah" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Dipicu oleh kamera atap: minta OpenClaw mengambil foto langit setiap kali terlihat indah. OpenClaw merancang Skills dan mengambil fotonya.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Snapshot langit kamera atap yang ditangkap oleh OpenClaw" />
</Card>

<Card title="Adegan briefing pagi visual" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Prompt terjadwal menghasilkan satu gambar adegan setiap pagi (cuaca, tugas, tanggal, postingan atau kutipan favorit) melalui persona OpenClaw.
</Card>

<Card title="Pemesanan lapangan padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Pemeriksa ketersediaan Playtomic plus CLI pemesanan. Jangan pernah melewatkan lapangan yang terbuka lagi.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Tangkapan layar padel-cli" />
</Card>

<Card title="Intake akuntansi" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Mengumpulkan PDF dari email, menyiapkan dokumen untuk konsultan pajak. Akuntansi bulanan berjalan otomatis.
</Card>

<Card title="Mode dev kaum rebahan" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Membangun ulang seluruh situs pribadi melalui Telegram sambil menonton Netflix — Notion ke Astro, 18 postingan dimigrasikan, DNS ke Cloudflare. Tidak pernah membuka laptop.
</Card>

<Card title="Agen pencarian kerja" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Mencari daftar pekerjaan, mencocokkan dengan kata kunci CV, dan mengembalikan peluang relevan dengan tautan. Dibangun dalam 30 menit menggunakan API JSearch.
</Card>

<Card title="Pembuat Skills Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw terhubung ke Jira, lalu menghasilkan Skills baru secara langsung (sebelum ada di ClawHub).
</Card>

<Card title="Skills Todoist melalui Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Mengotomatiskan tugas Todoist dan meminta OpenClaw menghasilkan Skills langsung di chat Telegram.
</Card>

<Card title="Analisis TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Masuk ke TradingView melalui otomasi browser, mengambil tangkapan layar grafik, dan melakukan analisis teknis sesuai permintaan. Tidak perlu API — hanya kontrol browser.
</Card>

<Card title="Dukungan otomatis Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Memantau kanal Slack perusahaan, merespons dengan membantu, dan meneruskan notifikasi ke Telegram. Secara otonom memperbaiki bug produksi di aplikasi yang sudah dideploy tanpa diminta.
</Card>

</CardGroup>

## Pengetahuan dan memori

Sistem yang mengindeks, mencari, mengingat, dan bernalar atas pengetahuan pribadi atau tim.

<CardGroup cols={2}>

<Card title="Pembelajaran bahasa Mandarin xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mesin pembelajaran bahasa Mandarin dengan umpan balik pelafalan dan alur belajar melalui OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Umpan balik pelafalan xuezh" />
</Card>

<Card title="Vault memori WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Menyerap ekspor penuh WhatsApp, mentranskripsikan 1k+ catatan suara, memeriksa silang dengan log git, menghasilkan laporan markdown tertaut.
</Card>

<Card title="Pencarian semantik Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Menambahkan pencarian vektor ke bookmark Karakeep menggunakan Qdrant plus embedding OpenAI atau Ollama.
</Card>

<Card title="Memori Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Manajer memori terpisah yang mengubah file sesi menjadi memori, lalu keyakinan, lalu model diri yang berkembang.
</Card>

</CardGroup>

## Suara dan telepon

Titik masuk berbasis suara, bridge telepon, dan alur kerja berat transkripsi.

<CardGroup cols={2}>

<Card title="Bridge telepon Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Asisten suara Vapi ke bridge HTTP OpenClaw. Panggilan telepon hampir waktu nyata dengan agen Anda.
</Card>

<Card title="Transkripsi OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transkripsi audio multibahasa melalui OpenRouter (Gemini, dan lainnya). Tersedia di ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skills transkripsi OpenRouter di ClawHub" />
</Card>

</CardGroup>

## Infrastruktur dan deployment

Pengemasan, deployment, dan integrasi yang membuat OpenClaw lebih mudah dijalankan dan diperluas.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw yang berjalan di Home Assistant OS dengan dukungan tunnel SSH dan state persisten.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Kontrol dan otomatisasikan perangkat Home Assistant melalui bahasa alami.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Konfigurasi OpenClaw ternixifikasi yang sudah lengkap untuk deployment yang dapat direproduksi.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skills kalender yang menggunakan khal dan vdirsyncer. Integrasi kalender yang di-host sendiri.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Rumah dan perangkat keras

Sisi dunia fisik OpenClaw: rumah, sensor, kamera, penyedot debu, dan perangkat lainnya.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Otomatisasi rumah native Nix dengan OpenClaw sebagai antarmuka, plus dasbor Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Kontrol penyedot debu robot Roborock Anda melalui percakapan alami.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Proyek komunitas

Hal-hal yang berkembang melampaui satu alur kerja menjadi produk atau ekosistem yang lebih luas.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Marketplace lengkap untuk perlengkapan astronomi. Dibangun dengan dan di sekitar ekosistem OpenClaw.
</Card>

</CardGroup>

## Kirimkan proyek Anda

<Steps>
  <Step title="Share it">
    Posting di [#self-promotion di Discord](https://discord.gg/clawd) atau [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Beri tahu kami apa fungsinya, tautkan ke repo atau demo, dan bagikan tangkapan layar jika Anda memilikinya.
  </Step>
  <Step title="Get featured">
    Kami akan menambahkan proyek-proyek menonjol ke halaman ini.
  </Step>
</Steps>

## Terkait

- [Memulai](/id/start/getting-started)
- [OpenClaw](/id/start/openclaw)

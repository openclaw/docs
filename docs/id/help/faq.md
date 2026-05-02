---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, pemasangan, orientasi awal, atau dukungan runtime
    - Melakukan triase isu yang dilaporkan pengguna sebelum debugging yang lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Pertanyaan Umum
x-i18n:
    generated_at: "2026-05-02T09:23:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

Jawaban cepat plus pemecahan masalah lebih mendalam untuk penyiapan dunia nyata (pengembangan lokal, VPS, multi-agent, kunci OAuth/API, failover model). Untuk diagnostik runtime, lihat [Pemecahan Masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agen/sesi, konfigurasi penyedia + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang dapat ditempel (aman dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis baca-saja dengan ekor log (token disensor).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe saluran saat didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Kesehatan](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC mati, gunakan fallback ke:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Logging](/id/logging) dan [Pemecahan Masalah](/id/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan konfigurasi/status + menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + jalur konfigurasi saat terjadi error
   ```

   Meminta snapshot lengkap dari gateway yang sedang berjalan (hanya WS). Lihat [Kesehatan](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

Tanya jawab pertama kali — instalasi, onboarding, rute autentikasi, langganan, kegagalan awal —
ada di [FAQ pertama kali](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. Ia membalas di permukaan pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan Plugin saluran bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah bidang kontrol yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." Ini adalah **bidang kontrol local-first** yang memungkinkan Anda menjalankan
    asisten mumpuni di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan alat - tanpa menyerahkan kendali alur kerja Anda ke SaaS
    ter-hosting.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Saluran nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus suara seluler dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan routing per agen
      dan failover.
    - **Opsi hanya lokal:** jalankan model lokal sehingga **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Routing multi-agent:** agen terpisah per saluran, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Sumber terbuka dan mudah diubah:** inspeksi, perluas, dan host sendiri tanpa ketergantungan vendor.

    Docs: [Gateway](/id/gateway), [Saluran](/id/channels), [Multi-agent](/id/concepts/multi-agent),
    [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan pertama?">
    Proyek awal yang baik:

    - Membangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Membuat prototipe aplikasi seluler (kerangka, layar, rencana API).
    - Mengatur file dan folder (pembersihan, penamaan, penandaan).
    - Menghubungkan Gmail dan mengotomatiskan ringkasan atau tindak lanjut.

    Ia dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya menjadi fase dan
    menggunakan sub-agen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Keberhasilan sehari-hari biasanya terlihat seperti:

    - **Briefing pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penyusunan draf:** riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan checklist berbasis Cron atau Heartbeat.
    - **Otomatisasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan terima hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan draf**. Ia dapat memindai situs, membuat daftar pendek,
    meringkas prospek, dan menulis draf outreach atau naskah iklan.

    Untuk **outreach atau menjalankan iklan**, tetap libatkan manusia. Hindari spam, ikuti hukum setempat dan
    kebijakan platform, dan tinjau semuanya sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda menyetujuinya.

    Docs: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop pengodean langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Keunggulan:

    - **Memori persisten + workspace** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hook)
    - **Gateway yang selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Nodes** untuk browser/layar/kamera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Letakkan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Presedensinya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, sehingga override terkelola tetap menang atas Skills bawaan tanpa menyentuh git. Jika Anda perlu menginstal skill secara global tetapi hanya terlihat bagi beberapa agen, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang sebaiknya berada di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder khusus?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (presedensi terendah). Presedensi default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika skill hanya boleh terlihat oleh agen tertentu, pasangkan itu dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya dapat menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron jobs**: pekerjaan terisolasi dapat menetapkan override `model` per pekerjaan.
    - **Sub-agen**: arahkan tugas ke agen terpisah dengan model default yang berbeda.
    - **Pergantian sesuai kebutuhan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron jobs](/id/automation/cron-jobs), [Routing Multi-Agent](/id/concepts/multi-agent), dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot macet saat melakukan pekerjaan berat. Bagaimana cara memindahkannya?">
    Gunakan **sub-agen** untuk tugas panjang atau paralel. Sub-agen berjalan dalam sesi sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "memunculkan sub-agen untuk tugas ini" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah ia sedang sibuk).

    Tips token: tugas panjang dan sub-agen sama-sama mengonsumsi token. Jika biaya menjadi perhatian, tetapkan
    model yang lebih murah untuk sub-agen melalui `agents.defaults.subagents.model`.

    Docs: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagent terikat thread di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke target subagent atau sesi sehingga pesan tindak lanjut di thread itu tetap berada pada sesi terikat tersebut.

    Alur dasar:

    - Munculkan dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepas thread.

    Konfigurasi yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: `channels.discord.threadBindings.spawnSessions` default ke `true`; setel ke `false` untuk menonaktifkan spawn sesi terikat thread.

    Docs: [Sub-agen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent selesai, tetapi pembaruan penyelesaian masuk ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute requester yang di-resolve terlebih dahulu:

    - Pengiriman subagent mode penyelesaian lebih memilih thread terikat atau rute percakapan saat ada.
    - Jika origin penyelesaian hanya membawa saluran, OpenClaw fallback ke rute tersimpan sesi requester (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap dapat berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasilnya fallback ke pengiriman sesi antrean alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau kedaluwarsa masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres lama yang kedaluwarsa.
    - Jika child timeout setelah hanya panggilan alat, pengumuman dapat menciutkannya menjadi ringkasan progres parsial singkat alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    pekerjaan terjadwal tidak akan berjalan.

    Checklist:

    - Pastikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa tidur/restart).
    - Verifikasi pengaturan zona waktu untuk pekerjaan (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron jobs](/id/automation/cron-jobs), [Otomatisasi & Tugas](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke saluran. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pengiriman fallback runner yang diharapkan.
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan autentikasi saluran (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (hanya `NO_REPLY` / `no_reply`) diperlakukan sebagai sengaja tidak dapat dikirim, jadi runner juga menekan pengiriman fallback yang antre.

    Untuk pekerjaan cron terisolasi, agen masih dapat mengirim langsung dengan alat `message`
    ketika rute chat tersedia. `--announce` hanya mengontrol jalur fallback runner
    untuk teks akhir yang belum dikirim oleh agen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Pekerjaan Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa cron run terisolasi mengganti model atau mencoba ulang sekali?">
    Itu biasanya jalur penggantian model langsung, bukan penjadwalan duplikat.

    Cron terisolasi dapat mempertahankan handoff model runtime dan mencoba ulang ketika run
    aktif melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang telah diganti, dan jika penggantian membawa override profil autentikasi baru, cron
    juga mempertahankannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang lebih dulu jika berlaku.
    - Lalu `model` per pekerjaan.
    - Lalu override model sesi cron yang tersimpan.
    - Lalu pemilihan model agen/default normal.

    Loop percobaan ulang dibatasi. Setelah percobaan awal ditambah 2 percobaan ulang penggantian,
    cron membatalkan alih-alih berulang selamanya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Pekerjaan Cron](/id/automation/cron-jobs), [CLI cron](/id/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan Skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
    Jelajahi Skills di [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Native `openclaw skills install` menulis ke direktori `skills/`
    workspace aktif. Instal CLI `clawhub` terpisah hanya jika Anda ingin menerbitkan atau
    menyinkronkan Skills Anda sendiri. Untuk instalasi bersama lintas agen, letakkan skill di bawah
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin mempersempit agen mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas berdasarkan jadwal atau terus-menerus di latar belakang?">
    Ya. Gunakan penjadwal Gateway:

    - **Pekerjaan Cron** untuk tugas terjadwal atau berulang (bertahan setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Pekerjaan terisolasi** untuk agen otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumen: [Pekerjaan Cron](/id/automation/cron-jobs), [Automasi & Tugas](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` plus biner yang diperlukan, dan Skills hanya muncul di prompt sistem ketika eligible di **host Gateway**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengoverride gating.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS tersedia, lalu hubungkan dari Linux dalam [mode remote](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat normal karena host Gateway adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai eligible ketika biner yang diperlukan tersedia di node. Agen menjalankan Skills tersebut melalui alat `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt menambahkan perintah tersebut ke allowlist.

    **Opsi C - proxy biner macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat biner CLI yang diperlukan resolve ke wrapper SSH yang berjalan di Mac. Lalu override skill agar mengizinkan Linux sehingga tetap eligible.

    1. Buat wrapper SSH untuk biner (contoh: `memo` untuk Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Letakkan wrapper di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Override metadata skill (workspace atau `~/.openclaw/skills`) untuk mengizinkan Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills disegarkan.

  </Accordion>

  <Accordion title="Apakah ada integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen keduanya memiliki API).
    - **Automasi browser:** berfungsi tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin mempertahankan konteks per klien (workflow agensi), pola sederhana adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agen mengambil halaman tersebut di awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau buat skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native masuk ke direktori `skills/` workspace aktif. Untuk Skills bersama lintas agen, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agen yang boleh melihat instalasi bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan biner yang diinstal melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang terpasang melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini dapat menggunakan browser host lokal atau node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host node di mesin browser atau gunakan CDP remote.

    Batas saat ini pada `existing-session` / `user`:

    - tindakan berbasis ref, bukan berbasis CSS selector
    - unggahan memerlukan `ref` / `inputRef` dan saat ini mendukung satu file dalam satu waktu
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumen sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (Gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, jadi tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Pertahankan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap ada.
    - Bake dependency sistem ke dalam image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan jalur tersebut dipertahankan.

    Dokumen: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi tetapi membuat grup publik/tersandbox dengan satu agen?">
    Ya - jika lalu lintas pribadi Anda adalah **DM** dan lalu lintas publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/saluran (kunci non-main) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap di host. Docker adalah backend default jika Anda tidak memilih salah satu. Lalu batasi alat apa yang tersedia di sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh konfigurasi: [Grup: DM pribadi + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi utama: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya, `"/home/user/src:/src:ro"`). Bind global + per agen digabung; bind per agen diabaikan ketika `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap jalur yang dinormalisasi dan jalur kanonis yang di-resolve melalui ancestor terdalam yang sudah ada. Itu berarti escape symlink-parent tetap gagal tertutup bahkan ketika segmen jalur terakhir belum ada, dan pemeriksaan root yang diizinkan tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keselamatan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agen:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (hanya sesi utama/pribadi)

    OpenClaw juga menjalankan **flush memori pre-compaction senyap** untuk mengingatkan model
    agar menulis catatan tahan lama sebelum auto-compaction. Ini hanya berjalan ketika workspace
    dapat ditulis (sandbox read-only melewatinya). Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan berbagai hal. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta ke memori**. Catatan jangka panjang berada di `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang sedang kami tingkatkan. Mengingatkan model untuk menyimpan memori akan membantu;
    model akan tahu apa yang harus dilakukan. Jika terus lupa, verifikasi Gateway menggunakan
    workspace yang sama pada setiap run.

    Dokumen: [Memori](/id/concepts/memory), [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, jadi percakapan panjang dapat mengalami compact atau truncation. Itulah mengapa
    pencarian memori ada - ia hanya menarik bagian yang relevan kembali ke konteks.

    Dokumen: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **OpenAI embeddings**. Codex OAuth mencakup chat/completions dan
    **tidak** memberikan akses embeddings, jadi **masuk dengan Codex (OAuth atau login
    Codex CLI)** tidak membantu untuk pencarian memori semantik. OpenAI embeddings
    tetap membutuhkan kunci API nyata (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan penyedia secara eksplisit, OpenClaw memilih penyedia secara otomatis ketika
    dapat menemukan kunci API (profil auth, `models.providers.*.apiKey`, atau variabel env).
    OpenClaw lebih memilih OpenAI jika kunci OpenAI ditemukan, jika tidak Gemini jika kunci Gemini
    ditemukan, lalu Voyage, lalu Mistral. Jika tidak ada kunci jarak jauh yang tersedia, pencarian
    memori tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan tersedia, OpenClaw
    lebih memilih `local`. Ollama didukung ketika Anda secara eksplisit menetapkan
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, tetapkan `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda ingin Gemini embeddings, tetapkan
    `memorySearch.provider = "gemini"` dan sediakan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama, atau lokal**
    - lihat [Memori](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Tempat berbagai hal berada di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **status OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirimkan kepada mereka**.

    - **Lokal secara default:** sesi, file memori, konfigurasi, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Jarak jauh karena kebutuhan:** pesan yang Anda kirim ke penyedia model (Anthropic/OpenAI/dll.) dikirim ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di server
      mereka.
    - **Anda mengontrol jejaknya:** menggunakan model lokal membuat prompt tetap berada di mesin Anda, tetapi traffic channel
      tetap melewati server channel tersebut.

    Terkait: [Workspace agen](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Jalur                                                           | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Konfigurasi utama (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth pada penggunaan pertama)  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, kunci API, dan `keyRef`/`tokenRef` opsional)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload rahasia opsional berbasis file untuk penyedia SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis dibersihkan)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Status penyedia (mis. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per agen (agentDir + sesi)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat & status percakapan (per agen)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agen)                                           |

    Jalur lama untuk agen tunggal: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md sebaiknya berada?">
    File-file ini berada di **workspace agen**, bukan `~/.openclaw`.

    - **Workspace (per agen)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opsional.
      Root `memory.md` huruf kecil hanya input perbaikan lama; `openclaw doctor --fix`
      dapat menggabungkannya ke `MEMORY.md` ketika kedua file ada.
    - **Direktori status (`~/.openclaw`)**: konfigurasi, status channel/penyedia, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan
    workspace yang sama pada setiap peluncuran (dan ingat: mode jarak jauh menggunakan workspace
    **host gateway**, bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** daripada mengandalkan riwayat chat.

    Lihat [Workspace agen](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi pencadangan yang direkomendasikan">
    Letakkan **workspace agen** Anda di repo git **privat** dan cadangkan di tempat
    privat (misalnya GitHub privat). Ini menangkap memori + file AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    Jangan commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload rahasia terenkripsi).
    Jika Anda perlu pemulihan penuh, cadangkan workspace dan direktori status
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus instalasi OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Hapus instalasi](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agen bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox yang ketat.
    Jalur relatif diselesaikan di dalam workspace, tetapi jalur absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda membutuhkan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agen. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan `workspace`
    agen tersebut ke root repo. Repo OpenClaw hanyalah kode sumber; biarkan
    workspace terpisah kecuali Anda memang ingin agen bekerja di dalamnya.

    Contoh (repo sebagai cwd default):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode jarak jauh: di mana penyimpanan sesinya?">
    Status sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode jarak jauh, penyimpanan sesi yang relevan bagi Anda ada di mesin jarak jauh, bukan laptop lokal Anda. Lihat [Manajemen sesi](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar konfigurasi

<AccordionGroup>
  <Accordion title="Apa format konfigurasinya? Di mana lokasinya?">
    OpenClaw membaca konfigurasi **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, OpenClaw menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menetapkan gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang mendengarkan / UI mengatakan tidak terotorisasi'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy yang sadar identitas dan dikonfigurasi dengan benar

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Catatan:

    - `gateway.remote.token` / `.password` **tidak** mengaktifkan auth gateway lokal dengan sendirinya.
    - Jalur panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum ditetapkan.
    - Untuk auth kata sandi, tetapkan `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tidak ada fallback jarak jauh yang menutupi).
    - Penyiapan Control UI shared-secret diautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan aplikasi/UI). Mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy same-host loopback memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit dan entri loopback di `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Mengapa saya membutuhkan token di localhost sekarang?">
    OpenClaw memberlakukan auth gateway secara default, termasuk loopback. Pada jalur default normal, itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway beresolusi ke mode token dan membuatnya otomatis, menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus melakukan autentikasi**. Ini memblokir proses lokal lain agar tidak memanggil Gateway.

    Jika Anda lebih suka jalur auth berbeda, Anda dapat secara eksplisit memilih mode kata sandi (atau, untuk reverse proxy yang sadar identitas, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, tetapkan `gateway.auth.mode: "none"` secara eksplisit di konfigurasi Anda. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah konfigurasi?">
    Gateway mengawasi konfigurasi dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): menerapkan perubahan aman secara langsung, restart untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Tetapkan `cli.banner.taglineMode` dalam konfigurasi:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: menyembunyikan teks tagline tetapi mempertahankan baris judul/versi banner.
    - `default`: menggunakan `All your chats, one OpenClaw.` setiap kali.
    - `random`: tagline lucu/musiman yang berotasi (perilaku default).
    - Jika Anda tidak menginginkan banner sama sekali, tetapkan env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` berfungsi tanpa kunci API. `web_search` bergantung pada penyedia
    yang Anda pilih:

    - Penyedia berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan kunci API normal mereka.
    - Ollama Web Search bebas kunci, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo bebas kunci, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG bebas kunci/dihosting sendiri; konfigurasi `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih penyedia.
    Alternatif environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` atau `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Konfigurasi pencarian web khusus penyedia kini berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur penyedia lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk konfigurasi baru.
    Konfigurasi fallback pengambilan web Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw otomatis mendeteksi penyedia fallback pengambilan pertama yang siap dari kredensial yang tersedia. Saat ini penyedia bawaannya adalah Firecrawl.
    - Daemon membaca variabel env dari `~/.openclaw/.env` (atau lingkungan layanan).

    Docs: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` mengganti **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua
    yang lain akan dihapus.

    OpenClaw saat ini melindungi dari banyak penimpaan tidak sengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi konfigurasi penuh setelah perubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Jika edit langsung merusak startup atau hot reload, Gateway memulihkan konfigurasi terakhir yang diketahui baik dan menyimpan file yang ditolak sebagai `openclaw.json.clobbered.*`.
    - Agen utama menerima peringatan boot setelah pemulihan agar tidak menulis konfigurasi buruk itu lagi secara membabi buta.

    Pulihkan:

    - Periksa `openclaw logs --follow` untuk `Config auto-restored from last-known-good`, `Config write rejected:`, atau `config reload restored last-known-good config`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di samping konfigurasi aktif.
    - Pertahankan konfigurasi aktif yang dipulihkan jika berfungsi, lalu salin kembali hanya kunci yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jalankan `openclaw config validate` dan `openclaw doctor`.
    - Jika Anda tidak memiliki last-known-good atau payload yang ditolak, pulihkan dari cadangan, atau jalankan ulang `openclaw doctor` dan konfigurasi ulang channel/model.
    - Jika ini tidak terduga, ajukan bug dan sertakan konfigurasi terakhir yang Anda ketahui atau cadangan apa pun.
    - Agen coding lokal sering dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu saat Anda tidak yakin tentang jalur persis atau bentuk field; perintah ini mengembalikan node skema dangkal plus ringkasan anak langsung untuk penelusuran.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan alat `gateway` khusus pemilik dari run agen, alat itu tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke jalur exec terlindungi yang sama).

    Docs: [Konfigurasi](/id/cli/config), [Konfigurasi](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus lintas perangkat?">
    Pola umumnya adalah **satu Gateway** (mis. Raspberry Pi) plus **node** dan **agen**:

    - **Gateway (pusat):** memiliki channel (Signal/WhatsApp), routing, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (worker):** otak/workspace terpisah untuk peran khusus (mis. "Hetzner ops", "Data pribadi").
    - **Sub-agen:** memunculkan pekerjaan latar belakang dari agen utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan berpindah agen/sesi.

    Docs: [Node](/id/nodes), [Akses jarak jauh](/id/gateway/remote), [Routing Multi-Agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [TUI](/id/web/tui).

  </Accordion>

  <Accordion title="Bisakah browser OpenClaw berjalan headless?">
    Ya. Ini adalah opsi konfigurasi:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Default-nya adalah `false` (headful). Headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Headless menggunakan **engine Chromium yang sama** dan berfungsi untuk sebagian besar otomasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Atur `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium apa pun) dan mulai ulang Gateway.
    Lihat contoh konfigurasi lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway dan node jarak jauh

<AccordionGroup>
  <Accordion title="Bagaimana perintah menyebar antara Telegram, gateway, dan node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agen dan
    baru kemudian memanggil node melalui **Gateway WebSocket** saat alat node diperlukan:

    Telegram → Gateway → Agen → `node.*` → Node → Gateway → Telegram

    Node tidak melihat traffic penyedia masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway dihosting secara jarak jauh?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil alat `node.*` (layar, kamera, sistem) pada mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway pada host yang selalu aktif (VPS/server rumah).
    2. Masukkan host Gateway + komputer Anda ke tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar dapat mendaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan node macOS mengizinkan `system.run` pada mesin tersebut. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Keamanan](/id/gateway/security).

    Docs: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale sudah terhubung tetapi saya tidak mendapat balasan. Apa sekarang?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan channel: `openclaw channels status`

    Lalu verifikasi auth dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, pastikan tunnel lokal aktif dan mengarah ke port yang benar.
    - Pastikan allowlist Anda (DM atau grup) menyertakan akun Anda.

    Docs: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Channel](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw berbicara satu sama lain (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-to-bot" bawaan, tetapi Anda dapat merangkainya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika salah satu bot berada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh itu
    melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)).

    Contoh pola (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Kiat: tambahkan guardrail agar kedua bot tidak berulang tanpa akhir (hanya-mention, allowlist channel,
    atau aturan "jangan balas pesan bot").

    Docs: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Pengiriman agen](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway dapat menghosting beberapa agen, masing-masing dengan workspace, default model,
    dan routing sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta sederhana daripada menjalankan
    satu VPS per agen.

    Gunakan VPS terpisah hanya ketika Anda membutuhkan isolasi keras (batas keamanan) atau
    konfigurasi yang sangat berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agen atau sub-agen.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya alih-alih SSH dari VPS?">
    Ya - node adalah cara kelas utama untuk menjangkau laptop Anda dari Gateway jarak jauh, dan node
    membuka akses lebih dari sekadar shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau box sekelas Raspberry Pi sudah cukup; RAM 4 GB sangat memadai), jadi penyiapan yang umum
    adalah host yang selalu aktif plus laptop Anda sebagai node.

    - **Tidak memerlukan SSH masuk.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi lebih aman.** `system.run` dibatasi oleh allowlist/persetujuan node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau lampirkan ke Chrome lokal di host melalui Chrome MCP.

    SSH baik untuk akses shell ad-hoc, tetapi node lebih sederhana untuk workflow agen berkelanjutan dan
    otomasi perangkat.

    Docs: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang boleh berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node
    headless dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree konfigurasi dengan node skema dangkal, petunjuk UI yang cocok, dan ringkasan anak langsung sebelum menulis
    - `config.get`: ambil snapshot saat ini + hash
    - `config.patch`: pembaruan parsial aman (lebih disarankan untuk sebagian besar edit RPC); melakukan hot-reload jika memungkinkan dan restart saat diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; melakukan hot-reload jika memungkinkan dan restart saat diperlukan
    - Alat runtime `gateway` khusus pemilik tetap menolak menulis ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur exec terlindungi yang sama

  </Accordion>

  <Accordion title="Konfigurasi minimal yang masuk akal untuk instalasi pertama">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ini menetapkan workspace Anda dan membatasi siapa yang dapat memicu bot.

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Tailscale di VPS dan terhubung dari Mac saya?">
    Langkah minimal:

    1. **Instal + login di VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instal + login di Mac Anda**
       - Gunakan aplikasi Tailscale dan masuk ke tailnet yang sama.
    3. **Aktifkan MagicDNS (direkomendasikan)**
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS memiliki nama yang stabil.
    4. **Gunakan hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan Control UI tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini membuat gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan Node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH dapat berupa hostname tailnet).
       Aplikasi akan membuat tunnel ke port Gateway dan terhubung sebagai Node.
    3. **Setujui Node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumen: [Protokol Gateway](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [Mode remote macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal di laptop kedua atau cukup menambahkan Node?">
    Jika Anda hanya membutuhkan **alat lokal** (layar/kamera/exec) di laptop kedua, tambahkan sebagai
    **Node**. Ini mempertahankan satu Gateway dan menghindari konfigurasi duplikat. Alat Node lokal
    saat ini hanya tersedia untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya ketika Anda membutuhkan **isolasi ketat** atau dua bot yang sepenuhnya terpisah.

    Dokumen: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabel env dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat variabel lingkungan?">
    OpenClaw membaca variabel env dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback `.env` global dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak satu pun file `.env` menimpa variabel env yang sudah ada.

    Anda juga dapat mendefinisikan variabel env inline dalam konfigurasi (diterapkan hanya jika tidak ada di env proses):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Lihat [/environment](/id/help/environment) untuk prioritas dan sumber lengkap.

  </Accordion>

  <Accordion title="Saya memulai Gateway melalui service dan variabel env saya menghilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Letakkan key yang hilang di `~/.openclaw/.env` agar tetap diambil meskipun service tidak mewarisi env shell Anda.
    2. Aktifkan impor shell (kemudahan opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Ini menjalankan shell login Anda dan hanya mengimpor key yang diharapkan yang belum ada (tidak pernah menimpa). Padanan variabel env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menetapkan COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti variabel env Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    shell login Anda secara otomatis.

    Jika Gateway berjalan sebagai service (launchd/systemd), ia tidak akan mewarisi
    lingkungan shell Anda. Perbaiki dengan melakukan salah satu hal berikut:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` konfigurasi Anda (berlaku hanya jika belum ada).

    Lalu mulai ulang gateway dan periksa kembali:

    ```bash
    openclaw models status
    ```

    Token Copilot dibaca dari `COPILOT_GITHUB_TOKEN` (juga `GH_TOKEN` / `GITHUB_TOKEN`).
    Lihat [/concepts/model-providers](/id/concepts/model-providers) dan [/environment](/id/help/environment).

  </Accordion>
</AccordionGroup>

## Sesi dan beberapa chat

<AccordionGroup>
  <Accordion title="Bagaimana cara memulai percakapan baru?">
    Kirim `/new` atau `/reset` sebagai pesan mandiri. Lihat [Manajemen sesi](/id/concepts/session).
  </Accordion>

  <Accordion title="Apakah sesi direset otomatis jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Tetapkan ke nilai positif untuk mengaktifkan kedaluwarsa karena idle. Saat diaktifkan, pesan **berikutnya**
    setelah periode idle memulai id sesi baru untuk key chat tersebut.
    Ini tidak menghapus transkrip - hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara membuat tim instance OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **routing multi-agen** dan **sub-agen**. Anda dapat membuat satu agen koordinator
    dan beberapa agen pekerja dengan workspace dan model mereka sendiri.

    Namun, ini paling baik dilihat sebagai **eksperimen yang menyenangkan**. Ini boros token dan sering
    kurang efisien dibanding menggunakan satu bot dengan sesi terpisah. Model umum yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot
    itu juga dapat memunculkan sub-agen saat diperlukan.

    Dokumen: [Routing multi-agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [CLI Agen](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh window model. Chat panjang, output alat besar, atau banyak
    file dapat memicu compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum keadaan saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agen untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
    - Pilih model dengan window konteks yang lebih besar jika ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mereset OpenClaw sepenuhnya tetapi tetap mempertahankan instalasinya?">
    Gunakan perintah reset:

    ```bash
    openclaw reset
    ```

    Reset penuh noninteraktif:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Lalu jalankan ulang penyiapan:

    ```bash
    openclaw onboard --install-daemon
    ```

    Catatan:

    - Onboarding juga menawarkan **Reset** jika melihat konfigurasi yang sudah ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori state (defaultnya adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara reset atau compact?'>
    Gunakan salah satu ini:

    - **Compact** (mempertahankan percakapan tetapi merangkum giliran lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk memandu ringkasan.

    - **Reset** (ID sesi baru untuk key chat yang sama):

      ```
      /new
      /reset
      ```

    Jika terus terjadi:

    - Aktifkan atau sesuaikan **pemangkasan sesi** (`agents.defaults.contextPruning`) untuk memangkas output alat lama.
    - Gunakan model dengan window konteks yang lebih besar.

    Dokumen: [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning), [Manajemen sesi](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi penyedia: model memancarkan blok `tool_use` tanpa
    `input` yang wajib. Ini biasanya berarti riwayat sesi sudah usang atau rusak (sering setelah thread panjang
    atau perubahan alat/skema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapatkan pesan Heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1h** saat menggunakan auth OAuth). Sesuaikan atau nonaktifkan:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header
    markdown seperti `# Heading`), OpenClaw melewati proses heartbeat untuk menghemat panggilan API.
    Jika file hilang, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per agen menggunakan `agents.list[].heartbeat`. Dokumen: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda berada di grup, OpenClaw dapat melihatnya.
    Secara default, balasan grup diblokir sampai Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

    Jika Anda ingin hanya **Anda** yang dapat memicu balasan grup:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bagaimana cara mendapatkan JID grup WhatsApp?">
    Opsi 1 (tercepat): ikuti log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Directory](/id/cli/directory), [Log](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Mention gating aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung digabungkan ke sesi utama secara default. Grup/channel memiliki key sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agen yang dapat saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agen berarti lebih banyak penggunaan model secara bersamaan.
    - **Overhead operasional:** profil auth, workspace, dan routing channel per agen.

    Tips:

    - Pertahankan satu workspace **aktif** per agen (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri store) jika disk bertambah.
    - Gunakan `openclaw doctor` untuk menemukan workspace liar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana saya harus menyiapkannya?">
    Ya. Gunakan **Multi-Agent Routing** untuk menjalankan beberapa agen yang terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agen tertentu.

    Akses peramban sangat kuat, tetapi bukan berarti "dapat melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA masih dapat
    memblokir otomatisasi. Untuk kontrol peramban yang paling andal, gunakan Chrome MCP lokal pada host,
    atau gunakan CDP pada mesin yang benar-benar menjalankan peramban.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agen per peran (binding).
    - Channel Slack yang diikat ke agen tersebut.
    - Peramban lokal melalui Chrome MCP atau Node saat diperlukan.

    Dokumentasi: [Multi-Agent Routing](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Peramban](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil autentikasi

Tanya jawab model — default, pemilihan, alias, pergantian, failover, profil autentikasi —
ada di [FAQ Model](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port multiplexed untuk WebSocket + HTTP (Control UI, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah tampilan **supervisor** (launchd/systemd/schtasks). Probe konektivitas adalah CLI yang benar-benar terhubung ke WebSocket Gateway.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (yang benar-benar terikat pada port)
    - `Last gateway error:` (penyebab utama umum ketika proses hidup tetapi port tidak mendengarkan)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" yang berbeda?'>
    Anda sedang mengedit satu file konfigurasi sementara layanan menjalankan file lain (sering kali ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / lingkungan yang sama dengan yang Anda ingin layanan gunakan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw memberlakukan kunci runtime dengan langsung mengikat listener WebSocket saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, ia melempar `GatewayLockError` yang menunjukkan instance lain sudah mendengarkan.

    Perbaikan: hentikan instance lain, kosongkan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode jarak jauh (klien terhubung ke Gateway di tempat lain)?">
    Atur `gateway.mode: "remote"` dan arahkan ke URL WebSocket jarak jauh, opsional dengan kredensial jarak jauh shared-secret:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Catatan:

    - `openclaw gateway` hanya dimulai ketika `gateway.mode` adalah `local` (atau Anda meneruskan flag override).
    - Aplikasi macOS memantau file konfigurasi dan mengganti mode secara live saat nilai ini berubah.
    - `gateway.remote.token` / `.password` hanya kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan autentikasi Gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus menyambungkan ulang). Apa sekarang?'>
    Jalur autentikasi Gateway Anda dan metode autentikasi UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab peramban saat ini dan URL Gateway yang dipilih, sehingga refresh pada tab yang sama tetap berfungsi tanpa memulihkan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan token perangkat yang di-cache ketika Gateway mengembalikan petunjuk retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token yang di-cache itu sekarang menggunakan kembali scope yang disetujui dan di-cache yang disimpan bersama token perangkat. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set scope yang diminta alih-alih mewarisi scope yang di-cache.
    - Di luar jalur retry itu, prioritas autentikasi koneksi adalah token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pemeriksaan scope token bootstrap diberi prefiks peran. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; node atau peran non-operator lainnya masih memerlukan scope di bawah prefiks perannya sendiri.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum punya token: `openclaw doctor --generate-gateway-token`.
    - Jika jarak jauh, buat tunnel dahulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: atur `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempelkan secret yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode trusted-proxy: pastikan Anda datang melalui proxy sadar-identitas yang dikonfigurasi, bukan URL Gateway mentah. Proxy local loopback host yang sama juga memerlukan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jika ketidakcocokan tetap ada setelah satu retry, rotasi/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotasi itu mengatakan ditolak, periksa dua hal:
      - sesi perangkat yang dipasangkan hanya dapat merotasi perangkat **miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi scope operator pemanggil saat ini
    - Masih macet? Jalankan `openclaw status --all` dan ikuti [Pemecahan Masalah](/id/gateway/troubleshooting). Lihat [Dashboard](/id/web/dashboard) untuk detail autentikasi.

  </Accordion>

  <Accordion title="Saya mengatur gateway.bind tailnet tetapi tidak dapat bind dan tidak ada yang mendengarkan">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmukanya down), tidak ada yang bisa di-bind.

    Perbaikan:

    - Mulai Tailscale pada host tersebut (sehingga memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` saat Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa Gateway pada host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa channel pesan dan agen. Gunakan beberapa Gateway hanya ketika Anda membutuhkan redundansi (misalnya: bot penyelamat) atau isolasi keras.

    Bisa, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (membuat `~/.openclaw-<name>` secara otomatis).
    - Atur `gateway.port` unik di setiap konfigurasi profil (atau teruskan `--port` untuk menjalankan manual).
    - Instal layanan per profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan suffix pada nama layanan (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Beberapa Gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan ia mengharapkan pesan pertama
    berupa frame `connect`. Jika menerima hal lain, ia menutup koneksi
    dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di peramban (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header autentikasi atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab peramban normal.
    3. Jika autentikasi aktif, sertakan token/password dalam frame `connect`.

    Jika Anda menggunakan CLI atau TUI, URL seharusnya terlihat seperti:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detail protokol: [Protokol Gateway](/id/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging dan debugging

<AccordionGroup>
  <Accordion title="Di mana log berada?">
    Log file (terstruktur):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Anda dapat mengatur path stabil melalui `logging.file`. Level log file dikontrol oleh `logging.level`. Verbositas konsol dikontrol oleh `--verbose` dan `logging.consoleLevel`.

    Tail log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log layanan/supervisor (ketika Gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Pemecahan Masalah](/id/gateway/troubleshooting) untuk lebih lanjut.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/memulai ulang layanan Gateway?">
    Gunakan helper Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan Gateway secara manual, `openclaw gateway --force` dapat mengambil kembali port. Lihat [Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Saya menutup terminal saya di Windows - bagaimana cara memulai ulang OpenClaw?">
    Ada **dua mode instalasi Windows**:

    **1) WSL2 (direkomendasikan):** Gateway berjalan di dalam Linux.

    Buka PowerShell, masuk ke WSL, lalu mulai ulang:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda belum pernah menginstal layanan, mulai di foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows native (tidak direkomendasikan):** Gateway berjalan langsung di Windows.

    Buka PowerShell dan jalankan:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankannya secara manual (tanpa layanan), gunakan:

    ```powershell
    openclaw gateway run
    ```

    Dokumentasi: [Windows (WSL2)](/id/platforms/windows), [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Gateway aktif tetapi balasan tidak pernah tiba. Apa yang harus saya periksa?">
    Mulai dengan pemeriksaan kesehatan cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Autentikasi model tidak dimuat pada **host gateway** (periksa `models status`).
    - Pairing/allowlist channel memblokir balasan (periksa konfigurasi channel + log).
    - WebChat/Dashboard terbuka tanpa token yang benar.

    Jika Anda berada jarak jauh, pastikan koneksi tunnel/Tailscale aktif dan
    WebSocket Gateway dapat dijangkau.

    Dokumentasi: [Channel](/id/channels), [Pemecahan Masalah](/id/gateway/troubleshooting), [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - apa sekarang?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika remote, apakah tunnel/tautan Tailscale aktif?

    Lalu ikuti log:

    ```bash
    openclaw logs --follow
    ```

    Dokumen: [Dashboard](/id/web/dashboard), [Akses remote](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands gagal. Apa yang perlu saya periksa?">
    Mulai dengan log dan status saluran:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error-nya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas hingga batas Telegram dan mencoba ulang dengan lebih sedikit perintah, tetapi beberapa entri menu masih perlu dihapus. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak membutuhkan menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di balik proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway bersifat remote, pastikan Anda melihat log di host Gateway.

    Dokumen: [Telegram](/id/channels/telegram), [Pemecahan masalah saluran](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang perlu saya periksa?">
    Pertama pastikan Gateway dapat dijangkau dan agen dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat status saat ini. Jika Anda mengharapkan balasan di saluran chat,
    pastikan pengiriman diaktifkan (`/deliver on`).

    Dokumen: [TUI](/id/web/tui), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara sepenuhnya menghentikan lalu memulai Gateway?">
    Jika Anda memasang layanan:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **layanan yang diawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankannya di foreground, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Dokumen: [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: memulai ulang **layanan latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di foreground** untuk sesi terminal ini.

    Jika Anda memasang layanan, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan eksekusi satu kali di foreground.

  </Accordion>

  <Accordion title="Cara tercepat mendapatkan detail tambahan saat ada yang gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol tambahan. Lalu periksa file log untuk auth saluran, perutean model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agen harus menyertakan baris `MEDIA:<path-or-url>` (di baris tersendiri). Lihat [Penyiapan asisten OpenClaw](/id/start/openclaw) dan [Kirim agen](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Periksa juga:

    - Saluran target mendukung media keluar dan tidak diblokir oleh allowlist.
    - File berada dalam batas ukuran provider (gambar diubah ukurannya hingga maks. 2048px).
    - `tools.fs.workspaceOnly=true` membatasi pengiriman path lokal ke workspace, temp/media-store, dan file yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan `MEDIA:` mengirim file lokal host yang sudah dapat dibaca agen, tetapi hanya untuk media serta jenis dokumen aman (gambar, audio, video, PDF, dan dokumen Office). Teks biasa dan file yang tampak seperti rahasia tetap diblokir.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input yang tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada saluran yang mendukung DM adalah **pairing**:
      - Pengirim tidak dikenal menerima kode pairing; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per saluran**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak tiba.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk menampilkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi masalah untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten yang tidak tepercaya**, bukan hanya siapa yang dapat mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (pencarian/fetch web, halaman browser, email,
    dokumen, lampiran, log yang ditempel), konten tersebut dapat menyertakan instruksi yang mencoba
    mengambil alih model. Ini dapat terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar muncul saat tools diaktifkan: model dapat ditipu untuk
    mengekfiltrasi konteks atau memanggil tools atas nama Anda. Kurangi blast radius dengan:

    - menggunakan agen "reader" yang read-only atau tanpa tool untuk meringkas konten yang tidak tepercaya
    - menonaktifkan `web_search` / `web_fetch` / `browser` untuk agen dengan tool aktif
    - memperlakukan teks file/dokumen yang didekode sebagai tidak tepercaya juga: OpenResponses
      `input_file` dan ekstraksi lampiran media sama-sama membungkus teks yang diekstrak dalam
      penanda batas konten eksternal eksplisit, bukan meneruskan teks file mentah
    - sandboxing dan allowlist tool yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apakah bot saya sebaiknya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar setup. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi blast radius jika ada yang salah. Ini juga membuat rotasi
    kredensial atau pencabutan akses lebih mudah tanpa memengaruhi akun pribadi Anda.

    Mulai dari kecil. Beri akses hanya ke tools dan akun yang benar-benar Anda perlukan, lalu perluas
    nanti jika diperlukan.

    Dokumen: [Keamanan](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Dapatkah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola paling aman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin bot mengirim pesan atas nama Anda.
    - Biarkan bot membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan tetap isolasikan. Lihat
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agen hanya untuk chat dan input-nya tepercaya. Tier yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agen dengan tool aktif
    atau saat membaca konten yang tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    tools dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapat kode pairing">
    Kode pairing dikirim **hanya** saat pengirim tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` saja tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda menginginkan akses langsung, allowlist id pengirim Anda atau atur `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah ini akan mengirim pesan ke kontak saya? Bagaimana pairing bekerja?">
    Tidak. Kebijakan DM WhatsApp default adalah **pairing**. Pengirim tidak dikenal hanya mendapatkan kode pairing dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Daftar permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: ini digunakan untuk menetapkan **allowlist/pemilik** Anda agar DM Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan di nomor WhatsApp pribadi Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "ini tidak berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau tool hanya muncul saat **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih terlalu ramai, periksa pengaturan sesi di Control UI dan setel verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` disetel
    ke `on` di config.

    Dokumen: [Thinking dan verbose](/id/tools/thinking), [Keamanan](/id/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan/membatalkan tugas yang sedang berjalan?">
    Kirim salah satu dari ini **sebagai pesan mandiri** (tanpa slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Ini adalah pemicu pembatalan (bukan perintah slash).

    Untuk proses latar belakang (dari tool exec), Anda dapat meminta agen menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ringkasan perintah slash: lihat [Perintah slash](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`, tetapi beberapa shortcut (seperti `/status`) juga berfungsi inline untuk pengirim yang di-allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pesan **lintas-provider** secara default. Jika panggilan tool terikat
    ke Telegram, panggilan itu tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

    Aktifkan pesan lintas-provider untuk agen:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Mulai ulang gateway setelah mengedit config.

  </Accordion>

  <Accordion title='Mengapa bot terasa seperti "mengabaikan" pesan bertubi-tubi?'>
    Mode antrean mengontrol bagaimana pesan baru berinteraksi dengan run yang sedang berjalan. Gunakan `/queue` untuk mengubah mode:

    - `steer` - antrekan semua steering tertunda untuk batas model berikutnya dalam run saat ini
    - `queue` - steering lama satu per satu
    - `followup` - jalankan pesan satu per satu
    - `collect` - batch pesan dan balas sekali
    - `steer-backlog` - steer sekarang, lalu proses backlog
    - `interrupt` - batalkan run saat ini dan mulai dari awal

    Mode default adalah `steer`. Anda dapat menambahkan opsi seperti `debounce:0.5s cap:25 drop:summarize` untuk mode followup. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan kunci API?'>
    Di OpenClaw, kredensial dan pemilihan model bersifat terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic di profil autentikasi) mengaktifkan autentikasi, tetapi model default sebenarnya adalah apa pun yang Anda konfigurasikan di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, itu berarti Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih mengalami kendala? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ saat pertama kali dijalankan](/id/help/faq-first-run) — instalasi, onboarding, autentikasi, langganan, kegagalan awal
- [FAQ Model](/id/help/faq-models) — pemilihan model, failover, profil autentikasi
- [Pemecahan Masalah](/id/help/troubleshooting) — triase berdasarkan gejala

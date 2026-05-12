---
read_when:
    - Menjawab pertanyaan dukungan umum tentang penyiapan, penginstalan, orientasi awal, atau waktu proses
    - Melakukan triase masalah yang dilaporkan pengguna sebelum pelacakan galat yang lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Pertanyaan yang Sering Diajukan
x-i18n:
    generated_at: "2026-05-12T00:58:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (pengembangan lokal, VPS, multi-agent, OAuth/kunci API, failover model). Untuk diagnostik runtime, lihat [Pemecahan Masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agen/sesi, konfigurasi penyedia + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang bisa ditempel (aman dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis baca-saja dengan ekor log (token disamarkan).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe saluran bila didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Kesehatan](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC tidak aktif, gunakan fallback ke:

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
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Meminta snapshot lengkap dari gateway yang sedang berjalan (khusus WS). Lihat [Kesehatan](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

Tanya jawab pertama kali — instalasi, onboarding, rute auth, langganan, kegagalan awal —
tersedia di [FAQ Pertama Kali](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. OpenClaw membalas di permukaan perpesanan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan plugin saluran bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah bidang kontrol yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." OpenClaw adalah **bidang kontrol local-first** yang memungkinkan Anda menjalankan
    asisten cakap di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi berstatus, memori, dan alat - tanpa menyerahkan kontrol alur kerja Anda ke SaaS
    ter-hosting.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Saluran nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus suara seluler dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan perutean
      per agen dan failover.
    - **Opsi hanya lokal:** jalankan model lokal sehingga **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Perutean multi-agen:** pisahkan agen per saluran, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Open source dan mudah diutak-atik:** inspeksi, perluas, dan self-host tanpa vendor lock-in.

    Dokumentasi: [Gateway](/id/gateway), [Saluran](/id/channels), [Multi-agen](/id/concepts/multi-agent),
    [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan pertama kali?">
    Proyek awal yang bagus:

    - Bangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Buat prototipe aplikasi seluler (outline, layar, rencana API).
    - Atur file dan folder (pembersihan, penamaan, penandaan).
    - Hubungkan Gmail dan otomatiskan ringkasan atau tindak lanjut.

    OpenClaw dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya menjadi fase dan
    menggunakan sub-agen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Manfaat sehari-hari biasanya terlihat seperti:

    - **Briefing pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penyusunan draf:** riset cepat, ringkasan, dan draf pertama untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan checklist yang digerakkan cron atau heartbeat.
    - **Otomasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Dapatkah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan draf**. OpenClaw dapat memindai situs, membuat shortlist,
    merangkum prospek, dan menulis draf outreach atau copy iklan.

    Untuk **outreach atau menjalankan iklan**, tetap libatkan manusia. Hindari spam, patuhi hukum lokal dan
    kebijakan platform, dan tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda menyetujui.

    Dokumentasi: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Keunggulan:

    - **Memori persisten + workspace** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hook)
    - **Gateway selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Node** untuk browser/layar/kamera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Taruh perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Presedensinya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, jadi override terkelola tetap menang atas skill bawaan tanpa menyentuh git. Jika Anda perlu skill terpasang secara global tetapi hanya terlihat oleh sebagian agen, simpan salinan bersama di `~/.openclaw/skills` dan kontrol visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak upstream yang seharusnya berada di repo dan keluar sebagai PR.
  </Accordion>

  <Accordion title="Dapatkah saya memuat Skills dari folder khusus?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (presedensi terendah). Presedensi default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika skill hanya boleh terlihat oleh agen tertentu, pasangkan dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model berbeda untuk tugas berbeda?">
    Saat ini pola yang didukung adalah:

    - **Pekerjaan Cron**: pekerjaan terisolasi dapat menetapkan override `model` per pekerjaan.
    - **Sub-agen**: rutekan tugas ke agen terpisah dengan model default berbeda.
    - **Pergantian sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Pekerjaan Cron](/id/automation/cron-jobs), [Perutean Multi-Agen](/id/concepts/multi-agent), dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat mengerjakan pekerjaan berat. Bagaimana cara mengalihkannya?">
    Gunakan **sub-agen** untuk tugas panjang atau paralel. Sub-agen berjalan dalam sesinya sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn a sub-agent for this task" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah sedang sibuk).

    Tip token: tugas panjang dan sub-agen sama-sama mengonsumsi token. Jika biaya menjadi perhatian, tetapkan
    model yang lebih murah untuk sub-agen melalui `agents.defaults.subagents.model`.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagent yang terikat thread di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke subagent atau target sesi sehingga pesan tindak lanjut di thread tersebut tetap berada pada sesi terikat itu.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan secara opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepaskan thread.

    Konfigurasi wajib:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: `channels.discord.threadBindings.spawnSessions` default ke `true`; setel ke `false` untuk menonaktifkan spawn sesi terikat thread.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent selesai, tetapi pembaruan penyelesaian masuk ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang di-resolve terlebih dahulu:

    - Pengiriman subagent mode penyelesaian lebih memilih thread terikat atau rute percakapan apa pun saat ada.
    - Jika origin penyelesaian hanya membawa saluran, OpenClaw fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasilnya fallback ke pengiriman sesi antrean alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau usang tetap dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres sebelumnya yang sudah usang.
    - Jika child timeout setelah hanya pemanggilan alat, pengumuman dapat merangkumnya menjadi ringkasan progres parsial singkat alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    pekerjaan terjadwal tidak akan berjalan.

    Checklist:

    - Pastikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa sleep/restart).
    - Verifikasi pengaturan zona waktu untuk pekerjaan (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomasi](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke saluran. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pengiriman fallback runner yang diharapkan.
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan autentikasi saluran (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim, tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (hanya `NO_REPLY` / `no_reply`) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback yang diantrekan.

    Untuk pekerjaan cron terisolasi, agen masih dapat mengirim langsung dengan tool `message`
    ketika rute chat tersedia. `--announce` hanya mengontrol jalur fallback runner
    untuk teks akhir yang belum dikirim oleh agen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa cron run terisolasi beralih model atau mencoba ulang sekali?">
    Itu biasanya jalur pergantian model live, bukan penjadwalan duplikat.

    Cron terisolasi dapat menyimpan handoff model runtime dan mencoba ulang ketika run
    aktif melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang sudah diganti, dan jika pergantian membawa override profil auth baru, cron
    juga menyimpannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang lebih dulu bila berlaku.
    - Lalu `model` per pekerjaan.
    - Lalu override model sesi cron yang tersimpan.
    - Lalu pemilihan model agen/default normal.

    Loop percobaan ulang dibatasi. Setelah upaya awal plus 2 percobaan ulang pergantian,
    cron membatalkan, bukan berulang selamanya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [CLI cron](/id/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara memasang skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
    Jelajahi skills di [https://clawhub.ai](https://clawhub.ai).

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

    `openclaw skills install` native menulis ke direktori `skills/` workspace aktif.
    Pasang CLI `clawhub` terpisah hanya jika Anda ingin menerbitkan atau
    menyinkronkan skills Anda sendiri. Untuk pemasangan bersama lintas agen, letakkan skill di bawah
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin mempersempit agen mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas berdasarkan jadwal atau terus-menerus di latar belakang?">
    Bisa. Gunakan penjadwal Gateway:

    - **Pekerjaan Cron** untuk tugas terjadwal atau berulang (tetap ada setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Pekerjaan terisolasi** untuk agen otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomatisasi](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` plus biner yang diperlukan, dan skills hanya muncul di prompt sistem ketika memenuhi syarat di **host Gateway**. Di Linux, skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengesampingkan gating.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS tersedia, lalu hubungkan dari Linux dalam [mode jarak jauh](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan node macOS (aplikasi menubar), dan atur **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan skills khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan ada di node. Agen menjalankan skills tersebut melalui tool `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt menambahkan perintah tersebut ke allowlist.

    **Opsi C - proksi biner macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat biner CLI yang diperlukan di-resolve ke wrapper SSH yang berjalan di Mac. Lalu override skill untuk mengizinkan Linux agar tetap memenuhi syarat.

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

    4. Mulai sesi baru agar snapshot skills diperbarui.

  </Accordion>

  <Accordion title="Apakah Anda memiliki integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen keduanya memiliki API).
    - **Otomatisasi browser:** berfungsi tanpa kode, tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menjaga konteks per klien (alur kerja agensi), pola sederhana adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agen mengambil halaman tersebut di awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau buat skill
    yang menargetkan API tersebut.

    Pasang skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Pemasangan native masuk ke direktori `skills/` workspace aktif. Untuk skills bersama lintas agen, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya sebagian agen yang boleh melihat pemasangan bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa skills mengharapkan biner yang dipasang melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan [ClawHub](/id/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser `user` bawaan, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini dapat menggunakan browser host lokal atau node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host node di mesin browser atau gunakan CDP jarak jauh sebagai gantinya.

    Batasan saat ini pada `existing-session` / `user`:

    - tindakan berbasis ref, bukan berbasis CSS selector
    - unggahan memerlukan `ref` / `inputRef` dan saat ini mendukung satu file sekaligus
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumentasi sandboxing khusus?">
    Ada. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, sehingga tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Pertahankan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap ada.
    - Masukkan dependensi sistem ke image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Pasang browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Atur `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path tersebut dipertahankan.

    Dokumentasi: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi tetapi membuat grup publik/tersandbox dengan satu agen?">
    Bisa - jika traffic privat Anda adalah **DM** dan traffic publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/saluran (kunci non-main) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap di host. Docker adalah backend default jika Anda tidak memilih satu. Lalu batasi tool yang tersedia di sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh konfigurasi: [Grup: DM pribadi + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi utama: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Atur `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya, `"/home/user/src:/src:ro"`). Bind global + per agen digabung; bind per agen diabaikan ketika `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati batas filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonis yang di-resolve melalui ancestor terdalam yang ada. Itu berarti escape parent symlink tetap gagal tertutup bahkan ketika segmen path terakhir belum ada, dan pemeriksaan root yang diizinkan tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Kebijakan Tool vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agen:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (hanya sesi utama/pribadi)

    OpenClaw juga menjalankan **flush memori pra-Compaction senyap** untuk mengingatkan model
    agar menulis catatan tahan lama sebelum auto-compaction. Ini hanya berjalan ketika workspace
    dapat ditulis (sandbox read-only melewatinya). Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan hal-hal. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta ke memori**. Catatan jangka panjang ditempatkan di `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih merupakan area yang sedang kami tingkatkan. Membantu untuk mengingatkan model agar menyimpan memori;
    model akan tahu apa yang harus dilakukan. Jika terus lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama pada setiap run.

    Dokumentasi: [Memori](/id/concepts/memory), [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasannya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, sehingga percakapan panjang dapat dikompaksi atau dipotong. Itulah sebabnya
    pencarian memori ada - ia hanya menarik bagian yang relevan kembali ke konteks.

    Dokumentasi: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**. OAuth Codex mencakup chat/completions dan
    **tidak** memberikan akses embedding, jadi **masuk dengan Codex (OAuth atau login
    CLI Codex)** tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap memerlukan kunci API sungguhan (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw otomatis memilih provider saat
    dapat menemukan kunci API (profil auth, `models.providers.*.apiKey`, atau env vars).
    OpenClaw memilih OpenAI jika kunci OpenAI ditemukan, jika tidak Gemini jika kunci Gemini
    ditemukan, lalu Voyage, lalu Mistral. Jika tidak ada kunci remote yang tersedia, pencarian
    memori tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda memiliki path model lokal
    yang dikonfigurasi dan ada, OpenClaw
    memilih `local`. Ollama didukung saat Anda menetapkan secara eksplisit
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, tetapkan `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda ingin embedding Gemini, tetapkan
    `memorySearch.provider = "gemini"` dan berikan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau local**
    - lihat [Memori](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Lokasi hal-hal di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim kepada mereka**.

    - **Lokal secara default:** sesi, file memori, config, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Remote karena diperlukan:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) masuk ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap di mesin Anda, tetapi traffic channel
      tetap melewati server channel tersebut.

    Terkait: [Workspace agent](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config utama (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth legacy (disalin ke profil auth pada penggunaan pertama) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, kunci API, dan opsional `keyRef`/`tokenRef`)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret berbasis file opsional untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas legacy (entri `api_key` statis dibersihkan)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per agent (agentDir + sesi)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat & state percakapan (per agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agent)                                          |

    Path single-agent legacy: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
    File-file ini berada di **workspace agent**, bukan `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opsional `HEARTBEAT.md`.
      Root `memory.md` huruf kecil hanya merupakan input perbaikan legacy; `openclaw doctor --fix`
      dapat menggabungkannya ke `MEMORY.md` saat kedua file ada.
    - **State dir (`~/.openclaw`)**: config, state channel/provider, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan
    workspace yang sama pada setiap peluncuran (dan ingat: mode remote menggunakan **workspace milik host gateway**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** alih-alih mengandalkan riwayat chat.

    Lihat [Workspace agent](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi backup yang direkomendasikan">
    Letakkan **workspace agent** Anda di repo git **privat** dan backup ke tempat
    privat (misalnya GitHub private). Ini menangkap memori + file AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    Jangan commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload secret terenkripsi).
    Jika Anda membutuhkan pemulihan penuh, backup workspace dan direktori state
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Workspace agent](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Uninstall](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agent bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox keras.
    Path relatif di-resolve di dalam workspace, tetapi path absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agent. Jika Anda
    ingin sebuah repo menjadi direktori kerja default, arahkan
    `workspace` agent tersebut ke root repo. Repo OpenClaw hanyalah kode sumber; pisahkan
    workspace kecuali Anda memang ingin agent bekerja di dalamnya.

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

  <Accordion title="Mode remote: di mana penyimpanan sesinya?">
    State sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode remote, penyimpanan sesi yang Anda perlukan berada di mesin remote, bukan laptop lokal Anda. Lihat [Manajemen sesi](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar config

<AccordionGroup>
  <Accordion title="Apa format config? Di mana letaknya?">
    OpenClaw membaca config **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, OpenClaw menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menetapkan gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan tidak terotorisasi'>
    Bind non-loopback **memerlukan path auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy identity-aware yang dikonfigurasi dengan benar

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
    - Path panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak disetel.
    - Untuk auth kata sandi, tetapkan `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat di-resolve, resolusi gagal tertutup (tidak ditutupi fallback remote).
    - Penyiapan Control UI shared-secret mengautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan app/UI). Mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header request. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback same-host memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit dan entri loopback di `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Mengapa saya sekarang perlu token di localhost?">
    OpenClaw menerapkan auth gateway secara default, termasuk loopback. Pada path default normal, itu berarti auth token: jika tidak ada path auth eksplisit yang dikonfigurasi, startup gateway di-resolve ke mode token dan menghasilkan token khusus runtime untuk startup tersebut, sehingga **client WS lokal harus mengautentikasi**. Konfigurasikan `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit saat client memerlukan secret yang stabil lintas restart. Ini memblokir proses lokal lain agar tidak memanggil Gateway.

    Jika Anda lebih suka path auth lain, Anda dapat memilih mode kata sandi secara eksplisit (atau, untuk reverse proxy identity-aware, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, tetapkan `gateway.auth.mode: "none"` secara eksplisit di config Anda. Doctor dapat menghasilkan token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah config?">
    Gateway memantau config dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): terapkan perubahan aman secara hot, restart untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI lucu?">
    Tetapkan `cli.banner.taglineMode` di config:

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
    - `random`: tagline lucu/musiman yang berganti-ganti (perilaku default).
    - Jika Anda tidak ingin banner sama sekali, tetapkan env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` bekerja tanpa kunci API. `web_search` bergantung pada
    provider yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan kunci API normal mereka.
    - Ollama Web Search bebas kunci, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo bebas kunci, tetapi merupakan integrasi berbasis HTML tidak resmi.
    - SearXNG bebas kunci/self-hosted; konfigurasikan `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
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
    Path penyedia lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk konfigurasi baru.
    Konfigurasi fallback pengambilan web Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis penyedia fallback fetch siap pakai pertama dari kredensial yang tersedia. Saat ini penyedia bawaan adalah Firecrawl.
    - Daemon membaca variabel env dari `~/.openclaw/.env` (atau lingkungan layanan).

    Dokumentasi: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` menggantikan **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua
    yang lain akan dihapus.

    OpenClaw saat ini melindungi dari banyak penimpaan tidak disengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi konfigurasi penuh pascaperubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Jika edit langsung merusak startup atau hot reload, Gateway gagal tertutup atau melewati reload; Gateway tidak menulis ulang `openclaw.json`.
    - `openclaw doctor --fix` menangani perbaikan dan dapat memulihkan versi terakhir yang diketahui baik sambil menyimpan file yang ditolak sebagai `openclaw.json.clobbered.*`.

    Pulihkan:

    - Periksa `openclaw logs --follow` untuk `Invalid config at`, `Config write rejected:`, atau `config reload skipped (invalid config)`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di samping konfigurasi aktif.
    - Jalankan `openclaw config validate` dan `openclaw doctor --fix`.
    - Salin kembali hanya key yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jika Anda tidak memiliki payload terakhir yang diketahui baik atau yang ditolak, pulihkan dari cadangan, atau jalankan ulang `openclaw doctor` dan konfigurasikan ulang channel/model.
    - Jika ini tidak terduga, laporkan bug dan sertakan konfigurasi terakhir yang Anda ketahui atau cadangan apa pun.
    - Agen coding lokal sering kali dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu ketika Anda tidak yakin tentang path persis atau bentuk field; ini mengembalikan node skema dangkal plus ringkasan anak langsung untuk penelusuran.
    - Gunakan `config.patch` untuk edit RPC parsial; gunakan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan alat `gateway` khusus pemilik dari proses agen, alat itu tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke path exec terlindungi yang sama).

    Dokumentasi: [Konfigurasi](/id/cli/config), [Konfigurasi](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola umum adalah **satu Gateway** (misalnya Raspberry Pi) plus **node** dan **agen**:

    - **Gateway (pusat):** mengelola channel (Signal/WhatsApp), routing, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (worker):** brain/workspace terpisah untuk peran khusus (misalnya "Operasi Hetzner", "Data pribadi").
    - **Sub-agen:** memunculkan pekerjaan latar belakang dari agen utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan beralih agen/sesi.

    Dokumentasi: [Node](/id/nodes), [Akses jarak jauh](/id/gateway/remote), [Routing Multi-Agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [TUI](/id/web/tui).

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

    Default adalah `false` (headful). Headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Headless menggunakan **mesin Chromium yang sama** dan berfungsi untuk sebagian besar otomatisasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomatisasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Atur `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium apa pun) dan mulai ulang Gateway.
    Lihat contoh konfigurasi lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway dan node jarak jauh

<AccordionGroup>
  <Accordion title="Bagaimana command menyebar antara Telegram, gateway, dan node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agen dan
    baru kemudian memanggil node melalui **Gateway WebSocket** saat alat node diperlukan:

    Telegram → Gateway → Agen → `node.*` → Node → Gateway → Telegram

    Node tidak melihat traffic penyedia masuk; node hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway di-host secara jarak jauh?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil alat `node.*` (layar, kamera, sistem) di mesin lokal Anda melalui Gateway WebSocket.

    Setup umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumah).
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

    Pengingat keamanan: memasangkan node macOS mengizinkan `system.run` di mesin tersebut. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Keamanan](/id/gateway/security).

    Dokumentasi: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [Mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Apa sekarang?">
    Periksa hal dasar:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan channel: `openclaw channels status`

    Lalu verifikasi autentikasi dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, konfirmasi tunnel lokal aktif dan mengarah ke port yang benar.
    - Konfirmasi allowlist Anda (DM atau grup) menyertakan akun Anda.

    Dokumentasi: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Channel](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw berbicara satu sama lain (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda dapat menghubungkannya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika satu bot berada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh itu
    melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)).

    Pola contoh (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Kiat: tambahkan guardrail agar kedua bot tidak berulang tanpa henti (hanya-mention, allowlist channel,
    atau aturan "jangan balas pesan bot").

    Dokumentasi: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Kirim agen](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway dapat meng-host beberapa agen, masing-masing dengan workspace, default model,
    dan routing sendiri. Itu adalah setup normal dan jauh lebih murah serta sederhana daripada menjalankan
    satu VPS per agen.

    Gunakan VPS terpisah hanya ketika Anda membutuhkan isolasi keras (batas keamanan) atau konfigurasi yang sangat
    berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agen atau sub-agen.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya daripada SSH dari VPS?">
    Ya - node adalah cara kelas utama untuk menjangkau laptop Anda dari Gateway jarak jauh, dan node
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau box sekelas Raspberry Pi sudah cukup; RAM 4 GB sudah banyak), sehingga setup umum
    adalah host yang selalu aktif plus laptop Anda sebagai node.

    - **Tidak perlu SSH masuk.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pemasangan perangkat.
    - **Kontrol eksekusi lebih aman.** `system.run` dibatasi oleh allowlist/persetujuan node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau lampirkan ke Chrome lokal di host melalui Chrome MCP.

    SSH baik untuk akses shell ad-hoc, tetapi node lebih sederhana untuk workflow agen berkelanjutan dan
    otomatisasi perangkat.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang sebaiknya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node headless
    dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Mulai ulang penuh diperlukan untuk perubahan `gateway`, `discovery`, dan permukaan Plugin yang di-host.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree konfigurasi dengan node skema dangkalnya, petunjuk UI yang cocok, dan ringkasan turunan langsung sebelum menulis
    - `config.get`: ambil snapshot saat ini + hash
    - `config.patch`: pembaruan parsial yang aman (lebih disarankan untuk sebagian besar edit RPC); hot-reload jika memungkinkan dan restart jika diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; hot-reload jika memungkinkan dan restart jika diperlukan
    - Alat runtime `gateway` khusus pemilik masih menolak menulis ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama

  </Accordion>

  <Accordion title="Konfigurasi waras minimal untuk instalasi pertama">
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
    3. **Aktifkan MagicDNS (disarankan)**
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS memiliki nama yang stabil.
    4. **Gunakan nama host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan UI Kontrol tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini membuat gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan Node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **UI Kontrol Gateway + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang disarankan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Jarak Jauh** (target SSH dapat berupa nama host tailnet).
       Aplikasi akan membuat tunnel port Gateway dan terhubung sebagai Node.
    3. **Setujui Node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Protokol Gateway](/id/gateway/protocol), [Penemuan](/id/gateway/discovery), [mode jarak jauh macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal di laptop kedua atau cukup menambahkan Node?">
    Jika Anda hanya memerlukan **alat lokal** (layar/kamera/exec) di laptop kedua, tambahkan sebagai
    **Node**. Ini mempertahankan satu Gateway dan menghindari konfigurasi ganda. Alat Node lokal
    saat ini hanya untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya jika Anda memerlukan **isolasi keras** atau dua bot yang sepenuhnya terpisah.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabel env dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat variabel lingkungan?">
    OpenClaw membaca variabel env dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback global `.env` dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak satu pun file `.env` menimpa variabel env yang sudah ada.

    Anda juga dapat mendefinisikan variabel env inline dalam konfigurasi (diterapkan hanya jika belum ada di env proses):

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

  <Accordion title="Saya memulai Gateway melalui layanan dan variabel env saya hilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Letakkan kunci yang hilang di `~/.openclaw/.env` agar tetap diambil meskipun layanan tidak mewarisi env shell Anda.
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

    Ini menjalankan shell login Anda dan hanya mengimpor kunci yang diharapkan yang belum ada (tidak pernah menimpa). Padanan variabel env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya mengatur COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti variabel env Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    shell login Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), ia tidak akan mewarisi
    lingkungan shell Anda. Perbaiki dengan melakukan salah satu dari ini:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` konfigurasi Anda (diterapkan hanya jika belum ada).

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
    Atur ke nilai positif untuk mengaktifkan kedaluwarsa karena idle. Saat diaktifkan, pesan **berikutnya**
    setelah periode idle memulai id sesi baru untuk kunci chat tersebut.
    Ini tidak menghapus transkrip - ini hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara untuk membuat tim instance OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **perutean multi-agen** dan **sub-agen**. Anda dapat membuat satu agen koordinator
    dan beberapa agen pekerja dengan workspace dan model mereka sendiri.

    Meski begitu, ini paling tepat dilihat sebagai **eksperimen yang menyenangkan**. Ini boros token dan sering
    kurang efisien dibandingkan menggunakan satu bot dengan sesi terpisah. Model umum yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot itu
    juga dapat menjalankan sub-agen saat diperlukan.

    Dokumentasi: [Perutean multi-agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [CLI Agen](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Obrolan panjang, keluaran alat yang besar, atau banyak
    file dapat memicu Compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum status saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agen untuk pekerjaan panjang atau paralel agar obrolan utama tetap lebih kecil.
    - Pilih model dengan jendela konteks yang lebih besar jika ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mereset OpenClaw sepenuhnya tetapi tetap mempertahankan instalasinya?">
    Gunakan perintah reset:

    ```bash
    openclaw reset
    ```

    Reset penuh non-interaktif:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Lalu jalankan ulang penyiapan:

    ```bash
    openclaw onboard --install-daemon
    ```

    Catatan:

    - Onboarding juga menawarkan **Reset** jika mendeteksi konfigurasi yang sudah ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori status (default adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan galat "context too large" - bagaimana cara mereset atau memadatkannya?'>
    Gunakan salah satu dari ini:

    - **Compact** (mempertahankan percakapan tetapi merangkum giliran lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk mengarahkan ringkasan.

    - **Reset** (ID sesi baru untuk kunci obrolan yang sama):

      ```
      /new
      /reset
      ```

    Jika terus terjadi:

    - Aktifkan atau sesuaikan **pemangkasan sesi** (`agents.defaults.contextPruning`) untuk memangkas keluaran alat lama.
    - Gunakan model dengan jendela konteks yang lebih besar.

    Dokumentasi: [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning), [Manajemen sesi](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah galat validasi penyedia: model menghasilkan blok `tool_use` tanpa `input`
    yang diperlukan. Ini biasanya berarti riwayat sesi sudah usang atau rusak (sering setelah thread panjang
    atau perubahan alat/skema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapatkan pesan Heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1h** saat menggunakan autentikasi OAuth). Sesuaikan atau nonaktifkan:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // atau "0m" untuk menonaktifkan
          },
        },
      },
    }
    ```

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header
    markdown seperti `# Heading`), OpenClaw melewati jalankan Heartbeat untuk menghemat panggilan API.
    Jika file tidak ada, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Penggantian per agen menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

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
    Opsi 1 (tercepat): pantau log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): tampilkan daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Direktori](/id/cli/directory), [Log](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Pembatasan mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Obrolan langsung digabungkan ke sesi utama secara default. Grup/channel memiliki kunci sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agen yang dapat saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agen berarti lebih banyak penggunaan model secara bersamaan.
    - **Beban operasional:** profil autentikasi, workspace, dan perutean channel per agen.

    Tips:

    - Pertahankan satu workspace **aktif** per agen (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri penyimpanan) jika disk bertambah.
    - Gunakan `openclaw doctor` untuk menemukan workspace yang tersisa dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat sekaligus (Slack), dan bagaimana cara menyiapkannya?">
    Bisa. Gunakan **Perutean Multi-Agen** untuk menjalankan beberapa agen terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agen tertentu.

    Akses browser sangat kuat tetapi bukan berarti "dapat melakukan apa saja yang manusia bisa lakukan" - anti-bot, CAPTCHA, dan MFA masih dapat
    memblokir otomatisasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP pada mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agen per peran (binding).
    - Channel Slack yang diikat ke agen-agen tersebut.
    - Browser lokal melalui Chrome MCP atau Node saat diperlukan.

    Docs: [Perutean Multi-Agen](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil autentikasi

Tanya jawab model — default, pemilihan, alias, pergantian, failover, profil autentikasi —
tersedia di [FAQ Model](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port termultipleks untuk WebSocket + HTTP (Control UI, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah tampilan dari **supervisor** (launchd/systemd/schtasks). Probe konektivitas adalah CLI yang benar-benar tersambung ke WebSocket gateway.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (yang benar-benar terikat pada port)
    - `Last gateway error:` (penyebab umum saat proses masih hidup tetapi port tidak mendengarkan)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" yang berbeda?'>
    Anda mengedit satu file konfigurasi sementara layanan menjalankan file lain (sering kali ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / lingkungan yang sama dengan yang ingin Anda gunakan untuk layanan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menegakkan kunci runtime dengan mengikat listener WebSocket segera saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, ia melempar `GatewayLockError` yang menunjukkan instance lain sudah mendengarkan.

    Perbaikan: hentikan instance lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode jarak jauh (klien tersambung ke Gateway di tempat lain)?">
    Atur `gateway.mode: "remote"` dan arahkan ke URL WebSocket jarak jauh, secara opsional dengan kredensial jarak jauh shared-secret:

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

    - `openclaw gateway` hanya mulai saat `gateway.mode` adalah `local` (atau Anda meneruskan flag override).
    - Aplikasi macOS memantau file konfigurasi dan beralih mode secara langsung saat nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanya kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan autentikasi gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus menyambung ulang). Sekarang bagaimana?'>
    Jalur autentikasi gateway dan metode autentikasi UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL gateway yang dipilih, sehingga penyegaran pada tab yang sama tetap berfungsi tanpa memulihkan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan token perangkat yang di-cache saat gateway mengembalikan petunjuk retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token yang di-cache itu sekarang menggunakan kembali scope yang disetujui dan di-cache yang disimpan bersama token perangkat. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan kumpulan scope yang mereka minta alih-alih mewarisi scope yang di-cache.
    - Di luar jalur retry itu, prioritas autentikasi koneksi adalah token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pemeriksaan scope token bootstrap menggunakan prefiks peran. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; node atau peran non-operator lain tetap memerlukan scope di bawah prefiks peran mereka sendiri.

    Perbaikan:

    - Tercepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum punya token: `openclaw doctor --generate-gateway-token`.
    - Jika jarak jauh, buat tunnel terlebih dahulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: atur `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempelkan secret yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode proxy tepercaya: pastikan Anda datang melalui proxy sadar-identitas yang dikonfigurasi, bukan URL gateway mentah. Proxy loopback host yang sama juga memerlukan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jika ketidakcocokan tetap ada setelah satu retry, rotasi/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotasi itu mengatakan ditolak, periksa dua hal:
      - sesi perangkat yang dipasangkan hanya dapat merotasi perangkat **miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi scope operator pemanggil saat ini
    - Masih macet? Jalankan `openclaw status --all` dan ikuti [Pemecahan Masalah](/id/gateway/troubleshooting). Lihat [Dashboard](/id/web/dashboard) untuk detail autentikasi.

  </Accordion>

  <Accordion title="Saya mengatur gateway.bind tailnet tetapi tidak dapat bind dan tidak ada yang mendengarkan">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmuka sedang down), tidak ada yang dapat di-bind.

    Perbaikan:

    - Mulai Tailscale pada host tersebut (agar memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` saat Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa Gateway pada host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa channel perpesanan dan agen. Gunakan beberapa Gateway hanya saat Anda memerlukan redundansi (mis: bot penyelamat) atau isolasi keras.

    Bisa, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Atur `gateway.port` unik di setiap konfigurasi profil (atau teruskan `--port` untuk eksekusi manual).
    - Instal layanan per profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan sufiks pada nama layanan (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan ia mengharapkan pesan pertama berupa
    frame `connect`. Jika menerima hal lain, ia menutup koneksi
    dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di browser (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header autentikasi atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab browser biasa.
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

    Anda dapat menetapkan path stabil melalui `logging.file`. Level log file dikontrol oleh `logging.level`. Verbositas konsol dikontrol oleh `--verbose` dan `logging.consoleLevel`.

    Tail log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log layanan/supervisor (saat gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Pemecahan Masalah](/id/gateway/troubleshooting) untuk selengkapnya.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/memulai ulang layanan Gateway?">
    Gunakan helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan gateway secara manual, `openclaw gateway --force` dapat mengambil kembali port. Lihat [Gateway](/id/gateway).

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

    Jika Anda tidak pernah menginstal layanan, mulai di foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows Native (tidak direkomendasikan):** Gateway berjalan langsung di Windows.

    Buka PowerShell dan jalankan:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankannya secara manual (tanpa layanan), gunakan:

    ```powershell
    openclaw gateway run
    ```

    Docs: [Windows (WSL2)](/id/platforms/windows), [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Gateway sudah aktif tetapi balasan tidak pernah tiba. Apa yang harus saya periksa?">
    Mulai dengan pemeriksaan kesehatan cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Auth model tidak dimuat di **host Gateway** (periksa `models status`).
    - Pairing/allowlist channel memblokir balasan (periksa konfigurasi channel + log).
    - WebChat/Dashboard terbuka tanpa token yang tepat.

    Jika Anda remote, pastikan koneksi tunnel/Tailscale aktif dan
    WebSocket Gateway dapat dijangkau.

    Docs: [Channel](/id/channels), [Pemecahan masalah](/id/gateway/troubleshooting), [Akses remote](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Terputus dari gateway: tidak ada alasan" - sekarang apa?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang tepat? `openclaw dashboard`
    4. Jika remote, apakah tautan tunnel/Tailscale aktif?

    Lalu ikuti log:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/id/web/dashboard), [Akses remote](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands gagal. Apa yang harus saya periksa?">
    Mulailah dengan log dan status channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan errornya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas hingga batas Telegram dan mencoba lagi dengan lebih sedikit perintah, tetapi beberapa entri menu masih perlu dihapus. Kurangi perintah Plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di balik proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway berada di remote, pastikan Anda melihat log di host Gateway.

    Docs: [Telegram](/id/channels/telegram), [Pemecahan masalah channel](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama pastikan Gateway dapat dijangkau dan agen dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat keadaan saat ini. Jika Anda mengharapkan balasan di channel chat,
    pastikan pengiriman diaktifkan (`/deliver on`).

    Docs: [TUI](/id/web/tui), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda menginstal service:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **service yang diawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini ketika Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankannya di foreground, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Docs: [Runbook service Gateway](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: memulai ulang **service latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di foreground** untuk sesi terminal ini.

    Jika Anda menginstal service, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan proses satu kali yang berjalan di foreground.

  </Accordion>

  <Accordion title="Cara tercepat mendapatkan detail lebih banyak saat sesuatu gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol yang lebih banyak. Lalu periksa file log untuk auth channel, routing model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agen harus menyertakan baris `MEDIA:<path-or-url>` (di baris tersendiri). Lihat [Penyiapan asisten OpenClaw](/id/start/openclaw) dan [Pengiriman agen](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Periksa juga:

    - Channel target mendukung media keluar dan tidak diblokir oleh allowlist.
    - File berada dalam batas ukuran penyedia (gambar diubah ukurannya ke maksimum 2048px).
    - `tools.fs.workspaceOnly=true` membatasi pengiriman path lokal ke workspace, temp/media-store, dan file yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan `MEDIA:` mengirim file lokal host yang sudah dapat dibaca agen, tetapi hanya untuk media plus jenis dokumen aman (gambar, audio, video, PDF, dan dokumen Office). Teks polos dan file yang terlihat seperti rahasia tetap diblokir.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input yang tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada channel yang mendukung DM adalah **pairing**:
      - Pengirim tidak dikenal menerima kode pairing; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per channel**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak tiba.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk memunculkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi perhatian untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten tidak tepercaya**, bukan hanya siapa yang dapat mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (web search/fetch, halaman browser, email,
    docs, lampiran, log yang ditempel), konten itu dapat menyertakan instruksi yang mencoba
    mengambil alih model. Ini dapat terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar muncul ketika tool diaktifkan: model dapat ditipu untuk
    mengekfiltrasi konteks atau memanggil tool atas nama Anda. Kurangi radius dampaknya dengan:

    - menggunakan agen "reader" yang read-only atau tool-disabled untuk meringkas konten tidak tepercaya
    - tetap menonaktifkan `web_search` / `web_fetch` / `browser` untuk agen yang tool-enabled
    - memperlakukan teks file/dokumen yang didekode sebagai tidak tepercaya juga: OpenResponses
      `input_file` dan ekstraksi media-attachment sama-sama membungkus teks yang diekstrak dalam
      penanda batas konten eksternal eksplisit, alih-alih meneruskan teks file mentah
    - sandboxing dan allowlist tool yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Haruskah bot saya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi radius dampak jika terjadi masalah. Ini juga memudahkan rotasi
    kredensial atau pencabutan akses tanpa memengaruhi akun pribadi Anda.

    Mulailah dari kecil. Berikan akses hanya ke tool dan akun yang benar-benar Anda perlukan, dan perluas
    nanti jika diperlukan.

    Docs: [Keamanan](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Bisakah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola teraman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin ia mengirim pesan atas nama Anda.
    - Biarkan ia membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan tetap isolasikan. Lihat
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agen hanya untuk chat dan inputnya tepercaya. Tier yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agen yang tool-enabled
    atau saat membaca konten tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    tool dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapat kode pairing">
    Kode pairing dikirim **hanya** ketika pengirim tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` sendiri tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda ingin akses langsung, allowlist id pengirim Anda atau setel `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah ini akan mengirim pesan ke kontak saya? Bagaimana cara kerja pairing?">
    Tidak. Kebijakan DM default WhatsApp adalah **pairing**. Pengirim tidak dikenal hanya mendapatkan kode pairing dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Cantumkan permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: ini digunakan untuk menyetel **allowlist/owner** Anda agar DM Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankannya di nomor WhatsApp pribadi Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "ini tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau tool hanya muncul ketika **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih bising, periksa pengaturan sesi di Control UI dan setel verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` disetel
    ke `on` dalam konfigurasi.

    Docs: [Thinking dan verbose](/id/tools/thinking), [Keamanan](/id/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    Ini adalah pemicu abort (bukan perintah slash).

    Untuk proses latar belakang (dari tool exec), Anda dapat meminta agen menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ringkasan perintah slash: lihat [Perintah slash](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`, tetapi beberapa pintasan (seperti `/status`) juga berfungsi inline untuk pengirim yang masuk allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pengiriman pesan **lintas penyedia** secara default. Jika pemanggilan tool terikat
    ke Telegram, ia tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

    Aktifkan pengiriman pesan lintas penyedia untuk agen:

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

    Mulai ulang gateway setelah mengedit konfigurasi.

  </Accordion>

  <Accordion title='Mengapa bot terasa seperti "mengabaikan" pesan beruntun cepat?'>
    Mode antrean mengontrol bagaimana pesan baru berinteraksi dengan run yang sedang berjalan. Gunakan `/queue` untuk mengubah mode:

    - `steer` - antrekan semua steering tertunda untuk batas model berikutnya dalam run saat ini
    - `queue` - steering lama satu per satu
    - `followup` - jalankan pesan satu per satu
    - `collect` - kelompokkan pesan dan balas sekali
    - `steer-backlog` - steer sekarang, lalu proses backlog
    - `interrupt` - batalkan run saat ini dan mulai dari awal

    Mode bawaan adalah `steer`. Anda dapat menambahkan opsi seperti `debounce:0.5s cap:25 drop:summarize` untuk mode tindak lanjut. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model bawaan untuk Anthropic dengan kunci API?'>
    Di OpenClaw, kredensial dan pemilihan model terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic di profil auth) mengaktifkan autentikasi, tetapi model bawaan yang sebenarnya adalah apa pun yang Anda konfigurasi di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, artinya Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih mengalami kendala? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ pengoperasian pertama](/id/help/faq-first-run) — pemasangan, onboarding, auth, langganan, kegagalan awal
- [FAQ model](/id/help/faq-models) — pemilihan model, failover, profil auth
- [Pemecahan masalah](/id/help/troubleshooting) — triase berdasarkan gejala

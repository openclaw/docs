---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, penginstalan, orientasi awal, atau dukungan saat dijalankan
    - Melakukan triase atas masalah yang dilaporkan pengguna sebelum penelusuran kesalahan lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Tanya Jawab
x-i18n:
    generated_at: "2026-04-30T09:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (pengembangan lokal, VPS, multi-agen, OAuth/kunci API, failover model). Untuk diagnostik runtime, lihat [Pemecahan Masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agen/sesi, konfigurasi penyedia + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang dapat ditempel (aman untuk dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis hanya-baca dengan ekor log (token disunting).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe channel jika didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Kesehatan](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC mati, gunakan cadangan:

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

   Meminta snapshot lengkap dari Gateway yang sedang berjalan (hanya WS). Lihat [Kesehatan](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

Tanya jawab pertama kali — instalasi, onboarding, rute auth, langganan, kegagalan awal —
tersedia di [FAQ pertama kali](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. Ia membalas di permukaan pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan plugin channel bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah bidang kontrol yang selalu aktif; asistennya adalah produk.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." Ini adalah **bidang kontrol local-first** yang memungkinkan Anda menjalankan
    asisten kapabel di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi berstatus, memori, dan alat - tanpa menyerahkan kendali alur kerja Anda ke SaaS
    terhosting.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan pertahankan
      workspace + riwayat sesi tetap lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus suara seluler dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan perutean
      per agen dan failover.
    - **Opsi hanya-lokal:** jalankan model lokal agar **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Perutean multi-agen:** pisahkan agen per channel, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Sumber terbuka dan mudah dimodifikasi:** inspeksi, perluas, dan self-host tanpa vendor lock-in.

    Dokumentasi: [Gateway](/id/gateway), [Channel](/id/channels), [Multi-agen](/id/concepts/multi-agent),
    [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan lebih dulu?">
    Proyek awal yang baik:

    - Buat situs web (WordPress, Shopify, atau situs statis sederhana).
    - Buat prototipe aplikasi seluler (kerangka, layar, rencana API).
    - Rapikan file dan folder (pembersihan, penamaan, penandaan).
    - Hubungkan Gmail dan otomatisasi ringkasan atau tindak lanjut.

    Ia dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya menjadi fase dan
    menggunakan sub-agen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Kemenangan sehari-hari biasanya terlihat seperti:

    - **Pengarahan pribadi:** ringkasan kotak masuk, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penyusunan draf:** riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan daftar periksa berbasis cron atau heartbeat.
    - **Otomatisasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan draf**. Ia dapat memindai situs, membuat daftar pendek,
    meringkas prospek, dan menulis draf outreach atau teks iklan.

    Untuk **outreach atau kampanye iklan**, tetap libatkan manusia. Hindari spam, patuhi hukum lokal dan
    kebijakan platform, dan tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda menyetujuinya.

    Dokumentasi: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk local loop langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Keunggulan:

    - **Memori + workspace persisten** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hook)
    - **Gateway selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Node** untuk browser/layar/kamera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan skills tanpa membuat repo kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Letakkan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Urutan prioritas adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, sehingga override terkelola tetap menang atas skills bawaan tanpa menyentuh git. Jika Anda perlu skill terpasang secara global tetapi hanya terlihat oleh sebagian agen, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak dikirim upstream yang seharusnya berada di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat skills dari folder kustom?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Urutan prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika skill hanya boleh terlihat oleh agen tertentu, pasangkan dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model berbeda untuk tugas berbeda?">
    Saat ini pola yang didukung adalah:

    - **Pekerjaan Cron**: pekerjaan terisolasi dapat menetapkan override `model` per pekerjaan.
    - **Sub-agen**: rutekan tugas ke agen terpisah dengan model default berbeda.
    - **Pengalihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Pekerjaan Cron](/id/automation/cron-jobs), [Perutean Multi-Agen](/id/concepts/multi-agent), dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat mengerjakan pekerjaan berat. Bagaimana cara mengalihkannya?">
    Gunakan **sub-agen** untuk tugas panjang atau paralel. Sub-agen berjalan dalam sesinya sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn a sub-agent for this task" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah sedang sibuk).

    Tips token: tugas panjang dan sub-agen sama-sama mengonsumsi token. Jika biaya menjadi perhatian, tetapkan
    model yang lebih murah untuk sub-agen melalui `agents.defaults.subagents.model`.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagen yang terikat thread di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke target subagen atau sesi agar pesan tindak lanjut di thread tersebut tetap berada pada sesi yang terikat itu.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau bind secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepas thread.

    Konfigurasi wajib:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: tetapkan `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagen selesai, tetapi pembaruan penyelesaian masuk ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang terselesaikan lebih dulu:

    - Pengiriman subagen mode penyelesaian lebih memilih thread terikat atau rute percakapan apa pun saat ada.
    - Jika asal penyelesaian hanya membawa channel, OpenClaw fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasil fallback ke pengiriman sesi antrean alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau kedaluwarsa masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres sebelumnya yang sudah usang.
    - Jika child timeout setelah hanya panggilan alat, pengumuman dapat meringkasnya menjadi ringkasan progres parsial pendek alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    pekerjaan terjadwal tidak akan berjalan.

    Daftar periksa:

    - Pastikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa Gateway berjalan 24/7 (tidak tidur/restart).
    - Verifikasi pengaturan zona waktu untuk pekerjaan (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomatisasi & Tugas](/id/automation).

  </Accordion>

  <Accordion title="Cron dipicu, tetapi tidak ada yang dikirim ke channel. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pengiriman fallback runner yang diharapkan.
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan autentikasi channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback yang masuk antrean.

    Untuk pekerjaan Cron terisolasi, agen tetap dapat mengirim langsung dengan alat `message`
    ketika rute chat tersedia. `--announce` hanya mengontrol jalur fallback runner
    untuk teks akhir yang belum dikirim oleh agen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa eksekusi Cron terisolasi mengganti model atau mencoba ulang sekali?">
    Itu biasanya jalur pergantian model live, bukan penjadwalan duplikat.

    Cron terisolasi dapat mempertahankan handoff model runtime dan mencoba ulang ketika eksekusi
    aktif melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang sudah diganti, dan jika pergantian membawa override profil auth baru, Cron
    juga mempertahankannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang terlebih dahulu saat berlaku.
    - Lalu `model` per pekerjaan.
    - Lalu override model sesi Cron yang tersimpan.
    - Lalu pemilihan model agen/default normal.

    Loop percobaan ulang dibatasi. Setelah upaya awal ditambah 2 percobaan ulang pergantian,
    Cron membatalkan alih-alih melakukan loop selamanya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [CLI Cron](/id/cli/cron).

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

    `openclaw skills install` native menulis ke direktori `skills/`
    workspace aktif. Instal CLI `clawhub` terpisah hanya jika Anda ingin menerbitkan atau
    menyinkronkan Skills Anda sendiri. Untuk instalasi bersama lintas agen, letakkan skill di bawah
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin mempersempit agen mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas sesuai jadwal atau terus-menerus di latar belakang?">
    Ya. Gunakan penjadwal Gateway:

    - **Pekerjaan Cron** untuk tugas terjadwal atau berulang (tetap ada setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Pekerjaan terisolasi** untuk agen otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomasi & Tugas](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` ditambah binary yang diperlukan, dan Skills hanya muncul di prompt sistem saat memenuhi syarat di **host Gateway**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda meng-override gating.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat binary macOS tersedia, lalu hubungkan dari Linux dalam [mode remote](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat normal karena host Gateway adalah macOS.

    **Opsi B - gunakan Node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan Node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai memenuhi syarat ketika binary yang diperlukan ada di Node. Agen menjalankan Skills tersebut melalui alat `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt menambahkan perintah tersebut ke allowlist.

    **Opsi C - proksikan binary macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat binary CLI yang diperlukan ter-resolve ke wrapper SSH yang berjalan di Mac. Lalu override skill agar mengizinkan Linux sehingga tetap memenuhi syarat.

    1. Buat wrapper SSH untuk binary (contoh: `memo` untuk Apple Notes):

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

  <Accordion title="Apakah Anda memiliki integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen keduanya memiliki API).
    - **Otomasi browser:** bekerja tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin mempertahankan konteks per klien (alur kerja agensi), pola sederhana adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agen mengambil halaman tersebut di awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau bangun skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native ditempatkan di direktori `skills/` workspace aktif. Untuk Skills bersama lintas agen, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agen yang boleh melihat instalasi bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan binary yang diinstal melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Linux Homebrew di atas). Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini dapat menggunakan browser host lokal atau Node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host Node di mesin browser atau gunakan CDP remote.

    Batas saat ini pada `existing-session` / `user`:

    - aksi digerakkan oleh ref, bukan digerakkan oleh selector CSS
    - upload memerlukan `ref` / `inputRef` dan saat ini mendukung satu file pada satu waktu
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumentasi sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk setup khusus Docker (Gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur lengkap?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, sehingga tidak
    menyertakan paket sistem, Homebrew, atau browser bundel. Untuk setup yang lebih lengkap:

    - Pertahankan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap ada.
    - Panggang dependensi sistem ke dalam image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bundel:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path tersebut dipertahankan.

    Dokumentasi: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap personal tetapi membuat grup publik/tersandbox dengan satu agen?">
    Ya - jika traffic privat Anda adalah **DM** dan traffic publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` sehingga sesi grup/channel (key non-main) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap di-host. Docker adalah backend default jika Anda tidak memilih salah satu. Lalu batasi alat apa yang tersedia dalam sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan setup + contoh konfigurasi: [Grup: DM personal + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi utama: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (mis., `"/home/user/src:/src:ro"`). Bind global + per-agen digabung; bind per-agen diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonik yang di-resolve melalui ancestor terdalam yang sudah ada. Itu berarti escape parent symlink tetap gagal tertutup bahkan saat segmen path terakhir belum ada, dan pemeriksaan root yang diizinkan tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agen:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang terkurasi di `MEMORY.md` (hanya sesi utama/privat)

    OpenClaw juga menjalankan **flush memori pra-Compaction senyap** untuk mengingatkan model
    menulis catatan tahan lama sebelum auto-compaction. Ini hanya berjalan saat workspace
    dapat ditulis (sandbox hanya-baca melewatinya). Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan berbagai hal. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta ke memori**. Catatan jangka panjang berada di `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang sedang kami tingkatkan. Membantu jika mengingatkan model untuk menyimpan memori;
    model akan tahu apa yang harus dilakukan. Jika terus lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama pada setiap eksekusi.

    Dokumentasi: [Memori](/id/concepts/memory), [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, sehingga percakapan panjang dapat dikompaksi atau dipotong. Itulah sebabnya
    pencarian memori ada - pencarian tersebut hanya menarik bagian yang relevan kembali ke konteks.

    Dokumentasi: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**. OAuth Codex mencakup chat/completions dan
    **tidak** memberikan akses embedding, jadi **masuk dengan Codex (OAuth atau
    login CLI Codex)** tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap memerlukan kunci API nyata (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan penyedia secara eksplisit, OpenClaw otomatis memilih penyedia ketika
    dapat menemukan kunci API (profil auth, `models.providers.*.apiKey`, atau variabel env).
    OpenClaw lebih memilih OpenAI jika kunci OpenAI ditemukan, jika tidak Gemini jika kunci Gemini
    ditemukan, lalu Voyage, lalu Mistral. Jika tidak ada kunci jarak jauh yang tersedia, pencarian
    memori tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan tersedia, OpenClaw
    lebih memilih `local`. Ollama didukung ketika Anda menetapkan secara eksplisit
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, tetapkan `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda menginginkan embedding Gemini, tetapkan
    `memorySearch.provider = "gemini"` dan sediakan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau lokal**
    - lihat [Memori](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Tempat berbagai hal berada di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **status OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim kepada mereka**.

    - **Lokal secara default:** sesi, file memori, konfigurasi, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Jarak jauh karena kebutuhan:** pesan yang Anda kirim ke penyedia model (Anthropic/OpenAI/dll.) masuk ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt di mesin Anda, tetapi lalu lintas channel
      tetap melewati server channel tersebut.

    Terkait: [Workspace agen](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Jalur                                                           | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Konfigurasi utama (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth saat pertama digunakan)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, kunci API, dan `keyRef`/`tokenRef` opsional)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload rahasia opsional berbasis file untuk penyedia SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis dibersihkan)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Status penyedia (mis. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per agen (agentDir + sesi)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & status (per agen)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agen)                                           |

    Jalur agen tunggal lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
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
    workspace yang sama pada setiap peluncuran (dan ingat: mode jarak jauh menggunakan
    workspace **host gateway**, bukan laptop lokal Anda).

    Kiat: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** daripada mengandalkan riwayat chat.

    Lihat [Workspace agen](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi pencadangan yang direkomendasikan">
    Tempatkan **workspace agen** Anda di repo git **privat** dan cadangkan di tempat
    privat (misalnya GitHub privat). Ini menangkap file memori + AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    Jangan **commit** apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload rahasia terenkripsi).
    Jika Anda perlu pemulihan penuh, cadangkan workspace dan direktori status
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Hapus instalasi](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agen bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox keras.
    Jalur relatif diselesaikan di dalam workspace, tetapi jalur absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agen. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan
    `workspace` agen tersebut ke root repo. Repo OpenClaw hanyalah kode sumber; biarkan
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
    Status sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode jarak jauh, penyimpanan sesi yang penting bagi Anda berada di mesin jarak jauh, bukan laptop lokal Anda. Lihat [Manajemen sesi](/id/concepts/session).
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

  <Accordion title='Saya menetapkan gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan tidak terotorisasi'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya, ini berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy sadar-identitas yang dikonfigurasi dengan benar

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
    - Jalur panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak ditetapkan.
    - Untuk auth kata sandi, tetapkan `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa penyamaran fallback jarak jauh).
    - Penyiapan Control UI shared-secret melakukan autentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan app/UI). Mode pembawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit dan entri loopback di `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Mengapa saya sekarang memerlukan token di localhost?">
    OpenClaw menerapkan auth gateway secara default, termasuk loopback. Pada jalur default normal, itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway diselesaikan ke mode token dan membuatnya otomatis, menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus melakukan autentikasi**. Ini memblokir proses lokal lain untuk memanggil Gateway.

    Jika Anda lebih memilih jalur auth lain, Anda dapat memilih mode kata sandi secara eksplisit (atau, untuk reverse proxy sadar-identitas, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, tetapkan `gateway.auth.mode: "none"` secara eksplisit di konfigurasi Anda. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah konfigurasi?">
    Gateway memantau konfigurasi dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): menerapkan perubahan aman secara langsung, restart untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Tetapkan `cli.banner.taglineMode` di konfigurasi:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: menyembunyikan teks tagline tetapi tetap mempertahankan baris judul/versi banner.
    - `default`: menggunakan `All your chats, one OpenClaw.` setiap saat.
    - `random`: tagline lucu/musiman yang berotasi (perilaku default).
    - Jika Anda tidak menginginkan banner sama sekali, tetapkan env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` berfungsi tanpa kunci API. `web_search` bergantung pada
    penyedia yang Anda pilih:

    - Penyedia berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan kunci API normal mereka.
    - Ollama Web Search bebas kunci, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo bebas kunci, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG bebas kunci/dihosting sendiri; konfigurasi `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih penyedia.
    Alternatif lingkungan:

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

    Konfigurasi pencarian web khusus penyedia sekarang berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur penyedia lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk konfigurasi baru.
    Konfigurasi fallback pengambilan web Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan daftar izin, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw otomatis mendeteksi penyedia fallback pengambilan pertama yang siap dari kredensial yang tersedia. Saat ini penyedia bawaan adalah Firecrawl.
    - Daemon membaca variabel env dari `~/.openclaw/.env` (atau lingkungan layanan).

    Dokumentasi: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` mengganti **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua
    yang lain akan dihapus.

    OpenClaw saat ini melindungi banyak penimpaan yang tidak disengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi konfigurasi penuh setelah perubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Jika edit langsung merusak startup atau hot reload, Gateway memulihkan konfigurasi terakhir yang diketahui baik dan menyimpan file yang ditolak sebagai `openclaw.json.clobbered.*`.
    - Agen utama menerima peringatan boot setelah pemulihan sehingga tidak menulis ulang konfigurasi buruk tersebut secara membabi buta.

    Pulihkan:

    - Periksa `openclaw logs --follow` untuk `Config auto-restored from last-known-good`, `Config write rejected:`, atau `config reload restored last-known-good config`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di sebelah konfigurasi aktif.
    - Pertahankan konfigurasi aktif yang dipulihkan jika berfungsi, lalu salin kembali hanya kunci yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jalankan `openclaw config validate` dan `openclaw doctor`.
    - Jika Anda tidak memiliki payload terakhir yang diketahui baik atau yang ditolak, pulihkan dari cadangan, atau jalankan ulang `openclaw doctor` dan konfigurasi ulang kanal/model.
    - Jika ini tidak terduga, laporkan bug dan sertakan konfigurasi terakhir yang Anda ketahui atau cadangan apa pun.
    - Agen pengodean lokal sering dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu ketika Anda tidak yakin tentang jalur persis atau bentuk field; ini mengembalikan node skema dangkal ditambah ringkasan anak langsung untuk penelusuran.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan alat `gateway` khusus pemilik dari jalankan agen, alat tersebut tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke jalur exec terlindungi yang sama).

    Dokumentasi: [Konfigurasi](/id/cli/config), [Konfigurasi Interaktif](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan pekerja khusus di berbagai perangkat?">
    Pola umumnya adalah **satu Gateway** (mis. Raspberry Pi) ditambah **node** dan **agen**:

    - **Gateway (pusat):** memiliki kanal (Signal/WhatsApp), perutean, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (pekerja):** otak/ruang kerja terpisah untuk peran khusus (mis. "Operasi Hetzner", "Data pribadi").
    - **Sub-agen:** memunculkan pekerjaan latar belakang dari agen utama ketika Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan beralih agen/sesi.

    Dokumentasi: [Node](/id/nodes), [Akses jarak jauh](/id/gateway/remote), [Perutean Multi-Agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [TUI](/id/web/tui).

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

    - Tidak ada jendela browser yang terlihat (gunakan tangkapan layar jika Anda membutuhkan visual).
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
  <Accordion title="Bagaimana perintah disebarkan antara Telegram, gateway, dan node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agen dan
    baru kemudian memanggil node melalui **Gateway WebSocket** ketika alat node diperlukan:

    Telegram → Gateway → Agen → `node.*` → Node → Gateway → Telegram

    Node tidak melihat lalu lintas penyedia masuk; node hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway di-host secara jarak jauh?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil alat `node.*` (layar, kamera, sistem) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumah).
    2. Letakkan host Gateway + komputer Anda pada tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Jarak jauh melalui SSH** (atau tailnet langsung)
       agar dapat mendaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan node macOS mengizinkan `system.run` pada mesin tersebut. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Keamanan](/id/gateway/security).

    Dokumentasi: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Apa sekarang?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan kanal: `openclaw channels status`

    Lalu verifikasi autentikasi dan perutean:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, konfirmasi tunnel lokal aktif dan mengarah ke port yang benar.
    - Konfirmasi daftar izin Anda (DM atau grup) menyertakan akun Anda.

    Dokumentasi: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Kanal](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw berbicara satu sama lain (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda dapat merangkainya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan kanal obrolan normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan obrolan tempat bot lain
    mendengarkan. Jika satu bot berada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh tersebut
    melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)).

    Pola contoh (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak berulang tanpa henti (hanya-mention, daftar izin kanal,
    atau aturan "jangan balas pesan bot").

    Dokumentasi: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Kirim agen](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway dapat meng-host beberapa agen, masing-masing dengan ruang kerja, default model,
    dan peruteannya sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta lebih sederhana daripada menjalankan
    satu VPS per agen.

    Gunakan VPS terpisah hanya ketika Anda membutuhkan isolasi keras (batas keamanan) atau
    konfigurasi yang sangat berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agen atau sub-agen.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya alih-alih SSH dari VPS?">
    Ya - node adalah cara kelas satu untuk menjangkau laptop Anda dari Gateway jarak jauh, dan node
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau boks kelas Raspberry Pi sudah cukup; RAM 4 GB sangat memadai), jadi penyiapan umum
    adalah host yang selalu aktif ditambah laptop Anda sebagai node.

    - **Tidak perlu SSH masuk.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pemasangan perangkat.
    - **Kontrol eksekusi lebih aman.** `system.run` dikontrol oleh daftar izin/persetujuan node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau lampirkan ke Chrome lokal di host melalui Chrome MCP.

    SSH tidak masalah untuk akses shell ad-hoc, tetapi node lebih sederhana untuk alur kerja agen berkelanjutan dan
    otomatisasi perangkat.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang sebaiknya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node
    headless dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Mulai ulang penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree konfigurasi dengan node skema dangkal, petunjuk UI yang cocok, dan ringkasan anak langsung sebelum menulis
    - `config.get`: ambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial aman (lebih disukai untuk sebagian besar edit RPC); hot-reload jika memungkinkan dan mulai ulang jika diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; hot-reload jika memungkinkan dan mulai ulang jika diperlukan
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

    Ini menjaga gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan Node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Pengaturan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH dapat berupa hostname tailnet).
       Aplikasi akan membuat tunnel port Gateway dan terhubung sebagai Node.
    3. **Setujui Node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Protokol Gateway](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [mode remote macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal di laptop kedua atau cukup menambahkan Node?">
    Jika Anda hanya membutuhkan **alat lokal** (layar/kamera/exec) di laptop kedua, tambahkan sebagai
    **Node**. Ini mempertahankan satu Gateway dan menghindari konfigurasi duplikat. Alat Node lokal
    saat ini hanya tersedia untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya ketika Anda membutuhkan **isolasi ketat** atau dua bot yang sepenuhnya terpisah.

    Dokumentasi: [Nodes](/id/nodes), [CLI Nodes](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat variabel lingkungan?">
    OpenClaw membaca env vars dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback global `.env` dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak satu pun file `.env` menimpa env vars yang sudah ada.

    Anda juga dapat mendefinisikan env vars inline dalam konfigurasi (hanya diterapkan jika belum ada dari env proses):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Lihat [/environment](/id/help/environment) untuk presedensi dan sumber lengkap.

  </Accordion>

  <Accordion title="Saya memulai Gateway melalui layanan dan env vars saya menghilang. Apa sekarang?">
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

    Ini menjalankan shell login Anda dan hanya mengimpor kunci yang diharapkan yang belum ada (tidak pernah menimpa). Padanan env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya mengatur COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti env vars Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    shell login Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), Gateway tidak akan mewarisi
    lingkungan shell Anda. Perbaiki dengan melakukan salah satu dari ini:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` konfigurasi Anda (hanya diterapkan jika belum ada).

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

  <Accordion title="Apakah sesi otomatis direset jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Atur ke nilai positif untuk mengaktifkan kedaluwarsa saat idle. Saat diaktifkan, pesan **berikutnya**
    setelah periode idle memulai id sesi baru untuk kunci chat tersebut.
    Ini tidak menghapus transkrip - hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara membuat tim instans OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **perutean multi-agen** dan **sub-agen**. Anda dapat membuat satu agen koordinator
    dan beberapa agen pekerja dengan workspace dan model masing-masing.

    Meski begitu, ini paling tepat dilihat sebagai **eksperimen menyenangkan**. Ini berat token dan sering kali
    kurang efisien dibanding menggunakan satu bot dengan sesi terpisah. Model umum yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot itu
    juga dapat memunculkan sub-agen saat diperlukan.

    Dokumentasi: [Perutean multi-agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [CLI Agen](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, keluaran alat yang besar, atau banyak
    file dapat memicu Compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum keadaan saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat beralih topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agen untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
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

    - Onboarding juga menawarkan **Reset** jika menemukan konfigurasi yang sudah ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap state dir (defaultnya adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara mereset atau memadatkan?'>
    Gunakan salah satu dari ini:

    - **Compact** (mempertahankan percakapan tetapi merangkum giliran lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk memandu ringkasan.

    - **Reset** (ID sesi baru untuk kunci chat yang sama):

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
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa
    `input` yang wajib. Biasanya ini berarti riwayat sesi sudah usang atau rusak (sering setelah thread panjang
    atau perubahan alat/skema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya menerima pesan heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1h** saat menggunakan autentikasi OAuth). Sesuaikan atau nonaktifkan:

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
    markdown seperti `# Heading`), OpenClaw melewati Heartbeat run untuk menghemat panggilan API.
    Jika file hilang, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per agen menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda berada di grup tersebut, OpenClaw dapat melihatnya.
    Secara default, balasan grup diblokir hingga Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

    Jika Anda hanya ingin **Anda** yang dapat memicu balasan grup:

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
    Opsi 1 (tercepat): tail log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhir dengan `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Directory](/id/cli/directory), [Log](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Gating mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung digabungkan ke sesi utama secara default. Grup/channel memiliki kunci sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agen yang dapat saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agen berarti lebih banyak penggunaan model bersamaan.
    - **Beban operasional:** profil autentikasi, workspace, dan perutean channel per agen.

    Tips:

    - Pertahankan satu workspace **aktif** per agen (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri store) jika disk bertambah.
    - Gunakan `openclaw doctor` untuk menemukan workspace tersesat dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana saya harus menyiapkannya?">
    Ya. Gunakan **Perutean Multi-Agen** untuk menjalankan beberapa agen terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agen tertentu.

    Akses browser memang kuat tetapi bukan berarti "dapat melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA masih dapat
    memblokir otomatisasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP pada mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agen per peran (binding).
    - Channel Slack yang diikat ke agen tersebut.
    - Browser lokal melalui Chrome MCP atau Node bila diperlukan.

    Dokumentasi: [Perutean Multi-Agen](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil autentikasi

Tanya jawab model — default, pemilihan, alias, perpindahan, failover, profil autentikasi —
tersedia di [FAQ Model](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port multipleks untuk WebSocket + HTTP (Control UI, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah tampilan **supervisor** (launchd/systemd/schtasks). Probe konektivitas adalah CLI yang benar-benar terhubung ke WebSocket Gateway.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar terikat pada port)
    - `Last gateway error:` (penyebab utama yang umum ketika proses hidup tetapi port tidak mendengarkan)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" yang berbeda?'>
    Anda sedang mengedit satu file konfigurasi sementara layanan menjalankan file lain (sering kali ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / lingkungan yang sama dengan yang ingin digunakan layanan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw memberlakukan kunci runtime dengan mengikat listener WebSocket segera saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, ini melempar `GatewayLockError` yang menunjukkan instance lain sudah mendengarkan.

    Perbaikan: hentikan instance lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode jarak jauh (klien terhubung ke Gateway di tempat lain)?">
    Tetapkan `gateway.mode: "remote"` dan arahkan ke URL WebSocket jarak jauh, opsional dengan kredensial jarak jauh rahasia bersama:

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
    - Aplikasi macOS memantau file konfigurasi dan mengganti mode secara langsung ketika nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanya merupakan kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan autentikasi Gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus menyambung ulang). Apa sekarang?'>
    Jalur autentikasi Gateway Anda dan metode autentikasi UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL Gateway yang dipilih, sehingga refresh tab yang sama tetap berfungsi tanpa memulihkan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token perangkat yang di-cache ketika Gateway mengembalikan petunjuk percobaan ulang (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Percobaan ulang token yang di-cache itu sekarang menggunakan kembali scope yang disetujui dan di-cache yang disimpan bersama token perangkat. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set scope yang diminta alih-alih mewarisi scope yang di-cache.
    - Di luar jalur percobaan ulang itu, prioritas autentikasi koneksi adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Pemeriksaan scope token bootstrap memakai prefiks peran. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; Node atau peran non-operator lain tetap membutuhkan scope di bawah prefiks perannya sendiri.

    Perbaikan:

    - Tercepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jika jarak jauh, buat tunnel terlebih dahulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode rahasia bersama: tetapkan `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempel rahasia yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode proxy tepercaya: pastikan Anda masuk melalui proxy sadar identitas yang dikonfigurasi, bukan URL Gateway mentah. Proxy loopback host yang sama juga membutuhkan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jika ketidakcocokan tetap ada setelah satu percobaan ulang, rotasi/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotasi itu mengatakan ditolak, periksa dua hal:
      - sesi perangkat yang dipasangkan hanya dapat merotasi perangkat **miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi scope operator pemanggil saat ini
    - Masih buntu? Jalankan `openclaw status --all` dan ikuti [Pemecahan Masalah](/id/gateway/troubleshooting). Lihat [Dashboard](/id/web/dashboard) untuk detail autentikasi.

  </Accordion>

  <Accordion title="Saya menetapkan gateway.bind tailnet tetapi tidak dapat bind dan tidak ada yang mendengarkan">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmukanya mati), tidak ada yang dapat diikat.

    Perbaikan:

    - Mulai Tailscale pada host tersebut (agar memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` ketika Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa Gateway pada host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa channel pesan dan agen. Gunakan beberapa Gateway hanya ketika Anda membutuhkan redundansi (misalnya: bot penyelamat) atau isolasi ketat.

    Ya, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Tetapkan `gateway.port` unik di setiap konfigurasi profil (atau teruskan `--port` untuk menjalankan manual).
    - Instal layanan per profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan sufiks pada nama layanan (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan mengharapkan pesan pertama
    berupa frame `connect`. Jika menerima hal lain, Gateway menutup koneksi
    dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di browser (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header autentikasi atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab browser biasa.
    3. Jika autentikasi aktif, sertakan token/kata sandi dalam frame `connect`.

    Jika Anda menggunakan CLI atau TUI, URL harus terlihat seperti:

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

    Log layanan/supervisor (ketika Gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Pemecahan Masalah](/id/gateway/troubleshooting) untuk selengkapnya.

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

    Jika Anda belum pernah menginstal layanan, jalankan di foreground:

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

    - Autentikasi model tidak dimuat di **host gateway** (periksa `models status`).
    - Pairing/allowlist channel memblokir balasan (periksa konfigurasi channel + log).
    - WebChat/Dashboard terbuka tanpa token yang benar.

    Jika Anda jarak jauh, pastikan koneksi tunnel/Tailscale aktif dan
    WebSocket Gateway dapat dijangkau.

    Dokumentasi: [Channel](/id/channels), [Pemecahan Masalah](/id/gateway/troubleshooting), [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - apa sekarang?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika jarak jauh, apakah tautan tunnel/Tailscale aktif?

    Lalu pantau log:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/id/web/dashboard), [Akses jarak jauh](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands gagal. Apa yang harus saya periksa?">
    Mulai dengan log dan status saluran:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error-nya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas ke batas Telegram dan mencoba lagi dengan lebih sedikit perintah, tetapi beberapa entri menu masih perlu dibuang. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di balik proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway bersifat jarak jauh, pastikan Anda melihat log di host Gateway.

    Docs: [Telegram](/id/channels/telegram), [Pemecahan masalah saluran](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama pastikan Gateway dapat dijangkau dan agen dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat keadaan saat ini. Jika Anda mengharapkan balasan di saluran chat,
    pastikan pengiriman diaktifkan (`/deliver on`).

    Docs: [TUI](/id/web/tui), [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda memasang layanan:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **layanan terawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankan di latar depan, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Docs: [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: memulai ulang **layanan latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di latar depan** untuk sesi terminal ini.

    Jika Anda memasang layanan, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan eksekusi satu kali di latar depan.

  </Accordion>

  <Accordion title="Cara tercepat untuk mendapatkan detail lebih lanjut saat sesuatu gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol lebih banyak. Lalu periksa file log untuk autentikasi saluran, perutean model, dan error RPC.
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
    - File berada dalam batas ukuran penyedia (gambar diubah ukurannya hingga maksimal 2048px).
    - `tools.fs.workspaceOnly=true` membatasi pengiriman jalur lokal ke workspace, temp/media-store, dan file yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan `MEDIA:` mengirim file lokal host yang sudah dapat dibaca agen, tetapi hanya untuk media plus jenis dokumen aman (gambar, audio, video, PDF, dan dokumen Office). Teks polos dan file yang menyerupai rahasia tetap diblokir.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada saluran yang mendukung DM adalah **pairing**:
      - Pengirim tidak dikenal menerima kode pairing; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per saluran**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak tiba.
    - Membuka DM untuk publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk menampilkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi perhatian untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten tidak tepercaya**, bukan hanya siapa yang dapat mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (pencarian/pengambilan web, halaman browser, email,
    docs, lampiran, log yang ditempel), konten itu dapat menyertakan instruksi yang mencoba
    membajak model. Ini dapat terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar muncul saat alat diaktifkan: model dapat ditipu untuk
    mengekfiltrasi konteks atau memanggil alat atas nama Anda. Kurangi radius dampak dengan:

    - menggunakan agen "pembaca" hanya-baca atau tanpa alat untuk merangkum konten tidak tepercaya
    - menonaktifkan `web_search` / `web_fetch` / `browser` untuk agen yang mengaktifkan alat
    - memperlakukan teks file/dokumen yang didekode sebagai tidak tepercaya juga: OpenResponses
      `input_file` dan ekstraksi lampiran media sama-sama membungkus teks yang diekstrak dalam
      penanda batas konten eksternal eksplisit alih-alih meneruskan teks file mentah
    - sandboxing dan allowlist alat yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apakah bot saya sebaiknya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi radius dampak jika terjadi masalah. Ini juga memudahkan rotasi
    kredensial atau pencabutan akses tanpa memengaruhi akun pribadi Anda.

    Mulai dari kecil. Berikan akses hanya ke alat dan akun yang benar-benar Anda perlukan, dan perluas
    nanti jika diperlukan.

    Docs: [Keamanan](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Bisakah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola paling aman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin ia mengirim pesan atas nama Anda.
    - Biarkan ia membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan tetap isolasikan. Lihat
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agen hanya untuk chat dan input-nya tepercaya. Tier yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agen yang mengaktifkan alat
    atau saat membaca konten tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    alat dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapatkan kode pairing">
    Kode pairing dikirim **hanya** saat pengirim tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` sendiri tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda menginginkan akses langsung, masukkan id pengirim Anda ke allowlist atau atur `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah ia akan mengirim pesan ke kontak saya? Bagaimana pairing bekerja?">
    Tidak. Kebijakan DM WhatsApp default adalah **pairing**. Pengirim tidak dikenal hanya mendapatkan kode pairing dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Daftar permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: digunakan untuk mengatur **allowlist/pemilik** Anda agar DM Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan di nomor WhatsApp pribadi Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "ia tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau alat hanya muncul saat **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih berisik, periksa pengaturan sesi di Control UI dan atur verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` yang diatur
    ke `on` di konfigurasi.

    Docs: [Thinking dan verbose](/id/tools/thinking), [Keamanan](/id/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan/membatalkan tugas yang sedang berjalan?">
    Kirim salah satu dari berikut **sebagai pesan mandiri** (tanpa garis miring):

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

    Ini adalah pemicu abort (bukan perintah garis miring).

    Untuk proses latar belakang (dari alat exec), Anda dapat meminta agen menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ikhtisar perintah garis miring: lihat [Perintah garis miring](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`, tetapi beberapa pintasan (seperti `/status`) juga berfungsi inline untuk pengirim yang masuk allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pengiriman pesan **lintas-penyedia** secara default. Jika panggilan alat terikat
    ke Telegram, ia tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

    Aktifkan pengiriman pesan lintas-penyedia untuk agen:

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

  <Accordion title='Mengapa terasa seperti bot "mengabaikan" pesan cepat bertubi-tubi?'>
    Mode antrean mengontrol bagaimana pesan baru berinteraksi dengan run yang sedang berjalan. Gunakan `/queue` untuk mengubah mode:

    - `steer` - antrekan semua steering tertunda untuk batas model berikutnya dalam run saat ini
    - `queue` - steering lama satu per satu
    - `followup` - jalankan pesan satu per satu
    - `collect` - kelompokkan pesan dan balas sekali
    - `steer-backlog` - steer sekarang, lalu proses backlog
    - `interrupt` - batalkan run saat ini dan mulai dari awal

    Mode default adalah `steer`. Anda dapat menambahkan opsi seperti `debounce:0.5s cap:25 drop:summarize` untuk mode followup. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan kunci API?'>
    Di OpenClaw, kredensial dan pemilihan model terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic di profil autentikasi) mengaktifkan autentikasi, tetapi model default yang sebenarnya adalah apa pun yang Anda konfigurasi di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, itu berarti Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih buntu? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ penggunaan pertama](/id/help/faq-first-run) — instalasi, onboarding, autentikasi, langganan, kegagalan awal
- [FAQ model](/id/help/faq-models) — pemilihan model, failover, profil autentikasi
- [Pemecahan masalah](/id/help/troubleshooting) — triase berdasarkan gejala

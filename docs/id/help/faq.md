---
read_when:
    - Menjawab pertanyaan dukungan umum tentang penyiapan, instalasi, onboarding, atau runtime
    - Melakukan triase terhadap masalah yang dilaporkan pengguna sebelum debugging lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Pertanyaan Umum
x-i18n:
    generated_at: "2026-06-27T17:35:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (pengembangan lokal, VPS, multi-agen, OAuth/kunci API, failover model). Untuk diagnostik runtime, lihat [Pemecahan Masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agen/sesi, konfigurasi provider + masalah runtime (ketika gateway dapat dijangkau).

2. **Laporan yang dapat ditempel (aman untuk dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis baca-saja dengan ujung log (token disensor).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

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

   Jika RPC tidak aktif, gunakan fallback ke:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Pencatatan Log](/id/logging) dan [Pemecahan Masalah](/id/gateway/troubleshooting).

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

   Meminta snapshot penuh dari gateway yang sedang berjalan (hanya WS). Lihat [Kesehatan](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

Tanya jawab pertama kali — instalasi, onboarding, rute auth, langganan, kegagalan awal —
ada di [FAQ pertama kali](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. OpenClaw membalas di permukaan perpesanan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan Plugin channel bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." OpenClaw adalah **control plane yang mengutamakan lokal** yang memungkinkan Anda menjalankan
    asisten yang mumpuni di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi berstatus, memori, dan alat - tanpa menyerahkan kendali workflow Anda ke SaaS
    terhosting.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan pertahankan
      workspace + riwayat sesi tetap lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus suara seluler dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan perutean
      per agen dan failover.
    - **Opsi hanya lokal:** jalankan model lokal agar **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Perutean multi-agen:** pisahkan agen per channel, akun, atau tugas, masing-masing dengan
      workspace dan default sendiri.
    - **Sumber terbuka dan dapat diutak-atik:** inspeksi, perluas, dan host sendiri tanpa vendor lock-in.

    Dokumentasi: [Gateway](/id/gateway), [Channel](/id/channels), [Multi-agen](/id/concepts/multi-agent),
    [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan lebih dulu?">
    Proyek awal yang bagus:

    - Buat situs web (WordPress, Shopify, atau situs statis sederhana).
    - Buat prototipe aplikasi seluler (kerangka, layar, rencana API).
    - Atur file dan folder (pembersihan, penamaan, pemberian tag).
    - Hubungkan Gmail dan otomatisasi ringkasan atau tindak lanjut.

    OpenClaw dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya menjadi fase dan
    menggunakan sub-agen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Manfaat sehari-hari biasanya terlihat seperti:

    - **Ringkasan pribadi:** ringkasan kotak masuk, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penyusunan draf:** riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan daftar periksa yang digerakkan oleh cron atau heartbeat.
    - **Otomasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu dengan lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan draf**. Ini dapat memindai situs, membuat daftar pendek,
    merangkum prospek, dan menulis draf outreach atau naskah iklan.

    Untuk **outreach atau kampanye iklan**, pertahankan manusia dalam alur. Hindari spam, patuhi hukum setempat dan
    kebijakan platform, serta tinjau semuanya sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda menyetujuinya.

    Dokumentasi: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi alat.

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
  <Accordion title="Bagaimana cara menyesuaikan skills tanpa membuat repo kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Letakkan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritasnya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, jadi override terkelola tetap menang atas skills bawaan tanpa menyentuh git. Jika Anda perlu skill dipasang secara global tetapi hanya terlihat oleh beberapa agen, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` serta `agents.list[].skills`. Hanya edit yang layak upstream yang sebaiknya berada di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat skills dari folder kustom?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika skill hanya boleh terlihat oleh agen tertentu, padankan dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model atau pengaturan berbeda untuk tugas berbeda?">
    Saat ini pola yang didukung adalah:

    - **Pekerjaan Cron**: pekerjaan terisolasi dapat menetapkan override `model` per pekerjaan.
    - **Agen**: arahkan tugas ke agen terpisah dengan model default, tingkat berpikir, dan parameter stream yang berbeda.
    - **Pengalihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Misalnya, gunakan model yang sama dengan pengaturan per agen yang berbeda:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Letakkan default per model bersama di `agents.defaults.models["provider/model"].params`, lalu letakkan override khusus agen di `agents.list[].params` datar. Jangan definisikan entri `agents.list[].models["provider/model"].params` bertingkat yang terpisah untuk model yang sama; `agents.list[].models` ditujukan untuk katalog model per agen dan override runtime.

    Lihat [Pekerjaan Cron](/id/automation/cron-jobs), [Perutean Multi-Agen](/id/concepts/multi-agent), [Konfigurasi](/id/gateway/config-agents), dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat melakukan pekerjaan berat. Bagaimana cara mengalihkan beban itu?">
    Gunakan **sub-agen** untuk tugas panjang atau paralel. Sub-agen berjalan di sesinya sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "menjalankan sub-agen untuk tugas ini" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah sedang sibuk).

    Kiat token: tugas panjang dan sub-agen sama-sama mengonsumsi token. Jika biaya menjadi perhatian, tetapkan
    model yang lebih murah untuk sub-agen melalui `agents.defaults.subagents.model`.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagen yang terikat thread di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke subagen atau target sesi sehingga pesan tindak lanjut di thread itu tetap berada pada sesi terikat tersebut.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepaskan thread.

    Konfigurasi wajib:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: `channels.discord.threadBindings.spawnSessions` default ke `true`; atur ke `false` untuk menonaktifkan spawn sesi yang terikat thread.

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagen selesai, tetapi pembaruan penyelesaian masuk ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang sudah di-resolve terlebih dahulu:

    - Pengiriman subagen mode penyelesaian lebih memilih thread terikat atau rute percakapan apa pun saat ada.
    - Jika asal penyelesaian hanya membawa channel, OpenClaw fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap dapat berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasilnya fallback ke pengiriman sesi antrean alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau kedaluwarsa masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan announce alih-alih memposting progres lama yang kedaluwarsa.
    - Output tool/toolResult tidak dipromosikan menjadi teks hasil child; hasilnya adalah balasan asisten terbaru yang terlihat dari child.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Sub-agen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    tugas terjadwal tidak akan berjalan.

    Daftar periksa:

    - Pastikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tidak tidur/mulai ulang).
    - Verifikasi pengaturan zona waktu untuk tugas (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Tugas Cron](/id/automation/cron-jobs), [Otomatisasi](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke channel. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pengiriman fallback runner yang diharapkan.
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan autentikasi channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback yang diantrekan.

    Untuk tugas Cron terisolasi, agen masih dapat mengirim langsung dengan alat
    `message` ketika rute chat tersedia. `--announce` hanya mengontrol jalur
    fallback runner untuk teks akhir yang belum dikirim agen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Tugas Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa eksekusi Cron terisolasi mengganti model atau mencoba ulang sekali?">
    Itu biasanya jalur penggantian model live, bukan penjadwalan duplikat.

    Cron terisolasi dapat menyimpan handoff model runtime dan mencoba ulang ketika
    eksekusi aktif melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang diganti, dan jika penggantian membawa override profil autentikasi baru, cron
    juga menyimpannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang terlebih dahulu ketika berlaku.
    - Lalu `model` per tugas.
    - Lalu override model sesi-cron yang tersimpan.
    - Lalu pemilihan model agen/default normal.

    Loop percobaan ulang dibatasi. Setelah percobaan awal ditambah 2 percobaan ulang penggantian,
    cron membatalkan alih-alih berulang selamanya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Tugas Cron](/id/automation/cron-jobs), [CLI cron](/id/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
    Jelajahi skills di [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` native menulis ke direktori `skills/`
    workspace aktif secara default. Tambahkan `--global` untuk menginstal ke direktori
    skills terkelola bersama untuk semua agen lokal. Instal CLI `clawhub` terpisah
    hanya jika Anda ingin menerbitkan atau menyinkronkan skills Anda sendiri. Gunakan
    `agents.defaults.skills` atau `agents.list[].skills` jika Anda ingin membatasi
    agen mana yang dapat melihat skills bersama.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas sesuai jadwal atau terus-menerus di latar belakang?">
    Bisa. Gunakan penjadwal Gateway:

    - **Tugas Cron** untuk tugas terjadwal atau berulang (bertahan setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Tugas terisolasi** untuk agen otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumentasi: [Tugas Cron](/id/automation/cron-jobs), [Otomatisasi](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` ditambah biner yang diperlukan, dan skills hanya muncul di prompt sistem ketika memenuhi syarat di **host Gateway**. Di Linux, skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda menimpa gating.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS tersedia, lalu sambungkan dari Linux dalam [mode jarak jauh](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway adalah macOS.

    **Opsi B - gunakan Node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan Node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Selalu Tanyakan" atau "Selalu Izinkan" di Mac. OpenClaw dapat memperlakukan skills khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan ada di Node. Agen menjalankan skills tersebut melalui alat `nodes`. Jika Anda memilih "Selalu Tanyakan", menyetujui "Selalu Izinkan" di prompt akan menambahkan perintah tersebut ke allowlist.

    **Opsi C - proxy biner macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat biner CLI yang diperlukan resolve ke wrapper SSH yang berjalan di Mac. Lalu override skill agar mengizinkan Linux sehingga tetap memenuhi syarat.

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

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen sama-sama memiliki API).
    - **Otomatisasi browser:** berfungsi tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menyimpan konteks per klien (workflow agensi), pola sederhananya adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agen mengambil halaman itu pada awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau buat skill
    yang menargetkan API tersebut.

    Instal skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Instalasi native masuk ke direktori `skills/` workspace aktif. Untuk skills bersama di semua agen lokal, gunakan `openclaw skills install @owner/<skill-slug> --global` (atau letakkan secara manual di `~/.openclaw/skills/<name>/SKILL.md`). Jika hanya beberapa agen yang boleh melihat instalasi bersama, konfigurasi `agents.defaults.skills` atau `agents.list[].skills`. Beberapa skills mengharapkan biner yang diinstal melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), dan [ClawHub](/id/clawhub).

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

    Jalur ini dapat menggunakan browser host lokal atau Node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host Node di mesin browser atau gunakan CDP jarak jauh sebagai gantinya.

    Batas saat ini pada `existing-session` / `user`:

    - tindakan berbasis ref, bukan berbasis selector CSS
    - unggahan memerlukan `ref` / `inputRef` dan saat ini mendukung satu file setiap kali
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumentasi sandboxing khusus?">
    Ada. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur lengkap?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, sehingga tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Persistenkan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap ada.
    - Masukkan dependensi sistem ke image dengan `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path dipersistenkan.

    Dokumentasi: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap personal tetapi membuat grup publik/tersandbox dengan satu agen?">
    Bisa - jika traffic privat Anda adalah **DM** dan traffic publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/channel (key non-main) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap di host. Docker adalah backend default jika Anda tidak memilih salah satu. Lalu batasi alat yang tersedia dalam sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh konfigurasi: [Grup: DM personal + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi utama: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya, `"/home/user/src:/src:ro"`). Bind global + per agen digabungkan; bind per agen diabaikan ketika `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati batas filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonis yang di-resolve melalui ancestor terdalam yang sudah ada. Artinya escape induk-symlink tetap fail closed bahkan ketika segmen path terakhir belum ada, dan pemeriksaan root yang diizinkan tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agen:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang terkurasi di `MEMORY.md` (hanya sesi utama/privat)

    OpenClaw juga menjalankan **flush memori pra-Compaction senyap** untuk mengingatkan model
    menulis catatan tahan lama sebelum Compaction otomatis. Ini hanya berjalan ketika workspace
    dapat ditulis (sandbox hanya-baca melewatinya). Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan hal-hal. Bagaimana cara membuatnya tersimpan?">
    Minta bot untuk **menulis fakta ke memori**. Catatan jangka panjang berada di `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang sedang kami tingkatkan. Akan membantu jika mengingatkan model untuk menyimpan memori;
    model akan tahu apa yang harus dilakukan. Jika masih terus lupa, pastikan Gateway menggunakan
    workspace yang sama pada setiap proses.

    Dokumentasi: [Memori](/id/concepts/memory), [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, jadi percakapan panjang dapat dipadatkan atau dipotong. Itulah alasan
    pencarian memori ada - pencarian ini hanya menarik bagian yang relevan kembali ke konteks.

    Dokumentasi: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**. OAuth Codex mencakup chat/completions dan
    **tidak** memberikan akses embedding, jadi **masuk dengan Codex (OAuth atau login
    CLI Codex)** tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap memerlukan kunci API asli (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw menggunakan embedding OpenAI. Konfigurasi
    lama yang masih menyatakan `memorySearch.provider = "auto"` juga diselesaikan ke OpenAI.
    Jika tidak ada kunci API OpenAI yang tersedia, pencarian memori semantik tetap tidak tersedia
    sampai Anda mengonfigurasi kunci atau memilih provider lain secara eksplisit.

    Jika Anda lebih memilih tetap lokal, tetapkan `memorySearch.provider = "local"` (dan secara opsional
    `memorySearch.fallback = "none"`). Jika Anda ingin embedding Gemini, tetapkan
    `memorySearch.provider = "gemini"` dan berikan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, kompatibel dengan OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra, atau lokal**
    - lihat [Memori](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Tempat berbagai hal berada di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim kepada mereka**.

    - **Lokal secara default:** sesi, file memori, konfigurasi, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Jarak jauh karena perlu:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) masuk ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengontrol jejaknya:** menggunakan model lokal menjaga prompt tetap di mesin Anda, tetapi lalu lintas channel
      tetap melewati server channel tersebut.

    Terkait: [Workspace agen](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Konfigurasi utama (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth pada penggunaan pertama)  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, kunci API, dan `keyRef`/`tokenRef` opsional)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload rahasia opsional berbasis file untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis dibersihkan)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per agen (agentDir + sesi)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & state (per agen)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agen)                                           |

    Path agen tunggal lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
    File-file ini berada di **workspace agen**, bukan `~/.openclaw`.

    - **Workspace (per agen)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opsional.
      Root huruf kecil `memory.md` hanya input perbaikan lama; `openclaw doctor --fix`
      dapat menggabungkannya ke `MEMORY.md` saat kedua file ada.
    - **Direktori state (`~/.openclaw`)**: konfigurasi, state channel/provider, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan workspace yang sama
    pada setiap peluncuran (dan ingat: mode jarak jauh menggunakan workspace **host gateway**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** alih-alih mengandalkan riwayat chat.

    Lihat [Workspace agen](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Bisakah saya membuat SOUL.md lebih besar?">
    Ya. `SOUL.md` adalah salah satu file bootstrap workspace yang disuntikkan ke dalam
    konteks agen. Batas injeksi per file default adalah `20000` karakter,
    dan total anggaran bootstrap lintas file adalah `60000` karakter.

    Ubah default bersama di konfigurasi OpenClaw Anda:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Atau timpa satu agen:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Gunakan `/context` untuk memeriksa ukuran mentah vs yang disuntikkan dan apakah pemotongan terjadi.
    Jaga `SOUL.md` tetap berfokus pada suara, sikap, dan kepribadian; letakkan aturan operasional
    di `AGENTS.md` dan fakta tahan lama di memori.

    Lihat [Konteks](/id/concepts/context) dan [Konfigurasi agen](/id/gateway/config-agents).

  </Accordion>

  <Accordion title="Strategi pencadangan yang direkomendasikan">
    Letakkan **workspace agen** Anda di repo git **privat** dan cadangkan di tempat
    privat (misalnya GitHub privat). Ini menangkap memori + file AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    Jangan **commit** apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload rahasia terenkripsi).
    Jika Anda memerlukan pemulihan penuh, cadangkan workspace dan direktori state
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus instalasi OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Hapus instalasi](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agen bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox yang kaku.
    Path relatif diselesaikan di dalam workspace, tetapi path absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agen. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan `workspace` agen tersebut
    ke root repo. Repo OpenClaw hanyalah kode sumber; pisahkan workspace
    kecuali Anda memang ingin agen bekerja di dalamnya.

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

  <Accordion title="Mode jarak jauh: di mana penyimpanan sesi berada?">
    State sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode jarak jauh, penyimpanan sesi yang Anda pedulikan ada di mesin jarak jauh, bukan laptop lokal Anda. Lihat [Manajemen sesi](/id/concepts/session).
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
    Bind non-loopback **memerlukan path auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy sadar identitas yang dikonfigurasi dengan benar

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
    - Path panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak ditetapkan.
    - Untuk auth kata sandi, tetapkan `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa penyamaran fallback jarak jauh).
    - Penyiapan Control UI shared-secret melakukan autentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan dalam pengaturan aplikasi/UI). Mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit dan entri loopback di `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Mengapa saya memerlukan token di localhost sekarang?">
    OpenClaw memberlakukan auth gateway secara default, termasuk loopback. Pada path default normal, itu berarti auth token: jika tidak ada path auth eksplisit yang dikonfigurasi, startup gateway diselesaikan ke mode token dan menghasilkan token khusus runtime untuk startup tersebut, jadi **klien WS lokal harus melakukan autentikasi**. Konfigurasikan `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit saat klien memerlukan rahasia yang stabil lintas restart. Ini memblokir proses lokal lain agar tidak memanggil Gateway.

    Jika Anda lebih suka jalur autentikasi yang berbeda, Anda dapat memilih mode kata sandi secara eksplisit (atau, untuk proksi balik sadar-identitas, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, atur `gateway.auth.mode: "none"` secara eksplisit di konfigurasi Anda. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus memulai ulang setelah mengubah konfigurasi?">
    Gateway memantau konfigurasi dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): menerapkan perubahan aman secara panas, memulai ulang untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Atur `cli.banner.taglineMode` di konfigurasi:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: menyembunyikan teks tagline tetapi tetap menampilkan baris judul/versi banner.
    - `default`: menggunakan `All your chats, one OpenClaw.` setiap kali.
    - `random`: tagline lucu/musiman yang berotasi (perilaku default).
    - Jika Anda tidak menginginkan banner sama sekali, atur env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` berfungsi tanpa kunci API. `web_search` bergantung pada provider yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan kunci API normal masing-masing.
    - Grok dapat menggunakan ulang OAuth xAI dari autentikasi model, atau fallback ke `XAI_API_KEY` / konfigurasi web-search plugin.
    - Ollama Web Search bebas kunci, tetapi menggunakan host Ollama yang Anda konfigurasikan dan memerlukan `ollama signin`.
    - DuckDuckGo bebas kunci, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG bebas kunci/self-hosted; konfigurasikan `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
    Alternatif lingkungan:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: OAuth xAI, `XAI_API_KEY`
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

    Konfigurasi web-search khusus provider kini berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk konfigurasi baru.
    Konfigurasi fallback web-fetch Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis provider fallback pengambilan siap pertama dari kredensial yang tersedia. Plugin Firecrawl resmi menyediakan fallback tersebut.
    - Daemon membaca variabel env dari `~/.openclaw/.env` (atau lingkungan layanan).

    Docs: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` mengganti **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua
    yang lain akan dihapus.

    OpenClaw saat ini melindungi banyak penimpaan tidak sengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi konfigurasi penuh setelah perubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Jika edit langsung merusak startup atau hot reload, Gateway gagal tertutup atau melewati reload; Gateway tidak menulis ulang `openclaw.json`.
    - `openclaw doctor --fix` memiliki tanggung jawab perbaikan dan dapat memulihkan last-known-good sambil menyimpan file yang ditolak sebagai `openclaw.json.clobbered.*`.

    Pulihkan:

    - Periksa `openclaw logs --follow` untuk `Invalid config at`, `Config write rejected:`, atau `config reload skipped (invalid config)`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di sebelah konfigurasi aktif.
    - Jalankan `openclaw config validate` dan `openclaw doctor --fix`.
    - Salin kembali hanya kunci yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jika Anda tidak memiliki last-known-good atau payload yang ditolak, pulihkan dari cadangan, atau jalankan ulang `openclaw doctor` dan konfigurasi ulang channel/model.
    - Jika ini tidak terduga, ajukan bug dan sertakan konfigurasi terakhir yang Anda ketahui atau cadangan apa pun.
    - Agen coding lokal sering dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu jika Anda tidak yakin tentang jalur tepat atau bentuk field; ini mengembalikan node skema dangkal plus ringkasan anak langsung untuk penelusuran lebih lanjut.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan alat `gateway` yang dihadapkan ke agen dari sebuah agent run, alat itu tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke jalur exec terlindungi yang sama).

    Docs: [Konfigurasi](/id/cli/config), [Konfigurasikan](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola umum adalah **satu Gateway** (misalnya Raspberry Pi) plus **node** dan **agen**:

    - **Gateway (pusat):** memiliki channel (Signal/WhatsApp), routing, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (worker):** otak/workspace terpisah untuk peran khusus (misalnya "Operasi Hetzner", "Data pribadi").
    - **Sub-agen:** memunculkan pekerjaan latar belakang dari agen utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan beralih agen/sesi.

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

    Default adalah `false` (headful). Headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Headless menggunakan **mesin Chromium yang sama** dan berfungsi untuk sebagian besar otomatisasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan tangkapan layar jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomatisasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Atur `browser.executablePath` ke binary Brave Anda (atau browser berbasis Chromium apa pun) dan mulai ulang Gateway.
    Lihat contoh konfigurasi lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway dan node jarak jauh

<AccordionGroup>
  <Accordion title="Bagaimana perintah dipropagasikan antara Telegram, gateway, dan node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agen dan
    baru kemudian memanggil node melalui **Gateway WebSocket** saat alat node diperlukan:

    Telegram → Gateway → Agen → `node.*` → Node → Gateway → Telegram

    Node tidak melihat traffic provider masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway di-host jarak jauh?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil alat `node.*` (layar, kamera, sistem) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumah).
    2. Letakkan host Gateway + komputer Anda di tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan sambungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar dapat mendaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan node macOS memungkinkan `system.run` di mesin tersebut. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Keamanan](/id/gateway/security).

    Docs: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [Mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Sekarang bagaimana?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan channel: `openclaw channels status`

    Lalu verifikasi autentikasi dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, pastikan tunnel lokal aktif dan mengarah ke port yang benar.
    - Pastikan allowlist Anda (DM atau grup) menyertakan akun Anda.

    Docs: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Channel](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw saling berbicara (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda dapat merangkainya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika satu bot berada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh itu
    melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)).

    Contoh pola (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak berputar tanpa henti (mention-only, allowlist
    channel, atau aturan "jangan balas pesan bot").

    Docs: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Kirim agen](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway dapat meng-host beberapa agen, masing-masing dengan workspace, default model,
    dan routing sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta lebih sederhana daripada menjalankan
    satu VPS per agen.

    Gunakan VPS terpisah hanya saat Anda membutuhkan isolasi keras (batas keamanan) atau konfigurasi yang sangat
    berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agen atau sub-agen.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya alih-alih SSH dari VPS?">
    Ya - node adalah cara utama untuk menjangkau laptop Anda dari Gateway jarak jauh, dan node
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau perangkat sekelas Raspberry Pi sudah cukup; RAM 4 GB sangat memadai), jadi penyiapan yang umum
    adalah host yang selalu aktif ditambah laptop Anda sebagai node.

    - **Tidak memerlukan SSH masuk.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pemasangan perangkat.
    - **Kontrol eksekusi yang lebih aman.** `system.run` dibatasi oleh daftar izin/persetujuan node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau lampirkan ke Chrome lokal di host melalui Chrome MCP.

    SSH cocok untuk akses shell ad-hoc, tetapi node lebih sederhana untuk alur kerja agen yang berkelanjutan dan
    otomatisasi perangkat.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang sebaiknya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node
    headless dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Restart penuh diperlukan untuk perubahan permukaan `gateway`, `discovery`, dan plugin yang di-host.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subpohon konfigurasi dengan node skema dangkalnya, petunjuk UI yang cocok, dan ringkasan anak langsung sebelum menulis
    - `config.get`: ambil snapshot saat ini + hash
    - `config.patch`: pembaruan parsial yang aman (lebih disukai untuk sebagian besar edit RPC); hot-reload jika memungkinkan dan restart jika diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; hot-reload jika memungkinkan dan restart jika diperlukan
    - Alat runtime `gateway` yang menghadap agen tetap menolak menulis ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur exec terlindungi yang sama

  </Accordion>

  <Accordion title="Konfigurasi minimal yang masuk akal untuk instalasi pertama">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ini mengatur workspace Anda dan membatasi siapa yang dapat memicu bot.

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
    4. **Gunakan nama host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan UI Kontrol tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini menjaga gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **UI Kontrol Gateway + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Jarak Jauh** (target SSH dapat berupa nama host tailnet).
       Aplikasi akan membuat tunnel ke port Gateway dan terhubung sebagai node.
    3. **Setujui node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Protokol Gateway](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [Mode jarak jauh macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal di laptop kedua atau cukup menambahkan node?">
    Jika Anda hanya membutuhkan **alat lokal** (screen/camera/exec) di laptop kedua, tambahkan sebagai
    **node**. Itu mempertahankan satu Gateway dan menghindari konfigurasi duplikat. Alat node lokal
    saat ini hanya tersedia untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya jika Anda membutuhkan **isolasi keras** atau dua bot yang sepenuhnya terpisah.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabel env dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat variabel lingkungan?">
    OpenClaw membaca variabel env dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari direktori kerja saat ini
    - fallback global `.env` dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak ada file `.env` yang menimpa variabel env yang sudah ada.
    Variabel kredensial penyedia adalah pengecualian untuk workspace `.env`: kunci seperti
    `GEMINI_API_KEY`, `XAI_API_KEY`, atau `MISTRAL_API_KEY` diabaikan dari workspace
    `.env` dan sebaiknya berada di lingkungan proses, `~/.openclaw/.env`, atau konfigurasi `env`.

    Anda juga dapat mendefinisikan variabel env inline dalam konfigurasi (diterapkan hanya jika tidak ada dari env proses):

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

  <Accordion title="Saya memulai Gateway melalui layanan dan variabel env saya hilang. Apa sekarang?">
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

    Ini menjalankan shell login Anda dan hanya mengimpor kunci yang diharapkan yang hilang (tidak pernah menimpa). Padanan variabel env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya mengatur COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti variabel env Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    shell login Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), ia tidak akan mewarisi lingkungan
    shell Anda. Perbaiki dengan melakukan salah satu dari ini:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` konfigurasi Anda (diterapkan hanya jika tidak ada).

    Lalu restart gateway dan periksa ulang:

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
    Ini tidak menghapus transkrip - ini hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara membuat tim instance OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **perutean multi-agen** dan **sub-agen**. Anda dapat membuat satu agen koordinator
    dan beberapa agen pekerja dengan workspace dan model mereka sendiri.

    Meski begitu, ini paling baik dilihat sebagai **eksperimen menyenangkan**. Ini boros token dan sering
    kurang efisien dibanding menggunakan satu bot dengan sesi terpisah. Model umum yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot tersebut
    juga dapat memunculkan sub-agen saat diperlukan.

    Dokumentasi: [Perutean multi-agen](/id/concepts/multi-agent), [Sub-agen](/id/tools/subagents), [CLI Agen](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, output alat besar, atau banyak
    file dapat memicu Compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum status saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
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

    Lalu jalankan ulang setup:

    ```bash
    openclaw onboard --install-daemon
    ```

    Catatan:

    - Onboarding juga menawarkan **Reset** jika melihat konfigurasi yang ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori state (default adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara mereset atau melakukan compact?'>
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

    - Aktifkan atau sesuaikan **pemangkasan sesi** (`agents.defaults.contextPruning`) untuk memangkas output alat lama.
    - Gunakan model dengan jendela konteks yang lebih besar.

    Dokumentasi: [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning), [Manajemen sesi](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi penyedia: model mengeluarkan blok `tool_use` tanpa `input` yang diperlukan.
    Ini biasanya berarti riwayat sesi sudah usang atau rusak (sering setelah thread panjang
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
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong,
    komentar Markdown/HTML, heading Markdown seperti `# Heading`, penanda fence,
    atau stub checklist kosong), OpenClaw melewati proses Heartbeat untuk menghemat panggilan API.
    Jika file tidak ada, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per agen menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda ada di grup, OpenClaw dapat melihatnya.
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
    Opsi 1 (paling cepat): tail log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang diakhiri dengan `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Direktori](/id/cli/directory), [Log](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Gating mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak di-allowlist.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung digabungkan ke sesi utama secara default. Grup/channel memiliki kunci sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agen yang dapat saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agen berarti lebih banyak penggunaan model secara bersamaan.
    - **Overhead operasional:** profil auth, workspace, dan routing channel per agen.

    Tips:

    - Pertahankan satu workspace **aktif** per agen (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri store) jika disk bertambah besar.
    - Gunakan `openclaw doctor` untuk menemukan workspace tersisa dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana sebaiknya saya menyiapkannya?">
    Ya. Gunakan **Routing Multi-Agen** untuk menjalankan beberapa agen terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agen tertentu.

    Akses browser kuat, tetapi bukan "dapat melakukan apa pun yang dapat dilakukan manusia" - anti-bot, CAPTCHA, dan MFA
    masih dapat memblokir automasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP pada mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agen per peran (binding).
    - Channel Slack diikat ke agen tersebut.
    - Browser lokal melalui Chrome MCP atau sebuah node saat diperlukan.

    Dokumentasi: [Routing Multi-Agen](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil auth

Tanya jawab model — default, pemilihan, alias, pengalihan, failover, profil auth —
ada di [FAQ Model](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port multiplex untuk WebSocket + HTTP (Control UI, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah pandangan **supervisor** (launchd/systemd/schtasks). Connectivity probe adalah CLI yang benar-benar terhubung ke WebSocket Gateway.

    Gunakan `openclaw gateway status` dan percayai baris berikut:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar terikat pada port)
    - `Last gateway error:` (penyebab utama umum saat proses hidup tetapi port tidak mendengarkan)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" berbeda?'>
    Anda sedang mengedit satu file konfigurasi sementara layanan menjalankan file lain (sering kali ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / lingkungan yang sama yang Anda ingin layanan gunakan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menerapkan lock runtime dengan langsung mengikat listener WebSocket saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, ia melempar `GatewayLockError` yang menunjukkan instance lain sudah mendengarkan.

    Perbaikan: hentikan instance lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

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

    - `openclaw gateway` hanya dimulai saat `gateway.mode` adalah `local` (atau Anda meneruskan flag override).
    - Aplikasi macOS memantau file konfigurasi dan mengganti mode secara live saat nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanya kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan auth Gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus menyambung ulang). Sekarang bagaimana?'>
    Jalur auth Gateway Anda dan metode auth UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL Gateway yang dipilih, jadi refresh pada tab yang sama tetap berfungsi tanpa memulihkan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan token perangkat yang di-cache saat Gateway mengembalikan hint retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token yang di-cache itu sekarang menggunakan kembali scope yang disetujui yang di-cache dan disimpan bersama token perangkat. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan kumpulan scope yang diminta, bukan mewarisi scope yang di-cache.
    - Di luar jalur retry itu, prioritas auth koneksi adalah token/password bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
    - Bootstrap kode penyiapan bawaan hanya untuk node. Setelah disetujui, ia mengembalikan token perangkat node dengan `scopes: []` dan tidak mengembalikan token operator yang diserahkan.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan hint SSH jika headless).
    - Jika Anda belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jika jarak jauh, buat tunnel terlebih dahulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: atur `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempelkan secret yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode trusted-proxy: pastikan Anda datang melalui proxy identity-aware yang dikonfigurasi, bukan URL Gateway mentah. Proxy loopback pada host yang sama juga memerlukan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Jika ketidakcocokan tetap ada setelah satu retry, rotasi/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotasi itu mengatakan ditolak, periksa dua hal:
      - sesi perangkat yang dipasangkan hanya dapat merotasi perangkat **miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak dapat melebihi scope operator pemanggil saat ini
    - Masih macet? Jalankan `openclaw status --all` dan ikuti [Pemecahan masalah](/id/gateway/troubleshooting). Lihat [Dashboard](/id/web/dashboard) untuk detail auth.

  </Accordion>

  <Accordion title="Saya mengatur gateway.bind tailnet tetapi tidak dapat bind dan tidak ada yang mendengarkan">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmuka sedang down), tidak ada yang dapat di-bind.

    Perbaikan:

    - Mulai Tailscale di host tersebut (agar memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` saat Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa Gateway di host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa channel pesan dan agen. Gunakan beberapa Gateway hanya saat Anda membutuhkan redundansi (misalnya: bot penyelamat) atau isolasi keras.

    Ya, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Atur `gateway.port` unik di setiap konfigurasi profil (atau teruskan `--port` untuk menjalankan secara manual).
    - Instal layanan per profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan suffix pada nama layanan (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Beberapa Gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan ia mengharapkan pesan pertama berupa
    frame `connect`. Jika menerima hal lain, ia menutup koneksi
    dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di browser (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header auth atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab browser biasa.
    3. Jika auth aktif, sertakan token/password dalam frame `connect`.

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

    Anda dapat menetapkan jalur stabil melalui `logging.file`. Level log berkas dikontrol oleh `logging.level`. Verbositas konsol dikontrol oleh `--verbose` dan `logging.consoleLevel`.

    Tail log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log layanan/supervisor (saat gateway berjalan melalui launchd/systemd):

    - stdout launchd macOS: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan `gateway-<profile>.log`; stderr disupresi)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Pemecahan masalah](/id/gateway/troubleshooting) untuk informasi selengkapnya.

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
    Ada **tiga mode instalasi Windows**:

    **1) Penyiapan lokal Windows Hub:** aplikasi native mengelola Gateway WSL lokal milik aplikasi.

    Buka **OpenClaw Companion** dari menu Start atau tray, lalu gunakan
    **Gateway Setup** atau tab Connections.

    **2) Gateway WSL2 manual:** Gateway berjalan di dalam Linux.

    Buka PowerShell, masuk ke WSL, lalu mulai ulang:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda tidak pernah menginstal layanan, mulai di latar depan:

    ```bash
    openclaw gateway run
    ```

    **3) CLI/Gateway Windows native:** Gateway berjalan langsung di Windows.

    Buka PowerShell dan jalankan:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankannya secara manual (tanpa layanan), gunakan:

    ```powershell
    openclaw gateway run
    ```

    Dokumentasi: [Windows](/id/platforms/windows), [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Gateway sudah aktif tetapi balasan tidak pernah datang. Apa yang harus saya periksa?">
    Mulai dengan pemeriksaan kesehatan cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Autentikasi model tidak dimuat di **host gateway** (periksa `models status`).
    - Penyandingan channel/allowlist memblokir balasan (periksa konfigurasi channel + log).
    - WebChat/Dashboard terbuka tanpa token yang benar.

    Jika Anda sedang remote, pastikan koneksi tunnel/Tailscale aktif dan
    WebSocket Gateway dapat dijangkau.

    Dokumentasi: [Channel](/id/channels), [Pemecahan masalah](/id/gateway/troubleshooting), [Akses remote](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Terputus dari gateway: tidak ada alasan" - sekarang bagaimana?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika remote, apakah tautan tunnel/Tailscale aktif?

    Lalu tail log:

    ```bash
    openclaw logs --follow
    ```

    Dokumentasi: [Dashboard](/id/web/dashboard), [Akses remote](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands gagal. Apa yang harus saya periksa?">
    Mulai dengan log dan status channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas hingga batas Telegram dan mencoba ulang dengan perintah lebih sedikit, tetapi beberapa entri menu masih perlu dihapus. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak membutuhkan menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di balik proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway bersifat remote, pastikan Anda melihat log di host Gateway.

    Dokumentasi: [Telegram](/id/channels/telegram), [Pemecahan masalah channel](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama pastikan Gateway dapat dijangkau dan agent dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat keadaan saat ini. Jika Anda mengharapkan balasan di chat
    channel, pastikan pengiriman diaktifkan (`/deliver on`).

    Dokumentasi: [TUI](/id/web/tui), [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara sepenuhnya menghentikan lalu memulai Gateway?">
    Jika Anda menginstal layanan:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **layanan yang diawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankan di latar depan, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Dokumentasi: [Runbook layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: memulai ulang **layanan latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di latar depan** untuk sesi terminal ini.

    Jika Anda menginstal layanan, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan proses sekali jalan di latar depan.

  </Accordion>

  <Accordion title="Cara tercepat mendapatkan detail lebih lanjut saat sesuatu gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol yang lebih banyak. Lalu periksa berkas log untuk autentikasi channel, routing model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agent harus menggunakan field media terstruktur seperti `media`, `mediaUrl`, `path`, atau `filePath`. Lihat [Penyiapan asisten OpenClaw](/id/start/openclaw) dan [Pengiriman agent](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Periksa juga:

    - Channel target mendukung media keluar dan tidak diblokir oleh allowlist.
    - Berkas berada dalam batas ukuran penyedia (gambar diubah ukurannya hingga maks 2048px).
    - `tools.fs.workspaceOnly=true` membuat pengiriman jalur lokal dibatasi ke workspace, temp/media-store, dan berkas yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan pengiriman media lokal terstruktur menggunakan berkas lokal host yang sudah dapat dibaca agent, tetapi hanya untuk media plus jenis dokumen aman (gambar, audio, video, PDF, dokumen Office, dan dokumen teks tervalidasi seperti Markdown/MD, TXT, JSON, YAML, dan YML). Ini bukan pemindai rahasia: `secret.txt` atau `config.json` yang dapat dibaca agent dapat dilampirkan saat ekstensi dan validasi konten cocok. Simpan berkas sensitif di luar jalur yang dapat dibaca agent, atau pertahankan `tools.fs.workspaceOnly=true` untuk pengiriman jalur lokal yang lebih ketat.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada channel yang mendukung DM adalah **penyandingan**:
      - Pengirim tidak dikenal menerima kode penyandingan; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per channel**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak datang.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk memunculkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi masalah untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten tidak tepercaya**, bukan hanya siapa yang dapat mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (pencarian/pengambilan web, halaman browser, email,
    dokumentasi, lampiran, log yang ditempel), konten itu dapat menyertakan instruksi yang mencoba
    membajak model. Ini dapat terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar adalah saat alat diaktifkan: model dapat ditipu untuk
    mengekfiltrasi konteks atau memanggil alat atas nama Anda. Kurangi blast radius dengan:

    - menggunakan agent "pembaca" hanya-baca atau tanpa alat untuk meringkas konten tidak tepercaya
    - menjaga `web_search` / `web_fetch` / `browser` tetap nonaktif untuk agent yang mengaktifkan alat
    - memperlakukan teks berkas/dokumen yang didekode sebagai tidak tepercaya juga: OpenResponses
      `input_file` dan ekstraksi lampiran media sama-sama membungkus teks yang diekstrak dalam
      penanda batas konten eksternal eksplisit alih-alih meneruskan teks berkas mentah
    - sandboxing dan allowlist alat yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apakah OpenClaw kurang aman karena menggunakan TypeScript/Node, bukan Rust/WASM?">
    Bahasa dan runtime penting, tetapi bukan risiko utama untuk agent pribadi.
    Risiko praktis OpenClaw adalah eksposur gateway, siapa yang dapat mengirim pesan ke
    bot, prompt injection, cakupan alat, penanganan kredensial, akses browser, akses exec,
    dan kepercayaan terhadap skill atau plugin pihak ketiga.

    Rust dan WASM dapat memberikan isolasi yang lebih kuat untuk beberapa kelas kode, tetapi
    keduanya tidak menyelesaikan prompt injection, allowlist yang buruk, eksposur gateway publik,
    alat yang terlalu luas, atau profil browser yang sudah masuk ke akun sensitif.
    Perlakukan ini sebagai kontrol utama:

    - jaga Gateway tetap privat atau terautentikasi
    - gunakan penyandingan dan allowlist untuk DM dan grup
    - tolak atau sandbox alat berisiko untuk input tidak tepercaya
    - instal hanya plugin dan skill tepercaya
    - jalankan `openclaw security audit --deep` setelah perubahan konfigurasi

    Detail: [Keamanan](/id/gateway/security), [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Saya melihat laporan tentang instans OpenClaw yang terekspos. Apa yang harus saya periksa?">
    Pertama periksa deployment aktual Anda:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Baseline yang lebih aman adalah:

    - Gateway di-bind ke `loopback`, atau diekspos hanya melalui akses privat
      terautentikasi seperti tailnet, tunnel SSH, autentikasi token/kata sandi, atau proxy tepercaya yang
      dikonfigurasi dengan benar
    - DM dalam mode `pairing` atau `allowlist`
    - grup di-allowlist dan dibatasi oleh mention kecuali setiap anggota tepercaya
    - alat berisiko tinggi (`exec`, `browser`, `gateway`, `cron`) ditolak atau dicakup secara ketat
      untuk agent yang membaca konten tidak tepercaya
    - sandboxing diaktifkan saat eksekusi alat membutuhkan blast radius yang lebih kecil

    Bind publik tanpa autentikasi, DM/grup terbuka dengan alat, dan kontrol browser yang
    terekspos adalah temuan yang harus diperbaiki lebih dulu. Detail:
    [Daftar periksa audit keamanan](/id/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Apakah skill ClawHub dan plugin pihak ketiga aman untuk diinstal?">
    Perlakukan skill dan plugin pihak ketiga sebagai kode yang Anda pilih untuk dipercaya.
    Halaman skill ClawHub menampilkan status pemindaian sebelum instalasi, tetapi pemindaian bukan
    batas keamanan yang lengkap. OpenClaw tidak menjalankan pemblokiran kode berbahaya lokal
    bawaan selama alur instalasi/pembaruan plugin atau skill; gunakan
    `security.installPolicy` milik operator untuk keputusan allow/block lokal.

    Pola yang lebih aman:

    - utamakan penulis tepercaya dan versi yang di-pin
    - baca skill atau plugin sebelum mengaktifkannya
    - jaga allowlist plugin dan skill tetap sempit
    - jalankan workflow input tidak tepercaya dalam sandbox dengan alat minimal
    - hindari memberikan akses filesystem, exec, browser, atau rahasia yang luas kepada kode pihak ketiga

    Detail: [Skills](/id/tools/skills), [Plugin](/id/tools/plugin),
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Haruskah bot saya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi blast radius jika terjadi masalah. Ini juga memudahkan rotasi
    kredensial atau pencabutan akses tanpa memengaruhi akun pribadi Anda.

    Mulai dari kecil. Berikan akses hanya ke alat dan akun yang benar-benar Anda butuhkan, lalu perluas
    nanti jika diperlukan.

    Dokumentasi: [Keamanan](/id/gateway/security), [Pemasangan](/id/channels/pairing).

  </Accordion>

  <Accordion title="Dapatkah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola paling aman adalah:

    - Pertahankan pesan langsung dalam **mode pemasangan** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin ia mengirim pesan atas nama Anda.
    - Biarkan ia membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan tetap isolasikan. Lihat
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agen hanya untuk chat dan input tepercaya. Tingkatan yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agen yang mengaktifkan alat
    atau saat membaca konten yang tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    alat dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapatkan kode pemasangan">
    Kode pemasangan dikirim **hanya** saat pengirim yang tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` saja tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda ingin akses langsung, masukkan id pengirim Anda ke allowlist atau atur `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah ia akan mengirim pesan ke kontak saya? Bagaimana cara kerja pemasangan?">
    Tidak. Kebijakan pesan langsung WhatsApp bawaan adalah **pemasangan**. Pengirim yang tidak dikenal hanya mendapatkan kode pemasangan dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pemasangan dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Cantumkan permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: ini digunakan untuk mengatur **allowlist/pemilik** Anda sehingga pesan langsung Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan pada nomor WhatsApp pribadi Anda, gunakan nomor tersebut dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "ia tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau alat hanya muncul ketika **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih berisik, periksa pengaturan sesi di Control UI dan atur verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` yang diatur
    ke `on` dalam konfigurasi.

    Dokumentasi: [Berpikir dan verbose](/id/tools/thinking), [Keamanan](/id/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan/membatalkan tugas yang sedang berjalan?">
    Kirim salah satu dari ini **sebagai pesan tersendiri** (tanpa slash):

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

    Untuk proses latar belakang (dari alat exec), Anda dapat meminta agen menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ikhtisar perintah slash: lihat [Perintah slash](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **tersendiri** yang dimulai dengan `/`, tetapi beberapa pintasan (seperti `/status`) juga berfungsi sebaris untuk pengirim yang ada di allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Pesan lintas konteks ditolak")'>
    OpenClaw memblokir pesan **lintas penyedia** secara bawaan. Jika pemanggilan alat terikat
    ke Telegram, ia tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

    Aktifkan pesan lintas penyedia untuk agen:

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

    Mulai ulang Gateway setelah mengedit konfigurasi.

  </Accordion>

  <Accordion title='Mengapa bot terasa seperti "mengabaikan" pesan beruntun cepat?'>
    Prompt di tengah proses diarahkan ke proses aktif secara bawaan. Gunakan `/queue` untuk memilih perilaku proses aktif:

    - `steer` - pandu proses aktif pada batas model berikutnya
    - `followup` - antrekan pesan dan jalankan satu per satu setelah proses saat ini berakhir
    - `collect` - antrekan pesan yang kompatibel dan balas sekali setelah proses saat ini berakhir
    - `interrupt` - batalkan proses saat ini dan mulai dari awal

    Mode bawaan adalah `steer`. Anda dapat menambahkan opsi seperti `debounce:0.5s cap:25 drop:summarize` untuk mode antrean. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model bawaan untuk Anthropic dengan kunci API?'>
    Di OpenClaw, kredensial dan pemilihan model terpisah. Mengatur `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic di profil autentikasi) mengaktifkan autentikasi, tetapi model bawaan sebenarnya adalah apa pun yang Anda konfigurasi di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, itu berarti Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih buntu? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ pertama kali menjalankan](/id/help/faq-first-run) — instalasi, onboarding, autentikasi, langganan, kegagalan awal
- [FAQ model](/id/help/faq-models) — pemilihan model, failover, profil autentikasi
- [Pemecahan masalah](/id/help/troubleshooting) — triase berdasarkan gejala

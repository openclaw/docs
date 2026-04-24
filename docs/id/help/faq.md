---
read_when:
    - Menjawab pertanyaan dukungan umum tentang penyiapan, instalasi, onboarding, atau runtime
    - Men-triase masalah yang dilaporkan pengguna sebelum debugging lebih dalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-24T09:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Jawaban cepat plus pemecahan masalah lebih dalam untuk penyiapan dunia nyata (dev lokal, VPS, multi-agen, OAuth/API key, failover model). Untuk diagnostik runtime, lihat [Pemecahan masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan/mode gateway, agen/sesi, konfigurasi provider + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang aman untuk dibagikan**

   ```bash
   openclaw status --all
   ```

   Diagnosis hanya-baca dengan tail log (token disunting).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe kanal saat didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Kesehatan](/id/gateway/health).

5. **Tail log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC mati, gunakan fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Logging](/id/logging) dan [Pemecahan masalah](/id/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan konfigurasi/state + menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + path config saat terjadi error
   ```

   Meminta snapshot penuh dari gateway yang sedang berjalan (khusus WS). Lihat [Kesehatan](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

Tanya jawab pertama kali — instalasi, onboarding, jalur auth, subscription, kegagalan awal —
ada di [FAQ penggunaan pertama](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI personal yang Anda jalankan di perangkat Anda sendiri. OpenClaw membalas di platform pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan Plugin kanal bawaan seperti QQ Bot) dan juga dapat melakukan voice + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude." OpenClaw adalah **control plane local-first** yang memungkinkan Anda menjalankan asisten
    yang mumpuni di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan alat - tanpa menyerahkan kendali alur kerja Anda ke
    SaaS yang di-host.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Kanal nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      ditambah voice mobile dan Canvas di platform yang didukung.
    - **Agnostik model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan perutean
      dan failover per agen.
    - **Opsi lokal saja:** jalankan model lokal sehingga **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Perutean multi-agen:** pisahkan agen per kanal, akun, atau tugas, masing-masing dengan
      workspace dan default sendiri.
    - **Open source dan bisa diutak-atik:** periksa, perluas, dan self-host tanpa vendor lock-in.

    Dokumen: [Gateway](/id/gateway), [Kanal](/id/channels), [Multi-agen](/id/concepts/multi-agent),
    [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang harus saya lakukan lebih dulu?">
    Proyek awal yang bagus:

    - Bangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Buat prototipe aplikasi mobile (garis besar, layar, rencana API).
    - Rapikan file dan folder (pembersihan, penamaan, penandaan).
    - Hubungkan Gmail dan otomatisasi ringkasan atau tindak lanjut.

    OpenClaw bisa menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya menjadi beberapa fase dan
    menggunakan subagen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Manfaat sehari-hari biasanya terlihat seperti ini:

    - **Ringkasan pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan penulisan draf:** riset cepat, ringkasan, dan draf pertama untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan daftar periksa yang digerakkan oleh Cron atau Heartbeat.
    - **Otomatisasi browser:** mengisi formulir, mengumpulkan data, dan mengulangi tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu dengan lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan penyusunan draf**. OpenClaw dapat memindai situs, membuat shortlist,
    merangkum prospek, dan menulis draf outreach atau copy iklan.

    Untuk **outreach atau menjalankan iklan**, libatkan manusia. Hindari spam, ikuti hukum lokal dan
    kebijakan platform, dan tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf lalu Anda menyetujuinya.

    Dokumen: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa kelebihannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten personal** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Kelebihan:

    - **Memori + workspace persisten** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hook)
    - **Gateway yang selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Node** untuk browser/layar/kamera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo tetap kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Simpan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritasnya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, jadi override terkelola tetap menang atas Skills bawaan tanpa menyentuh git. Jika Anda memerlukan skill terinstal secara global tetapi hanya terlihat oleh agen tertentu, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang sebaiknya berada di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder kustom?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` menginstal ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika skill hanya boleh terlihat oleh agen tertentu, padankan dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron**: pekerjaan terisolasi dapat menetapkan override `model` per pekerjaan.
    - **Subagen**: rutekan tugas ke agen terpisah dengan model default yang berbeda.
    - **Peralihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron](/id/automation/cron-jobs), [Perutean Multi-Agen](/id/concepts/multi-agent), dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat mengerjakan tugas berat. Bagaimana cara memindahkan beban itu?">
    Gunakan **subagen** untuk tugas yang panjang atau paralel. Subagen berjalan dalam sesinya sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn a sub-agent for this task" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dikerjakan Gateway sekarang (dan apakah sedang sibuk).

    Tip token: tugas panjang dan subagen sama-sama mengonsumsi token. Jika biaya menjadi perhatian, atur
    model yang lebih murah untuk subagen melalui `agents.defaults.subagents.model`.

    Dokumen: [Subagen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana sesi subagen yang terikat thread bekerja di Discord?">
    Gunakan binding thread. Anda dapat mengikat thread Discord ke target subagen atau sesi sehingga pesan lanjutan di thread tersebut tetap berada pada sesi yang terikat itu.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengendalikan auto-unfocus.
    - Gunakan `/unfocus` untuk melepaskan thread.

    Konfigurasi yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: atur `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumen: [Subagen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagen selesai, tetapi pembaruan selesai dikirim ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang diselesaikan terlebih dahulu:

    - Pengiriman subagen mode completion memprioritaskan thread atau rute percakapan yang terikat bila ada.
    - Jika origin completion hanya membawa kanal, OpenClaw fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung dapat gagal dan hasilnya fallback ke pengiriman sesi antrean alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau stale tetap dapat memaksa fallback antrean atau kegagalan pengiriman final.
    - Jika balasan asisten terlihat terakhir dari child adalah token sunyi persis `NO_REPLY` / `no_reply`, atau tepat `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres lama yang stale.
    - Jika child timeout setelah hanya melakukan pemanggilan alat, pengumuman dapat meringkasnya menjadi ringkasan progres parsial singkat alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Subagen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    pekerjaan terjadwal tidak akan berjalan.

    Daftar periksa:

    - Konfirmasikan Cron aktif (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak diatur.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa sleep/restart).
    - Verifikasi pengaturan zona waktu untuk pekerjaan (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumen: [Cron](/id/automation/cron-jobs), [Otomatisasi & Tugas](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke kanal. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada fallback send runner yang diharapkan.
    - Target announce yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman outbound.
    - Kegagalan auth kanal (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil isolated yang sunyi (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback antrean.

    Untuk Cron terisolasi, agen tetap dapat mengirim langsung dengan alat `message`
    ketika rute chat tersedia. `--announce` hanya mengendalikan jalur fallback runner
    untuk teks final yang belum dikirim agen sendiri.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa Cron terisolasi mengganti model atau retry sekali?">
    Itu biasanya jalur switch model live, bukan penjadwalan ganda.

    Cron terisolasi dapat mempertahankan handoff model runtime dan retry ketika
    eksekusi aktif melempar `LiveSessionModelSwitchError`. Retry tersebut mempertahankan
    provider/model yang telah diganti, dan jika switch itu membawa override profil auth baru, Cron
    juga mempertahankannya sebelum retry.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang lebih dulu bila berlaku.
    - Lalu `model` per pekerjaan.
    - Lalu override model sesi Cron yang tersimpan.
    - Lalu pemilihan model agen/default normal.

    Loop retry dibatasi. Setelah percobaan awal ditambah 2 retry switch,
    Cron membatalkan alih-alih berputar selamanya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumen: [Cron](/id/automation/cron-jobs), [CLI cron](/id/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara memasang Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan Skills ke workspace Anda. UI Skills macOS tidak tersedia di Linux.
    Telusuri Skills di [https://clawhub.ai](https://clawhub.ai).

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

    - **Cron** untuk tugas terjadwal atau berulang (tetap ada setelah restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Pekerjaan terisolasi** untuk agen otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumen: [Cron](/id/automation/cron-jobs), [Otomatisasi & Tugas](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills Apple khusus macOS dari Linux?">
    Tidak secara langsung. Skills macOS digate oleh `metadata.openclaw.os` ditambah biner yang diperlukan, dan Skills hanya muncul dalam system prompt ketika Skills tersebut memenuhi syarat di **host Gateway**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengoverride gating-nya.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS tersedia, lalu hubungkan dari Linux dalam [mode jarak jauh](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway adalah macOS.

    **Opsi B - gunakan Node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan Node macOS (aplikasi menubar), dan atur **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai memenuhi syarat ketika biner yang diperlukan ada di Node. Agen menjalankan Skills tersebut melalui alat `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt akan menambahkan perintah itu ke allowlist.

    **Opsi C - proksikan biner macOS melalui SSH (lanjutan).**
    Pertahankan Gateway di Linux, tetapi buat biner CLI yang diperlukan diselesaikan ke wrapper SSH yang berjalan di Mac. Lalu override skill agar mengizinkan Linux supaya tetap memenuhi syarat.

    1. Buat wrapper SSH untuk biner tersebut (contoh: `memo` untuk Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Letakkan wrapper di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Override metadata skill (workspace atau `~/.openclaw/skills`) agar mengizinkan Linux:

       ```markdown
       ---
       name: apple-notes
       description: Kelola Apple Notes melalui CLI memo di macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills diperbarui.

  </Accordion>

  <Accordion title="Apakah ada integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen keduanya punya API).
    - **Otomatisasi browser:** berfungsi tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menyimpan konteks per klien (alur kerja agensi), pola sederhananya adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agen untuk mengambil halaman itu pada awal sesi.

    Jika Anda ingin integrasi native, buka permintaan fitur atau bangun skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native masuk ke direktori `skills/` workspace aktif. Untuk Skills bersama lintas agen, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agen yang boleh melihat instalasi bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan biner yang diinstal melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [konfigurasi Skills](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang menempel melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini dapat menggunakan browser host lokal atau Node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host Node di mesin browser atau gunakan CDP jarak jauh.

    Batas saat ini pada `existing-session` / `user`:

    - tindakan berbasis ref, bukan berbasis selector CSS
    - upload memerlukan `ref` / `inputRef` dan saat ini mendukung satu file pada satu waktu
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumen khusus sandboxing?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (Gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur lengkap?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, jadi image tersebut tidak
    menyertakan package sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Persistenkan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap tersimpan.
    - Bangun dependensi sistem ke dalam image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Atur `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path tersebut dipersistenkan.

    Dokumen: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap personal tetapi membuat grup menjadi publik/di-sandbox dengan satu agen?">
    Ya - jika lalu lintas privat Anda adalah **DM** dan lalu lintas publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` sehingga sesi grup/kanal (kunci non-main) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap berjalan di host. Docker adalah backend default jika Anda tidak memilih satu. Lalu batasi alat apa yang tersedia di sesi yang di-sandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh konfigurasi: [Grup: DM personal + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi kunci: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara melakukan bind folder host ke dalam sandbox?">
    Atur `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya `"/home/user/src:/src:ro"`). Bind global + per-agen digabungkan; bind per-agen diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonis yang diselesaikan melalui leluhur terdalam yang sudah ada. Itu berarti escape melalui parent symlink tetap gagal tertutup bahkan ketika segmen path terakhir belum ada, dan pemeriksaan root yang diizinkan tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw hanyalah file Markdown di workspace agen:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (hanya sesi utama/privat)

    OpenClaw juga menjalankan **flush memori pre-compaction diam-diam** untuk mengingatkan model
    agar menulis catatan tahan lama sebelum auto-compaction. Ini hanya berjalan ketika workspace
    dapat ditulis (sandbox hanya-baca melewatinya). Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus lupa. Bagaimana cara membuatnya menetap?">
    Minta bot untuk **menulis fakta tersebut ke memori**. Catatan jangka panjang seharusnya masuk ke `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang sedang kami tingkatkan. Mengingatkan model untuk menyimpan memori akan membantu;
    model akan tahu apa yang harus dilakukan. Jika model terus lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama pada setiap eksekusi.

    Dokumen: [Memori](/id/concepts/memory), [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasnya?">
    File memori hidup di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, jadi percakapan panjang dapat mengalami compaction atau truncation. Karena itulah
    pencarian memori ada - pencarian ini hanya menarik bagian yang relevan kembali ke konteks.

    Dokumen: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan API key OpenAI?">
    Hanya jika Anda menggunakan **OpenAI embeddings**. OAuth Codex mencakup chat/completions dan
    **tidak** memberikan akses embeddings, jadi **login dengan Codex (OAuth atau
    login Codex CLI)** tidak membantu untuk pencarian memori semantik. OpenAI embeddings
    tetap memerlukan API key sungguhan (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw memilih provider otomatis saat OpenClaw
    dapat menyelesaikan API key (profil auth, `models.providers.*.apiKey`, atau env var).
    OpenClaw memprioritaskan OpenAI jika key OpenAI dapat diselesaikan, jika tidak Gemini jika key Gemini
    dapat diselesaikan, lalu Voyage, lalu Mistral. Jika tidak ada key jarak jauh yang tersedia, pencarian memori
    tetap nonaktif sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan tersedia, OpenClaw
    memprioritaskan `local`. Ollama didukung saat Anda secara eksplisit menetapkan
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, atur `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda menginginkan Gemini embeddings, atur
    `memorySearch.provider = "gemini"` dan berikan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau lokal**
    - lihat [Memori](/id/concepts/memory) untuk detail penyiapan.

  </Accordion>
</AccordionGroup>

## Tempat penyimpanan data di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim kepada mereka**.

    - **Lokal secara default:** sesi, file memori, konfigurasi, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Jarak jauh karena keharusan:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) masuk ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap ada di mesin Anda, tetapi lalu lintas
      kanal tetap melalui server kanal tersebut.

    Terkait: [Workspace agen](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Konfigurasi utama (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth saat pertama kali digunakan) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, API key, dan opsional `keyRef`/`tokenRef`)      |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret berbasis file opsional untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis discrub)           |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per agen (agentDir + sesi)                                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & state (per agen)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agen)                                            |

    Path lama agen tunggal: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (`AGENTS.md`, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
    File-file ini berada di **workspace agen**, bukan `~/.openclaw`.

    - **Workspace (per agen)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opsional `HEARTBEAT.md`.
      Root `memory.md` huruf kecil hanya untuk input perbaikan lama; `openclaw doctor --fix`
      dapat menggabungkannya ke `MEMORY.md` ketika kedua file ada.
    - **Direktori state (`~/.openclaw`)**: konfigurasi, state kanal/provider, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan workspace yang sama
    pada setiap peluncuran (dan ingat: mode jarak jauh menggunakan **workspace milik host gateway**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** alih-alih mengandalkan riwayat chat.

    Lihat [Workspace agen](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi backup yang disarankan">
    Simpan **workspace agen** Anda dalam repo git **privat** dan backup ke suatu tempat
    yang privat (misalnya GitHub privat). Ini menangkap file memori + AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    **Jangan** commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload secret terenkripsi).
    Jika Anda memerlukan pemulihan penuh, backup workspace dan direktori state
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumen: [Workspace agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Uninstall](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agen bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox keras.
    Path relatif diselesaikan di dalam workspace, tetapi path absolut dapat mengakses
    lokasi host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agen. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan
    `workspace` agen tersebut ke root repo. Repo OpenClaw hanyalah source code; pertahankan
    workspace terpisah kecuali Anda memang sengaja ingin agen bekerja di dalamnya.

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
    State sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode jarak jauh, penyimpanan sesi yang penting bagi Anda ada di mesin jarak jauh, bukan di laptop lokal Anda. Lihat [Manajemen sesi](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar konfigurasi

<AccordionGroup>
  <Accordion title="Format apa konfigurasi itu? Di mana lokasinya?">
    OpenClaw membaca konfigurasi **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, OpenClaw menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya mengatur gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan unauthorized'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau password
    - `gateway.auth.mode: "trusted-proxy"` di belakang reverse proxy sadar identitas non-loopback yang dikonfigurasi dengan benar

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
    - Jalur panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak diatur.
    - Untuk auth password, atur `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak dapat diselesaikan, resolusi gagal tertutup (tidak ada masking fallback jarak jauh).
    - Penyiapan UI Control shared-secret diautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan aplikasi/UI). Mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback pada host yang sama tetap **tidak** memenuhi auth trusted-proxy. Trusted proxy harus berupa sumber non-loopback yang dikonfigurasi.

  </Accordion>

  <Accordion title="Mengapa saya sekarang memerlukan token di localhost?">
    OpenClaw menegakkan auth gateway secara default, termasuk loopback. Pada jalur default normal itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway akan diselesaikan ke mode token dan token akan dibuat otomatis, lalu disimpan ke `gateway.auth.token`, sehingga **klien WS lokal harus diautentikasi**. Ini memblokir proses lokal lain dari memanggil Gateway.

    Jika Anda lebih suka jalur auth lain, Anda dapat secara eksplisit memilih mode password (atau, untuk reverse proxy sadar identitas non-loopback, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, atur `gateway.auth.mode: "none"` secara eksplisit di konfigurasi Anda. Doctor dapat membuatkan token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah konfigurasi?">
    Gateway memantau konfigurasi dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): hot-apply perubahan yang aman, restart untuk yang kritis
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

    - `off`: menyembunyikan teks tagline tetapi mempertahankan baris judul/versi banner.
    - `default`: menggunakan `All your chats, one OpenClaw.` setiap saat.
    - `random`: tagline lucu/musiman bergilir (perilaku default).
    - Jika Anda tidak ingin banner sama sekali, atur env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan web fetch)?">
    `web_fetch` bekerja tanpa API key. `web_search` bergantung pada provider
    yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan API key normal mereka.
    - Ollama Web Search bebas key, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo bebas key, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG bebas key/self-hosted; konfigurasikan `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Disarankan:** jalankan `openclaw configure --section web` dan pilih provider.
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
              provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
            },
          },
        },
    }
    ```

    Konfigurasi pencarian web khusus provider sekarang berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider `tools.web.search.*` lama masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk konfigurasi baru.
    Konfigurasi fallback web-fetch Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` aktif secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis provider fallback fetch siap pertama dari kredensial yang tersedia. Saat ini provider bawaan adalah Firecrawl.
    - Daemon membaca env var dari `~/.openclaw/.env` (atau environment layanan).

    Dokumen: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkannya dan mencegah hal ini?">
    `config.apply` menggantikan **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua yang
    lain akan dihapus.

    OpenClaw saat ini melindungi dari banyak penimpaan tidak sengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi seluruh konfigurasi hasil perubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Jika pengeditan langsung merusak startup atau hot reload, Gateway memulihkan konfigurasi good-known terakhir dan menyimpan file yang ditolak sebagai `openclaw.json.clobbered.*`.
    - Agen utama menerima peringatan boot setelah pemulihan agar tidak membabi buta menulis konfigurasi buruk itu lagi.

    Pulihkan:

    - Periksa `openclaw logs --follow` untuk `Config auto-restored from last-known-good`, `Config write rejected:`, atau `config reload restored last-known-good config`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di samping konfigurasi aktif.
    - Pertahankan konfigurasi aktif yang sudah dipulihkan jika berfungsi, lalu salin kembali hanya kunci yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jalankan `openclaw config validate` dan `openclaw doctor`.
    - Jika Anda tidak memiliki payload good-known terakhir atau payload yang ditolak, pulihkan dari backup, atau jalankan ulang `openclaw doctor` dan konfigurasikan ulang kanal/model.
    - Jika ini tidak terduga, laporkan bug dan sertakan konfigurasi terakhir yang Anda ketahui atau backup apa pun.
    - Agen coding lokal sering kali dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk pengeditan interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu ketika Anda tidak yakin tentang path atau bentuk field yang tepat; perintah ini mengembalikan node skema dangkal plus ringkasan child langsung untuk penelusuran lebih dalam.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan alat `gateway` khusus pemilik dari eksekusi agen, alat tersebut tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke path exec terlindungi yang sama).

    Dokumen: [Config](/id/cli/config), [Configure](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola yang umum adalah **satu Gateway** (misalnya Raspberry Pi) plus **Node** dan **agen**:

    - **Gateway (pusat):** memiliki kanal (Signal/WhatsApp), perutean, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (worker):** otak/workspace terpisah untuk peran khusus (misalnya "Hetzner ops", "Data personal").
    - **Subagen:** munculkan pekerjaan latar belakang dari agen utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan berpindah agen/sesi.

    Dokumen: [Node](/id/nodes), [Akses jarak jauh](/id/gateway/remote), [Perutean Multi-Agen](/id/concepts/multi-agent), [Subagen](/id/tools/subagents), [TUI](/id/web/tui).

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

    Headless menggunakan **engine Chromium yang sama** dan berfungsi untuk sebagian besar otomatisasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda memerlukan visual).
    - Beberapa situs lebih ketat terhadap otomatisasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Atur `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium lainnya) dan restart Gateway.
    Lihat contoh konfigurasi lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway dan Node jarak jauh

<AccordionGroup>
  <Accordion title="Bagaimana perintah menyebar antara Telegram, gateway, dan Node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agen dan
    baru kemudian memanggil Node melalui **Gateway WebSocket** ketika alat Node diperlukan:

    Telegram → Gateway → Agen → `node.*` → Node → Gateway → Telegram

    Node tidak melihat lalu lintas provider masuk; Node hanya menerima panggilan RPC Node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway di-host dari jarak jauh?">
    Jawaban singkat: **pasangkan komputer Anda sebagai Node**. Gateway berjalan di tempat lain, tetapi tetap dapat
    memanggil alat `node.*` (layar, kamera, sistem) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan tipikal:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumahan).
    2. Masukkan host Gateway + komputer Anda ke tailnet yang sama.
    3. Pastikan Gateway WS dapat dijangkau (bind tailnet atau tunnel SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar aplikasi dapat mendaftar sebagai Node.
    5. Setujui Node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; Node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan Node macOS memungkinkan `system.run` di mesin itu. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Keamanan](/id/gateway/security).

    Dokumen: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Lalu apa?">
    Periksa hal dasar:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan kanal: `openclaw channels status`

    Lalu verifikasi auth dan perutean:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui tunnel SSH, pastikan tunnel lokal aktif dan menunjuk ke port yang benar.
    - Konfirmasikan allowlist Anda (DM atau grup) menyertakan akun Anda.

    Dokumen: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Kanal](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw saling berbicara (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda bisa menghubungkannya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan kanal chat normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika salah satu bot ada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh tersebut
    melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)).

    Pola contoh (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Halo dari bot lokal" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak berputar tanpa henti (mention-only, allowlist kanal,
    atau aturan "jangan membalas pesan bot").

    Dokumen: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Agent send](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway dapat meng-host beberapa agen, masing-masing dengan workspace, default model,
    dan perutean sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta sederhana daripada menjalankan
    satu VPS per agen.

    Gunakan VPS terpisah hanya ketika Anda membutuhkan isolasi keras (batas keamanan) atau konfigurasi yang sangat
    berbeda sehingga tidak ingin dibagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agen atau subagen.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan Node di laptop pribadi saya daripada SSH dari VPS?">
    Ya - Node adalah cara kelas satu untuk menjangkau laptop Anda dari Gateway jarak jauh, dan Node
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows via WSL2) dan
    ringan (VPS kecil atau mesin kelas Raspberry Pi sudah cukup; RAM 4 GB sangat memadai), jadi penyiapan umum
    adalah host yang selalu aktif ditambah laptop Anda sebagai Node.

    - **Tidak perlu SSH inbound.** Node keluar terhubung ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi yang lebih aman.** `system.run` digate oleh allowlist/persetujuan Node di laptop tersebut.
    - **Lebih banyak alat perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host Node di laptop, atau tempelkan ke Chrome lokal di host melalui Chrome MCP.

    SSH cocok untuk akses shell ad-hoc, tetapi Node lebih sederhana untuk alur kerja agen yang berkelanjutan dan
    otomatisasi perangkat.

    Dokumen: [Node](/id/nodes), [CLI Nodes](/id/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah Node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (Node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host Node headless
    dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree konfigurasi dengan node skema dangkalnya, petunjuk UI yang cocok, dan ringkasan child langsung sebelum menulis
    - `config.get`: ambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial yang aman (disarankan untuk sebagian besar edit RPC); hot-reload bila memungkinkan dan restart bila diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; hot-reload bila memungkinkan dan restart bila diperlukan
    - Alat runtime `gateway` khusus pemilik tetap menolak penulisan ulang `tools.exec.ask` / `tools.exec.security`; alias legacy `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama

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
       - Gunakan aplikasi Tailscale dan login ke tailnet yang sama.
    3. **Aktifkan MagicDNS (disarankan)**
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS memiliki nama yang stabil.
    4. **Gunakan hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda menginginkan UI Control tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini menjaga gateway tetap terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan Node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **UI Control Gateway + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang disarankan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH dapat berupa hostname tailnet).
       Aplikasi akan men-tunnel port Gateway dan terhubung sebagai Node.
    3. **Setujui Node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumen: [Protokol Gateway](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [mode jarak jauh macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal di laptop kedua atau cukup menambahkan Node?">
    Jika Anda hanya membutuhkan **alat lokal** (layar/kamera/exec) di laptop kedua, tambahkan laptop itu sebagai
    **Node**. Itu mempertahankan satu Gateway dan menghindari konfigurasi ganda. Alat Node lokal
    saat ini hanya untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya ketika Anda membutuhkan **isolasi keras** atau dua bot yang benar-benar terpisah.

    Dokumen: [Node](/id/nodes), [CLI Nodes](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars dan pemuatan `.env`

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat environment variable?">
    OpenClaw membaca env var dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari current working directory
    - fallback global `.env` dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Kedua file `.env` tidak mengoverride env var yang sudah ada.

    Anda juga dapat mendefinisikan env var inline di konfigurasi (hanya diterapkan jika tidak ada di env proses):

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

  <Accordion title="Saya menjalankan Gateway melalui service dan env var saya hilang. Lalu bagaimana?">
    Dua perbaikan umum:

    1. Letakkan key yang hilang di `~/.openclaw/.env` agar tetap diambil bahkan saat service tidak mewarisi env shell Anda.
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

    Ini menjalankan login shell Anda dan hanya mengimpor key yang diharapkan yang hilang (tidak pernah mengoverride). Env var yang setara:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menetapkan COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor env shell** diaktifkan. "Shell env: off"
    **tidak** berarti env var Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    login shell Anda secara otomatis.

    Jika Gateway berjalan sebagai service (launchd/systemd), Gateway tidak akan mewarisi shell
    environment Anda. Perbaiki dengan salah satu cara berikut:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan impor shell (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` konfigurasi Anda (hanya berlaku jika hilang).

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

  <Accordion title="Apakah sesi reset otomatis jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **nonaktif secara default** (default **0**).
    Atur ke nilai positif untuk mengaktifkan kedaluwarsa idle. Ketika diaktifkan, pesan **berikutnya**
    setelah periode idle akan memulai ID sesi baru untuk kunci chat tersebut.
    Ini tidak menghapus transkrip - hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara untuk membuat tim instance OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **perutean multi-agen** dan **subagen**. Anda dapat membuat satu agen
    koordinator dan beberapa agen worker dengan workspace dan model masing-masing.

    Meskipun begitu, ini sebaiknya dianggap sebagai **eksperimen yang menyenangkan**. Ini boros token dan sering kali
    kurang efisien daripada menggunakan satu bot dengan sesi terpisah. Model tipikal yang
    kami bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot tersebut
    juga dapat memunculkan subagen saat diperlukan.

    Dokumen: [Perutean multi-agen](/id/concepts/multi-agent), [Subagen](/id/tools/subagents), [CLI Agents](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, output alat besar, atau banyak
    file dapat memicu compaction atau truncation.

    Yang membantu:

    - Minta bot merangkum keadaan saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berpindah topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan subagen untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
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

    - Onboarding juga menawarkan **Reset** jika melihat konfigurasi yang sudah ada. Lihat [Onboarding (CLI)](/id/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori state (default-nya `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi + kredensial + sesi + workspace dev).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara mereset atau melakukan compaction?'>
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

    Jika ini terus terjadi:

    - Aktifkan atau setel **session pruning** (`agents.defaults.contextPruning`) untuk memangkas output alat lama.
    - Gunakan model dengan jendela konteks yang lebih besar.

    Dokumen: [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning), [Manajemen sesi](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa
    `input` yang diperlukan. Biasanya itu berarti riwayat sesi stale atau korup (sering setelah thread panjang
    atau perubahan alat/skema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapatkan pesan heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1j** saat menggunakan auth OAuth). Atur atau nonaktifkan:

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

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header markdown
    seperti `# Heading`), OpenClaw melewati eksekusi heartbeat untuk menghemat panggilan API.
    Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per agen menggunakan `agents.list[].heartbeat`. Dokumen: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan pada **akun Anda sendiri**, jadi jika Anda berada di grup tersebut, OpenClaw dapat melihatnya.
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

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, misalnya:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Directory](/id/cli/directory), [Logs](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Gating mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung diciutkan ke sesi utama secara default. Grup/kanal memiliki kunci sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agen yang dapat saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) baik-baik saja, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip hidup di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agen berarti lebih banyak penggunaan model secara bersamaan.
    - **Overhead operasi:** profil auth, workspace, dan perutean kanal per agen.

    Tips:

    - Pertahankan satu workspace **aktif** per agen (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus entri JSONL atau penyimpanan) jika disk membesar.
    - Gunakan `openclaw doctor` untuk menemukan workspace liar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana sebaiknya saya menyiapkannya?">
    Ya. Gunakan **Perutean Multi-Agen** untuk menjalankan beberapa agen terisolasi dan merutekan pesan masuk berdasarkan
    kanal/akun/peer. Slack didukung sebagai kanal dan dapat diikat ke agen tertentu.

    Akses browser sangat kuat tetapi bukan berarti "bisa melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA
    tetap dapat memblokir otomatisasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP di mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agen per peran (bindings).
    - Kanal Slack diikat ke agen-agen tersebut.
    - Browser lokal melalui Chrome MCP atau Node saat diperlukan.

    Dokumen: [Perutean Multi-Agen](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil auth

Tanya jawab model — default, pemilihan, alias, perpindahan, failover, profil auth —
ada di [FAQ Models](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengendalikan satu port multiplexed untuk WebSocket + HTTP (UI Control, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah pandangan **supervisor** (launchd/systemd/schtasks). Connectivity probe adalah CLI yang benar-benar terhubung ke WebSocket gateway.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar terikat pada port)
    - `Last gateway error:` (akar penyebab umum ketika proses hidup tetapi port tidak listen)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" berbeda?'>
    Anda sedang mengedit satu file konfigurasi sementara service menjalankan file lain (sering kali karena ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaiki:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan dari `--profile` / environment yang sama yang ingin Anda gunakan oleh service.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menegakkan runtime lock dengan mengikat listener WebSocket segera saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, OpenClaw melempar `GatewayLockError` yang menunjukkan instance lain sudah listen.

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

    - `openclaw gateway` hanya mulai saat `gateway.mode` adalah `local` (atau Anda memberikan flag override).
    - Aplikasi macOS memantau file konfigurasi dan berpindah mode secara langsung ketika nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanyalah kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan auth gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='UI Control mengatakan "unauthorized" (atau terus reconnect). Lalu bagaimana?'>
    Jalur auth gateway Anda dan metode auth UI tidak cocok.

    Fakta (dari kode):

    - UI Control menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL gateway yang dipilih, sehingga refresh pada tab yang sama tetap berfungsi tanpa memulihkan persistensi token `localStorage` jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan token perangkat cache ketika gateway mengembalikan petunjuk retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token cache itu sekarang menggunakan kembali cakupan yang telah disetujui dan tersimpan bersama token perangkat. Pemanggil dengan `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan set cakupan yang diminta alih-alih mewarisi cakupan cache.
    - Di luar jalur retry itu, prioritas auth connect adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat yang tersimpan, lalu token bootstrap.
    - Pemeriksaan cakupan token bootstrap menggunakan prefix per role. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; role node atau role non-operator lainnya tetap memerlukan cakupan di bawah prefix role mereka sendiri.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membuka; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jika remote, tunnel terlebih dahulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: atur `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempelkan secret yang cocok di pengaturan UI Control.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` aktif dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode trusted-proxy: pastikan Anda datang melalui proxy sadar identitas non-loopback yang dikonfigurasi, bukan proxy loopback host yang sama atau URL gateway mentah.
    - Jika mismatch tetap ada setelah satu retry, putar/setujui ulang token perangkat yang dipasangkan:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotate itu mengatakan ditolak, periksa dua hal:
      - sesi paired-device hanya dapat memutar perangkat **miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi cakupan operator saat ini milik pemanggil
    - Masih buntu? Jalankan `openclaw status --all` dan ikuti [Pemecahan masalah](/id/gateway/troubleshooting). Lihat [Dashboard](/id/web/dashboard) untuk detail auth.

  </Accordion>

  <Accordion title="Saya mengatur gateway.bind tailnet tetapi tidak bisa bind dan tidak ada yang listen">
    Bind `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmukanya down), tidak ada alamat untuk di-bind.

    Perbaikan:

    - Mulai Tailscale di host tersebut (agar host memiliki alamat 100.x), atau
    - Beralih ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` memprioritaskan loopback; gunakan `gateway.bind: "tailnet"` ketika Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa Gateway pada host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa kanal pesan dan agen. Gunakan beberapa Gateway hanya ketika Anda membutuhkan redundansi (mis: bot penyelamat) atau isolasi keras.

    Ya, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (disarankan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Atur `gateway.port` unik di setiap konfigurasi profil (atau berikan `--port` untuk eksekusi manual).
    - Instal service per profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan suffix pada nama service (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan server mengharapkan pesan pertama
    berupa frame `connect`. Jika menerima hal lain, Gateway menutup koneksi
    dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum:

    - Anda membuka URL **HTTP** di browser (`http://...`) alih-alih klien WS.
    - Anda menggunakan port atau path yang salah.
    - Proxy atau tunnel menghapus header auth atau mengirim permintaan non-Gateway.

    Perbaikan cepat:

    1. Gunakan URL WS: `ws://<host>:18789` (atau `wss://...` jika HTTPS).
    2. Jangan buka port WS di tab browser biasa.
    3. Jika auth aktif, sertakan token/password di frame `connect`.

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

    Anda dapat mengatur path tetap melalui `logging.file`. Level log file dikendalikan oleh `logging.level`. Verbosity konsol dikendalikan oleh `--verbose` dan `logging.consoleLevel`.

    Tail log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log service/supervisor (ketika gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Pemecahan masalah](/id/gateway/troubleshooting) untuk lebih lanjut.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/me-restart service Gateway?">
    Gunakan helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan gateway secara manual, `openclaw gateway --force` dapat merebut kembali port. Lihat [Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Saya menutup terminal di Windows - bagaimana cara me-restart OpenClaw?">
    Ada **dua mode instalasi Windows**:

    **1) WSL2 (disarankan):** Gateway berjalan di dalam Linux.

    Buka PowerShell, masuk ke WSL, lalu restart:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda belum pernah menginstal service, mulai di foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows native (tidak disarankan):** Gateway berjalan langsung di Windows.

    Buka PowerShell dan jalankan:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankannya secara manual (tanpa service), gunakan:

    ```powershell
    openclaw gateway run
    ```

    Dokumen: [Windows (WSL2)](/id/platforms/windows), [Runbook service Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Gateway aktif tetapi balasan tidak pernah datang. Apa yang harus saya periksa?">
    Mulailah dengan pemeriksaan kesehatan cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Auth model tidak dimuat pada **host gateway** (periksa `models status`).
    - Pairing/allowlist kanal memblokir balasan (periksa konfigurasi kanal + log).
    - WebChat/Dashboard terbuka tanpa token yang benar.

    Jika Anda berada jarak jauh, pastikan koneksi tunnel/Tailscale aktif dan
    Gateway WebSocket dapat dijangkau.

    Dokumen: [Kanal](/id/channels), [Pemecahan masalah](/id/gateway/troubleshooting), [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - lalu bagaimana?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika remote, apakah tunnel/koneksi Tailscale aktif?

    Lalu tail log:

    ```bash
    openclaw logs --follow
    ```

    Dokumen: [Dashboard](/id/web/dashboard), [Akses jarak jauh](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands Telegram gagal. Apa yang harus saya periksa?">
    Mulailah dengan log dan status kanal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error-nya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkas ke batas Telegram dan retry dengan perintah yang lebih sedikit, tetapi beberapa entri menu tetap perlu dihapus. Kurangi perintah Plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu itu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di belakang proxy, pastikan HTTPS outbound diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway bersifat remote, pastikan Anda melihat log di host Gateway.

    Dokumen: [Telegram](/id/channels/telegram), [Pemecahan masalah kanal](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama konfirmasikan Gateway dapat dijangkau dan agen dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat state saat ini. Jika Anda mengharapkan balasan di kanal
    chat, pastikan pengiriman diaktifkan (`/deliver on`).

    Dokumen: [TUI](/id/web/tui), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda menginstal service:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **service yang diawasi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankannya di foreground, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Dokumen: [Runbook service Gateway](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: me-restart **service latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di foreground** untuk sesi terminal ini.

    Jika Anda menginstal service, gunakan perintah gateway. Gunakan `openclaw gateway` ketika
    Anda menginginkan satu kali eksekusi foreground.

  </Accordion>

  <Accordion title="Cara tercepat mendapatkan detail lebih lanjut ketika ada yang gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol lebih banyak. Lalu periksa file log untuk auth kanal, perutean model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya membuat gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran outbound dari agen harus menyertakan baris `MEDIA:<path-or-url>` (di barisnya sendiri). Lihat [penyiapan asisten OpenClaw](/id/start/openclaw) dan [Agent send](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Silakan" --media /path/to/file.png
    ```

    Periksa juga:

    - Kanal target mendukung media outbound dan tidak diblokir oleh allowlist.
    - File berada dalam batas ukuran provider (gambar diubah ukurannya hingga maks 2048px).
    - `tools.fs.workspaceOnly=true` membuat pengiriman path lokal tetap dibatasi ke workspace, temp/media-store, dan file yang divalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan `MEDIA:` mengirim file lokal host yang sudah bisa dibaca agen, tetapi hanya untuk media plus jenis dokumen aman (gambar, audio, video, PDF, dan dokumen Office). Teks biasa dan file mirip secret tetap diblokir.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada kanal yang mendukung DM adalah **pairing**:
      - Pengirim yang tidak dikenal menerima kode pairing; bot tidak memproses pesan mereka.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan pending dibatasi **3 per kanal**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak datang.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk menampilkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi perhatian untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten tidak tepercaya**, bukan hanya siapa yang dapat DM bot.
    Jika asisten Anda membaca konten eksternal (web search/fetch, halaman browser, email,
    dokumen, lampiran, log yang ditempel), konten itu dapat berisi instruksi yang mencoba
    membajak model. Ini dapat terjadi bahkan jika **Anda satu-satunya pengirim**.

    Risiko terbesar adalah ketika alat diaktifkan: model dapat ditipu untuk
    mengekfiltrasi konteks atau memanggil alat atas nama Anda. Kurangi radius dampak dengan:

    - menggunakan agen "pembaca" hanya-baca atau dengan alat dinonaktifkan untuk merangkum konten tidak tepercaya
    - menjaga `web_search` / `web_fetch` / `browser` tetap nonaktif untuk agen yang mengaktifkan alat
    - memperlakukan teks file/dokumen yang didekode juga sebagai tidak tepercaya: OpenResponses
      `input_file` dan ekstraksi lampiran media keduanya membungkus teks yang diekstrak dalam
      penanda batas konten eksternal eksplisit alih-alih meneruskan teks file mentah
    - sandboxing dan allowlist alat yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Haruskah bot saya memiliki email, akun GitHub, atau nomor teleponnya sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi radius dampak jika terjadi sesuatu yang salah. Ini juga memudahkan untuk merotasi
    kredensial atau mencabut akses tanpa memengaruhi akun personal Anda.

    Mulailah dari yang kecil. Berikan akses hanya ke alat dan akun yang benar-benar Anda butuhkan, lalu perluas
    nanti jika diperlukan.

    Dokumen: [Keamanan](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Bisakah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** menyarankan otonomi penuh atas pesan personal Anda. Pola yang paling aman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin bot mengirim pesan atas nama Anda.
    - Biarkan bot membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan pertahankan isolasinya. Lihat
    [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang lebih murah untuk tugas asisten personal?">
    Ya, **jika** agen hanya chat dan input-nya tepercaya. Tier yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agen yang mengaktifkan alat
    atau saat membaca konten tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    alat dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapat kode pairing">
    Kode pairing dikirim **hanya** ketika pengirim yang tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` dengan sendirinya tidak menghasilkan kode.

    Periksa permintaan pending:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda ingin akses langsung, tambahkan pengirim Anda ke allowlist atau atur `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah akan mengirim pesan ke kontak saya? Bagaimana cara kerja pairing?">
    Tidak. Kebijakan DM WhatsApp default adalah **pairing**. Pengirim yang tidak dikenal hanya mendapatkan kode pairing dan pesannya **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Daftar permintaan pending:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: prompt ini digunakan untuk mengatur **allowlist/pemilik** Anda agar DM Anda sendiri diizinkan. Ini tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan pada nomor WhatsApp personal Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak tampil di chat?">
    Sebagian besar pesan internal atau alat hanya muncul ketika **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih berisik, periksa pengaturan sesi di UI Control dan atur verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` yang diatur
    ke `on` di konfigurasi.

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

    Ini adalah pemicu abort (bukan slash commands).

    Untuk proses latar belakang (dari alat exec), Anda dapat meminta agen menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Ikhtisar slash commands: lihat [Slash commands](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`, tetapi beberapa shortcut (seperti `/status`) juga bekerja inline untuk pengirim yang ada di allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pesan **lintas-provider** secara default. Jika pemanggilan alat terikat
    ke Telegram, alat tersebut tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

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

    Restart gateway setelah mengedit konfigurasi.

  </Accordion>

  <Accordion title='Mengapa bot tampak "mengabaikan" pesan yang dikirim cepat berturut-turut?'>
    Mode antrean mengendalikan bagaimana pesan baru berinteraksi dengan eksekusi yang sedang berlangsung. Gunakan `/queue` untuk mengubah mode:

    - `steer` - pesan baru mengarahkan ulang tugas saat ini
    - `followup` - jalankan pesan satu per satu
    - `collect` - batch pesan dan balas sekali (default)
    - `steer-backlog` - arahkan sekarang, lalu proses backlog
    - `interrupt` - batalkan eksekusi saat ini dan mulai dari awal

    Anda dapat menambahkan opsi seperti `debounce:2s cap:25 drop:summarize` untuk mode followup.

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan API key?'>
    Di OpenClaw, kredensial dan pemilihan model terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan API key Anthropic di profil auth) mengaktifkan autentikasi, tetapi model default yang sebenarnya adalah apa pun yang Anda konfigurasikan di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, itu berarti Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih buntu? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ penggunaan pertama](/id/help/faq-first-run) — instalasi, onboarding, auth, subscription, kegagalan awal
- [FAQ Models](/id/help/faq-models) — pemilihan model, failover, profil auth
- [Pemecahan masalah](/id/help/troubleshooting) — triase berbasis gejala

---
read_when:
    - Menjawab pertanyaan dukungan umum tentang penyiapan, instalasi, orientasi awal, atau runtime
    - Melakukan triase masalah yang dilaporkan pengguna sebelum debugging lebih mendalam
summary: Pertanyaan umum tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: Tanya Jawab
x-i18n:
    generated_at: "2026-07-19T16:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 610d4692196fe6915df32966f7c2878124d1070a9cfcb2b6e4703f7e1c31b199
    source_path: help/faq.md
    workflow: 16
---

Jawaban singkat ditambah pemecahan masalah yang lebih mendalam untuk penyiapan di dunia nyata (pengembangan lokal, VPS, multiagen, kunci OAuth/API, failover model). Untuk diagnostik runtime, lihat [Pemecahan Masalah](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Konfigurasi](/id/gateway/configuration).

## 60 detik pertama jika ada yang bermasalah

<Steps>
  <Step title="Status cepat">
    ```bash
    openclaw status
    ```
    Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agen/sesi, konfigurasi penyedia + masalah runtime (saat gateway dapat dijangkau).
  </Step>
  <Step title="Laporan yang dapat ditempel (aman dibagikan)">
    ```bash
    openclaw status --all
    ```
    Diagnosis hanya-baca dengan bagian akhir log (token disamarkan).
  </Step>
  <Step title="Status daemon + port">
    ```bash
    openclaw gateway status
    ```
    Menampilkan runtime supervisor dibandingkan keterjangkauan RPC, URL target probe, dan konfigurasi yang kemungkinan digunakan layanan.
  </Step>
  <Step title="Probe mendalam">
    ```bash
    openclaw status --deep
    ```
    Probe kesehatan gateway secara langsung, termasuk probe saluran jika didukung (memerlukan gateway yang dapat dijangkau). Lihat [Kesehatan](/id/gateway/health).
  </Step>
  <Step title="Ikuti log terbaru">
    ```bash
    openclaw logs --follow
    ```
    Jika RPC tidak aktif, gunakan sebagai alternatif:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Log berkas terpisah dari log layanan; lihat [Pencatatan Log](/id/logging) dan [Pemecahan Masalah](/id/gateway/troubleshooting).
  </Step>
  <Step title="Jalankan doctor (perbaikan)">
    ```bash
    openclaw doctor
    ```
    Memperbaiki/memigrasikan konfigurasi dan status, lalu menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).
  </Step>
  <Step title="Snapshot Gateway (khusus WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # menampilkan URL target + jalur konfigurasi saat terjadi kesalahan
    ```
    Meminta snapshot lengkap dari gateway yang sedang berjalan. Lihat [Kesehatan](/id/gateway/health).
  </Step>
</Steps>

## Mulai cepat dan penyiapan pertama kali

Tanya jawab penggunaan pertama—instalasi, orientasi awal, rute autentikasi, langganan, kegagalan awal—tersedia di [Tanya Jawab Penggunaan Pertama](/id/help/faq-first-run).

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat sendiri. OpenClaw merespons melalui sarana perpesanan yang sudah Anda gunakan (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp, dan plugin saluran bawaan seperti QQ Bot), serta dapat menyediakan suara dan Canvas langsung pada platform yang didukung. **Gateway** adalah bidang kendali yang selalu aktif; asistennya adalah produk.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar pembungkus Claude". OpenClaw adalah **bidang kendali yang mengutamakan penggunaan lokal** dan menjalankan asisten berkemampuan tinggi pada **perangkat keras Anda sendiri**, dapat diakses dari aplikasi obrolan yang sudah Anda gunakan, dengan sesi berstatus, memori, dan alat—tanpa menyerahkan alur kerja Anda kepada SaaS terkelola.

    - **Perangkat Anda, data Anda**: jalankan Gateway di mana pun Anda inginkan (Mac, Linux, VPS) dan simpan ruang kerja serta riwayat sesi secara lokal.
    - **Saluran nyata, bukan sandbox web**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/dan lainnya, ditambah suara seluler dan Canvas pada platform yang didukung.
    - **Tidak bergantung pada model tertentu**: gunakan Anthropic, MiniMax, OpenAI, OpenRouter, dan lainnya, dengan perutean per agen dan failover.
    - **Opsi khusus lokal**: jalankan model lokal agar semua data dapat tetap berada di perangkat Anda.
    - **Perutean multiagen**: pisahkan agen berdasarkan saluran, akun, atau tugas, masing-masing dengan ruang kerja dan nilai default sendiri.
    - **Sumber terbuka dan dapat dimodifikasi**: periksa, perluas, dan lakukan hosting mandiri tanpa ketergantungan pada vendor.

    Dokumentasi: [Gateway](/id/gateway), [Saluran](/id/channels), [Multiagen](/id/concepts/multi-agent), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya—apa yang sebaiknya dilakukan terlebih dahulu?">
    Proyek awal yang baik: buat situs web (WordPress, Shopify, atau situs statis); buat prototipe aplikasi seluler (kerangka, layar, rencana API); tata berkas dan folder; hubungkan Gmail dan otomatisasikan ringkasan atau tindak lanjut.

    OpenClaw dapat menangani tugas besar, tetapi bekerja paling baik jika tugas dibagi menjadi beberapa fase dengan subagen untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    - **Pengarahan pribadi**: ringkasan kotak masuk, kalender, dan berita yang penting bagi Anda.
    - **Riset dan penyusunan draf**: riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut**: dorongan serta daftar periksa berbasis Cron atau Heartbeat.
    - **Otomatisasi peramban**: mengisi formulir, mengumpulkan data, dan mengulangi tugas web.
    - **Koordinasi lintas perangkat**: kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, lalu terima kembali hasilnya dalam obrolan.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu pencarian calon pelanggan, penjangkauan, iklan, dan blog untuk SaaS?">
    Ya, untuk **riset, kualifikasi, dan penyusunan draf**: memindai situs, menyusun daftar pilihan, merangkum calon pelanggan, serta menulis draf penjangkauan atau teks iklan.

    Untuk **pelaksanaan penjangkauan atau iklan**, tetap libatkan manusia. Hindari spam, patuhi hukum setempat dan kebijakan platform, serta tinjau semuanya sebelum dikirim. Biarkan OpenClaw menyusun draf; Anda menyetujuinya.

    Dokumentasi: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa keunggulannya dibandingkan Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan Claude Code atau Codex untuk siklus pengodean langsung tercepat di dalam repo. Gunakan OpenClaw untuk memori yang persisten, akses lintas perangkat, dan orkestrasi alat.

    - Memori dan ruang kerja persisten di seluruh sesi.
    - Akses multiplatform (Telegram, WhatsApp, TUI, WebChat).
    - Orkestrasi alat (peramban, berkas, penjadwalan, hook).
    - Gateway yang selalu aktif (jalankan di VPS, berinteraksi dari mana saja).
    - Node untuk peramban/layar/kamera/eksekusi lokal.

    Etalase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan skill tanpa membuat repo terus berubah?">
    Gunakan penggantian terkelola alih-alih mengedit salinan repo. Tempatkan perubahan di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritas: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> bawaan -> `skills.load.extraDirs`, sehingga penggantian terkelola mengungguli Skills bawaan tanpa menyentuh git. Untuk menginstal secara global tetapi membatasi visibilitas hanya pada beberapa agen, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` / `agents.list[].skills`. Hanya penyuntingan yang layak dikirim ke hulu yang seharusnya diajukan sebagai PR terhadap salinan repo.
  </Accordion>

  <Accordion title="Bisakah saya memuat skill dari folder khusus?">
    Ya: tambahkan direktori melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah dalam urutan di atas). `clawhub` secara default menginstal ke `./skills`, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Untuk membatasi visibilitas pada agen tertentu, pasangkan dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana cara menggunakan model atau pengaturan yang berbeda untuk tugas yang berbeda?">
    Pola yang didukung:

    - **Tugas Cron**: tugas terisolasi dapat menetapkan penggantian `model` untuk setiap tugas.
    - **Agen**: rutekan tugas ke agen terpisah dengan model default, tingkat pemikiran, dan parameter aliran yang berbeda.
    - **Peralihan sesuai permintaan**: `/model` mengganti model sesi saat ini kapan saja.

    Contoh—model yang sama, pengaturan per agen yang berbeda:

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

    Tempatkan nilai default per model yang digunakan bersama di `agents.defaults.models["provider/model"].params`, lalu penggantian khusus agen di `agents.list[].params` datar. Jangan menduplikasi model yang sama di bawah `agents.list[].models["provider/model"].params` bertingkat; jalur tersebut ditujukan untuk katalog model per agen dan penggantian runtime.

    Lihat [Tugas Cron](/id/automation/cron-jobs), [Perutean Multiagen](/id/concepts/multi-agent), [Konfigurasi](/id/gateway/config-agents), [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot macet saat melakukan pekerjaan berat. Bagaimana cara mengalihkannya?">
    Gunakan **subagen** untuk tugas panjang atau paralel: subagen berjalan dalam sesinya sendiri, mengembalikan ringkasan, dan menjaga obrolan utama Anda tetap responsif. Minta bot untuk "membuat subagen bagi tugas ini", atau gunakan `/subagents`. Gunakan `/status` untuk melihat apakah Gateway sedang sibuk.

    Tugas panjang maupun subagen menggunakan token; tetapkan model yang lebih murah untuk subagen melalui `agents.defaults.subagents.model` jika biaya menjadi pertimbangan.

    Dokumentasi: [Subagen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana cara kerja sesi subagen yang terikat ke utas di Discord?">
    Ikat utas Discord ke subagen atau target sesi agar pesan tindak lanjut di sana tetap berada dalam sesi yang terikat tersebut.

    - Buat dengan `sessions_spawn` menggunakan `thread: true` (opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - `/agents` memeriksa status pengikatan.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengendalikan pelepasan fokus otomatis.
    - `/unfocus` melepaskan utas.

    Konfigurasi: `session.threadBindings.enabled` (sakelar global), `session.threadBindings.idleHours` (default `24`, `0` menonaktifkan), `session.threadBindings.maxAgeHours` (default `0` = tanpa batas tegas), dan penggantian per saluran `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` membatasi pengikatan otomatis saat pembuatan (default `true`).

    Dokumentasi: [Subagen](/id/tools/subagents), [Discord](/id/channels/discord), [Referensi Konfigurasi](/id/gateway/configuration-reference), [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagen selesai, tetapi pembaruan penyelesaian dikirim ke tempat yang salah atau tidak pernah diposting. Apa yang perlu diperiksa?">
    Periksa rute peminta yang telah ditentukan:

    - Pengiriman subagen mode penyelesaian mengutamakan utas atau rute percakapan terikat jika tersedia.
    - Jika asal penyelesaian hanya membawa saluran, OpenClaw menggunakan rute tersimpan milik sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sebagai alternatif agar pengiriman langsung tetap dapat berhasil.
    - Tidak ada rute terikat dan tidak ada rute tersimpan yang dapat digunakan: pengiriman langsung dapat gagal dan hasilnya beralih ke pengiriman sesi dalam antrean alih-alih langsung diposting.
    - Target yang tidak valid atau kedaluwarsa juga dapat memaksa penggunaan antrean sebagai alternatif atau menyebabkan kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari proses anak sama persis dengan `NO_REPLY` / `no_reply` atau `ANNOUNCE_SKIP`, OpenClaw sengaja tidak mengirim pengumuman agar tidak memposting kemajuan lama sebelumnya.

    Debug: `openclaw tasks show <lookup>` dengan `<lookup>` berupa ID tugas, ID eksekusi, atau kunci sesi.

    Dokumentasi: [Subagen](/id/tools/subagents), [Tugas Latar Belakang](/id/automation/tasks), [Alat Sesi](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang perlu diperiksa?">
    Cron berjalan di dalam proses Gateway; Cron tidak akan terpicu jika Gateway tidak berjalan terus-menerus.

    - Pastikan Cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak ditetapkan.
    - Pastikan Gateway berjalan 24/7 (tanpa tidur/mulai ulang).
    - Verifikasi zona waktu tugas (`--tz` dibandingkan zona waktu host).

    Debug:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomatisasi](/id/automation).

  </Accordion>

  <Accordion title="Cron dipicu, tetapi tidak ada yang dikirim ke saluran. Mengapa?">
    Periksa mode pengiriman:

    - `--no-deliver` / `delivery.mode: "none"`: pengiriman fallback pelaksana tidak diharapkan.
    - Target pengumuman tidak ada atau tidak valid (`channel` / `to`): pelaksana melewati pengiriman keluar.
    - Kegagalan autentikasi saluran (`unauthorized`, `Forbidden`): pelaksana mencoba melakukan pengiriman, tetapi kredensial menghalanginya.
    - Hasil terisolasi yang senyap (hanya `NO_REPLY` / `no_reply`) dianggap sengaja tidak dapat dikirim, sehingga pengiriman fallback yang diantrekan juga diblokir.

    Untuk pekerjaan Cron terisolasi, agen masih dapat mengirim secara langsung dengan alat `message` saat rute obrolan tersedia. `--announce` hanya mengontrol pengiriman fallback pelaksana untuk teks akhir yang belum dikirim sendiri oleh agen.

    Debug:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Tugas Latar Belakang](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa proses Cron terisolasi beralih model atau mencoba ulang sekali?">
    Itu adalah jalur peralihan model langsung, bukan penjadwalan duplikat. Cron terisolasi mempertahankan penyerahan model runtime dan mencoba ulang ketika proses aktif melempar `LiveSessionModelSwitchError`, dengan tetap menggunakan penyedia/model yang telah dialihkan (serta penggantian profil autentikasi yang dialihkan, jika ada) sebelum mencoba ulang.

    Prioritas pemilihan model: penggantian model hook Gmail (`hooks.gmail.model`) terlebih dahulu, lalu `model` per pekerjaan, kemudian penggantian model sesi Cron yang tersimpan, lalu pemilihan model agen/default normal.

    Perulangan percobaan ulang dibatasi pada percobaan awal ditambah 2 percobaan ulang peralihan; setelah itu Cron dibatalkan agar tidak berulang selamanya.

    Debug:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [CLI Cron](/id/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara memasang Skills di Linux?">
    Gunakan perintah `openclaw skills` native atau tempatkan Skills ke ruang kerja Anda; UI Skills macOS tidak tersedia di Linux. Jelajahi Skills di [https://clawhub.ai](https://clawhub.ai).

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

    `openclaw skills install` native secara default menulis ke direktori `skills/` ruang kerja aktif. Tambahkan `--global` untuk memasang ke direktori Skills terkelola bersama bagi semua agen lokal. Pasang CLI `clawhub` terpisah hanya untuk menerbitkan atau menyinkronkan Skills Anda sendiri. Gunakan `agents.defaults.skills` atau `agents.list[].skills` untuk membatasi agen yang dapat melihat Skills bersama.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas sesuai jadwal atau terus-menerus di latar belakang?">
    Ya, melalui penjadwal Gateway:

    - **Pekerjaan Cron** untuk tugas terjadwal atau berulang (tetap ada setelah dimulai ulang).
    - **Heartbeat** untuk pemeriksaan berkala sesi utama.
    - **Pekerjaan terisolasi** untuk agen otonom yang memposting ringkasan atau mengirimkannya ke obrolan.

    Dokumentasi: [Pekerjaan Cron](/id/automation/cron-jobs), [Otomatisasi](/id/automation), [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` beserta biner yang diperlukan, dan hanya dimuat jika memenuhi syarat pada **host Gateway**. Di Linux, Skills khusus `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda mengganti pembatasan tersebut.

    Tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana)**. Jalankan Gateway di tempat biner macOS tersedia, lalu hubungkan dari Linux dalam [mode jarak jauh](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway menggunakan macOS.

    **Opsi B - gunakan node macOS (tanpa SSH)**. Jalankan Gateway di Linux, pasangkan node macOS (aplikasi bilah menu), lalu atur **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw menganggap Skills khusus macOS memenuhi syarat ketika biner yang diperlukan tersedia di node; agen menjalankannya melalui alat `nodes`. Dengan "Always Ask", menyetujui "Always Allow" dalam prompt akan menambahkan perintah tersebut ke daftar yang diizinkan.

    **Opsi C - proksikan biner macOS melalui SSH (lanjutan)**. Pertahankan Gateway di Linux, tetapi buat biner CLI yang diperlukan mengarah ke pembungkus SSH yang berjalan di Mac, lalu ganti pengaturan Skills agar mengizinkan Linux sehingga tetap memenuhi syarat.

    1. Buat pembungkus SSH untuk biner tersebut (contoh: `memo` untuk Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Tempatkan pembungkus di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Ganti metadata Skills (ruang kerja atau `~/.openclaw/skills`) agar mengizinkan Linux:
       ```markdown
       ---
       name: apple-notes
       description: Kelola Apple Notes melalui CLI memo di macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Mulai sesi baru agar snapshot Skills diperbarui.

  </Accordion>

  <Accordion title="Apakah tersedia integrasi Notion atau HeyGen?">
    Saat ini belum tersedia secara bawaan. Pilihan:

    - **Skills / Plugin khusus**: paling sesuai untuk akses API yang andal (keduanya memiliki API).
    - **Otomatisasi peramban**: berfungsi tanpa kode, tetapi lebih lambat dan lebih rentan.

    Untuk konteks per klien bergaya agensi: simpan satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif) dan minta agen mengambil halaman tersebut pada awal sesi.

    Untuk integrasi native, buat permintaan fitur atau bangun Skills berdasarkan API tersebut.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Pemasangan native ditempatkan di direktori `skills/` ruang kerja aktif; gunakan `--global` untuk semua agen lokal, atau konfigurasikan `agents.defaults.skills` / `agents.list[].skills` untuk membatasi visibilitas. Beberapa Skills memerlukan biner yang dipasang melalui Homebrew; di Linux, ini berarti Linuxbrew.

    Lihat [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config), [ClawHub](/id/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome yang sudah masuk dengan OpenClaw?">
    Gunakan profil peramban `user` bawaan, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Untuk nama khusus, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Profil ini dapat menggunakan peramban host lokal atau node peramban yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host node pada mesin peramban, atau gunakan CDP jarak jauh.

    Batasan saat ini pada profil `existing-session` / `user` dibandingkan dengan profil `openclaw` terkelola:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan referensi snapshot, bukan pemilih CSS.
    - Hook unggahan memerlukan `ref` atau `inputRef`, satu file setiap kali, tanpa `element` CSS.
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan jalur peramban terkelola.

    Lihat [Peramban](/id/tools/browser#existing-session-via-chrome-devtools-mcp) untuk perbandingan lengkap.

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah tersedia dokumentasi khusus tentang sandboxing?">
    Ya: [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (Gateway lengkap dalam Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur lengkap?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, sehingga tidak menyertakan paket sistem, Homebrew, dan peramban bawaan. Untuk penyiapan yang lebih lengkap:

    - Pertahankan `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap tersedia.
    - Sertakan dependensi sistem ke dalam image dengan `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Pasang peramban Playwright melalui CLI bawaan: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Atur `PLAYWRIGHT_BROWSERS_PATH` dan pertahankan jalur tersebut.

    Dokumentasi: [Docker](/id/install/docker), [Peramban](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi, tetapi membuat grup menjadi publik/terisolasi dengan satu agen?">
    Ya, jika lalu lintas pribadi berupa **DM** dan lalu lintas publik berupa **grup**. Atur `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/saluran (kunci non-utama) berjalan di backend sandbox yang dikonfigurasi, sementara sesi DM utama tetap berada di host. Docker adalah backend default setelah sandboxing diaktifkan. Batasi alat yang tersedia dalam sesi terisolasi melalui `tools.sandbox.tools`.

    Panduan penyiapan: [Grup: DM pribadi + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent). Referensi utama: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Atur `agents.defaults.sandbox.docker.binds` ke `["host:container:mode"]` (misalnya `"/home/user/src:/src:ro"`). Pengikatan global dan per agen digabungkan; pengikatan per agen diabaikan ketika `scope: "shared"`. Gunakan `:ro` untuk semua hal sensitif; pengikatan melewati batas sistem berkas sandbox.

    OpenClaw memvalidasi sumber pengikatan terhadap jalur yang dinormalisasi dan jalur kanonis yang diselesaikan melalui leluhur terdalam yang tersedia, sehingga pelolosan melalui induk symlink ditolak secara aman meskipun segmen jalur terakhir belum tersedia.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bagaimana cara kerja memori?">
    Memori OpenClaw berupa file Markdown dalam ruang kerja agen: catatan harian di `memory/YYYY-MM-DD.md`, catatan jangka panjang yang dikurasi di `MEMORY.md` (khusus sesi utama/pribadi).

    OpenClaw juga menjalankan **pembuangan memori pra-Compaction** secara senyap sebelum Compaction meringkas percakapan, untuk mengingatkan model agar menulis catatan persisten terlebih dahulu. Proses ini hanya berjalan ketika ruang kerja dapat ditulis (sandbox hanya-baca melewatinya); nonaktifkan dengan `agents.defaults.compaction.memoryFlush.enabled: false`. Lihat [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan berbagai hal. Bagaimana cara membuatnya tetap tersimpan?">
    Minta bot untuk **menulis fakta tersebut ke memori**: catatan jangka panjang disimpan di `MEMORY.md`, sedangkan konteks jangka pendek di `memory/YYYY-MM-DD.md`. Mengingatkan model agar menyimpan memori biasanya mengatasi masalah ini. Jika model tetap lupa, pastikan Gateway menggunakan ruang kerja yang sama pada setiap proses.

    Dokumentasi: [Memori](/id/concepts/memory), [Ruang kerja agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasannya?">
    File memori berada di disk dan bertahan hingga dihapus; batasnya adalah penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks model, sehingga percakapan panjang dapat dipadatkan atau dipotong - karena itulah pencarian memori tersedia, dengan hanya memasukkan kembali bagian yang relevan ke dalam konteks.

    Dokumentasi: [Memori](/id/concepts/memory), [Konteks](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan kunci API OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**, yang merupakan penyedia default. OAuth Codex mencakup obrolan/penyelesaian dan **tidak** memberikan akses embedding, sehingga masuk dengan Codex (OAuth atau login CLI Codex) tidak mengaktifkan pencarian memori semantik. Embedding OpenAI tetap memerlukan kunci API asli (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Agar tetap lokal, atur `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Penyedia lain yang didukung: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` atau `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, kompatibel dengan OpenAI, dan Voyage. Lihat [Memori](/id/concepts/memory) dan [Pencarian memori](/id/concepts/memory-search) untuk detail penyiapan.

  </Accordion>
</AccordionGroup>

## Lokasi berbagai hal di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak: **status milik OpenClaw sendiri bersifat lokal**, tetapi **layanan eksternal tetap dapat melihat apa yang Anda kirimkan kepada mereka**.

    - **Lokal secara default**: sesi, file memori, konfigurasi, dan ruang kerja berada di host Gateway (`~/.openclaw` ditambah direktori ruang kerja Anda).
    - **Jarak jauh karena diperlukan**: pesan yang dikirim ke penyedia model (Anthropic/OpenAI/dll.) diteruskan ke API mereka, dan platform obrolan (Slack/Telegram/WhatsApp/dll.) menyimpan data pesan di server mereka.
    - **Anda mengendalikan jejak data**: model lokal menyimpan prompt di mesin Anda, tetapi lalu lintas kanal tetap melewati server kanal tersebut.

    Terkait: [Ruang kerja agen](/id/concepts/agent-workspace), [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Jalur                                                              | Tujuan                                                             |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Konfigurasi utama (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Impor OAuth lama (disalin ke profil autentikasi saat pertama kali digunakan) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Profil autentikasi (OAuth, kunci API, `keyRef`/`tokenRef` opsional) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Payload rahasia opsional berbasis file untuk penyedia SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | File kompatibilitas lama (entri `api_key` statis dibersihkan) |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Status penyedia (misalnya `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Status per agen (agentDir + artefak sesi lama/arsip)                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Status SQLite per agen, termasuk baris sesi dan transkrip           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Sumber migrasi sesi lama serta artefak arsip/dukungan                |

    Jalur agen tunggal lama `~/.openclaw/agent/*` dimigrasikan oleh `openclaw doctor`.

    **Ruang kerja** Anda (AGENTS.md, file memori, skills, dll.) terpisah, dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana seharusnya AGENTS.md / SOUL.md / USER.md / MEMORY.md berada?">
    File-file ini berada di **ruang kerja agen**, bukan `~/.openclaw`.

    - **Ruang kerja (per agen)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opsional. Root dengan huruf kecil `memory.md` hanya merupakan masukan perbaikan lama; `openclaw doctor --fix` dapat menggabungkannya ke dalam `MEMORY.md` jika keduanya ada.
    - **Direktori status (`~/.openclaw`)**: konfigurasi, status kanal/penyedia, profil autentikasi, sesi, log, skills bersama (`~/.openclaw/skills`).

    Ruang kerja default adalah `~/.openclaw/workspace`, dan dapat dikonfigurasi:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah dimulai ulang, pastikan Gateway menggunakan ruang kerja yang sama pada setiap peluncuran (mode jarak jauh menggunakan ruang kerja milik **host gateway**, bukan laptop lokal Anda).

    Kiat: untuk perilaku atau preferensi yang bertahan lama, minta bot untuk **menuliskannya ke AGENTS.md atau MEMORY.md**, alih-alih mengandalkan riwayat obrolan.

    Lihat [Ruang kerja agen](/id/concepts/agent-workspace) dan [Memori](/id/concepts/memory).

  </Accordion>

  <Accordion title="Dapatkah saya memperbesar SOUL.md?">
    Ya. `SOUL.md` adalah salah satu file bootstrap ruang kerja yang dimasukkan ke dalam konteks agen. Batas injeksi default per file adalah `20000` karakter; total anggaran bootstrap untuk seluruh file adalah `60000` karakter.

    Ubah default bersama:

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

    Atau timpa satu agen di bawah `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Gunakan `/context` untuk memeriksa ukuran mentah dibandingkan ukuran yang diinjeksikan dan apakah terjadi pemotongan. Pastikan `SOUL.md` berfokus pada suara, sikap, dan kepribadian; tempatkan aturan operasional di `AGENTS.md` dan fakta yang bertahan lama di memori.

    Lihat [Konteks](/id/concepts/context) dan [Konfigurasi agen](/id/gateway/config-agents).

  </Accordion>

  <Accordion title="Strategi pencadangan yang disarankan">
    Tempatkan **ruang kerja agen** Anda dalam repo git **privat** dan cadangkan ke tempat privat (misalnya GitHub private). Ini mencakup memori beserta file AGENTS/SOUL/USER dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    **Jangan** commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, payload rahasia terenkripsi). Untuk pemulihan penuh, cadangkan ruang kerja dan direktori status secara terpisah.

    Dokumentasi: [Ruang kerja agen](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus instalasi OpenClaw sepenuhnya?">
    Lihat [Hapus instalasi](/id/install/uninstall).
  </Accordion>

  <Accordion title="Dapatkah agen bekerja di luar ruang kerja?">
    Ya. Ruang kerja adalah **cwd default** dan jangkar memori, bukan sandbox yang ketat. Jalur relatif diselesaikan di dalam ruang kerja; jalur absolut dapat mengakses lokasi host lain kecuali sandbox diaktifkan. Untuk isolasi, gunakan [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per agen. Untuk menjadikan suatu repo sebagai direktori kerja default, arahkan `workspace` agen tersebut ke root repo - repo OpenClaw sendiri hanyalah kode sumber, jadi pisahkan ruang kerja kecuali Anda memang ingin agen bekerja di dalamnya.

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
    Status sesi dimiliki oleh **host gateway**. Dalam mode jarak jauh, penyimpanan sesi yang relevan bagi Anda berada di mesin jarak jauh, bukan laptop lokal Anda. Lihat [Pengelolaan sesi](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar konfigurasi

<AccordionGroup>
  <Accordion title="Apa format konfigurasinya? Di mana lokasinya?">
    OpenClaw membaca konfigurasi **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`). Jika file tersebut tidak ada, OpenClaw menggunakan default yang relatif aman, termasuk ruang kerja default `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='Saya mengatur gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang mendengarkan / UI mengatakan tidak diotorisasi'>
    Bind non-loopback **memerlukan jalur autentikasi gateway yang valid**: autentikasi rahasia bersama (token atau kata sandi), atau `gateway.auth.mode: "trusted-proxy"` di belakang proksi terbalik berbasis identitas yang dikonfigurasi dengan benar.

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

    - `gateway.remote.token` / `.password` **tidak** mengaktifkan autentikasi gateway lokal dengan sendirinya; jalur panggilan lokal hanya dapat menggunakan `gateway.remote.*` sebagai fallback ketika `gateway.auth.*` tidak ditetapkan.
    - Untuk autentikasi kata sandi, tetapkan `gateway.auth.mode: "password"` beserta `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika `gateway.auth.token` / `.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat diselesaikan, resolusi gagal secara tertutup (tanpa fallback jarak jauh yang menyamarkannya).
    - Penyiapan Control UI dengan rahasia bersama melakukan autentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan dalam pengaturan aplikasi/UI). Mode yang membawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan - hindari menempatkan rahasia bersama dalam URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, proksi terbalik loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit dan entri loopback di `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Mengapa sekarang saya memerlukan token di localhost?">
    OpenClaw memberlakukan autentikasi gateway secara default, termasuk untuk loopback. Jika tidak ada jalur autentikasi eksplisit yang dikonfigurasi, saat dimulai sistem menggunakan mode token dan menghasilkan token khusus runtime untuk proses mulai tersebut, sehingga klien WS lokal harus melakukan autentikasi. Ini mencegah proses lokal lain memanggil Gateway.

    Konfigurasikan `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, atau `OPENCLAW_GATEWAY_PASSWORD` secara eksplisit ketika klien memerlukan rahasia yang stabil setelah dimulai ulang. Anda juga dapat memilih mode kata sandi, atau `trusted-proxy` untuk proksi terbalik berbasis identitas. Untuk loopback terbuka, tetapkan `gateway.auth.mode: "none"` secara eksplisit. `openclaw doctor --generate-gateway-token` menghasilkan token kapan saja.

  </Accordion>

  <Accordion title="Apakah saya harus memulai ulang setelah mengubah konfigurasi?">
    Gateway memantau konfigurasi dan mendukung pemuatan ulang langsung: `gateway.reload.mode: "hybrid"` (default) langsung menerapkan perubahan yang aman dan memulai ulang untuk perubahan kritis. `hot`, `restart`, dan `off` juga didukung. Sebagian besar perubahan `tools.*`, kebijakan `agents.*`, `session.*`, dan `messages.*` langsung diterapkan tanpa tindakan pemuatan ulang sama sekali; perubahan binding/port `gateway.*` memerlukan mulai ulang.
  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan slogan CLI yang lucu?">
    Tetapkan `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: menyembunyikan teks slogan tetapi mempertahankan baris judul/versi banner.
    - `default`: selalu menggunakan `All your chats, one OpenClaw.`.
    - `random`: slogan lucu/musiman yang berganti-ganti (perilaku default).
    - Untuk menghilangkan banner sepenuhnya, tetapkan env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan pencarian web (dan pengambilan web)?">
    `web_fetch` berfungsi tanpa kunci API. `web_search` bergantung pada penyedia yang Anda pilih:

    | Penyedia | Tanpa kunci | Variabel lingkungan |
    | --- | --- | --- |
    | Brave | Tidak | `BRAVE_API_KEY` |
    | DuckDuckGo | Ya (berbasis HTML tidak resmi) | - |
    | Exa | Tidak | `EXA_API_KEY` |
    | Firecrawl | Tidak | `FIRECRAWL_API_KEY` |
    | Gemini | Tidak | `GEMINI_API_KEY` |
    | Grok | Tidak (OAuth xAI atau kunci) | `XAI_API_KEY` |
    | Kimi | Tidak | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |
    | MiniMax Search | Tidak | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY` |
    | Ollama Web Search | Ya (memerlukan `ollama signin`) | - |
    | Perplexity | Tidak | `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY` |
    | SearXNG | Ya (dihosting sendiri) | `SEARXNG_BASE_URL` |
    | Tavily | Tidak | `TAVILY_API_KEY` |

    Grok juga dapat menggunakan kembali OAuth xAI dari autentikasi model (`openclaw onboard --auth-choice xai-oauth`).

    **Disarankan**: `openclaw configure --section web` dan pilih penyedia.

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

    Konfigurasi pencarian web khusus penyedia berada di bawah `plugins.entries.<plugin>.config.webSearch.*`. Jalur penyedia lama `tools.web.search.*` masih dimuat untuk kompatibilitas, tetapi tidak boleh digunakan dalam konfigurasi baru. Konfigurasi fallback pengambilan web Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    - Daftar izin: tambahkan `web_search`/`web_fetch`/`x_search`, atau `group:web` untuk ketiganya.
    - `web_fetch` diaktifkan secara default.
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw secara otomatis mendeteksi penyedia fallback pengambilan pertama yang siap dari kredensial yang tersedia; Plugin Firecrawl resmi menyediakan fallback tersebut.
    - Daemon membaca variabel lingkungan dari `~/.openclaw/.env` (atau lingkungan layanan).

    Dokumentasi: [Alat web](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan mencegahnya?">
    `config.apply` mengganti **seluruh konfigurasi**; objek parsial menghapus semua yang lain.

    OpenClaw saat ini melindungi dari sebagian besar penimpaan yang tidak disengaja:

    - Penulisan konfigurasi milik OpenClaw memvalidasi konfigurasi lengkap setelah perubahan sebelum menulis.
    - Penulisan milik OpenClaw yang tidak valid atau destruktif ditolak dan disimpan sebagai `openclaw.json.rejected.*`.
    - Pengeditan langsung yang merusak proses mulai atau pemuatan ulang langsung membuat Gateway gagal secara tertutup atau melewati pemuatan ulang; tindakan ini tidak menulis ulang `openclaw.json`.
    - `openclaw doctor --fix` menangani perbaikan, dapat memulihkan versi terakhir yang diketahui berfungsi, dan menyimpan berkas yang ditolak sebagai `openclaw.json.clobbered.*`.

    Pemulihan:

    - Periksa `openclaw logs --follow` untuk `Invalid config at`, `Config write rejected:`, atau `config reload skipped (invalid config)`.
    - Periksa `openclaw.json.clobbered.*` atau `openclaw.json.rejected.*` terbaru di sebelah konfigurasi aktif.
    - Jalankan `openclaw config validate` dan `openclaw doctor --fix`.
    - Salin kembali hanya kunci yang dimaksud dengan `openclaw config set` atau `config.patch`.
    - Jika tidak ada versi terakhir yang diketahui berfungsi atau payload yang ditolak: pulihkan dari cadangan, atau jalankan kembali `openclaw doctor` dan konfigurasi ulang saluran/model.
    - Untuk kehilangan yang tidak terduga: laporkan bug dengan konfigurasi terakhir yang diketahui atau cadangan Anda. Agen pengodean lokal sering kali dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Untuk mencegahnya: gunakan `openclaw config set` untuk perubahan kecil, `openclaw configure` untuk pengeditan interaktif, `config.schema.lookup` untuk memeriksa jalur yang tidak dikenal (mengembalikan node skema dangkal beserta ringkasan turunan langsung), dan `config.patch` untuk pengeditan RPC parsial—gunakan `config.apply` hanya untuk penggantian konfigurasi penuh. Alat runtime `gateway` yang ditujukan untuk agen menolak menulis ulang `tools.exec.ask` / `tools.exec.security` bahkan melalui alias lama `tools.bash.*`.

    Dokumentasi: [Konfigurasi](/id/cli/config), [Mengonfigurasi](/id/cli/configure), [Pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan pekerja khusus di berbagai perangkat?">
    Pola umum: **satu Gateway** (misalnya Raspberry Pi) ditambah **node** dan **agen**.

    - **Gateway (pusat)**: menangani saluran (Signal/WhatsApp), perutean, dan sesi.
    - **Node (perangkat)**: Mac/iOS/Android terhubung sebagai periferal dan menyediakan alat lokal (`system.run`, `canvas`, `camera`).
    - **Agen (pekerja)**: otak/ruang kerja terpisah untuk peran khusus (misalnya operasi dibandingkan data pribadi).
    - **Subagen**: memulai pekerjaan latar belakang dari agen utama untuk paralelisme.
    - **TUI**: terhubung ke Gateway dan beralih agen/sesi.

    Dokumentasi: [Node](/id/nodes), [Akses jarak jauh](/id/gateway/remote), [Perutean Multiagen](/id/concepts/multi-agent), [Subagen](/id/tools/subagents), [TUI](/id/web/tui).

  </Accordion>

  <Accordion title="Dapatkah peramban OpenClaw berjalan secara headless?">
    Ya:

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

    Nilai defaultnya adalah `false` (dengan antarmuka). Mode headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs (X/Twitter sering memblokir sesi headless). Mode ini menggunakan mesin Chromium yang sama dan berfungsi untuk sebagian besar otomatisasi; perbedaan utamanya adalah tidak ada jendela peramban yang terlihat (gunakan tangkapan layar untuk visual). Lihat [Peramban](/id/tools/browser).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk mengendalikan peramban?">
    Atur `browser.executablePath` ke biner Brave Anda (atau peramban berbasis Chromium lainnya) dan mulai ulang Gateway. Lihat [Peramban](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway dan node jarak jauh

<AccordionGroup>
  <Accordion title="Bagaimana perintah diteruskan antara Telegram, Gateway, dan node?">
    Pesan Telegram ditangani oleh **Gateway**, yang menjalankan agen dan baru kemudian memanggil node melalui **WebSocket Gateway** ketika alat node diperlukan:

    Telegram -> Gateway -> Agen -> `node.*` -> Node -> Gateway -> Telegram

    Node tidak melihat lalu lintas masuk dari penyedia; node hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agen saya dapat mengakses komputer saya jika Gateway dihosting dari jarak jauh?">
    Pasangkan komputer Anda sebagai **node**. Gateway berjalan di tempat lain, tetapi dapat memanggil alat `node.*` (layar, kamera, sistem) pada mesin lokal Anda melalui WebSocket Gateway.

    1. Jalankan Gateway pada host yang selalu aktif (VPS/server rumah).
    2. Tempatkan host Gateway dan komputer Anda di tailnet yang sama.
    3. Pastikan WS Gateway dapat dijangkau (pengikatan tailnet atau terowongan SSH).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung) agar aplikasi tersebut terdaftar sebagai node.
    5. Setujui node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Jembatan TCP terpisah tidak diperlukan; node terhubung melalui WebSocket Gateway.

    Pengingat keamanan: memasangkan node macOS mengizinkan `system.run` pada mesin tersebut. Pasangkan hanya perangkat yang Anda percayai; tinjau [Keamanan](/id/gateway/security).

    Dokumentasi: [Node](/id/nodes), [Protokol Gateway](/id/gateway/protocol), [Mode jarak jauh macOS](/id/platforms/mac/remote), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale sudah terhubung, tetapi saya tidak mendapat balasan. Apa selanjutnya?">
    Periksa hal-hal mendasar:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Kemudian verifikasi autentikasi dan perutean: jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar; jika Anda terhubung melalui terowongan SSH, pastikan terowongan aktif dan mengarah ke port yang tepat; pastikan daftar izin DM/grup menyertakan akun Anda.

    Dokumentasi: [Tailscale](/id/gateway/tailscale), [Akses jarak jauh](/id/gateway/remote), [Saluran](/id/channels).

  </Accordion>

  <Accordion title="Dapatkah dua instans OpenClaw berkomunikasi satu sama lain (lokal + VPS)?">
    Ya, meskipun tidak ada jembatan antarbot bawaan.

    **Paling sederhana**: gunakan saluran obrolan biasa yang dapat diakses kedua bot (Slack/Telegram/WhatsApp). Minta Bot A mengirim pesan kepada Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Jembatan CLI (generik)**: jalankan skrip yang memanggil Gateway lain dengan `openclaw agent --message ... --deliver`, dengan menargetkan obrolan tempat bot lain mendengarkan. Jika salah satu bot berada di VPS jarak jauh, arahkan CLI Anda ke Gateway jarak jauh tersebut melalui SSH/Tailscale (lihat [Akses jarak jauh](/id/gateway/remote)):

    ```bash
    openclaw agent --message "Halo dari bot lokal" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tambahkan pembatas agar kedua bot tidak berulang tanpa henti (hanya sebutan, daftar izin saluran, atau aturan "jangan membalas pesan bot").

    Dokumentasi: [Akses jarak jauh](/id/gateway/remote), [CLI Agen](/id/cli/agent), [Pengiriman agen](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agen?">
    Tidak. Satu Gateway menghosting beberapa agen, masing-masing dengan ruang kerja, default model, dan peruteannya sendiri—ini adalah konfigurasi normal dan jauh lebih murah/sederhana daripada satu VPS per agen. Gunakan VPS terpisah hanya untuk isolasi ketat (batas keamanan) atau konfigurasi yang sangat berbeda dan tidak ingin Anda bagikan.
  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node pada laptop pribadi saya daripada SSH dari VPS?">
    Ya: node adalah cara utama untuk menjangkau laptop Anda dari Gateway jarak jauh dan menyediakan lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan ringan (VPS kecil atau perangkat sekelas Raspberry Pi sudah memadai; RAM 4 GB lebih dari cukup), sehingga konfigurasi yang umum adalah host yang selalu aktif ditambah laptop Anda sebagai node.

    - **Tidak memerlukan SSH masuk**—node membuat koneksi keluar ke WebSocket Gateway melalui pemasangan perangkat.
    - **Kontrol eksekusi yang lebih aman**—`system.run` dibatasi oleh daftar izin/persetujuan node pada laptop tersebut.
    - **Lebih banyak alat perangkat**—node menyediakan `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi peramban lokal**—tetap jalankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node, atau hubungkan ke Chrome lokal melalui Chrome MCP.

    SSH cocok untuk akses shell sewaktu-waktu; node lebih sederhana untuk alur kerja agen dan otomatisasi perangkat yang berkelanjutan.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Peramban](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan Gateway?">
    Tidak. Hanya **satu Gateway** yang seharusnya berjalan per host, kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa Gateway](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung ke Gateway (node iOS/Android, atau "mode node" macOS di aplikasi bilah menu). Untuk host node headless dan kontrol CLI, lihat [CLI host Node](/id/cli/node).

    Mulai ulang penuh diperlukan untuk `gateway`, `discovery`, dan perubahan permukaan Plugin yang dihosting.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya:

    - `config.schema.lookup`: periksa satu subpohon konfigurasi beserta node skema dangkal, petunjuk UI yang cocok, dan ringkasan turunan langsungnya sebelum menulis.
    - `config.get`: ambil snapshot saat ini beserta hash.
    - `config.patch`: pembaruan parsial yang aman (lebih disukai untuk sebagian besar pengeditan RPC); memuat ulang secara langsung jika memungkinkan, memulai ulang jika diperlukan.
    - `config.apply`: validasi dan ganti seluruh konfigurasi; memuat ulang secara langsung jika memungkinkan, memulai ulang jika diperlukan.
    - Alat runtime `gateway` yang ditujukan bagi agen tetap menolak menulis ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke jalur terlindungi yang sama.

  </Accordion>

  <Accordion title="Konfigurasi minimum yang wajar untuk instalasi pertama">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Menetapkan ruang kerja Anda dan membatasi siapa yang dapat memicu bot.

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Tailscale pada VPS dan terhubung dari Mac saya?">
    1. **Instal + masuk pada VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Instal + masuk pada Mac Anda** menggunakan aplikasi Tailscale, pada tailnet yang sama.
    3. **Aktifkan MagicDNS** di konsol admin Tailscale agar VPS memiliki nama yang stabil.
    4. **Gunakan nama host tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; WS Gateway `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Untuk UI Kontrol tanpa SSH, gunakan Tailscale Serve pada VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini mempertahankan gateway agar terikat ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan node Mac ke Gateway jarak jauh (Tailscale Serve)?">
    Serve mengekspos **UI Kontrol Gateway + WS**; node terhubung melalui endpoint WS Gateway yang sama.

    1. Pastikan VPS dan Mac berada pada tailnet yang sama.
    2. Gunakan aplikasi macOS dalam mode Jarak Jauh (target SSH dapat berupa nama host tailnet) - aplikasi tersebut membuat tunnel ke port Gateway dan terhubung sebagai node.
    3. Setujui node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Protokol Gateway](/id/gateway/protocol), [Penemuan](/id/gateway/discovery), [mode jarak jauh macOS](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Haruskah saya menginstal pada laptop kedua atau cukup menambahkan node?">
    Untuk **alat lokal saja** (layar/kamera/eksekusi) pada laptop kedua, tambahkan sebagai **node** - satu Gateway, tanpa konfigurasi duplikat. Alat node lokal saat ini hanya tersedia di macOS. Instal Gateway kedua hanya untuk **isolasi ketat** atau dua bot yang sepenuhnya terpisah.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes), [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabel lingkungan dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat variabel lingkungan?">
    OpenClaw membaca variabel lingkungan dari proses induk (shell, launchd/systemd, CI, dan sebagainya) dan juga memuat:

    - `.env` dari direktori kerja saat ini.
    - fallback global `.env` dari `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Kedua berkas `.env` tersebut tidak menimpa variabel lingkungan yang sudah ada. Kunci kredensial penyedia dan perutean endpoint merupakan pengecualian untuk `.env` ruang kerja: kunci seperti `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, atau kunci apa pun yang berakhiran `_ENDPOINT` (serta variabel lingkungan autentikasi atau endpoint penyedia bawaan lainnya) diabaikan dari `.env` ruang kerja dan sebaiknya ditempatkan di lingkungan proses, `~/.openclaw/.env`, atau konfigurasi `env`.

    Variabel lingkungan inline dalam konfigurasi hanya diterapkan jika tidak tersedia di lingkungan proses:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Lihat [/environment](/id/help/environment) untuk urutan prioritas dan sumber lengkap.

  </Accordion>

  <Accordion title="Saya memulai Gateway melalui layanan dan variabel lingkungan saya menghilang. Apa yang harus dilakukan?">
    Dua solusi:

    1. Tempatkan kunci yang tidak ada di `~/.openclaw/.env` agar tetap dimuat meskipun layanan tidak mewarisi lingkungan shell Anda.
    2. Aktifkan impor shell (kemudahan opsional):
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
       Ini menjalankan shell masuk Anda dan hanya mengimpor kunci yang diharapkan tetapi belum ada (tidak pernah menimpa). Variabel lingkungan yang setara: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menetapkan COPILOT_GITHUB_TOKEN, tetapi status model menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **impor lingkungan shell** diaktifkan. "Shell env: off" **tidak** berarti variabel lingkungan Anda tidak ada - itu hanya berarti OpenClaw tidak akan memuat shell masuk Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), Gateway tidak akan mewarisi lingkungan shell Anda. Perbaiki dengan menempatkan token di `~/.openclaw/.env`, mengaktifkan `env.shellEnv.enabled: true`, atau menambahkannya ke konfigurasi `env` (hanya diterapkan jika belum ada), lalu mulai ulang gateway dan periksa kembali:

    ```bash
    openclaw models status
    ```

    Token Copilot diselesaikan dengan urutan berikut: `OPENCLAW_GITHUB_TOKEN`, lalu `COPILOT_GITHUB_TOKEN`, lalu `GH_TOKEN`, lalu `GITHUB_TOKEN`.

    Lihat [/concepts/model-providers](/id/concepts/model-providers) dan [/environment](/id/help/environment).

  </Accordion>
</AccordionGroup>

## Sesi dan beberapa percakapan

<AccordionGroup>
  <Accordion title="Bagaimana cara memulai percakapan baru?">
    Kirim `/new` atau `/reset` sebagai pesan tersendiri. Lihat [Pengelolaan sesi](/id/concepts/session).
  </Accordion>

  <Accordion title="Apakah sesi diatur ulang secara otomatis jika saya tidak pernah mengirim /new?">
    Tidak, secara default tidak. Sesi mempertahankan `sessionId` yang sama, dan Compaction membatasi konteks model aktif seiring bertambah panjangnya percakapan. `/new` dan `/reset` tetap tersedia, atau Anda dapat mengaktifkan pengaturan ulang otomatis dengan `mode: "daily"` atau `mode: "idle"`. Mode harian berganti pada `session.reset.atHour` (default `4`, 0-23) di host gateway; mode menganggur menggunakan `session.reset.idleMinutes` sejak interaksi nyata terakhir, bukan peristiwa sistem heartbeat/cron/exec.

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` mendukung `direct` (alias lama `dm`), `group`, dan `thread`. `session.idleMinutes` tingkat atas yang lama masih berfungsi sebagai alias kompatibilitas untuk default mode menganggur jika tidak ada blok `session.reset`/`resetByType` yang ditetapkan. Lihat [Pengelolaan sesi](/id/concepts/session) untuk siklus hidup lengkap.

  </Accordion>

  <Accordion title="Apakah ada cara untuk membuat tim instans OpenClaw (satu CEO dan banyak agen)?">
    Ya, melalui **perutean multiagen** dan **subagen**: satu agen koordinator ditambah beberapa agen pekerja dengan ruang kerja dan model masing-masing.

    Ini paling tepat dipandang sebagai eksperimen yang menyenangkan - penggunaan tokennya tinggi dan sering kali kurang efisien dibandingkan satu bot dengan sesi terpisah. Model umumnya adalah satu bot yang Anda ajak berkomunikasi, dengan sesi berbeda untuk pekerjaan paralel, yang membuat subagen saat diperlukan.

    Dokumentasi: [Perutean multiagen](/id/concepts/multi-agent), [Subagen](/id/tools/subagents), [CLI Agen](/id/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Percakapan panjang, keluaran alat yang besar, atau banyak berkas dapat memicu Compaction atau pemotongan.

    - Minta bot merangkum status saat ini dan menuliskannya ke berkas.
    - Gunakan `/compact` sebelum tugas panjang, `/new` saat berganti topik.
    - Simpan konteks penting di ruang kerja dan minta bot membacanya kembali.
    - Gunakan subagen untuk pekerjaan panjang atau paralel agar percakapan utama tetap lebih ringkas.
    - Pilih model dengan jendela konteks yang lebih besar jika hal ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mengatur ulang OpenClaw sepenuhnya tetapi tetap mempertahankan instalasinya?">
    ```bash
    openclaw reset
    ```

    Pengaturan ulang penuh noninteraktif:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Kemudian jalankan kembali penyiapan:

    ```bash
    openclaw onboard --install-daemon
    ```

    Orientasi juga menawarkan **Atur ulang** jika mendeteksi konfigurasi yang sudah ada; lihat [Orientasi (CLI)](/id/start/wizard). Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), atur ulang setiap direktori status (default `~/.openclaw-<profile>`). Pengaturan ulang khusus pengembangan: `openclaw gateway --dev --reset` menghapus konfigurasi pengembangan, kredensial, sesi, dan ruang kerja.

  </Accordion>

  <Accordion title='Saya mendapatkan galat "context too large" - bagaimana cara mengatur ulang atau melakukan Compaction?'>
    - **Compaction** (mempertahankan percakapan, merangkum giliran lama): `/compact` atau `/compact <instructions>` untuk mengarahkan ringkasan.
    - **Atur ulang** (ID sesi baru untuk kunci percakapan yang sama): `/new` atau `/reset`.

    Jika terus terjadi, sesuaikan **pemangkasan sesi** (`agents.defaults.contextPruning`) untuk memangkas keluaran alat lama, atau gunakan model dengan jendela konteks yang lebih besar.

    Dokumentasi: [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning), [Pengelolaan sesi](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Galat validasi penyedia: model menghasilkan blok `tool_use` tanpa `input` yang diwajibkan. Biasanya berarti riwayat sesi sudah usang atau rusak (sering kali setelah utas panjang atau perubahan alat/skema).

    Solusi: mulai sesi baru dengan `/new` (pesan tersendiri).

  </Accordion>

  <Accordion title="Mengapa saya menerima pesan Heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default, atau **1h** ketika mode autentikasi yang ditentukan adalah autentikasi OAuth/token Anthropic (termasuk penggunaan kembali Claude CLI) dan `heartbeat.every` belum ditetapkan. Sesuaikan atau nonaktifkan:

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

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong, komentar Markdown/HTML, judul ATX, penanda fence, atau stub butir daftar kosong), OpenClaw melewati proses Heartbeat untuk menghemat panggilan API. Jika berkas tidak ada, Heartbeat tetap berjalan dan model menentukan tindakan yang harus dilakukan.

    Penggantian per agen menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan pada **akun Anda sendiri** - jika Anda berada dalam grup tersebut, OpenClaw dapat melihatnya. Secara default, balasan grup diblokir hingga Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

    Untuk membatasi balasan grup hanya bagi Anda:

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
    Cara tercepat: pantau log dan kirim pesan pengujian dalam grup.

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti `1234567890-1234567890@g.us`.

    Jika sudah dikonfigurasi/diizinkan, tampilkan daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Direktori](/id/cli/directory), [Log](/id/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas dalam grup?">
    Dua penyebab umum: pembatasan berdasarkan penyebutan diaktifkan secara default (Anda harus @menyebut bot, atau cocok dengan `mentionPatterns`), atau Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak masuk daftar yang diizinkan.

    Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/utas berbagi konteks dengan DM?">
    Percakapan langsung digabungkan ke sesi utama secara default. Grup/saluran memiliki kunci sesinya sendiri, dan topik Telegram / utas Discord merupakan sesi terpisah. Lihat [Grup](/id/channels/groups) dan [Pesan grup](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak ruang kerja dan agen yang dapat saya buat?">
    Tidak ada batas mutlak—puluhan atau bahkan ratusan tidak masalah, tetapi perhatikan:

    - **Pertumbuhan penggunaan disk**: sesi aktif dan transkrip disimpan dalam basis data SQLite per agen; artefak lama/arsip masih dapat terakumulasi di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token**: lebih banyak agen berarti lebih banyak penggunaan model secara bersamaan.
    - **Beban operasional**: profil autentikasi, ruang kerja, dan perutean saluran per agen.

    Pertahankan satu ruang kerja **aktif** per agen (`agents.defaults.workspace`), pangkas sesi lama dengan `openclaw sessions cleanup` jika penggunaan disk bertambah (jangan mengedit status SQLite aktif secara manual), dan gunakan `openclaw doctor` untuk menemukan ruang kerja yang tidak terpakai dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa bot atau percakapan secara bersamaan (Slack), dan bagaimana cara menyiapkannya?">
    Ya, melalui **Perutean Multi-Agen**: jalankan beberapa agen terisolasi dan rutekan pesan masuk berdasarkan saluran/akun/rekan. Slack didukung sebagai saluran dan dapat diikat ke agen tertentu.

    Akses peramban sangat andal, tetapi bukan berarti "dapat melakukan apa pun yang dapat dilakukan manusia"—mekanisme anti-bot, CAPTCHA, dan MFA masih dapat memblokir otomatisasi. Untuk kontrol paling andal, gunakan Chrome MCP lokal pada hos, atau CDP pada mesin yang benar-benar menjalankan peramban.

    Penyiapan praktik terbaik: hos Gateway yang selalu aktif (VPS/Mac mini), satu agen per peran (pengikatan), saluran Slack yang diikat ke agen tersebut, dan peramban lokal melalui Chrome MCP atau sebuah node bila diperlukan.

    Dokumentasi: [Perutean Multi-Agen](/id/concepts/multi-agent), [Slack](/id/channels/slack), [Peramban](/id/tools/browser), [Node](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model, failover, dan profil autentikasi

Tanya jawab model—default, pemilihan, alias, pengalihan, failover, profil autentikasi—tersedia di [Tanya Jawab Umum Model](/id/help/faq-models).

## Gateway: port, "sudah berjalan", dan mode jarak jauh

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port termultipleks untuk WebSocket + HTTP (UI Kontrol, hook, dll.). Urutan prioritas:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running", tetapi "Connectivity probe: failed"?'>
    "Berjalan" adalah tampilan dari **supervisor** (launchd/systemd/schtasks); probe konektivitas adalah CLI yang benar-benar terhubung ke WebSocket gateway. Percayai baris-baris berikut dari `openclaw gateway status`: `Probe target:` (URL yang digunakan probe), `Listening:` (apa yang sebenarnya terikat pada port), `Last gateway error:` (akar penyebab umum ketika proses hidup tetapi port tidak mendengarkan).
  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" yang berbeda?'>
    Anda mengedit satu berkas konfigurasi sementara layanan menjalankan berkas lain (sering kali akibat ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Untuk memperbaikinya, jalankan dari `--profile` / lingkungan yang sama dengan yang ingin Anda gunakan untuk layanan:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw memberlakukan kunci runtime dengan langsung mengikat listener WebSocket saat dimulai (default `ws://127.0.0.1:18789`). Jika pengikatan gagal dengan `EADDRINUSE`, OpenClaw memunculkan `GatewayLockError` ("instans gateway lain sudah mendengarkan").

    Perbaikan: hentikan instans lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode jarak jauh (klien terhubung ke Gateway di tempat lain)?">
    Atur `gateway.mode: "remote"` dan arahkan ke URL WebSocket jarak jauh, secara opsional dengan kredensial jarak jauh berupa rahasia bersama:

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

    - `openclaw gateway` hanya dimulai ketika `gateway.mode` adalah `local` (atau Anda meneruskan flag pengesampingan).
    - Aplikasi macOS memantau berkas konfigurasi dan beralih mode secara langsung ketika nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` hanya merupakan kredensial jarak jauh sisi klien; keduanya tidak mengaktifkan autentikasi gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='UI Kontrol mengatakan "tidak diotorisasi" (atau terus menghubungkan ulang). Apa yang harus dilakukan?'>
    Jalur autentikasi gateway dan metode autentikasi UI tidak cocok.

    Fakta (dari kode):

    - UI Kontrol menyimpan token di `sessionStorage`, dengan cakupan terbatas pada tab peramban saat ini dan URL gateway yang dipilih, sehingga penyegaran di tab yang sama tetap berfungsi tanpa persistensi token localStorage berjangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu percobaan ulang terbatas dengan token perangkat yang di-cache ketika gateway mengembalikan petunjuk percobaan ulang (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Percobaan ulang dengan token yang di-cache tersebut menggunakan kembali cakupan yang telah disetujui dan disimpan bersama token perangkat; pemanggil `deviceToken` eksplisit / `scopes` eksplisit mempertahankan kumpulan cakupan yang diminta alih-alih mewarisi cakupan yang di-cache.
    - Di luar jalur percobaan ulang tersebut, urutan prioritas autentikasi koneksi adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, kemudian token bootstrap.
    - Bootstrap kode penyiapan bawaan mengembalikan token perangkat node dengan `scopes: []` serta token serah terima operator terbatas untuk orientasi seluler tepercaya. Serah terima operator dapat membaca konfigurasi native saat penyiapan, tetapi tidak memberikan cakupan mutasi pemasangan atau `operator.admin`.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dasbor, lalu mencoba membukanya; menampilkan petunjuk SSH jika tanpa antarmuka grafis).
    - Belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jarak jauh: buat tunnel terlebih dahulu dengan `ssh -N -L 18789:127.0.0.1:18789 user@host`, lalu buka `http://127.0.0.1:18789/`.
    - Mode rahasia bersama: atur `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempelkan rahasia yang sesuai di pengaturan UI Kontrol.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode proksi tepercaya: pastikan Anda terhubung melalui proksi sadar-identitas yang dikonfigurasi. Proksi loopback pada hos yang sama juga memerlukan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Ketidakcocokan tetap ada setelah satu percobaan ulang: rotasi/setujui ulang token perangkat yang dipasangkan:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Rotasi ditolak: sesi perangkat yang dipasangkan hanya dapat merotasi perangkat **miliknya sendiri**, kecuali sesi tersebut juga memiliki `operator.admin`, dan nilai `--scope` eksplisit tidak boleh melampaui cakupan operator pemanggil saat ini.
    - Masih bermasalah: `openclaw status --all` serta [Pemecahan masalah](/id/gateway/troubleshooting). Lihat [Dasbor](/id/web/dashboard) untuk detail autentikasi.

  </Accordion>

  <Accordion title="Saya mengatur gateway.bind ke tailnet, tetapi hanya mendengarkan pada loopback">
    Pengikatan `tailnet` memilih IP Tailscale dari antarmuka jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau antarmukanya tidak aktif), Gateway kembali ke loopback alih-alih mengekspos antarmuka jaringan lain.

    Perbaikan: mulai Tailscale pada hos tersebut dan mulai ulang Gateway, atau beralih secara eksplisit ke `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` bersifat eksplisit; `auto` memprioritaskan loopback. Gunakan `gateway.bind: "tailnet"` untuk membatasi paparan non-loopback ke Tailnet sambil mempertahankan listener `127.0.0.1` pada hos yang sama sebagaimana diwajibkan.

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan beberapa Gateway pada hos yang sama?">
    Biasanya tidak—satu Gateway dapat menjalankan beberapa saluran perpesanan dan agen. Gunakan beberapa Gateway hanya untuk redundansi (misalnya bot penyelamat) atau isolasi ketat, dan isolasikan masing-masing dengan `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace`, serta `gateway.port` yang unik.

    Direkomendasikan: `openclaw --profile <name> ...` per instans (secara otomatis membuat `~/.openclaw-<name>`), `gateway.port` yang unik per konfigurasi profil (atau `--port` untuk eksekusi manual), dan layanan per profil dengan `openclaw --profile <name> gateway install`.

    Profil juga menambahkan sufiks pada nama layanan: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. Unit systemd `openclaw-gateway` tanpa kualifikasi hanya tersedia untuk profil default; nama unit systemd lama sebelum penggantian nama, `clawdbot-gateway`, dimigrasikan secara otomatis.

    Panduan lengkap: [Beberapa gateway](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket** dan mengharapkan pesan pertama berupa bingkai `connect`. Pesan lain apa pun akan menutup koneksi dengan **kode 1008** (pelanggaran kebijakan).

    Penyebab umum: Anda membuka URL **HTTP** di peramban alih-alih menggunakan klien WS, menggunakan port/jalur yang salah, atau proksi/tunnel menghapus header autentikasi maupun mengirim permintaan non-Gateway.

    Perbaikan: gunakan URL WS (`ws://<host>:18789`, atau `wss://...` melalui HTTPS), jangan membuka port WS di tab peramban biasa, dan sertakan token/kata sandi dalam bingkai `connect` ketika autentikasi diaktifkan. Contoh CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detail protokol: [Protokol Gateway](/id/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Pencatatan log dan pengawakutuan

<AccordionGroup>
  <Accordion title="Di mana log berada?">
    Log berkas (terstruktur): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Atur jalur yang stabil melalui `logging.file`; tingkat log berkas melalui `logging.level`; verbositas konsol melalui `--verbose` dan `logging.consoleLevel`.

    Cara tercepat untuk mengikuti log:

    ```bash
    openclaw logs --follow
    ```

    Log layanan/supervisor (ketika gateway berjalan melalui launchd/systemd):

    - stdout launchd macOS: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan `gateway-<profile>.log`; stderr dinonaktifkan).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Lihat [Pemecahan masalah](/id/gateway/troubleshooting) untuk informasi selengkapnya.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/memulai ulang layanan Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan gateway secara manual, `openclaw gateway --force` dapat mengambil alih kembali port. Lihat [Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Saya menutup terminal di Windows—bagaimana cara memulai ulang OpenClaw?">
    Tiga mode penginstalan Windows:

    **1) Penyiapan lokal Windows Hub**: aplikasi native mengelola Gateway WSL lokal milik aplikasi. Buka **OpenClaw Companion** dari menu Start atau baki sistem, lalu gunakan **Gateway Setup** atau tab Connections.

    **2) Gateway WSL2 manual**: Gateway berjalan di dalam Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Jika Anda belum pernah menginstal layanan, mulai layanan di latar depan: `openclaw gateway run`.

    **3) CLI/Gateway Windows native**: berjalan langsung di Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Jika Anda menjalankannya secara manual (tanpa layanan): `openclaw gateway run`.

    Dokumentasi: [Windows](/id/platforms/windows), [Panduan operasional layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Gateway aktif tetapi balasan tidak pernah tiba. Apa yang harus diperiksa?">
    Pemeriksaan kondisi cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum: autentikasi model tidak dimuat pada **host gateway** (periksa `models status`), penyandingan/daftar izin saluran memblokir balasan (periksa konfigurasi dan log saluran), atau WebChat/Dashboard dibuka tanpa token yang tepat. Jika jarak jauh, pastikan koneksi terowongan/Tailscale aktif dan WebSocket Gateway dapat dijangkau.

    Dokumentasi: [Saluran](/id/channels), [Pemecahan masalah](/id/gateway/troubleshooting), [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Terputus dari gateway: tanpa alasan" - apa yang harus dilakukan?'>
    Biasanya berarti UI kehilangan koneksi WebSocket. Periksa: apakah Gateway berjalan (`openclaw gateway status`)? Apakah kondisinya sehat (`openclaw status`)? Apakah UI memiliki token yang tepat (`openclaw dashboard`)? Jika jarak jauh, apakah tautan terowongan/Tailscale aktif?

    Kemudian pantau log:

    ```bash
    openclaw logs --follow
    ```

    Dokumentasi: [Dashboard](/id/web/dashboard), [Akses jarak jauh](/id/gateway/remote), [Pemecahan masalah](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands Telegram gagal. Apa yang harus diperiksa?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Kemudian cocokkan kesalahannya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkasnya hingga batas Telegram dan mencoba kembali dengan lebih sedikit perintah, tetapi beberapa entri menu mungkin masih dihapus. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu tersebut.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau kesalahan jaringan serupa: pada VPS atau di belakang proksi, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway berada di jarak jauh, periksa log pada host Gateway.

    Dokumentasi: [Telegram](/id/channels/telegram), [Pemecahan masalah saluran](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan keluaran. Apa yang harus diperiksa?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat status saat ini. Jika Anda mengharapkan balasan di saluran obrolan, pastikan pengiriman diaktifkan (`/deliver on`).

    Dokumentasi: [TUI](/id/web/tui), [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda menginstal layanan (launchd di macOS, systemd di Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Di latar depan, hentikan dengan Ctrl-C, lalu `openclaw gateway run`.

    Dokumentasi: [Panduan operasional layanan Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Penjelasan sederhana: openclaw gateway restart vs openclaw gateway">
    `openclaw gateway restart` memulai ulang **layanan latar belakang** (launchd/systemd). `openclaw gateway` menjalankan gateway **di latar depan** untuk sesi terminal ini. Gunakan subperintah gateway jika Anda menginstal layanan; gunakan eksekusi latar depan tanpa subperintah untuk penggunaan sekali jalan.
  </Accordion>

  <Accordion title="Cara tercepat mendapatkan detail tambahan saat terjadi kegagalan">
    Mulai Gateway dengan `--verbose` untuk memperoleh lebih banyak detail konsol, lalu periksa berkas log untuk kesalahan autentikasi saluran, perutean model, dan RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agen harus menggunakan bidang media terstruktur seperti `media`, `mediaUrl`, `path`, atau `filePath`. Lihat [Penyiapan asisten OpenClaw](/id/start/openclaw) dan [Pengiriman agen](/id/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Ini dia" --media /path/to/file.png
    ```

    Periksa juga: saluran tujuan mendukung media keluar dan tidak diblokir oleh daftar izin; ukuran berkas berada dalam batas penyedia (gambar diubah ukurannya hingga sisi maksimum 2048px); `tools.fs.workspaceOnly=true` membatasi pengiriman jalur lokal ke ruang kerja, penyimpanan sementara/media, dan berkas yang telah divalidasi sandbox; `tools.fs.workspaceOnly=false` (bawaan) memungkinkan pengiriman media lokal terstruktur menggunakan berkas lokal host yang sudah dapat dibaca agen, untuk media serta jenis dokumen yang aman (gambar, audio, video, PDF, dokumen Office, dan dokumen teks tervalidasi seperti Markdown/MD, TXT, JSON, YAML/YML). Ini bukan pemindai rahasia—`secret.txt` atau `config.json` yang dapat dibaca agen dapat dilampirkan jika ekstensi dan validasi kontennya cocok. Simpan berkas sensitif di luar jalur yang dapat dibaca agen, atau pertahankan `tools.fs.workspaceOnly=true` untuk pengiriman jalur lokal yang lebih ketat.

    Lihat [Gambar](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai masukan tidak tepercaya. Pengaturan bawaan mengurangi risiko:

    - Perilaku bawaan pada saluran yang mendukung DM adalah **penyandingan**: pengirim yang tidak dikenal menerima kode penyandingan dan pesannya tidak diproses. Setujui dengan `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Permintaan tertunda dibatasi hingga **3 per saluran**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak tiba.
    - Membuka DM untuk publik memerlukan persetujuan eksplisit (`dmPolicy: "open"` dan daftar izin `"*"`).

    Jalankan `openclaw doctor` untuk menemukan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah injeksi prompt hanya menjadi masalah bagi bot publik?">
    Tidak. Injeksi prompt berkaitan dengan **konten tidak tepercaya**, bukan hanya siapa yang dapat mengirim DM kepada bot. Jika asisten Anda membaca konten eksternal (pencarian/pengambilan web, halaman peramban, email, dokumen, lampiran, log yang ditempelkan), konten tersebut dapat memuat instruksi yang mencoba mengambil alih model—meskipun Anda adalah satu-satunya pengirim.

    Risiko terbesar muncul ketika alat diaktifkan: model dapat dikelabui agar mengekstraksi konteks atau memanggil alat atas nama Anda. Kurangi cakupan dampaknya:

    - gunakan agen "pembaca" hanya-baca atau tanpa alat untuk merangkum konten tidak tepercaya
    - tetap nonaktifkan `web_search` / `web_fetch` / `browser` untuk agen yang mengaktifkan alat
    - perlakukan teks berkas/dokumen yang didekodekan sebagai tidak tepercaya juga: `input_file` OpenResponses dan ekstraksi lampiran media sama-sama membungkus teks hasil ekstraksi dalam penanda batas konten eksternal eksplisit alih-alih meneruskan teks berkas mentah
    - gunakan sandbox dan daftar izin alat yang ketat

    Detail: [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apakah OpenClaw kurang aman karena menggunakan TypeScript/Node alih-alih Rust/WASM?">
    Bahasa dan runtime memang penting, tetapi bukan risiko utama bagi agen pribadi. Risiko praktisnya adalah eksposur gateway, siapa yang dapat mengirim pesan kepada bot, injeksi prompt, cakupan alat, penanganan kredensial, akses peramban, akses eksekusi, serta kepercayaan terhadap skill/plugin pihak ketiga.

    Rust dan WASM dapat memberikan isolasi yang lebih kuat untuk beberapa kelas kode, tetapi tidak mengatasi injeksi prompt, daftar izin yang buruk, eksposur gateway publik, alat yang terlalu luas, atau profil peramban yang sudah masuk ke akun sensitif. Perlakukan hal berikut sebagai kontrol utama: pertahankan Gateway tetap privat atau terautentikasi, gunakan penyandingan dan daftar izin untuk DM/grup, tolak atau jalankan alat berisiko dalam sandbox untuk masukan tidak tepercaya, instal hanya plugin dan skill tepercaya, serta jalankan `openclaw security audit --deep` setelah perubahan konfigurasi.

    Detail: [Keamanan](/id/gateway/security), [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Saya melihat laporan tentang instans OpenClaw yang terekspos. Apa yang harus diperiksa?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Dasar yang lebih aman: Gateway diikat ke `loopback`, atau hanya diekspos melalui akses privat terautentikasi (tailnet, terowongan SSH, autentikasi token/kata sandi, atau proksi tepercaya yang dikonfigurasi dengan benar); DM dalam mode `pairing` atau `allowlist`; grup masuk daftar izin dan memerlukan penyebutan kecuali setiap anggota tepercaya; alat berisiko tinggi (`exec`, `browser`, `gateway`, `cron`) ditolak atau dibatasi secara ketat untuk agen yang membaca konten tidak tepercaya; sandboxing diaktifkan saat eksekusi alat memerlukan cakupan dampak yang lebih kecil.

    Pengikatan publik tanpa autentikasi, DM/grup terbuka dengan alat, dan kontrol peramban yang terekspos adalah temuan yang harus diperbaiki terlebih dahulu. Detail: [openclaw security audit](/id/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="Apakah skill ClawHub dan plugin pihak ketiga aman untuk diinstal?">
    Perlakukan skill dan plugin pihak ketiga sebagai kode yang Anda pilih untuk dipercaya. Halaman skill ClawHub menampilkan status pemindaian sebelum instalasi, tetapi pemindaian bukan batas keamanan yang lengkap. OpenClaw tidak menjalankan pemblokiran kode berbahaya lokal bawaan selama instalasi atau pembaruan plugin/skill; gunakan `security.installPolicy` yang dikelola operator untuk keputusan izin/blokir lokal.

    Pola yang lebih aman: utamakan pembuat tepercaya dan versi yang dipatok, baca skill/plugin sebelum mengaktifkannya, pertahankan daftar izin plugin/skill tetap sempit, jalankan alur kerja masukan tidak tepercaya dalam sandbox dengan alat minimal, dan hindari memberikan akses luas ke sistem berkas, eksekusi, peramban, atau rahasia kepada kode pihak ketiga.

    Detail: [Skills](/id/tools/skills), [Plugin](/id/tools/plugin), [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Haruskah bot saya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah mengurangi cakupan dampak jika terjadi masalah, serta mempermudah rotasi kredensial atau pencabutan akses tanpa memengaruhi akun pribadi Anda.

    Mulai dari cakupan kecil: berikan akses hanya ke alat dan akun yang benar-benar diperlukan, lalu perluas nanti jika dibutuhkan.

    Dokumentasi: [Keamanan](/id/gateway/security), [Penyandingan](/id/channels/pairing).

  </Accordion>

  <Accordion title="Dapatkah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** menyarankan otonomi penuh atas pesan pribadi Anda. Pola teraman: pertahankan DM dalam **mode penyandingan** atau daftar izin yang ketat, gunakan **nomor atau akun terpisah** jika bot harus mengirim pesan atas nama Anda, dan biarkan bot membuat draf sementara Anda **menyetujui sebelum mengirim**.

    Untuk bereksperimen, lakukan pada akun khusus yang terisolasi. Lihat [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agen hanya digunakan untuk obrolan dan masukannya tepercaya. Tingkatan yang lebih kecil lebih rentan terhadap pengambilalihan instruksi, jadi hindari penggunaannya untuk agen yang mengaktifkan alat atau saat membaca konten tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, batasi alat dengan ketat dan jalankan di dalam sandbox. Lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapatkan kode penyandingan">
    Kode penyandingan dikirim **hanya** saat pengirim yang tidak dikenal mengirim pesan kepada bot dan `dmPolicy: "pairing"` diaktifkan; `/start` saja tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Untuk akses langsung, masukkan id pengirim Anda ke daftar izin atau tetapkan `dmPolicy: "open"` untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah bot akan mengirim pesan kepada kontak saya? Bagaimana cara kerja penyandingan?">
    Tidak. Kebijakan DM WhatsApp bawaan adalah **penyandingan**. Pengirim yang tidak dikenal hanya menerima kode penyandingan; pesan mereka **tidak diproses**. OpenClaw hanya membalas obrolan yang diterimanya atau pengiriman eksplisit yang Anda picu.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard menetapkan **daftar izin/pemilik** Anda agar DM Anda sendiri diizinkan—nomor tersebut tidak digunakan untuk pengiriman otomatis. Untuk nomor WhatsApp pribadi Anda, gunakan nomor tersebut dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal/alat hanya muncul saat **verbose**, **trace**, atau **reasoning** diaktifkan untuk sesi tersebut.

    Perbaiki di chat tempat pesan itu muncul:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih ramai: periksa pengaturan sesi di Control UI dan atur verbose ke **inherit**; pastikan Anda tidak menggunakan profil bot dengan `verboseDefault: "on"` dalam konfigurasi.

    Dokumentasi: [Pemikiran dan verbose](/id/tools/thinking), [Keamanan](/id/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan/membatalkan tugas yang sedang berjalan?">
    Kirim salah satu dari berikut ini **sebagai pesan mandiri** (tanpa garis miring) untuk memicu pembatalan: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Pemicu umum dalam bahasa selain Inggris (Prancis, Jerman, Spanyol, Tionghoa, Jepang, Hindi, Arab, Rusia) juga berfungsi.

    Untuk proses latar belakang yang dimulai oleh alat exec, minta agen menjalankan:

    ```text
    process action:kill sessionId:XXX
    ```

    Sebagian besar perintah garis miring harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`, tetapi beberapa pintasan (seperti `/status`) juga berfungsi sebaris bagi pengirim dalam daftar izin. Lihat [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Pesan lintas konteks ditolak")'>
    OpenClaw memblokir pengiriman pesan **lintas penyedia** secara default. Jika pemanggilan alat terikat ke Telegram, alat tersebut tidak akan mengirim ke Discord kecuali Anda secara eksplisit mengizinkannya—dan perubahan ini langsung berlaku tanpa perlu memulai ulang Gateway:

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

  </Accordion>

  <Accordion title='Mengapa bot terasa seperti "mengabaikan" pesan yang dikirim bertubi-tubi?'>
    Secara default, prompt di tengah proses diarahkan ke proses aktif. Gunakan `/queue` untuk memilih perilaku proses aktif:

    - `steer` (default) - arahkan proses aktif pada batas model berikutnya.
    - `followup` - antrekan pesan dan jalankan satu per satu setelah proses saat ini berakhir.
    - `collect` - antrekan pesan yang kompatibel dan balas sekali setelah proses saat ini berakhir.
    - `interrupt` - batalkan proses saat ini dan mulai dari awal.

    Tambahkan opsi ke mode antrean seperti `debounce:0.5s cap:25 drop:summarize`. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean pengarahan](/id/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan kunci API?'>
    Kredensial dan pemilihan model adalah hal yang terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan kunci API Anthropic dalam profil autentikasi) mengaktifkan autentikasi, tetapi model default sebenarnya adalah model yang Anda konfigurasikan dalam `agents.defaults.model.primary` (misalnya `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` berarti Gateway tidak dapat menemukan kredensial Anthropic dalam `auth-profiles.json` yang diharapkan untuk agen yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih mengalami kendala? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

## Terkait

- [FAQ penggunaan pertama](/id/help/faq-first-run) - instalasi, onboarding, autentikasi, langganan, kegagalan awal
- [FAQ model](/id/help/faq-models) - pemilihan model, failover, profil autentikasi
- [Pemecahan masalah](/id/help/troubleshooting) - triase berdasarkan gejala

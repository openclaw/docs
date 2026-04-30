---
read_when:
    - Instalasi baru, penyiapan awal macet, atau kesalahan saat pertama kali dijalankan
    - Memilih autentikasi dan langganan penyedia
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dasbor, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: penyiapan mulai cepat dan penyiapan pertama kali dijalankan — instalasi, orientasi awal, autentikasi, langganan, kegagalan awal'
title: 'Tanya Jawab: penyiapan saat pertama kali dijalankan'
x-i18n:
    generated_at: "2026-04-30T09:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  Mulai cepat dan tanya jawab penggunaan pertama. Untuk operasi sehari-hari, model, autentikasi, sesi,
  dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan penggunaan pertama

  <AccordionGroup>
  <Accordion title="Saya macet, cara tercepat untuk tidak macet lagi">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya macet" adalah **masalah konfigurasi atau lingkungan lokal** yang
    tidak dapat diperiksa oleh pembantu jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan
    tingkat mesin Anda (PATH, layanan, izin, file autentikasi). Berikan **checkout sumber lengkap** melalui
    pemasangan hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini memasang OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + dokumentasi dan
    menalar tentang versi persis yang Anda jalankan. Anda selalu dapat beralih kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu membuat perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, harap buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulai dengan perintah berikut (bagikan keluaran saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Yang dilakukan perintah tersebut:

    - `openclaw status`: cuplikan cepat kesehatan gateway/agen + konfigurasi dasar.
    - `openclaw models status`: memeriksa autentikasi penyedia + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah konfigurasi/status umum.

    Pemeriksaan CLI berguna lainnya: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](#first-60-seconds-if-something-is-broken).
    Dokumentasi pemasangan: [Pemasangan](/id/install), [Flag installer](/id/install/installer), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan pelewatannya?">
    Alasan umum Heartbeat dilewati:

    - `quiet-hours`: di luar rentang jam aktif yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi scaffold kosong/hanya header
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas Heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah proses Heartbeat nyata
    selesai. Proses yang dilewati tidak menandai tugas sebagai selesai.

    Dokumentasi: [Heartbeat](/id/gateway/heartbeat), [Automasi & Tugas](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk memasang dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari sumber dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, Anda biasanya menjalankan Gateway di port **18789**.

    Dari sumber (kontributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jika Anda belum memiliki pemasangan global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dasbor setelah onboarding?">
    Wizard membuka browser Anda dengan URL dasbor bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu terbuka; jika tidak terbuka, salin/tempel URL yang dicetak di mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dasbor di localhost vs jarak jauh?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta autentikasi shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): pertahankan bind local loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` adalah `true`, header identitas memenuhi autentikasi Control UI/WebSocket (tanpa shared secret yang ditempel, mengasumsikan host gateway tepercaya); HTTP API masih memerlukan autentikasi shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau autentikasi HTTP trusted-proxy.
      Upaya autentikasi Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum pembatas failed-auth mencatatnya, sehingga percobaan ulang buruk kedua sudah dapat menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan autentikasi kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dasbor.
    - **Proxy balik sadar identitas**: pertahankan Gateway di belakang proxy tepercaya, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy. Proxy local loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Autentikasi shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dasbor](/id/web/dashboard) dan [Permukaan web](/id/web) untuk mode bind dan detail autentikasi.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan sebenarnya. Konfigurasi chat hanya mengontrol di mana prompt
    persetujuan muncul dan bagaimana orang dapat menjawabnya.

    Di sebagian besar penyiapan, Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama berfungsi melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan pemberi persetujuan dengan aman, OpenClaw sekarang mengaktifkan otomatis persetujuan native yang mengutamakan DM saat `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama; agen seharusnya hanya menyertakan perintah manual `/approve` jika hasil alat mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya saat prompt juga harus diteruskan ke chat lain atau ruang operasional eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya saat Anda secara eksplisit ingin prompt persetujuan diposting kembali ke ruang/topik asal.
    - Persetujuan Plugin terpisah lagi: secara default menggunakan `/approve` di chat yang sama, forwarding `approvals.plugin` opsional, dan hanya beberapa channel native yang mempertahankan penanganan plugin-approval-native di atasnya.

    Versi singkat: forwarding untuk perutean, konfigurasi klien native untuk UX khusus channel yang lebih kaya.
    Lihat [Persetujuan Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumentasi mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sebagai cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda menginginkan ruang ekstra (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum keras.

    Tip: Pi/VPS kecil dapat menjadi host Gateway, dan Anda dapat memasangkan **node** di laptop/ponsel untuk
    layar/kamera/kanvas lokal atau eksekusi perintah. Lihat [Node](/id/nodes).

  </Accordion>

  <Accordion title="Ada tip untuk pemasangan Raspberry Pi?">
    Versi singkat: ini berfungsi, tetapi bersiaplah untuk beberapa sisi kasar.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **pemasangan hackable (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channel/skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah biner aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumentasi: [Linux](/id/platforms/linux), [Pemasangan](/id/install).

  </Accordion>

  <Accordion title="Macet di wake up my friend / onboarding tidak mau menetas. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis pada hatch pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
    dan token tetap 0, agen tidak pernah berjalan.

    1. Mulai ulang Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Periksa status + autentikasi:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jika masih hang, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway berada jarak jauh, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori status** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "persis sama" (memori, riwayat sesi, autentikasi, dan status channel)
    selama Anda menyalin **kedua** lokasi:

    1. Pasang OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, profil autentikasi, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode jarak jauh, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau autentikasi. Semua itu berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrasi](/id/install/migrating), [Di mana berbagai hal berada di disk](#where-things-live-on-disk),
    [Workspace agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya melihat hal baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi terbaru yang telah dikirim. Entri dikelompokkan berdasarkan **Sorotan**, **Perubahan**, dan
    **Perbaikan** (ditambah bagian dokumentasi/lainnya saat diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (kesalahan SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Harap bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak dapat menjangkau situs tersebut, dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stabil dan beta">
    **Stabil** dan **beta** adalah **dist-tag npm**, bukan baris kode terpisah:

    - `latest` = stabil
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stabil masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Karena itu beta dan stabil dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk perintah instalasi satu baris dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah dist-tag npm `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head bergerak dari `main` (git); saat diterbitkan, ia menggunakan dist-tag npm `dev`.

    Perintah satu baris (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail selengkapnya: [Channel pengembangan](/id/install/development-channels) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Dua opsi:

    1. **Channel dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke branch `main` dan memperbarui dari sumber.

    2. **Instalasi yang dapat diutak-atik (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang dapat diedit, lalu diperbarui melalui git.

    Jika Anda lebih suka clone bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentasi: [Update](/id/cli/update), [Channel pengembangan](/id/install/development-channels),
    [Install](/id/install).

  </Accordion>

  <Accordion title="Biasanya berapa lama instalasi dan onboarding berlangsung?">
    Panduan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer macet](#quick-start-and-first-run-setup)
    dan loop debug cepat di [Saya macet](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapatkan umpan balik lebih banyak?">
    Jalankan ulang installer dengan **output verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalasi beta dengan verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Untuk instalasi yang dapat diutak-atik (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Padanan Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Opsi lainnya: [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah umum di Windows:

    **1) error npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu suffix `\bin` di Windows; pada sebagian besar sistem, itu adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumentasi: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Tionghoa yang kacau - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender bahasa Tionghoa sebagai mojibake
    - Perintah yang sama terlihat baik di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu mulai ulang Gateway dan coba lagi perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih dapat mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi yang dapat diutak-atik (git)** agar Anda memiliki seluruh sumber dan dokumentasi secara lokal, lalu tanyakan
    bot Anda (atau Claude/Codex) _dari folder itu_ agar dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail selengkapnya: [Install](/id/install) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi service: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Installer + update: [Instalasi & update](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyediakan **hub hosting** dengan penyedia umum. Pilih salah satu dan ikuti panduannya:

    - [Hosting VPS](/id/vps) (semua penyedia di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel Anda melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan buat cadangannya.

    Anda dapat memasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud itu untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop Anda sambil menjaga
    Gateway tetap berada di cloud.

    Hub: [Platform](/id/platforms). Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).
    Node: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **bisa, tidak disarankan**. Alur update dapat memulai ulang
    Gateway (yang memutus sesi aktif), mungkin memerlukan git checkout yang bersih, dan
    dapat meminta konfirmasi. Lebih aman: jalankan update dari shell sebagai operator.

    Gunakan CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jika Anda harus mengotomatiskan dari agen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentasi: [Update](/id/cli/update), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Apa sebenarnya yang dilakukan onboarding?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ini memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth penyedia, API key, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **Workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channel** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus Plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit pengguna systemd di Linux/WSL2)
    - **Health check** dan pemilihan **Skills**

    Ini juga memperingatkan jika model yang Anda konfigurasi tidak dikenal atau auth hilang.

  </Accordion>

  <Accordion title="Apakah saya perlu langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model hanya lokal** sehingga data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi penyedia tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **API key Anthropic**: penagihan API Anthropic normal
    - **Auth Claude CLI / langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
      kebijakan baru

    Untuk host gateway jangka panjang, API key Anthropic masih merupakan penyiapan yang lebih
    dapat diprediksi. OAuth OpenAI Codex secara eksplisit didukung untuk tool eksternal
    seperti OpenClaw.

    OpenClaw juga mendukung opsi hosted bergaya langganan lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [Model GLM](/id/providers/glm),
    [Model lokal](/id/gateway/local-models), [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan API key Anthropic sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.
    Untuk beban kerja produksi atau multi-pengguna, auth API key Anthropic masih menjadi
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi hosted
    bergaya langganan lain di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Model
    GLM](/id/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/rate limit Anthropic** Anda habis untuk window saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu sampai window direset atau upgrade paket Anda. Jika Anda
    menggunakan **API key Anthropic**, periksa Anthropic Console
    untuk penggunaan/penagihan dan naikkan limit sesuai kebutuhan.

    Jika pesannya secara spesifik:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi ketika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau jalur
    login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: atur **model cadangan** agar OpenClaw tetap dapat membalas saat penyedia terkena batas laju.
    Lihat [Model](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki penyedia **Amazon Bedrock (Converse)** bawaan. Dengan penanda env AWS yang tersedia, OpenClaw dapat menemukan otomatis katalog Bedrock streaming/teks dan menggabungkannya sebagai penyedia `amazon-bedrock` implisit; jika tidak, Anda dapat mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` secara eksplisit atau menambahkan entri penyedia manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Penyedia model](/id/providers/models). Jika Anda lebih memilih alur kunci terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja autentikasi Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (masuk ChatGPT). Gunakan
    `openai-codex/gpt-5.5` untuk OAuth Codex melalui runner PI default. Gunakan
    `openai/gpt-5.5` untuk akses langsung dengan kunci API OpenAI. GPT-5.5 juga dapat menggunakan
    langganan/OAuth melalui `openai-codex/gpt-5.5` atau run server aplikasi Codex native
    dengan `openai/gpt-5.5` dan `agentRuntime.id: "codex"`.
    Lihat [Penyedia model](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebut openai-codex?">
    `openai-codex` adalah id penyedia dan profil autentikasi untuk OAuth ChatGPT/Codex.
    Ini juga merupakan prefiks model PI eksplisit untuk OAuth Codex:

    - `openai/gpt-5.5` = rute kunci API OpenAI langsung saat ini di PI
    - `openai-codex/gpt-5.5` = rute OAuth Codex di PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = rute server aplikasi Codex native
    - `openai-codex:...` = id profil autentikasi, bukan referensi model

    Jika Anda menginginkan jalur penagihan/batas OpenAI Platform langsung, atur
    `OPENAI_API_KEY`. Jika Anda menginginkan autentikasi langganan ChatGPT/Codex, masuk dengan
    `openclaw models auth login --provider openai-codex` dan gunakan
    referensi model `openai-codex/*` untuk run PI.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex dapat berbeda dari ChatGPT web?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    batas tersebut dapat berbeda dari pengalaman situs web/aplikasi ChatGPT, meskipun
    keduanya terikat ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota penyedia yang saat ini terlihat di
    `openclaw models status`, tetapi tidak membuat atau menormalkan hak ChatGPT web
    menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/batas OpenAI Platform
    langsung, gunakan `openai/*` dengan kunci API.

  </Accordion>

  <Accordion title="Apakah Anda mendukung autentikasi langganan OpenAI (OAuth Codex)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan di alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Penyedia model](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur autentikasi Plugin**, bukan id klien atau rahasia di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Masuk: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah masuk: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, atur `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway

    Ini menyimpan token OAuth dalam profil autentikasi pada host Gateway. Detail: [Penyedia model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cukup untuk obrolan santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan kuat; kartu kecil memotong dan membocorkan. Jika harus, jalankan build model **terbesar** yang dapat Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko injeksi prompt - lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model hosted tetap di wilayah tertentu?">
    Pilih endpoint yang dipatok ke wilayah. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS agar data tetap dalam wilayah. Anda tetap dapat mencantumkan Anthropic/OpenAI bersama opsi ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil menghormati penyedia berwilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumah, atau perangkat kelas Raspberry Pi juga bisa digunakan.

    Anda hanya memerlukan Mac **untuk alat khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac mana pun, dan Gateway dapat berjalan di Linux atau tempat lain. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Node](/id/nodes), [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS tertentu** yang masuk ke Messages. Perangkat itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway dapat berjalan di Linux atau tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac mana pun yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Node](/id/nodes),
    [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - Node menyediakan kemampuan tambahan
    seperti layar/kamera/canvas dan `system.run` pada perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan pada gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Ini bukan nama pengguna bot.

    Penyiapan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri `@username` lama di konfigurasi, `openclaw doctor --fix` dapat mencoba menyelesaikannya.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **routing multi-agen**. Ikat **DM** WhatsApp setiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesinya sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Routing Multi-Agen](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agen "fast chat" dan agen "Opus for coding"?'>
    Ya. Gunakan routing multi-agen: berikan setiap agen model defaultnya sendiri, lalu ikat rute masuk (akun penyedia atau peer tertentu) ke setiap agen. Contoh konfigurasi ada di [Routing Multi-Agen](/id/concepts/multi-agent). Lihat juga [Model](/id/concepts/models) dan [Konfigurasi](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan menyertakan `/home/linuxbrew/.linuxbrew/bin` (atau prefiks brew Anda) agar alat yang diinstal dengan `brew` dapat ditemukan di shell non-login.
    Build terbaru juga menambahkan direktori bin pengguna umum di awal pada layanan systemd Linux (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` saat diatur.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git yang dapat diretas dan instalasi npm">
    - **Instalasi yang dapat diretas (git):** checkout sumber penuh, dapat diedit, paling cocok untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **Instalasi npm:** instalasi CLI global, tanpa repo, paling cocok untuk "langsung jalankan."
      Pembaruan berasal dari dist-tag npm.

    Dokumentasi: [Memulai](/id/start/getting-started), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Gunakan `openclaw update --channel ...` saat OpenClaw sudah terinstal.
    Ini **tidak menghapus data Anda** - ini hanya mengubah instalasi kode OpenClaw.
    State Anda (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) tetap tidak tersentuh.

    Dari npm ke git:

    ```bash
    openclaw update --channel dev
    ```

    Dari git ke npm:

    ```bash
    openclaw update --channel stable
    ```

    Tambahkan `--dry-run` untuk meninjau peralihan mode yang direncanakan terlebih dahulu. Updater menjalankan
    tindak lanjut Doctor, menyegarkan sumber Plugin untuk channel target, dan
    memulai ulang gateway kecuali Anda meneruskan `--no-restart`.

    Installer juga dapat memaksa salah satu mode:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Tips pencadangan: lihat [Strategi pencadangan](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Haruskah saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    friksi paling rendah dan tidak keberatan dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser langsung.
    - **Kekurangan:** sleep/jaringan terputus = diskoneksi, pembaruan/reboot OS mengganggu, harus tetap menyala.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah dijaga tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan tangkapan layar), akses file hanya jarak jauh, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya bekerja dengan baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami putus koneksi Gateway sebelumnya. Lokal sangat baik saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau otomasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan tidur/reboot, izin lebih bersih, lebih mudah dijaga tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya baik untuk pengujian dan penggunaan aktif, tetapi perkirakan jeda saat mesin tidur atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, pertahankan Gateway di host khusus dan pasangkan laptop Anda sebagai **Node** untuk alat layar/kamera/exec lokal. Lihat [Node](/id/nodes).
    Untuk panduan keamanan, baca [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan VPS minimum dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu saluran chat:

    - **Minimum absolut:** 1 vCPU, RAM 1GB, disk ~500MB.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang ekstra (log, media, beberapa saluran). Alat Node dan otomasi browser dapat membutuhkan banyak sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instal Linux paling teruji di sana.

    Dokumentasi: [Linux](/id/platforms/linux), [hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: harus selalu aktif, dapat dijangkau, dan memiliki cukup
    RAM untuk Gateway serta saluran apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, RAM 1GB.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa saluran, otomasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas tooling terbaik. Lihat [Windows](/id/platforms/windows), [hosting VPS](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, Gateway, keamanan, lainnya)
- [Ringkasan instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

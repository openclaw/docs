---
read_when:
    - Instalasi baru, orientasi macet, atau kesalahan saat pertama kali dijalankan
    - Memilih autentikasi dan langganan penyedia
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dashboard, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: penyiapan mulai cepat dan proses pertama kali dijalankan — instal, onboarding, auth, langganan, kegagalan awal'
title: 'FAQ: penyiapan pertama kali'
x-i18n:
    generated_at: "2026-06-27T17:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Tanya jawab mulai cepat dan penggunaan pertama. Untuk operasi sehari-hari, model, autentikasi, sesi,
  dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan penggunaan pertama

  <AccordionGroup>
  <Accordion title="Saya buntu, cara tercepat untuk lanjut lagi">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "Saya buntu" adalah **masalah konfigurasi lokal atau lingkungan**
    yang tidak dapat diperiksa oleh pembantu jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan tingkat mesin
    Anda (PATH, layanan, izin, file autentikasi). Berikan **checkout sumber lengkap** melalui
    instalasi yang dapat diutak-atik (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + dokumen dan
    menalar versi persis yang Anda jalankan. Anda selalu dapat beralih kembali ke stabil nanti
    dengan menjalankan ulang penginstal tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Ini menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug nyata atau perbaikan, harap buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulai dengan perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Yang dilakukan perintah tersebut:

    - `openclaw status`: ringkasan cepat kesehatan gateway/agen + konfigurasi dasar.
    - `openclaw models status`: memeriksa autentikasi penyedia + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah konfigurasi/status umum.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Siklus debug cepat: [60 detik pertama jika ada yang rusak](/id/help/faq#first-60-seconds-if-something-is-broken).
    Dokumen instalasi: [Instal](/id/install), [Flag penginstal](/id/install/installer), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan lewati?">
    Alasan umum Heartbeat dilewati:

    - `quiet-hours`: di luar jendela jam aktif yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong, komentar, header, fence, atau checklist kosong
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas Heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah eksekusi Heartbeat nyata
    selesai. Eksekusi yang dilewati tidak menandai tugas sebagai selesai.

    Dokumen: [Heartbeat](/id/gateway/heartbeat), [Automasi](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk menginstal dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari sumber dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, biasanya Anda menjalankan Gateway pada port **18789**.

    Dari sumber (kontributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dashboard setelah onboarding?">
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautan di ringkasan. Biarkan tab itu terbuka; jika tidak terbuka, salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard pada localhost vs jarak jauh?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta autentikasi shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan pada localhost:**

    - **Tailscale Serve** (direkomendasikan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas memenuhi autentikasi Control UI/WebSocket (tanpa shared secret yang ditempel, dengan asumsi host gateway tepercaya); API HTTP tetap memerlukan autentikasi shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau autentikasi HTTP trusted-proxy.
      Percobaan autentikasi Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum pembatas failed-auth mencatatnya, sehingga percobaan ulang buruk kedua sudah dapat menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan autentikasi kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dashboard.
    - **Reverse proxy sadar identitas**: letakkan Gateway di belakang proxy tepercaya, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy. Proxy loopback host-sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Autentikasi shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/id/web/dashboard) dan [Permukaan web](/id/web) untuk mode bind dan detail autentikasi.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Konfigurasi chat hanya mengontrol tempat
    prompt persetujuan muncul dan cara orang dapat menjawabnya.

    Dalam sebagian besar penyiapan, Anda **tidak** membutuhkan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama berfungsi melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan pemberi persetujuan dengan aman, OpenClaw kini otomatis mengaktifkan persetujuan native yang mengutamakan DM saat `channels.<channel>.execApprovals.enabled` tidak disetel atau bernilai `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama; agen hanya boleh menyertakan perintah `/approve` manual jika hasil alat mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya saat prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya saat Anda secara eksplisit ingin prompt persetujuan diposting kembali ke ruang/topik asal.
    - Persetujuan Plugin terpisah lagi: secara default menggunakan `/approve` di chat yang sama, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang mempertahankan penanganan plugin-approval-native di atasnya.

    Versi singkat: penerusan untuk perutean, konfigurasi klien native untuk UX khusus channel yang lebih kaya.
    Lihat [Persetujuan Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya butuhkan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumen mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sudah cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda menginginkan ruang tambahan (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum wajib.

    Tip: Raspberry Pi/VPS kecil dapat meng-host Gateway, dan Anda dapat memasangkan **node** di laptop/ponsel Anda untuk
    layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Node](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: ini berfungsi, tetapi perkirakan masih ada bagian yang kasar.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **instalasi yang dapat diutak-atik (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah biner yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumen: [Linux](/id/platforms/linux), [Instal](/id/install).

  </Accordion>

  <Accordion title="Terjebak di wake up my friend / onboarding tidak menetas. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis pada penetasan pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
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

    3. Jika masih menggantung, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway berada jauh, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori status** dan **workspace**, lalu jalankan Doctor sekali. Ini
    mempertahankan bot Anda "persis sama" (memori, riwayat sesi, autentikasi, dan status channel)
    selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, profil autentikasi, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode jarak jauh, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau autentikasi. Itu berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Memigrasikan](/id/install/migrating), [Lokasi penyimpanan di disk](/id/help/faq#where-things-live-on-disk),
    [Workspace agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru ada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi terbaru yang sudah dirilis. Entri dikelompokkan berdasarkan **Sorotan**, **Perubahan**, dan
    **Perbaikan** (ditambah bagian dokumen/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (kesalahan SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Harap bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak bisa mengakses situs, dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tags**, bukan jalur kode terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Karena itu beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk perintah instalasi satu baris dan perbedaan antara beta dan dev, lihat akordeon di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah npm dist-tag `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head bergerak dari `main` (git); saat diterbitkan, ia menggunakan npm dist-tag `dev`.

    Perintah satu baris (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Penginstal Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail selengkapnya: [Kanal pengembangan](/id/install/development-channels) dan [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Dua opsi:

    1. **Kanal dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke cabang `main` dan memperbarui dari sumber.

    2. **Instalasi yang bisa dimodifikasi (dari situs penginstal):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang dapat Anda edit, lalu perbarui melalui git.

    Jika Anda lebih suka clone bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentasi: [Perbarui](/id/cli/update), [Kanal pengembangan](/id/install/development-channels),
    [Instal](/id/install).

  </Accordion>

  <Accordion title="Berapa lama instalasi dan onboarding biasanya berlangsung?">
    Panduan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak kanal/model yang Anda konfigurasi

    Jika macet, gunakan [Penginstal macet](#quick-start-and-first-run-setup)
    dan loop debug cepat di [Saya macet](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Penginstal macet? Bagaimana cara mendapatkan umpan balik lebih banyak?">
    Jalankan ulang penginstal dengan **output verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalasi beta dengan verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Untuk instalasi yang bisa dimodifikasi (git):

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

    Opsi lainnya: [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) galat npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang penginstal.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu sufiks `\bin` di Windows; pada sebagian besar sistem nilainya `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Untuk penyiapan desktop, gunakan aplikasi **Windows Hub** native. Untuk penyiapan
    khusus terminal, penginstal PowerShell dan jalur WSL2 Gateway sama-sama didukung.
    Dokumentasi: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Tionghoa yang kacau - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan halaman kode konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender bahasa Tionghoa sebagai mojibake
    - Perintah yang sama terlihat baik-baik saja di profil terminal lain

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

    Jika Anda masih dapat mereproduksi ini pada OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi yang bisa dimodifikasi (git)** agar Anda memiliki seluruh sumber dan dokumentasi secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) _dari folder itu_ agar dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail selengkapnya: [Instal](/id/install) dan [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Penginstal + pembaruan: [Instal & pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk mengakses Gateway.

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
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan cadangkan.

    Anda dapat memasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop Anda sambil tetap menjaga
    Gateway di cloud.

    Hub: [Platform](/id/platforms). Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).
    Node: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tidak disarankan**. Alur pembaruan dapat memulai ulang
    Gateway (yang memutus sesi aktif), mungkin memerlukan git checkout yang bersih, dan
    dapat meminta konfirmasi. Lebih aman: jalankan pembaruan dari shell sebagai operator.

    Gunakan CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jika Anda harus mengotomatiskan dari agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentasi: [Perbarui](/id/cli/update), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Apa yang sebenarnya dilakukan onboarding?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ia memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth penyedia, API key, Anthropic setup-token, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Kanal** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus Plugin kanal bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit pengguna systemd di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **skills**

    Ini juga memperingatkan jika model yang Anda konfigurasi tidak dikenal atau auth hilang.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model khusus lokal** agar data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi penyedia tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **API key Anthropic**: penagihan API Anthropic normal
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini kembali diizinkan, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
      kebijakan baru

    Untuk host gateway jangka panjang, API key Anthropic masih merupakan penyiapan yang lebih
    dapat diprediksi. OAuth OpenAI Codex secara eksplisit didukung untuk
    alat eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi bergaya langganan ter-host lain termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [Z.AI (GLM)](/id/providers/zai),
    [Model lokal](/id/gateway/local-models), [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kembali diizinkan, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan API key Anthropic sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini kembali diizinkan, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Anthropic setup-token masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk workload produksi atau multi-pengguna, auth API key Anthropic masih merupakan
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi ter-host
    bergaya langganan lain di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu hingga jendela direset atau tingkatkan paket Anda. Jika Anda
    menggunakan **API key Anthropic**, periksa Anthropic Console
    untuk penggunaan/penagihan dan naikkan batas sesuai kebutuhan.

    Jika pesannya secara spesifik adalah:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    jendela konteks 1M Anthropic (model Claude 4.x 1M yang mampu GA atau konfigurasi legacy
    `context1m: true`). Itu hanya berfungsi ketika kredensial Anda memenuhi syarat
    untuk penagihan konteks panjang (penagihan API key atau jalur login Claude OpenClaw
    dengan Extra Usage diaktifkan).

    Kiat: tetapkan **model fallback** agar OpenClaw tetap dapat membalas saat provider terkena rate limit.
    Lihat [Model](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider **Amazon Bedrock (Converse)** bawaan. Dengan penanda env AWS tersedia, OpenClaw dapat otomatis menemukan katalog streaming/teks Bedrock dan menggabungkannya sebagai provider `amazon-bedrock` implisit; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Provider model](/id/providers/models). Jika Anda lebih suka alur key terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (masuk ChatGPT). Gunakan
    `openai/gpt-5.5` untuk pengaturan umum: auth langganan ChatGPT/Codex plus
    eksekusi app-server Codex native. Ref GPT Codex legacy adalah
    konfigurasi legacy yang diperbaiki oleh `openclaw doctor --fix`. Akses API-key OpenAI langsung
    tetap tersedia untuk surface OpenAI API non-agent dan untuk model
    agent melalui profil API-key `openai` yang berurutan.
    Lihat [Provider model](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebutkan prefix OpenAI Codex legacy?">
    `openai` adalah provider dan id profil auth untuk API key OpenAI maupun
    OAuth ChatGPT/Codex. Anda mungkin masih melihat prefix OpenAI Codex legacy dalam konfigurasi legacy dan
    peringatan migrasi.
    Konfigurasi lama juga menggunakannya sebagai prefix model:

    - `openai/gpt-5.5` = auth langganan ChatGPT/Codex dengan runtime Codex native untuk giliran agent
    - ref GPT-5.5 Codex legacy = rute model legacy yang diperbaiki oleh `openclaw doctor --fix`
    - `openai/gpt-5.5` plus profil API-key `openai` yang berurutan = auth API-key untuk model agent OpenAI
    - id profil auth Codex legacy = id profil auth legacy yang dimigrasikan oleh `openclaw doctor --fix`

    Jika Anda menginginkan jalur penagihan/limit OpenAI Platform langsung, tetapkan
    `OPENAI_API_KEY`. Jika Anda menginginkan auth langganan ChatGPT/Codex, masuk dengan
    `openclaw models auth login --provider openai`. Pertahankan ref model sebagai
    `openai/gpt-5.5`; ref model Codex legacy adalah konfigurasi legacy yang
    ditulis ulang oleh `openclaw doctor --fix`.

  </Accordion>

  <Accordion title="Mengapa limit OAuth Codex dapat berbeda dari web ChatGPT?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    limit tersebut dapat berbeda dari pengalaman situs web/aplikasi ChatGPT, bahkan ketika
    keduanya terhubung ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi tidak membuat atau menormalisasi hak ChatGPT-web
    menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/limit OpenAI Platform
    langsung, gunakan `openai/*` dengan API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (OAuth Codex)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Provider model](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur auth Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway

    Ini menyimpan token OAuth dalam profil auth pada host Gateway. Detail: [Provider model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal boleh untuk chat santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan kuat; kartu kecil memotong dan membocorkan. Jika terpaksa, jalankan build model **terbesar** yang dapat Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt-injection - lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga traffic model hosted di region tertentu?">
    Pilih endpoint yang dipatok ke region. OpenRouter mengekspos opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap dalam region. Anda tetap dapat mencantumkan Anthropic/OpenAI bersama ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil menghormati provider ber-region yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumah, atau kotak kelas Raspberry Pi juga berfungsi.

    Anda hanya membutuhkan Mac **untuk alat khusus macOS**. Untuk iMessage, gunakan [iMessage](/id/channels/imessage) dengan `imsg` pada Mac mana pun yang masuk ke Messages. Jika Gateway berjalan di Linux atau tempat lain, tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac tersebut. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway pada Mac atau pasangkan node macOS.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes), [Mode remote Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya membutuhkan Mac mini untuk dukungan iMessage?">
    Anda membutuhkan **perangkat macOS tertentu** yang masuk ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [iMessage](/id/channels/imessage)** dengan `imsg`; Gateway dapat berjalan pada Mac tersebut, atau dapat berjalan di tempat lain dengan wrapper SSH `cliPath`.

    Pengaturan umum:

    - Jalankan Gateway di Linux/VPS, dan tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan pengaturan satu mesin yang paling sederhana.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes),
    [Mode remote Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
    kapabilitas tambahan seperti layar/kamera/canvas dan `system.run` pada perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk Gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan pada Gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang masuk ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Itu bukan username bot.

    Pengaturan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri `@username` legacy dalam konfigurasi, `openclaw doctor --fix` dapat mencoba menyelesaikannya.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **routing multi-agent**. Ikat **DM** WhatsApp setiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesi sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Routing Multi-Agent](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "fast chat" dan agent "Opus for coding"?'>
    Ya. Gunakan routing multi-agent: berikan setiap agent model defaultnya sendiri, lalu ikat rute masuk (akun provider atau peer tertentu) ke setiap agent. Contoh konfigurasi ada di [Routing Multi-Agent](/id/concepts/multi-agent). Lihat juga [Model](/id/concepts/models) dan [Konfigurasi](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Pengaturan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan menyertakan `/home/linuxbrew/.linuxbrew/bin` (atau prefix brew Anda) agar alat yang diinstal dengan `brew` dapat ditemukan di shell non-login.
    Build terbaru juga menambahkan direktori bin pengguna umum di awal pada layanan systemd Linux (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` ketika ditetapkan.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git yang dapat diutak-atik dan instalasi npm">
    - **Instalasi hackable (git):** checkout sumber penuh, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **Instalasi npm:** instalasi CLI global, tanpa repo, terbaik untuk "langsung menjalankannya."
      Pembaruan berasal dari dist-tag npm.

    Dokumentasi: [Memulai](/id/start/getting-started), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Gunakan `openclaw update --channel ...` ketika OpenClaw sudah terinstal.
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

    Tambahkan `--dry-run` untuk meninjau perpindahan mode yang direncanakan terlebih dahulu. Updater menjalankan
    tindak lanjut Doctor, menyegarkan sumber Plugin untuk channel target, dan
    memulai ulang Gateway kecuali Anda meneruskan `--no-restart`.

    Installer juga dapat memaksa salah satu mode:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Kiat backup: lihat [Strategi backup](/id/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Haruskah saya menjalankan Gateway di laptop saya atau di VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan tidak masalah dengan mode tidur/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser langsung.
    - **Kekurangan:** mode tidur/gangguan jaringan = terputus, pembaruan/reboot OS mengganggu, harus tetap menyala.

    **VPS / komputasi awan**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah laptop tidur, lebih mudah tetap berjalan.
    - **Kekurangan:** sering berjalan tanpa tampilan (gunakan tangkapan layar), akses file hanya jarak jauh, Anda harus menggunakan SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika sebelumnya Gateway Anda pernah terputus. Lokal sangat baik saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau automasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Raspberry Pi):** selalu aktif, lebih sedikit gangguan tidur/reboot, izin lebih bersih, lebih mudah tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya boleh untuk pengujian dan penggunaan aktif, tetapi bersiaplah untuk jeda saat mesin tidur atau diperbarui.

    Jika Anda menginginkan yang terbaik dari kedua opsi, jalankan Gateway di host khusus dan pasangkan laptop Anda sebagai **Node** untuk alat layar/kamera/exec lokal. Lihat [Node](/id/nodes).
    Untuk panduan keamanan, baca [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu kanal chat:

    - **Minimum absolut:** 1 vCPU, RAM 1GB, disk ~500MB.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang cadangan (log, media, beberapa kanal). Alat Node dan automasi browser bisa membutuhkan banyak sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling baik diuji di sana.

    Dokumentasi: [Linux](/id/platforms/linux), [Hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki cukup
    RAM untuk Gateway serta kanal apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, RAM 1GB.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa kanal, automasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, gunakan **Windows Hub** untuk penyiapan desktop, atau WSL2 saat
    Anda secara khusus menginginkan VM Gateway bergaya Linux dengan kompatibilitas alat
    yang luas. Lihat [Windows](/id/platforms/windows), [Hosting VPS](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, gateway, keamanan, lainnya)
- [Ikhtisar instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

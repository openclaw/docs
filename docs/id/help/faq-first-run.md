---
read_when:
    - Instalasi baru, penyiapan awal macet, atau kesalahan saat pertama kali dijalankan
    - Memilih autentikasi dan langganan penyedia
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dasbor, instalasi macet
sidebarTitle: First-run FAQ
summary: 'Tanya Jawab: mulai cepat dan penyiapan pertama kali dijalankan — instalasi, orientasi awal, autentikasi, langganan, kegagalan awal'
title: 'Tanya Jawab: penyiapan saat pertama kali dijalankan'
x-i18n:
    generated_at: "2026-05-10T19:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  Mulai cepat dan Tanya Jawab penyiapan pertama kali. Untuk operasi sehari-hari, model, autentikasi, sesi,
  dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan pertama kali

  <AccordionGroup>
  <Accordion title="Saya macet, cara tercepat untuk keluar dari masalah">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya macet" adalah **masalah konfigurasi atau lingkungan lokal** yang
    tidak dapat diperiksa oleh pembantu jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan
    tingkat mesin Anda (PATH, layanan, izin, file autentikasi). Berikan **checkout sumber lengkap** kepada alat tersebut melalui
    instalasi yang dapat diutak-atik (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + dokumen dan
    menalar tentang versi persis yang Anda jalankan. Anda selalu dapat beralih kembali ke stabil nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Ini menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, harap ajukan issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulai dengan perintah ini (bagikan output saat meminta bantuan):

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

    Alur debug cepat: [60 detik pertama jika ada sesuatu yang rusak](/id/help/faq#first-60-seconds-if-something-is-broken).
    Dokumen instalasi: [Instal](/id/install), [Flag installer](/id/install/installer), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan lewati?">
    Alasan lewati heartbeat umum:

    - `quiet-hours`: di luar jendela jam aktif yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/hanya header
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah proses heartbeat nyata
    selesai. Proses yang dilewati tidak menandai tugas sebagai selesai.

    Dokumen: [Heartbeat](/id/gateway/heartbeat), [Otomatisasi & Tugas](/id/automation).

  </Accordion>

  <Accordion title="Cara yang disarankan untuk menginstal dan menyiapkan OpenClaw">
    Repo menyarankan menjalankan dari sumber dan menggunakan onboarding:

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

    Jika Anda belum memiliki instalasi global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dasbor setelah onboarding?">
    Wizard membuka browser Anda dengan URL dasbor yang bersih (tanpa token) segera setelah onboarding dan juga mencetak tautan dalam ringkasan. Biarkan tab itu terbuka; jika tidak terbuka, salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dasbor di localhost vs jarak jauh?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta autentikasi shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (disarankan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` adalah `true`, header identitas memenuhi autentikasi Control UI/WebSocket (tanpa shared secret yang ditempel, mengasumsikan host gateway tepercaya); HTTP API tetap memerlukan autentikasi shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau autentikasi HTTP trusted-proxy.
      Upaya autentikasi Serve buruk yang bersamaan dari klien yang sama diserialisasi sebelum pembatas autentikasi gagal mencatatnya, sehingga percobaan ulang buruk kedua sudah dapat menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan autentikasi kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang sesuai di pengaturan dasbor.
    - **Reverse proxy sadar identitas**: pertahankan Gateway di belakang proxy tepercaya, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy. Proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Autentikasi shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dasbor](/id/web/dashboard) dan [Permukaan web](/id/web) untuk mode bind dan detail autentikasi.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Konfigurasi chat hanya mengontrol di mana prompt persetujuan
    muncul dan bagaimana orang dapat menjawabnya.

    Di sebagian besar penyiapan, Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` chat yang sama berfungsi melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan pemberi persetujuan dengan aman, OpenClaw kini otomatis mengaktifkan persetujuan native DM-first saat `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama; agen sebaiknya hanya menyertakan perintah `/approve` manual jika hasil alat mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya saat prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya saat Anda secara eksplisit ingin prompt persetujuan diposting kembali ke ruang/topik asal.
    - Persetujuan Plugin terpisah lagi: persetujuan tersebut menggunakan `/approve` chat yang sama secara default, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap mempertahankan penanganan plugin-approval-native di atasnya.

    Versi singkat: penerusan adalah untuk routing, konfigurasi klien native adalah untuk UX spesifik channel yang lebih kaya.
    Lihat [Persetujuan Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** diperlukan. `pnpm` disarankan. Bun **tidak disarankan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumen mencantumkan **RAM 512MB-1GB**, **1 core**, dan sekitar **500MB**
    disk sebagai cukup untuk penggunaan pribadi, serta mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda menginginkan ruang ekstra (log, media, layanan lain), **2GB disarankan**, tetapi itu
    bukan minimum keras.

    Tip: Pi/VPS kecil dapat meng-host Gateway, dan Anda dapat memasangkan **node** di laptop/ponsel Anda untuk
    layar/kamera/kanvas lokal atau eksekusi perintah. Lihat [Node](/id/nodes).

  </Accordion>

  <Accordion title="Ada tip untuk instalasi Raspberry Pi?">
    Versi singkat: berfungsi, tetapi perkirakan ada sisi yang belum mulus.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **instalasi yang dapat diutak-atik (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah biner yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumen: [Linux](/id/platforms/linux), [Instal](/id/install).

  </Accordion>

  <Accordion title="Macet pada wake up my friend / onboarding tidak akan menetas. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis saat hatch pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
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
    menjaga bot Anda "persis sama" (memori, riwayat sesi, autentikasi, dan status channel)
    selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, profil autentikasi, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode jarak jauh, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau autentikasi. Itu berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrasi](/id/install/migrating), [Di mana berbagai hal berada di disk](/id/help/faq#where-things-live-on-disk),
    [Workspace agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya melihat apa yang baru dalam versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi terbaru yang telah dirilis. Entri dikelompokkan berdasarkan **Sorotan**, **Perubahan**, dan
    **Perbaikan** (ditambah bagian dokumen/lainnya jika diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (kesalahan SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Mohon bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak dapat menjangkau situs, dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stabil dan beta">
    **Stabil** dan **beta** adalah **dist-tag npm**, bukan baris kode terpisah:

    - `latest` = stabil
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stabil masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Itulah sebabnya beta dan stabil dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk perintah instalasi satu baris dan perbedaan antara beta dan dev, lihat akordeon di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah dist-tag npm `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head bergerak dari `main` (git); saat diterbitkan, ini menggunakan dist-tag npm `dev`.

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

  <Accordion title="Bagaimana cara mencoba komponen terbaru?">
    Dua opsi:

    1. **Kanal dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke branch `main` dan memperbarui dari sumber.

    2. **Instalasi yang dapat dimodifikasi (dari situs penginstal):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang dapat Anda edit, lalu diperbarui melalui git.

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

  <Accordion title="Berapa lama instalasi dan orientasi awal biasanya berlangsung?">
    Panduan kasar:

    - **Instalasi:** 2-5 menit
    - **Orientasi awal:** 5-15 menit tergantung berapa banyak kanal/model yang Anda konfigurasikan

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

    Untuk instalasi yang dapat dimodifikasi (git):

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

    **1) error npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang penginstal.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows; pada sebagian besar sistem, ini adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling lancar, gunakan **WSL2** alih-alih Windows native.
    Dokumentasi: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Tionghoa yang kacau - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan halaman kode konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender bahasa Tionghoa sebagai mojibake
    - Perintah yang sama terlihat baik di profil terminal lain

    Solusi sementara cepat di PowerShell:

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
    Gunakan **instalasi yang dapat dimodifikasi (git)** agar Anda memiliki seluruh sumber dan dokumentasi secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) _dari folder itu_ agar dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail selengkapnya: [Instal](/id/install) dan [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan orientasi awal.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Penginstal + pembaruan: [Instal & pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyimpan **hub hosting** dengan provider umum. Pilih satu dan ikuti panduannya:

    - [Hosting VPS](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel Anda melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan cadangkan.

    Anda dapat memasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud itu untuk mengakses
    layar/kamera/kanvas lokal atau menjalankan perintah di laptop Anda sambil menjaga
    Gateway tetap di cloud.

    Hub: [Platform](/id/platforms). Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).
    Node: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tidak disarankan**. Alur pembaruan dapat memulai ulang
    Gateway (yang memutus sesi aktif), mungkin memerlukan git checkout bersih, dan
    dapat meminta konfirmasi. Lebih aman: jalankan pembaruan dari shell sebagai operator.

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

    Dokumentasi: [Perbarui](/id/cli/update), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Apa sebenarnya yang dilakukan orientasi awal?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ini memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth provider, API key, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Kanal** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus plugin kanal bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit pengguna systemd di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Ini juga memperingatkan jika model yang Anda konfigurasikan tidak dikenal atau auth tidak ada.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model khusus lokal** agar data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **API key Anthropic**: billing API Anthropic normal
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
      kebijakan baru

    Untuk host Gateway jangka panjang, API key Anthropic masih merupakan penyiapan yang lebih
    dapat diprediksi. OAuth OpenAI Codex secara eksplisit didukung untuk alat eksternal
    seperti OpenClaw.

    OpenClaw juga mendukung opsi bergaya langganan ter-host lain termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
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

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk beban kerja produksi atau multi-pengguna, auth API key Anthropic masih merupakan
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi ter-host
    bergaya langganan lain di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu hingga jendela direset atau tingkatkan paket Anda. Jika Anda
    menggunakan **API key Anthropic**, periksa Anthropic Console
    untuk penggunaan/billing dan naikkan batas sesuai kebutuhan.

    Jika pesan tersebut secara khusus adalah:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi saat
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan kunci API atau
    jalur login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: atur **model fallback** agar OpenClaw dapat tetap membalas saat penyedia terkena batas laju.
    Lihat [Model](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki penyedia **Amazon Bedrock (Converse)** bawaan. Dengan marker env AWS tersedia, OpenClaw dapat menemukan otomatis katalog streaming/teks Bedrock dan menggabungkannya sebagai penyedia `amazon-bedrock` implisit; jika tidak, Anda dapat mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` secara eksplisit atau menambahkan entri penyedia manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Penyedia model](/id/providers/models). Jika Anda lebih memilih alur kunci terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap menjadi opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (masuk ChatGPT). Gunakan
    `openai/gpt-5.5` untuk pengaturan umum: auth langganan ChatGPT/Codex plus
    eksekusi app-server Codex native. Ref model `openai-codex/gpt-*`
    adalah konfigurasi lama yang diperbaiki oleh `openclaw doctor --fix`. Akses
    kunci API OpenAI langsung tetap tersedia untuk permukaan OpenAI API non-agent dan untuk model
    agent melalui profil kunci API `openai-codex` yang berurutan.
    Lihat [Penyedia model](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebut openai-codex?">
    `openai-codex` adalah id penyedia dan profil auth untuk OAuth ChatGPT/Codex.
    Konfigurasi lama juga menggunakannya sebagai prefiks model:

    - `openai/gpt-5.5` = auth langganan ChatGPT/Codex dengan runtime Codex native untuk giliran agent
    - `openai-codex/gpt-5.5` = rute model lama yang diperbaiki oleh `openclaw doctor --fix`
    - `openai/gpt-5.5` plus profil kunci API `openai-codex` yang berurutan = auth kunci API untuk model agent OpenAI
    - `openai-codex:...` = id profil auth, bukan ref model

    Jika Anda menginginkan jalur penagihan/batas OpenAI Platform langsung, atur
    `OPENAI_API_KEY`. Jika Anda menginginkan auth langganan ChatGPT/Codex, masuk dengan
    `openclaw models auth login --provider openai-codex`. Pertahankan ref model sebagai
    `openai/gpt-5.5`; ref model `openai-codex/*` adalah konfigurasi lama yang
    ditulis ulang oleh `openclaw doctor --fix`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex dapat berbeda dari web ChatGPT?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    batas tersebut dapat berbeda dari pengalaman situs web/aplikasi ChatGPT, meskipun
    keduanya terhubung ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota penyedia yang saat ini terlihat di
    `openclaw models status`, tetapi tidak mengarang atau menormalkan hak ChatGPT-web
    menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/batas OpenAI Platform
    langsung, gunakan `openai/*` dengan kunci API.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (OAuth Codex)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Penyedia model](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur auth plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, atur `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway

    Ini menyimpan token OAuth dalam profil auth pada host gateway. Detail: [Penyedia model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal OK untuk chat santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan yang kuat; kartu kecil memotong dan membocorkan. Jika harus, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko injeksi prompt - lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model hosted tetap di region tertentu?">
    Pilih endpoint yang dipatok ke region. OpenRouter mengekspos opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap dalam region. Anda tetap dapat mencantumkan Anthropic/OpenAI bersama ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil menghormati penyedia regional yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumah, atau perangkat sekelas Raspberry Pi juga bisa.

    Anda hanya membutuhkan Mac **untuk alat khusus macOS**. Untuk iMessage, gunakan [iMessage](/id/channels/imessage) dengan `imsg` pada Mac mana pun yang masuk ke Messages. Jika Gateway berjalan di Linux atau tempat lain, atur `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac tersebut. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes), [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya membutuhkan Mac mini untuk dukungan iMessage?">
    Anda membutuhkan **perangkat macOS apa pun** yang masuk ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [iMessage](/id/channels/imessage)** dengan `imsg`; Gateway dapat berjalan di Mac tersebut, atau dapat berjalan di tempat lain dengan wrapper SSH `cliPath`.

    Pengaturan umum:

    - Jalankan Gateway di Linux/VPS, dan atur `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan pengaturan satu mesin yang paling sederhana.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes),
    [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
    kemampuan tambahan seperti layar/kamera/kanvas dan `system.run` pada perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan pada gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Itu bukan username bot.

    Pengaturan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri lama `@username` dalam konfigurasi, `openclaw doctor --fix` dapat mencoba menyelesaikannya.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Dapatkah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **routing multi-agent**. Ikat **DM** WhatsApp setiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesi mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Routing Multi-Agent](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Dapatkah saya menjalankan agent "chat cepat" dan agent "Opus untuk coding"?'>
    Ya. Gunakan routing multi-agent: beri setiap agent model defaultnya sendiri, lalu ikat rute masuk (akun penyedia atau peer tertentu) ke setiap agent. Contoh konfigurasi ada di [Routing Multi-Agent](/id/concepts/multi-agent). Lihat juga [Model](/id/concepts/models) dan [Konfigurasi](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Pengaturan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan menyertakan `/home/linuxbrew/.linuxbrew/bin` (atau prefiks brew Anda) agar alat yang diinstal dengan `brew` dapat ditemukan dalam shell non-login.
    Build terbaru juga menambahkan direktori bin pengguna umum di awal pada layanan systemd Linux (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` saat diatur.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git yang dapat di-hack dan instalasi npm">
    - **Instalasi yang dapat di-hack (git):** checkout sumber lengkap, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **Instalasi npm:** instalasi CLI global, tanpa repo, terbaik untuk "langsung jalankan."
      Pembaruan berasal dari dist-tag npm.

    Dokumentasi: [Memulai](/id/start/getting-started), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Dapatkah saya beralih antara instalasi npm dan git nanti?">
    Ya. Gunakan `openclaw update --channel ...` saat OpenClaw sudah terinstal.
    Ini **tidak menghapus data Anda** - ini hanya mengubah instalasi kode OpenClaw.
    State (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) Anda tetap tidak tersentuh.

    Dari npm ke git:

    ```bash
    openclaw update --channel dev
    ```

    Dari git ke npm:

    ```bash
    openclaw update --channel stable
    ```

    Tambahkan `--dry-run` untuk melihat pratinjau peralihan mode yang direncanakan terlebih dahulu. Updater menjalankan
    tindak lanjut Doctor, menyegarkan sumber plugin untuk channel target, dan
    memulai ulang gateway kecuali Anda meneruskan `--no-restart`.

    Installer juga dapat memaksa salah satu mode:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Tip pencadangan: lihat [Strategi pencadangan](/id/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Apakah saya sebaiknya menjalankan Gateway di laptop saya atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan tidak masalah dengan tidur/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser aktif.
    - **Kekurangan:** tidur/jaringan terputus = koneksi terputus, pembaruan/reboot OS mengganggu, harus tetap menyala.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah laptop tidur, lebih mudah dijaga tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan tangkapan layar), hanya akses file jarak jauh, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi dengan baik dari VPS. Satu-satunya kompromi nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika sebelumnya Anda mengalami Gateway terputus. Lokal sangat bagus saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau otomatisasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan tidur/reboot, izin lebih bersih, lebih mudah dijaga tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya cocok untuk pengujian dan penggunaan aktif, tetapi perkirakan jeda saat mesin tidur atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, pertahankan Gateway di host khusus dan pasangkan laptop Anda sebagai **Node** untuk alat layar/kamera/exec lokal. Lihat [Node](/id/nodes).
    Untuk panduan keamanan, baca [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan VPS minimum dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu kanal chat:

    - **Minimum absolut:** 1 vCPU, RAM 1GB, disk ~500MB.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang tambahan (log, media, beberapa kanal). Alat Node dan otomatisasi browser dapat membutuhkan banyak sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling teruji di sana.

    Dokumentasi: [Linux](/id/platforms/linux), [hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki cukup
    RAM untuk Gateway serta kanal apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, RAM 1GB.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa kanal, otomatisasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah pengaturan bergaya VM yang paling mudah** dan memiliki kompatibilitas tooling terbaik. Lihat [Windows](/id/platforms/windows), [hosting VPS](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, gateway, keamanan, lainnya)
- [Ikhtisar instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

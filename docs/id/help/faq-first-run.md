---
read_when:
    - Instalasi baru, proses orientasi awal macet, atau kesalahan saat pertama kali dijalankan
    - Memilih autentikasi dan langganan penyedia
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dasbor, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: mulai cepat dan penyiapan pertama kali — instalasi, orientasi awal, autentikasi, langganan, kegagalan awal'
title: 'Tanya Jawab: penyiapan pertama kali'
x-i18n:
    generated_at: "2026-05-12T00:58:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Tanya jawab mulai cepat dan penyiapan pertama kali. Untuk operasi sehari-hari, model, auth, sesi,
  dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan pertama kali

  <AccordionGroup>
  <Accordion title="Saya macet, cara tercepat untuk lanjut lagi">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya macet" adalah **masalah konfigurasi atau lingkungan lokal** yang
    tidak dapat diperiksa oleh pembantu jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki
    penyiapan tingkat mesin Anda (PATH, layanan, izin, file auth). Berikan **checkout sumber lengkap** melalui
    instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + docs dan
    bernalar tentang versi persis yang Anda jalankan. Anda selalu dapat beralih kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, harap ajukan issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulai dengan perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Yang dilakukan perintah-perintah tersebut:

    - `openclaw status`: cuplikan cepat kesehatan gateway/agen + konfigurasi dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah konfigurasi/status umum.

    Pemeriksaan CLI berguna lainnya: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](/id/help/faq#first-60-seconds-if-something-is-broken).
    Docs instalasi: [Instal](/id/install), [Flag installer](/id/install/installer), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus melewati proses. Apa arti alasan skip tersebut?">
    Alasan skip heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/hanya header
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah proses heartbeat nyata
    selesai. Proses yang dilewati tidak menandai tugas sebagai selesai.

    Docs: [Heartbeat](/id/gateway/heartbeat), [Automation](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk menginstal dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari sumber dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, Anda biasanya menjalankan Gateway pada port **18789**.

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
    Wizard membuka browser Anda dengan URL dasbor bersih (tanpa token) segera setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu tetap terbuka; jika tidak terbuka, salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dasbor di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta auth shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` adalah `true`, header identitas memenuhi auth Control UI/WebSocket (tanpa shared secret yang ditempel, mengasumsikan host gateway tepercaya); API HTTP masih memerlukan auth shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau auth HTTP trusted-proxy.
      Percobaan auth Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum pembatas failed-auth mencatatnya, sehingga percobaan ulang buruk kedua sudah dapat menampilkan `retry later`.
    - **Tailnet bind**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan auth kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dasbor.
    - **Proxy balik sadar identitas**: pertahankan Gateway di belakang proxy tepercaya, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy. Proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Auth shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dasbor](/id/web/dashboard) dan [Permukaan web](/id/web) untuk mode bind dan detail auth.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi approval exec untuk approval chat?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt approval ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien approval native untuk approval exec

    Kebijakan exec host tetap menjadi gerbang approval yang sebenarnya. Konfigurasi chat hanya mengontrol di mana prompt approval
    muncul dan bagaimana orang dapat menjawabnya.

    Dalam sebagian besar penyiapan, Anda **tidak** membutuhkan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan pemberi approval dengan aman, OpenClaw sekarang otomatis mengaktifkan approval native DM-first ketika `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`.
    - Ketika kartu/tombol approval native tersedia, UI native tersebut adalah jalur utama; agen hanya boleh menyertakan perintah manual `/approve` jika hasil alat mengatakan approval chat tidak tersedia atau approval manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya ketika prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya ketika Anda secara eksplisit ingin prompt approval diposting kembali ke room/topik asal.
    - Approval Plugin terpisah lagi: menggunakan `/approve` di chat yang sama secara default, forwarding `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap mempertahankan penanganan plugin-approval-native di atasnya.

    Versi singkat: forwarding untuk routing, konfigurasi klien native untuk UX khusus channel yang lebih kaya.
    Lihat [Approval Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya butuhkan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah berjalan di Raspberry Pi?">
    Ya. Gateway ringan - docs mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sebagai cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda ingin ruang ekstra (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum wajib.

    Tip: Pi/VPS kecil dapat menghosting Gateway, dan Anda dapat memasangkan **node** di laptop/ponsel Anda untuk
    layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Node](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: berfungsi, tetapi perkirakan ada sisi yang belum mulus.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **instalasi hackable (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channel/skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah biner yang aneh, biasanya itu masalah **kompatibilitas ARM**.

    Docs: [Linux](/id/platforms/linux), [Instal](/id/install).

  </Accordion>

  <Accordion title="Macet di wake up my friend / onboarding tidak menetas. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan terautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis pada hatch pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
    dan token tetap di 0, agen tidak pernah berjalan.

    1. Mulai ulang Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Periksa status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Jika masih menggantung, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway berada di remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Akses remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Dapatkah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori state** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "persis sama" (memori, riwayat sesi, auth, dan state channel)
    selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, profil auth, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Semuanya berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrasi](/id/install/migrating), [Lokasi hal-hal di disk](/id/help/faq#where-things-live-on-disk),
    [Workspace agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya melihat apa yang baru dalam versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi terbaru yang sudah dirilis. Entri dikelompokkan berdasarkan **Sorotan**, **Perubahan**, dan
    **Perbaikan** (ditambah bagian docs/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (kesalahan SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Harap bantu kami membukanya dengan melapor di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak dapat menjangkau situs tersebut, docs dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tags**, bukan baris kode terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Itulah sebabnya beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk perintah instalasi satu baris dan perbedaan antara beta dan dev, lihat accordion di bawah.

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

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail selengkapnya: [Saluran development](/id/install/development-channels) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Dua opsi:

    1. **Saluran dev (git checkout):**

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

    Docs: [Update](/id/cli/update), [Saluran development](/id/install/development-channels),
    [Install](/id/install).

  </Accordion>

  <Accordion title="Berapa lama instalasi dan onboarding biasanya memakan waktu?">
    Panduan kasar:

    - **Install:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak saluran/model yang Anda konfigurasikan

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
    Dua masalah Windows yang umum:

    **1) Kesalahan npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu sufiks `\bin` di Windows; pada sebagian besar sistem, itu adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan setup Windows yang paling lancar, gunakan **WSL2** alih-alih Windows native.
    Docs: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Mandarin yang kacau - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan halaman kode konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender bahasa Mandarin sebagai mojibake
    - Perintah yang sama terlihat baik di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu restart Gateway dan coba lagi perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih dapat mereproduksi ini pada OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Docs tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi yang dapat diutak-atik (git)** agar Anda memiliki seluruh sumber dan docs secara lokal, lalu tanyakan
    bot Anda (atau Claude/Codex) _dari folder itu_ agar dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail selengkapnya: [Install](/id/install) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Installer + pembaruan: [Install & pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyediakan **hub hosting** dengan penyedia umum. Pilih satu dan ikuti panduannya:

    - [Hosting VPS](/id/vps) (semua penyedia di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan buat cadangannya.

    Anda dapat memasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud itu untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop Anda sambil mempertahankan
    Gateway di cloud.

    Hub: [Platform](/id/platforms). Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).
    Node: [Nodes](/id/nodes), [Nodes CLI](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tidak direkomendasikan**. Alur pembaruan dapat me-restart
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

    Jika Anda harus mengotomatisasi dari agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/id/cli/update), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Apa yang sebenarnya dilakukan onboarding?">
    `openclaw onboard` adalah jalur setup yang direkomendasikan. Dalam **mode lokal**, ini memandu Anda melalui:

    - **Setup model/auth** (OAuth penyedia, API key, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus Plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; systemd user unit di Linux/WSL2)
    - **Health check** dan pemilihan **skills**

    Ini juga memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth hilang.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model khusus lokal** sehingga data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi penyedia tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **API key Anthropic**: billing API Anthropic normal
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan
      kebijakan baru

    Untuk host Gateway jangka panjang, API key Anthropic masih merupakan setup yang lebih
    dapat diprediksi. OAuth OpenAI Codex secara eksplisit didukung untuk alat eksternal
    seperti OpenClaw.

    OpenClaw juga mendukung opsi bergaya langganan hosted lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
    [Model lokal](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    setup sisi server yang paling dapat diprediksi, gunakan API key Anthropic sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk workload produksi atau multi-pengguna, auth API key Anthropic masih merupakan pilihan yang
    lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi hosted bergaya langganan lain
    di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/batas laju Anthropic** Anda habis untuk window saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu hingga window direset atau upgrade paket Anda. Jika Anda
    menggunakan **API key Anthropic**, periksa Anthropic Console
    untuk penggunaan/billing dan naikkan batas sesuai kebutuhan.

    Jika pesannya secara spesifik:
    `Extra usage is required for long context requests`, request sedang mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi saat
    kredensial Anda memenuhi syarat untuk billing konteks panjang (billing API key atau jalur
    login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: tetapkan **model fallback** agar OpenClaw dapat terus membalas saat penyedia terkena pembatasan laju.
    Lihat [Model](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki penyedia **Amazon Bedrock (Converse)** bawaan. Jika penanda env AWS tersedia, OpenClaw dapat menemukan otomatis katalog streaming/teks Bedrock dan menggabungkannya sebagai penyedia `amazon-bedrock` implisit; jika tidak, Anda dapat mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` secara eksplisit atau menambahkan entri penyedia manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Penyedia model](/id/providers/models). Jika Anda lebih memilih alur kunci terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (masuk ChatGPT). Gunakan
    `openai/gpt-5.5` untuk penyiapan umum: auth langganan ChatGPT/Codex plus
    eksekusi server aplikasi Codex native. Referensi model `openai-codex/gpt-*`
    adalah konfigurasi legacy yang diperbaiki oleh `openclaw doctor --fix`. Akses
    kunci API OpenAI langsung tetap tersedia untuk permukaan OpenAI API non-agent dan untuk model
    agent melalui profil kunci API `openai-codex` berurutan.
    Lihat [Penyedia model](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebut openai-codex?">
    `openai-codex` adalah id penyedia dan profil auth untuk OAuth ChatGPT/Codex.
    Konfigurasi lama juga menggunakannya sebagai prefiks model:

    - `openai/gpt-5.5` = auth langganan ChatGPT/Codex dengan runtime Codex native untuk giliran agent
    - `openai-codex/gpt-5.5` = rute model legacy yang diperbaiki oleh `openclaw doctor --fix`
    - `openai/gpt-5.5` plus profil kunci API `openai-codex` berurutan = auth kunci API untuk model agent OpenAI
    - `openai-codex:...` = id profil auth, bukan referensi model

    Jika Anda menginginkan jalur penagihan/batas OpenAI Platform langsung, tetapkan
    `OPENAI_API_KEY`. Jika Anda menginginkan auth langganan ChatGPT/Codex, masuk dengan
    `openclaw models auth login --provider openai-codex`. Pertahankan referensi model sebagai
    `openai/gpt-5.5`; referensi model `openai-codex/*` adalah konfigurasi legacy yang
    ditulis ulang oleh `openclaw doctor --fix`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex bisa berbeda dari web ChatGPT?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    batas tersebut dapat berbeda dari pengalaman situs web/aplikasi ChatGPT, meskipun
    keduanya terikat ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota penyedia yang saat ini terlihat di
    `openclaw models status`, tetapi OpenClaw tidak menciptakan atau menormalkan hak
    ChatGPT-web menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/batas
    OpenAI Platform langsung, gunakan `openai/*` dengan kunci API.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (OAuth Codex)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Penyedia model](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur auth Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Masuk: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah masuk: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway

    Ini menyimpan token OAuth dalam profil auth pada host Gateway. Detail: [Penyedia model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal OK untuk obrolan santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keselamatan yang kuat; kartu kecil memotong dan membocorkan. Jika harus, jalankan build model **terbesar** yang dapat Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko injeksi prompt - lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model hosted tetap di wilayah tertentu?">
    Pilih endpoint yang dipatok ke wilayah. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS agar data tetap berada dalam wilayah. Anda tetap dapat mencantumkan Anthropic/OpenAI bersama ini dengan menggunakan `models.mode: "merge"` sehingga fallback tetap tersedia sambil menghormati penyedia berwilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumah, atau perangkat sekelas Raspberry Pi juga bisa.

    Anda hanya membutuhkan Mac **untuk alat khusus macOS**. Untuk iMessage, gunakan [iMessage](/id/channels/imessage) dengan `imsg` pada Mac apa pun yang masuk ke Messages. Jika Gateway berjalan di Linux atau tempat lain, tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac tersebut. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes), [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya membutuhkan Mac mini untuk dukungan iMessage?">
    Anda membutuhkan **perangkat macOS tertentu** yang masuk ke Messages. Perangkat itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [iMessage](/id/channels/imessage)** dengan `imsg`; Gateway dapat berjalan di Mac tersebut, atau dapat berjalan di tempat lain dengan wrapper SSH `cliPath`.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes),
    [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - Node menyediakan
    kapabilitas tambahan seperti layar/kamera/kanvas dan `system.run` pada perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk Gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan di Gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Ini bukan nama pengguna bot.

    Penyiapan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri legacy `@username` dalam konfigurasi, `openclaw doctor --fix` dapat mencoba menyelesaikannya.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **routing multi-agent**. Ikat **DM** WhatsApp masing-masing pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesi sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Routing Multi-Agent](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "obrolan cepat" dan agent "Opus untuk coding"?'>
    Ya. Gunakan routing multi-agent: beri setiap agent model default sendiri, lalu ikat rute masuk (akun penyedia atau peer tertentu) ke masing-masing agent. Contoh konfigurasi ada di [Routing Multi-Agent](/id/concepts/multi-agent). Lihat juga [Model](/id/concepts/models) dan [Konfigurasi](/id/gateway/configuration).
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
    Build terbaru juga menambahkan direktori bin pengguna umum di awal layanan systemd Linux (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` saat ditetapkan.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git yang dapat di-hack dan instalasi npm">
    - **Instalasi yang dapat di-hack (git):** checkout sumber lengkap, dapat diedit, paling cocok untuk kontributor.
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

    Tambahkan `--dry-run` untuk meninjau pergantian mode yang direncanakan terlebih dahulu. Updater menjalankan
    tindak lanjut Doctor, menyegarkan sumber Plugin untuk channel target, dan
    memulai ulang Gateway kecuali Anda meneruskan `--no-restart`.

    Installer juga dapat memaksa salah satu mode:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Tips cadangan: lihat [Strategi cadangan](/id/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser live.
    - **Kekurangan:** sleep/jaringan terputus = terputus, pembaruan/reboot OS mengganggu, harus tetap menyala.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah laptop tidur, lebih mudah tetap berjalan.
    - **Kekurangan:** sering berjalan tanpa antarmuka grafis (gunakan tangkapan layar), akses berkas hanya jarak jauh, Anda harus menggunakan SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi dengan baik dari VPS. Satu-satunya kompromi nyata adalah **peramban tanpa antarmuka grafis** vs jendela yang terlihat. Lihat [Peramban](/id/tools/browser).

    **Bawaan yang direkomendasikan:** VPS jika Anda pernah mengalami Gateway terputus sebelumnya. Lokal sangat baik ketika Anda aktif menggunakan Mac dan menginginkan akses berkas lokal atau otomatisasi UI dengan peramban yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan tidur/mulai ulang, izin lebih rapi, lebih mudah tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya baik untuk pengujian dan penggunaan aktif, tetapi akan ada jeda saat mesin tidur atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, pertahankan Gateway di host khusus dan pasangkan laptop Anda sebagai **Node** untuk alat layar/kamera/eksekusi lokal. Lihat [Node](/id/nodes).
    Untuk panduan keamanan, baca [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu kanal obrolan:

    - **Minimum absolut:** 1 vCPU, RAM 1GB, disk ~500MB.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang cadangan (log, media, beberapa kanal). Alat Node dan otomatisasi peramban dapat membutuhkan banyak sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling baik diuji di sana.

    Dokumentasi: [Linux](/id/platforms/linux), [hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki RAM yang cukup
    untuk Gateway serta kanal apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, RAM 1GB.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa kanal, otomatisasi peramban, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    alat terbaik. Lihat [Windows](/id/platforms/windows), [hosting VPS](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, gateway, keamanan, lainnya)
- [Ikhtisar instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

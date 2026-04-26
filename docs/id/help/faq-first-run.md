---
read_when:
    - Instalasi baru, onboarding macet, atau error saat pertama kali dijalankan
    - Memilih autentikasi dan langganan provider
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dashboard, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: mulai cepat dan penyiapan saat pertama kali dijalankan — instalasi, onboarding, autentikasi, langganan, kegagalan awal'
title: 'FAQ: penyiapan saat pertama kali dijalankan'
x-i18n:
    generated_at: "2026-04-26T11:31:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Tanya jawab mulai cepat dan penyiapan saat pertama kali dijalankan. Untuk operasi sehari-hari, model, autentikasi, sesi,
  dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan saat pertama kali dijalankan

  <AccordionGroup>
  <Accordion title="Saya macet, cara tercepat untuk keluar dari kondisi macet">
    Gunakan agen AI lokal yang bisa **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya macet" adalah **masalah konfigurasi atau lingkungan lokal** yang
    tidak dapat diperiksa oleh helper jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Tool ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki
    penyiapan tingkat mesin Anda (PATH, layanan, izin, file autentikasi). Berikan kepada mereka **checkout source lengkap** melalui
    instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini memasang OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + docs dan
    memahami versi tepat yang sedang Anda jalankan. Anda selalu dapat beralih kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikannya (langkah demi langkah), lalu hanya mengeksekusi
    perintah yang diperlukan. Itu menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, mohon buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulailah dengan perintah-perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat kesehatan gateway/agen + konfigurasi dasar.
    - `openclaw models status`: memeriksa autentikasi provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah konfigurasi/status umum.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](#first-60-seconds-if-something-is-broken).
    Docs instalasi: [Install](/id/install), [Installer flags](/id/install/installer), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan skip itu?">
    Alasan skip Heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi scaffolding kosong/hanya header
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: seluruh visibilitas Heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah proses Heartbeat nyata
    selesai. Proses yang dilewati tidak menandai tugas sebagai selesai.

    Docs: [Heartbeat](/id/gateway/heartbeat), [Automation & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk memasang dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari source dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, biasanya Anda menjalankan Gateway di port **18789**.

    Dari source (kontributor/dev):

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
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu tetap terbuka; jika tidak terbuka, salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta autentikasi shared-secret, tempel token atau password yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber password: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, hasilkan token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas memenuhi autentikasi Control UI/WebSocket (tanpa menempel shared secret, dengan asumsi host gateway tepercaya); API HTTP tetap memerlukan autentikasi shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau autentikasi HTTP trusted-proxy.
      Upaya autentikasi Serve serentak yang buruk dari klien yang sama diserialkan sebelum limiter failed-auth mencatatnya, sehingga retry buruk kedua bisa langsung menampilkan `retry later`.
    - **Tailnet bind**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan autentikasi password), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dashboard.
    - **Reverse proxy sadar identitas**: pertahankan Gateway di belakang trusted proxy non-loopback, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Autentikasi shared-secret tetap berlaku melalui tunnel; tempel token atau password yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/id/web/dashboard) dan [Web surfaces](/id/web) untuk detail mode bind dan autentikasi.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengendalikan lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Konfigurasi chat hanya mengontrol ke mana prompt persetujuan
    muncul dan bagaimana orang dapat menjawabnya.

    Dalam kebanyakan penyiapan Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw kini otomatis mengaktifkan persetujuan native DM-first saat `channels.<channel>.execApprovals.enabled` tidak diatur atau bernilai `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama; agen hanya sebaiknya menyertakan perintah `/approve` manual jika hasil tool mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya ketika prompt juga harus diteruskan ke chat lain atau room ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya saat Anda memang ingin prompt persetujuan diposting kembali ke room/topic asal.
    - Persetujuan plugin terpisah lagi: persetujuan ini menggunakan `/approve` di chat yang sama secara default, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap menangani persetujuan plugin-native di atas itu.

    Versi singkat: forwarding adalah untuk perutean, konfigurasi klien native adalah untuk UX khusus channel yang lebih kaya.
    Lihat [Exec Approvals](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah ini berjalan di Raspberry Pi?">
    Ya. Gateway ringan - docs mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sudah cukup untuk penggunaan pribadi, dan menyebut bahwa **Raspberry Pi 4 bisa menjalankannya**.

    Jika Anda ingin ruang tambahan (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum mutlak.

    Tip: Pi/VPS kecil dapat menjadi host Gateway, dan Anda dapat melakukan pairing **Node** di laptop/ponsel Anda untuk
    layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Singkatnya: bisa, tetapi harapkan ada sisi kasar.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih instalasi **hackable (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulailah tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda menemukan masalah binary yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Docs: [Linux](/id/platforms/linux), [Install](/id/install).

  </Accordion>

  <Accordion title="Macet di wake up my friend / onboarding tidak mau hatch. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis saat hatch pertama. Jika Anda melihat baris itu tanpa **balasan**
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

    3. Jika masih macet, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway bersifat remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulangi onboarding?">
    Ya. Salin **direktori status** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "tetap sama persis" (memori, riwayat sesi, autentikasi, dan
    status channel) selama Anda menyalin **kedua** lokasi:

    1. Pasang OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, auth profile, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau autentikasi. Keduanya berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrating](/id/install/migrating), [Lokasi penyimpanan di disk](#where-things-live-on-disk),
    [Agent workspace](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal
    berikutnya adalah versi yang terakhir dikirim. Entri dikelompokkan menurut **Highlights**, **Changes**, dan
    **Fixes** (plus bagian docs/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan fitur itu atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Tolong bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda tetap tidak dapat menjangkau situs tersebut, docs dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tag**, bukan jalur kode yang terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    memublikasikan langsung ke `latest` bila diperlukan. Itulah sebabnya beta dan stable bisa
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara memasang versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah npm dist-tag `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head `main` yang terus bergerak (git); saat dipublikasikan, ia menggunakan npm dist-tag `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail lebih lanjut: [Development channels](/id/install/development-channels) dan [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Dua opsi:

    1. **Channel dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Ini mengalihkan ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang bisa diedit, lalu diperbarui melalui git.

    Jika Anda lebih suka clone bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/id/cli/update), [Development channels](/id/install/development-channels),
    [Install](/id/install).

  </Accordion>

  <Accordion title="Biasanya berapa lama instalasi dan onboarding berlangsung?">
    Perkiraan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer stuck](#quick-start-and-first-run-setup)
    dan loop debug cepat di [Saya macet](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapatkan feedback lebih banyak?">
    Jalankan ulang installer dengan **output verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalasi beta dengan verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Untuk instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Padanan Windows (PowerShell):

    ```powershell
    # install.ps1 belum memiliki flag -Verbose khusus.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Opsi lainnya: [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) error npm spawn git / git tidak ditemukan**

    - Pasang **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows; pada kebanyakan sistem itu adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Docs: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Mandarin yang rusak - apa yang harus saya lakukan?">
    Ini biasanya adalah ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - output `system.run`/`exec` merender teks Mandarin sebagai mojibake
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

  <Accordion title="Docs tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** agar Anda memiliki source dan docs lengkap secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) _dari folder itu_ agar ia dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail lebih lanjut: [Install](/id/install) dan [Installer flags](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara memasang OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Getting Started](/id/start/getting-started).
    - Installer + pembaruan: [Install & updates](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara memasang OpenClaw di VPS?">
    Linux VPS apa pun bisa. Pasang di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami memiliki **pusat hosting** dengan provider umum. Pilih salah satu dan ikuti panduannya:

    - [VPS hosting](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui Control UI (atau Tailscale/SSH). Status + workspace Anda
    berada di server, jadi perlakukan host itu sebagai sumber kebenaran dan lakukan backup.

    Anda dapat melakukan pairing **Node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop Anda sambil mempertahankan
    Gateway di cloud.

    Pusat: [Platforms](/id/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Node: [Nodes](/id/nodes), [Nodes CLI](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tetapi tidak direkomendasikan**. Alur pembaruan dapat merestart
    Gateway (yang akan memutus sesi aktif), mungkin memerlukan checkout git yang bersih, dan
    dapat meminta konfirmasi. Lebih aman: jalankan pembaruan dari shell sebagai operator.

    Gunakan CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Jika Anda harus mengotomatiskannya dari agen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/id/cli/update), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Apa yang sebenarnya dilakukan onboarding?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ia memandu Anda melalui:

    - **Penyiapan model/autentikasi** (OAuth provider, API key, token penyiapan Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit pengguna systemd di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Onboarding juga memperingatkan jika model yang Anda konfigurasi tidak dikenal atau autentikasinya tidak ada.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model lokal saja** agar data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **Anthropic API key**: penagihan API Anthropic normal
    - **Claude CLI / autentikasi langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru

    Untuk host gateway jangka panjang, Anthropic API key tetap merupakan
    penyiapan yang lebih dapat diprediksi. OpenAI Codex OAuth didukung secara eksplisit untuk tool eksternal
    seperti OpenClaw.

    OpenClaw juga mendukung opsi hosted bergaya langganan lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
    [Local models](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan autentikasi langganan Claude dan penggunaan `claude -p` sebagai sesuatu yang disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan Anthropic API key sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung autentikasi langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai sesuatu yang disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Token penyiapan Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk beban kerja produksi atau multi-pengguna, autentikasi Anthropic API key tetap menjadi
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi hosted bergaya langganan lain
    di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu hingga jendela di-reset atau upgrade paket Anda. Jika Anda
    menggunakan **Anthropic API key**, periksa Anthropic Console
    untuk penggunaan/penagihan dan naikkan limit sesuai kebutuhan.

    Jika pesannya secara spesifik adalah:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi ketika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau
    jalur login-Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: atur **fallback model** agar OpenClaw dapat terus membalas saat sebuah provider terkena rate limit.
    Lihat [Models](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bawaan **Amazon Bedrock (Converse)**. Dengan penanda env AWS yang ada, OpenClaw dapat secara otomatis menemukan katalog Bedrock streaming/text dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Model providers](/id/providers/models). Jika Anda lebih memilih alur key terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana autentikasi Codex bekerja?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (login ChatGPT). Gunakan
    `openai-codex/gpt-5.5` untuk OAuth Codex melalui runner PI default. Gunakan
    `openai/gpt-5.5` untuk akses API key OpenAI langsung. GPT-5.5 juga dapat menggunakan
    langganan/OAuth melalui `openai-codex/gpt-5.5` atau proses app-server Codex native
    dengan `openai/gpt-5.5` dan `agentRuntime.id: "codex"`.
    Lihat [Model providers](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebut openai-codex?">
    `openai-codex` adalah id provider dan auth profile untuk OAuth ChatGPT/Codex.
    Ini juga merupakan prefix model PI eksplisit untuk OAuth Codex:

    - `openai/gpt-5.5` = rute API key OpenAI langsung saat ini di PI
    - `openai-codex/gpt-5.5` = rute OAuth Codex di PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = rute app-server Codex native
    - `openai-codex:...` = id auth profile, bukan referensi model

    Jika Anda menginginkan jalur billing/limit OpenAI Platform langsung, atur
    `OPENAI_API_KEY`. Jika Anda menginginkan autentikasi langganan ChatGPT/Codex, login dengan
    `openclaw models auth login --provider openai-codex` dan gunakan
    referensi model `openai-codex/*` untuk proses PI.

  </Accordion>

  <Accordion title="Mengapa limit OAuth Codex bisa berbeda dari ChatGPT web?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    limit tersebut dapat berbeda dari pengalaman situs web/aplikasi ChatGPT, meskipun
    keduanya terkait ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi OpenClaw tidak menciptakan atau menormalkan hak ChatGPT-web
    menjadi akses API langsung. Jika Anda menginginkan jalur billing/limit OpenAI Platform
    langsung, gunakan `openai/*` dengan API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung autentikasi langganan OpenAI (OAuth Codex)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan di tool/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Model providers](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Gemini CLI OAuth?">
    Gemini CLI menggunakan **alur autentikasi Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Pasang Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, atur `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway

    Ini menyimpan token OAuth di auth profile pada host gateway. Detail: [Model providers](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cocok untuk chat santai?">
    Biasanya tidak. OpenClaw memerlukan konteks besar + keamanan yang kuat; kartu kecil akan terpotong dan bocor. Jika terpaksa, jalankan build model **terbesar** yang dapat Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt injection - lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model hosted tetap berada di wilayah tertentu?">
    Pilih endpoint yang dipatok ke wilayah. OpenRouter mengekspos opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap berada di wilayah tersebut. Anda tetap dapat mencantumkan Anthropic/OpenAI di samping ini dengan menggunakan `models.mode: "merge"` sehingga fallback tetap tersedia sambil menghormati provider berwilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk memasang ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - beberapa orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau mesin kelas Raspberry Pi juga bisa.

    Anda hanya memerlukan Mac **untuk tool khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac apa pun, dan Gateway dapat berjalan di Linux atau di tempat lain. Jika Anda menginginkan tool khusus macOS lainnya, jalankan Gateway di Mac atau lakukan pairing node macOS.

    Docs: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes), [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS apa pun** yang login ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway dapat berjalan di Linux atau di tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac apa pun yang login ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Docs: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes),
    [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, bisakah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **Node** (perangkat pendamping). Node tidak menjalankan Gateway - Node menyediakan
    capability tambahan seperti screen/camera/canvas dan `system.run` di perangkat itu.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan melakukan pairing ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Docs: [Nodes](/id/nodes), [Nodes CLI](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu pada gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram pengirim manusia** (numerik). Ini bukan username bot.

    Penyiapan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri `@username` lama di konfigurasi, `openclaw doctor --fix` dapat mencoba me-resolve-nya.

    Lebih aman (tanpa bot pihak ketiga):

    - Kirim DM ke bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - Kirim DM ke bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - Kirim DM ke `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **perutean multi-agen**. Bind setiap **DM** WhatsApp pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesi mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Multi-Agent Routing](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agen "chat cepat" dan agen "Opus untuk coding"?'>
    Ya. Gunakan perutean multi-agen: beri setiap agen model defaultnya sendiri, lalu bind rute masuk (akun provider atau peer tertentu) ke masing-masing agen. Contoh konfigurasi ada di [Multi-Agent Routing](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Configuration](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan mencakup `/home/linuxbrew/.linuxbrew/bin` (atau prefix brew Anda) agar tool yang dipasang `brew` dapat di-resolve di shell non-login.
    Build terbaru juga menambahkan direktori bin pengguna umum di layanan Linux systemd (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` bila diatur.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi hackable (git):** checkout source penuh, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/docs.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "langsung jalankan."
      Pembaruan berasal dari npm dist-tag.

    Docs: [Getting started](/id/start/getting-started), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Gunakan `openclaw update --channel ...` saat OpenClaw sudah terpasang.
    Ini **tidak menghapus data Anda** - hanya mengubah instalasi kode OpenClaw.
    Status Anda (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) tetap tidak tersentuh.

    Dari npm ke git:

    ```bash
    openclaw update --channel dev
    ```

    Dari git ke npm:

    ```bash
    openclaw update --channel stable
    ```

    Tambahkan `--dry-run` untuk melihat pratinjau perpindahan mode yang direncanakan terlebih dahulu. Updater menjalankan
    tindak lanjut Doctor, menyegarkan sumber plugin untuk channel target, dan
    merestart gateway kecuali Anda memberikan `--no-restart`.

    Installer juga dapat memaksa salah satu mode:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Tip backup: lihat [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan Anda tidak keberatan dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tidak ada biaya server, akses langsung ke file lokal, jendela browser live.
    - **Kekurangan:** sleep/drop jaringan = terputus, pembaruan/reboot OS mengganggu, harus tetap aktif.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), akses file hanya remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya bekerja baik dari VPS. Trade-off nyata satu-satunya adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami gateway disconnect sebelumnya. Lokal sangat cocok saat Anda sedang aktif menggunakan Mac dan menginginkan akses file lokal atau otomasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah untuk tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya baik untuk pengujian dan penggunaan aktif, tetapi harapkan jeda saat mesin sleep atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, pertahankan Gateway di host khusus dan lakukan pairing laptop Anda sebagai **Node** untuk tool screen/camera/exec lokal. Lihat [Nodes](/id/nodes).
    Untuk panduan keamanan, baca [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu channel chat:

    - **Minimum absolut:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang tambahan (log, media, beberapa channel). Tool Node dan otomasi browser bisa memakan banyak resource.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling banyak diuji di sana.

    Docs: [Linux](/id/platforms/linux), [VPS hosting](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki
    RAM yang cukup untuk Gateway serta channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, 1GB RAM.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa channel, otomasi browser, atau tool media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    tooling terbaik. Lihat [Windows](/id/platforms/windows), [VPS hosting](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [macOS VM](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, gateway, keamanan, dan lainnya)
- [Ikhtisar instalasi](/id/install)
- [Getting started](/id/start/getting-started)
- [Troubleshooting](/id/help/troubleshooting)

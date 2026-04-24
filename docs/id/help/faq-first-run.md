---
read_when:
    - Instalasi baru, onboarding macet, atau error saat pertama kali dijalankan
    - Memilih auth dan langganan provider
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dasbor, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: mulai cepat dan penyiapan saat pertama kali dijalankan — instalasi, onboard, auth, langganan, kegagalan awal'
title: 'FAQ: penyiapan saat pertama kali dijalankan'
x-i18n:
    generated_at: "2026-04-24T09:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Tanya jawab mulai cepat dan saat pertama kali dijalankan. Untuk operasi sehari-hari, model, auth, sesi,
  dan pemecahan masalah lihat [FAQ](/id/help/faq) utama.

  ## Mulai cepat dan penyiapan saat pertama kali dijalankan

  <AccordionGroup>
  <Accordion title="Saya macet, cara tercepat untuk keluar dari kebuntuan">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya macet" adalah **masalah konfigurasi atau lingkungan lokal**
    yang tidak dapat diperiksa oleh helper jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Tool ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan
    tingkat mesin Anda (PATH, layanan, izin, file auth). Berikan **checkout source lengkap** melalui
    instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agen dapat membaca kode + dokumentasi dan
    bernalar tentang versi persis yang sedang Anda jalankan. Anda selalu dapat kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agen untuk **merencanakan dan mengawasi** perbaikannya (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, silakan buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulailah dengan perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat kesehatan Gateway/agen + konfigurasi dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah konfigurasi/status yang umum.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](#first-60-seconds-if-something-is-broken).
    Dokumen instalasi: [Instalasi](/id/install), [Flag installer](/id/install/installer), [Pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus melewati. Apa arti alasan skip-nya?">
    Alasan skip Heartbeat yang umum:

    - `quiet-hours`: di luar jendela jam aktif yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi scaffolding kosong/hanya header
    - `no-tasks-due`: mode task `HEARTBEAT.md` aktif tetapi belum ada interval task yang jatuh tempo
    - `alerts-disabled`: semua visibilitas Heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya nonaktif)

    Dalam mode task, timestamp jatuh tempo hanya dimajukan setelah eksekusi Heartbeat nyata
    selesai. Eksekusi yang dilewati tidak menandai task sebagai selesai.

    Dokumen: [Heartbeat](/id/gateway/heartbeat), [Otomatisasi & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk menginstal dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari source dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, Anda biasanya menjalankan Gateway pada port **18789**.

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

  <Accordion title="Bagaimana cara membuka dasbor setelah onboarding?">
    Wizard membuka browser Anda dengan URL dasbor yang bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautan itu di ringkasan. Biarkan tab itu tetap terbuka; jika tidak terbuka, salin/tempel URL yang dicetak di mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana saya mengautentikasi dasbor di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta auth shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan UI Control.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (disarankan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas memenuhi auth UI Control/WebSocket (tanpa menempelkan shared secret, mengasumsikan host Gateway tepercaya); HTTP API tetap memerlukan auth shared-secret kecuali Anda sengaja menggunakan `none` private-ingress atau auth HTTP trusted-proxy.
      Percobaan auth Serve serentak yang buruk dari klien yang sama diserialkan sebelum pencatat limiter failed-auth menyimpannya, sehingga percobaan buruk kedua sudah bisa menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan auth password), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang sesuai di pengaturan dasbor.
    - **Reverse proxy sadar identitas**: pertahankan Gateway di belakang trusted proxy non-loopback, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Auth shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dasbor](/id/web/dashboard) dan [Permukaan web](/id/web) untuk detail mode bind dan auth.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan host exec tetap menjadi gate persetujuan yang sebenarnya. Konfigurasi chat hanya mengontrol ke mana prompt persetujuan
    muncul dan bagaimana orang dapat menjawabnya.

    Di sebagian besar penyiapan Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika sebuah channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw sekarang otomatis mengaktifkan persetujuan native DM-first ketika `channels.<channel>.execApprovals.enabled` tidak disetel atau bernilai `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama; agen hanya seharusnya menyertakan perintah manual `/approve` jika hasil tool mengatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya ketika prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya ketika Anda secara eksplisit ingin prompt persetujuan diposting kembali ke ruang/topik asal.
    - Persetujuan Plugin terpisah lagi: default-nya menggunakan `/approve` di chat yang sama, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang mempertahankan penanganan native persetujuan Plugin di atasnya.

    Versi singkat: forwarding adalah untuk routing, konfigurasi klien native adalah untuk UX khusus channel yang lebih kaya.
    Lihat [Persetujuan Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** diperlukan. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumentasi mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sudah cukup untuk penggunaan pribadi, dan mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda menginginkan ruang tambahan (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum yang keras.

    Tip: Pi/VPS kecil dapat meng-host Gateway, dan Anda dapat melakukan pairing **node** di laptop/ponsel untuk
    layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: bisa jalan, tetapi harapkan ada sisi kasar.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih instalasi **hackable (git)** agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulailah tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda menemui masalah biner yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumen: [Linux](/id/platforms/linux), [Instalasi](/id/install).

  </Accordion>

  <Accordion title="Stuck di wake up my friend / onboarding tidak mau menetas. Sekarang apa?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan terautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis pada hatch pertama. Jika Anda melihat baris itu dengan **tanpa balasan**
    dan token tetap 0, agen tidak pernah berjalan.

    1. Restart Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Periksa status + auth:

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
    diarahkan ke Gateway yang benar. Lihat [Akses remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori status** dan **workspace**, lalu jalankan Doctor sekali. Ini
    mempertahankan bot Anda "persis sama" (memori, riwayat sesi, auth, dan
    status channel) selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan restart layanan Gateway.

    Itu mempertahankan konfigurasi, auth profile, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa host Gateway memiliki session store dan workspace.

    **Penting:** jika Anda hanya commit/push workspace ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Keduanya berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrasi](/id/install/migrating), [Lokasi penyimpanan di disk](#where-things-live-on-disk),
    [Workspace agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru ada di bagian atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi terkirim terbaru. Entri dikelompokkan berdasarkan **Highlights**, **Changes**, dan
    **Fixes** (ditambah bagian docs/lainnya jika diperlukan).

  </Accordion>

  <Accordion title="Tidak bisa mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity salah memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan fitur itu atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Tolong bantu kami membuka blokirnya dengan melapor di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak dapat menjangkau situs itu, dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **dist-tag npm**, bukan jalur kode yang terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` bila diperlukan. Itulah mengapa beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah dist-tag npm `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head `main` yang bergerak (git); saat dipublikasikan, ini menggunakan dist-tag npm `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Detail lebih lanjut: [Channel pengembangan](/id/install/development-channels) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Ada dua opsi:

    1. **Channel dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang dapat diedit, lalu diperbarui melalui git.

    Jika Anda lebih suka clone yang bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumen: [Update](/id/cli/update), [Channel pengembangan](/id/install/development-channels),
    [Instalasi](/id/install).

  </Accordion>

  <Accordion title="Biasanya instalasi dan onboarding memakan waktu berapa lama?">
    Perkiraan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer macet](#quick-start-and-first-run-setup)
    dan loop debug cepat di [Saya macet](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapatkan lebih banyak umpan balik?">
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

    Opsi lainnya: [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) npm error spawn git / git tidak ditemukan**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori tersebut ke PATH pengguna Anda (tidak perlu sufiks `\bin` di Windows; pada sebagian besar sistem nilainya adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumen: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Mandarin yang rusak - apa yang harus saya lakukan?">
    Ini biasanya merupakan ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - Output `system.run`/`exec` merender teks Mandarin sebagai mojibake
    - Perintah yang sama terlihat baik-baik saja di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu restart Gateway dan coba ulang perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih dapat mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** sehingga Anda memiliki source dan dokumentasi lengkap secara lokal, lalu tanyakan
    pada bot Anda (atau Claude/Codex) _dari folder itu_ sehingga ia dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail lebih lanjut: [Instalasi](/id/install) dan [Flag installer](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Installer + pembaruan: [Instalasi & pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami memiliki **hub hosting** dengan provider yang umum. Pilih satu dan ikuti panduannya:

    - [Hosting VPS](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui UI Control (atau Tailscale/SSH). Status + workspace Anda
    berada di server, jadi perlakukan host tersebut sebagai sumber kebenaran dan cadangkan.

    Anda dapat melakukan pairing **node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop Anda sambil tetap menempatkan
    Gateway di cloud.

    Hub: [Platform](/id/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Node: [Nodes](/id/nodes), [CLI Nodes](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tidak direkomendasikan**. Alur pembaruan dapat me-restart
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

    Jika Anda harus mengotomatiskan dari agen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumen: [Update](/id/cli/update), [Pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Sebenarnya onboarding melakukan apa?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** perintah ini memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth provider, API key, setup-token Anthropic, plus opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus Plugin channel bundled seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit systemd pengguna di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Perintah ini juga memberi peringatan jika model yang Anda konfigurasi tidak dikenal atau auth-nya hilang.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model hanya lokal** sehingga data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **Anthropic API key**: penagihan API Anthropic biasa
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru

    Untuk host Gateway yang berjalan lama, Anthropic API key tetap merupakan
    penyiapan yang lebih dapat diprediksi. OpenAI Codex OAuth didukung secara eksplisit untuk tool
    eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi hosted bergaya langganan lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumen: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [Model GLM](/id/providers/glm),
    [Model lokal](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai disetujui
    untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan Anthropic API key sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini
    kecuali Anthropic menerbitkan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` jika tersedia.
    Untuk beban kerja produksi atau multi-pengguna, auth Anthropic API key tetap menjadi
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi hosted bergaya langganan lain
    di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Model
    GLM](/id/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    Itu berarti **kuota/rate limit Anthropic** Anda habis untuk jendela saat ini. Jika Anda
    menggunakan **Claude CLI**, tunggu sampai jendela di-reset atau upgrade paket Anda. Jika Anda
    menggunakan **Anthropic API key**, periksa Anthropic Console
    untuk penggunaan/penagihan dan tingkatkan limit sesuai kebutuhan.

    Jika pesannya secara spesifik:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi ketika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau jalur
    login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: setel **model fallback** agar OpenClaw dapat terus membalas saat provider terkena rate limit.
    Lihat [Models](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bundled **Amazon Bedrock (Converse)**. Dengan penanda env AWS tersedia, OpenClaw dapat secara otomatis menemukan katalog Bedrock streaming/teks dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Provider model](/id/providers/models). Jika Anda lebih memilih alur key terkelola, proxy yang kompatibel dengan OpenAI di depan Bedrock juga tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (login ChatGPT). Gunakan
    `openai-codex/gpt-5.5` untuk OAuth Codex melalui runner PI default. Gunakan
    `openai/gpt-5.4` untuk akses API key OpenAI langsung saat ini. Akses API-key langsung GPT-5.5
    didukung setelah OpenAI mengaktifkannya di API publik; saat ini
    GPT-5.5 menggunakan subscription/OAuth melalui `openai-codex/gpt-5.5` atau eksekusi
    native server-aplikasi Codex dengan `openai/gpt-5.5` dan `embeddedHarness.runtime: "codex"`.
    Lihat [Provider model](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebut openai-codex?">
    `openai-codex` adalah id provider dan auth-profile untuk OAuth ChatGPT/Codex.
    Ini juga merupakan prefiks model PI eksplisit untuk OAuth Codex:

    - `openai/gpt-5.4` = rute API-key OpenAI langsung saat ini di PI
    - `openai/gpt-5.5` = rute API-key langsung di masa depan setelah OpenAI mengaktifkan GPT-5.5 di API
    - `openai-codex/gpt-5.5` = rute OAuth Codex di PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = rute native server-aplikasi Codex
    - `openai-codex:...` = id auth profile, bukan ref model

    Jika Anda menginginkan jalur penagihan/limit OpenAI Platform langsung, setel
    `OPENAI_API_KEY`. Jika Anda menginginkan auth subscription ChatGPT/Codex, login dengan
    `openclaw models auth login --provider openai-codex` dan gunakan
    ref model `openai-codex/*` untuk eksekusi PI.

  </Accordion>

  <Accordion title="Mengapa limit OAuth Codex bisa berbeda dari web ChatGPT?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket. Dalam praktiknya,
    limit tersebut dapat berbeda dari pengalaman situs/aplikasi ChatGPT, bahkan ketika
    keduanya terikat ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi tidak menciptakan atau menormalisasi entitlement web ChatGPT
    menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/limit OpenAI Platform langsung,
    gunakan `openai/*` dengan API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (Codex OAuth)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan subscription OAuth dalam tool/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Provider model](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Gemini CLI OAuth?">
    Gemini CLI menggunakan **alur auth Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway

    Ini menyimpan token OAuth di auth profile pada host Gateway. Detail: [Provider model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cocok untuk obrolan santai?">
    Biasanya tidak. OpenClaw memerlukan konteks besar + keamanan yang kuat; kartu kecil memotong dan bocor. Jika terpaksa, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko injeksi prompt - lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga trafik model hosted tetap berada di region tertentu?">
    Pilih endpoint yang dipin ke region. OpenRouter mengekspos opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap di region tersebut. Anda tetap dapat mencantumkan Anthropic/OpenAI di samping ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil tetap menghormati provider ber-region yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - beberapa orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau perangkat setara Raspberry Pi juga bisa.

    Anda hanya memerlukan Mac **untuk tool yang khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (disarankan) - server BlueBubbles berjalan di Mac mana pun, dan Gateway dapat berjalan di Linux atau di tempat lain. Jika Anda menginginkan tool khusus macOS lainnya, jalankan Gateway di Mac atau lakukan pairing node macOS.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes), [Mode remote Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **suatu perangkat macOS** yang login ke Messages. Itu **tidak** harus berupa Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (disarankan) untuk iMessage - server BlueBubbles berjalan di macOS, sedangkan Gateway dapat berjalan di Linux atau di tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac mana pun yang login ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumen: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes),
    [Mode remote Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - node menyediakan
    kapabilitas tambahan seperti layar/kamera/canvas dan `system.run` di perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan melakukan pairing ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumen: [Nodes](/id/nodes), [CLI Nodes](/id/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk Gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu di Gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram milik manusia pengirim** (numerik). Itu bukan username bot.

    Penyiapan hanya meminta ID pengguna numerik. Jika Anda sudah memiliki entri `@username` lama di konfigurasi, `openclaw doctor --fix` dapat mencoba me-resolve-nya.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **routing multi-agen**. Bind **DM** WhatsApp milik setiap pengirim (peer `kind: "direct"`, E.164 pengirim seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan session store mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Routing Multi-Agen](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agen "fast chat" dan agen "Opus for coding"?'>
    Ya. Gunakan routing multi-agen: beri setiap agen model defaultnya sendiri, lalu bind rute masuk (akun provider atau peer tertentu) ke masing-masing agen. Contoh konfigurasi ada di [Routing Multi-Agen](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Konfigurasi](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan mencakup `/home/linuxbrew/.linuxbrew/bin` (atau prefiks brew Anda) agar tool yang diinstal `brew` dapat di-resolve di shell non-login.
    Build terbaru juga menambahkan direktori bin pengguna umum di layanan Linux systemd (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` saat disetel.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi git hackable:** checkout source penuh, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "tinggal jalankan."
      Pembaruan datang dari dist-tag npm.

    Dokumen: [Memulai](/id/start/getting-started), [Pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Instal varian lain, lalu jalankan Doctor agar layanan Gateway menunjuk ke entrypoint baru.
    Ini **tidak menghapus data Anda** - ini hanya mengubah instalasi kode OpenClaw. Status
    (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) Anda tetap tidak tersentuh.

    Dari npm ke git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Dari git ke npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor mendeteksi ketidakcocokan entrypoint layanan Gateway dan menawarkan untuk menulis ulang konfigurasi layanan agar cocok dengan instalasi saat ini (gunakan `--repair` dalam otomatisasi).

    Tip cadangan: lihat [Strategi cadangan](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan serendah mungkin dan Anda tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tidak ada biaya server, akses langsung ke file lokal, jendela browser live.
    - **Kekurangan:** sleep/drop jaringan = putus koneksi, update/reboot OS mengganggu, harus tetap menyala.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), akses file hanya remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi dengan baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami Gateway terputus sebelumnya. Lokal sangat bagus ketika Anda sedang aktif menggunakan Mac dan ingin akses file lokal atau otomatisasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **disarankan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah tetap berjalan.
    - **Laptop/desktop bersama:** tetap baik untuk pengujian dan penggunaan aktif, tetapi harapkan jeda saat mesin sleep atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, pertahankan Gateway di host khusus dan lakukan pairing laptop Anda sebagai **node** untuk tool layar/kamera/exec lokal. Lihat [Nodes](/id/nodes).
    Untuk panduan keamanan, baca [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu channel chat:

    - **Minimum absolut:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Disarankan:** 1-2 vCPU, 2GB RAM atau lebih untuk ruang tambahan (log, media, beberapa channel). Tool node dan otomatisasi browser bisa haus sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern lainnya). Jalur instalasi Linux paling banyak diuji di sana.

    Dokumen: [Linux](/id/platforms/linux), [Hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki RAM yang cukup
    untuk Gateway dan channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, 1GB RAM.
    - **Disarankan:** 2GB RAM atau lebih jika Anda menjalankan beberapa channel, otomatisasi browser, atau tool media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    tool terbaik. Lihat [Windows](/id/platforms/windows), [Hosting VPS](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama (model, sesi, Gateway, keamanan, dan lainnya)
- [Ikhtisar instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

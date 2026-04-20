---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, instalasi, onboarding, atau dukungan runtime
    - Melakukan triase masalah yang dilaporkan pengguna sebelum debugging lebih lanjut
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-20T09:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae8efda399e34f59f22f6ea8ce218eaf7b872e4117d8596ec19c09891d70813b
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (local dev, VPS, multi-agent, OAuth/API key, failover model). Untuk diagnostik runtime, lihat [Troubleshooting](/id/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Configuration](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agent/sesi, konfigurasi provider + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang bisa dibagikan dengan aman**

   ```bash
   openclaw status --all
   ```

   Diagnosis read-only dengan log tail (token disamarkan).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi mana yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe health gateway langsung, termasuk probe channel bila didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Health](/id/gateway/health).

5. **Ikuti log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC tidak aktif, gunakan alternatif berikut:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Logging](/id/logging) dan [Troubleshooting](/id/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan konfigurasi/status + menjalankan pemeriksaan health. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + path konfigurasi saat terjadi error
   ```

   Meminta snapshot penuh dari gateway yang sedang berjalan (khusus WS). Lihat [Health](/id/gateway/health).

## Mulai cepat dan penyiapan saat pertama kali dijalankan

<AccordionGroup>
  <Accordion title="Saya buntu, cara tercepat untuk keluar dari kebuntuan">
    Gunakan agent AI lokal yang bisa **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena sebagian besar kasus "saya buntu" adalah **masalah konfigurasi lokal atau lingkungan**
    yang tidak bisa diperiksa oleh orang yang membantu dari jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki penyiapan
    di tingkat mesin Anda (PATH, layanan, izin, file auth). Berikan **checkout source lengkap**
    melalui instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini memasang OpenClaw **dari checkout git**, sehingga agent dapat membaca kode + dokumentasi dan
    menalar versi persis yang sedang Anda jalankan. Anda selalu bisa kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agent untuk **merencanakan dan mengawasi** perbaikannya (langkah demi langkah), lalu mengeksekusi hanya
    perintah yang diperlukan. Itu membuat perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan yang nyata, silakan buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulailah dengan perintah berikut (bagikan output-nya saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat health gateway/agent + konfigurasi dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah umum pada konfigurasi/status.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](#60-detik-pertama-jika-ada-yang-rusak).
    Dokumentasi instalasi: [Install](/id/install), [Installer flags](/id/install/installer), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan skip itu?">
    Alasan skip Heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/header saja
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya nonaktif)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah Heartbeat yang nyata
    selesai dijalankan. Run yang dilewati tidak menandai tugas sebagai selesai.

    Dokumentasi: [Heartbeat](/id/gateway/heartbeat), [Automation & Tasks](/id/automation).

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
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token) tepat setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu tetap terbuka; jika tidak terbuka, salin/tempel URL yang dicetak di mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta auth shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): tetap gunakan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` bernilai `true`, header identitas akan memenuhi auth Control UI/WebSocket (tanpa menempelkan shared secret, dengan asumsi host gateway tepercaya); API HTTP tetap memerlukan auth shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau auth HTTP trusted-proxy.
      Upaya auth Serve bersamaan yang buruk dari klien yang sama diserialkan sebelum limiter gagal-auth mencatatnya, sehingga retry buruk kedua bisa langsung menampilkan `retry later`.
    - **Bind Tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan auth kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang cocok di pengaturan dashboard.
    - **Reverse proxy yang sadar identitas**: simpan Gateway di belakang trusted proxy non-loopback, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy.
    - **Tunneling SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Auth shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/web/dashboard) dan [Web surfaces](/web) untuk detail mode bind dan auth.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?">
    Keduanya mengendalikan lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel tersebut bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Konfigurasi chat hanya mengendalikan ke mana prompt persetujuan
    muncul dan bagaimana orang bisa menjawabnya.

    Dalam sebagian besar penyiapan Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw sekarang mengaktifkan otomatis persetujuan native DM-first saat `channels.<channel>.execApprovals.enabled` tidak disetel atau bernilai `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama; agent hanya boleh menyertakan perintah `/approve` manual jika hasil alat menyatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya saat prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya jika Anda secara eksplisit ingin prompt persetujuan diposting kembali ke room/topik asal.
    - Persetujuan Plugin terpisah lagi: secara default menggunakan `/approve` di chat yang sama, penerusan `approvals.plugin` opsional, dan hanya beberapa channel native yang tetap menangani plugin approval native di atasnya.

    Versi singkatnya: forwarding untuk perutean, konfigurasi klien native untuk UX yang lebih kaya dan spesifik per channel.
    Lihat [Exec Approvals](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** wajib. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah ini berjalan di Raspberry Pi?">
    Ya. Gateway bersifat ringan - dokumentasi mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sebagai cukup untuk penggunaan pribadi, dan menyebutkan bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda ingin ruang tambahan (log, media, layanan lain), **2GB direkomendasikan**, tetapi
    bukan minimum yang wajib.

    Tip: Pi/VPS kecil dapat meng-host Gateway, dan Anda dapat mem-pairing **node** di laptop/ponsel untuk
    screen/camera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/id/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: bisa, tetapi harapkan ada beberapa kendala.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **instalasi hackable (git)** agar Anda bisa melihat log dan memperbarui dengan cepat.
    - Mulailah tanpa channel/Skills, lalu tambahkan satu per satu.
    - Jika Anda mengalami masalah binary yang aneh, biasanya itu adalah masalah **kompatibilitas ARM**.

    Dokumentasi: [Linux](/id/platforms/linux), [Install](/id/install).

  </Accordion>

  <Accordion title="Macet di wake up my friend / onboarding tidak mau hatch. Lalu bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis saat hatch pertama. Jika Anda melihat baris itu tanpa **balasan**
    dan token tetap 0, berarti agent tidak pernah berjalan.

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

    3. Jika masih macet, jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway bersifat remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori status** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "tetap sama persis" (memori, riwayat sesi, auth, dan
    status channel) selama Anda menyalin **kedua** lokasi berikut:

    1. Pasang OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan konfigurasi, profil auth, kredensial WhatsApp, sesi, dan memori. Jika Anda berada dalam
    mode remote, ingat bahwa host gateway memiliki penyimpanan sesi dan workspace.

    **Penting:** jika Anda hanya commit/push workspace Anda ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Semuanya itu berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrating](/id/install/migrating), [Lokasi penyimpanan di disk](#where-things-live-on-disk),
    [Workspace agent](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru ada di bagian atas. Jika bagian paling atas ditandai **Unreleased**, maka bagian
    bertanggal berikutnya adalah versi terbaru yang sudah dirilis. Entri dikelompokkan berdasarkan **Highlights**, **Changes**, dan
    **Fixes** (ditambah bagian docs/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak bisa mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan fitur itu atau masukkan `docs.openclaw.ai` ke allowlist, lalu coba lagi.
    Tolong bantu kami membuka blokirnya dengan melapor di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak dapat mengakses situs tersebut, dokumentasinya dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tag**, bukan jalur kode yang terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable masuk ke **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    memublikasikan langsung ke `latest` bila diperlukan. Itulah sebabnya beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara memasang versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah npm dist-tag `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah head yang terus bergerak dari `main` (git); saat dipublikasikan, ia menggunakan npm dist-tag `dev`.

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

    Ini akan beralih ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

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

    Dokumentasi: [Update](/cli/update), [Development channels](/id/install/development-channels),
    [Install](/id/install).

  </Accordion>

  <Accordion title="Biasanya berapa lama instalasi dan onboarding?">
    Perkiraan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer stuck](#quick-start-and-first-run-setup)
    dan loop debug cepat di [Saya buntu](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer macet? Bagaimana cara mendapatkan umpan balik yang lebih banyak?">
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
    Dua masalah umum di Windows:

    **1) error npm spawn git / git tidak ditemukan**

    - Pasang **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder npm global bin Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori tersebut ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows; pada sebagian besar sistem path-nya adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumentasi: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec di Windows menampilkan teks China yang rusak - apa yang harus saya lakukan?">
    Biasanya ini adalah ketidakcocokan code page konsol pada shell Windows native.

    Gejala:

    - output `system.run`/`exec` menampilkan karakter China sebagai mojibake
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

    Jika Anda masih dapat mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasinya tidak menjawab pertanyaan saya - bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** agar Anda memiliki source dan dokumentasi lengkap secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) _dari folder tersebut_ agar ia dapat membaca repo dan menjawab dengan tepat.

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
    VPS Linux apa pun bisa digunakan. Pasang di server, lalu gunakan SSH/Tailscale untuk mengakses Gateway.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyediakan **pusat hosting** dengan provider yang umum. Pilih salah satu dan ikuti panduannya:

    - [VPS hosting](/id/vps) (semua provider di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui Control UI (atau Tailscale/SSH). Status + workspace Anda
    berada di server, jadi perlakukan host sebagai sumber kebenaran dan lakukan backup.

    Anda dapat mem-pairing **node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    screen/camera/canvas lokal atau menjalankan perintah di laptop Anda sambil tetap menempatkan
    Gateway di cloud.

    Pusat: [Platforms](/id/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Node: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw untuk memperbarui dirinya sendiri?">
    Jawaban singkat: **mungkin, tetapi tidak direkomendasikan**. Alur pembaruan dapat memulai ulang
    Gateway (yang akan memutus sesi aktif), mungkin memerlukan checkout git yang bersih, dan
    dapat meminta konfirmasi. Yang lebih aman: jalankan pembaruan dari shell sebagai operator.

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

    Dokumentasi: [Update](/cli/update), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Sebenarnya onboarding melakukan apa?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ia memandu Anda melalui:

    - **Penyiapan model/auth** (OAuth provider, API key, setup-token Anthropic, ditambah opsi model lokal seperti LM Studio)
    - Lokasi **workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channel** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ditambah plugin channel bawaan seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit systemd user di Linux/WSL2)
    - Pemeriksaan **health** dan pemilihan **Skills**

    Ini juga memberi peringatan jika model yang Anda konfigurasi tidak dikenal atau auth-nya tidak ada.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model lokal saja** sehingga data Anda tetap berada di perangkat Anda. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Untuk Anthropic di OpenClaw, pembagian praktisnya adalah:

    - **API key Anthropic**: penagihan API Anthropic biasa
    - **Claude CLI / auth langganan Claude di OpenClaw**: staf Anthropic
      memberi tahu kami bahwa penggunaan ini diizinkan lagi, dan OpenClaw memperlakukan penggunaan `claude -p`
      sebagai sesuatu yang diizinkan untuk integrasi ini kecuali Anthropic memublikasikan kebijakan
      baru

    Untuk host gateway jangka panjang, API key Anthropic tetap merupakan
    penyiapan yang lebih dapat diprediksi. OAuth OpenAI Codex didukung secara eksplisit untuk alat
    eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi berbasis langganan lain yang di-host termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [GLM Models](/id/providers/glm),
    [Local models](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw diizinkan lagi, jadi
    OpenClaw memperlakukan auth langganan Claude dan penggunaan `claude -p` sebagai sesuatu yang diizinkan
    untuk integrasi ini kecuali Anthropic memublikasikan kebijakan baru. Jika Anda menginginkan
    penyiapan sisi server yang paling dapat diprediksi, gunakan API key Anthropic sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya.

    Staf Anthropic memberi tahu kami bahwa penggunaan ini diizinkan lagi, jadi OpenClaw memperlakukan
    penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai sesuatu yang diizinkan untuk integrasi ini
    kecuali Anthropic memublikasikan kebijakan baru.

    Setup-token Anthropic masih tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.
    Untuk workload produksi atau multi-pengguna, auth API key Anthropic tetap merupakan
    pilihan yang lebih aman dan lebih dapat diprediksi. Jika Anda menginginkan opsi
    lain yang di-host dan bergaya langganan di OpenClaw, lihat [OpenAI](/id/providers/openai), [Qwen / Model
    Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [GLM
    Models](/id/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
menggunakan **Claude CLI**, tunggu hingga jendela di-reset atau tingkatkan paket Anda. Jika Anda
menggunakan **API key Anthropic**, periksa Anthropic Console
untuk penggunaan/penagihan dan naikkan batas jika diperlukan.

    Jika pesannya secara spesifik adalah:
    `Extra usage is required for long context requests`, berarti permintaan itu mencoba menggunakan
    beta konteks 1M milik Anthropic (`context1m: true`). Itu hanya berfungsi jika
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau
    jalur login-Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: tetapkan **model fallback** agar OpenClaw dapat tetap membalas saat sebuah provider terkena rate limit.
    Lihat [Models](/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bawaan **Amazon Bedrock (Converse)**. Dengan marker env AWS yang ada, OpenClaw dapat secara otomatis menemukan katalog Bedrock streaming/teks dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Model providers](/id/providers/models). Jika Anda lebih memilih alur managed key, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana auth Codex bekerja?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (login ChatGPT). Onboarding dapat menjalankan alur OAuth dan akan menetapkan model default ke `openai-codex/gpt-5.4` bila sesuai. Lihat [Model providers](/id/concepts/model-providers) dan [Onboarding (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa ChatGPT GPT-5.4 tidak membuka akses ke openai/gpt-5.4 di OpenClaw?">
    OpenClaw memperlakukan kedua jalur tersebut secara terpisah:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API Platform OpenAI langsung

    Di OpenClaw, login ChatGPT/Codex dihubungkan ke jalur `openai-codex/*`,
    bukan ke jalur `openai/*` langsung. Jika Anda menginginkan jalur API langsung di
    OpenClaw, setel `OPENAI_API_KEY` (atau konfigurasi provider OpenAI yang setara).
    Jika Anda menginginkan login ChatGPT/Codex di OpenClaw, gunakan `openai-codex/*`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex bisa berbeda dari web ChatGPT?">
    `openai-codex/*` menggunakan jalur OAuth Codex, dan jendela kuota yang dapat digunakannya
    dikelola oleh OpenAI dan bergantung pada paket. Dalam praktiknya, batas tersebut dapat berbeda dari
    pengalaman situs web/aplikasi ChatGPT, meskipun keduanya terikat ke akun yang sama.

    OpenClaw dapat menampilkan jendela penggunaan/kuota provider yang saat ini terlihat di
    `openclaw models status`, tetapi tidak mengada-ada atau menormalkan entitlement web-ChatGPT
    menjadi akses API langsung. Jika Anda menginginkan jalur penagihan/batas Platform OpenAI
    langsung, gunakan `openai/*` dengan API key.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (Codex OAuth)?">
    Ya. OpenClaw sepenuhnya mendukung **OAuth langganan OpenAI Code (Codex)**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan di alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Model providers](/id/concepts/model-providers), dan [Onboarding (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Gemini CLI OAuth?">
    Gemini CLI menggunakan **alur auth Plugin**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Pasang Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3-flash-preview`
    5. Jika permintaan gagal, setel `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway

    Ini menyimpan token OAuth dalam profil auth di host gateway. Detail: [Model providers](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cukup baik untuk chat santai?">
    Biasanya tidak. OpenClaw memerlukan konteks besar + keamanan yang kuat; kartu kecil akan memotong konteks dan bocor. Jika terpaksa, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt injection - lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga lalu lintas model yang di-host tetap berada di wilayah tertentu?">
    Pilih endpoint yang dipatok ke wilayah. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap berada di wilayah tersebut. Anda tetap dapat mencantumkan Anthropic/OpenAI bersama ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil tetap menghormati provider berwilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk memasang ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - sebagian orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau mesin setara Raspberry Pi juga bisa.

    Anda hanya memerlukan Mac **untuk alat yang khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac apa pun, dan Gateway dapat berjalan di Linux atau di tempat lain. Jika Anda menginginkan alat khusus macOS lainnya, jalankan Gateway di Mac atau pairing node macOS.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes), [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS apa pun** yang login ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway dapat berjalan di Linux atau di tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac apa pun yang login ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/id/nodes),
    [Mac remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, bisakah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
    kemampuan tambahan seperti screen/camera/canvas dan `system.run` pada perangkat itu.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan aplikasi macOS atau host node dan pairing ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu pada gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram milik manusia pengirim** (numerik). Itu bukan username bot.

    Penyiapan meminta ID pengguna numerik saja. Jika Anda sudah memiliki entri `@username` lama di konfigurasi, `openclaw doctor --fix` dapat mencoba menyelesaikannya.

    Lebih aman (tanpa bot pihak ketiga):

    - Kirim DM ke bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - Kirim DM ke bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - Kirim DM ke `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **multi-agent routing**. Ikat **DM** WhatsApp milik setiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan penyimpanan sesi mereka sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Multi-Agent Routing](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "chat cepat" dan agent "Opus untuk coding"?'>
    Ya. Gunakan multi-agent routing: beri setiap agent model defaultnya sendiri, lalu ikat rute masuk (akun provider atau peer tertentu) ke masing-masing agent. Contoh konfigurasi ada di [Multi-Agent Routing](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Configuration](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan menyertakan `/home/linuxbrew/.linuxbrew/bin` (atau prefix brew Anda) agar alat yang dipasang dengan `brew` dapat di-resolve dalam shell non-login.
    Build terbaru juga menambahkan lebih dulu direktori bin pengguna umum pada layanan Linux systemd (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` bila disetel.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi git hackable:** checkout source lengkap, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat mem-patch kode/dokumentasi.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "langsung jalankan."
      Pembaruan berasal dari npm dist-tag.

    Dokumentasi: [Getting started](/id/start/getting-started), [Updating](/id/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Pasang varian lainnya, lalu jalankan Doctor agar layanan gateway mengarah ke entrypoint baru.
    Ini **tidak menghapus data Anda** - ini hanya mengubah instalasi kode OpenClaw. Status Anda
    (`~/.openclaw`) dan workspace (`~/.openclaw/workspace`) tetap tidak tersentuh.

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

    Doctor mendeteksi ketidakcocokan entrypoint layanan gateway dan menawarkan untuk menulis ulang konfigurasi layanan agar cocok dengan instalasi saat ini (gunakan `--repair` dalam otomatisasi).

    Tips backup: lihat [Strategi backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda menginginkan keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    hambatan paling rendah dan tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tidak ada biaya server, akses langsung ke file lokal, jendela browser langsung.
    - **Kekurangan:** sleep/drop jaringan = terputus, pembaruan/reboot OS mengganggu, mesin harus tetap aktif.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah untuk tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), hanya akses file remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami gateway terputus sebelumnya. Lokal sangat bagus saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau otomatisasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah untuk tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya baik untuk pengujian dan penggunaan aktif, tetapi perkirakan ada jeda saat mesin sleep atau diperbarui.

    Jika Anda menginginkan yang terbaik dari keduanya, simpan Gateway di host khusus dan pairing laptop Anda sebagai **node** untuk alat screen/camera/exec lokal. Lihat [Nodes](/id/nodes).
    Untuk panduan keamanan, baca [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw bersifat ringan. Untuk Gateway dasar + satu channel chat:

    - **Minimum absolut:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2GB atau lebih untuk ruang tambahan (log, media, beberapa channel). Alat Node dan otomatisasi browser dapat membutuhkan banyak resource.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling banyak diuji di sana.

    Dokumentasi: [Linux](/id/platforms/linux), [VPS hosting](/id/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki
    RAM yang cukup untuk Gateway dan channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum absolut:** 1 vCPU, 1GB RAM.
    - **Direkomendasikan:** RAM 2GB atau lebih jika Anda menjalankan beberapa channel, otomatisasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    alat terbaik. Lihat [Windows](/id/platforms/windows), [VPS hosting](/id/vps).
    Jika Anda menjalankan macOS di VM, lihat [macOS VM](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. OpenClaw membalas di permukaan pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan plugin channel bawaan seperti QQ Bot) dan juga dapat melakukan suara + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistennya adalah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar wrapper Claude." OpenClaw adalah **control plane local-first** yang memungkinkan Anda menjalankan
    asisten yang mumpuni di **perangkat keras Anda sendiri**, dapat dijangkau dari aplikasi chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan alat - tanpa menyerahkan kontrol alur kerja Anda ke
    SaaS yang di-host.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus voice seluler dan Canvas di platform yang didukung.
    - **Agnostik terhadap model:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan per-agent routing
      dan failover.
    - **Opsi lokal saja:** jalankan model lokal sehingga **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Multi-agent routing:** agent terpisah per channel, akun, atau tugas, masing-masing dengan
      workspace dan default sendiri.
    - **Open source dan hackable:** periksa, perluas, dan self-host tanpa vendor lock-in.

    Dokumentasi: [Gateway](/id/gateway), [Channels](/id/channels), [Multi-agent](/id/concepts/multi-agent),
    [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang sebaiknya saya lakukan dulu?">
    Proyek pertama yang bagus:

    - Membangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Membuat prototipe aplikasi seluler (kerangka, layar, rencana API).
    - Mengatur file dan folder (pembersihan, penamaan, penandaan).
    - Menghubungkan Gmail dan mengotomatiskan ringkasan atau tindak lanjut.

    OpenClaw dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya ke dalam beberapa fase dan
    menggunakan sub-agent untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima kasus penggunaan sehari-hari teratas untuk OpenClaw?">
    Kegunaan sehari-hari biasanya terlihat seperti ini:

    - **Briefing pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan drafting:** riset cepat, ringkasan, dan draf awal untuk email atau dokumen.
    - **Pengingat dan tindak lanjut:** dorongan dan checklist yang digerakkan oleh Cron atau Heartbeat.
    - **Otomatisasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan drafting**. OpenClaw dapat memindai situs, membuat shortlist,
    merangkum prospek, dan menulis draf outreach atau copy iklan.

    Untuk **outreach atau penayangan iklan**, pertahankan manusia di dalam loop. Hindari spam, patuhi hukum lokal dan
    kebijakan platform, serta tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf dan Anda yang menyetujuinya.

    Dokumentasi: [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa kelebihannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi alat.

    Kelebihan:

    - **Memori + workspace persisten** di seluruh sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi alat** (browser, file, penjadwalan, hook)
    - **Gateway yang selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Node** untuk browser/screen/camera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan otomatisasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo tetap kotor?">
    Gunakan override terkelola alih-alih mengedit salinan repo. Letakkan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritasnya adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`, sehingga override terkelola tetap menang atas Skills bawaan tanpa menyentuh git. Jika Anda memerlukan Skill terpasang secara global tetapi hanya terlihat oleh beberapa agent, simpan salinan bersama di `~/.openclaw/skills` dan kendalikan visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang sebaiknya hidup di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder khusus?">
    Ya. Tambahkan direktori tambahan melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bawaan → `skills.load.extraDirs`. `clawhub` memasang ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika Skill hanya boleh terlihat oleh agent tertentu, padukan itu dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron jobs**: job terisolasi dapat menetapkan override `model` per job.
    - **Sub-agent**: rute tugas ke agent terpisah dengan model default yang berbeda.
    - **Peralihan sesuai permintaan**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron jobs](/id/automation/cron-jobs), [Multi-Agent Routing](/id/concepts/multi-agent), dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat melakukan pekerjaan berat. Bagaimana cara memindahkan beban itu?">
    Gunakan **sub-agent** untuk tugas yang panjang atau paralel. Sub-agent berjalan dalam sesi mereka sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn sub-agent untuk tugas ini" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway sekarang (dan apakah sedang sibuk).

    Tip token: tugas panjang dan sub-agent sama-sama mengonsumsi token. Jika biaya menjadi perhatian, tetapkan
    model yang lebih murah untuk sub-agent melalui `agents.defaults.subagents.model`.

    Dokumentasi: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana sesi subagent yang terikat thread bekerja di Discord?">
    Gunakan pengikatan thread. Anda dapat mengikat thread Discord ke target subagent atau sesi sehingga pesan tindak lanjut di thread tersebut tetap berada pada sesi yang terikat itu.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk tindak lanjut persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status pengikatan.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengendalikan pelepasan fokus otomatis.
    - Gunakan `/unfocus` untuk melepaskan thread.

    Konfigurasi yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Ikat otomatis saat spawn: setel `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentasi: [Sub-agents](/id/tools/subagents), [Discord](/id/channels/discord), [Configuration Reference](/id/gateway/configuration-reference), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Sub-agent selesai, tetapi pembaruan penyelesaiannya dikirim ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa rute peminta yang telah di-resolve terlebih dahulu:

    - Pengiriman sub-agent mode penyelesaian lebih memilih thread atau rute percakapan yang terikat jika ada.
    - Jika asal penyelesaian hanya membawa channel, OpenClaw akan fallback ke rute tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) agar pengiriman langsung tetap bisa berhasil.
    - Jika tidak ada rute terikat maupun rute tersimpan yang dapat digunakan, pengiriman langsung bisa gagal dan hasilnya akan fallback ke pengiriman sesi yang diantrekan alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau usang masih dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau persis `ANNOUNCE_SKIP`, OpenClaw sengaja menekan pengumuman alih-alih memposting progres lama yang basi.
    - Jika child timeout setelah hanya melakukan pemanggilan alat, pengumuman dapat merangkum itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output alat mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Sub-agents](/id/tools/subagents), [Background Tasks](/id/automation/tasks), [Session Tools](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    job terjadwal tidak akan dijalankan.

    Checklist:

    - Konfirmasikan Cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
    - Periksa bahwa Gateway berjalan 24/7 (tanpa sleep/restart).
    - Verifikasi pengaturan zona waktu untuk job (`--tz` vs zona waktu host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cron berjalan, tetapi tidak ada yang dikirim ke channel. Mengapa?">
    Periksa mode pengiriman terlebih dahulu:

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak ada pesan eksternal yang diharapkan.
    - Target pengumuman yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan auth channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil terisolasi yang senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan pengiriman fallback yang diantrekan.

    Untuk Cron job terisolasi, runner memiliki pengiriman akhir. Agent diharapkan
    mengembalikan ringkasan plain-text untuk dikirim oleh runner. `--no-deliver` menjaga
    hasil tersebut tetap internal; itu tidak membiarkan agent mengirim langsung dengan
    message tool sebagai gantinya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa run Cron terisolasi berpindah model atau mencoba ulang sekali?">
    Itu biasanya adalah jalur peralihan model langsung, bukan penjadwalan duplikat.

    Cron terisolasi dapat mempertahankan handoff model runtime dan mencoba ulang saat run aktif
    melempar `LiveSessionModelSwitchError`. Percobaan ulang mempertahankan
    provider/model yang telah dialihkan, dan jika peralihan itu membawa override profil auth baru, Cron
    juga mempertahankannya sebelum mencoba ulang.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang terlebih dahulu jika berlaku.
    - Lalu `model` per job.
    - Lalu override model sesi Cron yang tersimpan.
    - Lalu pemilihan model agent/default normal.

    Loop retry dibatasi. Setelah percobaan awal plus 2 retry peralihan,
    Cron dihentikan alih-alih loop tanpa akhir.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara memasang Skills di Linux?">
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
    workspace aktif. Pasang CLI `clawhub` terpisah hanya jika Anda ingin memublikasikan atau
    menyinkronkan Skills Anda sendiri. Untuk instalasi bersama lintas agent, letakkan Skill di
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin mempersempit agent mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas secara terjadwal atau terus-menerus di latar belakang?">
    Ya. Gunakan scheduler Gateway:

    - **Cron jobs** untuk tugas terjadwal atau berulang (bertahan melewati restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Isolated jobs** untuk agent otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills khusus Apple macOS dari Linux?">
    Tidak secara langsung. Skills macOS dibatasi oleh `metadata.openclaw.os` plus binary yang diperlukan, dan Skills hanya muncul dalam system prompt saat memenuhi syarat di **host Gateway**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda menimpa pembatasan tersebut.

    Ada tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat binary macOS tersedia, lalu hubungkan dari Linux dalam [mode remote](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills dimuat secara normal karena host Gateway adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pairing node macOS (aplikasi menubar), dan setel **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai memenuhi syarat saat binary yang diperlukan ada di node. Agent menjalankan Skills tersebut melalui tool `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" di prompt akan menambahkan perintah tersebut ke allowlist.

    **Opsi C - proxy binary macOS melalui SSH (lanjutan).**
    Simpan Gateway di Linux, tetapi buat binary CLI yang diperlukan di-resolve ke wrapper SSH yang berjalan di Mac. Lalu override Skill agar mengizinkan Linux sehingga tetap memenuhi syarat.

    1. Buat wrapper SSH untuk binary tersebut (contoh: `memo` untuk Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Letakkan wrapper di `PATH` pada host Linux (misalnya `~/bin/memo`).
    3. Override metadata Skill (workspace atau `~/.openclaw/skills`) agar mengizinkan Linux:

       ```markdown
       ---
       name: apple-notes
       description: Kelola Apple Notes melalui CLI memo di macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills diperbarui.

  </Accordion>

  <Accordion title="Apakah Anda memiliki integrasi Notion atau HeyGen?">
    Belum bawaan saat ini.

    Opsi:

    - **Skill / Plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen keduanya memiliki API).
    - **Otomatisasi browser:** berfungsi tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menjaga konteks per klien (alur kerja agensi), pola sederhananya adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agent mengambil halaman tersebut di awal sesi.

    Jika Anda menginginkan integrasi native, buka permintaan fitur atau bangun Skill
    yang menargetkan API tersebut.

    Pasang Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native ditempatkan di direktori `skills/` workspace aktif. Untuk Skills bersama lintas agent, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agent yang boleh melihat instalasi bersama, konfigurasikan `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skill mengharapkan binary yang dipasang melalui Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/id/tools/skills), [Skills config](/id/tools/skills-config), dan [ClawHub](/id/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser bawaan `user`, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama khusus, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini dapat menggunakan browser host lokal atau node browser yang terhubung. Jika Gateway berjalan di tempat lain, jalankan host node di mesin browser atau gunakan CDP remote sebagai gantinya.

    Batas saat ini pada `existing-session` / `user`:

    - tindakan berbasis ref, bukan berbasis CSS selector
    - upload memerlukan `ref` / `inputRef` dan saat ini hanya mendukung satu file sekaligus
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah

  </Accordion>
</AccordionGroup>

## Sandboxing dan memori

<AccordionGroup>
  <Accordion title="Apakah ada dokumentasi sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (Gateway penuh di Docker atau image sandbox), lihat [Docker](/id/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default mengutamakan keamanan dan berjalan sebagai pengguna `node`, jadi image tersebut tidak
    menyertakan package sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Persist `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap tersimpan.
    - Bake dependensi sistem ke dalam image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Pasang browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setel `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path tersebut dipersist.

    Dokumentasi: [Docker](/id/install/docker), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi tetapi membuat grup menjadi publik/tersandbox dengan satu agent?">
    Ya - jika lalu lintas privat Anda adalah **DM** dan lalu lintas publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` agar sesi grup/channel (kunci non-main) berjalan di Docker, sementara sesi DM utama tetap di host. Lalu batasi tool apa saja yang tersedia dalam sesi tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh konfigurasi: [Grup: DM pribadi + grup publik](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi konfigurasi utama: [Gateway configuration](/id/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara mengikat folder host ke dalam sandbox?">
    Setel `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya `"/home/user/src:/src:ro"`). Bind global + per-agent akan digabung; bind per-agent diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati batas filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan juga path kanonis yang di-resolve melalui ancestor terdalam yang sudah ada. Itu berarti pelarian melalui parent symlink tetap gagal tertutup bahkan ketika segmen path terakhir belum ada, dan pemeriksaan allowed-root tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana memori bekerja?">
    Memori OpenClaw hanyalah file Markdown di workspace agent:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (khusus sesi utama/pribadi)

    OpenClaw juga menjalankan **silent pre-Compaction memory flush** untuk mengingatkan model
    agar menulis catatan yang tahan lama sebelum Compaction otomatis. Ini hanya berjalan saat workspace
    dapat ditulisi (sandbox read-only melewatinya). Lihat [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memori terus melupakan sesuatu. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta itu ke memori**. Catatan jangka panjang seharusnya masuk ke `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih merupakan area yang terus kami tingkatkan. Membantu jika Anda mengingatkan model untuk menyimpan memori;
    model akan tahu apa yang harus dilakukan. Jika masih terus lupa, verifikasi bahwa Gateway menggunakan
    workspace yang sama pada setiap run.

    Dokumentasi: [Memory](/id/concepts/memory), [Workspace agent](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memori bertahan selamanya? Apa batasnya?">
    File memori berada di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    penyimpanan Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, jadi percakapan yang panjang bisa mengalami Compaction atau pemotongan. Itulah sebabnya
    pencarian memori ada - fitur itu hanya menarik kembali bagian yang relevan ke dalam konteks.

    Dokumentasi: [Memory](/id/concepts/memory), [Context](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memori semantik memerlukan API key OpenAI?">
    Hanya jika Anda menggunakan **embedding OpenAI**. OAuth Codex mencakup chat/completions dan
    **tidak** memberikan akses embeddings, jadi **login dengan Codex (OAuth atau
    login CLI Codex)** tidak membantu untuk pencarian memori semantik. Embedding OpenAI
    tetap memerlukan API key sungguhan (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menetapkan provider secara eksplisit, OpenClaw memilih provider secara otomatis saat
    dapat me-resolve API key (profil auth, `models.providers.*.apiKey`, atau env var).
    OpenClaw lebih memilih OpenAI jika OpenAI key dapat di-resolve, jika tidak Gemini jika Gemini key
    dapat di-resolve, lalu Voyage, lalu Mistral. Jika tidak ada remote key yang tersedia, pencarian memori
    tetap dinonaktifkan sampai Anda mengonfigurasinya. Jika Anda telah mengonfigurasi path model lokal
    dan path tersebut ada, OpenClaw
    lebih memilih `local`. Ollama didukung ketika Anda secara eksplisit menetapkan
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih memilih tetap lokal, setel `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda menginginkan embedding Gemini, setel
    `memorySearch.provider = "gemini"` dan sediakan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau local**
    - lihat [Memory](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Lokasi penyimpanan di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **status OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirimkan kepada mereka**.

    - **Lokal secara default:** sesi, file memori, konfigurasi, dan workspace berada di host Gateway
      (`~/.openclaw` + direktori workspace Anda).
    - **Remote karena kebutuhan:** pesan yang Anda kirim ke provider model (Anthropic/OpenAI/dll.) dikirim ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap di mesin Anda, tetapi lalu lintas
      channel tetap melewati server milik channel tersebut.

    Terkait: [Workspace agent](/id/concepts/agent-workspace), [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semua berada di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Konfigurasi utama (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth lama (disalin ke profil auth saat pertama kali digunakan) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profil auth (OAuth, API key, dan `keyRef`/`tokenRef` opsional)     |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret opsional berbasis file untuk provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas lama (entri `api_key` statis dibersihkan)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Status provider (misalnya `whatsapp/<accountId>/creds.json`)       |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per-agent (agentDir + sesi)                                 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & status (per agent)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agent)                                          |

    Path single-agent lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memori, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md seharusnya berada?">
    File-file ini berada di **workspace agent**, bukan `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (atau fallback lama `memory.md` saat `MEMORY.md` tidak ada),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opsional.
    - **Direktori status (`~/.openclaw`)**: konfigurasi, status channel/provider, profil auth, sesi, log,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan
    workspace yang sama pada setiap peluncuran (dan ingat: mode remote menggunakan **workspace milik host gateway**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke dalam
    AGENTS.md atau MEMORY.md** daripada mengandalkan riwayat chat.

    Lihat [Workspace agent](/id/concepts/agent-workspace) dan [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi backup yang direkomendasikan">
    Simpan **workspace agent** Anda di repo git **privat** dan backup ke tempat
    yang privat (misalnya GitHub private). Ini menangkap memori + file AGENTS/SOUL/USER
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    **Jangan** commit apa pun di bawah `~/.openclaw` (kredensial, sesi, token, atau payload secret terenkripsi).
    Jika Anda memerlukan pemulihan penuh, backup workspace dan direktori status
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Workspace agent](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Uninstall](/id/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agent bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memori, bukan sandbox keras.
    Path relatif di-resolve di dalam workspace, tetapi path absolut dapat mengakses lokasi
    host lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per-agent. Jika Anda
    ingin sebuah repo menjadi direktori kerja default, arahkan `workspace` agent tersebut
    ke root repo. Repo OpenClaw hanyalah source code; simpan
    workspace terpisah kecuali Anda memang sengaja ingin agent bekerja di dalamnya.

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

  <Accordion title="Mode remote: di mana penyimpanan sesi?">
    Status sesi dimiliki oleh **host gateway**. Jika Anda berada dalam mode remote, penyimpanan sesi yang penting bagi Anda berada di mesin remote, bukan di laptop lokal Anda. Lihat [Session management](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar konfigurasi

<AccordionGroup>
  <Accordion title="Apa format konfigurasinya? Di mana letaknya?">
    OpenClaw membaca konfigurasi **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, OpenClaw menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menetapkan gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan unauthorized'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
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
    - Jalur pemanggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak disetel.
    - Untuk auth kata sandi, setel `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak dapat di-resolve, resolusi gagal tertutup (tidak ada fallback remote yang menutupi).
    - Penyiapan shared-secret Control UI mengautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan app/UI). Mode berbasis identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header permintaan sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback pada host yang sama tetap **tidak** memenuhi auth trusted-proxy. Trusted proxy harus merupakan sumber non-loopback yang dikonfigurasi.

  </Accordion>

  <Accordion title="Mengapa saya sekarang memerlukan token di localhost?">
    OpenClaw menegakkan auth gateway secara default, termasuk loopback. Pada jalur default normal, itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway akan di-resolve ke mode token dan membuat token secara otomatis, lalu menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus mengautentikasi**. Ini memblokir proses lokal lain agar tidak bisa memanggil Gateway.

    Jika Anda lebih memilih jalur auth yang berbeda, Anda dapat secara eksplisit memilih mode kata sandi (atau, untuk reverse proxy sadar identitas non-loopback, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, setel `gateway.auth.mode: "none"` secara eksplisit di konfigurasi Anda. Doctor dapat membuat token untuk Anda kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah konfigurasi?">
    Gateway memantau konfigurasi dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): hot-apply perubahan yang aman, restart untuk perubahan yang kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Setel `cli.banner.taglineMode` di konfigurasi:

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
    - `default`: selalu menggunakan `All your chats, one OpenClaw.`.
    - `random`: tagline lucu/musiman yang bergilir (perilaku default).
    - Jika Anda tidak ingin banner sama sekali, setel env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan web search (dan web fetch)?">
    `web_fetch` berfungsi tanpa API key. `web_search` bergantung pada
    provider yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan API key normal mereka.
    - Ollama Web Search tidak memerlukan key, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo tidak memerlukan key, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG tidak memerlukan key/self-hosted; konfigurasikan `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
    Alternatif env:

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
              provider: "firecrawl", // opsional; hapus untuk deteksi otomatis
            },
          },
        },
    }
    ```

    Konfigurasi web-search khusus provider sekarang berada di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider lama `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak seharusnya digunakan untuk konfigurasi baru.
    Konfigurasi fallback web-fetch Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` diaktifkan secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw mendeteksi otomatis provider fallback fetch siap pertama dari kredensial yang tersedia. Saat ini provider bawaannya adalah Firecrawl.
    - Daemon membaca env var dari `~/.openclaw/.env` (atau environment layanan).

    Dokumentasi: [Web tools](/id/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus konfigurasi saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` mengganti **seluruh konfigurasi**. Jika Anda mengirim objek parsial, semua yang
    lain akan dihapus.

    Pemulihan:

    - Pulihkan dari backup (git atau salinan `~/.openclaw/openclaw.json`).
    - Jika Anda tidak punya backup, jalankan ulang `openclaw doctor` dan konfigurasikan ulang channel/model.
    - Jika ini tidak terduga, buat bug report dan sertakan konfigurasi terakhir yang Anda ketahui atau backup apa pun.
    - Agent coding lokal sering kali dapat merekonstruksi konfigurasi yang berfungsi dari log atau riwayat.

    Cara menghindarinya:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu saat Anda tidak yakin tentang path atau bentuk field yang tepat; ini mengembalikan node schema dangkal plus ringkasan child langsung untuk drill-down.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian konfigurasi penuh.
    - Jika Anda menggunakan tool `gateway` yang hanya untuk owner dari run agent, tool tersebut tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias lama `tools.bash.*` yang dinormalisasi ke path exec terlindungi yang sama).

    Dokumentasi: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola yang umum adalah **satu Gateway** (misalnya Raspberry Pi) plus **node** dan **agent**:

    - **Gateway (pusat):** memiliki channel (Signal/WhatsApp), routing, dan sesi.
    - **Node (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos tool lokal (`system.run`, `canvas`, `camera`).
    - **Agent (worker):** otak/workspace terpisah untuk peran khusus (misalnya "Hetzner ops", "Data pribadi").
    - **Sub-agent:** memunculkan pekerjaan latar belakang dari agent utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan berpindah agent/sesi.

    Dokumentasi: [Nodes](/id/nodes), [Remote access](/id/gateway/remote), [Multi-Agent Routing](/id/concepts/multi-agent), [Sub-agents](/id/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Bisakah browser OpenClaw berjalan headless?">
    Ya. Itu adalah opsi konfigurasi:

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

    Default-nya adalah `false` (headful). Mode headless lebih mungkin memicu pemeriksaan anti-bot di beberapa situs. Lihat [Browser](/id/tools/browser).

    Mode headless menggunakan **engine Chromium yang sama** dan berfungsi untuk sebagian besar otomatisasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda membutuhkan visual).
    - Beberapa situs lebih ketat terhadap otomatisasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Setel `browser.executablePath` ke binary Brave Anda (atau browser berbasis Chromium lainnya) dan restart Gateway.
    Lihat contoh konfigurasi lengkap di [Browser](/id/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remote dan node

<AccordionGroup>
  <Accordion title="Bagaimana perintah menyebar antara Telegram, gateway, dan node?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agent dan
    baru kemudian memanggil node melalui **Gateway WebSocket** saat tool node diperlukan:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node tidak melihat lalu lintas provider masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agent saya bisa mengakses komputer saya jika Gateway di-host secara remote?">
    Jawaban singkat: **pairing komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi dapat
    memanggil tool `node.*` (screen, camera, system) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/server rumahan).
    2. Tempatkan host Gateway + komputer Anda di tailnet yang sama.
    3. Pastikan WS Gateway dapat dijangkau (bind tailnet atau SSH tunnel).
    4. Buka aplikasi macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar dapat terdaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; node terhubung melalui Gateway WebSocket.

    Pengingat keamanan: pairing node macOS memungkinkan `system.run` di mesin tersebut. Hanya
    pairing perangkat yang Anda percayai, dan tinjau [Security](/id/gateway/security).

    Dokumentasi: [Nodes](/id/nodes), [Gateway protocol](/id/gateway/protocol), [macOS remote mode](/id/platforms/mac/remote), [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Sekarang bagaimana?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Health Gateway: `openclaw status`
    - Health channel: `openclaw channels status`

    Lalu verifikasi auth dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` disetel dengan benar.
    - Jika Anda terhubung melalui SSH tunnel, pastikan tunnel lokal aktif dan mengarah ke port yang benar.
    - Pastikan allowlist Anda (DM atau grup) mencakup akun Anda.

    Dokumentasi: [Tailscale](/id/gateway/tailscale), [Remote access](/id/gateway/remote), [Channels](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw saling berbicara (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-ke-bot" bawaan, tetapi Anda dapat menghubungkannya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat normal yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Minta Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika salah satu bot berada di VPS remote, arahkan CLI Anda ke Gateway remote tersebut
    melalui SSH/Tailscale (lihat [Remote access](/id/gateway/remote)).

    Contoh pola (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak berulang tanpa henti (hanya bila disebut, channel
    allowlist, atau aturan "jangan membalas pesan bot").

    Dokumentasi: [Remote access](/id/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/id/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agent?">
    Tidak. Satu Gateway dapat meng-host beberapa agent, masing-masing dengan workspace, model default,
    dan routing sendiri. Itu adalah penyiapan normal dan jauh lebih murah serta lebih sederhana daripada menjalankan
    satu VPS per agent.

    Gunakan VPS terpisah hanya saat Anda memerlukan isolasi yang kuat (batas keamanan) atau konfigurasi yang sangat
    berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan beberapa agent atau sub-agent.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya alih-alih SSH dari VPS?">
    Ya - node adalah cara kelas satu untuk menjangkau laptop Anda dari Gateway remote, dan mereka
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    bersifat ringan (VPS kecil atau mesin setara Raspberry Pi sudah cukup; RAM 4 GB lebih dari cukup), jadi penyiapan
    yang umum adalah host yang selalu aktif plus laptop Anda sebagai node.

    - **Tidak perlu SSH masuk.** Node terhubung keluar ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi lebih aman.** `system.run` dibatasi oleh allowlist/persetujuan node di laptop tersebut.
    - **Lebih banyak tool perangkat.** Node mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Otomatisasi browser lokal.** Simpan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui host node di laptop, atau lampirkan ke Chrome lokal di host melalui Chrome MCP.

    SSH tidak masalah untuk akses shell ad-hoc, tetapi node lebih sederhana untuk alur kerja agent yang berkelanjutan dan
    otomatisasi perangkat.

    Dokumentasi: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Browser](/id/tools/browser).

  </Accordion>

  <Accordion title="Apakah node menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Multiple gateways](/id/gateway/multiple-gateways)). Node adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "mode node" macOS di aplikasi menubar). Untuk host node headless
    dan kontrol CLI, lihat [Node host CLI](/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan konfigurasi?">
    Ya.

    - `config.schema.lookup`: periksa satu subtree konfigurasi dengan node schema dangkalnya, hint UI yang cocok, dan ringkasan child langsung sebelum menulis
    - `config.get`: ambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial yang aman (lebih disukai untuk sebagian besar edit RPC); hot-reload bila memungkinkan dan restart bila diperlukan
    - `config.apply`: validasi + ganti konfigurasi penuh; hot-reload bila memungkinkan dan restart bila diperlukan
    - Tool runtime `gateway` yang hanya untuk owner tetap menolak penulisan ulang `tools.exec.ask` / `tools.exec.security`; alias lama `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama

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

    1. **Pasang + login di VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Pasang + login di Mac Anda**
       - Gunakan aplikasi Tailscale dan login ke tailnet yang sama.
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

  <Accordion title="Bagaimana cara menghubungkan node Mac ke Gateway remote (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Node terhubung melalui endpoint Gateway WS yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan aplikasi macOS dalam mode Remote** (target SSH dapat berupa hostname tailnet).
       Aplikasi akan men-tunnel port Gateway dan terhubung sebagai node.
    3. **Setujui node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Gateway protocol](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [macOS remote mode](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sebaiknya saya memasang di laptop kedua atau cukup menambahkan node?">
    Jika Anda hanya memerlukan **tool lokal** (screen/camera/exec) di laptop kedua, tambahkan saja sebagai
    **node**. Itu mempertahankan satu Gateway dan menghindari konfigurasi ganda. Tool node lokal
    saat ini hanya untuk macOS, tetapi kami berencana memperluasnya ke OS lain.

    Pasang Gateway kedua hanya saat Anda memerlukan **isolasi yang kuat** atau dua bot yang sepenuhnya terpisah.

    Dokumentasi: [Nodes](/id/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env var dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat environment variable?">
    OpenClaw membaca env var dari proses induk (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari current working directory
    - fallback `.env` global dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Tidak ada file `.env` yang menimpa env var yang sudah ada.

    Anda juga dapat mendefinisikan env var inline di konfigurasi (hanya diterapkan jika hilang dari env proses):

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

  <Accordion title="Saya memulai Gateway melalui layanan dan env var saya hilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Masukkan key yang hilang ke `~/.openclaw/.env` agar tetap diambil meskipun layanan tidak mewarisi env shell Anda.
    2. Aktifkan import shell (kemudahan opsional):

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

    Ini menjalankan login shell Anda dan hanya mengimpor key yang diharapkan dan hilang (tidak pernah menimpa). Padanan env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menetapkan COPILOT_GITHUB_TOKEN, tetapi models status menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **import env shell** diaktifkan. "Shell env: off"
    **tidak** berarti env var Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    login shell Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), Gateway tidak akan mewarisi
    environment shell Anda. Perbaiki dengan melakukan salah satu dari ini:

    1. Masukkan token ke `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan import shell (`env.shellEnv.enabled: true`).
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
    Kirim `/new` atau `/reset` sebagai pesan mandiri. Lihat [Session management](/id/concepts/session).
  </Accordion>

  <Accordion title="Apakah sesi reset otomatis jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Setel ke nilai positif untuk mengaktifkan kedaluwarsa idle. Saat diaktifkan, pesan **berikutnya**
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

  <Accordion title="Apakah ada cara untuk membuat tim instance OpenClaw (satu CEO dan banyak agent)?">
    Ya, melalui **multi-agent routing** dan **sub-agent**. Anda dapat membuat satu agent
    koordinator dan beberapa agent pekerja dengan workspace dan model mereka sendiri.

    Meski begitu, ini sebaiknya dilihat sebagai **eksperimen yang menyenangkan**. Ini memakan banyak token dan sering kali
    kurang efisien daripada menggunakan satu bot dengan sesi terpisah. Model umum yang kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot itu
    juga dapat memunculkan sub-agent saat diperlukan.

    Dokumentasi: [Multi-agent routing](/id/concepts/multi-agent), [Sub-agents](/id/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, output tool besar, atau banyak
    file dapat memicu Compaction atau pemotongan.

    Yang membantu:

    - Minta bot merangkum status saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agent untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
    - Pilih model dengan jendela konteks yang lebih besar jika ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mereset OpenClaw sepenuhnya tetapi tetap memasangnya?">
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
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap direktori status (default adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus konfigurasi dev + kredensial + sesi + workspace).

  </Accordion>

  <Accordion title='Saya mendapatkan error "context too large" - bagaimana cara reset atau compact?'>
    Gunakan salah satu dari ini:

    - **Compact** (mempertahankan percakapan tetapi merangkum giliran yang lebih lama):

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

    - Aktifkan atau sesuaikan **session pruning** (`agents.defaults.contextPruning`) untuk memangkas output tool lama.
    - Gunakan model dengan jendela konteks yang lebih besar.

    Dokumentasi: [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning), [Session management](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa
    `input` yang diwajibkan. Biasanya berarti riwayat sesi sudah basi atau rusak (sering setelah thread panjang
    atau perubahan tool/schema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapatkan pesan Heartbeat setiap 30 menit?">
    Heartbeat berjalan setiap **30m** secara default (**1h** saat menggunakan auth OAuth). Sesuaikan atau nonaktifkan:

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

    Jika `HEARTBEAT.md` ada tetapi secara efektif kosong (hanya baris kosong dan header
    markdown seperti `# Heading`), OpenClaw melewati run Heartbeat untuk menghemat panggilan API.
    Jika file tidak ada, Heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per-agent menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda ada di grup itu, OpenClaw dapat melihatnya.
    Secara default, balasan grup diblokir sampai Anda mengizinkan pengirim (`groupPolicy: "allowlist"`).

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
    Opsi 1 (tercepat): ikuti log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari konfigurasi:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Pembatasan mention aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup tersebut tidak ada di allowlist.

    Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung collapse ke sesi utama secara default. Grup/channel memiliki kunci sesi sendiri, dan topik Telegram / thread Discord adalah sesi terpisah. Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agent yang bisa saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sesi + transkrip berada di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agent berarti lebih banyak penggunaan model secara bersamaan.
    - **Overhead operasional:** profil auth, workspace, dan routing channel per-agent.

    Tip:

    - Pertahankan satu workspace **aktif** per agent (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus entri JSONL atau store) jika disk membesar.
    - Gunakan `openclaw doctor` untuk menemukan workspace liar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat sekaligus (Slack), dan bagaimana sebaiknya saya menyiapkannya?">
    Ya. Gunakan **Multi-Agent Routing** untuk menjalankan beberapa agent terisolasi dan merutekan pesan masuk berdasarkan
    channel/akun/peer. Slack didukung sebagai channel dan dapat diikat ke agent tertentu.

    Akses browser sangat kuat tetapi bukan berarti "bisa melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA tetap
    dapat memblokir otomatisasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP di mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Host Gateway yang selalu aktif (VPS/Mac mini).
    - Satu agent per peran (binding).
    - Channel Slack yang diikat ke agent tersebut.
    - Browser lokal melalui Chrome MCP atau node jika diperlukan.

    Dokumentasi: [Multi-Agent Routing](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/id/tools/browser), [Nodes](/id/nodes).

  </Accordion>
</AccordionGroup>

## Model: default, pemilihan, alias, peralihan

<AccordionGroup>
  <Accordion title='Apa itu "model default"?'>
    Model default OpenClaw adalah apa pun yang Anda setel sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model dirujuk sebagai `provider/model` (contoh: `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw pertama-tama mencoba alias, lalu kecocokan configured-provider unik untuk ID model yang tepat, dan baru kemudian fallback ke provider default yang dikonfigurasi sebagai jalur kompatibilitas lama. Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw akan fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default provider yang sudah usang dan dihapus. Anda tetap sebaiknya **secara eksplisit** menetapkan `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia dalam stack provider Anda.
    **Untuk agent dengan tool atau input yang tidak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rutekan berdasarkan peran agent.

    MiniMax memiliki dokumentasi sendiri: [MiniMax](/id/providers/minimax) dan
    [Local models](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agent dan menggunakan sub-agent untuk
    memparalelkan tugas panjang (setiap sub-agent mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap prompt
    injection dan perilaku yang tidak aman. Lihat [Security](/id/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus konfigurasi saya?">
    Gunakan **perintah model** atau edit hanya field **model**. Hindari penggantian konfigurasi penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui konfigurasi model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang ingin mengganti seluruh konfigurasi.
    Untuk edit RPC, periksa terlebih dahulu dengan `config.schema.lookup` dan pilih `config.patch`. Payload lookup memberi Anda path yang dinormalisasi, dokumentasi/kendala schema dangkal, dan ringkasan child langsung.
    untuk pembaruan parsial.
    Jika Anda memang menimpa konfigurasi, pulihkan dari backup atau jalankan ulang `openclaw doctor` untuk memperbaikinya.

    Dokumentasi: [Models](/id/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur paling mudah untuk model lokal.

    Penyiapan tercepat:

    1. Pasang Ollama dari `https://ollama.com/download`
    2. Pull model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan tool.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist tool yang ketat.

    Dokumentasi: [Ollama](/id/providers/ollama), [Local models](/id/gateway/local-models),
    [Model providers](/id/concepts/model-providers), [Security](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini bisa berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini di setiap gateway dengan `openclaw models status`.
    - Untuk agent yang sensitif terhadap keamanan/menggunakan tool, gunakan model generasi terbaru terkuat yang tersedia.
  </Accordion>

  <Accordion title="Bagaimana cara mengganti model secara langsung (tanpa restart)?">
    Gunakan perintah `/model` sebagai pesan mandiri:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Ini adalah alias bawaan. Alias kustom dapat ditambahkan melalui `agents.defaults.models`.

    Anda dapat melihat daftar model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

    `/model` (dan `/model list`) menampilkan pemilih ringkas bernomor. Pilih berdasarkan nomor:

    ```
    /model 3
    ```

    Anda juga dapat memaksa profil auth tertentu untuk provider tersebut (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agent mana yang aktif, file `auth-profiles.json` mana yang digunakan, dan profil auth mana yang akan dicoba berikutnya.
    Ini juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

    **Bagaimana cara melepaskan pin profil yang saya setel dengan @profile?**

    Jalankan ulang `/model` **tanpa** akhiran `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk memastikan profil auth mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.2 untuk tugas harian dan Codex 5.3 untuk coding?">
    Ya. Tetapkan satu sebagai default dan ganti sesuai kebutuhan:

    - **Peralihan cepat (per sesi):** `/model gpt-5.4` untuk tugas harian, `/model openai-codex/gpt-5.4` untuk coding dengan OAuth Codex.
    - **Default + peralihan:** setel `agents.defaults.model.primary` ke `openai/gpt-5.4`, lalu ganti ke `openai-codex/gpt-5.4` saat coding (atau sebaliknya).
    - **Sub-agent:** rute tugas coding ke sub-agent dengan model default yang berbeda.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi fast mode untuk GPT 5.4?">
    Gunakan toggle sesi atau default konfigurasi:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.4` atau `openai-codex/gpt-5.4`.
    - **Default per model:** setel `agents.defaults.models["openai/gpt-5.4"].params.fastMode` ke `true`.
    - **OAuth Codex juga:** jika Anda juga menggunakan `openai-codex/gpt-5.4`, setel flag yang sama di sana.

    Contoh:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Untuk OpenAI, fast mode dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override sesi `/fast` mengalahkan default konfigurasi.

    Lihat [Thinking and fast mode](/id/tools/thinking) dan [OpenAI fast mode](/id/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan override
    sesi apa pun. Memilih model yang tidak ada dalam daftar itu akan mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model tersebut ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ditemukan konfigurasi provider MiniMax atau
    profil auth), sehingga model tidak dapat di-resolve.

    Checklist perbaikan:

    1. Upgrade ke rilis OpenClaw terbaru (atau jalankan dari source `main`), lalu restart gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/profil auth sehingga provider yang cocok bisa diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth yang tersimpan untuk `minimax-portal`).
    3. Gunakan ID model yang tepat (peka huruf besar/kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       API key, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       lalu pilih dari daftar (atau `/model list` di chat).

    Lihat [MiniMax](/id/providers/minimax) dan [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan ganti model **per sesi** saat diperlukan.
    Fallback untuk **error**, bukan "tugas sulit", jadi gunakan `/model` atau agent terpisah.

    **Opsi A: ganti per sesi**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Lalu:

    ```
    /model gpt
    ```

    **Opsi B: agent terpisah**

    - Default Agent A: MiniMax
    - Default Agent B: OpenAI
    - Rute berdasarkan agent atau gunakan `/agent` untuk beralih

    Dokumentasi: [Models](/id/concepts/models), [Multi-Agent Routing](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah shortcut bawaan?">
    Ya. OpenClaw menyediakan beberapa shorthand default (hanya diterapkan saat model tersebut ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menetapkan alias sendiri dengan nama yang sama, nilai Anda yang akan menang.

  </Accordion>

  <Accordion title="Bagaimana cara mendefinisikan/menimpa shortcut model (alias)?">
    Alias berasal dari `agents.defaults.models.<modelId>.alias`. Contoh:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Lalu `/model sonnet` (atau `/<alias>` saat didukung) akan di-resolve ke ID model tersebut.

  </Accordion>

  <Accordion title="Bagaimana cara menambahkan model dari provider lain seperti OpenRouter atau Z.AI?">
    OpenRouter (bayar per token; banyak model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (model GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jika Anda merujuk provider/model tetapi key provider yang diperlukan tidak ada, Anda akan mendapatkan error auth runtime (misalnya `No API key found for provider "zai"`).

    **No API key found for provider setelah menambahkan agent baru**

    Ini biasanya berarti **agent baru** memiliki penyimpanan auth kosong. Auth bersifat per-agent dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan auth selama wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agent utama ke `agentDir` agent baru.

    **Jangan** menggunakan kembali `agentDir` di beberapa agent; itu menyebabkan benturan auth/sesi.

  </Accordion>
</AccordionGroup>

## Model failover dan "All models failed"

<AccordionGroup>
  <Accordion title="Bagaimana failover bekerja?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi profil auth** di dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku untuk profil yang gagal (exponential backoff), sehingga OpenClaw dapat tetap membalas bahkan saat provider terkena rate limit atau gagal sementara.

    Bucket rate limit mencakup lebih dari sekadar respons `429`. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    rate limit yang layak untuk failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada dalam bucket sementara itu. Jika provider mengembalikan
    teks penagihan eksplisit pada `401` atau `403`, OpenClaw masih bisa menyimpannya di
    jalur penagihan, tetapi pencocok teks khusus provider tetap dibatasi pada
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika sebuah pesan `402`
    justru tampak seperti jendela penggunaan yang bisa dicoba ulang atau
    batas pengeluaran organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan penagihan jangka panjang.

    Error overflow konteks berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada pada jalur Compaction/retry alih-alih memajukan
    fallback model.

    Teks error server generik sengaja dibuat lebih sempit daripada "apa pun yang
    mengandung unknown/error". OpenClaw memang memperlakukan bentuk sementara yang terikat ke provider
    seperti bare Anthropic `An unknown error occurred`, bare OpenRouter
    `Provider returned error`, error stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server sementara
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider-sibuk seperti `ModelNotReadyException` sebagai
    sinyal timeout/overload yang layak untuk failover saat konteks provider
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu fallback model dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Artinya sistem mencoba menggunakan ID profil auth `anthropic:default`, tetapi tidak dapat menemukan kredensial untuk profil tersebut di penyimpanan auth yang diharapkan.

    **Checklist perbaikan:**

    - **Konfirmasi lokasi profil auth** (path baru vs lama)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Konfirmasi env var Anda dimuat oleh Gateway**
      - Jika Anda menetapkan `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Masukkan ke `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda sedang mengedit agent yang benar**
      - Penyiapan multi-agent berarti bisa ada beberapa file `auth-profiles.json`.
    - **Periksa kewarasan status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider telah diautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti run dipin ke profil auth Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan auth.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` di host gateway.
    - **Jika Anda ingin menggunakan API key sebagai gantinya**
      - Masukkan `ANTHROPIC_API_KEY` ke `~/.openclaw/.env` di **host gateway**.
      - Hapus urutan pin apa pun yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Pastikan Anda menjalankan perintah di host gateway**
      - Dalam mode remote, profil auth berada di mesin gateway, bukan di laptop Anda.

  </Accordion>

  <Accordion title="Mengapa OpenClaw juga mencoba Google Gemini lalu gagal?">
    Jika konfigurasi model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya selama fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak diarahkan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **thinking block tanpa signature** (sering dari
    stream yang dibatalkan/sebagian). Google Antigravity memerlukan signature untuk thinking block.

    Perbaikan: OpenClaw sekarang menghapus thinking block tanpa signature untuk Claude Google Antigravity. Jika masih muncul, mulai **sesi baru** atau setel `/thinking off` untuk agent tersebut.

  </Accordion>
</AccordionGroup>

## Profil auth: apa itu dan bagaimana mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil auth?">
    Profil auth adalah catatan kredensial bernama (OAuth atau API key) yang terikat ke provider. Profil berada di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Apa ID profil yang umum?">
    OpenClaw menggunakan ID berawalan provider seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (misalnya `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol profil auth mana yang dicoba terlebih dahulu?">
    Ya. Konfigurasi mendukung metadata opsional untuk profil dan urutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat sementara melewati sebuah profil jika berada dalam **cooldown** singkat (rate limit/timeout/kegagalan auth) atau status **disabled** yang lebih panjang (penagihan/kredit tidak cukup). Untuk memeriksa ini, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyesuaian: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate limit dapat dibatasi ke model. Profil yang sedang cooldown
    untuk satu model masih bisa digunakan untuk model saudara pada provider yang sama,
    sementara jendela penagihan/disabled tetap memblokir seluruh profil.

    Anda juga dapat menetapkan override urutan **per-agent** (disimpan di `auth-state.json` milik agent tersebut) melalui CLI:

    ```bash
    # Default ke agent default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profil (hanya coba yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback di dalam provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Hapus override (fallback ke config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Untuk menargetkan agent tertentu:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Untuk memverifikasi apa yang benar-benar akan dicoba, gunakan:

    ```bash
    openclaw models status --probe
    ```

    Jika sebuah profil yang tersimpan dihilangkan dari urutan eksplisit, probe akan melaporkan
    `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs API key - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **API key** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan API key.

  </Accordion>
</AccordionGroup>

## Gateway: port, "already running", dan mode remote

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port multipleks untuk WebSocket + HTTP (Control UI, hook, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "Connectivity probe: failed"?'>
    Karena "running" adalah tampilan **supervisor** (launchd/systemd/schtasks). Connectivity probe adalah CLI yang benar-benar terhubung ke Gateway WebSocket.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar terikat di port)
    - `Last gateway error:` (akar masalah umum saat proses hidup tetapi port tidak listen)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" berbeda?'>
    Anda sedang mengedit satu file konfigurasi sementara layanan menjalankan file yang lain (sering kali karena ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / environment yang sama yang ingin Anda gunakan untuk layanan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menegakkan runtime lock dengan langsung bind listener WebSocket saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, OpenClaw akan melempar `GatewayLockError` yang menandakan instance lain sudah listen.

    Perbaikan: hentikan instance lain, kosongkan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode remote (klien terhubung ke Gateway di tempat lain)?">
    Setel `gateway.mode: "remote"` dan arahkan ke URL WebSocket remote, opsional dengan kredensial remote shared-secret:

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
    - Aplikasi macOS memantau file konfigurasi dan mengganti mode secara langsung saat nilai-nilai ini berubah.
    - `gateway.remote.token` / `.password` adalah kredensial remote sisi klien saja; keduanya tidak mengaktifkan auth gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus reconnect). Sekarang bagaimana?'>
    Jalur auth gateway Anda dan metode auth UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL gateway yang dipilih, sehingga refresh di tab yang sama tetap berfungsi tanpa memulihkan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan device token yang di-cache saat gateway mengembalikan hint retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry token-cache itu sekarang menggunakan kembali scope yang disetujui dan di-cache yang disimpan bersama device token. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan kumpulan scope yang diminta alih-alih mewarisi scope cache.
    - Di luar jalur retry itu, prioritas auth connect adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu device token tersimpan, lalu bootstrap token.
    - Pemeriksaan scope bootstrap menggunakan prefiks role. Allowlist operator bootstrap bawaan hanya memenuhi permintaan operator; node atau role non-operator lain tetap memerlukan scope di bawah prefiks role mereka sendiri.

    Perbaikan:

    - Paling cepat: `openclaw dashboard` (mencetak + menyalin URL dashboard, mencoba membukanya; menampilkan petunjuk SSH jika headless).
    - Jika Anda belum memiliki token: `openclaw doctor --generate-gateway-token`.
    - Jika remote, buat tunnel dulu: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`.
    - Mode shared-secret: setel `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` atau `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, lalu tempel secret yang cocok di pengaturan Control UI.
    - Mode Tailscale Serve: pastikan `gateway.auth.allowTailscale` diaktifkan dan Anda membuka URL Serve, bukan URL loopback/tailnet mentah yang melewati header identitas Tailscale.
    - Mode trusted-proxy: pastikan Anda masuk melalui proxy sadar identitas non-loopback yang dikonfigurasi, bukan proxy loopback host yang sama atau URL gateway mentah.
    - Jika ketidakcocokan tetap ada setelah satu retry, putar/setujui ulang paired device token:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Jika panggilan rotate itu mengatakan ditolak, periksa dua hal:
      - sesi paired-device hanya dapat memutar **device miliknya sendiri** kecuali juga memiliki `operator.admin`
      - nilai `--scope` eksplisit tidak boleh melebihi scope operator milik pemanggil saat ini
    - Masih buntu? Jalankan `openclaw status --all` dan ikuti [Troubleshooting](/id/gateway/troubleshooting). Lihat [Dashboard](/web/dashboard) untuk detail auth.

  </Accordion>

  <Accordion title="Saya menetapkan gateway.bind tailnet tetapi tidak bisa bind dan tidak ada yang listen">
    Bind `tailnet` memilih IP Tailscale dari interface jaringan Anda (100.64.0.0/10). Jika mesin tidak berada di Tailscale (atau interfacenya mati), tidak ada yang bisa di-bind.

    Perbaikan:

    - Mulai Tailscale di host tersebut (agar memiliki alamat 100.x), atau
    - Ganti ke `gateway.bind: "loopback"` / `"lan"`.

    Catatan: `tailnet` bersifat eksplisit. `auto` lebih memilih loopback; gunakan `gateway.bind: "tailnet"` saat Anda menginginkan bind khusus tailnet.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa Gateway di host yang sama?">
    Biasanya tidak - satu Gateway dapat menjalankan beberapa channel pesan dan agent. Gunakan beberapa Gateway hanya saat Anda memerlukan redundansi (mis: bot penyelamat) atau isolasi yang kuat.

    Ya, tetapi Anda harus mengisolasi:

    - `OPENCLAW_CONFIG_PATH` (konfigurasi per-instance)
    - `OPENCLAW_STATE_DIR` (status per-instance)
    - `agents.defaults.workspace` (isolasi workspace)
    - `gateway.port` (port unik)

    Penyiapan cepat (direkomendasikan):

    - Gunakan `openclaw --profile <name> ...` per instance (otomatis membuat `~/.openclaw-<name>`).
    - Setel `gateway.port` yang unik di setiap konfigurasi profil (atau berikan `--port` untuk run manual).
    - Pasang layanan per-profil: `openclaw --profile <name> gateway install`.

    Profil juga menambahkan sufiks pada nama layanan (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Panduan lengkap: [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Apa arti "invalid handshake" / kode 1008?'>
    Gateway adalah **server WebSocket**, dan Gateway mengharapkan pesan pertama
    berupa frame `connect`. Jika Gateway menerima hal lain, Gateway menutup koneksi
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

    Detail protokol: [Gateway protocol](/id/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging dan debugging

<AccordionGroup>
  <Accordion title="Di mana log berada?">
    Log file (terstruktur):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Anda dapat menetapkan path yang stabil melalui `logging.file`. Level log file dikendalikan oleh `logging.level`. Verbositas konsol dikendalikan oleh `--verbose` dan `logging.consoleLevel`.

    Mengikuti log tercepat:

    ```bash
    openclaw logs --follow
    ```

    Log layanan/supervisor (saat gateway berjalan melalui launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` dan `gateway.err.log` (default: `~/.openclaw/logs/...`; profil menggunakan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Lihat [Troubleshooting](/id/gateway/troubleshooting) untuk informasi lebih lanjut.

  </Accordion>

  <Accordion title="Bagaimana cara memulai/menghentikan/memulai ulang layanan Gateway?">
    Gunakan helper gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda menjalankan gateway secara manual, `openclaw gateway --force` dapat mengambil kembali port. Lihat [Gateway](/id/gateway).

  </Accordion>

  <Accordion title="Saya menutup terminal di Windows - bagaimana cara memulai ulang OpenClaw?">
    Ada **dua mode instalasi Windows**:

    **1) WSL2 (direkomendasikan):** Gateway berjalan di dalam Linux.

    Buka PowerShell, masuk ke WSL, lalu restart:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Jika Anda belum pernah memasang layanan, mulai di foreground:

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

    Dokumentasi: [Windows (WSL2)](/id/platforms/windows), [Gateway service runbook](/id/gateway).

  </Accordion>

  <Accordion title="Gateway aktif tetapi balasan tidak pernah datang. Apa yang harus saya periksa?">
    Mulailah dengan sapuan health cepat:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Penyebab umum:

    - Auth model tidak dimuat di **host gateway** (periksa `models status`).
    - Pairing/allowlist channel memblokir balasan (periksa konfigurasi channel + log).
    - WebChat/Dashboard dibuka tanpa token yang benar.

    Jika Anda remote, pastikan tunnel/koneksi Tailscale aktif dan bahwa
    Gateway WebSocket dapat dijangkau.

    Dokumentasi: [Channels](/id/channels), [Troubleshooting](/id/gateway/troubleshooting), [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - sekarang bagaimana?'>
    Ini biasanya berarti UI kehilangan koneksi WebSocket. Periksa:

    1. Apakah Gateway berjalan? `openclaw gateway status`
    2. Apakah Gateway sehat? `openclaw status`
    3. Apakah UI memiliki token yang benar? `openclaw dashboard`
    4. Jika remote, apakah tautan tunnel/Tailscale aktif?

    Lalu ikuti log:

    ```bash
    openclaw logs --follow
    ```

    Dokumentasi: [Dashboard](/web/dashboard), [Remote access](/id/gateway/remote), [Troubleshooting](/id/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands Telegram gagal. Apa yang harus saya periksa?">
    Mulailah dengan log dan status channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Lalu cocokkan error-nya:

    - `BOT_COMMANDS_TOO_MUCH`: menu Telegram memiliki terlalu banyak entri. OpenClaw sudah memangkasnya ke batas Telegram dan mencoba ulang dengan perintah yang lebih sedikit, tetapi beberapa entri menu masih perlu dihapus. Kurangi perintah plugin/skill/kustom, atau nonaktifkan `channels.telegram.commands.native` jika Anda tidak memerlukan menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, atau error jaringan serupa: jika Anda berada di VPS atau di belakang proxy, pastikan HTTPS keluar diizinkan dan DNS berfungsi untuk `api.telegram.org`.

    Jika Gateway bersifat remote, pastikan Anda melihat log di host Gateway.

    Dokumentasi: [Telegram](/id/channels/telegram), [Channel troubleshooting](/id/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI tidak menampilkan output. Apa yang harus saya periksa?">
    Pertama pastikan Gateway dapat dijangkau dan agent dapat berjalan:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Di TUI, gunakan `/status` untuk melihat status saat ini. Jika Anda mengharapkan balasan di channel
    chat, pastikan delivery diaktifkan (`/deliver on`).

    Dokumentasi: [TUI](/web/tui), [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara menghentikan sepenuhnya lalu memulai Gateway?">
    Jika Anda memasang layanan:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Ini menghentikan/memulai **layanan yang disupervisi** (launchd di macOS, systemd di Linux).
    Gunakan ini saat Gateway berjalan di latar belakang sebagai daemon.

    Jika Anda menjalankannya di foreground, hentikan dengan Ctrl-C, lalu:

    ```bash
    openclaw gateway run
    ```

    Dokumentasi: [Gateway service runbook](/id/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: memulai ulang **layanan latar belakang** (launchd/systemd).
    - `openclaw gateway`: menjalankan gateway **di foreground** untuk sesi terminal ini.

    Jika Anda telah memasang layanannya, gunakan perintah gateway. Gunakan `openclaw gateway` saat
    Anda menginginkan run foreground satu kali.

  </Accordion>

  <Accordion title="Cara tercepat untuk mendapatkan detail lebih banyak saat sesuatu gagal">
    Mulai Gateway dengan `--verbose` untuk mendapatkan detail konsol yang lebih banyak. Lalu periksa file log untuk auth channel, routing model, dan error RPC.
  </Accordion>
</AccordionGroup>

## Media dan lampiran

<AccordionGroup>
  <Accordion title="Skill saya menghasilkan gambar/PDF, tetapi tidak ada yang dikirim">
    Lampiran keluar dari agent harus menyertakan baris `MEDIA:<path-or-url>` (di barisnya sendiri). Lihat [OpenClaw assistant setup](/id/start/openclaw) dan [Agent send](/id/tools/agent-send).

    Pengiriman CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Periksa juga:

    - Channel target mendukung media keluar dan tidak diblokir oleh allowlist.
    - File berada dalam batas ukuran provider (gambar diubah ukurannya menjadi maksimal 2048px).
    - `tools.fs.workspaceOnly=true` menjaga pengiriman path lokal tetap dibatasi ke workspace, temp/media-store, dan file yang tervalidasi sandbox.
    - `tools.fs.workspaceOnly=false` memungkinkan `MEDIA:` mengirim file lokal host yang sudah dapat dibaca agent, tetapi hanya untuk media plus jenis dokumen aman (gambar, audio, video, PDF, dan dokumen Office). File teks biasa dan file yang mirip secret tetap diblokir.

    Lihat [Images](/id/nodes/images).

  </Accordion>
</AccordionGroup>

## Keamanan dan kontrol akses

<AccordionGroup>
  <Accordion title="Apakah aman mengekspos OpenClaw ke DM masuk?">
    Perlakukan DM masuk sebagai input yang tidak tepercaya. Default dirancang untuk mengurangi risiko:

    - Perilaku default pada channel yang mendukung DM adalah **pairing**:
      - Pengirim yang tidak dikenal menerima kode pairing; bot tidak memproses pesannya.
      - Setujui dengan: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Permintaan tertunda dibatasi hingga **3 per channel**; periksa `openclaw pairing list --channel <channel> [--account <id>]` jika kode tidak datang.
    - Membuka DM secara publik memerlukan opt-in eksplisit (`dmPolicy: "open"` dan allowlist `"*"`).

    Jalankan `openclaw doctor` untuk menampilkan kebijakan DM yang berisiko.

  </Accordion>

  <Accordion title="Apakah prompt injection hanya menjadi perhatian untuk bot publik?">
    Tidak. Prompt injection berkaitan dengan **konten yang tidak tepercaya**, bukan hanya siapa yang bisa mengirim DM ke bot.
    Jika asisten Anda membaca konten eksternal (web search/fetch, halaman browser, email,
    dokumen, lampiran, log yang ditempel), konten itu bisa menyertakan instruksi yang mencoba
    membajak model. Ini bisa terjadi bahkan jika **Anda adalah satu-satunya pengirim**.

    Risiko terbesar muncul saat tool diaktifkan: model bisa ditipu untuk
    mengekstrak konteks atau memanggil tool atas nama Anda. Kurangi blast radius dengan:

    - menggunakan agent "pembaca" read-only atau tanpa tool untuk merangkum konten yang tidak tepercaya
    - membiarkan `web_search` / `web_fetch` / `browser` nonaktif untuk agent yang mengaktifkan tool
    - memperlakukan teks file/dokumen yang didekodekan juga sebagai tidak tepercaya: OpenResponses
      `input_file` dan ekstraksi media-attachment keduanya membungkus teks yang diekstrak di dalam
      penanda batas konten eksternal yang eksplisit alih-alih meneruskan teks file mentah
    - sandboxing dan allowlist tool yang ketat

    Detail: [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Haruskah bot saya memiliki email, akun GitHub, atau nomor telepon sendiri?">
    Ya, untuk sebagian besar penyiapan. Mengisolasi bot dengan akun dan nomor telepon terpisah
    mengurangi blast radius jika terjadi kesalahan. Ini juga mempermudah untuk memutar
    kredensial atau mencabut akses tanpa memengaruhi akun pribadi Anda.

    Mulailah dari yang kecil. Berikan akses hanya ke tool dan akun yang benar-benar Anda perlukan, lalu perluas
    nanti jika dibutuhkan.

    Dokumentasi: [Security](/id/gateway/security), [Pairing](/id/channels/pairing).

  </Accordion>

  <Accordion title="Bisakah saya memberinya otonomi atas pesan teks saya dan apakah itu aman?">
    Kami **tidak** merekomendasikan otonomi penuh atas pesan pribadi Anda. Pola yang paling aman adalah:

    - Pertahankan DM dalam **mode pairing** atau allowlist yang ketat.
    - Gunakan **nomor atau akun terpisah** jika Anda ingin bot mengirim pesan atas nama Anda.
    - Biarkan bot membuat draf, lalu **setujui sebelum mengirim**.

    Jika Anda ingin bereksperimen, lakukan di akun khusus dan tetap jaga tetap terisolasi. Lihat
    [Security](/id/gateway/security).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang lebih murah untuk tugas asisten pribadi?">
    Ya, **jika** agent hanya untuk chat dan inputnya tepercaya. Tier yang lebih kecil
    lebih rentan terhadap pembajakan instruksi, jadi hindari untuk agent yang mengaktifkan tool
    atau saat membaca konten yang tidak tepercaya. Jika Anda harus menggunakan model yang lebih kecil, kunci
    tool dan jalankan di dalam sandbox. Lihat [Security](/id/gateway/security).
  </Accordion>

  <Accordion title="Saya menjalankan /start di Telegram tetapi tidak mendapat kode pairing">
    Kode pairing dikirim **hanya** saat pengirim yang tidak dikenal mengirim pesan ke bot dan
    `dmPolicy: "pairing"` diaktifkan. `/start` sendiri tidak menghasilkan kode.

    Periksa permintaan tertunda:

    ```bash
    openclaw pairing list telegram
    ```

    Jika Anda ingin akses segera, masukkan sender id Anda ke allowlist atau setel `dmPolicy: "open"`
    untuk akun tersebut.

  </Accordion>

  <Accordion title="WhatsApp: apakah bot akan mengirim pesan ke kontak saya? Bagaimana pairing bekerja?">
    Tidak. Kebijakan DM WhatsApp default adalah **pairing**. Pengirim yang tidak dikenal hanya mendapatkan kode pairing dan pesan mereka **tidak diproses**. OpenClaw hanya membalas chat yang diterimanya atau pengiriman eksplisit yang Anda picu.

    Setujui pairing dengan:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Daftar permintaan tertunda:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt nomor telepon wizard: nomor itu digunakan untuk menetapkan **allowlist/owner** Anda sehingga DM Anda sendiri diizinkan. Itu tidak digunakan untuk pengiriman otomatis. Jika Anda menjalankan di nomor WhatsApp pribadi Anda, gunakan nomor itu dan aktifkan `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Perintah chat, membatalkan tugas, dan "bot tidak mau berhenti"

<AccordionGroup>
  <Accordion title="Bagaimana cara menghentikan pesan sistem internal agar tidak muncul di chat?">
    Sebagian besar pesan internal atau tool hanya muncul saat **verbose**, **trace**, atau **reasoning** diaktifkan
    untuk sesi tersebut.

    Perbaiki di chat tempat Anda melihatnya:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Jika masih berisik, periksa pengaturan sesi di Control UI dan setel verbose
    ke **inherit**. Pastikan juga Anda tidak menggunakan profil bot dengan `verboseDefault` yang disetel
    ke `on` di konfigurasi.

    Dokumentasi: [Thinking and verbose](/id/tools/thinking), [Security](/id/gateway/security#reasoning-verbose-output-in-groups).

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

    Ini adalah pemicu abort (bukan slash command).

    Untuk proses latar belakang (dari exec tool), Anda dapat meminta agent menjalankan:

    ```
    process action:kill sessionId:XXX
    ```

    Gambaran umum slash command: lihat [Slash commands](/id/tools/slash-commands).

    Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`, tetapi beberapa shortcut (seperti `/status`) juga berfungsi inline untuk pengirim yang ada di allowlist.

  </Accordion>

  <Accordion title='Bagaimana cara mengirim pesan Discord dari Telegram? ("Cross-context messaging denied")'>
    OpenClaw memblokir pengiriman pesan **lintas provider** secara default. Jika panggilan tool terikat
    ke Telegram, OpenClaw tidak akan mengirim ke Discord kecuali Anda mengizinkannya secara eksplisit.

    Aktifkan pengiriman lintas provider untuk agent:

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

  <Accordion title='Mengapa terasa seperti bot "mengabaikan" pesan yang dikirim cepat bertubi-tubi?'>
    Mode antrean mengontrol bagaimana pesan baru berinteraksi dengan run yang sedang berlangsung. Gunakan `/queue` untuk mengubah mode:

    - `steer` - pesan baru mengarahkan ulang tugas saat ini
    - `followup` - jalankan pesan satu per satu
    - `collect` - batch pesan dan balas sekali (default)
    - `steer-backlog` - arahkan sekarang, lalu proses backlog
    - `interrupt` - batalkan run saat ini dan mulai dari awal

    Anda dapat menambahkan opsi seperti `debounce:2s cap:25 drop:summarize` untuk mode followup.

  </Accordion>
</AccordionGroup>

## Lain-lain

<AccordionGroup>
  <Accordion title='Apa model default untuk Anthropic dengan API key?'>
    Di OpenClaw, kredensial dan pemilihan model terpisah. Menetapkan `ANTHROPIC_API_KEY` (atau menyimpan API key Anthropic dalam profil auth) mengaktifkan autentikasi, tetapi model default yang sebenarnya adalah apa pun yang Anda konfigurasi di `agents.defaults.model.primary` (misalnya, `anthropic/claude-sonnet-4-6` atau `anthropic/claude-opus-4-6`). Jika Anda melihat `No credentials found for profile "anthropic:default"`, artinya Gateway tidak dapat menemukan kredensial Anthropic di `auth-profiles.json` yang diharapkan untuk agent yang sedang berjalan.
  </Accordion>
</AccordionGroup>

---

Masih buntu? Tanyakan di [Discord](https://discord.com/invite/clawd) atau buka [diskusi GitHub](https://github.com/openclaw/openclaw/discussions).

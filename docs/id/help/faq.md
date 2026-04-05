---
read_when:
    - Menjawab pertanyaan umum tentang penyiapan, instalasi, orientasi, atau dukungan runtime
    - Menriage masalah yang dilaporkan pengguna sebelum debugging lebih mendalam
summary: Pertanyaan yang sering diajukan tentang penyiapan, konfigurasi, dan penggunaan OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-05T14:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Jawaban cepat plus pemecahan masalah yang lebih mendalam untuk penyiapan dunia nyata (dev lokal, VPS, multi-agent, OAuth/API key, failover model). Untuk diagnostik runtime, lihat [Troubleshooting](/gateway/troubleshooting). Untuk referensi konfigurasi lengkap, lihat [Configuration](/id/gateway/configuration).

## 60 detik pertama jika ada yang rusak

1. **Status cepat (pemeriksaan pertama)**

   ```bash
   openclaw status
   ```

   Ringkasan lokal cepat: OS + pembaruan, keterjangkauan gateway/layanan, agent/sesi, konfigurasi provider + masalah runtime (saat gateway dapat dijangkau).

2. **Laporan yang bisa ditempel (aman untuk dibagikan)**

   ```bash
   openclaw status --all
   ```

   Diagnosis read-only dengan tail log (token disamarkan).

3. **Status daemon + port**

   ```bash
   openclaw gateway status
   ```

   Menampilkan runtime supervisor vs keterjangkauan RPC, URL target probe, dan konfigurasi yang kemungkinan digunakan layanan.

4. **Probe mendalam**

   ```bash
   openclaw status --deep
   ```

   Menjalankan probe kesehatan gateway langsung, termasuk probe channel bila didukung
   (memerlukan gateway yang dapat dijangkau). Lihat [Health](/id/gateway/health).

5. **Tail log terbaru**

   ```bash
   openclaw logs --follow
   ```

   Jika RPC mati, gunakan fallback ke:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Log file terpisah dari log layanan; lihat [Logging](/logging) dan [Troubleshooting](/gateway/troubleshooting).

6. **Jalankan doctor (perbaikan)**

   ```bash
   openclaw doctor
   ```

   Memperbaiki/memigrasikan konfigurasi/status + menjalankan pemeriksaan kesehatan. Lihat [Doctor](/id/gateway/doctor).

7. **Snapshot Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # menampilkan URL target + path config saat terjadi error
   ```

   Meminta snapshot lengkap dari gateway yang sedang berjalan (khusus WS). Lihat [Health](/id/gateway/health).

## Mulai cepat dan penyiapan pertama kali

<AccordionGroup>
  <Accordion title="Saya terjebak, cara tercepat untuk keluar dari kebuntuan">
    Gunakan agent AI lokal yang bisa **melihat mesin Anda**. Itu jauh lebih efektif daripada bertanya
    di Discord, karena kebanyakan kasus "Saya terjebak" adalah **masalah config atau environment lokal** yang
    tidak bisa diperiksa oleh pihak yang membantu dari jarak jauh.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Alat-alat ini dapat membaca repo, menjalankan perintah, memeriksa log, dan membantu memperbaiki
    penyiapan tingkat mesin Anda (PATH, layanan, izin, file auth). Berikan **checkout source lengkap**
    melalui instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ini menginstal OpenClaw **dari checkout git**, sehingga agent dapat membaca kode + dokumentasi dan
    memahami versi persis yang sedang Anda jalankan. Anda selalu bisa kembali ke stable nanti
    dengan menjalankan ulang installer tanpa `--install-method git`.

    Tip: minta agent untuk **merencanakan dan mengawasi** perbaikan (langkah demi langkah), lalu jalankan hanya
    perintah yang diperlukan. Itu menjaga perubahan tetap kecil dan lebih mudah diaudit.

    Jika Anda menemukan bug atau perbaikan nyata, silakan buat issue GitHub atau kirim PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Mulailah dengan perintah-perintah ini (bagikan output saat meminta bantuan):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Fungsinya:

    - `openclaw status`: snapshot cepat kesehatan gateway/agent + konfigurasi dasar.
    - `openclaw models status`: memeriksa auth provider + ketersediaan model.
    - `openclaw doctor`: memvalidasi dan memperbaiki masalah config/status umum.

    Pemeriksaan CLI lain yang berguna: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop debug cepat: [60 detik pertama jika ada yang rusak](#60-detik-pertama-jika-ada-yang-rusak).
    Dokumentasi instalasi: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan skip-nya?">
    Alasan skip heartbeat yang umum:

    - `quiet-hours`: di luar jendela active-hours yang dikonfigurasi
    - `empty-heartbeat-file`: `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/header saja
    - `no-tasks-due`: mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo
    - `alerts-disabled`: semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya nonaktif)

    Dalam mode tugas, timestamp jatuh tempo hanya dimajukan setelah heartbeat nyata
    selesai dijalankan. Eksekusi yang dilewati tidak menandai tugas sebagai selesai.

    Dokumentasi: [Heartbeat](/id/gateway/heartbeat), [Automation & Tasks](/id/automation).

  </Accordion>

  <Accordion title="Cara yang direkomendasikan untuk menginstal dan menyiapkan OpenClaw">
    Repo merekomendasikan menjalankan dari source dan menggunakan onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Wizard juga dapat membangun aset UI secara otomatis. Setelah onboarding, Anda biasanya menjalankan Gateway di port **18789**.

    Dari source (kontributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # otomatis memasang dependensi UI saat pertama kali dijalankan
    openclaw onboard
    ```

    Jika Anda belum punya instalasi global, jalankan melalui `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dashboard setelah onboarding?">
    Wizard membuka browser Anda dengan URL dashboard yang bersih (tanpa token di URL) tepat setelah onboarding dan juga mencetak tautannya di ringkasan. Biarkan tab itu tetap terbuka; jika tidak diluncurkan, salin/tempel URL yang dicetak di mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dashboard di localhost vs remote?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika meminta auth shared-secret, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Jika belum ada shared secret yang dikonfigurasi, buat token dengan `openclaw doctor --generate-gateway-token`.

    **Bukan di localhost:**

    - **Tailscale Serve** (direkomendasikan): tetap gunakan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Jika `gateway.auth.allowTailscale` adalah `true`, header identitas memenuhi auth Control UI/WebSocket (tanpa menempel shared secret, dengan asumsi gateway host tepercaya); HTTP API tetap memerlukan auth shared-secret kecuali Anda sengaja menggunakan private-ingress `none` atau auth HTTP trusted-proxy.
      Upaya auth Serve bersamaan yang salah dari klien yang sama diserialkan sebelum pembatas failed-auth mencatatnya, sehingga percobaan salah kedua sudah bisa menampilkan `retry later`.
    - **Tailnet bind**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan auth kata sandi), buka `http://<tailscale-ip>:18789/`, lalu tempel shared secret yang sesuai di pengaturan dashboard.
    - **Identity-aware reverse proxy**: letakkan Gateway di belakang trusted proxy non-loopback, konfigurasikan `gateway.auth.mode: "trusted-proxy"`, lalu buka URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` lalu buka `http://127.0.0.1:18789/`. Auth shared-secret tetap berlaku melalui tunnel; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dashboard](/web/dashboard) dan [Web surfaces](/web) untuk detail mode bind dan auth.

  </Accordion>

  <Accordion title="Mengapa ada dua config persetujuan exec untuk chat approvals?">
    Keduanya mengendalikan lapisan yang berbeda:

    - `approvals.exec`: meneruskan prompt persetujuan ke tujuan chat
    - `channels.<channel>.execApprovals`: membuat channel itu bertindak sebagai klien persetujuan native untuk persetujuan exec

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya. Config chat hanya mengendalikan ke mana prompt persetujuan
    muncul dan bagaimana orang dapat menjawabnya.

    Dalam sebagian besar penyiapan Anda **tidak** memerlukan keduanya:

    - Jika chat sudah mendukung perintah dan balasan, `/approve` di chat yang sama bekerja melalui jalur bersama.
    - Jika channel native yang didukung dapat menyimpulkan approver dengan aman, OpenClaw sekarang otomatis mengaktifkan persetujuan native DM-first saat `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`.
    - Saat kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama; agent hanya boleh menyertakan perintah manual `/approve` jika hasil tool mengatakan chat approvals tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    - Gunakan `approvals.exec` hanya ketika prompt juga harus diteruskan ke chat lain atau ruang ops eksplisit.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya ketika Anda secara eksplisit ingin prompt persetujuan diposting kembali ke room/topic asal.
    - Plugin approvals terpisah lagi: mereka menggunakan `/approve` di chat yang sama secara default, penerusan `approvals.plugin` opsional, dan hanya beberapa native channel yang mempertahankan penanganan native plugin-approval di atasnya.

    Versi singkat: forwarding untuk routing, config klien native untuk UX spesifik channel yang lebih kaya.
    Lihat [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **>= 22** wajib. `pnpm` direkomendasikan. Bun **tidak direkomendasikan** untuk Gateway.
  </Accordion>

  <Accordion title="Apakah bisa berjalan di Raspberry Pi?">
    Ya. Gateway ringan - dokumentasi mencantumkan **512MB-1GB RAM**, **1 core**, dan sekitar **500MB**
    disk sebagai cukup untuk penggunaan pribadi, serta mencatat bahwa **Raspberry Pi 4 dapat menjalankannya**.

    Jika Anda ingin ruang tambahan (log, media, layanan lain), **2GB direkomendasikan**, tetapi itu
    bukan minimum mutlak.

    Tip: Pi/VPS kecil dapat menjadi host Gateway, dan Anda dapat memasangkan **node** di laptop/ponsel untuk
    layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Nodes](/nodes).

  </Accordion>

  <Accordion title="Ada tips untuk instalasi Raspberry Pi?">
    Versi singkat: bisa digunakan, tetapi harapkan ada sisi kasar.

    - Gunakan OS **64-bit** dan pertahankan Node >= 22.
    - Pilih **instalasi hackable (git)** agar Anda bisa melihat log dan memperbarui dengan cepat.
    - Mulai tanpa channels/Skills, lalu tambahkan satu per satu.
    - Jika menemui masalah biner aneh, biasanya itu masalah **kompatibilitas ARM**.

    Dokumentasi: [Linux](/platforms/linux), [Install](/install).

  </Accordion>

  <Accordion title="Terhenti di wake up my friend / onboarding tidak mau hatch. Sekarang bagaimana?">
    Layar itu bergantung pada Gateway yang dapat dijangkau dan terautentikasi. TUI juga mengirim
    "Wake up, my friend!" secara otomatis saat hatch pertama. Jika Anda melihat baris itu tanpa **balasan**
    dan token tetap 0, agent tidak pernah berjalan.

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

    Jika Gateway remote, pastikan koneksi tunnel/Tailscale aktif dan UI
    diarahkan ke Gateway yang benar. Lihat [Remote access](/id/gateway/remote).

  </Accordion>

  <Accordion title="Bisakah saya memigrasikan penyiapan saya ke mesin baru (Mac mini) tanpa mengulang onboarding?">
    Ya. Salin **direktori state** dan **workspace**, lalu jalankan Doctor sekali. Ini
    menjaga bot Anda "tetap sama persis" (memori, riwayat sesi, auth, dan state
    channel) selama Anda menyalin **kedua** lokasi:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin workspace Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Itu mempertahankan config, profil auth, kredensial WhatsApp, sesi, dan memori. Jika Anda dalam
    mode remote, ingat bahwa gateway host memiliki session store dan workspace.

    **Penting:** jika Anda hanya commit/push workspace ke GitHub, Anda sedang mencadangkan
    **memori + file bootstrap**, tetapi **bukan** riwayat sesi atau auth. Itu berada
    di bawah `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/sessions/`).

    Terkait: [Migrating](/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Remote mode](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya bisa melihat apa yang baru di versi terbaru?">
    Periksa changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di atas. Jika bagian teratas ditandai **Unreleased**, bagian bertanggal berikutnya
    adalah versi rilis terbaru. Entri dikelompokkan berdasarkan **Highlights**, **Changes**, dan
    **Fixes** (plus bagian dokumentasi/lainnya bila diperlukan).

  </Accordion>

  <Accordion title="Tidak bisa mengakses docs.openclaw.ai (error SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan atau allowlist `docs.openclaw.ai`, lalu coba lagi.
    Tolong bantu kami membuka blokirnya dengan melaporkan di sini: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Jika Anda masih tidak bisa menjangkau situsnya, dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stable dan beta">
    **Stable** dan **beta** adalah **npm dist-tags**, bukan jalur kode yang terpisah:

    - `latest` = stable
    - `beta` = build awal untuk pengujian

    Biasanya, rilis stable mendarat di **beta** terlebih dahulu, lalu langkah
    promosi eksplisit memindahkan versi yang sama itu ke `latest`. Maintainer juga dapat
    menerbitkan langsung ke `latest` jika perlu. Itulah sebabnya beta dan stable dapat
    menunjuk ke **versi yang sama** setelah promosi.

    Lihat apa yang berubah:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Untuk one-liner instalasi dan perbedaan antara beta dan dev, lihat accordion di bawah.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
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

    Detail lebih lanjut: [Development channels](/install/development-channels) dan [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba bit terbaru?">
    Ada dua opsi:

    1. **Channel dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke branch `main` dan memperbarui dari source.

    2. **Instalasi hackable (dari situs installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Itu memberi Anda repo lokal yang bisa diedit, lalu diperbarui via git.

    Jika Anda lebih suka clone bersih secara manual, gunakan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentasi: [Update](/cli/update), [Development channels](/install/development-channels),
    [Install](/install).

  </Accordion>

  <Accordion title="Biasanya berapa lama instalasi dan onboarding?">
    Perkiraan kasar:

    - **Instalasi:** 2-5 menit
    - **Onboarding:** 5-15 menit tergantung berapa banyak channel/model yang Anda konfigurasi

    Jika macet, gunakan [Installer stuck](#quick-start-and-first-run-setup)
    dan loop debug cepat di [I am stuck](#quick-start-and-first-run-setup).

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

    Untuk instalasi hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Ekuivalen Windows (PowerShell):

    ```powershell
    # install.ps1 belum memiliki flag -Verbose khusus.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Opsi lainnya: [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows mengatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) npm error spawn git / git not found**

    - Instal **Git for Windows** dan pastikan `git` ada di PATH Anda.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang installer.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder npm global bin Anda tidak ada di PATH.
    - Periksa path-nya:

      ```powershell
      npm config get prefix
      ```

    - Tambahkan direktori itu ke PATH pengguna Anda (tidak perlu sufiks `\bin` di Windows; pada kebanyakan sistem itu adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell setelah memperbarui PATH.

    Jika Anda menginginkan penyiapan Windows yang paling mulus, gunakan **WSL2** alih-alih Windows native.
    Dokumentasi: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks Mandarin yang rusak - apa yang harus saya lakukan?">
    Ini biasanya ketidakcocokan code page konsol pada shell Windows native.

    Gejalanya:

    - output `system.run`/`exec` merender teks Mandarin sebagai mojibake
    - perintah yang sama terlihat baik-baik saja di profil terminal lain

    Solusi cepat di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Lalu mulai ulang Gateway dan coba kembali perintah Anda:

    ```powershell
    openclaw gateway restart
    ```

    Jika Anda masih dapat mereproduksi ini di OpenClaw terbaru, lacak/laporkan di:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya - bagaimana cara mendapat jawaban yang lebih baik?">
    Gunakan **instalasi hackable (git)** agar Anda punya source dan dokumentasi lengkap secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) _dari folder itu_ agar ia dapat membaca repo dan menjawab dengan tepat.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail lebih lanjut: [Install](/install) dan [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    Jawaban singkat: ikuti panduan Linux, lalu jalankan onboarding.

    - Jalur cepat Linux + instalasi layanan: [Linux](/platforms/linux).
    - Panduan lengkap: [Getting Started](/start/getting-started).
    - Installer + pembaruan: [Install & updates](/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    Linux VPS apa pun bisa digunakan. Instal di server, lalu gunakan SSH/Tailscale untuk menjangkau Gateway.

    Panduan: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
    Akses remote: [Gateway remote](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Kami menyimpan **hosting hub** dengan provider umum. Pilih satu dan ikuti panduannya:

    - [VPS hosting](/vps) (semua provider di satu tempat)
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    Cara kerjanya di cloud: **Gateway berjalan di server**, dan Anda mengaksesnya
    dari laptop/ponsel melalui Control UI (atau Tailscale/SSH). State + workspace Anda
    hidup di server, jadi perlakukan host itu sebagai sumber kebenaran dan cadangkan.

    Anda dapat memasangkan **nodes** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk mengakses
    layar/kamera/canvas lokal atau menjalankan perintah di laptop sambil tetap menjaga
    Gateway di cloud.

    Hub: [Platforms](/platforms). Akses remote: [Gateway remote](/id/gateway/remote).
    Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Jawaban singkat: **bisa, tetapi tidak direkomendasikan**. Alur pembaruan dapat memulai ulang
    Gateway (yang memutus sesi aktif), mungkin membutuhkan checkout git yang bersih, dan
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

    Dokumentasi: [Update](/cli/update), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Apa sebenarnya yang dilakukan onboarding?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal** ia memandu Anda melalui:

    - **Penyiapan model/auth** (provider OAuth, pemakaian ulang Claude CLI, dan API key didukung, plus opsi model lokal seperti LM Studio)
    - Lokasi **Workspace** + file bootstrap
    - **Pengaturan Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus bundled channel plugins seperti QQ Bot)
    - **Instalasi daemon** (LaunchAgent di macOS; unit systemd user di Linux/WSL2)
    - **Pemeriksaan kesehatan** dan pemilihan **Skills**

    Ia juga memperingatkan jika model yang dikonfigurasi tidak dikenal atau auth hilang.

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankan ini?">
    Tidak. Anda dapat menjalankan OpenClaw dengan **API key** (Anthropic/OpenAI/lainnya) atau dengan
    **model lokal saja** sehingga data Anda tetap berada di perangkat. Langganan (Claude
    Pro/Max atau OpenAI Codex) adalah cara opsional untuk mengautentikasi provider tersebut.

    Kami meyakini fallback Claude Code CLI kemungkinan diperbolehkan untuk otomasi lokal
    yang dikelola pengguna berdasarkan dokumentasi CLI publik Anthropic. Meskipun demikian,
    kebijakan third-party harness Anthropic menimbulkan cukup banyak ambiguitas terkait
    penggunaan berbasis langganan dalam produk eksternal sehingga kami tidak merekomendasikannya
    untuk produksi. Anthropic juga memberi tahu pengguna OpenClaw pada **4 April 2026
    pukul 12:00 PM PT / 8:00 PM BST** bahwa jalur login Claude **OpenClaw**
    dihitung sebagai penggunaan third-party harness dan sekarang memerlukan **Extra Usage**
    yang ditagih terpisah dari langganan. OpenAI Codex OAuth didukung secara eksplisit
    untuk alat eksternal seperti OpenClaw.

    OpenClaw juga mendukung opsi hosted berbasis langganan lainnya termasuk
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, dan
    **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [GLM Models](/providers/glm),
    [Local models](/id/gateway/local-models), [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan langganan Claude Max tanpa API key?">
    Ya, melalui login **Claude CLI** lokal di gateway host.

    Langganan Claude Pro/Max **tidak menyertakan API key**, jadi pemakaian ulang Claude CLI
    adalah jalur fallback lokal di OpenClaw. Kami meyakini fallback Claude Code CLI
    kemungkinan diperbolehkan untuk otomasi lokal yang dikelola pengguna berdasarkan
    dokumentasi CLI publik Anthropic. Meskipun demikian, kebijakan third-party harness
    Anthropic menimbulkan cukup banyak ambiguitas terkait penggunaan berbasis langganan
    dalam produk eksternal sehingga kami tidak merekomendasikannya untuk produksi. Kami merekomendasikan
    Anthropic API key sebagai gantinya.

  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan Claude (Claude Pro atau Max)?">
    Ya. Gunakan kembali login **Claude CLI** lokal di gateway host dengan `openclaw models auth login --provider anthropic --method cli --set-default`.

    Anthropic setup-token juga tersedia lagi sebagai jalur OpenClaw legacy/manual. Pemberitahuan penagihan khusus OpenClaw dari Anthropic tetap berlaku di sana, jadi gunakan dengan ekspektasi bahwa Anthropic mewajibkan **Extra Usage**. Lihat [Anthropic](/providers/anthropic) dan [OAuth](/id/concepts/oauth).

    Penting: Kami meyakini fallback Claude Code CLI kemungkinan diperbolehkan untuk otomasi lokal,
    yang dikelola pengguna berdasarkan dokumentasi CLI publik Anthropic. Meskipun demikian,
    kebijakan third-party harness Anthropic menimbulkan cukup banyak ambiguitas terkait penggunaan berbasis
    langganan dalam produk eksternal sehingga kami tidak merekomendasikannya untuk produksi. Anthropic juga memberi tahu pengguna OpenClaw pada **4 April 2026 pukul
    12:00 PM PT / 8:00 PM BST** bahwa jalur login Claude **OpenClaw**
    memerlukan **Extra Usage** yang ditagih terpisah dari langganan.

    Untuk produksi atau beban kerja multi-pengguna, auth Anthropic API key adalah
    pilihan yang lebih aman dan direkomendasikan. Jika Anda menginginkan opsi hosted bergaya
    langganan lain di OpenClaw, lihat [OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax), dan
    [GLM Models](/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
Itu berarti **kuota/batas laju Anthropic** Anda habis untuk jendela saat ini. Jika Anda
menggunakan **Claude CLI**, tunggu jendela di-reset atau tingkatkan paket Anda. Jika Anda
menggunakan **Anthropic API key**, periksa Anthropic Console
untuk penggunaan/penagihan dan tingkatkan limit sesuai kebutuhan.

    Jika pesannya secara spesifik adalah:
    `Extra usage is required for long context requests`, permintaan tersebut mencoba menggunakan
    beta konteks 1M Anthropic (`context1m: true`). Itu hanya berfungsi saat
    kredensial Anda memenuhi syarat untuk penagihan konteks panjang (penagihan API key atau
    jalur login Claude OpenClaw dengan Extra Usage diaktifkan).

    Tip: atur **model fallback** agar OpenClaw dapat terus membalas saat suatu provider terkena rate limit.
    Lihat [Models](/cli/models), [OAuth](/id/concepts/oauth), dan
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki provider bundled **Amazon Bedrock (Converse)**. Dengan marker env AWS yang ada, OpenClaw dapat secara otomatis menemukan katalog Bedrock streaming/text dan menggabungkannya sebagai provider implisit `amazon-bedrock`; jika tidak, Anda dapat secara eksplisit mengaktifkan `plugins.entries.amazon-bedrock.config.discovery.enabled` atau menambahkan entri provider manual. Lihat [Amazon Bedrock](/providers/bedrock) dan [Model providers](/providers/models). Jika Anda lebih menyukai alur managed key, proxy yang kompatibel dengan OpenAI di depan Bedrock tetap merupakan opsi yang valid.
  </Accordion>

  <Accordion title="Bagaimana cara kerja auth Codex?">
    OpenClaw mendukung **OpenAI Code (Codex)** melalui OAuth (sign-in ChatGPT). Onboarding dapat menjalankan alur OAuth dan akan menetapkan model default ke `openai-codex/gpt-5.4` bila sesuai. Lihat [Model providers](/id/concepts/model-providers) dan [Onboarding (CLI)](/start/wizard).
  </Accordion>

  <Accordion title="Apakah Anda mendukung auth langganan OpenAI (Codex OAuth)?">
    Ya. OpenClaw sepenuhnya mendukung **OpenAI Code (Codex) subscription OAuth**.
    OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan dalam alat/alur kerja eksternal
    seperti OpenClaw. Onboarding dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Model providers](/id/concepts/model-providers), dan [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Gemini CLI OAuth?">
    Gemini CLI menggunakan **plugin auth flow**, bukan client id atau secret di `openclaw.json`.

    Langkah-langkah:

    1. Instal Gemini CLI secara lokal agar `gemini` ada di `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Jika permintaan gagal, set `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di gateway host

    Ini menyimpan token OAuth dalam auth profiles di gateway host. Detail: [Model providers](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cukup baik untuk chat santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan yang kuat; kartu kecil akan memangkas dan bocor. Jika harus, jalankan build model **terbesar** yang bisa Anda jalankan secara lokal (LM Studio) dan lihat [/gateway/local-models](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi meningkatkan risiko prompt injection - lihat [Security](/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara menjaga traffic model hosted tetap berada di wilayah tertentu?">
    Pilih endpoint yang dipatok ke wilayah. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi, dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap di wilayah tersebut. Anda tetap dapat mencantumkan Anthropic/OpenAI di samping ini dengan menggunakan `models.mode: "merge"` agar fallback tetap tersedia sambil tetap menghormati provider berwilayah yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini bersifat opsional - beberapa orang
    membelinya sebagai host yang selalu aktif, tetapi VPS kecil, server rumahan, atau mesin kelas Raspberry Pi juga bisa.

    Anda hanya memerlukan Mac **untuk tool khusus macOS**. Untuk iMessage, gunakan [BlueBubbles](/id/channels/bluebubbles) (direkomendasikan) - server BlueBubbles berjalan di Mac mana pun, dan Gateway dapat berjalan di Linux atau di tempat lain. Jika Anda menginginkan tool khusus macOS lain, jalankan Gateway di Mac atau pasangkan node macOS.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS apa pun** yang masuk ke Messages. Itu **tidak** harus Mac mini -
    Mac apa pun bisa. **Gunakan [BlueBubbles](/id/channels/bluebubbles)** (direkomendasikan) untuk iMessage - server BlueBubbles berjalan di macOS, sementara Gateway bisa berjalan di Linux atau di tempat lain.

    Penyiapan umum:

    - Jalankan Gateway di Linux/VPS, dan jalankan server BlueBubbles di Mac mana pun yang masuk ke Messages.
    - Jalankan semuanya di Mac jika Anda menginginkan penyiapan satu mesin yang paling sederhana.

    Dokumentasi: [BlueBubbles](/id/channels/bluebubbles), [Nodes](/nodes),
    [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, bisakah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda dapat terhubung sebagai
    **node** (perangkat pendamping). Node tidak menjalankan Gateway - mereka menyediakan
    kemampuan tambahan seperti layar/kamera/canvas dan `system.run` pada perangkat tersebut.

    Pola umum:

    - Gateway di Mac mini (selalu aktif).
    - MacBook Pro menjalankan app macOS atau node host dan dipasangkan ke Gateway.
    - Gunakan `openclaw nodes status` / `openclaw nodes list` untuk melihatnya.

    Dokumentasi: [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan Bun?">
    Bun **tidak direkomendasikan**. Kami melihat bug runtime, terutama dengan WhatsApp dan Telegram.
    Gunakan **Node** untuk gateway yang stabil.

    Jika Anda tetap ingin bereksperimen dengan Bun, lakukan itu di gateway non-produksi
    tanpa WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: apa yang dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **Telegram user ID pengirim manusia** (numerik). Itu bukan username bot.

    Onboarding menerima input `@username` dan menyelesaikannya menjadi ID numerik, tetapi otorisasi OpenClaw hanya menggunakan ID numerik.

    Lebih aman (tanpa bot pihak ketiga):

    - DM bot Anda, lalu jalankan `openclaw logs --follow` dan baca `from.id`.

    Bot API resmi:

    - DM bot Anda, lalu panggil `https://api.telegram.org/bot<bot_token>/getUpdates` dan baca `message.from.id`.

    Pihak ketiga (kurang privat):

    - DM `@userinfobot` atau `@getidsbot`.

    Lihat [/channels/telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bisakah beberapa orang menggunakan satu nomor WhatsApp dengan instance OpenClaw yang berbeda?">
    Ya, melalui **multi-agent routing**. Ikat **DM** WhatsApp setiap pengirim (peer `kind: "direct"`, pengirim E.164 seperti `+15551234567`) ke `agentId` yang berbeda, sehingga setiap orang mendapatkan workspace dan session store mereka sendiri. Balasan tetap datang dari **akun WhatsApp yang sama**, dan kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun WhatsApp. Lihat [Multi-Agent Routing](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Bisakah saya menjalankan agent "fast chat" dan agent "Opus for coding"?'>
    Ya. Gunakan multi-agent routing: berikan setiap agent model defaultnya sendiri, lalu ikat route masuk (akun provider atau peer tertentu) ke masing-masing agent. Contoh config ada di [Multi-Agent Routing](/id/concepts/multi-agent). Lihat juga [Models](/id/concepts/models) dan [Configuration](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew bekerja di Linux?">
    Ya. Homebrew mendukung Linux (Linuxbrew). Penyiapan cepat:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Jika Anda menjalankan OpenClaw melalui systemd, pastikan PATH layanan mencakup `/home/linuxbrew/.linuxbrew/bin` (atau prefix brew Anda) agar tool yang diinstal dengan `brew` dapat diresolve di shell non-login.
    Build terbaru juga menambahkan terlebih dahulu common user bin dirs pada layanan Linux systemd (misalnya `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) dan menghormati `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` jika disetel.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git hackable dan npm install">
    - **Instalasi hackable (git):** checkout source penuh, dapat diedit, terbaik untuk kontributor.
      Anda menjalankan build secara lokal dan dapat menambal kode/dokumentasi.
    - **npm install:** instalasi CLI global, tanpa repo, terbaik untuk "langsung jalankan."
      Pembaruan datang dari npm dist-tags.

    Dokumentasi: [Getting started](/start/getting-started), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Bisakah saya beralih antara instalasi npm dan git nanti?">
    Ya. Instal varian lain, lalu jalankan Doctor agar layanan gateway mengarah ke entrypoint baru.
    Ini **tidak menghapus data Anda** - hanya mengubah instalasi kode OpenClaw. State Anda
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

    Doctor mendeteksi ketidakcocokan entrypoint layanan gateway dan menawarkan untuk menulis ulang config layanan agar cocok dengan instalasi saat ini (gunakan `--repair` dalam automasi).

    Tip pencadangan: lihat [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sebaiknya saya menjalankan Gateway di laptop atau VPS?">
    Jawaban singkat: **jika Anda ingin keandalan 24/7, gunakan VPS**. Jika Anda menginginkan
    friksi terendah dan tidak masalah dengan sleep/restart, jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser langsung.
    - **Kekurangan:** sleep/jaringan putus = koneksi terputus, pembaruan/reboot OS mengganggu, harus tetap aktif.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tidak ada masalah sleep laptop, lebih mudah dijaga tetap berjalan.
    - **Kekurangan:** sering berjalan headless (gunakan screenshot), akses file hanya remote, Anda harus SSH untuk pembaruan.

    **Catatan khusus OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berjalan baik dari VPS. Satu-satunya trade-off nyata adalah **browser headless** vs jendela yang terlihat. Lihat [Browser](/tools/browser).

    **Default yang direkomendasikan:** VPS jika Anda pernah mengalami gateway terputus sebelumnya. Lokal bagus saat Anda aktif menggunakan Mac dan menginginkan akses file lokal atau automasi UI dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw di mesin khusus?">
    Tidak wajib, tetapi **direkomendasikan untuk keandalan dan isolasi**.

    - **Host khusus (VPS/Mac mini/Pi):** selalu aktif, lebih sedikit gangguan sleep/reboot, izin lebih bersih, lebih mudah dijaga tetap berjalan.
    - **Laptop/desktop bersama:** sepenuhnya oke untuk pengujian dan penggunaan aktif, tetapi harapkan jeda saat mesin sleep atau diperbarui.

    Jika Anda ingin yang terbaik dari keduanya, biarkan Gateway di host khusus dan pasangkan laptop Anda sebagai **node** untuk tool screen/camera/exec lokal. Lihat [Nodes](/nodes).
    Untuk panduan keamanan, baca [Security](/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    OpenClaw ringan. Untuk Gateway dasar + satu chat channel:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Direkomendasikan:** 1-2 vCPU, 2GB RAM atau lebih untuk ruang tambahan (log, media, banyak channel). Tool node dan automasi browser dapat boros sumber daya.

    OS: gunakan **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun). Jalur instalasi Linux paling banyak diuji di sana.

    Dokumentasi: [Linux](/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan OpenClaw di VM dan apa persyaratannya?">
    Ya. Perlakukan VM sama seperti VPS: harus selalu aktif, dapat dijangkau, dan punya cukup
    RAM untuk Gateway dan channel apa pun yang Anda aktifkan.

    Panduan dasar:

    - **Minimum mutlak:** 1 vCPU, 1GB RAM.
    - **Direkomendasikan:** 2GB RAM atau lebih jika Anda menjalankan beberapa channel, automasi browser, atau tool media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Jika Anda menggunakan Windows, **WSL2 adalah penyiapan bergaya VM yang paling mudah** dan memiliki kompatibilitas
    tool terbaik. Lihat [Windows](/platforms/windows), [VPS hosting](/vps).
    Jika Anda menjalankan macOS di VM, lihat [macOS VM](/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Apa itu OpenClaw?

<AccordionGroup>
  <Accordion title="Apa itu OpenClaw, dalam satu paragraf?">
    OpenClaw adalah asisten AI pribadi yang Anda jalankan di perangkat Anda sendiri. Ia membalas di permukaan pesan yang sudah Anda gunakan (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, dan bundled channel plugins seperti QQ Bot) dan juga dapat melakukan voice + Canvas langsung di platform yang didukung. **Gateway** adalah control plane yang selalu aktif; asistenlah produknya.
  </Accordion>

  <Accordion title="Proposisi nilai">
    OpenClaw bukan "sekadar wrapper Claude." Ini adalah **control plane local-first** yang memungkinkan Anda menjalankan
    asisten yang mumpuni di **hardware milik Anda sendiri**, dapat dijangkau dari app chat yang sudah Anda gunakan, dengan
    sesi stateful, memori, dan tools - tanpa menyerahkan kendali alur kerja Anda kepada
    SaaS yang di-host.

    Sorotan:

    - **Perangkat Anda, data Anda:** jalankan Gateway di mana pun Anda mau (Mac, Linux, VPS) dan simpan
      workspace + riwayat sesi secara lokal.
    - **Channel nyata, bukan sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/dll,
      plus voice seluler dan Canvas di platform yang didukung.
    - **Model-agnostic:** gunakan Anthropic, OpenAI, MiniMax, OpenRouter, dll., dengan routing per-agent
      dan failover.
    - **Opsi lokal saja:** jalankan model lokal agar **semua data dapat tetap berada di perangkat Anda** jika Anda mau.
    - **Multi-agent routing:** agent terpisah per channel, akun, atau tugas, masing-masing dengan
      workspace dan default-nya sendiri.
    - **Open source dan hackable:** periksa, perluas, dan self-host tanpa vendor lock-in.

    Dokumentasi: [Gateway](/id/gateway), [Channels](/id/channels), [Multi-agent](/id/concepts/multi-agent),
    [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Saya baru saja menyiapkannya - apa yang sebaiknya saya lakukan dulu?">
    Proyek pertama yang bagus:

    - Membangun situs web (WordPress, Shopify, atau situs statis sederhana).
    - Membuat prototipe app mobile (garis besar, layar, rencana API).
    - Mengatur file dan folder (pembersihan, penamaan, penandaan).
    - Menghubungkan Gmail dan mengotomatiskan ringkasan atau follow-up.

    Ia dapat menangani tugas besar, tetapi bekerja paling baik saat Anda membaginya ke beberapa fase dan
    menggunakan sub agent untuk pekerjaan paralel.

  </Accordion>

  <Accordion title="Apa lima use case sehari-hari teratas untuk OpenClaw?">
    Kemenangan sehari-hari biasanya terlihat seperti:

    - **Briefing pribadi:** ringkasan inbox, kalender, dan berita yang Anda pedulikan.
    - **Riset dan drafting:** riset cepat, ringkasan, dan draf pertama untuk email atau dokumen.
    - **Pengingat dan follow-up:** dorongan dan checklist yang digerakkan cron atau heartbeat.
    - **Automasi browser:** mengisi formulir, mengumpulkan data, dan mengulang tugas web.
    - **Koordinasi lintas perangkat:** kirim tugas dari ponsel Anda, biarkan Gateway menjalankannya di server, dan dapatkan hasilnya kembali di chat.

  </Accordion>

  <Accordion title="Bisakah OpenClaw membantu lead gen, outreach, iklan, dan blog untuk SaaS?">
    Ya untuk **riset, kualifikasi, dan drafting**. Ia dapat memindai situs, membuat shortlist,
    meringkas prospek, dan menulis draf outreach atau copy iklan.

    Untuk **outreach atau penayangan iklan**, pertahankan manusia dalam loop. Hindari spam, patuhi hukum lokal dan
    kebijakan platform, dan tinjau apa pun sebelum dikirim. Pola paling aman adalah membiarkan
    OpenClaw membuat draf lalu Anda menyetujuinya.

    Dokumentasi: [Security](/gateway/security).

  </Accordion>

  <Accordion title="Apa kelebihannya dibanding Claude Code untuk pengembangan web?">
    OpenClaw adalah **asisten pribadi** dan lapisan koordinasi, bukan pengganti IDE. Gunakan
    Claude Code atau Codex untuk loop coding langsung tercepat di dalam repo. Gunakan OpenClaw saat Anda
    menginginkan memori yang tahan lama, akses lintas perangkat, dan orkestrasi tool.

    Kelebihan:

    - **Memori + workspace persisten** lintas sesi
    - **Akses multi-platform** (WhatsApp, Telegram, TUI, WebChat)
    - **Orkestrasi tool** (browser, file, penjadwalan, hooks)
    - **Gateway selalu aktif** (jalankan di VPS, berinteraksi dari mana saja)
    - **Nodes** untuk browser/layar/kamera/exec lokal

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills dan automasi

<AccordionGroup>
  <Accordion title="Bagaimana cara menyesuaikan Skills tanpa membuat repo kotor?">
    Gunakan managed override alih-alih mengedit salinan repo. Letakkan perubahan Anda di `~/.openclaw/skills/<name>/SKILL.md` (atau tambahkan folder melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json`). Prioritas adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, jadi managed override tetap menang atas bundled Skills tanpa menyentuh git. Jika Anda perlu Skill terinstal secara global tetapi hanya terlihat oleh beberapa agent, simpan salinan bersama di `~/.openclaw/skills` dan kontrol visibilitas dengan `agents.defaults.skills` dan `agents.list[].skills`. Hanya edit yang layak di-upstream yang sebaiknya hidup di repo dan dikirim sebagai PR.
  </Accordion>

  <Accordion title="Bisakah saya memuat Skills dari folder kustom?">
    Ya. Tambahkan direktori ekstra melalui `skills.load.extraDirs` di `~/.openclaw/openclaw.json` (prioritas terendah). Prioritas default adalah `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` menginstal ke `./skills` secara default, yang diperlakukan OpenClaw sebagai `<workspace>/skills` pada sesi berikutnya. Jika Skill itu hanya boleh terlihat oleh agent tertentu, pasangkan itu dengan `agents.defaults.skills` atau `agents.list[].skills`.
  </Accordion>

  <Accordion title="Bagaimana saya bisa menggunakan model yang berbeda untuk tugas yang berbeda?">
    Saat ini pola yang didukung adalah:

    - **Cron jobs**: job terisolasi dapat menetapkan override `model` per job.
    - **Sub-agents**: arahkan tugas ke agent terpisah dengan model default yang berbeda.
    - **Peralihan on-demand**: gunakan `/model` untuk mengganti model sesi saat ini kapan saja.

    Lihat [Cron jobs](/id/automation/cron-jobs), [Multi-Agent Routing](/id/concepts/multi-agent), dan [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot membeku saat melakukan pekerjaan berat. Bagaimana cara mengalihkan beban itu?">
    Gunakan **sub-agents** untuk tugas yang panjang atau paralel. Sub-agent berjalan di sesi mereka sendiri,
    mengembalikan ringkasan, dan menjaga chat utama Anda tetap responsif.

    Minta bot Anda untuk "spawn a sub-agent for this task" atau gunakan `/subagents`.
    Gunakan `/status` di chat untuk melihat apa yang sedang dilakukan Gateway saat ini (dan apakah sedang sibuk).

    Tip token: tugas panjang dan sub-agent sama-sama mengonsumsi token. Jika biaya menjadi perhatian, set
    model yang lebih murah untuk sub-agent melalui `agents.defaults.subagents.model`.

    Dokumentasi: [Sub-agents](/tools/subagents), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Bagaimana sesi subagent yang terikat ke thread bekerja di Discord?">
    Gunakan thread bindings. Anda dapat mengikat thread Discord ke target subagent atau sesi sehingga pesan lanjutan di thread tersebut tetap berada pada sesi terikat itu.

    Alur dasar:

    - Spawn dengan `sessions_spawn` menggunakan `thread: true` (dan opsional `mode: "session"` untuk follow-up persisten).
    - Atau ikat secara manual dengan `/focus <target>`.
    - Gunakan `/agents` untuk memeriksa status binding.
    - Gunakan `/session idle <duration|off>` dan `/session max-age <duration|off>` untuk mengontrol auto-unfocus.
    - Gunakan `/unfocus` untuk melepas thread.

    Config yang diperlukan:

    - Default global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind saat spawn: set `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentasi: [Sub-agents](/tools/subagents), [Discord](/id/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent selesai, tetapi pembaruan penyelesaiannya dikirim ke tempat yang salah atau tidak pernah diposting. Apa yang harus saya periksa?">
    Periksa resolved requester route terlebih dahulu:

    - Pengiriman subagent mode completion mengutamakan thread terikat atau route percakapan jika ada.
    - Jika origin completion hanya membawa channel, OpenClaw menggunakan fallback ke route tersimpan sesi peminta (`lastChannel` / `lastTo` / `lastAccountId`) sehingga pengiriman langsung masih bisa berhasil.
    - Jika tidak ada route terikat maupun route tersimpan yang dapat digunakan, pengiriman langsung bisa gagal dan hasilnya menggunakan fallback ke queued session delivery alih-alih langsung diposting ke chat.
    - Target yang tidak valid atau basi tetap dapat memaksa fallback antrean atau kegagalan pengiriman akhir.
    - Jika balasan asisten terakhir yang terlihat dari child adalah token senyap persis `NO_REPLY` / `no_reply`, atau tepat `ANNOUNCE_SKIP`, OpenClaw dengan sengaja menekan pengumuman alih-alih memposting progres lama yang sudah tidak relevan.
    - Jika child timeout setelah hanya melakukan tool call, pengumuman dapat merangkum itu menjadi ringkasan progres parsial singkat alih-alih memutar ulang output tool mentah.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Sub-agents](/tools/subagents), [Background Tasks](/id/automation/tasks), [Session Tools](/id/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron atau pengingat tidak berjalan. Apa yang harus saya periksa?">
    Cron berjalan di dalam proses Gateway. Jika Gateway tidak berjalan terus-menerus,
    job terjadwal tidak akan berjalan.

    Checklist:

    - Pastikan cron diaktifkan (`cron.enabled`) dan `OPENCLAW_SKIP_CRON` tidak disetel.
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

    - `--no-deliver` / `delivery.mode: "none"` berarti tidak diharapkan ada pesan eksternal.
    - Target announce yang hilang atau tidak valid (`channel` / `to`) berarti runner melewati pengiriman keluar.
    - Kegagalan auth channel (`unauthorized`, `Forbidden`) berarti runner mencoba mengirim tetapi kredensial memblokirnya.
    - Hasil isolated yang senyap (`NO_REPLY` / `no_reply` saja) diperlakukan sebagai sengaja tidak dapat dikirim, sehingga runner juga menekan queued fallback delivery.

    Untuk isolated cron jobs, runner memiliki pengiriman akhir. Agent diharapkan
    mengembalikan ringkasan plain-text agar runner yang mengirimkannya. `--no-deliver` menjaga
    hasil tersebut tetap internal; itu tidak membiarkan agent mengirim langsung dengan
    tool message sebagai gantinya.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Background Tasks](/id/automation/tasks).

  </Accordion>

  <Accordion title="Mengapa isolated cron run beralih model atau retry sekali?">
    Biasanya itu adalah jalur live model-switch, bukan penjadwalan ganda.

    Isolated cron dapat mempertahankan handoff model runtime dan melakukan retry saat
    run aktif melempar `LiveSessionModelSwitchError`. Retry mempertahankan
    provider/model yang sudah dialihkan, dan jika peralihan itu membawa override auth profile baru, cron
    juga menyimpannya sebelum retry.

    Aturan pemilihan terkait:

    - Override model hook Gmail menang lebih dulu bila berlaku.
    - Lalu `model` per-job.
    - Lalu override model cron-session tersimpan.
    - Lalu pemilihan model agent/default normal.

    Loop retry dibatasi. Setelah percobaan awal plus 2 retry switch,
    cron membatalkan alih-alih loop tanpa akhir.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal Skills di Linux?">
    Gunakan perintah native `openclaw skills` atau letakkan Skills di workspace Anda. UI Skills macOS tidak tersedia di Linux.
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
    workspace aktif. Instal CLI `clawhub` terpisah hanya jika Anda ingin menerbitkan atau
    menyinkronkan Skills Anda sendiri. Untuk instalasi bersama lintas agent, letakkan Skill di bawah
    `~/.openclaw/skills` dan gunakan `agents.defaults.skills` atau
    `agents.list[].skills` jika Anda ingin mempersempit agent mana yang dapat melihatnya.

  </Accordion>

  <Accordion title="Bisakah OpenClaw menjalankan tugas sesuai jadwal atau terus menerus di latar belakang?">
    Ya. Gunakan scheduler Gateway:

    - **Cron jobs** untuk tugas terjadwal atau berulang (bertahan saat restart).
    - **Heartbeat** untuk pemeriksaan berkala "sesi utama".
    - **Isolated jobs** untuk agent otonom yang memposting ringkasan atau mengirim ke chat.

    Dokumentasi: [Cron jobs](/id/automation/cron-jobs), [Automation & Tasks](/id/automation),
    [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title="Bisakah saya menjalankan Skills Apple khusus macOS dari Linux?">
    Tidak secara langsung. Skills macOS digate oleh `metadata.openclaw.os` plus biner yang diperlukan, dan Skills hanya muncul di system prompt ketika memenuhi syarat di **gateway host**. Di Linux, Skills khusus `darwin` (seperti `apple-notes`, `apple-reminders`, `things-mac`) tidak akan dimuat kecuali Anda menimpa gating tersebut.

    Anda memiliki tiga pola yang didukung:

    **Opsi A - jalankan Gateway di Mac (paling sederhana).**
    Jalankan Gateway di tempat biner macOS berada, lalu hubungkan dari Linux dalam [remote mode](#gateway-ports-already-running-and-remote-mode) atau melalui Tailscale. Skills akan dimuat secara normal karena gateway host adalah macOS.

    **Opsi B - gunakan node macOS (tanpa SSH).**
    Jalankan Gateway di Linux, pasangkan node macOS (app menubar), dan set **Node Run Commands** ke "Always Ask" atau "Always Allow" di Mac. OpenClaw dapat memperlakukan Skills khusus macOS sebagai memenuhi syarat saat biner yang diperlukan ada di node. Agent menjalankan Skills tersebut melalui tool `nodes`. Jika Anda memilih "Always Ask", menyetujui "Always Allow" dalam prompt menambahkan perintah tersebut ke allowlist.

    **Opsi C - proxy biner macOS melalui SSH (lanjutan).**
    Biarkan Gateway di Linux, tetapi buat biner CLI yang dibutuhkan diresolve ke wrapper SSH yang berjalan di Mac. Lalu override Skill agar mengizinkan Linux sehingga tetap memenuhi syarat.

    1. Buat wrapper SSH untuk biner tersebut (contoh: `memo` untuk Apple Notes):

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
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Mulai sesi baru agar snapshot Skills diperbarui.

  </Accordion>

  <Accordion title="Apakah Anda punya integrasi Notion atau HeyGen?">
    Belum built-in saat ini.

    Opsi:

    - **Skill / plugin kustom:** terbaik untuk akses API yang andal (Notion/HeyGen sama-sama punya API).
    - **Automasi browser:** bekerja tanpa kode tetapi lebih lambat dan lebih rapuh.

    Jika Anda ingin menjaga konteks per klien (alur kerja agency), pola sederhananya adalah:

    - Satu halaman Notion per klien (konteks + preferensi + pekerjaan aktif).
    - Minta agent mengambil halaman itu di awal sesi.

    Jika Anda ingin integrasi native, buka feature request atau buat Skill
    yang menargetkan API tersebut.

    Instal Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Instalasi native mendarat di direktori `skills/` workspace aktif. Untuk Skills bersama antar agent, letakkan di `~/.openclaw/skills/<name>/SKILL.md`. Jika hanya beberapa agent yang boleh melihat instalasi bersama, konfigurasi `agents.defaults.skills` atau `agents.list[].skills`. Beberapa Skills mengharapkan biner yang dipasang via Homebrew; di Linux itu berarti Linuxbrew (lihat entri FAQ Homebrew Linux di atas). Lihat [Skills](/tools/skills), [Skills config](/tools/skills-config), dan [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Chrome saya yang sudah login dengan OpenClaw?">
    Gunakan profil browser built-in `user`, yang terhubung melalui Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Jika Anda menginginkan nama kustom, buat profil MCP eksplisit:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Jalur ini bersifat lokal ke host. Jika Gateway berjalan di tempat lain, jalankan node host di mesin browser atau gunakan remote CDP.

    Batasan saat ini pada `existing-session` / `user`:

    - aksi berbasis ref, bukan berbasis CSS selector
    - upload memerlukan `ref` / `inputRef` dan saat ini hanya mendukung satu file per kali
    - `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan managed browser atau profil raw CDP

  </Accordion>
</AccordionGroup>

## Sandboxing dan memory

<AccordionGroup>
  <Accordion title="Apakah ada dokumentasi sandboxing khusus?">
    Ya. Lihat [Sandboxing](/id/gateway/sandboxing). Untuk penyiapan khusus Docker (gateway penuh di Docker atau image sandbox), lihat [Docker](/install/docker).
  </Accordion>

  <Accordion title="Docker terasa terbatas - bagaimana cara mengaktifkan fitur penuh?">
    Image default berfokus pada keamanan dan berjalan sebagai pengguna `node`, jadi tidak
    menyertakan paket sistem, Homebrew, atau browser bawaan. Untuk penyiapan yang lebih lengkap:

    - Persist `/home/node` dengan `OPENCLAW_HOME_VOLUME` agar cache tetap ada.
    - Bake dependensi sistem ke image dengan `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instal browser Playwright melalui CLI bawaan:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Set `PLAYWRIGHT_BROWSERS_PATH` dan pastikan path tersebut dipersistenkan.

    Dokumentasi: [Docker](/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Bisakah saya menjaga DM tetap pribadi tetapi membuat grup publik/tersandbox dengan satu agent?">
    Ya - jika traffic pribadi Anda adalah **DM** dan traffic publik Anda adalah **grup**.

    Gunakan `agents.defaults.sandbox.mode: "non-main"` sehingga sesi grup/channel (key non-main) berjalan di Docker, sementara sesi DM utama tetap di host. Lalu batasi tool yang tersedia di sesi yang tersandbox melalui `tools.sandbox.tools`.

    Panduan penyiapan + contoh config: [Groups: personal DMs + public groups](/id/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referensi config utama: [Gateway configuration](/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bagaimana cara memasang bind folder host ke sandbox?">
    Set `agents.defaults.sandbox.docker.binds` ke `["host:path:mode"]` (misalnya `"/home/user/src:/src:ro"`). Bind global + per-agent digabungkan; bind per-agent diabaikan saat `scope: "shared"`. Gunakan `:ro` untuk apa pun yang sensitif dan ingat bahwa bind melewati dinding filesystem sandbox.

    OpenClaw memvalidasi sumber bind terhadap path yang dinormalisasi dan path kanonis yang diresolve melalui ancestor terdalam yang ada. Itu berarti escape parent symlink tetap gagal tertutup bahkan ketika segmen path terakhir belum ada, dan pemeriksaan allowed-root tetap berlaku setelah resolusi symlink.

    Lihat [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts) dan [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) untuk contoh dan catatan keamanan.

  </Accordion>

  <Accordion title="Bagaimana cara kerja memory?">
    Memory OpenClaw hanyalah file Markdown di workspace agent:

    - Catatan harian di `memory/YYYY-MM-DD.md`
    - Catatan jangka panjang yang dikurasi di `MEMORY.md` (hanya sesi utama/pribadi)

    OpenClaw juga menjalankan **silent pre-compaction memory flush** untuk mengingatkan model
    menulis catatan yang tahan lama sebelum auto-compaction. Ini hanya berjalan saat workspace
    dapat ditulis (sandbox read-only melewatinya). Lihat [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Memory terus melupakan sesuatu. Bagaimana cara membuatnya melekat?">
    Minta bot untuk **menulis fakta itu ke memory**. Catatan jangka panjang sebaiknya masuk ke `MEMORY.md`,
    konteks jangka pendek masuk ke `memory/YYYY-MM-DD.md`.

    Ini masih area yang terus kami tingkatkan. Mengingatkan model untuk menyimpan memori sangat membantu;
    model akan tahu apa yang harus dilakukan. Jika masih sering lupa, pastikan Gateway menggunakan
    workspace yang sama setiap kali dijalankan.

    Dokumentasi: [Memory](/id/concepts/memory), [Agent workspace](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Apakah memory bertahan selamanya? Apa batasnya?">
    File memory hidup di disk dan bertahan sampai Anda menghapusnya. Batasnya adalah
    storage Anda, bukan model. **Konteks sesi** tetap dibatasi oleh jendela konteks
    model, jadi percakapan panjang dapat dipadatkan atau dipotong. Itulah alasan
    pencarian memory ada - ia hanya menarik bagian yang relevan kembali ke konteks.

    Dokumentasi: [Memory](/id/concepts/memory), [Context](/id/concepts/context).

  </Accordion>

  <Accordion title="Apakah pencarian memory semantik memerlukan OpenAI API key?">
    Hanya jika Anda menggunakan **OpenAI embeddings**. Codex OAuth mencakup chat/completions dan
    **tidak** memberikan akses embeddings, jadi **login dengan Codex (OAuth atau
    login Codex CLI)** tidak membantu untuk pencarian memory semantik. OpenAI embeddings
    tetap memerlukan API key nyata (`OPENAI_API_KEY` atau `models.providers.openai.apiKey`).

    Jika Anda tidak menyetel provider secara eksplisit, OpenClaw otomatis memilih provider ketika
    ia dapat mengresolve API key (auth profiles, `models.providers.*.apiKey`, atau env vars).
    Ia mengutamakan OpenAI jika API key OpenAI bisa diresolve, kalau tidak Gemini jika API key Gemini
    bisa diresolve, lalu Voyage, lalu Mistral. Jika tidak ada remote key yang tersedia, memory
    search tetap nonaktif sampai Anda mengonfigurasinya. Jika Anda memiliki jalur model lokal
    yang dikonfigurasi dan ada, OpenClaw
    mengutamakan `local`. Ollama didukung saat Anda secara eksplisit menyetel
    `memorySearch.provider = "ollama"`.

    Jika Anda lebih suka tetap lokal, set `memorySearch.provider = "local"` (dan opsional
    `memorySearch.fallback = "none"`). Jika Anda menginginkan Gemini embeddings, set
    `memorySearch.provider = "gemini"` dan berikan `GEMINI_API_KEY` (atau
    `memorySearch.remote.apiKey`). Kami mendukung model embedding **OpenAI, Gemini, Voyage, Mistral, Ollama, atau local**
    - lihat [Memory](/id/concepts/memory) untuk detail penyiapannya.

  </Accordion>
</AccordionGroup>

## Di mana hal-hal disimpan di disk

<AccordionGroup>
  <Accordion title="Apakah semua data yang digunakan dengan OpenClaw disimpan secara lokal?">
    Tidak - **state OpenClaw bersifat lokal**, tetapi **layanan eksternal tetap melihat apa yang Anda kirim kepada mereka**.

    - **Lokal secara default:** sesi, file memory, config, dan workspace hidup di gateway host
      (`~/.openclaw` + direktori workspace Anda).
    - **Remote karena keharusan:** pesan yang Anda kirim ke model providers (Anthropic/OpenAI/dll.) pergi ke
      API mereka, dan platform chat (WhatsApp/Telegram/Slack/dll.) menyimpan data pesan di
      server mereka.
    - **Anda mengendalikan jejaknya:** menggunakan model lokal menjaga prompt tetap di mesin Anda, tetapi traffic
      channel tetap melalui server channel tersebut.

    Terkait: [Agent workspace](/id/concepts/agent-workspace), [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Di mana OpenClaw menyimpan datanya?">
    Semuanya hidup di bawah `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`):

    | Path                                                            | Tujuan                                                             |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config utama (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Impor OAuth legacy (disalin ke auth profiles saat pertama dipakai) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys, dan `keyRef`/`tokenRef` opsional)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret berbasis file opsional untuk provider `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File kompatibilitas legacy (entri `api_key` statis dibersihkan)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | State provider (mis. `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | State per-agent (agentDir + sessions)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Riwayat percakapan & state (per agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata sesi (per agent)                                          |

    Path single-agent legacy: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).

    **Workspace** Anda (AGENTS.md, file memory, Skills, dll.) terpisah dan dikonfigurasi melalui `agents.defaults.workspace` (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Di mana AGENTS.md / SOUL.md / USER.md / MEMORY.md sebaiknya berada?">
    File-file ini hidup di **workspace agent**, bukan `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (atau fallback legacy `memory.md` saat `MEMORY.md` tidak ada),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opsional.
    - **State dir (`~/.openclaw`)**: config, state channel/provider, auth profiles, sessions, logs,
      dan Skills bersama (`~/.openclaw/skills`).

    Workspace default adalah `~/.openclaw/workspace`, dapat dikonfigurasi melalui:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Jika bot "lupa" setelah restart, pastikan Gateway menggunakan
    workspace yang sama pada setiap peluncuran (dan ingat: mode remote menggunakan **workspace milik gateway host**,
    bukan laptop lokal Anda).

    Tip: jika Anda menginginkan perilaku atau preferensi yang tahan lama, minta bot untuk **menuliskannya ke
    AGENTS.md atau MEMORY.md** alih-alih mengandalkan riwayat chat.

    Lihat [Agent workspace](/id/concepts/agent-workspace) dan [Memory](/id/concepts/memory).

  </Accordion>

  <Accordion title="Strategi backup yang direkomendasikan">
    Letakkan **workspace agent** Anda di repo git **private** dan cadangkan ke tempat
    privat (misalnya GitHub private). Ini menangkap memory + file AGENTS/SOUL/USER,
    dan memungkinkan Anda memulihkan "pikiran" asisten nanti.

    **Jangan** commit apa pun di bawah `~/.openclaw` (credentials, sessions, tokens, atau payload encrypted secrets).
    Jika Anda memerlukan pemulihan penuh, cadangkan workspace dan state directory
    secara terpisah (lihat pertanyaan migrasi di atas).

    Dokumentasi: [Agent workspace](/id/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bagaimana cara menghapus OpenClaw sepenuhnya?">
    Lihat panduan khusus: [Uninstall](/install/uninstall).
  </Accordion>

  <Accordion title="Bisakah agent bekerja di luar workspace?">
    Ya. Workspace adalah **cwd default** dan jangkar memory, bukan sandbox keras.
    Path relatif diresolve di dalam workspace, tetapi path absolut dapat mengakses lokasi host
    lain kecuali sandboxing diaktifkan. Jika Anda memerlukan isolasi, gunakan
    [`agents.defaults.sandbox`](/id/gateway/sandboxing) atau pengaturan sandbox per-agent. Jika Anda
    ingin repo menjadi direktori kerja default, arahkan
    `workspace` agent tersebut ke root repo. Repo OpenClaw hanyalah source code; simpan
    workspace terpisah kecuali Anda memang ingin agent bekerja di dalamnya.

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

  <Accordion title="Remote mode: di mana session store?">
    State sesi dimiliki oleh **gateway host**. Jika Anda dalam mode remote, session store yang relevan berada di mesin remote, bukan laptop lokal Anda. Lihat [Session management](/id/concepts/session).
  </Accordion>
</AccordionGroup>

## Dasar-dasar config

<AccordionGroup>
  <Accordion title="Apa format config-nya? Di mana letaknya?">
    OpenClaw membaca config **JSON5** opsional dari `$OPENCLAW_CONFIG_PATH` (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Jika file tidak ada, ia menggunakan default yang cukup aman (termasuk workspace default `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Saya menyetel gateway.bind: "lan" (atau "tailnet") dan sekarang tidak ada yang listen / UI mengatakan unauthorized'>
    Bind non-loopback **memerlukan jalur auth gateway yang valid**. Dalam praktiknya itu berarti:

    - auth shared-secret: token atau kata sandi
    - `gateway.auth.mode: "trusted-proxy"` di belakang identity-aware reverse proxy non-loopback yang dikonfigurasi dengan benar

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
    - Jalur panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak disetel.
    - Untuk auth kata sandi, set `gateway.auth.mode: "password"` plus `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`) sebagai gantinya.
    - Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak ter-resolve, resolusi gagal tertutup (tanpa fallback remote yang menutupi masalah).
    - Penyiapan Control UI shared-secret mengautentikasi melalui `connect.params.auth.token` atau `connect.params.auth.password` (disimpan di pengaturan app/UI). Mode pembawa identitas seperti Tailscale Serve atau `trusted-proxy` menggunakan header request sebagai gantinya. Hindari menaruh shared secret di URL.
    - Dengan `gateway.auth.mode: "trusted-proxy"`, reverse proxy loopback di host yang sama tetap **tidak** memenuhi auth trusted-proxy. Trusted proxy harus merupakan sumber non-loopback yang dikonfigurasi.

  </Accordion>

  <Accordion title="Mengapa sekarang saya memerlukan token di localhost?">
    OpenClaw menegakkan auth gateway secara default, termasuk loopback. Dalam jalur default normal itu berarti auth token: jika tidak ada jalur auth eksplisit yang dikonfigurasi, startup gateway beresolusi ke mode token dan menghasilkan token secara otomatis, menyimpannya ke `gateway.auth.token`, sehingga **klien WS lokal harus mengautentikasi**. Ini mencegah proses lokal lain memanggil Gateway.

    Jika Anda lebih suka jalur auth lain, Anda dapat secara eksplisit memilih mode kata sandi (atau, untuk reverse proxy non-loopback yang identity-aware, `trusted-proxy`). Jika Anda **benar-benar** menginginkan loopback terbuka, set `gateway.auth.mode: "none"` secara eksplisit di config Anda. Doctor dapat membuat token kapan saja: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Apakah saya harus restart setelah mengubah config?">
    Gateway mengawasi config dan mendukung hot-reload:

    - `gateway.reload.mode: "hybrid"` (default): menerapkan perubahan aman secara hot, restart untuk perubahan kritis
    - `hot`, `restart`, `off` juga didukung

  </Accordion>

  <Accordion title="Bagaimana cara menonaktifkan tagline CLI yang lucu?">
    Set `cli.banner.taglineMode` di config:

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
    - `random`: tagline lucu/musiman yang berputar (perilaku default).
    - Jika Anda tidak ingin ada banner sama sekali, set env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Bagaimana cara mengaktifkan web search (dan web fetch)?">
    `web_fetch` bekerja tanpa API key. `web_search` bergantung pada provider
    yang Anda pilih:

    - Provider berbasis API seperti Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, dan Tavily memerlukan penyiapan API key normal mereka.
    - Ollama Web Search tidak memerlukan key, tetapi menggunakan host Ollama yang Anda konfigurasi dan memerlukan `ollama signin`.
    - DuckDuckGo tidak memerlukan key, tetapi merupakan integrasi tidak resmi berbasis HTML.
    - SearXNG tidak memerlukan key/self-hosted; konfigurasi `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Direkomendasikan:** jalankan `openclaw configure --section web` dan pilih provider.
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
              provider: "firecrawl", // opsional; hilangkan untuk auto-detect
            },
          },
        },
    }
    ```

    Config web-search khusus provider sekarang hidup di bawah `plugins.entries.<plugin>.config.webSearch.*`.
    Jalur provider legacy `tools.web.search.*` masih dimuat sementara untuk kompatibilitas, tetapi tidak boleh digunakan untuk config baru.
    Config fallback web-fetch Firecrawl berada di bawah `plugins.entries.firecrawl.config.webFetch.*`.

    Catatan:

    - Jika Anda menggunakan allowlist, tambahkan `web_search`/`web_fetch`/`x_search` atau `group:web`.
    - `web_fetch` aktif secara default (kecuali dinonaktifkan secara eksplisit).
    - Jika `tools.web.fetch.provider` dihilangkan, OpenClaw otomatis mendeteksi provider fallback fetch siap pakai pertama dari kredensial yang tersedia. Saat ini provider bundled adalah Firecrawl.
    - Daemon membaca env vars dari `~/.openclaw/.env` (atau environment layanan).

    Dokumentasi: [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply menghapus config saya. Bagaimana cara memulihkan dan menghindarinya?">
    `config.apply` mengganti **seluruh config**. Jika Anda mengirim objek parsial, semua yang
    lain akan dihapus.

    Pulihkan:

    - Pulihkan dari backup (git atau salinan `~/.openclaw/openclaw.json`).
    - Jika Anda tidak punya backup, jalankan ulang `openclaw doctor` dan konfigurasikan ulang channels/models.
    - Jika ini tidak diharapkan, buat bug report dan sertakan config terakhir yang Anda ketahui atau backup apa pun.
    - Agent coding lokal sering dapat merekonstruksi config yang berfungsi dari log atau riwayat.

    Hindari:

    - Gunakan `openclaw config set` untuk perubahan kecil.
    - Gunakan `openclaw configure` untuk edit interaktif.
    - Gunakan `config.schema.lookup` terlebih dahulu saat Anda tidak yakin tentang path atau bentuk field yang tepat; ia mengembalikan node schema dangkal plus ringkasan child langsung untuk penelusuran lebih lanjut.
    - Gunakan `config.patch` untuk edit RPC parsial; simpan `config.apply` hanya untuk penggantian config penuh.
    - Jika Anda menggunakan tool `gateway` owner-only dari eksekusi agent, ia tetap akan menolak penulisan ke `tools.exec.ask` / `tools.exec.security` (termasuk alias legacy `tools.bash.*` yang dinormalisasi ke path exec terlindungi yang sama).

    Dokumentasi: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan Gateway pusat dengan worker khusus di berbagai perangkat?">
    Pola yang umum adalah **satu Gateway** (mis. Raspberry Pi) plus **nodes** dan **agents**:

    - **Gateway (pusat):** memiliki channels (Signal/WhatsApp), routing, dan sessions.
    - **Nodes (perangkat):** Mac/iOS/Android terhubung sebagai periferal dan mengekspos tool lokal (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** otak/workspace terpisah untuk peran khusus (mis. "Hetzner ops", "Personal data").
    - **Sub-agents:** spawn pekerjaan latar belakang dari agent utama saat Anda menginginkan paralelisme.
    - **TUI:** terhubung ke Gateway dan beralih agent/session.

    Dokumentasi: [Nodes](/nodes), [Remote access](/id/gateway/remote), [Multi-Agent Routing](/id/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Bisakah browser OpenClaw berjalan headless?">
    Ya. Ini adalah opsi config:

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

    Default-nya adalah `false` (headful). Headless lebih mungkin memicu pemeriksaan anti-bot pada beberapa situs. Lihat [Browser](/tools/browser).

    Headless menggunakan **engine Chromium yang sama** dan berfungsi untuk sebagian besar automasi (formulir, klik, scraping, login). Perbedaan utamanya:

    - Tidak ada jendela browser yang terlihat (gunakan screenshot jika Anda memerlukan visual).
    - Beberapa situs lebih ketat terhadap automasi dalam mode headless (CAPTCHA, anti-bot).
      Misalnya, X/Twitter sering memblokir sesi headless.

  </Accordion>

  <Accordion title="Bagaimana cara menggunakan Brave untuk kontrol browser?">
    Set `browser.executablePath` ke biner Brave Anda (atau browser berbasis Chromium lain) dan restart Gateway.
    Lihat contoh config lengkap di [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remote dan nodes

<AccordionGroup>
  <Accordion title="Bagaimana perintah dipropagasikan antara Telegram, gateway, dan nodes?">
    Pesan Telegram ditangani oleh **gateway**. Gateway menjalankan agent dan
    baru kemudian memanggil nodes melalui **Gateway WebSocket** saat tool node dibutuhkan:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes tidak melihat traffic provider masuk; mereka hanya menerima panggilan RPC node.

  </Accordion>

  <Accordion title="Bagaimana agent saya bisa mengakses komputer saya jika Gateway di-host secara remote?">
    Jawaban singkat: **pasangkan komputer Anda sebagai node**. Gateway berjalan di tempat lain, tetapi ia dapat
    memanggil tool `node.*` (screen, camera, system) di mesin lokal Anda melalui Gateway WebSocket.

    Penyiapan umum:

    1. Jalankan Gateway di host yang selalu aktif (VPS/home server).
    2. Letakkan gateway host + komputer Anda di tailnet yang sama.
    3. Pastikan WS Gateway dapat dijangkau (tailnet bind atau SSH tunnel).
    4. Buka app macOS secara lokal dan hubungkan dalam mode **Remote over SSH** (atau tailnet langsung)
       agar ia bisa terdaftar sebagai node.
    5. Setujui node di Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Tidak diperlukan bridge TCP terpisah; nodes terhubung melalui Gateway WebSocket.

    Pengingat keamanan: memasangkan node macOS memungkinkan `system.run` di mesin tersebut. Hanya
    pasangkan perangkat yang Anda percayai, dan tinjau [Security](/gateway/security).

    Dokumentasi: [Nodes](/nodes), [Gateway protocol](/id/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/gateway/security).

  </Accordion>

  <Accordion title="Tailscale terhubung tetapi saya tidak mendapat balasan. Sekarang bagaimana?">
    Periksa dasar-dasarnya:

    - Gateway berjalan: `openclaw gateway status`
    - Kesehatan Gateway: `openclaw status`
    - Kesehatan channel: `openclaw channels status`

    Lalu verifikasi auth dan routing:

    - Jika Anda menggunakan Tailscale Serve, pastikan `gateway.auth.allowTailscale` diatur dengan benar.
    - Jika Anda terhubung melalui SSH tunnel, pastikan tunnel lokal aktif dan mengarah ke port yang benar.
    - Pastikan allowlist Anda (DM atau grup) menyertakan akun Anda.

    Dokumentasi: [Tailscale](/id/gateway/tailscale), [Remote access](/id/gateway/remote), [Channels](/id/channels).

  </Accordion>

  <Accordion title="Bisakah dua instance OpenClaw saling berbicara (lokal + VPS)?">
    Ya. Tidak ada bridge "bot-to-bot" bawaan, tetapi Anda dapat menghubungkannya dengan beberapa
    cara yang andal:

    **Paling sederhana:** gunakan channel chat biasa yang dapat diakses kedua bot (Telegram/Slack/WhatsApp).
    Buat Bot A mengirim pesan ke Bot B, lalu biarkan Bot B membalas seperti biasa.

    **Bridge CLI (generik):** jalankan skrip yang memanggil Gateway lain dengan
    `openclaw agent --message ... --deliver`, menargetkan chat tempat bot lain
    mendengarkan. Jika salah satu bot berada di VPS remote, arahkan CLI Anda ke Gateway remote tersebut
    via SSH/Tailscale (lihat [Remote access](/id/gateway/remote)).

    Contoh pola (jalankan dari mesin yang dapat menjangkau Gateway target):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: tambahkan guardrail agar kedua bot tidak terus berputar tanpa henti (hanya saat mention,
    allowlist channel, atau aturan "jangan balas pesan bot").

    Dokumentasi: [Remote access](/id/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Apakah saya memerlukan VPS terpisah untuk beberapa agent?">
    Tidak. Satu Gateway dapat meng-host banyak agent, masing-masing dengan workspace, model default,
    dan routing sendiri. Itulah penyiapan normal dan jauh lebih murah serta lebih sederhana daripada menjalankan
    satu VPS per agent.

    Gunakan VPS terpisah hanya ketika Anda memerlukan isolasi keras (batas keamanan) atau config yang sangat
    berbeda yang tidak ingin Anda bagikan. Jika tidak, pertahankan satu Gateway dan
    gunakan banyak agent atau sub-agents.

  </Accordion>

  <Accordion title="Apakah ada manfaat menggunakan node di laptop pribadi saya alih-alih SSH dari VPS?">
    Ya - nodes adalah cara first-class untuk menjangkau laptop Anda dari Gateway remote, dan mereka
    membuka lebih dari sekadar akses shell. Gateway berjalan di macOS/Linux (Windows melalui WSL2) dan
    ringan (VPS kecil atau mesin kelas Raspberry Pi cukup; RAM 4 GB sudah lebih dari cukup), jadi penyiapan umum
    adalah host yang selalu aktif plus laptop Anda sebagai node.

    - **Tidak memerlukan SSH masuk.** Nodes terhubung keluar ke Gateway WebSocket dan menggunakan pairing perangkat.
    - **Kontrol eksekusi lebih aman.** `system.run` digate oleh allowlist/persetujuan node di laptop tersebut.
    - **Lebih banyak tool perangkat.** Nodes mengekspos `canvas`, `camera`, dan `screen` selain `system.run`.
    - **Automasi browser lokal.** Pertahankan Gateway di VPS, tetapi jalankan Chrome secara lokal melalui node host di laptop, atau sambungkan ke Chrome lokal di host melalui Chrome MCP.

    SSH baik untuk akses shell ad-hoc, tetapi nodes lebih sederhana untuk alur kerja agent yang sedang berjalan dan
    automasi perangkat.

    Dokumentasi: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Apakah nodes menjalankan layanan gateway?">
    Tidak. Hanya **satu gateway** yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Multiple gateways](/id/gateway/multiple-gateways)). Nodes adalah periferal yang terhubung
    ke gateway (node iOS/Android, atau "node mode" macOS di app menubar). Untuk node
    host headless dan kontrol CLI, lihat [Node host CLI](/cli/node).

    Restart penuh diperlukan untuk perubahan `gateway`, `discovery`, dan `canvasHost`.

  </Accordion>

  <Accordion title="Apakah ada cara API / RPC untuk menerapkan config?">
    Ya.

    - `config.schema.lookup`: memeriksa satu subtree config dengan node schema dangkalnya, hint UI yang cocok, dan ringkasan child langsung sebelum menulis
    - `config.get`: mengambil snapshot + hash saat ini
    - `config.patch`: pembaruan parsial aman (direkomendasikan untuk sebagian besar edit RPC)
    - `config.apply`: memvalidasi + mengganti config penuh, lalu restart
    - Tool runtime `gateway` owner-only tetap menolak penulisan ulang `tools.exec.ask` / `tools.exec.security`; alias legacy `tools.bash.*` dinormalisasi ke path exec terlindungi yang sama

  </Accordion>

  <Accordion title="Config minimal yang masuk akal untuk instalasi pertama">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Ini menyetel workspace Anda dan membatasi siapa yang bisa memicu bot.

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan Tailscale di VPS dan terhubung dari Mac saya?">
    Langkah minimal:

    1. **Instal + login di VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instal + login di Mac Anda**
       - Gunakan app Tailscale dan masuk ke tailnet yang sama.
    3. **Aktifkan MagicDNS (direkomendasikan)**
       - Di konsol admin Tailscale, aktifkan MagicDNS agar VPS memiliki nama yang stabil.
    4. **Gunakan hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Jika Anda ingin Control UI tanpa SSH, gunakan Tailscale Serve di VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Ini menjaga gateway tetap bind ke loopback dan mengekspos HTTPS melalui Tailscale. Lihat [Tailscale](/id/gateway/tailscale).

  </Accordion>

  <Accordion title="Bagaimana cara menghubungkan node Mac ke Gateway remote (Tailscale Serve)?">
    Serve mengekspos **Gateway Control UI + WS**. Nodes terhubung melalui endpoint WS Gateway yang sama.

    Penyiapan yang direkomendasikan:

    1. **Pastikan VPS + Mac berada di tailnet yang sama**.
    2. **Gunakan app macOS dalam mode Remote** (target SSH bisa berupa hostname tailnet).
       App akan men-tunnel port Gateway dan terhubung sebagai node.
    3. **Setujui node** di gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentasi: [Gateway protocol](/id/gateway/protocol), [Discovery](/id/gateway/discovery), [macOS remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sebaiknya saya memasang di laptop kedua atau cukup menambah node?">
    Jika Anda hanya memerlukan **tool lokal** (screen/camera/exec) di laptop kedua, tambahkan sebagai
    **node**. Itu mempertahankan satu Gateway dan menghindari config ganda. Tool node lokal
    saat ini hanya khusus macOS, tetapi kami berencana memperluasnya ke OS lain.

    Instal Gateway kedua hanya ketika Anda memerlukan **isolasi keras** atau dua bot yang benar-benar terpisah.

    Dokumentasi: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/id/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars dan pemuatan .env

<AccordionGroup>
  <Accordion title="Bagaimana OpenClaw memuat environment variables?">
    OpenClaw membaca env vars dari parent process (shell, launchd/systemd, CI, dll.) dan juga memuat:

    - `.env` dari current working directory
    - fallback `.env` global dari `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Kedua file `.env` tidak menimpa env vars yang sudah ada.

    Anda juga dapat mendefinisikan env vars inline di config (hanya diterapkan jika tidak ada di process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Lihat [/environment](/help/environment) untuk prioritas dan sumber lengkap.

  </Accordion>

  <Accordion title="Saya memulai Gateway melalui layanan dan env vars saya hilang. Sekarang bagaimana?">
    Dua perbaikan umum:

    1. Letakkan key yang hilang di `~/.openclaw/.env` agar tetap diambil meskipun layanan tidak mewarisi shell env Anda.
    2. Aktifkan shell import (kemudahan opsional):

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

    Ini menjalankan login shell Anda dan hanya mengimpor key yang diharapkan yang masih hilang (tidak pernah menimpa). Ekuivalen env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Saya menyetel COPILOT_GITHUB_TOKEN, tetapi models status menampilkan "Shell env: off." Mengapa?'>
    `openclaw models status` melaporkan apakah **shell env import** diaktifkan. "Shell env: off"
    **tidak** berarti env vars Anda hilang - itu hanya berarti OpenClaw tidak akan memuat
    login shell Anda secara otomatis.

    Jika Gateway berjalan sebagai layanan (launchd/systemd), ia tidak akan mewarisi shell
    environment Anda. Perbaiki dengan salah satu cara berikut:

    1. Letakkan token di `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Atau aktifkan shell import (`env.shellEnv.enabled: true`).
    3. Atau tambahkan ke blok `env` config Anda (hanya diterapkan jika masih hilang).

    Lalu restart gateway dan periksa ulang:

    ```bash
    openclaw models status
    ```

    Token Copilot dibaca dari `COPILOT_GITHUB_TOKEN` (juga `GH_TOKEN` / `GITHUB_TOKEN`).
    Lihat [/concepts/model-providers](/id/concepts/model-providers) dan [/environment](/help/environment).

  </Accordion>
</AccordionGroup>

## Sesi dan beberapa chat

<AccordionGroup>
  <Accordion title="Bagaimana cara memulai percakapan baru?">
    Kirim `/new` atau `/reset` sebagai pesan mandiri. Lihat [Session management](/id/concepts/session).
  </Accordion>

  <Accordion title="Apakah sesi di-reset secara otomatis jika saya tidak pernah mengirim /new?">
    Sesi dapat kedaluwarsa setelah `session.idleMinutes`, tetapi ini **dinonaktifkan secara default** (default **0**).
    Set ke nilai positif untuk mengaktifkan kedaluwarsa idle. Saat diaktifkan, pesan **berikutnya**
    setelah periode idle memulai session id baru untuk key chat tersebut.
    Ini tidak menghapus transkrip - hanya memulai sesi baru.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Apakah ada cara membuat tim instance OpenClaw (satu CEO dan banyak agent)?">
    Ya, melalui **multi-agent routing** dan **sub-agents**. Anda dapat membuat satu agent koordinator
    dan beberapa worker agent dengan workspace dan model mereka sendiri.

    Meski begitu, ini sebaiknya dipandang sebagai **eksperimen yang menyenangkan**. Ini boros token dan sering
    kurang efisien dibanding menggunakan satu bot dengan sesi terpisah. Model yang umumnya kami
    bayangkan adalah satu bot yang Anda ajak bicara, dengan sesi berbeda untuk pekerjaan paralel. Bot itu
    juga dapat melakukan spawn sub-agent bila diperlukan.

    Dokumentasi: [Multi-agent routing](/id/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Mengapa konteks terpotong di tengah tugas? Bagaimana cara mencegahnya?">
    Konteks sesi dibatasi oleh jendela model. Chat panjang, output tool yang besar, atau banyak
    file dapat memicu compaction atau truncation.

    Yang membantu:

    - Minta bot merangkum state saat ini dan menuliskannya ke file.
    - Gunakan `/compact` sebelum tugas panjang, dan `/new` saat berganti topik.
    - Simpan konteks penting di workspace dan minta bot membacanya kembali.
    - Gunakan sub-agents untuk pekerjaan panjang atau paralel agar chat utama tetap lebih kecil.
    - Pilih model dengan jendela konteks lebih besar jika ini sering terjadi.

  </Accordion>

  <Accordion title="Bagaimana cara mereset OpenClaw sepenuhnya tetapi tetap terinstal?">
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

    - Onboarding juga menawarkan **Reset** jika melihat config yang sudah ada. Lihat [Onboarding (CLI)](/start/wizard).
    - Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), reset setiap state dir (default adalah `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (khusus dev; menghapus config + credentials + sessions + workspace dev).

  </Accordion>

  <Accordion title='Saya mendapat error "context too large" - bagaimana cara reset atau compact?'>
    Gunakan salah satu dari ini:

    - **Compact** (menjaga percakapan tetapi merangkum giliran yang lebih lama):

      ```
      /compact
      ```

      atau `/compact <instructions>` untuk memandu ringkasan.

    - **Reset** (session ID baru untuk key chat yang sama):

      ```
      /new
      /reset
      ```

    Jika terus terjadi:

    - Aktifkan atau sesuaikan **session pruning** (`agents.defaults.contextPruning`) untuk memangkas output tool lama.
    - Gunakan model dengan jendela konteks lebih besar.

    Dokumentasi: [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning), [Session management](/id/concepts/session).

  </Accordion>

  <Accordion title='Mengapa saya melihat "LLM request rejected: messages.content.tool_use.input field required"?'>
    Ini adalah error validasi provider: model mengeluarkan blok `tool_use` tanpa
    `input` yang wajib. Biasanya ini berarti riwayat sesi basi atau rusak (sering setelah thread panjang
    atau perubahan tool/schema).

    Perbaikan: mulai sesi baru dengan `/new` (pesan mandiri).

  </Accordion>

  <Accordion title="Mengapa saya mendapat pesan heartbeat setiap 30 menit?">
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
    markdown seperti `# Heading`), OpenClaw melewati heartbeat run untuk menghemat panggilan API.
    Jika file tidak ada, heartbeat tetap berjalan dan model memutuskan apa yang harus dilakukan.

    Override per-agent menggunakan `agents.list[].heartbeat`. Dokumentasi: [Heartbeat](/id/gateway/heartbeat).

  </Accordion>

  <Accordion title='Apakah saya perlu menambahkan "akun bot" ke grup WhatsApp?'>
    Tidak. OpenClaw berjalan di **akun Anda sendiri**, jadi jika Anda berada di grup itu, OpenClaw dapat melihatnya.
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
    Opsi 1 (tercepat): tail log dan kirim pesan uji di grup:

    ```bash
    openclaw logs --follow --json
    ```

    Cari `chatId` (atau `from`) yang berakhiran `@g.us`, seperti:
    `1234567890-1234567890@g.us`.

    Opsi 2 (jika sudah dikonfigurasi/di-allowlist): daftar grup dari config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Mengapa OpenClaw tidak membalas di grup?">
    Dua penyebab umum:

    - Mention gating aktif (default). Anda harus @mention bot (atau cocok dengan `mentionPatterns`).
    - Anda mengonfigurasi `channels.whatsapp.groups` tanpa `"*"` dan grup itu tidak ada dalam allowlist.

    Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).

  </Accordion>

  <Accordion title="Apakah grup/thread berbagi konteks dengan DM?">
    Chat langsung runtuh ke sesi utama secara default. Grup/channel memiliki session key sendiri, dan topic Telegram / thread Discord adalah sesi terpisah. Lihat [Groups](/id/channels/groups) dan [Group messages](/id/channels/group-messages).
  </Accordion>

  <Accordion title="Berapa banyak workspace dan agent yang bisa saya buat?">
    Tidak ada batas keras. Puluhan (bahkan ratusan) tidak masalah, tetapi perhatikan:

    - **Pertumbuhan disk:** sessions + transkrip hidup di bawah `~/.openclaw/agents/<agentId>/sessions/`.
    - **Biaya token:** lebih banyak agent berarti lebih banyak penggunaan model bersamaan.
    - **Beban operasional:** auth profiles, workspaces, dan routing channel per-agent.

    Tip:

    - Pertahankan satu workspace **aktif** per agent (`agents.defaults.workspace`).
    - Pangkas sesi lama (hapus JSONL atau entri store) jika disk membesar.
    - Gunakan `openclaw doctor` untuk menemukan workspace liar dan ketidakcocokan profil.

  </Accordion>

  <Accordion title="Bisakah saya menjalankan beberapa bot atau chat pada saat yang sama (Slack), dan bagaimana sebaiknya saya menyiapkannya?">
    Ya. Gunakan **Multi-Agent Routing** untuk menjalankan beberapa agent terisolasi dan merutekan pesan masuk berdasarkan
    channel/account/peer. Slack didukung sebagai channel dan dapat diikat ke agent tertentu.

    Akses browser sangat kuat tetapi bukan berarti "bisa melakukan apa pun yang bisa dilakukan manusia" - anti-bot, CAPTCHA, dan MFA tetap
    dapat memblokir automasi. Untuk kontrol browser yang paling andal, gunakan Chrome MCP lokal di host,
    atau gunakan CDP di mesin yang benar-benar menjalankan browser.

    Penyiapan praktik terbaik:

    - Gateway host yang selalu aktif (VPS/Mac mini).
    - Satu agent per peran (bindings).
    - Channel Slack terikat ke agent tersebut.
    - Browser lokal melalui Chrome MCP atau node bila diperlukan.

    Dokumentasi: [Multi-Agent Routing](/id/concepts/multi-agent), [Slack](/id/channels/slack),
    [Browser](/tools/browser), [Nodes](/nodes).

  </Accordion>
</AccordionGroup>

## Models: default, pemilihan, alias, peralihan

<AccordionGroup>
  <Accordion title='Apa itu "default model"?'>
    Default model OpenClaw adalah apa pun yang Anda set sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model direferensikan sebagai `provider/model` (contoh: `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw mula-mula mencoba alias, lalu kecocokan provider terkonfigurasi yang unik untuk model id persis itu, dan baru kemudian fallback ke provider default yang dikonfigurasi sebagai jalur kompatibilitas deprecated. Jika provider itu tidak lagi mengekspos default model yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama alih-alih memunculkan default provider yang basi dan telah dihapus. Anda tetap harus **secara eksplisit** menyetel `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia dalam stack provider Anda.
    **Untuk agent dengan tool atau input tak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan route berdasarkan peran agent.

    MiniMax memiliki dokumentasinya sendiri: [MiniMax](/providers/minimax) dan
    [Local models](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda beli** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agent dan menggunakan sub-agents untuk
    memparalelkan tugas panjang (setiap sub-agent mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/tools/subagents).

    Peringatan kuat: model yang lebih lemah/terlalu dikuantisasi lebih rentan terhadap prompt
    injection dan perilaku tidak aman. Lihat [Security](/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya field **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang berniat mengganti seluruh config.
    Untuk edit RPC, periksa dengan `config.schema.lookup` terlebih dahulu dan utamakan `config.patch`. Payload lookup memberi Anda path yang dinormalisasi, dokumen/kendala schema dangkal, dan ringkasan child langsung
    untuk pembaruan parsial.
    Jika Anda memang menimpa config, pulihkan dari backup atau jalankan ulang `openclaw doctor` untuk memperbaiki.

    Dokumentasi: [Models](/id/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal seperti `ollama pull glm-4.7-flash`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang bisa menggunakan tools.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist tool yang ketat.

    Dokumentasi: [Ollama](/providers/ollama), [Local models](/id/gateway/local-models),
    [Model providers](/id/concepts/model-providers), [Security](/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini dapat berbeda dan bisa berubah seiring waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini pada masing-masing gateway dengan `openclaw models status`.
    - Untuk agent yang sensitif terhadap keamanan/menggunakan tools, gunakan model generasi terbaru terkuat yang tersedia.
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

    Itu adalah alias bawaan. Alias kustom dapat ditambahkan melalui `agents.defaults.models`.

    Anda dapat membuat daftar model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

    `/model` (dan `/model list`) menampilkan pemilih yang ringkas dan bernomor. Pilih dengan nomor:

    ```
    /model 3
    ```

    Anda juga dapat memaksa auth profile tertentu untuk provider (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agent mana yang aktif, file `auth-profiles.json` mana yang sedang digunakan, dan auth profile mana yang akan dicoba berikutnya.
    Ia juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

    **Bagaimana cara melepas pin profile yang saya set dengan @profile?**

    Jalankan ulang `/model` **tanpa** sufiks `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk memastikan auth profile mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.2 untuk tugas harian dan Codex 5.3 untuk coding?">
    Ya. Set satu sebagai default dan ganti sesuai kebutuhan:

    - **Peralihan cepat (per sesi):** `/model gpt-5.4` untuk tugas harian, `/model openai-codex/gpt-5.4` untuk coding dengan Codex OAuth.
    - **Default + peralihan:** set `agents.defaults.model.primary` ke `openai/gpt-5.4`, lalu beralih ke `openai-codex/gpt-5.4` saat coding (atau sebaliknya).
    - **Sub-agents:** route tugas coding ke sub-agents dengan default model berbeda.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan semua
    override sesi. Memilih model yang tidak ada dalam daftar itu akan mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model tersebut ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ada config provider MiniMax atau auth
    profile yang ditemukan), sehingga model tidak dapat diresolve.

    Checklist perbaikan:

    1. Tingkatkan ke rilis OpenClaw terbaru (atau jalankan dari source `main`), lalu restart gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/auth profiles sehingga provider yang cocok dapat diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth yang tersimpan untuk `minimax-portal`).
    3. Gunakan model id yang tepat (case-sensitive) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       API key, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       dan pilih dari daftar (atau `/model list` di chat).

    Lihat [MiniMax](/providers/minimax) dan [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan ganti model **per sesi** saat diperlukan.
    Fallback digunakan untuk **error**, bukan "tugas sulit", jadi gunakan `/model` atau agent terpisah.

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
    - Route berdasarkan agent atau gunakan `/agent` untuk beralih

    Dokumentasi: [Models](/id/concepts/models), [Multi-Agent Routing](/id/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah shortcut bawaan?">
    Ya. OpenClaw menyediakan beberapa shorthand default (hanya diterapkan ketika model ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menyetel alias sendiri dengan nama yang sama, nilai Anda yang menang.

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

    Lalu `/model sonnet` (atau `/<alias>` jika didukung) akan diresolve ke model ID tersebut.

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

    Jika Anda mereferensikan provider/model tetapi provider key yang dibutuhkan tidak ada, Anda akan mendapatkan runtime auth error (mis. `No API key found for provider "zai"`).

    **No API key found for provider setelah menambahkan agent baru**

    Ini biasanya berarti **agent baru** memiliki auth store kosong. Auth bersifat per-agent dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan auth selama wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agent utama ke `agentDir` agent baru.

    **Jangan** gunakan ulang `agentDir` di beberapa agent; itu menyebabkan tabrakan auth/session.

  </Accordion>
</AccordionGroup>

## Failover model dan "All models failed"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi auth profile** dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku untuk profil yang gagal (exponential backoff), sehingga OpenClaw dapat tetap merespons bahkan ketika provider terkena rate limit atau sementara gagal.

    Bucket rate-limit mencakup lebih dari sekadar respons `429` biasa. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    rate limit yang layak memicu failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada di bucket transien tersebut. Jika provider mengembalikan
    teks penagihan eksplisit pada `401` atau `403`, OpenClaw masih dapat menyimpannya
    di jalur penagihan, tetapi matcher teks khusus provider tetap dibatasi pada
    provider pemiliknya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru terlihat seperti jendela penggunaan yang dapat dicoba ulang atau
    batas pengeluaran organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan disable penagihan jangka panjang.

    Error context-overflow berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur compaction/retry alih-alih memajukan model
    fallback.

    Teks generic server-error sengaja dibuat lebih sempit daripada "apa pun yang
    mengandung unknown/error". OpenClaw memang memperlakukan bentuk transien khusus provider
    seperti Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, error stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server transien
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider-busy seperti `ModelNotReadyException` sebagai
    sinyal timeout/overloaded yang layak memicu failover ketika konteks provider
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu model fallback dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Itu berarti sistem mencoba menggunakan auth profile ID `anthropic:default`, tetapi tidak dapat menemukan kredensial untuknya di auth store yang diharapkan.

    **Checklist perbaikan:**

    - **Pastikan di mana auth profiles berada** (path baru vs legacy)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Pastikan env var Anda dimuat oleh Gateway**
      - Jika Anda menyetel `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Letakkan di `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda mengedit agent yang benar**
      - Penyiapan multi-agent berarti bisa ada beberapa file `auth-profiles.json`.
    - **Lakukan sanity-check status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider terautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti run dipin ke auth profile Anthropic, tetapi Gateway
    tidak dapat menemukannya di auth store.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` di gateway host.
    - **Jika Anda ingin menggunakan API key**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **gateway host**.
      - Hapus urutan pin apa pun yang memaksa profile yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Pastikan Anda menjalankan perintah di gateway host**
      - Dalam mode remote, auth profiles hidup di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa ia juga mencoba Google Gemini lalu gagal?">
    Jika config model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya selama model fallback. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak diarahkan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok thinking tanpa signature** (sering dari
    stream yang dibatalkan/parsial). Google Antigravity mewajibkan signature untuk blok thinking.

    Perbaikan: OpenClaw sekarang menghapus blok thinking tanpa signature untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau set `/thinking off` untuk agent tersebut.

  </Accordion>
</AccordionGroup>

## Auth profiles: apa itu dan bagaimana mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu auth profile?">
    Auth profile adalah catatan kredensial bernama (OAuth atau API key) yang terikat ke provider. Profiles hidup di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Apa profile ID yang umum?">
    OpenClaw menggunakan ID berawalan provider seperti:

    - `anthropic:default` (umum ketika tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (mis. `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol auth profile mana yang dicoba lebih dulu?">
    Ya. Config mendukung metadata opsional untuk profiles dan urutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat melewati sebuah profile sementara jika berada dalam **cooldown** singkat (rate limits/timeouts/auth failures) atau status **disabled** yang lebih lama (billing/insufficient credits). Untuk memeriksanya, jalankan `openclaw models status --json` dan lihat `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate-limit dapat bersifat model-scoped. Profile yang sedang cooldown
    untuk satu model masih dapat digunakan untuk model saudara pada provider yang sama,
    sedangkan jendela billing/disabled tetap memblokir seluruh profile.

    Anda juga dapat menetapkan override urutan **per-agent** (disimpan di `auth-profiles.json` agent tersebut) melalui CLI:

    ```bash
    # Default ke agent default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profile (hanya coba yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau set urutan eksplisit (fallback dalam provider)
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

    Jika profile tersimpan dihilangkan dari urutan eksplisit, probe melaporkan
    `excluded_by_auth_order` untuk profile itu alih-alih mencobanya secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs API key - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (bila berlaku).
    - **API key** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan API keys.

  </Accordion>
</AccordionGroup>

## Gateway: port, "already running", dan mode remote

<AccordionGroup>
  <Accordion title="Port apa yang digunakan Gateway?">
    `gateway.port` mengontrol satu port multipleks untuk WebSocket + HTTP (Control UI, hooks, dll.).

    Prioritas:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status mengatakan "Runtime: running" tetapi "RPC probe: failed"?'>
    Karena "running" adalah sudut pandang **supervisor** (launchd/systemd/schtasks). Probe RPC adalah CLI yang benar-benar terhubung ke gateway WebSocket dan memanggil `status`.

    Gunakan `openclaw gateway status` dan percayai baris-baris ini:

    - `Probe target:` (URL yang benar-benar digunakan probe)
    - `Listening:` (apa yang benar-benar bind di port tersebut)
    - `Last gateway error:` (akar masalah umum saat proses hidup tetapi port tidak listen)

  </Accordion>

  <Accordion title='Mengapa openclaw gateway status menampilkan "Config (cli)" dan "Config (service)" berbeda?'>
    Anda sedang mengedit satu file config sementara layanan menjalankan yang lain (sering karena ketidakcocokan `--profile` / `OPENCLAW_STATE_DIR`).

    Perbaikan:

    ```bash
    openclaw gateway install --force
    ```

    Jalankan itu dari `--profile` / environment yang sama yang Anda ingin layanan gunakan.

  </Accordion>

  <Accordion title='Apa arti "another gateway instance is already listening"?'>
    OpenClaw menegakkan runtime lock dengan langsung bind listener WebSocket saat startup (default `ws://127.0.0.1:18789`). Jika bind gagal dengan `EADDRINUSE`, ia melempar `GatewayLockError` yang menunjukkan instance lain sudah listen.

    Perbaikan: hentikan instance lain, bebaskan port, atau jalankan dengan `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Bagaimana cara menjalankan OpenClaw dalam mode remote (klien terhubung ke Gateway di tempat lain)?">
    Set `gateway.mode: "remote"` dan arahkan ke URL WebSocket remote, opsional dengan kredensial remote shared-secret:

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
    - App macOS mengawasi file config dan mengganti mode secara langsung saat nilai ini berubah.
    - `gateway.remote.token` / `.password` hanyalah kredensial remote sisi klien; mereka tidak mengaktifkan auth gateway lokal dengan sendirinya.

  </Accordion>

  <Accordion title='Control UI mengatakan "unauthorized" (atau terus reconnecting). Sekarang bagaimana?'>
    Jalur auth gateway Anda dan metode auth UI tidak cocok.

    Fakta (dari kode):

    - Control UI menyimpan token di `sessionStorage` untuk sesi tab browser saat ini dan URL gateway yang dipilih, jadi refresh dalam tab yang sama tetap berfungsi tanpa mengembalikan persistensi token localStorage jangka panjang.
    - Pada `AUTH_TOKEN_MISMATCH`, klien tepercaya dapat mencoba satu retry terbatas dengan cached device token ketika gateway mengembalikan hint retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Retry cached-token sekarang menggunakan kembali approved scopes yang tersimpan bersama device token tersebut. Pemanggil `deviceToken
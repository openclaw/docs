---
read_when:
    - Instalasi baru, onboarding terhenti, atau kesalahan saat pertama kali dijalankan
    - Memilih autentikasi dan langganan penyedia
    - Tidak dapat mengakses docs.openclaw.ai, tidak dapat membuka dasbor, instalasi macet
sidebarTitle: First-run FAQ
summary: 'FAQ: penyiapan mulai cepat dan penggunaan pertama — instalasi, orientasi, autentikasi, langganan, kegagalan awal'
title: 'FAQ: penyiapan awal'
x-i18n:
    generated_at: "2026-07-16T18:11:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

Tanya jawab mulai cepat dan penggunaan pertama. Untuk operasi sehari-hari, model, autentikasi, sesi,
dan pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

## Mulai cepat dan penyiapan penggunaan pertama

<AccordionGroup>
  <Accordion title="Saya mengalami kebuntuan, cara tercepat untuk mengatasinya">
    Gunakan agen AI lokal yang dapat **melihat mesin Anda**. Sebagian besar kasus "Saya mengalami kebuntuan"
    merupakan **masalah konfigurasi atau lingkungan lokal** yang tidak dapat diperiksa oleh pembantu jarak jauh, jadi cara ini lebih efektif
    daripada bertanya di Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Berikan seluruh checkout sumber kepada agen melalui instalasi yang dapat dimodifikasi (git) agar agen dapat membaca
    kode + dokumentasi dan menganalisis versi persis yang Anda jalankan:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Minta agen merencanakan dan mengawasi perbaikan langkah demi langkah, lalu jalankan hanya
    perintah yang diperlukan - diff yang lebih kecil lebih mudah diaudit.

    Bagikan keluaran berikut saat meminta bantuan (di Discord atau masalah GitHub):

    | Perintah | Menampilkan |
    | --- | --- |
    | `openclaw status` | Kesehatan Gateway/agen + cuplikan konfigurasi dasar |
    | `openclaw status --all` | Diagnosis lengkap hanya-baca yang dapat ditempel |
    | `openclaw models status` | Autentikasi penyedia + ketersediaan model |
    | `openclaw doctor` | Memvalidasi dan memperbaiki masalah umum konfigurasi/status |
    | `openclaw logs --follow` | Ekor log langsung |
    | `openclaw gateway status --deep` | Pemeriksaan mendalam kesehatan gateway/konfigurasi/plugin |
    | `openclaw health --verbose` | Laporan kesehatan terperinci |

    Menemukan bug atau perbaikan nyata? Ajukan masalah atau kirim PR:
    [Masalah](https://github.com/openclaw/openclaw/issues) /
    [Pull request](https://github.com/openclaw/openclaw/pulls).

    Siklus debug cepat: [60 detik pertama jika ada yang rusak](/id/help/faq#first-60-seconds-if-something-is-broken).
    Dokumentasi instalasi: [Instalasi](/id/install), [Flag penginstal](/id/install/installer), [Pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Heartbeat terus dilewati. Apa arti alasan pelewatannya?">
    | Alasan dilewati | Arti |
    | --- | --- |
    | `quiet-hours` | Di luar rentang jam aktif yang dikonfigurasi |
    | `empty-heartbeat-file` | `HEARTBEAT.md` ada, tetapi hanya berisi kerangka kosong, komentar, header, fence, atau daftar periksa kosong |
    | `no-tasks-due` | Mode tugas aktif, tetapi belum ada interval tugas yang jatuh tempo |
    | `alerts-disabled` | Semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya dinonaktifkan) |

    Dalam mode tugas, stempel waktu jatuh tempo hanya dimajukan setelah proses heartbeat yang sebenarnya selesai.
    Proses yang dilewati tidak menandai tugas sebagai selesai.

    Dokumentasi: [Heartbeat](/id/gateway/heartbeat), [Otomatisasi](/id/automation).

  </Accordion>

  <Accordion title="Cara yang disarankan untuk menginstal dan menyiapkan OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Dari sumber (kontributor/pengembang):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Belum ada instalasi global? Jalankan `pnpm openclaw onboard` sebagai gantinya. Jika aset Control UI
    tidak ada, proses orientasi akan mencoba membangunnya sendiri, dengan beralih ke `pnpm ui:build` jika gagal.

  </Accordion>

  <Accordion title="Bagaimana cara membuka dasbor setelah orientasi?">
    Orientasi membuka peramban Anda ke URL dasbor bersih (tanpa token) tepat setelah
    penyiapan dan mencetak tautannya dalam ringkasan. Biarkan tab tersebut tetap terbuka; jika tidak diluncurkan,
    salin/tempel URL yang dicetak pada mesin yang sama.
  </Accordion>

  <Accordion title="Bagaimana cara mengautentikasi dasbor di localhost dibandingkan dari jarak jauh?">
    **Localhost (mesin yang sama):**

    - Buka `http://127.0.0.1:18789/`.
    - Jika diminta autentikasi rahasia bersama, tempel token atau kata sandi yang dikonfigurasi ke pengaturan Control UI.
    - Sumber token: `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
    - Sumber kata sandi: `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
    - Belum ada rahasia bersama yang dikonfigurasi? Jalankan `openclaw doctor --generate-gateway-token` (atau `openclaw doctor --fix --generate-gateway-token`).

    **Bukan di localhost:**

    - **Tailscale Serve** (disarankan): pertahankan bind loopback, jalankan `openclaw gateway --tailscale serve`, buka `https://<magicdns>/`. Dengan `gateway.auth.allowTailscale: true`, header identitas memenuhi autentikasi Control UI/WebSocket (tanpa menempelkan rahasia bersama, dengan asumsi host gateway tepercaya); API HTTP tetap memerlukan autentikasi rahasia bersama kecuali Anda sengaja menggunakan `none` ingress privat atau autentikasi HTTP proksi tepercaya.
      Upaya Serve dengan autentikasi buruk secara bersamaan dari klien yang sama diserialkan sebelum pembatas autentikasi gagal mencatatnya, sehingga percobaan buruk kedua dapat langsung menampilkan `retry later`.
    - **Bind tailnet**: jalankan `openclaw gateway --bind tailnet --token "<token>"` (atau konfigurasikan autentikasi kata sandi), buka `http://<tailscale-ip>:18789/`, tempel rahasia bersama yang cocok di pengaturan dasbor.
    - **Proksi balik berbasis identitas**: pertahankan Gateway di belakang proksi tepercaya, atur `gateway.auth.mode: "trusted-proxy"`, buka URL proksi. Proksi loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback: true` secara eksplisit.
    - **Terowongan SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, lalu buka `http://127.0.0.1:18789/`. Autentikasi rahasia bersama tetap berlaku melalui terowongan; tempel token atau kata sandi yang dikonfigurasi jika diminta.

    Lihat [Dasbor](/id/web/dashboard) dan [Permukaan web](/id/web) untuk mode bind dan detail autentikasi.

  </Accordion>

  <Accordion title="Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan obrolan?">
    Keduanya mengontrol lapisan yang berbeda:

    - `approvals.exec` - meneruskan perintah persetujuan ke tujuan obrolan.
    - `channels.<channel>.execApprovals` - menjadikan kanal tersebut klien persetujuan native untuk persetujuan exec.

    Kebijakan exec host tetap menjadi gerbang persetujuan yang sebenarnya; konfigurasi obrolan hanya mengontrol tempat
    perintah muncul dan cara orang meresponsnya.

    Anda jarang memerlukan keduanya:

    - Jika obrolan sudah mendukung perintah dan balasan, `/approve` dalam obrolan yang sama berfungsi melalui jalur bersama.
    - Jika kanal native yang didukung dapat menentukan pemberi persetujuan dengan aman, OpenClaw otomatis mengaktifkan persetujuan native yang mengutamakan DM jika `channels.<channel>.execApprovals.enabled` belum disetel atau `"auto"`.
    - Jika kartu/tombol persetujuan native tersedia, UI tersebut menjadi yang utama; sebutkan perintah manual `/approve` hanya jika hasil alat menyatakan persetujuan obrolan tidak tersedia.
    - Gunakan `approvals.exec` hanya jika perintah juga harus menjangkau obrolan lain atau ruang operasi tertentu.
    - Gunakan `channels.<channel>.execApprovals.target: "channel"` atau `"both"` hanya jika Anda ingin perintah persetujuan diposting kembali ke ruang/topik asal.
    - Persetujuan Plugin terpisah: `/approve` dalam obrolan yang sama secara default, penerusan `approvals.plugin` opsional, dan hanya beberapa kanal native yang mempertahankan penanganan native untuk persetujuan tersebut.

    Singkatnya: penerusan digunakan untuk perutean, sedangkan konfigurasi klien native digunakan untuk UX khusus kanal yang lebih kaya.
    Lihat [Persetujuan Exec](/id/tools/exec-approvals).

  </Accordion>

  <Accordion title="Runtime apa yang saya perlukan?">
    Node **22.22.3+**, **24.15+**, atau **25.9+** diperlukan (Node 24 disarankan). `pnpm` adalah pengelola paket repo.
    Bun dapat menginstal dependensi dan menjalankan skrip paket, tetapi tidak dapat menjalankan CLI atau Gateway OpenClaw karena tidak memiliki `node:sqlite`.
  </Accordion>

  <Accordion title="Apakah OpenClaw berjalan di Raspberry Pi?">
    Ya, tetapi periksa RAM terlebih dahulu: Pi 5 dan Pi 4 (2 GB+) adalah pilihan ideal; Pi 3B+ (1 GB) berfungsi tetapi lambat; Pi Zero 2 W (512 MB) tidak disarankan.

    | Model | RAM | Kecocokan |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Terbaik |
    | Pi 4 | 4 GB | Baik |
    | Pi 4 | 2 GB | Cukup, tambahkan swap |
    | Pi 4 | 1 GB | Terbatas |
    | Pi 3B+ | 1 GB | Lambat |
    | Pi Zero 2 W | 512 MB | Tidak disarankan |

    Minimum mutlak: RAM 1 GB, 1 inti, ruang disk kosong 500 MB, OS 64-bit. Karena Pi hanya menjalankan
    Gateway (model memanggil API cloud), bahkan Pi dengan spesifikasi sederhana dapat menangani bebannya.

    Pi/VPS kecil juga dapat menghosting Gateway saja sementara Anda memasangkan **node**
    di laptop/ponsel untuk layar/kamera/canvas lokal atau eksekusi perintah. Lihat [Node](/id/nodes).

    Panduan lengkap penyiapan: [Raspberry Pi](/id/install/raspberry-pi).

  </Accordion>

  <Accordion title="Ada kiat untuk instalasi Raspberry Pi?">
    - Gunakan OS **64-bit**; jangan gunakan Raspberry Pi OS 32-bit.
    - Tambahkan swap pada papan dengan kapasitas 2 GB atau lebih kecil.
    - Utamakan **SSD USB** daripada kartu SD demi performa dan masa pakai.
    - Utamakan instalasi yang dapat dimodifikasi (git) agar Anda dapat melihat log dan memperbarui dengan cepat.
    - Mulai tanpa kanal/skills, lalu tambahkan satu per satu.
    - Kegagalan biner yang aneh ("exec format error") biasanya disebabkan build ARM64 yang tidak tersedia untuk alat skill opsional.

    Panduan lengkap: [Raspberry Pi](/id/install/raspberry-pi). Lihat juga [Linux](/id/platforms/linux).

  </Accordion>

  <Accordion title="Proses berhenti pada wake up my friend / orientasi tidak menetas. Apa yang harus dilakukan?">
    Layar tersebut bergantung pada Gateway yang dapat dijangkau dan diautentikasi. TUI juga secara otomatis mengirim
    "Bangunlah, temanku!" saat pertama kali menetas ketika penyedia model dikonfigurasi. Jika
    Anda melewati penyiapan model/autentikasi, orientasi menampilkan catatan "Autentikasi model tidak ada" dan membuka
    TUI tanpa mengirim apa pun — tambahkan penyedia dengan `openclaw configure --section model`.
    Jika Anda melihat baris bangun tersebut **tanpa balasan** dan token tetap 0, agen tidak pernah berjalan.

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

    3. Masih macet? Jalankan:

    ```bash
    openclaw doctor
    ```

    Jika Gateway berada di mesin jarak jauh, pastikan koneksi terowongan/Tailscale aktif dan UI
    mengarah ke Gateway yang benar. Lihat [Akses jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Dapatkah saya memigrasikan penyiapan ke mesin baru tanpa mengulangi orientasi?">
    Ya. Salin **direktori status** dan **ruang kerja**, lalu jalankan Doctor satu kali:

    1. Instal OpenClaw di mesin baru.
    2. Salin `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) dari mesin lama.
    3. Salin ruang kerja Anda (default: `~/.openclaw/workspace`).
    4. Jalankan `openclaw doctor` dan mulai ulang layanan Gateway.

    Tindakan ini mempertahankan konfigurasi, profil autentikasi, kredensial WhatsApp, sesi, dan memori - bot Anda
    tetap sama persis, asalkan Anda menyalin **kedua** lokasi. Dalam mode jarak jauh,
    host gateway memiliki penyimpanan sesi dan ruang kerja.

    **Penting:** jika Anda hanya melakukan commit/push ruang kerja ke GitHub, Anda mencadangkan
    **memori + file bootstrap**, tetapi bukan riwayat sesi atau autentikasi. Data tersebut berada di
    `~/.openclaw/` (misalnya `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Terkait: [Migrasi](/id/install/migrating), [Lokasi berbagai hal di disk](/id/help/faq#where-things-live-on-disk),
    [Ruang kerja agen](/id/concepts/agent-workspace), [Doctor](/id/gateway/doctor),
    [Mode jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana saya dapat melihat hal baru dalam versi terbaru?">
    Periksa log perubahan GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Entri terbaru berada di bagian atas. Jika bagian teratas adalah **Belum Dirilis**, bagian bertanggal
    berikutnya adalah versi terbaru yang telah dirilis. Entri dikelompokkan dalam **Sorotan**, **Perubahan**,
    dan **Perbaikan** (serta bagian dokumentasi/lainnya jika diperlukan).

  </Accordion>

  <Accordion title="Tidak dapat mengakses docs.openclaw.ai (kesalahan SSL)">
    Beberapa koneksi Comcast/Xfinity secara keliru memblokir `docs.openclaw.ai` melalui Xfinity
    Advanced Security. Nonaktifkan fitur tersebut atau tambahkan `docs.openclaw.ai` ke daftar yang diizinkan, lalu coba lagi. Bantu kami
    agar pemblokirannya dicabut: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Masih terblokir? Dokumentasi dicerminkan di GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Perbedaan antara stabil dan beta">
    **Stabil** dan **beta** adalah **dist-tag npm**, bukan jalur kode yang terpisah:

    - `latest` = stabil
    - `beta` = build awal untuk pengujian (kembali menggunakan `latest` ketika beta tidak tersedia atau lebih lama daripada rilis stabil saat ini)

    Rilis stabil biasanya masuk ke **beta** terlebih dahulu, lalu langkah promosi eksplisit
    memindahkan versi yang sama ke `latest` tanpa mengubah nomor versi. Pengelola
    juga dapat langsung menerbitkan ke `latest`. Itulah sebabnya beta dan stabil dapat menunjuk ke
    **versi yang sama** setelah promosi.

    Lihat perubahannya: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Untuk perintah instalasi satu baris dan perbedaan antara beta dan dev, lihat akordeon berikutnya.

  </Accordion>

  <Accordion title="Bagaimana cara menginstal versi beta dan apa perbedaan antara beta dan dev?">
    **Beta** adalah dist-tag npm `beta` (dapat sama dengan `latest` setelah promosi).
    **Dev** adalah ujung bergerak dari `main` (git); ketika diterbitkan ke npm, versi ini menggunakan dist-tag `dev`.

    Perintah satu baris (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Penginstal Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Detail selengkapnya: [Saluran pengembangan](/id/install/development-channels) dan [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara mencoba versi terbaru?">
    Dua opsi:

    1. **Saluran dev (instalasi yang sudah ada):**

    ```bash
    openclaw update --channel dev
    ```

    Ini beralih ke checkout git dari `main`, melakukan rebase terhadap upstream, melakukan build, dan menginstal
    CLI dari checkout tersebut.

    2. **Instalasi yang dapat dimodifikasi (git) (mesin baru):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Sebaiknya gunakan kloning manual:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentasi: [Pembaruan](/id/cli/update), [Saluran pengembangan](/id/install/development-channels), [Instalasi](/id/install).

  </Accordion>

  <Accordion title="Berapa lama biasanya proses instalasi dan orientasi berlangsung?">
    Panduan kasar:

    - **Instalasi:** 2-5 menit.
    - **Orientasi QuickStart:** beberapa menit (gateway loopback, token otomatis, ruang kerja bawaan).
    - **Orientasi lanjutan/lengkap:** lebih lama jika proses masuk penyedia, pemasangan saluran, instalasi daemon, unduhan jaringan, atau skills memerlukan penyiapan tambahan.

    Wizard menampilkan linimasa ini sejak awal. Lewati langkah opsional dan kembali lagi nanti dengan
    `openclaw configure`.

    Macet? Lihat [Saya mengalami kebuntuan](#quick-start-and-first-run-setup) di atas.

  </Accordion>

  <Accordion title="Penginstal macet? Bagaimana cara mendapatkan lebih banyak umpan balik?">
    Jalankan ulang dengan `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` tidak memiliki opsi verbose khusus; jalankan melalui `Set-PSDebug -Trace 1` /
    `-Trace 0` sebagai gantinya. Referensi flag lengkap: [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Instalasi Windows menyatakan git tidak ditemukan atau openclaw tidak dikenali">
    Dua masalah Windows yang umum:

    **1) Kesalahan npm spawn git / git tidak ditemukan**

    - Instal **Git for Windows**, pastikan `git` tersedia di PATH.
    - Tutup dan buka kembali PowerShell, lalu jalankan ulang penginstal.

    **2) openclaw tidak dikenali setelah instalasi**

    - Folder bin global npm Anda tidak tersedia di PATH.
    - Periksa dengan: `npm config get prefix`.
    - Tambahkan direktori tersebut ke PATH pengguna Anda (akhiran `\bin` tidak diperlukan; pada sebagian besar sistem lokasinya adalah `%AppData%\npm`).
    - Tutup dan buka kembali PowerShell.

    Lebih memilih aplikasi desktop? Gunakan **Windows Hub**. Penyiapan khusus terminal: penginstal
    PowerShell dan jalur Gateway WSL2 keduanya didukung. Dokumentasi: [Windows](/id/platforms/windows).

  </Accordion>

  <Accordion title="Output exec Windows menampilkan teks bahasa Mandarin yang rusak — apa yang harus dilakukan?">
    Biasanya disebabkan oleh ketidakcocokan halaman kode konsol pada shell Windows native.

    Gejala: output `system.run`/`exec` menampilkan bahasa Mandarin sebagai mojibake; perintah yang sama
    terlihat normal di profil terminal lain.

    Solusi sementara di PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Kemudian mulai ulang Gateway dan coba lagi:

    ```powershell
    openclaw gateway restart
    ```

    Masih terjadi pada OpenClaw terbaru? Pantau/laporkan di: [Isu #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="Dokumentasi tidak menjawab pertanyaan saya — bagaimana cara mendapatkan jawaban yang lebih baik?">
    Gunakan instalasi yang dapat dimodifikasi (git) agar Anda memiliki seluruh kode sumber dan dokumentasi secara lokal, lalu tanyakan
    kepada bot Anda (atau Claude/Codex) **dari folder tersebut** agar dapat membaca repo dan menjawab secara tepat.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Detail selengkapnya: [Instalasi](/id/install) dan [Flag penginstal](/id/install/installer).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di Linux?">
    - Jalur cepat Linux + instalasi layanan: [Linux](/id/platforms/linux).
    - Panduan lengkap: [Memulai](/id/start/getting-started).
    - Penginstal + pembaruan: [Instalasi & pembaruan](/id/install/updating).

  </Accordion>

  <Accordion title="Bagaimana cara menginstal OpenClaw di VPS?">
    VPS Linux apa pun dapat digunakan. Instal di server, lalu akses Gateway melalui SSH/Tailscale.

    Panduan: [exe.dev](/id/install/exe-dev), [Hetzner](/id/install/hetzner), [Fly.io](/id/install/fly).
    Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).

  </Accordion>

  <Accordion title="Di mana panduan instalasi cloud/VPS?">
    Pusat hosting dengan penyedia umum:

    - [Hosting VPS](/id/vps) (semua penyedia di satu tempat)
    - [Fly.io](/id/install/fly)
    - [Hetzner](/id/install/hetzner)
    - [exe.dev](/id/install/exe-dev)

    Di cloud, **Gateway berjalan di server** dan Anda mengaksesnya dari laptop/ponsel
    melalui UI Kontrol (atau Tailscale/SSH). Status + ruang kerja Anda berada di server, jadi
    perlakukan host sebagai sumber kebenaran dan cadangkan host tersebut.

    Pasangkan **node** (Mac/iOS/Android/headless) ke Gateway cloud tersebut untuk
    layar/kamera/canvas lokal atau eksekusi perintah di laptop Anda sementara Gateway tetap berada di
    cloud.

    Pusat: [Platform](/id/platforms). Akses jarak jauh: [Gateway jarak jauh](/id/gateway/remote).
    Node: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Dapatkah saya meminta OpenClaw memperbarui dirinya sendiri?">
    Bisa, tetapi tidak disarankan. Alur pembaruan dapat memulai ulang Gateway (memutus
    sesi aktif), mungkin memerlukan checkout git yang bersih, dan dapat meminta konfirmasi.
    Lebih aman menjalankan pembaruan dari shell sebagai operator.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Mengotomatiskan dari agen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentasi: [Pembaruan](/id/cli/update), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Apa yang sebenarnya dilakukan oleh orientasi?">
    `openclaw onboard` adalah jalur penyiapan yang direkomendasikan. Dalam **mode lokal**, proses ini memandu Anda melalui:

    1. **Model/Autentikasi** - OAuth penyedia, kunci API, atau autentikasi manual (termasuk opsi lokal seperti LM Studio); pilih model bawaan.
    2. **Ruang kerja** - lokasi + file bootstrap.
    3. **Gateway** - port, alamat bind, mode autentikasi, eksposur Tailscale.
    4. **Saluran** - saluran obrolan bawaan dan plugin resmi: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
    5. **Daemon** - LaunchAgent (macOS), unit pengguna systemd (Linux/WSL2), atau Windows Scheduled Task native.
    6. **Pemeriksaan kesehatan** - memulai Gateway dan memverifikasi bahwa Gateway berjalan.
    7. **Skills** - menginstal skill yang direkomendasikan dan dependensi opsional.

    Proses ini menetapkan ekspektasi durasi sejak awal dan memperingatkan jika model yang dikonfigurasi tidak dikenal
    atau autentikasi tidak tersedia. Rincian lengkap: [Orientasi (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Apakah saya memerlukan langganan Claude atau OpenAI untuk menjalankannya?">
    Tidak. Jalankan OpenClaw dengan **kunci API** (Anthropic/OpenAI/lainnya) atau **model khusus lokal**
    agar data Anda tetap berada di perangkat. Langganan (Claude Pro/Max, ChatGPT/Codex) adalah
    cara opsional untuk mengautentikasi penyedia tersebut.

    Untuk Anthropic: **kunci API** menggunakan penagihan bayar sesuai pemakaian standar; **Claude CLI**
    menggunakan kembali login Claude Code yang sudah ada pada host yang sama. Anthropic saat ini menganggap
    jalur noninteraktif `claude -p` milik Claude CLI sebagai penggunaan Agent SDK/programatis yang
    tetap mengurangi batas paket langganan Anda — periksa dokumentasi penagihan Anthropic terbaru
    sebelum mengandalkan perilaku langganan. Untuk host Gateway jangka panjang dan otomatisasi
    bersama, kunci API Anthropic adalah pilihan yang lebih dapat diprediksi.

    OAuth OpenAI Codex (langganan ChatGPT/Codex) didukung sepenuhnya untuk model agen.
    OpenClaw juga mendukung opsi yang dihosting dengan gaya langganan, termasuk **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan**, dan **Z.AI / GLM Coding Plan**.

    Dokumentasi: [Anthropic](/id/providers/anthropic), [OpenAI](/id/providers/openai),
    [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), [Z.AI (GLM)](/id/providers/zai),
    [Model lokal](/id/gateway/local-models), [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan langganan Claude Max tanpa kunci API?">
    Ya. OpenClaw mendukung penggunaan kembali Claude CLI untuk paket Pro/Max/Team/Enterprise. Anthropic
    saat ini menganggap jalur `claude -p` yang digunakan OpenClaw sebagai penggunaan paket langganan yang tunduk
    pada batas paket Anda, bukan kuota gratis terpisah — lihat
    [Anthropic](/id/providers/anthropic) untuk detail penagihan terkini dan tautan ke
    artikel dukungan Anthropic. Untuk penyiapan sisi server yang paling dapat diprediksi, gunakan
    kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title="Apakah autentikasi langganan Claude (Claude Pro atau Max) didukung?">
    Ya, melalui penggunaan kembali Claude CLI. Perlakuan penagihan Anthropic terhadap penggunaan `claude -p`/Agent SDK
    telah berubah seiring waktu; lihat [Anthropic](/id/providers/anthropic) untuk status terkini dan
    tautan bertanggal ke artikel dukungan Anthropic sebelum mengandalkan perilaku
    penagihan tertentu.

    Autentikasi setup-token Anthropic juga masih merupakan jalur token yang didukung, tetapi OpenClaw lebih memilih
    penggunaan ulang Claude CLI dan `claude -p` jika tersedia. Untuk beban kerja produksi atau
    multi-pengguna, kunci API Anthropic tetap menjadi pilihan yang lebih aman dan lebih mudah diprediksi. Opsi hosted
    bergaya langganan lainnya: [OpenAI](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), [Z.AI (GLM)](/id/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Mengapa saya melihat HTTP 429 rate_limit_error dari Anthropic?">
    **Kuota/batas laju Anthropic** Anda telah habis untuk jendela saat ini. Di **Claude
    CLI**, tunggu hingga jendela diatur ulang atau tingkatkan paket Anda. Jika menggunakan **kunci API Anthropic**,
    periksa penggunaan/penagihan di Anthropic Console dan naikkan batas sesuai kebutuhan.

    Jika pesannya secara khusus adalah `Extra usage is required for long context requests`,
    permintaan tersebut mencoba menggunakan jendela konteks 1M Anthropic (model Claude 4.x 1M
    yang mendukung GA, atau konfigurasi lama `params.context1m: true`), dan kredensial Anda saat ini tidak
    memenuhi syarat untuk penagihan konteks panjang.

    Tetapkan **model fallback** agar OpenClaw tetap merespons saat suatu penyedia terkena batas laju.
    Lihat [Model](/id/cli/models), [OAuth](/id/concepts/oauth), dan
    [Penggunaan tambahan Anthropic 429 diperlukan untuk konteks panjang](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Apakah AWS Bedrock didukung?">
    Ya. OpenClaw memiliki penyedia **Amazon Bedrock (Converse)** bawaan. Jika penanda env AWS
    tersedia (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw secara otomatis mengaktifkan penyedia Bedrock implisit untuk penemuan model; jika tidak,
    tetapkan `plugins.entries.amazon-bedrock.config.discovery.enabled: true` atau tambahkan entri
    penyedia secara manual. Lihat [Amazon Bedrock](/id/providers/bedrock) dan [Penyedia model](/id/providers/models).
    Proksi kompatibel OpenAI di depan Bedrock tetap merupakan opsi yang valid jika Anda lebih memilih alur kunci terkelola.
  </Accordion>

  <Accordion title="Bagaimana cara kerja autentikasi Codex?">
    OpenClaw mendukung **OpenAI Codex** melalui OAuth (masuk dengan ChatGPT). Penyiapan baru
    tanpa model utama menggunakan tepat `openai/gpt-5.6-sol` untuk
    autentikasi langganan ChatGPT/Codex serta eksekusi app-server Codex native.
    Autentikasi ulang mempertahankan model eksplisit yang sudah ada, termasuk
    `openai/gpt-5.5`. Jika ruang kerja Codex tidak menyediakan GPT-5.6, pilih
    `openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan versi secara diam-diam. Referensi model
    berawalan Codex lama adalah konfigurasi lama yang diperbaiki oleh `openclaw doctor
    --fix`. Akses langsung dengan kunci API OpenAI tetap tersedia untuk permukaan API OpenAI
    non-agen dan, melalui profil kunci API `openai` yang diurutkan, juga untuk model
    agen. Lihat [Penyedia model](/id/concepts/model-providers) dan
    [Orientasi awal (CLI)](/id/start/wizard).
  </Accordion>

  <Accordion title="Mengapa OpenClaw masih menyebutkan prefiks OpenAI Codex lama?">
    `openai` adalah id penyedia dan profil autentikasi saat ini untuk kunci API OpenAI maupun
    OAuth ChatGPT/Codex—OpenAI Codex telah digabungkan ke dalamnya. Anda mungkin masih melihat prefiks lama
    `openai-codex` dalam konfigurasi lama dan peringatan migrasi:

    - `openai/gpt-5.6-sol` = penyiapan langganan ChatGPT/Codex baru dengan runtime Codex native untuk giliran agen.
    - `openai/gpt-5.5` = pilihan eksplisit yang didukung untuk konfigurasi yang sudah ada atau akun tanpa akses GPT-5.6.
    - Referensi model `openai-codex/*` lama = rute lama yang diperbaiki oleh `openclaw doctor --fix`.
    - `openai/gpt-5.5` ditambah profil kunci API `openai` yang diurutkan = autentikasi kunci API untuk model agen OpenAI.
    - Id profil autentikasi `openai-codex` lama = id lama yang dimigrasikan oleh `openclaw doctor --fix`.

    Ingin penagihan langsung OpenAI Platform? Tetapkan `OPENAI_API_KEY`. Ingin autentikasi
    langganan ChatGPT/Codex? Jalankan `openclaw models auth login --provider openai`. Pertahankan
    referensi model di bawah penyedia kanonis `openai/*`. Penyiapan langganan baru
    menggunakan tepat `openai/gpt-5.6-sol`; doctor memperbaiki referensi lama berawalan Codex
    tanpa meningkatkan pilihan eksplisit `openai/gpt-5.5`.

  </Accordion>

  <Accordion title="Mengapa batas OAuth Codex dapat berbeda dari web ChatGPT?">
    OAuth Codex menggunakan jendela kuota yang dikelola OpenAI dan bergantung pada paket, yang dapat berbeda dari
    pengalaman situs web/aplikasi ChatGPT, bahkan pada akun yang sama.

    `openclaw models status` menampilkan jendela penggunaan/kuota penyedia yang saat ini terlihat, tetapi
    tidak menciptakan atau menormalisasi hak akses web ChatGPT menjadi akses API langsung. Untuk jalur
    penagihan/batas langsung OpenAI Platform, gunakan `openai/*` dengan kunci API.

  </Accordion>

  <Accordion title="Apakah autentikasi langganan OpenAI (OAuth Codex) didukung?">
    Ya, sepenuhnya. OpenAI secara eksplisit mengizinkan penggunaan OAuth langganan di alat/alur kerja
    eksternal seperti OpenClaw. Orientasi awal dapat menjalankan alur OAuth untuk Anda.

    Lihat [OAuth](/id/concepts/oauth), [Penyedia model](/id/concepts/model-providers), dan [Orientasi awal (CLI)](/id/start/wizard).

  </Accordion>

  <Accordion title="Bagaimana cara menyiapkan OAuth Gemini CLI?">
    Gemini CLI menggunakan **alur autentikasi Plugin**, bukan id klien atau rahasia di `openclaw.json`.

    1. Instal Gemini CLI secara lokal agar `gemini` tersedia di `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktifkan Plugin: `openclaw plugins enable google`
    3. Masuk: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Model default setelah masuk: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. Permintaan gagal setelah masuk? Tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway dan coba lagi.

    Token OAuth disimpan dalam profil autentikasi pada host gateway. Detail: [Google](/id/providers/google), [Penyedia model](/id/concepts/model-providers).

  </Accordion>

  <Accordion title="Apakah model lokal cocok untuk percakapan santai?">
    Biasanya tidak. OpenClaw membutuhkan konteks besar + keamanan yang kuat; kartu kecil memotong konteks
    dan melewati filter keamanan sisi penyedia. Jika harus, jalankan build model **terbesar** yang
    dapat dijalankan secara lokal (LM Studio)—lihat [Model lokal](/id/gateway/local-models). Model yang lebih kecil/terkuantisasi
    meningkatkan risiko injeksi prompt—lihat [Keamanan](/id/gateway/security).
  </Accordion>

  <Accordion title="Bagaimana cara mempertahankan lalu lintas model hosted di wilayah tertentu?">
    Pilih endpoint yang terikat pada wilayah. OpenRouter menyediakan opsi yang di-host di AS untuk MiniMax, Kimi,
    dan GLM; pilih varian yang di-host di AS untuk menjaga data tetap di dalam wilayah. Anthropic/OpenAI
    tetap dapat dicantumkan bersama opsi tersebut menggunakan `models.mode: "merge"` agar fallback tetap
    tersedia sembari mematuhi penyedia regional yang Anda pilih.
  </Accordion>

  <Accordion title="Apakah saya harus membeli Mac Mini untuk menginstal ini?">
    Tidak. OpenClaw berjalan di macOS atau Linux (Windows melalui WSL2). Mac mini adalah pilihan host
    selalu aktif yang populer, tetapi VPS kecil, server rumahan, atau perangkat kelas Raspberry Pi juga dapat digunakan.

    Mac hanya diperlukan **untuk alat khusus macOS**. Untuk iMessage, gunakan [iMessage](/id/channels/imessage)
    dengan `imsg` pada Mac mana pun yang masuk ke Messages—jika Gateway berjalan di Linux atau tempat lain,
    tetapkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` pada Mac tersebut. Untuk alat
    khusus macOS lainnya, jalankan Gateway pada Mac atau pasangkan Node macOS.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes), [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Apakah saya memerlukan Mac mini untuk dukungan iMessage?">
    Anda memerlukan **perangkat macOS apa pun** yang masuk ke Messages—tidak harus Mac mini,
    Mac apa pun dapat digunakan. Gunakan [iMessage](/id/channels/imessage) dengan `imsg`; Gateway dapat berjalan pada
    Mac tersebut, atau di tempat lain dengan wrapper SSH `cliPath`.

    Penyiapan umum:

    - Gateway di Linux/VPS, `channels.imessage.cliPath` ditetapkan ke wrapper SSH yang menjalankan `imsg` pada Mac yang masuk ke Messages.
    - Semuanya pada satu Mac untuk penyiapan satu mesin yang paling sederhana.

    Dokumentasi: [iMessage](/id/channels/imessage), [Node](/id/nodes), [Mode jarak jauh Mac](/id/platforms/mac/remote).

  </Accordion>

  <Accordion title="Jika saya membeli Mac mini untuk menjalankan OpenClaw, dapatkah saya menghubungkannya ke MacBook Pro saya?">
    Ya. **Mac mini dapat menjalankan Gateway**, dan MacBook Pro Anda terhubung sebagai **Node**
    (perangkat pendamping). Node tidak menjalankan Gateway—Node menambahkan kemampuan seperti
    layar/kamera/kanvas dan `system.run` pada perangkat tersebut.

    Pola umum: Gateway pada Mac mini yang selalu aktif; MacBook Pro menjalankan aplikasi macOS atau
    host Node dan berpasangan dengan Gateway. Periksa dengan `openclaw nodes status` / `openclaw nodes list`.

    Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan Bun?">
    Bun dapat digunakan untuk menginstal dependensi atau menjalankan skrip paket. CLI dan
    Gateway OpenClaw memerlukan **Node** karena penyimpanan status kanonis menggunakan `node:sqlite`; Bun tidak
    menyediakan API tersebut.
  </Accordion>

  <Accordion title="Telegram: apa yang harus dimasukkan ke allowFrom?">
    `channels.telegram.allowFrom` adalah **ID pengguna Telegram milik pengirim manusia** (numerik),
    bukan nama pengguna bot. Penyiapan hanya meminta ID pengguna numerik; `openclaw doctor --fix`
    dapat mencoba menyelesaikan entri lama `@username`.

    Lebih aman (tanpa bot pihak ketiga): kirim DM ke bot Anda, jalankan `openclaw logs --follow`, baca `from.id`.

    Bot API resmi: kirim DM ke bot Anda, panggil `https://api.telegram.org/bot<bot_token>/getUpdates`, baca `message.from.id`.

    Pihak ketiga (kurang privat): kirim DM ke `@userinfobot` atau `@getidsbot`.

    Lihat [Kontrol akses Telegram](/id/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Dapatkah beberapa orang menggunakan satu nomor WhatsApp dengan instans OpenClaw yang berbeda?">
    Ya, melalui **perutean multi-agen**. Ikat DM WhatsApp setiap pengirim (`peer: { kind: "direct", id: "+15551234567" }`) ke `agentId` yang berbeda, sehingga setiap orang memiliki ruang kerja dan penyimpanan sesi sendiri. Balasan tetap berasal dari **akun WhatsApp yang sama**; kontrol akses DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) bersifat global per akun. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent) dan [WhatsApp](/id/channels/whatsapp).
  </Accordion>

  <Accordion title='Dapatkah saya menjalankan agen "percakapan cepat" dan agen "Opus untuk pengodean"?'>
    Ya. Gunakan perutean multi-agen: berikan setiap agen model defaultnya sendiri, lalu ikat rute
    masuk (akun penyedia atau rekan tertentu) ke setiap agen. Contoh konfigurasi:
    [Perutean Multi-Agen](/id/concepts/multi-agent). Lihat juga [Model](/id/concepts/models) dan
    [Konfigurasi](/id/gateway/configuration).
  </Accordion>

  <Accordion title="Apakah Homebrew berfungsi di Linux?">
    Ya, melalui Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Saat menjalankan OpenClaw melalui systemd: pastikan PATH layanan menyertakan
    `/home/linuxbrew/.linuxbrew/bin` (atau prefiks brew Anda) agar alat yang diinstal melalui `brew`
    dapat ditemukan dalam shell non-login. Build terbaru juga menambahkan direktori bin pengguna umum di awal PATH pada layanan
    systemd Linux (misalnya `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) dan mematuhi `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, dan `FNM_DIR` saat ditetapkan.

  </Accordion>

  <Accordion title="Perbedaan antara instalasi git yang dapat dimodifikasi dan instalasi npm">
    - **Instalasi yang dapat dimodifikasi (git):** checkout sumber lengkap, dapat diedit, paling cocok untuk kontributor. Anda melakukan build secara lokal dan dapat menambal kode/dokumentasi.
    - **Instalasi npm:** instalasi CLI global, tanpa repo, paling cocok untuk "langsung jalankan." Pembaruan berasal dari dist-tag npm.

    Dokumentasi: [Memulai](/id/start/getting-started), [Memperbarui](/id/install/updating).

  </Accordion>

  <Accordion title="Dapatkah saya beralih antara instalasi npm dan git nanti?">
    Ya, dengan `openclaw update --channel ...` pada instalasi yang sudah ada. Tindakan ini **tidak
    menghapus data Anda**—hanya instalasi kode OpenClaw yang berubah. Status (`~/.openclaw`) dan
    ruang kerja (`~/.openclaw/workspace`) tetap tidak tersentuh.

    npm ke git:

    ```bash
    openclaw update --channel dev
    ```

    git ke npm:

    ```bash
    openclaw update --channel stable
    ```

    Tambahkan `--dry-run` untuk melihat pratinjau peralihan mode yang direncanakan terlebih dahulu. Pembaru menjalankan tindak lanjut Doctor,
    menyegarkan sumber plugin untuk kanal target, dan memulai ulang gateway
    kecuali jika Anda meneruskan `--no-restart`.

    Penginstal juga dapat memaksakan salah satu mode:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Kiat pencadangan: [Lokasi berbagai hal disimpan pada disk](/id/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Haruskah saya menjalankan Gateway di laptop atau VPS?">
    Menginginkan keandalan 24/7? Gunakan **VPS**. Menginginkan cara termudah dan tidak keberatan dengan
    mode tidur/mulai ulang? Jalankan secara lokal.

    **Laptop (Gateway lokal)**

    - **Kelebihan:** tanpa biaya server, akses langsung ke file lokal, jendela browser aktif.
    - **Kekurangan:** mode tidur/terputusnya jaringan memutus koneksi, pembaruan/mulai ulang OS mengganggu layanan, harus tetap aktif.

    **VPS / cloud**

    - **Kelebihan:** selalu aktif, jaringan stabil, tanpa masalah mode tidur laptop, lebih mudah untuk terus dijalankan.
    - **Kekurangan:** sering kali tanpa antarmuka grafis (gunakan tangkapan layar), hanya akses file jarak jauh, memerlukan SSH untuk pembaruan.

    WhatsApp/Telegram/Slack/Mattermost/Discord semuanya berfungsi dengan baik dari VPS—pertimbangan
    utamanya adalah browser tanpa antarmuka grafis dibandingkan jendela yang terlihat. Lihat [Browser](/id/tools/browser).

    Rekomendasi bawaan: VPS jika Anda pernah mengalami gateway terputus sebelumnya; lokal sangat cocok
    ketika Anda sedang aktif menggunakan Mac dan menginginkan akses file lokal atau otomatisasi UI
    dengan browser yang terlihat.

  </Accordion>

  <Accordion title="Seberapa penting menjalankan OpenClaw pada mesin khusus?">
    Tidak wajib, tetapi disarankan demi keandalan dan isolasi.

    - **Host khusus (VPS/Mac mini/Raspberry Pi):** selalu aktif, lebih sedikit gangguan akibat mode tidur/mulai ulang, izin lebih tertata, lebih mudah untuk terus dijalankan.
    - **Laptop/desktop bersama:** cocok untuk pengujian dan penggunaan aktif, tetapi bersiaplah menghadapi jeda saat mesin masuk mode tidur atau diperbarui.

    Solusi terbaik dari keduanya: pertahankan Gateway pada host khusus dan pasangkan laptop Anda sebagai
    **node** untuk alat layar/kamera/eksekusi lokal. Lihat [Node](/id/nodes) dan [Keamanan](/id/gateway/security).

  </Accordion>

  <Accordion title="Apa persyaratan minimum VPS dan OS yang direkomendasikan?">
    - **Minimum mutlak:** 1 vCPU, RAM 1 GB, disk ~500 MB.
    - **Direkomendasikan:** 1-2 vCPU, RAM 2 GB+ untuk kapasitas tambahan (log, media, beberapa kanal). Alat Node dan otomatisasi browser dapat menghabiskan banyak sumber daya.

    OS: **Ubuntu LTS** (atau Debian/Ubuntu modern apa pun)—jalur instalasi Linux yang paling teruji.

    Dokumentasi: [Linux](/id/platforms/linux), [Hosting VPS](/id/vps).

  </Accordion>

  <Accordion title="Dapatkah saya menjalankan OpenClaw dalam VM dan apa persyaratannya?">
    Ya. Perlakukan VM seperti VPS: VM harus selalu aktif, dapat dijangkau, dan memiliki RAM yang cukup
    untuk Gateway serta setiap kanal yang Anda aktifkan.

    - **Minimum mutlak:** 1 vCPU, RAM 1 GB.
    - **Direkomendasikan:** RAM 2 GB+ untuk beberapa kanal, otomatisasi browser, atau alat media.
    - **OS:** Ubuntu LTS atau Debian/Ubuntu modern lainnya.

    Di Windows, gunakan **Windows Hub** untuk penyiapan desktop, atau WSL2 untuk VM Gateway bergaya Linux
    dengan kompatibilitas alat yang luas. Lihat [Windows](/id/platforms/windows), [Hosting VPS](/id/vps).
    Menjalankan macOS dalam VM: lihat [VM macOS](/id/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq)—FAQ utama (model, sesi, gateway, keamanan, dan lainnya)
- [Ikhtisar instalasi](/id/install)
- [Memulai](/id/start/getting-started)
- [Pemecahan masalah](/id/help/troubleshooting)

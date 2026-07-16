---
read_when:
    - Anda ingin memahami `openclaw.ai/install.sh`
    - Anda ingin mengotomatiskan instalasi (CI / tanpa antarmuka)
    - Anda ingin menginstal dari checkout GitHub
summary: Cara kerja skrip penginstal (install.sh, install-cli.sh, install.ps1), flag, dan otomatisasi
title: Internal penginstal
x-i18n:
    generated_at: "2026-07-16T18:15:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw menyediakan tiga skrip penginstal, yang disajikan dari `openclaw.ai`.

| Skrip                              | Platform             | Fungsinya                                                                                      |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan orientasi awal. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Menginstal Node + OpenClaw ke prefiks lokal (`~/.openclaw`) melalui npm atau git. Tidak memerlukan akses root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan orientasi awal. |

Ketiganya mendukung Node **22.22.3+, 24.15+, atau 25.9+**; Node 24 adalah target default untuk instalasi baru.

## Perintah cepat

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Jika instalasi berhasil tetapi `openclaw` tidak ditemukan di terminal baru, lihat [pemecahan masalah Node.js](/id/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Direkomendasikan untuk sebagian besar instalasi interaktif di macOS/Linux/WSL.
</Tip>

### Alur (install.sh)

<Steps>
  <Step title="Deteksi OS">
    Mendukung macOS dan Linux (termasuk WSL).
  </Step>
  <Step title="Pastikan Node.js 24 secara default">
    Memeriksa versi Node dan menginstal Node 24 jika diperlukan (Homebrew di macOS, skrip penyiapan NodeSource di Linux apt/dnf/yum). Di macOS, Homebrew hanya diinstal ketika penginstal memerlukannya untuk Node atau Git. Node 22.22.3+, Node 24.15+, dan Node 25.9+ didukung; Node 23 tidak didukung.
    Di Alpine/musl Linux, penginstal menggunakan paket apk sebagai pengganti NodeSource dan memverifikasi versi SQLite yang benar-benar ditautkan. Aliran paket Alpine stabil saat ini dapat menyediakan Node yang cukup baru dengan SQLite sistem yang rentan; jika hal itu terjadi, gunakan kontainer resmi `node:24-alpine` atau host berbasis glibc sebagai gantinya.
  </Step>
  <Step title="Pastikan Git">
    Menginstal Git jika belum tersedia menggunakan pengelola paket yang terdeteksi, termasuk Homebrew di macOS dan apk di Alpine.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): instalasi npm global
    - Metode `git`: mengkloning/memperbarui repositori, menginstal dependensi dengan pnpm, membangun, lalu menginstal pembungkus di `~/.local/bin/openclaw`

  </Step>
  <Step title="Tugas pascainstalasi">
    - Menentukan biner `openclaw` yang baru saja diinstal untuk perintah lanjutan
    - Untuk instalasi yang belum dikonfigurasi, memulai orientasi awal sebelum pemeriksaan doctor atau Gateway. Dengan `--no-onboard` atau tanpa TTY, skrip mencetak perintah untuk menyelesaikan penyiapan nanti.
    - Untuk instalasi yang telah dikonfigurasi, menyegarkan dan memulai ulang layanan Gateway yang dimuat sebisa mungkin, lalu menjalankan doctor. Pemutakhiran memperbarui Plugin jika memungkinkan, atau mencetak perintah manual dalam proses tanpa antarmuka dengan prompt yang diaktifkan.
    - Saat `--verify` dijalankan, skrip memeriksa versi yang terinstal dan hanya memeriksa kesehatan Gateway setelah konfigurasi tersedia.

  </Step>
</Steps>

### Deteksi checkout sumber

Jika dijalankan di dalam checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrip menawarkan:

- gunakan checkout (`git`), atau
- gunakan instalasi global (`npm`)

Jika TTY tidak tersedia dan metode instalasi tidak ditetapkan, metode defaultnya adalah `npm` dan skrip menampilkan peringatan.

Skrip keluar dengan kode `2` untuk pemilihan metode yang tidak valid atau nilai `--install-method` yang tidak valid.

### Contoh (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Lewati orientasi awal">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalasi Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout main GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Simulasi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verifikasi setelah instalasi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                                    | Deskripsi                                                               |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Pilih metode instalasi (default: `npm`)                                  |
| `--npm`                                 | Pintasan untuk metode npm                                                 |
| `--git \| --github`                     | Pintasan untuk metode git                                                 |
| `--version <version\|dist-tag\|spec>`   | Versi npm, dist-tag, atau spesifikasi paket (default: `latest`)              |
| `--beta`                                | Gunakan dist-tag beta jika tersedia; jika tidak, kembali ke `latest`              |
| `--git-dir \| --dir <path>`             | Direktori checkout (default: `~/openclaw`)                              |
| `--no-git-update`                       | Lewati `git pull` untuk checkout yang sudah ada                                   |
| `--no-prompt`                           | Nonaktifkan prompt                                                         |
| `--no-onboard`                          | Lewati orientasi awal                                                         |
| `--onboard`                             | Aktifkan orientasi awal                                                       |
| `--verify`                              | Jalankan verifikasi cepat pascainstalasi (`--version`, kesehatan Gateway jika dimuat) |
| `--dry-run`                             | Cetak tindakan tanpa menerapkan perubahan                                  |
| `--verbose`                             | Aktifkan keluaran debug (`set -x`, log tingkat notice npm)                   |
| `--help \| -h`                          | Tampilkan penggunaan                                                              |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                                          | Deskripsi                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metode instalasi                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versi npm, dist-tag, atau spesifikasi paket                             |
| `OPENCLAW_BETA=0\|1`                              | Gunakan beta jika tersedia                                              |
| `OPENCLAW_HOME=<path>`                            | Direktori dasar untuk status OpenClaw serta jalur git/orientasi awal default |
| `OPENCLAW_GIT_DIR=<path>`                         | Direktori checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Aktifkan/nonaktifkan pembaruan git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Nonaktifkan prompt                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Jalankan verifikasi cepat pascainstalasi                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Lewati orientasi awal                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Mode simulasi                                                       |
| `OPENCLAW_VERBOSE=1`                              | Mode debug                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Tingkat log npm (default: `error`, menyembunyikan gangguan peringatan penghentian npm)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Dirancang untuk lingkungan tempat semua komponen ingin ditempatkan di bawah prefiks lokal
(default `~/.openclaw`) tanpa dependensi Node sistem. Mendukung instalasi npm
secara default, serta instalasi checkout git dengan alur prefiks yang sama.
</Info>

### Alur (install-cli.sh)

<Steps>
  <Step title="Instal runtime Node lokal">
    Mengunduh tarball Node LTS didukung yang versinya dipatok (versi disematkan dalam skrip dan diperbarui secara independen, default `24.15.0`) ke `<prefix>/tools/node-v<version>` dan memverifikasi SHA-256.
    Linux ARMv7 menggunakan Node `22.22.3` karena biner ARMv7 resmi Node 24+ tidak tersedia.
    Di Alpine/musl Linux, tempat Node tidak menerbitkan tarball kompatibel untuk runtime yang dipatok, menginstal `nodejs` dan `npm` dengan `apk`, lalu memverifikasi Node dan pustaka SQLite yang benar-benar ditautkan. Aliran paket Alpine stabil saat ini mungkin masih menautkan SQLite yang rentan meskipun menggunakan Node yang cukup baru; gunakan kontainer resmi `node:24-alpine` atau host berbasis glibc jika pemeriksaan keamanan menolak paket tersebut.
  </Step>
  <Step title="Pastikan Git">
    Jika Git belum tersedia, mencoba menginstalnya melalui apt/dnf/yum/apk di Linux atau Homebrew di macOS.
  </Step>
  <Step title="Instal OpenClaw di bawah prefiks">
    - Metode `npm` (default): menginstal di bawah prefiks dengan npm, lalu menulis pembungkus ke `<prefix>/bin/openclaw`
    - Metode `git`: mengkloning/memperbarui checkout (default `~/openclaw`) dan tetap menulis pembungkus ke `<prefix>/bin/openclaw`

  </Step>
  <Step title="Segarkan layanan Gateway yang dimuat">
    Jika layanan Gateway sudah dimuat dari prefiks yang sama, skrip menjalankan
    `openclaw gateway install --force`, yang mengaktifkan layanan pengganti,
    lalu memeriksa kesehatan Gateway sebisa mungkin.
  </Step>
</Steps>

### Contoh (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefiks + versi khusus">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalasi Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Keluaran JSON otomatisasi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Jalankan orientasi awal">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                                    | Deskripsi                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefiks instalasi (default: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Pilih metode instalasi (default: `npm`)                                          |
| `--npm`                                 | Pintasan untuk metode npm                                                         |
| `--git \| --github`                     | Pintasan untuk metode git                                                         |
| `--git-dir \| --dir <path>`             | Direktori checkout Git (default: `~/openclaw`)                                  |
| `--version <ver>`                       | Versi atau dist-tag OpenClaw (default: `latest`)                                |
| `--node-version <ver>`                  | Versi Node (default: `24.15.0`; `22.22.3` pada Linux ARMv7)                     |
| `--json`                                | Keluarkan peristiwa NDJSON                                                              |
| `--onboard`                             | Jalankan `openclaw onboard` setelah instalasi                                            |
| `--no-onboard`                          | Lewati orientasi awal (default)                                                       |
| `--set-npm-prefix`                      | Pada Linux, paksa prefiks npm ke `~/.npm-global` jika prefiks saat ini tidak dapat ditulis |
| `--help \| -h`                          | Tampilkan cara penggunaan                                                                      |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                                    | Deskripsi                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalasi                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metode instalasi                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Versi atau dist-tag OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versi Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Direktori dasar untuk status OpenClaw serta jalur git/orientasi awal default |
| `OPENCLAW_GIT_DIR=<path>`                   | Direktori checkout Git untuk instalasi git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Aktifkan/nonaktifkan pembaruan git untuk checkout yang ada                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Lewati orientasi awal                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Tingkat log npm (default: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` dan spesifikasi sumber GitHub lainnya bukan target `--version` yang valid untuk instalasi npm. Gunakan `--install-method git --version main` sebagai gantinya.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Alur (install.ps1)

<Steps>
  <Step title="Pastikan lingkungan PowerShell + Windows tersedia">
    Memerlukan PowerShell 5+.
  </Step>
  <Step title="Pastikan Node.js 24 secara default">
    Jika tidak tersedia, skrip mencoba menginstalnya melalui winget, lalu Chocolatey, kemudian Scoop. Jika tidak ada pengelola paket yang tersedia, skrip mengunduh zip resmi Node.js 24 untuk Windows ke `%LOCALAPPDATA%\OpenClaw\deps\portable-node` dan menambahkannya ke PATH proses saat ini serta PATH pengguna. Node 22.22.3+, Node 24.15+, dan Node 25.9+ didukung; Node 23 tidak didukung.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): instalasi npm global menggunakan `-Tag` yang dipilih, dijalankan dari direktori sementara penginstal yang dapat ditulis agar shell yang dibuka di folder terlindungi seperti `C:\` tetap berfungsi
    - Metode `git`: klon/perbarui repositori, instal/bangun dengan pnpm, dan instal wrapper di `%USERPROFILE%\.local\bin\openclaw.cmd`. Jika Git tidak tersedia, skrip menyiapkan MinGit lokal pengguna di `%LOCALAPPDATA%\OpenClaw\deps\portable-git` dan menambahkannya ke PATH proses saat ini serta PATH pengguna.

  </Step>
  <Step title="Tugas pascainstalasi">
    - Menambahkan direktori bin yang diperlukan ke PATH pengguna jika memungkinkan
    - Memuat ulang layanan Gateway yang sudah dimuat secara upaya terbaik (`openclaw gateway install --force`, lalu mulai ulang)
    - Menjalankan `openclaw doctor --non-interactive` saat peningkatan versi dan instalasi git (upaya terbaik)

  </Step>
  <Step title="Tangani kegagalan">
    Instalasi `iwr ... | iex` dan scriptblock melaporkan kesalahan yang menghentikan operasi tanpa menutup sesi PowerShell saat ini. Instalasi langsung `powershell -File` / `pwsh -File` tetap keluar dengan kode bukan nol untuk otomatisasi.
  </Step>
</Steps>

### Contoh (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalasi Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout main GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Direktori git khusus">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Uji coba tanpa perubahan">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                        | Deskripsi                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metode instalasi (default: `npm`)                            |
| `-Tag <tag\|version\|spec>` | Dist-tag, versi, atau spesifikasi paket npm (default: `latest`) |
| `-GitDir <path>`            | Direktori checkout (default: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Lewati orientasi awal                                            |
| `-NoGitUpdate`              | Lewati `git pull`                                            |
| `-DryRun`                   | Hanya cetak tindakan                                         |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                           | Deskripsi        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metode instalasi     |
| `OPENCLAW_GIT_DIR=<path>`          | Direktori checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Lewati orientasi awal    |
| `OPENCLAW_GIT_UPDATE=0`            | Nonaktifkan git pull   |
| `OPENCLAW_DRY_RUN=1`               | Mode uji coba tanpa perubahan       |

  </Accordion>
</AccordionGroup>

<Note>
Jika `-InstallMethod git` digunakan dan Git tidak tersedia, skrip mencoba menyiapkan MinGit lokal pengguna sebelum menampilkan tautan Git for Windows.
</Note>

---

## CI dan otomatisasi

Gunakan flag/variabel lingkungan noninteraktif untuk eksekusi yang dapat diprediksi.

<Tabs>
  <Tab title="install.sh (npm noninteraktif)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git noninteraktif)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (lewati orientasi awal)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Mengapa Git diperlukan?">
    Git diperlukan untuk metode instalasi `git`. Untuk instalasi `npm`, Git tetap diperiksa/diinstal guna menghindari kegagalan `spawn git ENOENT` ketika dependensi menggunakan URL git.
  </Accordion>

  <Accordion title="Mengapa npm mengalami EACCES di Linux?">
    Beberapa konfigurasi Linux mengarahkan prefiks global npm ke jalur yang dimiliki root. `install.sh` dapat mengalihkan prefiks ke `~/.npm-global` dan menambahkan ekspor PATH ke file rc shell (jika file tersebut tersedia).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Jalankan kembali penginstal agar dapat menyiapkan MinGit lokal pengguna, atau instal Git for Windows dan buka kembali PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Jalankan `npm config get prefix` dan tambahkan direktori tersebut ke PATH pengguna Anda (akhiran `\bin` tidak diperlukan di Windows), lalu buka kembali PowerShell.
  </Accordion>

  <Accordion title="Windows: cara mendapatkan keluaran penginstal yang terperinci">
    `install.ps1` tidak menyediakan opsi `-Verbose`.
    Gunakan pelacakan PowerShell untuk diagnostik tingkat skrip:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw tidak ditemukan setelah instalasi">
    Biasanya ini adalah masalah PATH. Lihat [pemecahan masalah Node.js](/id/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Memperbarui](/id/install/updating)
- [Menghapus instalasi](/id/install/uninstall)

---
read_when:
    - Anda ingin memahami `openclaw.ai/install.sh`
    - Anda ingin mengotomatiskan instalasi (CI / tanpa antarmuka grafis)
    - Anda ingin menginstal dari checkout GitHub
summary: Cara kerja skrip penginstal (install.sh, install-cli.sh, install.ps1), flag, dan otomatisasi
title: Detail internal penginstal
x-i18n:
    generated_at: "2026-04-30T09:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw menyediakan tiga skrip installer, yang disajikan dari `openclaw.ai`.

| Skrip                              | Platform             | Fungsinya                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (bawaan) atau git, dan dapat menjalankan penyiapan awal. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Menginstal Node + OpenClaw ke prefiks lokal (`~/.openclaw`) dengan mode npm atau checkout git. Tidak memerlukan root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (bawaan) atau git, dan dapat menjalankan penyiapan awal. |

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
  <Step title="Detect OS">
    Mendukung macOS dan Linux (termasuk WSL). Jika macOS terdeteksi, menginstal Homebrew jika belum ada.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Memeriksa versi Node dan menginstal Node 24 jika diperlukan (Homebrew di macOS, skrip penyiapan NodeSource di Linux apt/dnf/yum). OpenClaw tetap mendukung Node 22 LTS, saat ini `22.14+`, untuk kompatibilitas.
  </Step>
  <Step title="Ensure Git">
    Menginstal Git jika belum ada.
  </Step>
  <Step title="Install OpenClaw">
    - Metode `npm` (bawaan): instalasi npm global
    - Metode `git`: clone/perbarui repo, instal dependensi dengan pnpm, build, lalu instal wrapper di `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Menyegarkan layanan gateway yang dimuat sebisa mungkin (`openclaw gateway install --force`, lalu mulai ulang)
    - Menjalankan `openclaw doctor --non-interactive` saat upgrade dan instalasi git (upaya terbaik)
    - Mencoba penyiapan awal saat sesuai (TTY tersedia, penyiapan awal tidak dinonaktifkan, dan pemeriksaan bootstrap/konfigurasi lolos)
    - Menetapkan bawaan `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Deteksi checkout sumber

Jika dijalankan di dalam checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrip menawarkan:

- gunakan checkout (`git`), atau
- gunakan instalasi global (`npm`)

Jika tidak ada TTY yang tersedia dan tidak ada metode instalasi yang ditetapkan, bawaan menjadi `npm` dan menampilkan peringatan.

Skrip keluar dengan kode `2` untuk pemilihan metode yang tidak valid atau nilai `--install-method` yang tidak valid.

### Contoh (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                                  | Deskripsi                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Pilih metode instalasi (bawaan: `npm`). Alias: `--method`  |
| `--npm`                               | Pintasan untuk metode npm                                  |
| `--git`                               | Pintasan untuk metode git. Alias: `--github`               |
| `--version <version\|dist-tag\|spec>` | Versi npm, dist-tag, atau spesifikasi paket (bawaan: `latest`) |
| `--beta`                              | Gunakan dist-tag beta jika tersedia, jika tidak fallback ke `latest` |
| `--git-dir <path>`                    | Direktori checkout (bawaan: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Lewati `git pull` untuk checkout yang sudah ada            |
| `--no-prompt`                         | Nonaktifkan prompt                                         |
| `--no-onboard`                        | Lewati penyiapan awal                                      |
| `--onboard`                           | Aktifkan penyiapan awal                                    |
| `--dry-run`                           | Cetak tindakan tanpa menerapkan perubahan                  |
| `--verbose`                           | Aktifkan output debug (`set -x`, log level notice npm)     |
| `--help`                              | Tampilkan penggunaan (`-h`)                                |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabel                                                | Deskripsi                                     |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metode instalasi                              |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versi npm, dist-tag, atau spesifikasi paket   |
| `OPENCLAW_BETA=0\|1`                                    | Gunakan beta jika tersedia                    |
| `OPENCLAW_GIT_DIR=<path>`                               | Direktori checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Aktifkan/nonaktifkan pembaruan git            |
| `OPENCLAW_NO_PROMPT=1`                                  | Nonaktifkan prompt                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | Lewati penyiapan awal                         |
| `OPENCLAW_DRY_RUN=1`                                    | Mode dry run                                  |
| `OPENCLAW_VERBOSE=1`                                    | Mode debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Level log npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kontrol perilaku sharp/libvips (bawaan: `1`)  |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Dirancang untuk lingkungan tempat Anda menginginkan semuanya berada di bawah prefiks lokal
(bawaan `~/.openclaw`) dan tanpa dependensi Node sistem. Mendukung instalasi npm
secara bawaan, plus instalasi checkout git dalam alur prefiks yang sama.
</Info>

### Alur (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Mengunduh tarball Node LTS yang didukung dan dipin (versinya disematkan dalam skrip dan diperbarui secara independen) ke `<prefix>/tools/node-v<version>` dan memverifikasi SHA-256.
  </Step>
  <Step title="Ensure Git">
    Jika Git belum ada, mencoba instalasi melalui apt/dnf/yum di Linux atau Homebrew di macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - Metode `npm` (bawaan): menginstal di bawah prefiks dengan npm, lalu menulis wrapper ke `<prefix>/bin/openclaw`
    - Metode `git`: meng-clone/memperbarui checkout (bawaan `~/openclaw`) dan tetap menulis wrapper ke `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Jika layanan gateway sudah dimuat dari prefiks yang sama, skrip menjalankan
    `openclaw gateway install --force`, lalu `openclaw gateway restart`, dan
    memeriksa kesehatan gateway sebisa mungkin.
  </Step>
</Steps>

### Contoh (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Deskripsi                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalasi (bawaan: `~/.openclaw`)                                       |
| `--install-method npm\|git` | Pilih metode instalasi (bawaan: `npm`). Alias: `--method`                       |
| `--npm`                     | Pintasan untuk metode npm                                                       |
| `--git`, `--github`         | Pintasan untuk metode git                                                       |
| `--git-dir <path>`          | Direktori checkout Git (bawaan: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | Versi OpenClaw atau dist-tag (bawaan: `latest`)                                 |
| `--node-version <ver>`      | Versi Node (bawaan: `22.22.0`)                                                  |
| `--json`                    | Mengeluarkan event NDJSON                                                       |
| `--onboard`                 | Jalankan `openclaw onboard` setelah instalasi                                   |
| `--no-onboard`              | Lewati penyiapan awal (bawaan)                                                  |
| `--set-npm-prefix`          | Di Linux, paksa prefiks npm ke `~/.npm-global` jika prefiks saat ini tidak dapat ditulis |
| `--help`                    | Tampilkan penggunaan (`-h`)                                                     |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabel                                    | Deskripsi                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalasi                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metode instalasi                                |
| `OPENCLAW_VERSION=<ver>`                    | Versi OpenClaw atau dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versi Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | Direktori checkout Git untuk instalasi git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Alihkan pembaruan git untuk checkout yang sudah ada     |
| `OPENCLAW_NO_ONBOARD=1`                     | Lewati onboarding                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Level log npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Kendalikan perilaku sharp/libvips (default: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Alur (install.ps1)

<Steps>
  <Step title="Pastikan lingkungan PowerShell + Windows">
    Memerlukan PowerShell 5+.
  </Step>
  <Step title="Pastikan Node.js 24 secara default">
    Jika tidak ada, mencoba instalasi melalui winget, lalu Chocolatey, lalu Scoop. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): instalasi npm global menggunakan `-Tag` yang dipilih
    - Metode `git`: clone/perbarui repo, instal/build dengan pnpm, dan instal wrapper di `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tugas pascainstalasi">
    - Menambahkan direktori bin yang diperlukan ke PATH pengguna jika memungkinkan
    - Memuat ulang layanan Gateway yang dimuat secara upaya terbaik (`openclaw gateway install --force`, lalu restart)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan instalasi git (upaya terbaik)

  </Step>
  <Step title="Tangani kegagalan">
    Instalasi `iwr ... | iex` dan scriptblock melaporkan error terminasi tanpa menutup sesi PowerShell saat ini. Instalasi langsung `powershell -File` / `pwsh -File` tetap keluar non-nol untuk otomasi.
  </Step>
</Steps>

### Contoh (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalasi git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main melalui npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Direktori git kustom">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Jejak debug">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                        | Deskripsi                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metode instalasi (default: `npm`)                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag, versi, atau spesifikasi paket (default: `latest`) |
| `-GitDir <path>`            | Direktori checkout (default: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Lewati onboarding                                            |
| `-NoGitUpdate`              | Lewati `git pull`                                            |
| `-DryRun`                   | Cetak tindakan saja                                         |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                           | Deskripsi        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metode instalasi     |
| `OPENCLAW_GIT_DIR=<path>`          | Direktori checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Lewati onboarding    |
| `OPENCLAW_GIT_UPDATE=0`            | Nonaktifkan git pull   |
| `OPENCLAW_DRY_RUN=1`               | Mode dry run       |

  </Accordion>
</AccordionGroup>

<Note>
Jika `-InstallMethod git` digunakan dan Git tidak tersedia, skrip keluar dan mencetak tautan Git for Windows.
</Note>

---

## CI dan otomasi

Gunakan flag/variabel lingkungan non-interaktif untuk run yang dapat diprediksi.

<Tabs>
  <Tab title="install.sh (npm non-interaktif)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git non-interaktif)">
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
  <Tab title="install.ps1 (lewati onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Mengapa Git diperlukan?">
    Git diperlukan untuk metode instalasi `git`. Untuk instalasi `npm`, Git tetap diperiksa/diinstal untuk menghindari kegagalan `spawn git ENOENT` saat dependensi menggunakan URL git.
  </Accordion>

  <Accordion title="Mengapa npm mengalami EACCES di Linux?">
    Beberapa penyiapan Linux mengarahkan prefiks global npm ke path milik root. `install.sh` dapat mengganti prefiks ke `~/.npm-global` dan menambahkan ekspor PATH ke file rc shell (jika file tersebut ada).
  </Accordion>

  <Accordion title="Masalah sharp/libvips">
    Skrip menetapkan default `SHARP_IGNORE_GLOBAL_LIBVIPS=1` untuk menghindari sharp dibangun terhadap libvips sistem. Untuk menimpa:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instal Git for Windows, buka ulang PowerShell, jalankan ulang installer.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Jalankan `npm config get prefix` dan tambahkan direktori tersebut ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows), lalu buka ulang PowerShell.
  </Accordion>

  <Accordion title="Windows: cara mendapatkan output installer yang verbose">
    `install.ps1` saat ini tidak menyediakan switch `-Verbose`.
    Gunakan tracing PowerShell untuk diagnostik tingkat skrip:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw tidak ditemukan setelah instalasi">
    Biasanya masalah PATH. Lihat [pemecahan masalah Node.js](/id/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan instalasi](/id/install)
- [Memperbarui](/id/install/updating)
- [Uninstal](/id/install/uninstall)

---
read_when:
    - Anda ingin memahami `openclaw.ai/install.sh`
    - Anda ingin mengotomatisasi instalasi (CI / headless)
    - Anda ingin menginstal dari checkout GitHub
summary: Cara kerja skrip installer (`install.sh`, `install-cli.sh`, `install.ps1`), flag, dan otomatisasi
title: Internal installer
x-i18n:
    generated_at: "2026-04-26T11:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw menyediakan tiga skrip installer, disajikan dari `openclaw.ai`.

| Skrip                             | Platform             | Fungsinya                                                                                                      |
| --------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Menginstal Node + OpenClaw ke prefix lokal (`~/.openclaw`) dengan mode npm atau checkout git. Tidak memerlukan root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan onboarding. |

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
Jika instalasi berhasil tetapi `openclaw` tidak ditemukan di terminal baru, lihat [troubleshooting Node.js](/id/install/node#troubleshooting).
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
    Mendukung macOS dan Linux (termasuk WSL). Jika macOS terdeteksi, Homebrew akan diinstal jika belum ada.
  </Step>
  <Step title="Pastikan Node.js 24 secara default">
    Memeriksa versi Node dan menginstal Node 24 jika diperlukan (Homebrew di macOS, skrip setup NodeSource di Linux apt/dnf/yum). OpenClaw tetap mendukung Node 22 LTS, saat ini `22.14+`, untuk kompatibilitas.
  </Step>
  <Step title="Pastikan Git">
    Menginstal Git jika belum ada.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): instalasi npm global
    - Metode `git`: clone/perbarui repo, instal dependensi dengan pnpm, build, lalu instal wrapper di `~/.local/bin/openclaw`
  </Step>
  <Step title="Tugas pasca-instalasi">
    - Me-refresh layanan gateway yang sedang dimuat secara best-effort (`openclaw gateway install --force`, lalu restart)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan instalasi git (best effort)
    - Mencoba onboarding bila sesuai (TTY tersedia, onboarding tidak dinonaktifkan, dan pemeriksaan bootstrap/config lolos)
    - Menggunakan default `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Deteksi checkout source

Jika dijalankan di dalam checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrip menawarkan:

- gunakan checkout (`git`), atau
- gunakan instalasi global (`npm`)

Jika tidak ada TTY yang tersedia dan tidak ada metode instalasi yang diatur, skrip akan menggunakan default `npm` dan memberi peringatan.

Skrip keluar dengan kode `2` untuk pemilihan metode yang tidak valid atau nilai `--install-method` yang tidak valid.

### Contoh (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Lewati onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalasi git">
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
  <Accordion title="Referensi flag">

| Flag                                  | Deskripsi                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Pilih metode instalasi (default: `npm`). Alias: `--method` |
| `--npm`                               | Pintasan untuk metode npm                                  |
| `--git`                               | Pintasan untuk metode git. Alias: `--github`               |
| `--version <version\|dist-tag\|spec>` | Versi npm, dist-tag, atau spesifikasi package (default: `latest`) |
| `--beta`                              | Gunakan dist-tag beta jika tersedia, jika tidak fallback ke `latest` |
| `--git-dir <path>`                    | Direktori checkout (default: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Lewati `git pull` untuk checkout yang sudah ada            |
| `--no-prompt`                         | Nonaktifkan prompt                                         |
| `--no-onboard`                        | Lewati onboarding                                          |
| `--onboard`                           | Aktifkan onboarding                                        |
| `--dry-run`                           | Cetak aksi tanpa menerapkan perubahan                      |
| `--verbose`                           | Aktifkan output debug (`set -x`, log npm level notice)     |
| `--help`                              | Tampilkan penggunaan (`-h`)                                |

  </Accordion>

  <Accordion title="Referensi environment variable">

| Variable                                                | Deskripsi                                     |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metode instalasi                              |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versi npm, dist-tag, atau spesifikasi package |
| `OPENCLAW_BETA=0\|1`                                    | Gunakan beta jika tersedia                    |
| `OPENCLAW_GIT_DIR=<path>`                               | Direktori checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Toggle pembaruan git                          |
| `OPENCLAW_NO_PROMPT=1`                                  | Nonaktifkan prompt                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | Lewati onboarding                             |
| `OPENCLAW_DRY_RUN=1`                                    | Mode dry run                                  |
| `OPENCLAW_VERBOSE=1`                                    | Mode debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Level log npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kendalikan perilaku sharp/libvips (default: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Dirancang untuk lingkungan tempat Anda ingin semuanya berada di bawah prefix lokal
(default `~/.openclaw`) dan tanpa dependensi Node sistem. Mendukung instalasi npm
secara default, ditambah instalasi checkout git dalam alur prefix yang sama.
</Info>

### Alur (install-cli.sh)

<Steps>
  <Step title="Instal runtime Node lokal">
    Mengunduh tarball Node LTS yang didukung dan dipin (versinya ditanamkan di dalam skrip dan diperbarui secara independen) ke `<prefix>/tools/node-v<version>` dan memverifikasi SHA-256.
  </Step>
  <Step title="Pastikan Git">
    Jika Git belum ada, mencoba menginstal melalui apt/dnf/yum di Linux atau Homebrew di macOS.
  </Step>
  <Step title="Instal OpenClaw di bawah prefix">
    - Metode `npm` (default): menginstal di bawah prefix dengan npm, lalu menulis wrapper ke `<prefix>/bin/openclaw`
    - Metode `git`: clone/perbarui checkout (default `~/openclaw`) dan tetap menulis wrapper ke `<prefix>/bin/openclaw`
  </Step>
  <Step title="Refresh layanan gateway yang dimuat">
    Jika layanan gateway sudah dimuat dari prefix yang sama, skrip menjalankan
    `openclaw gateway install --force`, lalu `openclaw gateway restart`, dan
    memeriksa kesehatan gateway secara best-effort.
  </Step>
</Steps>

### Contoh (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefix kustom + versi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalasi git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Output JSON untuk otomatisasi">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Jalankan onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                        | Deskripsi                                                                     |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefix instalasi (default: `~/.openclaw`)                                     |
| `--install-method npm\|git` | Pilih metode instalasi (default: `npm`). Alias: `--method`                    |
| `--npm`                     | Pintasan untuk metode npm                                                     |
| `--git`, `--github`         | Pintasan untuk metode git                                                     |
| `--git-dir <path>`          | Direktori checkout git (default: `~/openclaw`). Alias: `--dir`                |
| `--version <ver>`           | Versi OpenClaw atau dist-tag (default: `latest`)                              |
| `--node-version <ver>`      | Versi Node (default: `22.22.0`)                                               |
| `--json`                    | Keluarkan peristiwa NDJSON                                                    |
| `--onboard`                 | Jalankan `openclaw onboard` setelah instalasi                                 |
| `--no-onboard`              | Lewati onboarding (default)                                                   |
| `--set-npm-prefix`          | Di Linux, paksa prefix npm ke `~/.npm-global` jika prefix saat ini tidak dapat ditulisi |
| `--help`                    | Tampilkan penggunaan (`-h`)                                                   |

  </Accordion>

  <Accordion title="Referensi environment variable">

| Variable                                    | Deskripsi                                   |
| ------------------------------------------- | ------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefix instalasi                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metode instalasi                            |
| `OPENCLAW_VERSION=<ver>`                    | Versi OpenClaw atau dist-tag                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versi Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | Direktori checkout git untuk instalasi git  |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Toggle pembaruan git untuk checkout yang sudah ada |
| `OPENCLAW_NO_ONBOARD=1`                     | Lewati onboarding                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Level log npm                               |
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
    Jika belum ada, mencoba instalasi melalui winget, lalu Chocolatey, lalu Scoop. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): instalasi npm global menggunakan `-Tag` yang dipilih
    - Metode `git`: clone/perbarui repo, install/build dengan pnpm, dan instal wrapper di `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Tugas pasca-instalasi">
    - Menambahkan direktori bin yang diperlukan ke PATH pengguna bila memungkinkan
    - Me-refresh layanan gateway yang sedang dimuat secara best-effort (`openclaw gateway install --force`, lalu restart)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan instalasi git (best effort)
  </Step>
  <Step title="Menangani kegagalan">
    Instalasi `iwr ... | iex` dan scriptblock melaporkan terminating error tanpa menutup sesi PowerShell saat ini. Instalasi langsung `powershell -File` / `pwsh -File` tetap keluar dengan status non-zero untuk otomatisasi.
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
  <Tab title="GitHub main via npm">
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
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 belum memiliki flag -Verbose khusus.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referensi flag">

| Flag                        | Deskripsi                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metode instalasi (default: `npm`)                          |
| `-Tag <tag\|version\|spec>` | npm dist-tag, versi, atau spesifikasi package (default: `latest`) |
| `-GitDir <path>`            | Direktori checkout (default: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Lewati onboarding                                          |
| `-NoGitUpdate`              | Lewati `git pull`                                          |
| `-DryRun`                   | Hanya cetak aksi                                           |

  </Accordion>

  <Accordion title="Referensi environment variable">

| Variable                           | Deskripsi          |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metode instalasi   |
| `OPENCLAW_GIT_DIR=<path>`          | Direktori checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Lewati onboarding  |
| `OPENCLAW_GIT_UPDATE=0`            | Nonaktifkan git pull |
| `OPENCLAW_DRY_RUN=1`               | Mode dry run       |

  </Accordion>
</AccordionGroup>

<Note>
Jika `-InstallMethod git` digunakan dan Git tidak ada, skrip keluar dan mencetak tautan Git for Windows.
</Note>

---

## CI dan otomatisasi

Gunakan flag/env var non-interaktif untuk run yang dapat diprediksi.

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

## Troubleshooting

<AccordionGroup>
  <Accordion title="Mengapa Git diperlukan?">
    Git diperlukan untuk metode instalasi `git`. Untuk instalasi `npm`, Git tetap diperiksa/diinstal untuk menghindari kegagalan `spawn git ENOENT` saat dependensi menggunakan URL git.
  </Accordion>

  <Accordion title="Mengapa npm terkena EACCES di Linux?">
    Beberapa penyiapan Linux mengarahkan prefix global npm ke path milik root. `install.sh` dapat mengganti prefix ke `~/.npm-global` dan menambahkan ekspor PATH ke file rc shell (saat file tersebut ada).
  </Accordion>

  <Accordion title="Masalah sharp/libvips">
    Skrip menggunakan default `SHARP_IGNORE_GLOBAL_LIBVIPS=1` untuk menghindari build sharp terhadap libvips sistem. Untuk override:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instal Git for Windows, buka ulang PowerShell, lalu jalankan ulang installer.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Jalankan `npm config get prefix` dan tambahkan direktori tersebut ke PATH pengguna Anda (tidak perlu akhiran `\bin` di Windows), lalu buka ulang PowerShell.
  </Accordion>

  <Accordion title="Windows: cara mendapatkan output installer verbose">
    `install.ps1` saat ini tidak mengekspos switch `-Verbose`.
    Gunakan tracing PowerShell untuk diagnostik tingkat skrip:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw tidak ditemukan setelah instalasi">
    Biasanya masalah PATH. Lihat [troubleshooting Node.js](/id/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Memperbarui](/id/install/updating)
- [Uninstall](/id/install/uninstall)

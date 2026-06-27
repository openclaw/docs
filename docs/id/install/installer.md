---
read_when:
    - Anda ingin memahami `openclaw.ai/install.sh`
    - Anda ingin mengotomatiskan instalasi (CI / headless)
    - Anda ingin menginstal dari checkout GitHub
summary: Cara kerja skrip penginstal (install.sh, install-cli.sh, install.ps1), flag, dan otomatisasi
title: Internal penginstal
x-i18n:
    generated_at: "2026-06-27T17:38:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw menyediakan tiga skrip penginstal, disajikan dari `openclaw.ai`.

| Skrip                              | Platform             | Yang dilakukan                                                                                                |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Menginstal Node + OpenClaw ke prefiks lokal (`~/.openclaw`) dengan mode npm atau git checkout. Tidak memerlukan root. |
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
Jika penginstalan berhasil tetapi `openclaw` tidak ditemukan di terminal baru, lihat [pemecahan masalah Node.js](/id/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Direkomendasikan untuk sebagian besar penginstalan interaktif di macOS/Linux/WSL.
</Tip>

### Alur (install.sh)

<Steps>
  <Step title="Mendeteksi OS">
    Mendukung macOS dan Linux (termasuk WSL).
  </Step>
  <Step title="Memastikan Node.js 24 secara default">
    Memeriksa versi Node dan menginstal Node 24 jika diperlukan (Homebrew di macOS, skrip penyiapan NodeSource di Linux apt/dnf/yum). Di macOS, Homebrew hanya diinstal saat penginstal memerlukannya untuk Node atau Git. OpenClaw tetap mendukung Node 22 LTS, saat ini `22.19+`, untuk kompatibilitas.
    Di Alpine/musl Linux, penginstal menggunakan paket apk alih-alih NodeSource; repositori Alpine yang dikonfigurasi harus menyediakan Node `22.19+` (Alpine 3.21 atau lebih baru pada saat penulisan).
  </Step>
  <Step title="Memastikan Git">
    Menginstal Git jika belum ada menggunakan manajer paket yang terdeteksi, termasuk Homebrew di macOS dan apk di Alpine.
  </Step>
  <Step title="Menginstal OpenClaw">
    - Metode `npm` (default): penginstalan npm global
    - Metode `git`: clone/update repo, instal dependensi dengan pnpm, build, lalu instal wrapper di `~/.local/bin/openclaw`

  </Step>
  <Step title="Tugas pasca-instalasi">
    - Menyegarkan layanan Gateway yang dimuat secara upaya terbaik (`openclaw gateway install --force`, lalu mulai ulang)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan penginstalan git (upaya terbaik)
    - Mencoba onboarding saat sesuai (TTY tersedia, onboarding tidak dinonaktifkan, dan pemeriksaan bootstrap/konfigurasi lulus)

  </Step>
</Steps>

### Deteksi checkout sumber

Jika dijalankan di dalam checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrip menawarkan:

- gunakan checkout (`git`), atau
- gunakan penginstalan global (`npm`)

Jika tidak ada TTY yang tersedia dan tidak ada metode instalasi yang ditetapkan, default-nya adalah `npm` dan memberi peringatan.

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
  <Tab title="Penginstalan Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout main GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
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
| `--version <version\|dist-tag\|spec>` | Versi npm, dist-tag, atau spesifikasi paket (default: `latest`) |
| `--beta`                              | Gunakan dist-tag beta jika tersedia, jika tidak fallback ke `latest` |
| `--git-dir <path>`                    | Direktori checkout (default: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Lewati `git pull` untuk checkout yang sudah ada            |
| `--no-prompt`                         | Nonaktifkan prompt                                         |
| `--no-onboard`                        | Lewati onboarding                                          |
| `--onboard`                           | Aktifkan onboarding                                        |
| `--dry-run`                           | Cetak tindakan tanpa menerapkan perubahan                  |
| `--verbose`                           | Aktifkan output debug (`set -x`, log tingkat notice npm)   |
| `--help`                              | Tampilkan penggunaan (`-h`)                                |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                                          | Deskripsi                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Metode instalasi                                                   |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versi npm, dist-tag, atau spesifikasi paket                        |
| `OPENCLAW_BETA=0\|1`                              | Gunakan beta jika tersedia                                         |
| `OPENCLAW_HOME=<path>`                            | Direktori dasar untuk state OpenClaw dan path git/onboarding default |
| `OPENCLAW_GIT_DIR=<path>`                         | Direktori checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Aktifkan/nonaktifkan update git                                    |
| `OPENCLAW_NO_PROMPT=1`                            | Nonaktifkan prompt                                                 |
| `OPENCLAW_NO_ONBOARD=1`                           | Lewati onboarding                                                  |
| `OPENCLAW_DRY_RUN=1`                              | Mode dry run                                                       |
| `OPENCLAW_VERBOSE=1`                              | Mode debug                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Tingkat log npm                                                    |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Dirancang untuk lingkungan tempat Anda menginginkan semuanya berada di bawah prefiks lokal
(default `~/.openclaw`) dan tanpa dependensi Node sistem. Mendukung penginstalan npm
secara default, plus penginstalan git-checkout di bawah alur prefiks yang sama.
</Info>

### Alur (install-cli.sh)

<Steps>
  <Step title="Menginstal runtime Node lokal">
    Mengunduh tarball Node LTS yang didukung dan dipin (versinya disematkan di skrip dan diperbarui secara independen) ke `<prefix>/tools/node-v<version>` dan memverifikasi SHA-256.
    Di Alpine/musl Linux, tempat Node tidak menerbitkan tarball yang kompatibel untuk runtime yang dipin, menginstal `nodejs` dan `npm` dengan `apk` dan menautkan runtime tersebut ke path wrapper prefiks. Repositori Alpine harus menyediakan Node `22.19+`; gunakan Alpine 3.21 atau lebih baru jika repositori lama hanya menyediakan Node 20 atau 21.
  </Step>
  <Step title="Memastikan Git">
    Jika Git belum ada, mencoba instalasi melalui apt/dnf/yum/apk di Linux atau Homebrew di macOS.
  </Step>
  <Step title="Menginstal OpenClaw di bawah prefiks">
    - Metode `npm` (default): menginstal di bawah prefiks dengan npm, lalu menulis wrapper ke `<prefix>/bin/openclaw`
    - Metode `git`: clone/update checkout (default `~/openclaw`) dan tetap menulis wrapper ke `<prefix>/bin/openclaw`

  </Step>
  <Step title="Menyegarkan layanan Gateway yang dimuat">
    Jika layanan Gateway sudah dimuat dari prefiks yang sama, skrip menjalankan
    `openclaw gateway install --force`, lalu `openclaw gateway restart`, dan
    memeriksa kesehatan Gateway secara upaya terbaik.
  </Step>
</Steps>

### Contoh (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefiks + versi kustom">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Penginstalan Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Output JSON otomatisasi">
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

| Flag                        | Deskripsi                                                                      |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instalasi (default: `~/.openclaw`)                                      |
| `--install-method npm\|git` | Pilih metode instalasi (default: `npm`). Alias: `--method`                      |
| `--npm`                     | Pintasan untuk metode npm                                                       |
| `--git`, `--github`         | Pintasan untuk metode git                                                       |
| `--git-dir <path>`          | Direktori checkout Git (default: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | Versi OpenClaw atau dist-tag (default: `latest`)                                |
| `--node-version <ver>`      | Versi Node (default: `22.22.0`)                                                 |
| `--json`                    | Keluarkan peristiwa NDJSON                                                      |
| `--onboard`                 | Jalankan `openclaw onboard` setelah instalasi                                   |
| `--no-onboard`              | Lewati orientasi awal (default)                                                 |
| `--set-npm-prefix`          | Di Linux, paksa prefiks npm ke `~/.npm-global` jika prefiks saat ini tidak dapat ditulis |
| `--help`                    | Tampilkan penggunaan (`-h`)                                                     |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabel                                    | Deskripsi                                                          |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalasi                                                  |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metode instalasi                                                   |
| `OPENCLAW_VERSION=<ver>`                    | Versi OpenClaw atau dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versi Node                                                         |
| `OPENCLAW_HOME=<path>`                      | Direktori dasar untuk status OpenClaw dan jalur git/orientasi awal default |
| `OPENCLAW_GIT_DIR=<path>`                   | Direktori checkout Git untuk instalasi git                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Alihkan pembaruan git untuk checkout yang sudah ada                |
| `OPENCLAW_NO_ONBOARD=1`                     | Lewati orientasi awal                                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Level log npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Alur (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    Memerlukan PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Jika tidak ada, mencoba instalasi melalui winget, lalu Chocolatey, lalu Scoop. Jika tidak ada manajer paket yang tersedia, skrip mengunduh zip resmi Node.js Windows ke `%LOCALAPPDATA%\OpenClaw\deps\portable-node` dan menambahkannya ke proses saat ini serta PATH pengguna. Node 22 LTS, saat ini `22.19+`, tetap didukung untuk kompatibilitas.
  </Step>
  <Step title="Install OpenClaw">
    - Metode `npm` (default): instalasi npm global menggunakan `-Tag` yang dipilih, dijalankan dari direktori sementara penginstal yang dapat ditulis sehingga shell yang dibuka di folder terlindungi seperti `C:\` tetap berfungsi
    - Metode `git`: clone/perbarui repo, instal/build dengan pnpm, dan instal wrapper di `%USERPROFILE%\.local\bin\openclaw.cmd`. Jika Git tidak ada, skrip melakukan bootstrap MinGit lokal pengguna di `%LOCALAPPDATA%\OpenClaw\deps\portable-git` dan menambahkannya ke proses saat ini serta PATH pengguna.

  </Step>
  <Step title="Post-install tasks">
    - Menambahkan direktori bin yang diperlukan ke PATH pengguna jika memungkinkan
    - Menyegarkan layanan Gateway yang dimuat dengan upaya terbaik (`openclaw gateway install --force`, lalu mulai ulang)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan instalasi git (upaya terbaik)

  </Step>
  <Step title="Handle failures">
    Instalasi `iwr ... | iex` dan scriptblock melaporkan error penghentian tanpa menutup sesi PowerShell saat ini. Instalasi langsung `powershell -File` / `pwsh -File` tetap keluar dengan kode non-nol untuk otomatisasi.
  </Step>
</Steps>

### Contoh (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
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
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Deskripsi                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metode instalasi (default: `npm`)                          |
| `-Tag <tag\|version\|spec>` | dist-tag, versi, atau spesifikasi paket npm (default: `latest`) |
| `-GitDir <path>`            | Direktori checkout (default: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Lewati orientasi awal                                      |
| `-NoGitUpdate`              | Lewati `git pull`                                          |
| `-DryRun`                   | Cetak tindakan saja                                        |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabel                           | Deskripsi          |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metode instalasi   |
| `OPENCLAW_GIT_DIR=<path>`          | Direktori checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Lewati orientasi awal |
| `OPENCLAW_GIT_UPDATE=0`            | Nonaktifkan git pull |
| `OPENCLAW_DRY_RUN=1`               | Mode uji coba      |

  </Accordion>
</AccordionGroup>

<Note>
Jika `-InstallMethod git` digunakan dan Git tidak ada, skrip mencoba bootstrap MinGit lokal pengguna sebelum mencetak tautan Git for Windows.
</Note>

---

## CI dan otomatisasi

Gunakan flag/variabel env non-interaktif untuk eksekusi yang dapat diprediksi.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git diperlukan untuk metode instalasi `git`. Untuk instalasi `npm`, Git tetap diperiksa/diinstal untuk menghindari kegagalan `spawn git ENOENT` ketika dependensi menggunakan URL git.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    Beberapa pengaturan Linux mengarahkan prefiks global npm ke jalur milik root. `install.sh` dapat mengalihkan prefiks ke `~/.npm-global` dan menambahkan ekspor PATH ke file rc shell (ketika file tersebut ada).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Jalankan ulang penginstal agar dapat melakukan bootstrap MinGit lokal pengguna, atau instal Git for Windows dan buka ulang PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Jalankan `npm config get prefix` dan tambahkan direktori tersebut ke PATH pengguna Anda (sufiks `\bin` tidak diperlukan di Windows), lalu buka ulang PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` saat ini tidak menyediakan switch `-Verbose`.
    Gunakan pelacakan PowerShell untuk diagnostik tingkat skrip:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    Biasanya ini masalah PATH. Lihat [pemecahan masalah Node.js](/id/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Memperbarui](/id/install/updating)
- [Uninstal](/id/install/uninstall)

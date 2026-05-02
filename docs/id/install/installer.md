---
read_when:
    - Anda ingin memahami `openclaw.ai/install.sh`
    - Anda ingin mengotomatiskan instalasi (CI / tanpa antarmuka)
    - Anda ingin menginstal dari checkout GitHub
summary: Cara kerja skrip penginstal (install.sh, install-cli.sh, install.ps1), flag, dan otomatisasi
title: Internal penginstal
x-i18n:
    generated_at: "2026-05-02T09:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw mengirimkan tiga skrip penginstal, disajikan dari `openclaw.ai`.

| Skrip                              | Platform             | Fungsinya                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Menginstal Node jika diperlukan, menginstal OpenClaw melalui npm (default) atau git, dan dapat menjalankan onboarding. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Menginstal Node + OpenClaw ke prefiks lokal (`~/.openclaw`) dengan mode npm atau checkout git. Tidak memerlukan root. |
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
  <Step title="Deteksi OS">
    Mendukung macOS dan Linux (termasuk WSL). Jika macOS terdeteksi, menginstal Homebrew jika belum ada.
  </Step>
  <Step title="Pastikan Node.js 24 secara default">
    Memeriksa versi Node dan menginstal Node 24 jika diperlukan (Homebrew di macOS, skrip penyiapan NodeSource di Linux apt/dnf/yum). OpenClaw masih mendukung Node 22 LTS, saat ini `22.14+`, untuk kompatibilitas.
  </Step>
  <Step title="Pastikan Git">
    Menginstal Git jika belum ada.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (default): penginstalan npm global
    - Metode `git`: clone/update repo, instal dependensi dengan pnpm, build, lalu instal wrapper di `~/.local/bin/openclaw`

  </Step>
  <Step title="Tugas pascainstal">
    - Menyegarkan layanan Gateway yang sudah dimuat dengan upaya terbaik (`openclaw gateway install --force`, lalu restart)
    - Menjalankan `openclaw doctor --non-interactive` pada upgrade dan penginstalan git (upaya terbaik)
    - Mencoba onboarding bila sesuai (TTY tersedia, onboarding tidak dinonaktifkan, dan pemeriksaan bootstrap/config lolos)
    - Menetapkan default `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Deteksi checkout sumber

Jika dijalankan di dalam checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), skrip menawarkan:

- gunakan checkout (`git`), atau
- gunakan penginstalan global (`npm`)

Jika tidak ada TTY yang tersedia dan tidak ada metode instal yang ditetapkan, default-nya adalah `npm` dan menampilkan peringatan.

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
  <Tab title="Instal git">
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
| `--install-method npm\|git`           | Pilih metode instal (default: `npm`). Alias: `--method`    |
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
| `--verbose`                           | Aktifkan output debug (`set -x`, log npm level notice)     |
| `--help`                              | Tampilkan penggunaan (`-h`)                                |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                                                | Deskripsi                                      |
| ------------------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Metode instal                                  |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Versi npm, dist-tag, atau spesifikasi paket    |
| `OPENCLAW_BETA=0\|1`                                    | Gunakan beta jika tersedia                     |
| `OPENCLAW_GIT_DIR=<path>`                               | Direktori checkout                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Aktif/nonaktifkan update git                   |
| `OPENCLAW_NO_PROMPT=1`                                  | Nonaktifkan prompt                             |
| `OPENCLAW_NO_ONBOARD=1`                                 | Lewati onboarding                              |
| `OPENCLAW_DRY_RUN=1`                                    | Mode dry run                                   |
| `OPENCLAW_VERBOSE=1`                                    | Mode debug                                     |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Level log npm                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kontrol perilaku sharp/libvips (default: `1`)  |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Dirancang untuk lingkungan tempat Anda ingin semuanya berada di bawah prefiks lokal
(default `~/.openclaw`) dan tanpa dependensi Node sistem. Mendukung penginstalan npm
secara default, plus penginstalan checkout git di bawah alur prefiks yang sama.
</Info>

### Alur (install-cli.sh)

<Steps>
  <Step title="Instal runtime Node lokal">
    Mengunduh tarball Node LTS yang didukung dan dipin (versinya disematkan di skrip dan diperbarui secara terpisah) ke `<prefix>/tools/node-v<version>` dan memverifikasi SHA-256.
  </Step>
  <Step title="Pastikan Git">
    Jika Git belum ada, mencoba menginstal melalui apt/dnf/yum di Linux atau Homebrew di macOS.
  </Step>
  <Step title="Instal OpenClaw di bawah prefiks">
    - Metode `npm` (default): menginstal di bawah prefiks dengan npm, lalu menulis wrapper ke `<prefix>/bin/openclaw`
    - Metode `git`: meng-clone/memperbarui checkout (default `~/openclaw`) dan tetap menulis wrapper ke `<prefix>/bin/openclaw`

  </Step>
  <Step title="Segarkan layanan Gateway yang dimuat">
    Jika layanan Gateway sudah dimuat dari prefiks yang sama, skrip menjalankan
    `openclaw gateway install --force`, lalu `openclaw gateway restart`, dan
    memeriksa kesehatan Gateway dengan upaya terbaik.
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
  <Tab title="Instal git">
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

| Flag                        | Deskripsi                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefiks instal (default: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Pilih metode instal (default: `npm`). Alias: `--method`                         |
| `--npm`                     | Pintasan untuk metode npm                                                       |
| `--git`, `--github`         | Pintasan untuk metode git                                                       |
| `--git-dir <path>`          | Direktori checkout Git (default: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | Versi OpenClaw atau dist-tag (default: `latest`)                                |
| `--node-version <ver>`      | Versi Node (default: `22.22.0`)                                                  |
| `--json`                    | Menghasilkan event NDJSON                                                       |
| `--onboard`                 | Jalankan `openclaw onboard` setelah penginstalan                                |
| `--no-onboard`              | Lewati onboarding (default)                                                     |
| `--set-npm-prefix`          | Di Linux, paksa prefiks npm ke `~/.npm-global` jika prefiks saat ini tidak dapat ditulis |
| `--help`                    | Tampilkan penggunaan (`-h`)                                                     |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                                    | Deskripsi                                      |
| ------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefiks instalasi                              |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Metode instalasi                               |
| `OPENCLAW_VERSION=<ver>`                    | Versi OpenClaw atau dist-tag                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versi Node                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | Direktori checkout Git untuk instalasi git     |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Aktifkan/nonaktifkan pembaruan git untuk checkout yang ada |
| `OPENCLAW_NO_ONBOARD=1`                     | Lewati orientasi awal                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Level log npm                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Kendalikan perilaku sharp/libvips (bawaan: `1`) |

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
  <Step title="Pastikan Node.js 24 secara bawaan">
    Jika tidak ada, mencoba instalasi melalui winget, lalu Chocolatey, lalu Scoop. Node 22 LTS, saat ini `22.14+`, tetap didukung untuk kompatibilitas.
  </Step>
  <Step title="Instal OpenClaw">
    - Metode `npm` (bawaan): instalasi npm global menggunakan `-Tag` yang dipilih, dijalankan dari direktori sementara penginstal yang dapat ditulis agar shell yang dibuka di folder terlindungi seperti `C:\` tetap berfungsi
    - Metode `git`: clone/perbarui repo, instal/build dengan pnpm, dan instal wrapper di `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tugas pascainstalasi">
    - Menambahkan direktori bin yang diperlukan ke PATH pengguna jika memungkinkan
    - Menyegarkan layanan gateway yang dimuat dengan upaya terbaik (`openclaw gateway install --force`, lalu mulai ulang)
    - Menjalankan `openclaw doctor --non-interactive` saat pemutakhiran dan instalasi git (upaya terbaik)

  </Step>
  <Step title="Tangani kegagalan">
    Instalasi `iwr ... | iex` dan scriptblock melaporkan kesalahan terminal tanpa menutup sesi PowerShell saat ini. Instalasi langsung `powershell -File` / `pwsh -File` tetap keluar dengan kode non-nol untuk otomatisasi.
  </Step>
</Steps>

### Contoh (install.ps1)

<Tabs>
  <Tab title="Bawaan">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalasi Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main melalui npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Direktori git khusus">
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

| Flag                        | Deskripsi                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Metode instalasi (bawaan: `npm`)                           |
| `-Tag <tag\|version\|spec>` | dist-tag, versi, atau spec paket npm (bawaan: `latest`)    |
| `-GitDir <path>`            | Direktori checkout (bawaan: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Lewati orientasi awal                                      |
| `-NoGitUpdate`              | Lewati `git pull`                                          |
| `-DryRun`                   | Cetak tindakan saja                                        |

  </Accordion>

  <Accordion title="Referensi variabel lingkungan">

| Variabel                           | Deskripsi           |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Metode instalasi    |
| `OPENCLAW_GIT_DIR=<path>`          | Direktori checkout  |
| `OPENCLAW_NO_ONBOARD=1`            | Lewati orientasi awal |
| `OPENCLAW_GIT_UPDATE=0`            | Nonaktifkan git pull |
| `OPENCLAW_DRY_RUN=1`               | Mode dry run        |

  </Accordion>
</AccordionGroup>

<Note>
Jika `-InstallMethod git` digunakan dan Git tidak ada, skrip keluar dan mencetak tautan Git for Windows.
</Note>

---

## CI dan otomatisasi

Gunakan flag/variabel lingkungan non-interaktif untuk eksekusi yang dapat diprediksi.

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
    Git diperlukan untuk metode instalasi `git`. Untuk instalasi `npm`, Git tetap diperiksa/diinstal untuk menghindari kegagalan `spawn git ENOENT` saat dependensi menggunakan URL git.
  </Accordion>

  <Accordion title="Mengapa npm terkena EACCES di Linux?">
    Beberapa penyiapan Linux mengarahkan prefiks global npm ke jalur milik root. `install.sh` dapat mengalihkan prefiks ke `~/.npm-global` dan menambahkan ekspor PATH ke file rc shell (jika file tersebut ada).
  </Accordion>

  <Accordion title="Masalah sharp/libvips">
    Skrip secara bawaan menetapkan `SHARP_IGNORE_GLOBAL_LIBVIPS=1` untuk menghindari sharp dibangun terhadap libvips sistem. Untuk mengganti:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instal Git for Windows, buka ulang PowerShell, jalankan ulang penginstal.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Jalankan `npm config get prefix` dan tambahkan direktori tersebut ke PATH pengguna Anda (akhiran `\bin` tidak diperlukan di Windows), lalu buka ulang PowerShell.
  </Accordion>

  <Accordion title="Windows: cara mendapatkan keluaran penginstal verbose">
    `install.ps1` saat ini tidak mengekspos switch `-Verbose`.
    Gunakan pelacakan PowerShell untuk diagnostik tingkat skrip:

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

- [Ikhtisar instalasi](/id/install)
- [Memperbarui](/id/install/updating)
- [Menghapus instalasi](/id/install/uninstall)

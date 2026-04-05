---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda sudah menginstal OpenClaw tetapi `openclaw` menampilkan command not found
    - npm install -g gagal karena masalah izin atau PATH
summary: Instal dan konfigurasikan Node.js untuk OpenClaw — persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T13:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw memerlukan **Node 22.14 atau yang lebih baru**. **Node 24 adalah runtime default dan yang direkomendasikan** untuk instalasi, CI, dan alur kerja rilis. Node 22 tetap didukung melalui jalur LTS aktif. [Skrip installer](/install#alternative-install-methods) akan mendeteksi dan menginstal Node secara otomatis — halaman ini ditujukan untuk saat Anda ingin menyiapkan Node sendiri dan memastikan semuanya terhubung dengan benar (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

Jika ini menampilkan `v24.x.x` atau lebih tinggi, Anda menggunakan default yang direkomendasikan. Jika ini menampilkan `v22.14.x` atau lebih tinggi, Anda berada di jalur Node 22 LTS yang didukung, tetapi kami tetap merekomendasikan upgrade ke Node 24 saat memungkinkan. Jika Node belum terinstal atau versinya terlalu lama, pilih salah satu metode instalasi di bawah.

## Instal Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (direkomendasikan):

    ```bash
    brew install node
    ```

    Atau unduh installer macOS dari [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Atau gunakan version manager (lihat di bawah).

  </Tab>
  <Tab title="Windows">
    **winget** (direkomendasikan):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Atau unduh installer Windows dari [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Menggunakan version manager (nvm, fnm, mise, asdf)">
  Version manager memungkinkan Anda berpindah antarversi Node dengan mudah. Opsi yang populer:

- [**fnm**](https://github.com/Schniz/fnm) — cepat, lintas platform
- [**nvm**](https://github.com/nvm-sh/nvm) — banyak digunakan di macOS/Linux
- [**mise**](https://mise.jdx.dev/) — multibahasa (Node, Python, Ruby, dll.)

Contoh dengan fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Pastikan version manager Anda diinisialisasi di file startup shell Anda (`~/.zshrc` atau `~/.bashrc`). Jika tidak, `openclaw` mungkin tidak ditemukan di sesi terminal baru karena PATH tidak akan menyertakan direktori bin Node.
  </Warning>
</Accordion>

## Pemecahan masalah

### `openclaw: command not found`

Ini hampir selalu berarti direktori bin global npm tidak ada di PATH Anda.

<Steps>
  <Step title="Temukan prefix npm global Anda">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Periksa apakah prefix itu ada di PATH Anda">
    ```bash
    echo "$PATH"
    ```

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) di output.

  </Step>
  <Step title="Tambahkan ke file startup shell Anda">
    <Tabs>
      <Tab title="macOS / Linux">
        Tambahkan ke `~/.zshrc` atau `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Lalu buka terminal baru (atau jalankan `rehash` di zsh / `hash -r` di bash).
      </Tab>
      <Tab title="Windows">
        Tambahkan output dari `npm prefix -g` ke PATH sistem Anda melalui Pengaturan → Sistem → Variabel Lingkungan.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Kesalahan izin pada `npm install -g` (Linux)

Jika Anda melihat kesalahan `EACCES`, ubah prefix global npm ke direktori yang dapat ditulisi oleh pengguna:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` agar permanen.

## Terkait

- [Ringkasan Instalasi](/install) — semua metode instalasi
- [Memperbarui](/install/updating) — menjaga OpenClaw tetap terbaru
- [Memulai](/start/getting-started) — langkah pertama setelah instalasi

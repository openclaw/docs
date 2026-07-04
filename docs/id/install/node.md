---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda telah menginstal OpenClaw tetapi perintah `openclaw` tidak ditemukan
    - npm install -g gagal karena masalah izin atau PATH
summary: Instal dan konfigurasikan Node.js untuk OpenClaw - persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-04T11:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw memerlukan **Node 22.19+, Node 23.11+, atau Node 24+**. **Node 24 adalah runtime default dan yang direkomendasikan** untuk instalasi, CI, dan alur kerja rilis. Node 22 tetap didukung melalui lini LTS aktif. [skrip penginstal](/id/install#alternative-install-methods) akan mendeteksi dan menginstal Node secara otomatis - halaman ini ditujukan saat Anda ingin menyiapkan Node sendiri dan memastikan semuanya tersambung dengan benar (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

Jika ini menampilkan `v24.x.x` atau lebih tinggi, Anda menggunakan default yang direkomendasikan. Jika ini menampilkan `v22.19.x` atau lebih tinggi, Anda menggunakan jalur Node 22 LTS yang didukung, tetapi kami tetap menyarankan peningkatan ke Node 24 saat memungkinkan. Versi Node 23 sebelum `v23.11.0` tidak didukung. Jika Node belum terinstal atau versinya berada di luar rentang yang didukung, pilih metode instalasi di bawah.

## Instal Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (direkomendasikan):

    ```bash
    brew install node
    ```

    Atau unduh penginstal macOS dari [nodejs.org](https://nodejs.org/).

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

    Atau gunakan pengelola versi (lihat di bawah).

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

    Atau unduh penginstal Windows dari [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Pengelola versi memungkinkan Anda beralih antarversi Node dengan mudah. Opsi populer:

- [**fnm**](https://github.com/Schniz/fnm) - cepat, lintas platform
- [**nvm**](https://github.com/nvm-sh/nvm) - banyak digunakan di macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglot (Node, Python, Ruby, dll.)

Contoh dengan fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Pastikan pengelola versi Anda diinisialisasi di file startup shell Anda (`~/.zshrc` atau `~/.bashrc`). Jika tidak, `openclaw` mungkin tidak ditemukan di sesi terminal baru karena PATH tidak akan menyertakan direktori bin Node.
  </Warning>
</Accordion>

## Pemecahan Masalah

### `openclaw: command not found`

Ini hampir selalu berarti direktori bin global npm tidak ada di PATH Anda.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) di output.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Tambahkan ke `~/.zshrc` atau `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Lalu buka terminal baru (atau jalankan `rehash` di zsh / `hash -r` di bash).
      </Tab>
      <Tab title="Windows">
        Tambahkan output dari `npm prefix -g` ke PATH sistem Anda melalui Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Error izin pada `npm install -g` (Linux)

Jika Anda melihat error `EACCES`, alihkan prefix global npm ke direktori yang dapat ditulis pengguna:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` Anda agar permanen.

## Terkait

- [Ikhtisar Instalasi](/id/install) - semua metode instalasi
- [Memperbarui](/id/install/updating) - menjaga OpenClaw tetap terbaru
- [Memulai](/id/start/getting-started) - langkah pertama setelah instalasi

---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda telah menginstal OpenClaw tetapi `openclaw` adalah perintah yang tidak ditemukan
    - npm install -g gagal karena masalah izin atau PATH
summary: Menginstal dan mengonfigurasi Node.js untuk OpenClaw - persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw memerlukan **Node 22.16 atau yang lebih baru**. **Node 24 adalah runtime default dan direkomendasikan** untuk instalasi, CI, dan alur kerja rilis. Node 22 tetap didukung melalui jalur LTS aktif. [skrip penginstal](/id/install#alternative-install-methods) akan mendeteksi dan menginstal Node secara otomatis - halaman ini ditujukan saat Anda ingin menyiapkan Node sendiri dan memastikan semuanya terhubung dengan benar (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

Jika ini mencetak `v24.x.x` atau lebih tinggi, Anda menggunakan default yang direkomendasikan. Jika ini mencetak `v22.16.x` atau lebih tinggi, Anda menggunakan jalur Node 22 LTS yang didukung, tetapi kami tetap menyarankan peningkatan ke Node 24 saat memungkinkan. Jika Node belum terinstal atau versinya terlalu lama, pilih metode instalasi di bawah ini.

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

    Atau gunakan manajer versi (lihat di bawah).

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
  Manajer versi memungkinkan Anda beralih antarversi Node dengan mudah. Opsi populer:

- [**fnm**](https://github.com/Schniz/fnm) - cepat, lintas platform
- [**nvm**](https://github.com/nvm-sh/nvm) - banyak digunakan di macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglot (Node, Python, Ruby, dll.)

Contoh dengan fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Pastikan manajer versi Anda diinisialisasi di berkas startup shell Anda (`~/.zshrc` atau `~/.bashrc`). Jika tidak, `openclaw` mungkin tidak ditemukan dalam sesi terminal baru karena PATH tidak akan menyertakan direktori bin Node.
  </Warning>
</Accordion>

## Pemecahan masalah

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

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) dalam output.

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

### Kesalahan izin pada `npm install -g` (Linux)

Jika Anda melihat kesalahan `EACCES`, ubah prefix global npm ke direktori yang dapat ditulis pengguna:

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

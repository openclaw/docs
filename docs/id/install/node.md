---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda menginstal OpenClaw tetapi `openclaw` tidak ditemukan sebagai perintah
    - npm install -g gagal karena masalah izin atau PATH
summary: Instal dan konfigurasikan Node.js untuk OpenClaw - persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-06-27T17:38:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw memerlukan **Node 22.19 atau yang lebih baru**. **Node 24 adalah runtime default dan direkomendasikan** untuk instalasi, CI, dan alur kerja rilis. Node 22 tetap didukung melalui jalur LTS aktif. [skrip penginstal](/id/install#alternative-install-methods) akan mendeteksi dan menginstal Node secara otomatis - halaman ini ditujukan saat Anda ingin menyiapkan Node sendiri dan memastikan semuanya dikonfigurasi dengan benar (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

Jika ini menampilkan `v24.x.x` atau lebih tinggi, Anda menggunakan default yang direkomendasikan. Jika ini menampilkan `v22.19.x` atau lebih tinggi, Anda menggunakan jalur Node 22 LTS yang didukung, tetapi kami tetap menyarankan peningkatan ke Node 24 saat memungkinkan. Jika Node belum terinstal atau versinya terlalu lama, pilih metode instalasi di bawah.

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

<Accordion title="Menggunakan manajer versi (nvm, fnm, mise, asdf)">
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
  Pastikan manajer versi Anda diinisialisasi di file startup shell Anda (`~/.zshrc` atau `~/.bashrc`). Jika tidak, `openclaw` mungkin tidak ditemukan di sesi terminal baru karena PATH tidak akan menyertakan direktori bin Node.
  </Warning>
</Accordion>

## Pemecahan masalah

### `openclaw: command not found`

Ini hampir selalu berarti direktori bin global npm tidak ada di PATH Anda.

<Steps>
  <Step title="Temukan prefiks npm global Anda">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Periksa apakah itu ada di PATH Anda">
    ```bash
    echo "$PATH"
    ```

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) dalam output.

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
        Tambahkan output dari `npm prefix -g` ke PATH sistem Anda melalui Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Kesalahan izin pada `npm install -g` (Linux)

Jika Anda melihat kesalahan `EACCES`, ubah prefiks global npm ke direktori yang dapat ditulis oleh pengguna:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` Anda agar permanen.

## Terkait

- [Ringkasan Instalasi](/id/install) - semua metode instalasi
- [Memperbarui](/id/install/updating) - menjaga OpenClaw tetap mutakhir
- [Memulai](/id/start/getting-started) - langkah pertama setelah instalasi

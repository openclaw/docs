---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda sudah menginstal OpenClaw tetapi `openclaw` adalah perintah yang tidak ditemukan
    - '`npm install -g` gagal karena masalah izin atau PATH'
summary: Instal dan konfigurasikan Node.js untuk OpenClaw — persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T09:14:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw memerlukan **Node 22.14 atau lebih baru**. **Node 24 adalah runtime default dan yang direkomendasikan** untuk instalasi, CI, dan alur rilis. Node 22 tetap didukung melalui jalur LTS aktif. [Skrip installer](/id/install#alternative-install-methods) akan mendeteksi dan menginstal Node secara otomatis — halaman ini ditujukan saat Anda ingin menyiapkan Node sendiri dan memastikan semuanya terhubung dengan benar (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

Jika ini menampilkan `v24.x.x` atau lebih tinggi, Anda menggunakan default yang direkomendasikan. Jika menampilkan `v22.14.x` atau lebih tinggi, Anda berada di jalur Node 22 LTS yang didukung, tetapi kami tetap merekomendasikan upgrade ke Node 24 saat memungkinkan. Jika Node belum terinstal atau versinya terlalu lama, pilih salah satu metode instalasi di bawah.

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
  Version manager memudahkan Anda berpindah antar versi Node. Opsi populer:

- [**fnm**](https://github.com/Schniz/fnm) — cepat, lintas platform
- [**nvm**](https://github.com/nvm-sh/nvm) — banyak digunakan di macOS/Linux
- [**mise**](https://mise.jdx.dev/) — polyglot (Node, Python, Ruby, dll.)

Contoh dengan fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Pastikan version manager Anda diinisialisasi di file startup shell (`~/.zshrc` atau `~/.bashrc`). Jika tidak, `openclaw` mungkin tidak ditemukan di sesi terminal baru karena PATH tidak akan menyertakan direktori bin milik Node.
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
  <Step title="Periksa apakah prefix tersebut ada di PATH Anda">
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
        Tambahkan output dari `npm prefix -g` ke PATH sistem Anda melalui Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Error izin pada `npm install -g` (Linux)

Jika Anda melihat error `EACCES`, ubah prefix global npm ke direktori yang dapat ditulis pengguna:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` agar permanen.

## Terkait

- [Ikhtisar Instalasi](/id/install) — semua metode instalasi
- [Memperbarui](/id/install/updating) — menjaga OpenClaw tetap mutakhir
- [Memulai](/id/start/getting-started) — langkah pertama setelah instalasi

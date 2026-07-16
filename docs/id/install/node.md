---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda telah menginstal OpenClaw, tetapi perintah `openclaw` tidak ditemukan
    - npm install -g gagal karena masalah izin atau PATH
summary: Instal dan konfigurasikan Node.js untuk OpenClaw - persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T18:15:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw memerlukan **Node 22.22.3+, Node 24.15+, atau Node 25.9+**. **Node 24 adalah runtime default dan yang direkomendasikan** untuk instalasi, CI, dan alur kerja rilis; Node 22 tetap didukung melalui lini LTS aktif. Node 23 tidak didukung. [Skrip penginstal](/id/install#alternative-install-methods) mendeteksi dan menginstal Node secara otomatis — gunakan halaman ini jika Anda ingin menyiapkan Node sendiri (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

`v24.15.0` atau 24.x yang lebih baru adalah default yang direkomendasikan. `v22.22.3` atau 22.x yang lebih baru adalah jalur Node 22 LTS yang didukung; Node `v25.9.0+` juga didukung. Node 23 tidak didukung. Jika Node tidak tersedia atau berada di luar rentang yang didukung, pilih metode instalasi di bawah ini.

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

<Accordion title="Menggunakan pengelola versi (nvm, fnm, mise, asdf)">
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
  Inisialisasi pengelola versi di berkas startup shell Anda (`~/.zshrc` atau `~/.bashrc`). Jika langkah ini dilewati, `openclaw` mungkin tidak ditemukan dalam sesi terminal baru karena PATH tidak akan menyertakan direktori bin Node.
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
  <Step title="Periksa apakah direktori tersebut ada di PATH Anda">
    ```bash
    echo "$PATH"
    ```

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) dalam output.

  </Step>
  <Step title="Tambahkan direktori tersebut ke berkas startup shell Anda">
    <Tabs>
      <Tab title="macOS / Linux">
        Tambahkan ke `~/.zshrc` atau `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Kemudian buka terminal baru (atau jalankan `rehash` di zsh / `hash -r` di bash).
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

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` agar perubahan ini permanen.

## Terkait

- [Ikhtisar Instalasi](/id/install) - semua metode instalasi
- [Memperbarui](/id/install/updating) - menjaga OpenClaw tetap mutakhir
- [Memulai](/id/start/getting-started) - langkah pertama setelah instalasi

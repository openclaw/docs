---
read_when:
    - Anda perlu menginstal Node.js sebelum menginstal OpenClaw
    - Anda telah menginstal OpenClaw, tetapi `openclaw` tidak ditemukan sebagai perintah
    - npm install -g gagal karena masalah izin atau PATH
summary: Instal dan konfigurasikan Node.js untuk OpenClaw - persyaratan versi, opsi instalasi, dan pemecahan masalah PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T14:18:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw memerlukan **Node 22.19+, Node 23.11+, atau Node 24+**. **Node 24 adalah runtime default dan yang direkomendasikan** untuk instalasi, CI, dan alur kerja rilis; Node 22 tetap didukung melalui lini LTS aktif. [Skrip penginstal](/id/install#alternative-install-methods) mendeteksi dan menginstal Node secara otomatis — gunakan halaman ini jika Anda ingin menyiapkan Node sendiri (versi, PATH, instalasi global).

## Periksa versi Anda

```bash
node -v
```

`v24.x.x` atau yang lebih tinggi adalah versi default yang direkomendasikan. `v22.19.x` atau yang lebih tinggi adalah jalur Node 22 LTS yang didukung (tingkatkan ke Node 24 jika memungkinkan). Build Node 23 sebelum `v23.11.0` tidak didukung. Jika Node belum tersedia atau berada di luar rentang yang didukung, pilih metode instalasi di bawah ini.

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
  Pengelola versi memungkinkan Anda beralih antarversi Node dengan mudah. Pilihan populer:

- [**fnm**](https://github.com/Schniz/fnm) - cepat, lintas platform
- [**nvm**](https://github.com/nvm-sh/nvm) - digunakan secara luas di macOS/Linux
- [**mise**](https://mise.jdx.dev/) - mendukung berbagai bahasa (Node, Python, Ruby, dan sebagainya)

Contoh dengan fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inisialisasi pengelola versi Anda dalam berkas awal shell (`~/.zshrc` atau `~/.bashrc`). Jika langkah ini dilewati, `openclaw` mungkin tidak ditemukan dalam sesi terminal baru karena PATH tidak menyertakan direktori bin Node.
  </Warning>
</Accordion>

## Pemecahan masalah

### `openclaw: command not found`

Hal ini hampir selalu berarti direktori bin global npm tidak ada dalam PATH Anda.

<Steps>
  <Step title="Temukan prefiks npm global Anda">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Periksa apakah direktori tersebut ada dalam PATH Anda">
    ```bash
    echo "$PATH"
    ```

    Cari `<npm-prefix>/bin` (macOS/Linux) atau `<npm-prefix>` (Windows) dalam output.

  </Step>
  <Step title="Tambahkan ke berkas awal shell Anda">
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

Jika Anda melihat kesalahan `EACCES`, ubah prefiks global npm ke direktori yang dapat ditulisi oleh pengguna:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Tambahkan baris `export PATH=...` ke `~/.bashrc` atau `~/.zshrc` agar perubahan tersebut permanen.

## Terkait

- [Ikhtisar Instalasi](/id/install) - semua metode instalasi
- [Pembaruan](/id/install/updating) - menjaga OpenClaw tetap mutakhir
- [Memulai](/id/start/getting-started) - langkah pertama setelah instalasi

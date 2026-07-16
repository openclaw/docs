---
read_when:
    - Anda memerlukan metode instalasi selain panduan mulai cepat Memulai
    - Anda ingin menerapkan ke platform cloud
    - Anda perlu memperbarui, memigrasikan, atau menghapus instalasi
summary: Instal OpenClaw - skrip penginstal, npm/pnpm/bun, dari sumber, Docker, dan lainnya
title: Instalasi
x-i18n:
    generated_at: "2026-07-16T18:15:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Persyaratan sistem

- **Node 22.22.3+, 24.15+, atau 25.9+** - Node 24 adalah target default; skrip penginstal menanganinya secara otomatis.
- **macOS, Linux, atau Windows** - Pengguna Windows dapat memulai dengan aplikasi Windows Hub native, penginstal CLI PowerShell, atau Gateway WSL2. Lihat [Windows](/id/platforms/windows).
- `pnpm` hanya diperlukan jika Anda membangun dari sumber.

## Direkomendasikan: skrip penginstal

Cara tercepat untuk menginstal. Skrip ini mendeteksi OS Anda, menginstal Node jika diperlukan, menginstal OpenClaw, dan menjalankan orientasi awal.

<Note>
Pengguna desktop Windows juga dapat menginstal aplikasi pendamping [Windows Hub](/id/platforms/windows#recommended-windows-hub) native, yang mencakup penyiapan, status baki sistem, obrolan, mode node, dan mode MCP lokal.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Untuk menginstal tanpa menjalankan orientasi awal:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Untuk semua flag dan opsi CI/otomatisasi, lihat [Cara kerja internal penginstal](/id/install/installer).

## Metode instalasi alternatif

### Penginstal prefiks lokal (`install-cli.sh`)

Gunakan ini jika Anda ingin menyimpan OpenClaw dan Node di bawah prefiks lokal seperti
`~/.openclaw`, tanpa bergantung pada instalasi Node di seluruh sistem:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Secara default, penginstal ini mendukung instalasi npm, serta instalasi checkout git dalam alur
prefiks yang sama. Referensi lengkap: [Cara kerja internal penginstal](/id/install/installer#install-clish).

Sudah terinstal? Beralihlah antara instalasi paket dan git dengan
`openclaw update --channel dev` dan `openclaw update --channel stable`. Lihat
[Pembaruan](/id/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm, atau bun

Jika Anda sudah mengelola Node sendiri:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Penginstal yang dihosting menghapus filter kebaruan npm seperti `min-release-age`
    untuk instalasi paket OpenClaw. Jika Anda menginstal secara manual dengan npm, kebijakan
    npm Anda sendiri tetap berlaku.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm memerlukan persetujuan eksplisit untuk paket dengan skrip pembangunan. Jalankan `pnpm approve-builds -g` setelah instalasi pertama.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun dapat menginstal paket global, tetapi executable `openclaw` yang dihasilkan memerlukan runtime Node yang didukung karena status OpenClaw menggunakan `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Dari sumber

Untuk kontributor atau siapa pun yang ingin menjalankan dari checkout lokal:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Atau lewati penautan dan gunakan `pnpm openclaw ...` dari dalam repo. Lihat [Penyiapan](/id/start/setup) untuk alur kerja pengembangan lengkap.

### Instal dari checkout main GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Kontainer dan pengelola paket

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="container">
    Deployment dalam kontainer atau tanpa antarmuka grafis.
  </Card>
  <Card title="Podman" href="/id/install/podman" icon="container">
    Alternatif kontainer tanpa root untuk Docker.
  </Card>
  <Card title="Nix" href="/id/install/nix" icon="snowflake">
    Instalasi deklaratif melalui flake Nix.
  </Card>
  <Card title="Ansible" href="/id/install/ansible" icon="server">
    Penyediaan armada otomatis.
  </Card>
  <Card title="Bun" href="/id/install/bun" icon="zap">
    Penginstal dependensi dan pelaksana skrip paket opsional.
  </Card>
</CardGroup>

## Verifikasi instalasi

```bash
openclaw --version      # pastikan CLI tersedia
openclaw doctor         # periksa masalah konfigurasi
openclaw gateway status # pastikan Gateway sedang berjalan
```

Jika Anda menginginkan proses mulai terkelola setelah instalasi:

- macOS: LaunchAgent melalui `openclaw onboard --install-daemon` atau `openclaw gateway install`
- Linux/WSL2: layanan pengguna systemd melalui perintah yang sama
- Windows native: Scheduled Task sebagai pilihan pertama, dengan item masuk folder Startup per pengguna sebagai cadangan jika pembuatan tugas ditolak

## Hosting dan deployment

Deploy OpenClaw pada server cloud atau VPS. Lihat [Server Linux](/id/vps) untuk
pemilih penyedia lengkap (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi, dan lainnya), atau lakukan deployment secara deklaratif di
[Render](/id/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/id/vps">
    Pilih penyedia.
  </Card>
  <Card title="VM Docker" href="/id/install/docker-vm-runtime">
    Langkah-langkah Docker bersama.
  </Card>
  <Card title="Kubernetes" href="/id/install/kubernetes">
    Deployment K8s.
  </Card>
</CardGroup>

## Perbarui, migrasikan, atau hapus instalasi

<CardGroup cols={3}>
  <Card title="Pembaruan" href="/id/install/updating" icon="refresh-cw">
    Pastikan OpenClaw selalu terbaru.
  </Card>
  <Card title="Migrasi" href="/id/install/migrating" icon="arrow-right">
    Pindahkan ke mesin baru.
  </Card>
  <Card title="Hapus Instalasi" href="/id/install/uninstall" icon="trash-2">
    Hapus OpenClaw sepenuhnya.
  </Card>
</CardGroup>

## Pemecahan masalah: `openclaw` tidak ditemukan

Hampir selalu merupakan masalah PATH: direktori bin global npm tidak ada di `PATH` shell Anda. Lihat [Pemecahan masalah Node.js](/id/install/node#troubleshooting) untuk perbaikan lengkap, termasuk jalur Windows.

```bash
node -v           # Node sudah terinstal?
npm prefix -g     # Di mana paket global berada?
echo "$PATH"      # Apakah direktori bin global ada di PATH?
```

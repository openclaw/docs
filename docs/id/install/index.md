---
read_when:
    - Anda memerlukan metode instalasi selain panduan cepat Memulai
    - Anda ingin menerapkan ke platform cloud
    - Anda perlu memperbarui, memigrasikan, atau menghapus instalan
summary: Instal OpenClaw - skrip penginstal, npm/pnpm/bun, dari sumber, Docker, dan lainnya
title: Pasang
x-i18n:
    generated_at: "2026-06-27T17:37:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Persyaratan sistem

- **Node 24** (direkomendasikan) atau Node 22.19+ - skrip penginstal menanganinya secara otomatis
- **macOS, Linux, atau Windows** - pengguna Windows dapat memulai dengan aplikasi Windows Hub native, penginstal CLI PowerShell, atau Gateway WSL2. Lihat [Windows](/id/platforms/windows).
- `pnpm` hanya diperlukan jika Anda membangun dari sumber

## Direkomendasikan: skrip penginstal

Cara tercepat untuk menginstal. Skrip ini mendeteksi OS Anda, menginstal Node jika diperlukan, menginstal OpenClaw, dan menjalankan onboarding.

<Note>
Pengguna desktop Windows juga dapat menginstal aplikasi pendamping native [Windows Hub](/id/platforms/windows#recommended-windows-hub), yang mencakup penyiapan, status tray, chat, mode node, dan mode MCP lokal.
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

Untuk menginstal tanpa menjalankan onboarding:

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

Untuk semua flag dan opsi CI/otomasi, lihat [Internal penginstal](/id/install/installer).

## Metode instalasi alternatif

### Penginstal prefiks lokal (`install-cli.sh`)

Gunakan ini saat Anda ingin OpenClaw dan Node disimpan di bawah prefiks lokal seperti
`~/.openclaw`, tanpa bergantung pada instalasi Node di seluruh sistem:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ini mendukung instalasi npm secara default, ditambah instalasi git-checkout dalam alur
prefiks yang sama. Referensi lengkap: [Internal penginstal](/id/install/installer#install-clish).

Sudah terinstal? Beralih antara instalasi paket dan git dengan
`openclaw update --channel dev` dan `openclaw update --channel stable`. Lihat
[Memperbarui](/id/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm, atau bun

Jika Anda sudah mengelola Node sendiri:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Penginstal hosted menghapus filter kesegaran npm seperti `min-release-age`
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
    pnpm memerlukan persetujuan eksplisit untuk paket dengan skrip build. Jalankan `pnpm approve-builds -g` setelah instalasi pertama.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun didukung untuk jalur instalasi CLI global. Untuk runtime Gateway, Node tetap menjadi runtime daemon yang direkomendasikan.
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

Atau lewati link dan gunakan `pnpm openclaw ...` dari dalam repo. Lihat [Penyiapan](/id/start/setup) untuk alur kerja pengembangan lengkap.

### Instal dari checkout utama GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container dan manajer paket

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="container">
    Deployment berbasis container atau tanpa antarmuka grafis.
  </Card>
  <Card title="Podman" href="/id/install/podman" icon="container">
    Alternatif container rootless untuk Docker.
  </Card>
  <Card title="Nix" href="/id/install/nix" icon="snowflake">
    Instalasi deklaratif melalui Nix flake.
  </Card>
  <Card title="Ansible" href="/id/install/ansible" icon="server">
    Provisioning fleet otomatis.
  </Card>
  <Card title="Bun" href="/id/install/bun" icon="zap">
    Penggunaan khusus CLI melalui runtime Bun.
  </Card>
</CardGroup>

## Verifikasi instalasi

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Jika Anda ingin startup terkelola setelah instalasi:

- macOS: LaunchAgent melalui `openclaw onboard --install-daemon` atau `openclaw gateway install`
- Linux/WSL2: layanan pengguna systemd melalui perintah yang sama
- Windows native: Scheduled Task terlebih dahulu, dengan fallback item login folder Startup per pengguna jika pembuatan tugas ditolak

## Hosting dan deployment

Deploy OpenClaw di server cloud atau VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/id/vps">
    VPS Linux apa pun.
  </Card>
  <Card title="Docker VM" href="/id/install/docker-vm-runtime">
    Langkah Docker bersama.
  </Card>
  <Card title="Kubernetes" href="/id/install/kubernetes">
    Deployment K8s.
  </Card>
  <Card title="Fly.io" href="/id/install/fly">
    Deploy di Fly.io.
  </Card>
  <Card title="Hetzner" href="/id/install/hetzner">
    Deployment Hetzner.
  </Card>
  <Card title="GCP" href="/id/install/gcp">
    Deployment Google Cloud.
  </Card>
  <Card title="Azure" href="/id/install/azure">
    Deployment Azure.
  </Card>
  <Card title="Railway" href="/id/install/railway">
    Deployment Railway.
  </Card>
  <Card title="Render" href="/id/install/render">
    Deployment Render.
  </Card>
  <Card title="Northflank" href="/id/install/northflank">
    Deployment Northflank.
  </Card>
</CardGroup>

## Perbarui, migrasikan, atau hapus instalasi

<CardGroup cols={3}>
  <Card title="Updating" href="/id/install/updating" icon="refresh-cw">
    Selalu perbarui OpenClaw.
  </Card>
  <Card title="Migrating" href="/id/install/migrating" icon="arrow-right">
    Pindah ke mesin baru.
  </Card>
  <Card title="Uninstall" href="/id/install/uninstall" icon="trash-2">
    Hapus OpenClaw sepenuhnya.
  </Card>
</CardGroup>

## Pemecahan masalah: `openclaw` tidak ditemukan

Jika instalasi berhasil tetapi `openclaw` tidak ditemukan di terminal Anda:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Jika `$(npm prefix -g)/bin` tidak ada di `$PATH` Anda, tambahkan ke file startup shell Anda (`~/.zshrc` atau `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Lalu buka terminal baru. Lihat [Penyiapan Node](/id/install/node) untuk detail selengkapnya.

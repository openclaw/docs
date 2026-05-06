---
read_when:
    - Anda memerlukan metode instalasi selain panduan mulai cepat Memulai
    - Anda ingin menerapkan ke platform cloud
    - Anda perlu memperbarui, memigrasikan, atau menghapus instalasi
summary: Instal OpenClaw - skrip penginstal, npm/pnpm/bun, dari kode sumber, Docker, dan lainnya
title: Instal
x-i18n:
    generated_at: "2026-05-06T09:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Persyaratan sistem

- **Node 24** (direkomendasikan) atau Node 22.14+ - skrip penginstal menanganinya secara otomatis
- **macOS, Linux, atau Windows** - Windows native dan WSL2 didukung; WSL2 lebih stabil. Lihat [Windows](/id/platforms/windows).
- `pnpm` hanya diperlukan jika Anda membangun dari source

## Direkomendasikan: skrip penginstal

Cara tercepat untuk menginstal. Ini mendeteksi OS Anda, menginstal Node jika diperlukan, menginstal OpenClaw, dan meluncurkan onboarding.

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

Untuk semua flag dan opsi CI/otomatisasi, lihat [Internal penginstal](/id/install/installer).

## Metode instal alternatif

### Penginstal prefix lokal (`install-cli.sh`)

Gunakan ini ketika Anda ingin OpenClaw dan Node disimpan di bawah prefix lokal seperti
`~/.openclaw`, tanpa bergantung pada instalasi Node di seluruh sistem:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ini mendukung instal npm secara default, plus instal git-checkout di bawah alur
prefix yang sama. Referensi lengkap: [Internal penginstal](/id/install/installer#install-clish).

Sudah terinstal? Beralih antara instal paket dan git dengan
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
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm memerlukan persetujuan eksplisit untuk paket dengan skrip build. Jalankan `pnpm approve-builds -g` setelah instal pertama.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun didukung untuk jalur instal CLI global. Untuk runtime Gateway, Node tetap menjadi runtime daemon yang direkomendasikan.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Pemecahan masalah: error build sharp (npm)">
  Jika `sharp` gagal karena libvips yang terinstal secara global:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Dari source

Untuk kontributor atau siapa pun yang ingin menjalankan dari checkout lokal:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Atau lewati link dan gunakan `pnpm openclaw ...` dari dalam repo. Lihat [Penyiapan](/id/start/setup) untuk alur kerja pengembangan lengkap.

### Instal dari GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container dan manajer paket

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="container">
    Deployment terkontainerisasi atau headless.
  </Card>
  <Card title="Podman" href="/id/install/podman" icon="container">
    Alternatif container rootless untuk Docker.
  </Card>
  <Card title="Nix" href="/id/install/nix" icon="snowflake">
    Instal deklaratif melalui Nix flake.
  </Card>
  <Card title="Ansible" href="/id/install/ansible" icon="server">
    Penyediaan fleet otomatis.
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

Jika Anda menginginkan startup terkelola setelah instalasi:

- macOS: LaunchAgent melalui `openclaw onboard --install-daemon` atau `openclaw gateway install`
- Linux/WSL2: layanan pengguna systemd melalui perintah yang sama
- Windows native: Scheduled Task terlebih dahulu, dengan fallback item login folder Startup per pengguna jika pembuatan task ditolak

## Hosting dan deployment

Deploy OpenClaw di server cloud atau VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/id/vps">VPS Linux apa pun</Card>
  <Card title="Docker VM" href="/id/install/docker-vm-runtime">Langkah Docker bersama</Card>
  <Card title="Kubernetes" href="/id/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/id/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/id/install/azure">Azure</Card>
  <Card title="Railway" href="/id/install/railway">Railway</Card>
  <Card title="Render" href="/id/install/render">Render</Card>
  <Card title="Northflank" href="/id/install/northflank">Northflank</Card>
</CardGroup>

## Perbarui, migrasikan, atau hapus instalasi

<CardGroup cols={3}>
  <Card title="Memperbarui" href="/id/install/updating" icon="refresh-cw">
    Jaga OpenClaw tetap terbaru.
  </Card>
  <Card title="Migrasi" href="/id/install/migrating" icon="arrow-right">
    Pindah ke mesin baru.
  </Card>
  <Card title="Hapus instalasi" href="/id/install/uninstall" icon="trash-2">
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

Kemudian buka terminal baru. Lihat [Penyiapan Node](/id/install/node) untuk detail lebih lanjut.

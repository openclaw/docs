---
read_when:
    - Anda memerlukan metode instalasi selain quickstart Memulai
    - Anda ingin deployment ke platform cloud
    - Anda perlu memperbarui, memigrasikan, atau menghapus instalasi
summary: Instal OpenClaw — skrip installer, npm/pnpm/bun, dari source, Docker, dan lainnya
title: Instal
x-i18n:
    generated_at: "2026-04-24T09:14:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## Persyaratan sistem

- **Node 24** (disarankan) atau Node 22.14+ — skrip installer menangani ini secara otomatis
- **macOS, Linux, atau Windows** — Windows native dan WSL2 didukung; WSL2 lebih stabil. Lihat [Windows](/id/platforms/windows).
- `pnpm` hanya diperlukan jika Anda build dari source

## Disarankan: skrip installer

Cara tercepat untuk menginstal. Skrip ini mendeteksi OS Anda, menginstal Node jika diperlukan, menginstal OpenClaw, dan menjalankan onboarding.

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

Untuk semua flag dan opsi CI/otomasi, lihat [Internal installer](/id/install/installer).

## Metode instalasi alternatif

### Installer prefix lokal (`install-cli.sh`)

Gunakan ini saat Anda ingin OpenClaw dan Node disimpan di bawah prefix lokal seperti
`~/.openclaw`, tanpa bergantung pada instalasi Node seluruh sistem:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Installer ini mendukung instalasi npm secara default, ditambah instalasi checkout git di bawah
alur prefix yang sama. Referensi lengkap: [Internal installer](/id/install/installer#install-clish).

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

Atau lewati link dan gunakan `pnpm openclaw ...` dari dalam repo. Lihat [Setup](/id/start/setup) untuk alur kerja pengembangan lengkap.

### Instal dari GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container dan package manager

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="container">
    Deployment dalam container atau headless.
  </Card>
  <Card title="Podman" href="/id/install/podman" icon="container">
    Alternatif container rootless untuk Docker.
  </Card>
  <Card title="Nix" href="/id/install/nix" icon="snowflake">
    Instalasi deklaratif melalui Nix flake.
  </Card>
  <Card title="Ansible" href="/id/install/ansible" icon="server">
    Provisioning armada otomatis.
  </Card>
  <Card title="Bun" href="/id/install/bun" icon="zap">
    Penggunaan hanya CLI melalui runtime Bun.
  </Card>
</CardGroup>

## Verifikasi instalasi

```bash
openclaw --version      # konfirmasi CLI tersedia
openclaw doctor         # periksa masalah konfigurasi
openclaw gateway status # verifikasi Gateway berjalan
```

Jika Anda menginginkan startup terkelola setelah instalasi:

- macOS: LaunchAgent melalui `openclaw onboard --install-daemon` atau `openclaw gateway install`
- Linux/WSL2: service systemd user melalui perintah yang sama
- Windows native: Scheduled Task terlebih dahulu, dengan fallback item login Startup-folder per pengguna jika pembuatan task ditolak

## Hosting dan deployment

Deployment OpenClaw di server cloud atau VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/id/vps">Linux VPS apa pun</Card>
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
    Jaga OpenClaw tetap mutakhir.
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
node -v           # Node terinstal?
npm prefix -g     # Paket global ada di mana?
echo "$PATH"      # Apakah direktori bin global ada di PATH?
```

Jika `$(npm prefix -g)/bin` tidak ada di `$PATH` Anda, tambahkan ke file startup shell Anda (`~/.zshrc` atau `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Lalu buka terminal baru. Lihat [Setup Node](/id/install/node) untuk detail lebih lanjut.

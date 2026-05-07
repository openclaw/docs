---
read_when:
    - Anda memerlukan metode instalasi selain panduan mulai cepat Memulai
    - Anda ingin menerapkan ke platform awan
    - Anda perlu memperbarui, memigrasikan, atau menghapus instalasi
summary: Instal OpenClaw - skrip penginstal, npm/pnpm/bun, dari kode sumber, Docker, dan lainnya
title: Instal
x-i18n:
    generated_at: "2026-05-07T13:20:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## Persyaratan sistem

- **Node 24** (direkomendasikan) atau Node 22.16+ - skrip penginstal menanganinya secara otomatis
- **macOS, Linux, atau Windows** - Windows native dan WSL2 didukung; WSL2 lebih stabil. Lihat [Windows](/id/platforms/windows).
- `pnpm` hanya diperlukan jika Anda membangun dari sumber

## Direkomendasikan: skrip penginstal

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

Untuk semua flag dan opsi CI/otomasi, lihat [Internal penginstal](/id/install/installer).

## Metode instalasi alternatif

### Penginstal prefiks lokal (`install-cli.sh`)

Gunakan ini saat Anda ingin OpenClaw dan Node disimpan di bawah prefiks lokal seperti
`~/.openclaw`, tanpa bergantung pada instalasi Node tingkat sistem:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Penginstal ini mendukung instalasi npm secara default, ditambah instalasi git-checkout di bawah alur prefiks yang sama. Referensi lengkap: [Internal penginstal](/id/install/installer#install-clish).

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

<Accordion title="Pemecahan masalah: kesalahan build sharp (npm)">
  Jika `sharp` gagal karena libvips yang terinstal secara global:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

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

### Instal dari GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Container dan manajer paket

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="container">
    Deployment ter-container atau headless.
  </Card>
  <Card title="Podman" href="/id/install/podman" icon="container">
    Alternatif container rootless untuk Docker.
  </Card>
  <Card title="Nix" href="/id/install/nix" icon="snowflake">
    Instalasi deklaratif melalui Nix flake.
  </Card>
  <Card title="Ansible" href="/id/install/ansible" icon="server">
    Penyediaan fleet otomatis.
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

Jika Anda ingin startup terkelola setelah instalasi:

- macOS: LaunchAgent melalui `openclaw onboard --install-daemon` atau `openclaw gateway install`
- Linux/WSL2: layanan pengguna systemd melalui perintah yang sama
- Windows native: Scheduled Task terlebih dahulu, dengan fallback item login folder Startup per pengguna jika pembuatan tugas ditolak

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
  <Card title="Bermigrasi" href="/id/install/migrating" icon="arrow-right">
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
npm prefix -g     # Di mana paket global berada?
echo "$PATH"      # Apakah direktori bin global ada di PATH?
```

Jika `$(npm prefix -g)/bin` tidak ada di `$PATH` Anda, tambahkan ke file startup shell Anda (`~/.zshrc` atau `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Lalu buka terminal baru. Lihat [Penyiapan Node](/id/install/node) untuk detail lebih lanjut.

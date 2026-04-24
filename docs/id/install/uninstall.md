---
read_when:
    - Anda ingin menghapus OpenClaw dari sebuah mesin
    - Layanan gateway masih berjalan setelah copot pemasangan
summary: Copot OpenClaw sepenuhnya (CLI, layanan, status, workspace)
title: Copot pemasangan
x-i18n:
    generated_at: "2026-04-24T09:14:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Dua jalur:

- **Jalur mudah** jika `openclaw` masih terinstal.
- **Penghapusan layanan manual** jika CLI sudah hilang tetapi layanannya masih berjalan.

## Jalur mudah (CLI masih terinstal)

Direkomendasikan: gunakan uninstaller bawaan:

```bash
openclaw uninstall
```

Non-interaktif (otomasi / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Langkah manual (hasilnya sama):

1. Hentikan layanan gateway:

```bash
openclaw gateway stop
```

2. Copot layanan gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Hapus status + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jika Anda menyetel `OPENCLAW_CONFIG_PATH` ke lokasi kustom di luar direktori status, hapus file itu juga.

4. Hapus workspace Anda (opsional, menghapus file agen):

```bash
rm -rf ~/.openclaw/workspace
```

5. Hapus instalasi CLI (pilih yang Anda gunakan):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Jika Anda menginstal aplikasi macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Catatan:

- Jika Anda menggunakan profile (`--profile` / `OPENCLAW_PROFILE`), ulangi langkah 3 untuk setiap direktori status (default-nya `~/.openclaw-<profile>`).
- Dalam mode remote, direktori status berada di **host gateway**, jadi jalankan langkah 1-4 di sana juga.

## Penghapusan layanan manual (CLI tidak terinstal)

Gunakan ini jika layanan gateway tetap berjalan tetapi `openclaw` hilang.

### macOS (launchd)

Label default adalah `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin masih ada):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jika Anda menggunakan profile, ganti label dan nama plist dengan `ai.openclaw.<profile>`. Hapus semua plist `com.openclaw.*` lama jika ada.

### Linux (unit pengguna systemd)

Nama unit default adalah `openclaw-gateway.service` (atau `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Nama task default adalah `OpenClaw Gateway` (atau `OpenClaw Gateway (<profile>)`).
Skrip task berada di bawah direktori status Anda.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Jika Anda menggunakan profile, hapus nama task yang cocok dan `~\.openclaw-<profile>\gateway.cmd`.

## Instalasi normal vs checkout source

### Instalasi normal (install.sh / npm / pnpm / bun)

Jika Anda menggunakan `https://openclaw.ai/install.sh` atau `install.ps1`, CLI diinstal dengan `npm install -g openclaw@latest`.
Hapus dengan `npm rm -g openclaw` (atau `pnpm remove -g` / `bun remove -g` jika Anda menginstalnya dengan cara itu).

### Checkout source (git clone)

Jika Anda menjalankan dari checkout repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Copot layanan gateway **sebelum** menghapus repo (gunakan jalur mudah di atas atau penghapusan layanan manual).
2. Hapus direktori repo.
3. Hapus status + workspace seperti ditunjukkan di atas.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Panduan migrasi](/id/install/migrating)

---
read_when:
    - Anda ingin menghapus OpenClaw dari sebuah mesin
    - Layanan gateway masih berjalan setelah uninstall
summary: Copot OpenClaw sepenuhnya (CLI, layanan, state, workspace)
title: Uninstall
x-i18n:
    generated_at: "2026-04-05T13:58:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Uninstall

Ada dua jalur:

- **Jalur mudah** jika `openclaw` masih terinstal.
- **Penghapusan layanan manual** jika CLI sudah hilang tetapi layanan masih berjalan.

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

2. Uninstall layanan gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Hapus state + konfigurasi:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jika Anda menetapkan `OPENCLAW_CONFIG_PATH` ke lokasi kustom di luar direktori state, hapus file itu juga.

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

- Jika Anda menggunakan profile (`--profile` / `OPENCLAW_PROFILE`), ulangi langkah 3 untuk setiap direktori state (default-nya `~/.openclaw-<profile>`).
- Dalam mode remote, direktori state berada di **host gateway**, jadi jalankan langkah 1-4 di sana juga.

## Penghapusan layanan manual (CLI tidak terinstal)

Gunakan ini jika layanan gateway tetap berjalan tetapi `openclaw` tidak ada.

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
Script task berada di bawah direktori state Anda.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Jika Anda menggunakan profile, hapus nama task yang sesuai dan `~\.openclaw-<profile>\gateway.cmd`.

## Instalasi normal vs source checkout

### Instalasi normal (install.sh / npm / pnpm / bun)

Jika Anda menggunakan `https://openclaw.ai/install.sh` atau `install.ps1`, CLI diinstal dengan `npm install -g openclaw@latest`.
Hapus dengan `npm rm -g openclaw` (atau `pnpm remove -g` / `bun remove -g` jika Anda menginstalnya dengan cara itu).

### Source checkout (git clone)

Jika Anda menjalankan dari checkout repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Uninstall layanan gateway **sebelum** menghapus repo (gunakan jalur mudah di atas atau penghapusan layanan manual).
2. Hapus direktori repo.
3. Hapus state + workspace seperti ditunjukkan di atas.

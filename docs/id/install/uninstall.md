---
read_when:
    - Anda ingin menghapus OpenClaw dari sebuah mesin
    - Layanan gateway masih berjalan setelah penghapusan instalasi
summary: Hapus instalasi OpenClaw sepenuhnya (CLI, layanan, status, ruang kerja)
title: Copot pemasangan
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Dua jalur:

- **Jalur mudah** jika `openclaw` masih terpasang.
- **Penghapusan layanan manual** jika CLI sudah hilang tetapi layanan masih berjalan.

## Jalur mudah (CLI masih terpasang)

Direkomendasikan: gunakan pencopot bawaan:

```bash
openclaw uninstall
```

Saat menggunakan CLI, penghapusan keadaan mempertahankan direktori ruang kerja yang dikonfigurasi kecuali Anda juga memilih `--workspace`.

Pratinjau apa yang akan dihapus (aman):

```bash
openclaw uninstall --dry-run --all
```

Non-interaktif (otomasi / npx). Gunakan dengan hati-hati dan hanya setelah memastikan cakupan:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Langkah manual (hasil yang sama):

1. Hentikan layanan Gateway:

```bash
openclaw gateway stop
```

2. Copot layanan Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Hapus keadaan + konfigurasi:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jika Anda mengatur `OPENCLAW_CONFIG_PATH` ke lokasi khusus di luar direktori keadaan, hapus juga file tersebut.
Jika Anda ingin mempertahankan ruang kerja di dalam direktori keadaan, seperti `~/.openclaw/workspace`, pindahkan terlebih dahulu sebelum menjalankan `rm -rf` atau hapus isi keadaan secara selektif.

4. Hapus ruang kerja Anda (opsional, menghapus file agen):

```bash
rm -rf ~/.openclaw/workspace
```

5. Hapus instalasi CLI (pilih yang Anda gunakan):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Jika Anda memasang aplikasi macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Catatan:

- Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), ulangi langkah 3 untuk setiap direktori keadaan (defaultnya adalah `~/.openclaw-<profile>`).
- Dalam mode jarak jauh, direktori keadaan berada di **host Gateway**, jadi jalankan juga langkah 1-4 di sana.

## Penghapusan layanan manual (CLI tidak terpasang)

Gunakan ini jika layanan Gateway tetap berjalan tetapi `openclaw` tidak ada.

### macOS (launchd)

Label default adalah `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; legacy `com.openclaw.*` mungkin masih ada):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jika Anda menggunakan profil, ganti label dan nama plist dengan `ai.openclaw.<profile>`. Hapus plist legacy `com.openclaw.*` apa pun jika ada.

### Linux (unit pengguna systemd)

Nama unit default adalah `openclaw-gateway.service` (atau `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Nama tugas default adalah `OpenClaw Gateway` (atau `OpenClaw Gateway (<profile>)`).
Skrip tugas berada di bawah direktori keadaan Anda sebagai `gateway.cmd`; instalasi saat ini juga dapat membuat peluncur tanpa jendela `gateway.vbs` yang dijalankan oleh Task Scheduler alih-alih membuka `gateway.cmd` secara langsung.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Jika Anda menggunakan profil, hapus nama tugas yang sesuai dan file `gateway.cmd` /
`gateway.vbs` di bawah `~\.openclaw-<profile>`.

## Instalasi normal vs checkout kode sumber

### Instalasi normal (install.sh / npm / pnpm / bun)

Jika Anda menggunakan `https://openclaw.ai/install.sh` atau `install.ps1`, CLI dipasang dengan `npm install -g openclaw@latest`.
Hapus dengan `npm rm -g openclaw` (atau `pnpm remove -g` / `bun remove -g` jika Anda memasangnya dengan cara itu).

### Checkout kode sumber (git clone)

Jika Anda menjalankan dari checkout repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Copot layanan Gateway **sebelum** menghapus repo (gunakan jalur mudah di atas atau penghapusan layanan manual).
2. Hapus direktori repo.
3. Hapus keadaan + ruang kerja seperti yang ditunjukkan di atas.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Panduan migrasi](/id/install/migrating)

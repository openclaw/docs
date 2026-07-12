---
read_when:
    - Anda ingin menghapus OpenClaw dari sebuah mesin
    - Layanan Gateway masih berjalan setelah penghapusan instalasi
summary: Hapus instalasi OpenClaw sepenuhnya (CLI, layanan, status, ruang kerja)
title: Copot pemasangan
x-i18n:
    generated_at: "2026-07-12T14:20:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Dua cara:

- **Cara mudah** jika `openclaw` masih terinstal.
- **Penghapusan layanan secara manual** jika CLI sudah tidak ada tetapi layanan masih berjalan.

## Cara mudah (CLI masih terinstal)

Disarankan: gunakan penghapus instalasi bawaan:

```bash
openclaw uninstall
```

Penghapusan status mempertahankan direktori ruang kerja yang dikonfigurasi, kecuali jika Anda juga memilih `--workspace`.

Pratinjau apa yang akan dihapus (aman):

```bash
openclaw uninstall --dry-run --all
```

Noninteraktif (otomatisasi / npx). Gunakan dengan hati-hati dan hanya setelah mengonfirmasi cakupannya:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flag: `--service`, `--state`, `--workspace`, dan `--app` memilih cakupan individual; `--all` memilih keempatnya.

Langkah manual (hasil yang sama):

1. Hentikan layanan Gateway:

```bash
openclaw gateway stop
```

2. Hapus instalasi layanan Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Hapus status + konfigurasi:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Jika Anda menetapkan `OPENCLAW_CONFIG_PATH` ke lokasi khusus di luar direktori status, hapus juga berkas tersebut.
Jika Anda ingin mempertahankan ruang kerja di dalam direktori status, seperti `~/.openclaw/workspace`, pindahkan ke tempat lain sebelum menjalankan `rm -rf` atau hapus isi direktori status secara selektif.

4. Hapus ruang kerja Anda (opsional, menghapus berkas agen):

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

- Jika Anda menggunakan profil (`--profile` / `OPENCLAW_PROFILE`), ulangi langkah 3 untuk setiap direktori status (nilai bawaannya adalah `~/.openclaw-<profile>`).
- Dalam mode jarak jauh, direktori status berada di **host Gateway**, jadi jalankan juga langkah 1–4 di sana.

## Penghapusan layanan secara manual (CLI tidak terinstal)

Gunakan cara ini jika layanan Gateway tetap berjalan, tetapi `openclaw` tidak ditemukan.

### macOS (launchd)

Label bawaannya adalah `ai.openclaw.gateway` (atau `ai.openclaw.<profile>` jika menggunakan profil):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Jika Anda menggunakan profil, ganti label dan nama plist dengan `ai.openclaw.<profile>`.

### Linux (unit pengguna systemd)

Nama unit bawaannya adalah `openclaw-gateway.service` (atau `openclaw-gateway-<profile>.service`). Unit lama sebelum penggantian nama, `clawdbot-gateway.service`, mungkin masih ada pada mesin yang ditingkatkan dari instalasi yang sangat lama; `openclaw uninstall` / `openclaw gateway uninstall` mendeteksi dan menghapusnya secara otomatis.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Tugas Terjadwal)

Nama tugas bawaannya adalah `OpenClaw Gateway` (atau `OpenClaw Gateway (<profile>)`).
Tugas tersebut menjalankan skrip `gateway.vbs` tanpa jendela di dalam direktori status Anda, yang kemudian
menjalankan `gateway.cmd`; hapus keduanya.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Jika Anda menggunakan profil, hapus nama tugas yang sesuai serta berkas `gateway.cmd` /
`gateway.vbs` di dalam `~\.openclaw-<profile>`.

## Instalasi normal vs salinan kerja sumber

### Instalasi normal (install.sh / npm / pnpm / bun)

Jika Anda menggunakan `https://openclaw.ai/install.sh` atau `install.ps1`, CLI diinstal dengan `npm install -g openclaw@latest`.
Hapus dengan `npm rm -g openclaw` (atau `pnpm remove -g` / `bun remove -g` jika Anda menginstalnya dengan cara tersebut).

### Salinan kerja sumber (git clone)

Jika Anda menjalankannya dari salinan kerja repositori (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Hapus instalasi layanan Gateway **sebelum** menghapus repositori (gunakan cara mudah di atas atau penghapusan layanan secara manual).
2. Hapus direktori repositori.
3. Hapus status + ruang kerja seperti yang ditunjukkan di atas.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Panduan migrasi](/id/install/migrating)

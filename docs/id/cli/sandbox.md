---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Kelola runtime sandbox dan periksa kebijakan sandbox efektif
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-05T13:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI Sandbox

Kelola runtime sandbox untuk eksekusi agen yang terisolasi.

## Gambaran umum

OpenClaw dapat menjalankan agen dalam runtime sandbox yang terisolasi untuk keamanan. Perintah `sandbox` membantu Anda memeriksa dan membuat ulang runtime tersebut setelah pembaruan atau perubahan konfigurasi.

Saat ini, biasanya ini berarti:

- Kontainer sandbox Docker
- Runtime sandbox SSH saat `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell saat `agents.defaults.sandbox.backend = "openshell"`

Untuk `ssh` dan OpenShell `remote`, pembuatan ulang lebih penting dibandingkan dengan Docker:

- workspace remote menjadi kanonis setelah seed awal
- `openclaw sandbox recreate` menghapus workspace remote kanonis tersebut untuk cakupan yang dipilih
- penggunaan berikutnya melakukan seed ulang dari workspace lokal saat ini

## Perintah

### `openclaw sandbox explain`

Periksa mode/cakupan/akses workspace sandbox yang **efektif**, kebijakan alat sandbox, dan gerbang elevasi (dengan path kunci konfigurasi fix-it).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Daftarkan semua runtime sandbox beserta status dan konfigurasinya.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Daftarkan hanya kontainer browser
openclaw sandbox list --json     # Output JSON
```

**Output mencakup:**

- Nama runtime dan status
- Backend (`docker`, `openshell`, dll.)
- Label konfigurasi dan apakah cocok dengan konfigurasi saat ini
- Usia (waktu sejak dibuat)
- Waktu idle (waktu sejak terakhir digunakan)
- Sesi/agen terkait

### `openclaw sandbox recreate`

Hapus runtime sandbox untuk memaksa pembuatan ulang dengan konfigurasi yang diperbarui.

```bash
openclaw sandbox recreate --all                # Buat ulang semua kontainer
openclaw sandbox recreate --session main       # Sesi tertentu
openclaw sandbox recreate --agent mybot        # Agen tertentu
openclaw sandbox recreate --browser            # Hanya kontainer browser
openclaw sandbox recreate --all --force        # Lewati konfirmasi
```

**Opsi:**

- `--all`: Buat ulang semua kontainer sandbox
- `--session <key>`: Buat ulang kontainer untuk sesi tertentu
- `--agent <id>`: Buat ulang kontainer untuk agen tertentu
- `--browser`: Buat ulang hanya kontainer browser
- `--force`: Lewati prompt konfirmasi

**Penting:** Runtime dibuat ulang secara otomatis saat agen berikutnya digunakan.

## Kasus penggunaan

### Setelah memperbarui image Docker

```bash
# Tarik image baru
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Perbarui konfigurasi untuk menggunakan image baru
# Edit konfigurasi: agents.defaults.sandbox.docker.image (atau agents.list[].sandbox.docker.image)

# Buat ulang kontainer
openclaw sandbox recreate --all
```

### Setelah mengubah konfigurasi sandbox

```bash
# Edit konfigurasi: agents.defaults.sandbox.* (atau agents.list[].sandbox.*)

# Buat ulang untuk menerapkan konfigurasi baru
openclaw sandbox recreate --all
```

### Setelah mengubah target SSH atau materi autentikasi SSH

```bash
# Edit konfigurasi:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Untuk backend inti `ssh`, pembuatan ulang menghapus root workspace remote per cakupan
pada target SSH. Eksekusi berikutnya akan melakukan seed ulang dari workspace lokal.

### Setelah mengubah sumber, kebijakan, atau mode OpenShell

```bash
# Edit konfigurasi:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Untuk mode OpenShell `remote`, pembuatan ulang menghapus workspace remote kanonis
untuk cakupan tersebut. Eksekusi berikutnya akan melakukan seed ulang dari workspace lokal.

### Setelah mengubah setupCommand

```bash
openclaw sandbox recreate --all
# atau hanya satu agen:
openclaw sandbox recreate --agent family
```

### Hanya untuk agen tertentu

```bash
# Perbarui kontainer hanya untuk satu agen
openclaw sandbox recreate --agent alfred
```

## Mengapa ini diperlukan?

**Masalah:** Saat Anda memperbarui konfigurasi sandbox:

- Runtime yang ada terus berjalan dengan pengaturan lama
- Runtime hanya dipangkas setelah 24 jam tidak aktif
- Agen yang digunakan secara rutin membuat runtime lama tetap hidup tanpa batas waktu

**Solusi:** Gunakan `openclaw sandbox recreate` untuk memaksa penghapusan runtime lama. Runtime tersebut akan dibuat ulang secara otomatis dengan pengaturan saat ini ketika berikutnya diperlukan.

Tips: lebih baik gunakan `openclaw sandbox recreate` daripada pembersihan manual yang khusus backend.
Perintah ini menggunakan registri runtime Gateway dan menghindari ketidakcocokan saat kunci cakupan/sesi berubah.

## Konfigurasi

Pengaturan sandbox berada di `~/.openclaw/openclaw.json` di bawah `agents.defaults.sandbox` (override per agen berada di `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... lebih banyak opsi Docker
        },
        "prune": {
          "idleHours": 24, // Pangkas otomatis setelah idle 24 jam
          "maxAgeDays": 7, // Pangkas otomatis setelah 7 hari
        },
      },
    },
  },
}
```

## Lihat juga

- [Dokumentasi Sandbox](/gateway/sandboxing)
- [Konfigurasi Agen](/concepts/agent-workspace)
- [Perintah Doctor](/gateway/doctor) - Periksa penyiapan sandbox

---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Kelola runtime sandbox dan periksa kebijakan sandbox efektif
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-24T09:02:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Kelola runtime sandbox untuk eksekusi agen yang terisolasi.

## Ikhtisar

OpenClaw dapat menjalankan agen dalam runtime sandbox terisolasi untuk keamanan. Perintah `sandbox` membantu Anda memeriksa dan membuat ulang runtime tersebut setelah pembaruan atau perubahan konfigurasi.

Saat ini biasanya berarti:

- Container sandbox Docker
- Runtime sandbox SSH saat `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell saat `agents.defaults.sandbox.backend = "openshell"`

Untuk `ssh` dan `remote` OpenShell, pembuatan ulang lebih penting dibanding Docker:

- workspace remote menjadi kanonis setelah seed awal
- `openclaw sandbox recreate` menghapus workspace remote kanonis tersebut untuk scope yang dipilih
- penggunaan berikutnya akan melakukan seed ulang dari workspace lokal saat ini

## Perintah

### `openclaw sandbox explain`

Periksa mode/scope/akses workspace sandbox yang **efektif**, kebijakan alat sandbox, dan gerbang elevated (beserta path kunci config untuk perbaikan).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Daftar semua runtime sandbox beserta status dan konfigurasinya.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Hanya daftarkan container browser
openclaw sandbox list --json     # Output JSON
```

**Output mencakup:**

- Nama dan status runtime
- Backend (`docker`, `openshell`, dll.)
- Label config dan apakah cocok dengan config saat ini
- Usia (waktu sejak dibuat)
- Waktu idle (waktu sejak terakhir digunakan)
- Sesi/agen terkait

### `openclaw sandbox recreate`

Hapus runtime sandbox untuk memaksa pembuatan ulang dengan config yang diperbarui.

```bash
openclaw sandbox recreate --all                # Buat ulang semua container
openclaw sandbox recreate --session main       # Sesi tertentu
openclaw sandbox recreate --agent mybot        # Agen tertentu
openclaw sandbox recreate --browser            # Hanya container browser
openclaw sandbox recreate --all --force        # Lewati konfirmasi
```

**Opsi:**

- `--all`: Buat ulang semua container sandbox
- `--session <key>`: Buat ulang container untuk sesi tertentu
- `--agent <id>`: Buat ulang container untuk agen tertentu
- `--browser`: Hanya buat ulang container browser
- `--force`: Lewati prompt konfirmasi

**Penting:** Runtime dibuat ulang secara otomatis saat agen digunakan berikutnya.

## Kasus penggunaan

### Setelah memperbarui image Docker

```bash
# Tarik image baru
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Perbarui config untuk menggunakan image baru
# Edit config: agents.defaults.sandbox.docker.image (atau agents.list[].sandbox.docker.image)

# Buat ulang container
openclaw sandbox recreate --all
```

### Setelah mengubah konfigurasi sandbox

```bash
# Edit config: agents.defaults.sandbox.* (atau agents.list[].sandbox.*)

# Buat ulang untuk menerapkan config baru
openclaw sandbox recreate --all
```

### Setelah mengubah target SSH atau materi auth SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Untuk backend inti `ssh`, recreate menghapus root workspace remote per-scope
pada target SSH. Run berikutnya akan melakukan seed ulang dari workspace lokal.

### Setelah mengubah source, kebijakan, atau mode OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Untuk mode `remote` OpenShell, recreate menghapus workspace remote kanonis
untuk scope tersebut. Run berikutnya akan melakukan seed ulang dari workspace lokal.

### Setelah mengubah setupCommand

```bash
openclaw sandbox recreate --all
# atau hanya satu agen:
openclaw sandbox recreate --agent family
```

### Hanya untuk agen tertentu

```bash
# Perbarui container hanya untuk satu agen
openclaw sandbox recreate --agent alfred
```

## Mengapa ini diperlukan?

**Masalah:** Saat Anda memperbarui konfigurasi sandbox:

- Runtime yang ada tetap berjalan dengan pengaturan lama
- Runtime hanya dipangkas setelah 24 jam tidak aktif
- Agen yang sering digunakan membuat runtime lama tetap hidup tanpa batas

**Solusi:** Gunakan `openclaw sandbox recreate` untuk memaksa penghapusan runtime lama. Runtime akan dibuat ulang secara otomatis dengan pengaturan saat ini ketika berikutnya diperlukan.

Tip: pilih `openclaw sandbox recreate` daripada pembersihan manual khusus backend.
Perintah ini menggunakan registry runtime Gateway dan menghindari ketidakcocokan saat kunci scope/sesi berubah.

## Konfigurasi

Pengaturan sandbox berada di `~/.openclaw/openclaw.json` di bawah `agents.defaults.sandbox` (override per-agen berada di `agents.list[].sandbox`):

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
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Terkait

- [Referensi CLI](/id/cli)
- [Sandboxing](/id/gateway/sandboxing)
- [Workspace agen](/id/concepts/agent-workspace)
- [Doctor](/id/gateway/doctor) — memeriksa penyiapan sandbox

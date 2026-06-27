---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Kelola runtime sandbox dan periksa kebijakan sandbox yang berlaku
title: CLI Sandbox
x-i18n:
    generated_at: "2026-06-27T17:20:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Kelola runtime sandbox untuk eksekusi agen yang terisolasi.

## Ikhtisar

OpenClaw dapat menjalankan agen dalam runtime sandbox terisolasi demi keamanan. Perintah `sandbox` membantu Anda memeriksa dan membuat ulang runtime tersebut setelah pembaruan atau perubahan konfigurasi.

Saat ini biasanya berarti:

- Kontainer sandbox Docker
- Runtime sandbox SSH saat `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell saat `agents.defaults.sandbox.backend = "openshell"`

Untuk `ssh` dan OpenShell `remote`, membuat ulang lebih penting dibandingkan dengan Docker:

- workspace jarak jauh menjadi kanonis setelah seed awal
- `openclaw sandbox recreate` menghapus workspace jarak jauh kanonis tersebut untuk cakupan yang dipilih
- penggunaan berikutnya melakukan seed lagi dari workspace lokal saat ini

## Perintah

### `openclaw sandbox explain`

Periksa mode/cakupan/akses workspace sandbox yang **efektif**, kebijakan alat sandbox, dan gerbang elevasi (dengan jalur kunci konfigurasi untuk perbaikan).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Cantumkan semua runtime sandbox beserta status dan konfigurasinya.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Cantumkan hanya kontainer browser
openclaw sandbox list --json     # Output JSON
```

**Output mencakup:**

- Nama dan status runtime
- Backend (`docker`, `openshell`, dll.)
- Label konfigurasi dan apakah cocok dengan konfigurasi saat ini
- Usia (waktu sejak dibuat)
- Waktu menganggur (waktu sejak terakhir digunakan)
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
- `--browser`: Hanya buat ulang kontainer browser
- `--force`: Lewati prompt konfirmasi

<Note>
Runtime otomatis dibuat ulang saat agen berikutnya digunakan.
</Note>

## Kasus penggunaan

### Setelah memperbarui image Docker

```bash
# Pull image baru
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

### Setelah mengubah target SSH atau materi auth SSH

```bash
# Edit konfigurasi:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Untuk backend inti `ssh`, pembuatan ulang menghapus root workspace jarak jauh per cakupan
pada target SSH. Run berikutnya melakukan seed lagi dari workspace lokal.

### Setelah mengubah sumber, kebijakan, atau mode OpenShell

```bash
# Edit konfigurasi:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Untuk mode OpenShell `remote`, pembuatan ulang menghapus workspace jarak jauh kanonis
untuk cakupan tersebut. Run berikutnya melakukan seed lagi dari workspace lokal.

### Setelah mengubah setupCommand

```bash
openclaw sandbox recreate --all
# atau hanya satu agen:
openclaw sandbox recreate --agent family
```

### Hanya untuk agen tertentu

```bash
# Perbarui hanya kontainer milik satu agen
openclaw sandbox recreate --agent alfred
```

## Mengapa ini diperlukan

Saat Anda memperbarui konfigurasi sandbox:

- Runtime yang ada terus berjalan dengan pengaturan lama.
- Runtime hanya dipangkas setelah 24 jam tidak aktif.
- Agen yang digunakan secara rutin mempertahankan runtime lama tetap hidup tanpa batas.

Gunakan `openclaw sandbox recreate` untuk memaksa penghapusan runtime lama. Runtime tersebut dibuat ulang otomatis dengan pengaturan saat ini saat berikutnya diperlukan.

<Tip>
Lebih pilih `openclaw sandbox recreate` daripada pembersihan manual khusus backend. Perintah ini menggunakan registri runtime milik Gateway dan menghindari ketidaksesuaian saat cakupan atau kunci sesi berubah.
</Tip>

## Migrasi registri

OpenClaw menyimpan metadata runtime sandbox dalam basis data status SQLite bersama. Instalasi lama mungkin masih memiliki file registri sandbox legacy:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Beberapa upgrade juga mungkin memiliki satu shard JSON per kontainer/browser di bawah `~/.openclaw/sandbox/containers/` atau `~/.openclaw/sandbox/browsers/`. Pembacaan runtime sandbox biasa tidak menulis ulang sumber legacy tersebut. Jalankan `openclaw doctor --fix` untuk memigrasikan entri legacy yang valid ke SQLite. File legacy yang tidak valid dikarantina sehingga satu registri lama yang rusak tidak dapat menyembunyikan entri runtime saat ini.

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
- [Doctor](/id/gateway/doctor): memeriksa penyiapan sandbox.

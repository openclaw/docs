---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Kelola runtime sandbox dan periksa kebijakan sandbox yang berlaku
title: CLI Kotak Pasir
x-i18n:
    generated_at: "2026-05-03T21:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Kelola runtime sandbox untuk eksekusi agen yang terisolasi.

## Ringkasan

OpenClaw dapat menjalankan agen dalam runtime sandbox terisolasi untuk keamanan. Perintah `sandbox` membantu Anda memeriksa dan membuat ulang runtime tersebut setelah pembaruan atau perubahan konfigurasi.

Saat ini biasanya berarti:

- Kontainer sandbox Docker
- Runtime sandbox SSH saat `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell saat `agents.defaults.sandbox.backend = "openshell"`

Untuk `ssh` dan OpenShell `remote`, pembuatan ulang lebih penting dibandingkan dengan Docker:

- workspace jarak jauh menjadi kanonis setelah seed awal
- `openclaw sandbox recreate` menghapus workspace jarak jauh kanonis tersebut untuk cakupan yang dipilih
- penggunaan berikutnya melakukan seed ulang dari workspace lokal saat ini

## Perintah

### `openclaw sandbox explain`

Periksa mode/cakupan/akses workspace sandbox **efektif**, kebijakan tool sandbox, dan gate yang ditinggikan (dengan jalur kunci konfigurasi untuk perbaikan).

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
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
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
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opsi:**

- `--all`: Buat ulang semua kontainer sandbox
- `--session <key>`: Buat ulang kontainer untuk sesi tertentu
- `--agent <id>`: Buat ulang kontainer untuk agen tertentu
- `--browser`: Hanya buat ulang kontainer browser
- `--force`: Lewati prompt konfirmasi

<Note>
Runtime dibuat ulang secara otomatis saat agen berikutnya digunakan.
</Note>

## Kasus penggunaan

### Setelah memperbarui image Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Setelah mengubah konfigurasi sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
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

Untuk backend inti `ssh`, pembuatan ulang menghapus root workspace jarak jauh per cakupan
pada target SSH. Run berikutnya melakukan seed ulang dari workspace lokal.

### Setelah mengubah sumber, kebijakan, atau mode OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Untuk mode OpenShell `remote`, pembuatan ulang menghapus workspace jarak jauh kanonis
untuk cakupan tersebut. Run berikutnya melakukan seed ulang dari workspace lokal.

### Setelah mengubah setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Hanya untuk agen tertentu

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Mengapa ini diperlukan

Saat Anda memperbarui konfigurasi sandbox:

- Runtime yang ada tetap berjalan dengan pengaturan lama.
- Runtime hanya dipangkas setelah 24 jam tidak aktif.
- Agen yang digunakan secara rutin mempertahankan runtime lama tanpa batas.

Gunakan `openclaw sandbox recreate` untuk memaksa penghapusan runtime lama. Runtime tersebut dibuat ulang secara otomatis dengan pengaturan saat ini saat berikutnya dibutuhkan.

<Tip>
Lebih baik gunakan `openclaw sandbox recreate` daripada pembersihan manual yang spesifik untuk backend. Perintah ini menggunakan registry runtime Gateway dan menghindari ketidakcocokan saat cakupan atau kunci sesi berubah.
</Tip>

## Migrasi registry

OpenClaw menyimpan metadata runtime sandbox sebagai satu shard JSON per entri kontainer/browser di bawah direktori status sandbox. Instalasi lama mungkin masih memiliki file legacy monolitik:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Pembacaan runtime sandbox reguler tidak menulis ulang file tersebut. Jalankan `openclaw doctor --fix` untuk memigrasikan entri legacy yang valid ke direktori registry bershard. File legacy yang tidak valid dikarantina sehingga satu registry lama yang buruk tidak dapat menyembunyikan entri runtime saat ini.

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
- [Doctor](/id/gateway/doctor): memeriksa setup sandbox.

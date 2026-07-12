---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Kelola runtime sandbox dan periksa kebijakan sandbox yang berlaku
title: Sandbox CLI
x-i18n:
    generated_at: "2026-07-12T14:06:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Kelola runtime sandbox untuk eksekusi agen yang terisolasi: kontainer Docker, target SSH, atau backend OpenShell.

## Perintah

### `openclaw sandbox list`

Cantumkan runtime sandbox beserta status, backend, kecocokan konfigurasi, usia, waktu menganggur, dan sesi/agen terkait.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # hanya kontainer peramban
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Hapus runtime sandbox untuk memaksanya dibuat ulang dengan konfigurasi saat ini. Runtime dibuat ulang secara otomatis saat agen digunakan berikutnya.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # mencakup subsesi agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # hanya kontainer peramban
openclaw sandbox recreate --all --force        # lewati konfirmasi
```

Opsi:

- `--all`: buat ulang semua kontainer sandbox
- `--session <key>`: buat ulang runtime dengan kunci cakupan persis ini (seperti yang ditampilkan oleh `sandbox list`); tanpa perluasan nama pendek
- `--agent <id>`: buat ulang runtime untuk satu agen (cocok dengan `agent:<id>` dan `agent:<id>:*`)
- `--browser`: hanya memengaruhi kontainer peramban
- `--force`: lewati permintaan konfirmasi

Berikan tepat satu dari `--all`, `--session`, atau `--agent`.

Untuk `ssh` dan OpenShell `remote`, pembuatan ulang lebih penting daripada pada Docker: ruang kerja jarak jauh menjadi sumber kanonis setelah penyemaian awal, `recreate` menghapus ruang kerja jarak jauh kanonis tersebut untuk cakupan yang dipilih, dan proses berikutnya menyemainya kembali dari ruang kerja lokal saat ini.

### `openclaw sandbox explain`

Periksa mode/cakupan/akses ruang kerja sandbox yang efektif, kebijakan alat sandbox, dan gerbang alat dengan hak istimewa lebih tinggi (beserta jalur kunci konfigurasi untuk perbaikannya).

Laporan mempertahankan `workspaceRoot` sebagai akar sandbox yang dikonfigurasi dan menampilkan secara terpisah ruang kerja host yang efektif, direktori kerja runtime backend, serta tabel pemasangan Docker. Untuk `workspaceAccess: "rw"`, ruang kerja host yang efektif adalah ruang kerja agen, bukan direktori di bawah `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Tidak seperti `recreate --session`, perintah ini menerima nama sesi pendek (misalnya `main`) dan memperluasnya berdasarkan agen yang telah ditentukan.

## Mengapa pembuatan ulang diperlukan

Memperbarui konfigurasi sandbox tidak memengaruhi kontainer yang sedang berjalan: runtime yang ada mempertahankan pengaturan lamanya, dan runtime yang menganggur baru dibersihkan setelah `prune.idleHours` (bawaan 24 jam). Agen yang digunakan secara rutin dapat mempertahankan runtime usang tetap aktif tanpa batas waktu. `openclaw sandbox recreate` menghapus runtime lama agar penggunaan berikutnya membangunnya kembali dari konfigurasi saat ini.

<Tip>
Utamakan `openclaw sandbox recreate` daripada pembersihan manual khusus backend. Perintah ini menggunakan registri runtime milik Gateway dan menghindari ketidakcocokan ketika cakupan atau kunci sesi berubah.
</Tip>

## Pemicu umum

| Perubahan                                                                                                                                                      | Perintah                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Pembaruan citra Docker (`agents.defaults.sandbox.docker.image`)                                                                                                | `openclaw sandbox recreate --all`                                   |
| Konfigurasi sandbox (`agents.defaults.sandbox.*`)                                                                                                              | `openclaw sandbox recreate --all`                                   |
| Target/autentikasi SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                |
| Sumber/kebijakan/mode OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                         | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (atau `--agent <id>` untuk satu agen) |

<Note>
Runtime dibuat ulang secara otomatis saat agen digunakan berikutnya.
</Note>

## Migrasi registri

Metadata runtime sandbox berada dalam basis data status SQLite bersama. Instalasi lama mungkin memiliki berkas registri warisan yang tidak lagi ditulis ulang oleh pembacaan biasa:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- satu pecahan JSON per kontainer/peramban di bawah `~/.openclaw/sandbox/containers/` atau `~/.openclaw/sandbox/browsers/`

Jalankan `openclaw doctor --fix` untuk memigrasikan entri warisan yang valid ke SQLite. Berkas warisan yang tidak valid dikarantina agar registri lama yang rusak tidak dapat menyembunyikan entri runtime saat ini.

## Konfigurasi

Pengaturan sandbox berada di `~/.openclaw/openclaw.json` pada `agents.defaults.sandbox` (penggantian per agen ditempatkan di `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (plugin-provided)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // auto-prune after 24h idle
          "maxAgeDays": 7, // auto-prune after 7 days
        },
      },
    },
  },
}
```

## Terkait

- [Referensi CLI](/id/cli)
- [Sandboxing](/id/gateway/sandboxing)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Doctor](/id/gateway/doctor): memeriksa penyiapan sandbox.

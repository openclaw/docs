---
read_when:
    - Anda sering menjalankan OpenClaw dengan Docker dan ingin perintah harian yang lebih singkat
    - Anda menginginkan lapisan helper untuk dashboard, log, penyiapan token, dan alur pairing
summary: Helper shell ClawDock untuk instalasi OpenClaw berbasis Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T13:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock adalah lapisan helper shell kecil untuk instalasi OpenClaw berbasis Docker.

Ini memberi Anda perintah singkat seperti `clawdock-start`, `clawdock-dashboard`, dan `clawdock-fix-token` sebagai pengganti pemanggilan `docker compose ...` yang lebih panjang.

Jika Anda belum menyiapkan Docker, mulailah dengan [Docker](/install/docker).

## Instalasi

Gunakan path helper kanonis:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika sebelumnya Anda menginstal ClawDock dari `scripts/shell-helpers/clawdock-helpers.sh`, instal ulang dari path baru `scripts/clawdock/clawdock-helpers.sh`. Path raw GitHub lama sudah dihapus.

## Yang Anda dapatkan

### Operasi dasar

| Command            | Description              |
| ------------------ | ------------------------ |
| `clawdock-start`   | Memulai gateway          |
| `clawdock-stop`    | Menghentikan gateway     |
| `clawdock-restart` | Memulai ulang gateway    |
| `clawdock-status`  | Memeriksa status kontainer |
| `clawdock-logs`    | Mengikuti log gateway    |

### Akses kontainer

| Command                   | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `clawdock-shell`          | Membuka shell di dalam kontainer gateway        |
| `clawdock-cli <command>`  | Menjalankan perintah CLI OpenClaw di Docker     |
| `clawdock-exec <command>` | Menjalankan perintah arbitrer di dalam kontainer |

### UI web dan pairing

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `clawdock-dashboard`    | Membuka URL UI Kontrol         |
| `clawdock-devices`      | Mendaftarkan pairing perangkat yang tertunda |
| `clawdock-approve <id>` | Menyetujui permintaan pairing  |

### Penyiapan dan pemeliharaan

| Command              | Description                                        |
| -------------------- | -------------------------------------------------- |
| `clawdock-fix-token` | Mengonfigurasi token gateway di dalam kontainer    |
| `clawdock-update`    | Pull, build ulang, dan mulai ulang                 |
| `clawdock-rebuild`   | Build ulang image Docker saja                      |
| `clawdock-clean`     | Menghapus kontainer dan volume                     |

### Utilitas

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `clawdock-health`      | Menjalankan pemeriksaan kesehatan gateway |
| `clawdock-token`       | Mencetak token gateway                    |
| `clawdock-cd`          | Lompat ke direktori proyek OpenClaw       |
| `clawdock-config`      | Membuka `~/.openclaw`                     |
| `clawdock-show-config` | Mencetak file konfigurasi dengan nilai yang disamarkan |
| `clawdock-workspace`   | Membuka direktori workspace               |

## Alur pertama kali

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Jika browser menyatakan pairing diperlukan:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfigurasi dan rahasia

ClawDock bekerja dengan pemisahan konfigurasi Docker yang sama seperti yang dijelaskan di [Docker](/install/docker):

- `<project>/.env` untuk nilai khusus Docker seperti nama image, port, dan token gateway
- `~/.openclaw/.env` untuk kunci provider dan token bot yang didukung env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` untuk auth OAuth/kunci API provider yang tersimpan
- `~/.openclaw/openclaw.json` untuk konfigurasi perilaku

Gunakan `clawdock-show-config` saat Anda ingin memeriksa file `.env` dan `openclaw.json` dengan cepat. Perintah ini menyamarkan nilai `.env` dalam output yang dicetak.

## Halaman terkait

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Updating](/install/updating)

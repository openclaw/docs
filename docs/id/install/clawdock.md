---
read_when:
    - Anda sering menjalankan OpenClaw dengan Docker dan menginginkan perintah harian yang lebih singkat
    - Anda menginginkan lapisan helper untuk dashboard, log, penyiapan token, dan alur pairing
summary: Helper shell ClawDock untuk instalasi OpenClaw berbasis Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T09:12:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock adalah lapisan helper shell kecil untuk instalasi OpenClaw berbasis Docker.

ClawDock memberi Anda perintah singkat seperti `clawdock-start`, `clawdock-dashboard`, dan `clawdock-fix-token` alih-alih perintah `docker compose ...` yang lebih panjang.

Jika Anda belum menyiapkan Docker, mulai dari [Docker](/id/install/docker).

## Instalasi

Gunakan path helper kanonis:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda sebelumnya menginstal ClawDock dari `scripts/shell-helpers/clawdock-helpers.sh`, instal ulang dari path baru `scripts/clawdock/clawdock-helpers.sh`. Path raw GitHub lama telah dihapus.

## Yang Anda dapatkan

### Operasi dasar

| Perintah           | Deskripsi              |
| ------------------ | ---------------------- |
| `clawdock-start`   | Menjalankan gateway    |
| `clawdock-stop`    | Menghentikan gateway   |
| `clawdock-restart` | Memulai ulang gateway  |
| `clawdock-status`  | Memeriksa status container |
| `clawdock-logs`    | Mengikuti log gateway  |

### Akses container

| Perintah                  | Deskripsi                                   |
| ------------------------- | ------------------------------------------- |
| `clawdock-shell`          | Membuka shell di dalam container gateway    |
| `clawdock-cli <command>`  | Menjalankan perintah CLI OpenClaw di Docker |
| `clawdock-exec <command>` | Menjalankan perintah arbitrer di container  |

### UI web dan pairing

| Perintah                | Deskripsi                     |
| ----------------------- | ----------------------------- |
| `clawdock-dashboard`    | Membuka URL Control UI        |
| `clawdock-devices`      | Mencantumkan pairing perangkat yang tertunda |
| `clawdock-approve <id>` | Menyetujui permintaan pairing |

### Penyiapan dan pemeliharaan

| Perintah             | Deskripsi                                         |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Mengonfigurasi token gateway di dalam container   |
| `clawdock-update`    | Pull, rebuild, dan restart                        |
| `clawdock-rebuild`   | Membangun ulang image Docker saja                 |
| `clawdock-clean`     | Menghapus container dan volume                    |

### Utilitas

| Perintah               | Deskripsi                            |
| ---------------------- | ------------------------------------ |
| `clawdock-health`      | Menjalankan pemeriksaan kesehatan gateway |
| `clawdock-token`       | Mencetak token gateway               |
| `clawdock-cd`          | Pindah ke direktori project OpenClaw |
| `clawdock-config`      | Membuka `~/.openclaw`                |
| `clawdock-show-config` | Mencetak file config dengan nilai yang disensor |
| `clawdock-workspace`   | Membuka direktori workspace          |

## Alur pertama kali

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Jika browser mengatakan pairing diperlukan:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Config dan secret

ClawDock bekerja dengan pemisahan config Docker yang sama seperti dijelaskan di [Docker](/id/install/docker):

- `<project>/.env` untuk nilai khusus Docker seperti nama image, port, dan token gateway
- `~/.openclaw/.env` untuk kunci provider dan token bot yang didukung env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` untuk auth OAuth/API-key provider yang disimpan
- `~/.openclaw/openclaw.json` untuk config perilaku

Gunakan `clawdock-show-config` saat Anda ingin memeriksa file `.env` dan `openclaw.json` dengan cepat. Perintah ini menyensor nilai `.env` pada output yang dicetak.

## Halaman terkait

- [Docker](/id/install/docker)
- [Docker VM Runtime](/id/install/docker-vm-runtime)
- [Memperbarui](/id/install/updating)

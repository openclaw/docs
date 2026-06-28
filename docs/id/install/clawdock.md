---
read_when:
    - Anda sering menjalankan OpenClaw dengan Docker dan menginginkan perintah sehari-hari yang lebih singkat
    - Anda memerlukan lapisan pembantu untuk dasbor, log, penyiapan token, dan alur penyandingan
summary: Alat bantu shell ClawDock untuk instalasi OpenClaw berbasis Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock adalah lapisan bantuan shell kecil untuk instalasi OpenClaw berbasis Docker.

Ini memberi Anda perintah singkat seperti `clawdock-start`, `clawdock-dashboard`, dan `clawdock-fix-token` alih-alih pemanggilan `docker compose ...` yang lebih panjang.

Jika Anda belum menyiapkan Docker, mulai dengan [Docker](/id/install/docker).

## Instalasi

Gunakan path helper kanonis:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika sebelumnya Anda menginstal ClawDock dari `scripts/shell-helpers/clawdock-helpers.sh`, instal ulang dari path baru `scripts/clawdock/clawdock-helpers.sh`. Path GitHub raw lama telah dihapus.

## Yang Anda dapatkan

### Operasi dasar

| Perintah           | Deskripsi                |
| ------------------ | ------------------------ |
| `clawdock-start`   | Memulai gateway          |
| `clawdock-stop`    | Menghentikan gateway     |
| `clawdock-restart` | Memulai ulang gateway    |
| `clawdock-status`  | Memeriksa status kontainer |
| `clawdock-logs`    | Mengikuti log gateway    |

### Akses kontainer

| Perintah                  | Deskripsi                                      |
| ------------------------- | ---------------------------------------------- |
| `clawdock-shell`          | Membuka shell di dalam kontainer gateway       |
| `clawdock-cli <command>`  | Menjalankan perintah CLI OpenClaw di Docker    |
| `clawdock-exec <command>` | Menjalankan perintah arbitrer di dalam kontainer |

### UI web dan pairing

| Perintah                | Deskripsi                         |
| ----------------------- | --------------------------------- |
| `clawdock-dashboard`    | Membuka URL Control UI            |
| `clawdock-devices`      | Mencantumkan pairing perangkat yang tertunda |
| `clawdock-approve <id>` | Menyetujui permintaan pairing     |

### Penyiapan dan pemeliharaan

| Perintah             | Deskripsi                                      |
| -------------------- | ---------------------------------------------- |
| `clawdock-fix-token` | Mengonfigurasi token gateway di dalam kontainer |
| `clawdock-update`    | Pull, rebuild, dan mulai ulang                 |
| `clawdock-rebuild`   | Rebuild image Docker saja                      |
| `clawdock-clean`     | Menghapus kontainer dan volume                 |

### Utilitas

| Perintah               | Deskripsi                                      |
| ---------------------- | ---------------------------------------------- |
| `clawdock-health`      | Menjalankan pemeriksaan kesehatan gateway      |
| `clawdock-token`       | Mencetak token gateway                         |
| `clawdock-cd`          | Lompat ke direktori proyek OpenClaw            |
| `clawdock-config`      | Membuka `~/.openclaw`                          |
| `clawdock-show-config` | Mencetak file konfigurasi dengan nilai yang disamarkan |
| `clawdock-workspace`   | Membuka direktori workspace                    |

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

## Konfigurasi dan rahasia

ClawDock bekerja dengan pemisahan konfigurasi Docker yang sama seperti dijelaskan di [Docker](/id/install/docker):

- `<project>/.env` untuk nilai khusus Docker seperti nama image, port, dan token gateway
- `~/.openclaw/.env` untuk kunci provider berbasis env dan token bot
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/API-key provider yang disimpan
- `~/.openclaw/openclaw.json` untuk konfigurasi perilaku

Gunakan `clawdock-show-config` saat Anda ingin memeriksa file `.env` dan `openclaw.json` dengan cepat. Ini menyamarkan nilai `.env` dalam output yang dicetak.

## Terkait

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="docker">
    Instalasi Docker kanonis untuk OpenClaw.
  </Card>
  <Card title="Runtime VM Docker" href="/id/install/docker-vm-runtime" icon="cube">
    Runtime VM yang dikelola Docker untuk isolasi yang diperkuat.
  </Card>
  <Card title="Memperbarui" href="/id/install/updating" icon="arrow-up-right-from-square">
    Memperbarui paket OpenClaw dan layanan terkelola.
  </Card>
</CardGroup>

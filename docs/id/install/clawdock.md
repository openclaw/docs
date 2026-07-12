---
read_when:
    - Anda sering menjalankan OpenClaw dengan Docker dan menginginkan perintah sehari-hari yang lebih singkat
    - Anda menginginkan lapisan pembantu untuk dasbor, log, penyiapan token, dan alur pemasangan perangkat
summary: Pembantu shell ClawDock untuk instalasi OpenClaw berbasis Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T14:16:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock adalah lapisan pembantu shell kecil untuk instalasi OpenClaw berbasis Docker.

ClawDock menyediakan perintah singkat seperti `clawdock-start`, `clawdock-dashboard`, dan `clawdock-fix-token` sebagai pengganti pemanggilan `docker compose ...` yang lebih panjang.

Jika Anda belum menyiapkan Docker, mulailah dengan [Docker](/id/install/docker).

## Instalasi

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika sebelumnya Anda menginstal ClawDock dari `scripts/shell-helpers/clawdock-helpers.sh`, instal ulang dari jalur terkini `scripts/clawdock/clawdock-helpers.sh`; jalur mentah GitHub yang lama telah dihapus.

Pembantu ini mendeteksi checkout OpenClaw Anda secara otomatis saat pertama kali digunakan (dengan memeriksa jalur umum seperti `~/openclaw`, `~/projects/openclaw`) dan menyimpan hasilnya dalam cache di `~/.clawdock/config`. Atur sendiri `CLAWDOCK_DIR` jika checkout Anda berada di lokasi lain.

## Yang Anda dapatkan

### Operasi dasar

| Perintah           | Deskripsi                 |
| ------------------ | ------------------------- |
| `clawdock-start`   | Memulai Gateway           |
| `clawdock-stop`    | Menghentikan Gateway      |
| `clawdock-restart` | Memulai ulang Gateway     |
| `clawdock-status`  | Memeriksa status kontainer |
| `clawdock-logs`    | Mengikuti log Gateway     |

### Akses kontainer

| Perintah                  | Deskripsi                                         |
| ------------------------- | ------------------------------------------------- |
| `clawdock-shell`          | Membuka shell di dalam kontainer Gateway          |
| `clawdock-cli <command>`  | Menjalankan perintah CLI OpenClaw di Docker       |
| `clawdock-exec <command>` | Menjalankan perintah apa pun di dalam kontainer   |

### Antarmuka web dan pemasangan

| Perintah                | Deskripsi                              |
| ----------------------- | -------------------------------------- |
| `clawdock-dashboard`    | Membuka URL Antarmuka Kontrol          |
| `clawdock-devices`      | Menampilkan pemasangan perangkat tertunda |
| `clawdock-approve <id>` | Menyetujui permintaan pemasangan       |

### Penyiapan dan pemeliharaan

| Perintah             | Deskripsi                                             |
| -------------------- | ----------------------------------------------------- |
| `clawdock-fix-token` | Menulis token Gateway ke konfigurasi kontainer        |
| `clawdock-update`    | Mengambil, membangun ulang, dan memulai ulang         |
| `clawdock-rebuild`   | Hanya membangun ulang citra Docker                    |
| `clawdock-clean`     | Menghapus kontainer dan volume                        |

### Utilitas

| Perintah               | Deskripsi                                           |
| ---------------------- | --------------------------------------------------- |
| `clawdock-health`      | Menjalankan pemeriksaan kesehatan Gateway           |
| `clawdock-token`       | Mencetak token Gateway                              |
| `clawdock-cd`          | Berpindah ke direktori proyek OpenClaw              |
| `clawdock-config`      | Membuka `~/.openclaw`                               |
| `clawdock-show-config` | Mencetak berkas konfigurasi dengan nilai disamarkan |
| `clawdock-workspace`   | Membuka direktori ruang kerja                       |
| `clawdock-help`        | Menampilkan semua perintah ClawDock                 |

## Alur penggunaan pertama

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Jika peramban menyatakan bahwa pemasangan diperlukan:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfigurasi dan rahasia

ClawDock membaca dua berkas `.env` terpisah, sesuai dengan pemisahan yang dijelaskan dalam [Docker](/id/install/docker):

- Berkas `.env` proyek di samping `docker-compose.yml`: nilai khusus Docker seperti nama citra, porta, dan `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` membaca token dari sini.
- `~/.openclaw/.env` (dipasang ke dalam kontainer): rahasia berbasis variabel lingkungan yang dikelola oleh OpenClaw sendiri, bersama `openclaw.json` dan `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` menyalin token dari berkas `.env` proyek ke nilai konfigurasi `gateway.remote.token` dan `gateway.auth.token` milik kontainer, lalu memulai ulang Gateway.

Gunakan `clawdock-show-config` untuk memeriksa `openclaw.json` dan kedua berkas `.env` dengan cepat; perintah ini menyamarkan nilai `.env` dalam keluaran yang dicetak.

## Terkait

<CardGroup cols={2}>
  <Card title="Docker" href="/id/install/docker" icon="docker">
    Instalasi Docker kanonis untuk OpenClaw.
  </Card>
  <Card title="Runtime VM Docker" href="/id/install/docker-vm-runtime" icon="cube">
    Runtime VM yang dikelola Docker untuk isolasi yang diperkuat.
  </Card>
  <Card title="Pembaruan" href="/id/install/updating" icon="arrow-up-right-from-square">
    Memperbarui paket OpenClaw dan layanan terkelola.
  </Card>
</CardGroup>

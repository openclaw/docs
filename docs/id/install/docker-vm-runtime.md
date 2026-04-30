---
read_when:
    - Anda men-deploy OpenClaw di VM cloud dengan Docker
    - Anda memerlukan proses pembuatan biner bersama, persistensi, dan alur pembaruan
summary: Langkah-langkah eksekusi VM Docker bersama untuk inang OpenClaw Gateway jangka panjang
title: Runtime VM Docker
x-i18n:
    generated_at: "2026-04-30T09:55:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Langkah runtime bersama untuk instalasi Docker berbasis VM seperti GCP, Hetzner, dan penyedia VPS serupa.

## Tanamkan biner yang diperlukan ke dalam image

Menginstal biner di dalam container yang sedang berjalan adalah jebakan.
Apa pun yang diinstal saat runtime akan hilang saat restart.

Semua biner eksternal yang diperlukan oleh Skills harus diinstal pada waktu build image.

Contoh di bawah hanya menampilkan tiga biner umum:

- `gog` (dari `gogcli`) untuk akses Gmail
- `goplaces` untuk Google Places
- `wacli` untuk WhatsApp

Ini adalah contoh, bukan daftar lengkap.
Anda dapat menginstal biner sebanyak yang diperlukan menggunakan pola yang sama.

Jika nanti Anda menambahkan Skills baru yang bergantung pada biner tambahan, Anda harus:

1. Memperbarui Dockerfile
2. Membangun ulang image
3. Me-restart container

**Contoh Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
URL di atas adalah contoh. Untuk VM berbasis ARM, pilih aset `arm64`. Untuk build yang dapat direproduksi, sematkan URL rilis berversi.
</Note>

## Build dan jalankan

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jika build gagal dengan `Killed` atau `exit code 137` selama `pnpm install --frozen-lockfile`, VM kehabisan memori.
Gunakan kelas mesin yang lebih besar sebelum mencoba lagi.

Verifikasi biner:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Output yang diharapkan:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifikasi Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Output yang diharapkan:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Apa yang persisten di mana

OpenClaw berjalan di Docker, tetapi Docker bukan sumber kebenaran.
Semua status jangka panjang harus bertahan melewati restart, rebuild, dan reboot.

| Komponen            | Lokasi                                   | Mekanisme persistensi  | Catatan                                                       |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Konfig Gateway      | `/home/node/.openclaw/`                  | Mount volume host      | Mencakup `openclaw.json`, `.env`                              |
| Profil auth model   | `/home/node/.openclaw/agents/`           | Mount volume host      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, kunci API) |
| Konfig Skill        | `/home/node/.openclaw/skills/`           | Mount volume host      | Status tingkat Skill                                          |
| Workspace agen      | `/home/node/.openclaw/workspace/`        | Mount volume host      | Kode dan artefak agen                                         |
| Sesi WhatsApp       | `/home/node/.openclaw/`                  | Mount volume host      | Mempertahankan login QR                                       |
| Keyring Gmail       | `/home/node/.openclaw/`                  | Volume host + kata sandi | Memerlukan `GOG_KEYRING_PASSWORD`                             |
| Dependensi runtime Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Volume bernama Docker  | Dependensi Plugin bundel yang dihasilkan dan mirror runtime   |
| Biner eksternal     | `/usr/local/bin/`                        | Image Docker           | Harus ditanamkan pada waktu build                             |
| Runtime Node        | Sistem file container                    | Image Docker           | Dibangun ulang setiap build image                             |
| Paket OS            | Sistem file container                    | Image Docker           | Jangan instal saat runtime                                    |
| Container Docker    | Ephemeral                                | Dapat di-restart       | Aman untuk dihancurkan                                        |

## Pembaruan

Untuk memperbarui OpenClaw pada VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Terkait

- [Docker](/id/install/docker)
- [Podman](/id/install/podman)
- [ClawDock](/id/install/clawdock)

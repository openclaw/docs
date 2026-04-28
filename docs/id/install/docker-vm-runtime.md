---
read_when:
- Anda sedang men-deploy OpenClaw di VM cloud dengan Docker
- Anda memerlukan alur bake binary bersama, persistensi, dan pembaruan
summary: Langkah runtime Docker VM bersama untuk host Gateway OpenClaw jangka panjang
title: Docker VM runtime
x-i18n:
  generated_at: '2026-04-24T09:13:08Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
  source_path: install/docker-vm-runtime.md
  workflow: 15
---

Langkah runtime bersama untuk instalasi Docker berbasis VM seperti GCP, Hetzner, dan penyedia VPS serupa.

## Bake binary yang diperlukan ke dalam image

Menginstal binary di dalam container yang sedang berjalan adalah jebakan.
Apa pun yang diinstal saat runtime akan hilang saat restart.

Semua binary eksternal yang diperlukan oleh Skills harus diinstal saat build image.

Contoh di bawah ini hanya menunjukkan tiga binary umum:

- `gog` untuk akses Gmail
- `goplaces` untuk Google Places
- `wacli` untuk WhatsApp

Ini hanya contoh, bukan daftar lengkap.
Anda dapat menginstal sebanyak mungkin binary yang diperlukan menggunakan pola yang sama.

Jika nanti Anda menambahkan Skills baru yang bergantung pada binary tambahan, Anda harus:

1. Memperbarui Dockerfile
2. Membangun ulang image
3. Memulai ulang container

**Contoh Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Contoh binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Contoh binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Contoh binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Tambahkan lebih banyak binary di bawah menggunakan pola yang sama

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
URL unduhan di atas untuk x86_64 (amd64). Untuk VM berbasis ARM (misalnya Hetzner ARM, GCP Tau T2A), ganti URL unduhan dengan varian ARM64 yang sesuai dari halaman rilis masing-masing tool.
</Note>

## Build dan jalankan

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jika build gagal dengan `Killed` atau `exit code 137` selama `pnpm install --frozen-lockfile`, VM kehabisan memori.
Gunakan kelas mesin yang lebih besar sebelum mencoba lagi.

Verifikasi binary:

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

## Apa yang persisten dan di mana

OpenClaw berjalan di Docker, tetapi Docker bukan sumber kebenaran.
Semua state jangka panjang harus tetap bertahan setelah restart, rebuild, dan reboot.

| Komponen           | Lokasi                            | Mekanisme persistensi | Catatan                                                       |
| ------------------ | --------------------------------- | --------------------- | ------------------------------------------------------------- |
| Config Gateway     | `/home/node/.openclaw/`           | Mount volume host     | Mencakup `openclaw.json`, `.env`                              |
| Profil auth model  | `/home/node/.openclaw/agents/`    | Mount volume host     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API key)  |
| Config skill       | `/home/node/.openclaw/skills/`    | Mount volume host     | State tingkat skill                                           |
| Workspace agen     | `/home/node/.openclaw/workspace/` | Mount volume host     | Kode dan artefak agen                                         |
| Sesi WhatsApp      | `/home/node/.openclaw/`           | Mount volume host     | Mempertahankan login QR                                       |
| Keyring Gmail      | `/home/node/.openclaw/`           | Volume host + password | Memerlukan `GOG_KEYRING_PASSWORD`                            |
| Binary eksternal   | `/usr/local/bin/`                 | Image Docker          | Harus di-bake saat build                                      |
| Runtime Node       | Filesystem container              | Image Docker          | Dibangun ulang setiap build image                             |
| Paket OS           | Filesystem container              | Image Docker          | Jangan instal saat runtime                                    |
| Container Docker   | Ephemeral                         | Dapat di-restart      | Aman untuk dihancurkan                                        |

## Pembaruan

Untuk memperbarui OpenClaw di VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Terkait

- [Docker](/id/install/docker)
- [Podman](/id/install/podman)
- [ClawDock](/id/install/clawdock)

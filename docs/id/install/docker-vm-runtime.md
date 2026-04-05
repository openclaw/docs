---
read_when:
    - Anda sedang men-deploy OpenClaw di cloud VM dengan Docker
    - Anda memerlukan alur bake biner bersama, persistensi, dan pembaruan
summary: Langkah runtime Docker VM bersama untuk host Gateway OpenClaw jangka panjang
title: Docker VM Runtime
x-i18n:
    generated_at: "2026-04-05T13:57:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker VM Runtime

Langkah runtime bersama untuk instalasi Docker berbasis VM seperti GCP, Hetzner, dan provider VPS serupa.

## Bake biner yang diperlukan ke dalam image

Menginstal biner di dalam kontainer yang sedang berjalan adalah jebakan.
Apa pun yang diinstal saat runtime akan hilang saat restart.

Semua biner eksternal yang diperlukan oleh Skills harus diinstal saat image dibangun.

Contoh di bawah ini hanya menunjukkan tiga biner umum:

- `gog` untuk akses Gmail
- `goplaces` untuk Google Places
- `wacli` untuk WhatsApp

Ini adalah contoh, bukan daftar lengkap.
Anda dapat menginstal sebanyak mungkin biner yang diperlukan dengan pola yang sama.

Jika nanti Anda menambahkan Skills baru yang bergantung pada biner tambahan, Anda harus:

1. Memperbarui Dockerfile
2. Membangun ulang image
3. Me-restart kontainer

**Contoh Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
URL unduhan di atas adalah untuk x86_64 (amd64). Untuk VM berbasis ARM (misalnya Hetzner ARM, GCP Tau T2A), ganti URL unduhan dengan varian ARM64 yang sesuai dari halaman rilis masing-masing tool.
</Note>

## Bangun dan jalankan

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

## Apa yang persisten dan di mana

OpenClaw berjalan di Docker, tetapi Docker bukan sumber kebenaran.
Semua state jangka panjang harus bertahan dari restart, build ulang, dan reboot.

| Component           | Location                          | Persistence mechanism | Notes                                                         |
| ------------------- | --------------------------------- | --------------------- | ------------------------------------------------------------- |
| Konfigurasi Gateway | `/home/node/.openclaw/`           | Mount volume host     | Termasuk `openclaw.json`, `.env`                              |
| Profil auth model   | `/home/node/.openclaw/agents/`    | Mount volume host     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, kunci API) |
| Konfigurasi Skills  | `/home/node/.openclaw/skills/`    | Mount volume host     | State level Skill                                             |
| Workspace agent     | `/home/node/.openclaw/workspace/` | Mount volume host     | Kode dan artefak agent                                        |
| Sesi WhatsApp       | `/home/node/.openclaw/`           | Mount volume host     | Menyimpan login QR                                            |
| Keyring Gmail       | `/home/node/.openclaw/`           | Volume host + kata sandi | Memerlukan `GOG_KEYRING_PASSWORD`                           |
| Biner eksternal     | `/usr/local/bin/`                 | Image Docker          | Harus di-bake saat build time                                 |
| Runtime Node        | Filesystem kontainer              | Image Docker          | Dibangun ulang setiap build image                             |
| Paket OS            | Filesystem kontainer              | Image Docker          | Jangan instal saat runtime                                    |
| Kontainer Docker    | Ephemeral                         | Dapat di-restart      | Aman untuk dihancurkan                                        |

## Pembaruan

Untuk memperbarui OpenClaw di VM:

```bash
git pull
docker compose build
docker compose up -d
```

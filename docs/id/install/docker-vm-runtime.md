---
read_when:
    - Anda menerapkan OpenClaw pada VM cloud dengan Docker
    - Anda memerlukan alur pembuatan biner bersama, persistensi, dan pembaruan
summary: Langkah-langkah runtime VM Docker bersama untuk host Gateway OpenClaw yang berjalan jangka panjang
title: Runtime VM Docker
x-i18n:
    generated_at: "2026-07-12T14:16:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Langkah runtime bersama untuk instalasi Docker berbasis VM seperti GCP, Hetzner, dan penyedia VPS serupa.

## Sertakan biner yang diperlukan ke dalam image

Menginstal biner di dalam container yang sedang berjalan adalah jebakan: semua yang diinstal saat runtime akan hilang ketika dimulai ulang. Sertakan setiap biner eksternal yang dibutuhkan skill ke dalam image pada waktu build.

Contoh di bawah ini hanya mencakup tiga biner, menurut urutan abjad:

- `gog` (dari `gogcli`) untuk akses Gmail
- `goplaces` untuk Google Places
- `wacli` untuk WhatsApp

Ini hanyalah contoh, bukan daftar lengkap. Instal sebanyak mungkin biner yang dibutuhkan skill Anda dengan menggunakan pola yang sama. Ketika nanti Anda menambahkan skill yang membutuhkan biner baru:

1. Perbarui Dockerfile.
2. Build ulang image.
3. Mulai ulang container.

**Contoh Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Contoh biner 1: CLI Gmail (gogcli — diinstal sebagai `gog`)
# Salin URL aset Linux saat ini dari https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Contoh biner 2: CLI Google Places
# Salin URL aset Linux saat ini dari https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Contoh biner 3: CLI WhatsApp
# Salin URL aset Linux saat ini dari https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Tambahkan lebih banyak biner di bawah ini menggunakan pola yang sama

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
URL di atas hanyalah contoh. Untuk VM berbasis ARM, pilih aset `arm64`. Untuk build yang dapat direproduksi, sematkan URL rilis dengan versi tertentu.
</Note>

## Build dan jalankan

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Jika build gagal dengan `Killed` atau kode keluar 137 selama `pnpm install --frozen-lockfile`, VM kehabisan memori. Gunakan kelas mesin yang lebih besar sebelum mencoba lagi.

Verifikasi biner:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Keluaran yang diharapkan:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifikasi bahwa Gateway aktif:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Respons 200 dari `/healthz` mengonfirmasi bahwa proses Gateway sedang menerima koneksi dan dalam kondisi sehat; `HEALTHCHECK` bawaan image memeriksa endpoint yang sama.

## Data yang dipertahankan dan lokasinya

OpenClaw berjalan di Docker, tetapi Docker bukan sumber data utama. Semua status berjangka panjang harus tetap tersedia setelah dimulai ulang, di-build ulang, dan di-reboot.

| Komponen                        | Lokasi                                                 | Mekanisme persistensi      | Catatan                                                                                                              |
| ------------------------------- | ------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Konfigurasi Gateway             | `/home/node/.openclaw/`                                | Mount volume host          | Termasuk `openclaw.json`                                                                                             |
| Kredensial kanal/penyedia       | `/home/node/.openclaw/credentials/`                    | Mount volume host          | Materi kredensial kanal dan penyedia                                                                                 |
| Profil autentikasi model        | `/home/node/.openclaw/agents/`                         | Mount volume host          | `agents/<agentId>/agent/auth-profiles.json` (OAuth, kunci API)                                                       |
| Berkas kunci OAuth lama         | `/home/node/.config/openclaw/`                         | Mount volume host          | Kompatibilitas hanya-baca untuk sidecar OAuth pramigrasi; `openclaw doctor --fix` memigrasikannya ke `auth-profiles.json` |
| Konfigurasi skill               | `/home/node/.openclaw/skills/`                         | Mount volume host          | Status tingkat skill                                                                                                |
| Ruang kerja agen                | `/home/node/.openclaw/workspace/`                      | Mount volume host          | Kode dan artefak agen                                                                                                |
| Sesi WhatsApp                   | `/home/node/.openclaw/`                                | Mount volume host          | Mempertahankan login QR                                                                                              |
| Keyring Gmail                   | `/home/node/.openclaw/`                                | Volume host + kata sandi   | Memerlukan `GOG_KEYRING_PASSWORD`                                                                                    |
| Paket Plugin                    | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Mount volume host          | Direktori akar paket Plugin yang dapat diunduh                                                                       |
| Biner eksternal                 | `/usr/local/bin/`                                      | Image Docker               | Harus disertakan pada waktu build                                                                                    |
| Runtime Node                    | Sistem berkas container                                | Image Docker               | Di-build ulang setiap kali image di-build                                                                            |
| Paket OS                        | Sistem berkas container                                | Image Docker               | Jangan instal saat runtime                                                                                           |
| Container Docker                | Sementara                                              | Dapat dimulai ulang        | Aman untuk dihapus                                                                                                   |

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

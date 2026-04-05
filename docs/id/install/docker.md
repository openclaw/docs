---
read_when:
    - Anda menginginkan gateway dalam container alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan onboarding berbasis Docker opsional untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-05T13:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (opsional)

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan gateway dalam container atau untuk memvalidasi alur Docker.

## Apakah Docker cocok untuk saya?

- **Ya**: Anda menginginkan lingkungan gateway yang terisolasi dan mudah dibuang, atau ingin menjalankan OpenClaw pada host tanpa instalasi lokal.
- **Tidak**: Anda menjalankannya di mesin sendiri dan hanya menginginkan loop pengembangan tercepat. Gunakan alur instalasi normal.
- **Catatan sandboxing**: sandboxing agen juga menggunakan Docker, tetapi **tidak** mengharuskan seluruh gateway berjalan di Docker. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- Minimal RAM 2 GB untuk build image (`pnpm install` dapat dihentikan oleh OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Penguatan keamanan untuk eksposur jaringan](/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam container

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan script penyiapan:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image gateway secara lokal. Untuk menggunakan image siap pakai sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image siap pakai dipublikasikan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (misalnya `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Script penyiapan menjalankan onboarding secara otomatis. Script ini akan:

    - meminta API key provider
    - membuat token gateway dan menuliskannya ke `.env`
    - memulai gateway melalui Docker Compose

    Selama penyiapan, onboarding pra-start dan penulisan konfigurasi dijalankan melalui
    `openclaw-gateway` secara langsung. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    container gateway sudah ada.

  </Step>

  <Step title="Buka Control UI">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan
    shared secret yang dikonfigurasi ke Settings. Script penyiapan menulis token ke `.env` secara
    default; jika Anda mengubah konfigurasi container ke autentikasi password, gunakan
    password tersebut sebagai gantinya.

    Butuh URL-nya lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan channel (opsional)">
    Gunakan container CLI untuk menambahkan channel perpesanan:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

  </Step>
</Steps>

### Alur manual

Jika Anda lebih memilih menjalankan setiap langkah sendiri daripada menggunakan script penyiapan:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
Jalankan `docker compose` dari root repo. Jika Anda mengaktifkan `OPENCLAW_EXTRA_MOUNTS`
atau `OPENCLAW_HOME_VOLUME`, script penyiapan akan menulis `docker-compose.extra.yml`;
sertakan dengan `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, itu adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat penyiapan melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel environment

Script penyiapan menerima variabel environment opsional berikut:

| Variable                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Menggunakan image remote alih-alih membangunnya secara lokal     |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Menginstal package apt tambahan saat build (dipisahkan spasi)    |
| `OPENCLAW_EXTENSIONS`          | Pra-instal dependensi extension saat build (nama dipisahkan spasi) |
| `OPENCLAW_EXTRA_MOUNTS`        | Bind mount host tambahan (dipisahkan koma `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Menyimpan `/home/node` dalam volume Docker bernama               |
| `OPENCLAW_SANDBOX`             | Mengaktifkan bootstrap sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`       | Menimpa path Docker socket                                       |

### Health check

Endpoint probe container (tidak memerlukan autentikasi):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker menyertakan `HEALTHCHECK` bawaan yang melakukan ping ke `/healthz`.
Jika pemeriksaan terus gagal, Docker akan menandai container sebagai `unhealthy` dan
sistem orkestrasi dapat memulai ulang atau menggantinya.

Snapshot health mendalam yang diautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` secara default menggunakan `OPENCLAW_GATEWAY_BIND=lan` agar akses host ke
`http://127.0.0.1:18789` berfungsi dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat menjangkau port gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan container yang dapat menjangkau
  gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Penyimpanan dan persistensi

Docker Compose melakukan bind mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
tetap ada meskipun container diganti.

Direktori konfigurasi yang di-mount itulah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/API-key provider yang disimpan
- `.env` untuk secret runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Untuk detail persistensi lengkap pada deployment VM, lihat
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** awasi `media/`, file JSONL sesi, `cron/runs/*.jsonl`,
dan rolling file log di bawah `/tmp/openclaw/`.

### Helper shell (opsional)

Untuk manajemen Docker sehari-hari yang lebih mudah, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari raw path lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan kembali perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dan sebagainya. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agen untuk gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Path socket kustom (misalnya Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Script hanya me-mount `docker.sock` setelah prasyarat sandbox lolos. Jika
    penyiapan sandbox tidak dapat diselesaikan, script akan mereset `agents.defaults.sandbox.mode`
    ke `off`.

  </Accordion>

  <Accordion title="Otomasi / CI (non-interaktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` sehingga perintah CLI
    dapat menjangkau gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas
    kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-cli`.
  </Accordion>

  <Accordion title="Izin dan EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat error izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Build ulang yang lebih cepat">
    Urutkan Dockerfile Anda agar layer dependensi dapat di-cache. Ini menghindari menjalankan ulang
    `pnpm install` kecuali lockfile berubah:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Opsi container untuk power user">
    Image default berfokus pada keamanan dan berjalan sebagai `node` non-root. Untuk container yang
    lebih kaya fitur:

    1. **Simpan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bake dependensi sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Simpan unduhan browser**: tetapkan
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, browser URL akan dibuka. Pada
    penyiapan Docker atau headless, salin URL redirect lengkap tempat Anda mendarat lalu tempelkan
    kembali ke wizard untuk menyelesaikan autentikasi.
  </Accordion>

  <Accordion title="Metadata image dasar">
    Image Docker utama menggunakan `node:24-bookworm` dan memublikasikan anotasi
    OCI base-image termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Lihat
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Menjalankan di VPS?

Lihat [Hetzner (Docker VPS)](/install/hetzner) dan
[Docker VM Runtime](/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk baking biner, persistensi, dan pembaruan.

## Sandbox Agen

Saat `agents.defaults.sandbox` diaktifkan, gateway menjalankan eksekusi alat agen
(shell, baca/tulis file, dll.) di dalam container Docker yang terisolasi sementara
gateway itu sendiri tetap berjalan di host. Ini memberi Anda dinding keras di sekitar sesi agen
yang tidak tepercaya atau multi-tenant tanpa harus membuat seluruh gateway berada dalam container.

Cakupan sandbox dapat per agen (default), per sesi, atau bersama. Setiap cakupan
mendapat workspace sendiri yang di-mount di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan alat allow/deny, isolasi jaringan, batas sumber daya, dan container browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke container sandbox
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- override per agen

### Aktifkan cepat

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Build image sandbox default:

```bash
scripts/sandbox-setup.sh
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image tidak ada atau container sandbox tidak mau mulai">
    Build image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    atau tetapkan `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Container dibuat otomatis per sesi sesuai permintaan.
  </Accordion>

  <Accordion title="Error izin di sandbox">
    Tetapkan `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang di-mount,
    atau lakukan chown pada folder workspace.
  </Accordion>

  <Accordion title="Alat kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang memuat
    `/etc/profile` dan dapat mereset PATH. Tetapkan `docker.env.PATH` untuk menambahkan
    path alat kustom Anda di depan, atau tambahkan script di bawah `/etc/profile.d/` dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="Dihentikan oleh OOM saat build image (exit 137)">
    VM memerlukan minimal RAM 2 GB. Gunakan kelas mesin yang lebih besar lalu coba lagi.
  </Accordion>

  <Accordion title="Unauthorized atau pairing diperlukan di Control UI">
    Ambil tautan dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail lebih lanjut: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Target gateway menampilkan ws://172.x.x.x atau error pairing dari Docker CLI">
    Reset mode dan bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar Instalasi](/install) — semua metode instalasi
- [Podman](/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/install/clawdock) — penyiapan komunitas Docker Compose
- [Updating](/install/updating) — menjaga OpenClaw tetap terbaru
- [Konfigurasi](/id/gateway/configuration) — konfigurasi gateway setelah instalasi

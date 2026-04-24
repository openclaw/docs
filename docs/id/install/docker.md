---
read_when:
    - Anda menginginkan gateway dalam container alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan onboarding berbasis Docker opsional untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T09:13:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan gateway dalam container atau ingin memvalidasi alur Docker.

## Apakah Docker cocok untuk saya?

- **Ya**: Anda menginginkan lingkungan gateway yang terisolasi dan mudah dibuang, atau ingin menjalankan OpenClaw di host tanpa instalasi lokal.
- **Tidak**: Anda menjalankan di mesin sendiri dan hanya ingin dev loop tercepat. Gunakan alur instalasi normal saja.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** memerlukan seluruh gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- Setidaknya 2 GB RAM untuk build image (`pnpm install` dapat dibunuh karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Security hardening for network exposure](/id/gateway/security),
  khususnya kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam container

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip penyiapan:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image gateway secara lokal. Untuk menggunakan image yang sudah jadi:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image siap pakai dipublikasikan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (mis. `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip setup menjalankan onboarding secara otomatis. Skrip ini akan:

    - meminta API key provider
    - membuat token gateway dan menulisnya ke `.env`
    - memulai gateway melalui Docker Compose

    Selama setup, onboarding pra-start dan penulisan konfigurasi dijalankan melalui
    `openclaw-gateway` secara langsung. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    container gateway sudah ada.

  </Step>

  <Step title="Buka Control UI">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan shared secret
    yang telah dikonfigurasi ke Settings. Skrip setup menulis token ke `.env` secara
    default; jika Anda mengubah konfigurasi container ke autentikasi password, gunakan
    password itu sebagai gantinya.

    Perlu URL lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan kanal (opsional)">
    Gunakan container CLI untuk menambahkan kanal pesan:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

  </Step>
</Steps>

### Alur manual

Jika Anda lebih suka menjalankan setiap langkah sendiri alih-alih menggunakan skrip setup:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Jalankan `docker compose` dari root repo. Jika Anda mengaktifkan `OPENCLAW_EXTRA_MOUNTS`
atau `OPENCLAW_HOME_VOLUME`, skrip setup akan menulis `docker-compose.extra.yml`;
sertakan dengan `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, tool ini adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat setup melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel lingkungan

Skrip setup menerima variabel lingkungan opsional berikut:

| Variabel                      | Tujuan                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Gunakan image remote alih-alih build lokal                      |
| `OPENCLAW_DOCKER_APT_PACKAGES`| Instal paket apt tambahan selama build (dipisahkan spasi)       |
| `OPENCLAW_EXTENSIONS`         | Pra-instal dependensi plugin saat build (nama dipisahkan spasi) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mount host tambahan (dipisahkan koma `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Persist `/home/node` dalam volume Docker bernama                |
| `OPENCLAW_SANDBOX`            | Opt in ke bootstrap sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`      | Override path socket Docker                                     |

### Pemeriksaan kesehatan

Endpoint probe container (tanpa autentikasi):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker menyertakan `HEALTHCHECK` bawaan yang mem-ping `/healthz`.
Jika pemeriksaan terus gagal, Docker menandai container sebagai `unhealthy` dan
sistem orkestrasi dapat merestart atau menggantinya.

Snapshot kesehatan mendalam yang terautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` default ke `OPENCLAW_GATEWAY_BIND=lan` sehingga akses host ke
`http://127.0.0.1:18789` berfungsi dengan publishing port Docker.

- `lan` (default): browser host dan CLI host dapat menjangkau port gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan container yang dapat menjangkau
  gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
tetap bertahan saat container diganti.

Direktori konfigurasi yang di-mount itulah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/API-key provider yang tersimpan
- `.env` untuk secret runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Untuk detail persistensi lengkap pada deployment VM, lihat
[Docker VM Runtime - What persists where](/id/install/docker-vm-runtime#what-persists-where).

**Titik panas pertumbuhan disk:** pantau `media/`, file JSONL sesi, `cron/runs/*.jsonl`,
dan log file rolling di bawah `/tmp/openclaw/`.

### Helper shell (opsional)

Untuk mempermudah pengelolaan Docker sehari-hari, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agen untuk gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Path socket kustom (mis. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrip hanya me-mount `docker.sock` setelah prasyarat sandbox lolos. Jika
    setup sandbox tidak dapat diselesaikan, skrip akan mereset `agents.defaults.sandbox.mode`
    ke `off`.

  </Accordion>

  <Accordion title="Otomatisasi / CI (non-interaktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` sehingga
    perintah CLI dapat menjangkau gateway melalui `127.0.0.1`. Perlakukan ini sebagai
    batas kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-cli`.
  </Accordion>

  <Accordion title="Izin dan EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat error izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Build ulang lebih cepat">
    Urutkan Dockerfile Anda agar layer dependensi di-cache. Ini menghindari menjalankan ulang
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

  <Accordion title="Opsi container untuk power-user">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk container yang
    lebih lengkap fiturnya:

    1. **Persist `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bake dependensi sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persist unduhan browser**: setel
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Jika Anda memilih OAuth OpenAI Codex di wizard, wizard akan membuka URL browser. Dalam
    Docker atau penyiapan headless, salin URL redirect lengkap tempat Anda mendarat dan tempelkan
    kembali ke wizard untuk menyelesaikan autentikasi.
  </Accordion>

  <Accordion title="Metadata base image">
    Image Docker utama menggunakan `node:24-bookworm` dan memublikasikan anotasi base-image OCI
    termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Lihat
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Menjalankan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Docker VM Runtime](/id/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk baking binary, persistensi, dan pembaruan.

## Sandbox Agen

Ketika `agents.defaults.sandbox` diaktifkan dengan backend Docker, gateway
menjalankan eksekusi tool agen (shell, baca/tulis file, dll.) di dalam container Docker terisolasi
sementara gateway sendiri tetap berada di host. Ini memberi Anda dinding keras
di sekitar sesi agen yang tidak tepercaya atau multi-tenant tanpa meng-container-kan seluruh
gateway.

Cakupan sandbox bisa per-agen (default), per-sesi, atau bersama. Setiap cakupan
mendapat workspace sendiri yang di-mount di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan allow/deny tool, isolasi jaringan, batas sumber daya, dan container
browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profile multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke container sandbox
- [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) -- override per agen

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
  <Accordion title="Image hilang atau container sandbox tidak mau mulai">
    Build image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    atau setel `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Container dibuat otomatis per sesi sesuai permintaan.
  </Accordion>

  <Accordion title="Error izin di sandbox">
    Setel `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang di-mount,
    atau lakukan chown pada folder workspace.
  </Accordion>

  <Accordion title="Tool kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang memuat
    `/etc/profile` dan dapat mereset PATH. Setel `docker.env.PATH` untuk menambahkan
    path tool kustom Anda di depan, atau tambahkan skrip di bawah `/etc/profile.d/`
    dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="OOM-killed selama build image (exit 137)">
    VM memerlukan setidaknya 2 GB RAM. Gunakan kelas mesin yang lebih besar lalu coba lagi.
  </Accordion>

  <Accordion title="Unauthorized atau pairing required di Control UI">
    Ambil tautan dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail lebih lanjut: [Dashboard](/id/web/dashboard), [Devices](/id/cli/devices).

  </Accordion>

  <Accordion title="Target gateway menampilkan ws://172.x.x.x atau error pairing dari Docker CLI">
    Reset mode dan bind gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar Instalasi](/id/install) — semua metode instalasi
- [Podman](/id/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/id/install/clawdock) — penyiapan komunitas Docker Compose
- [Updating](/id/install/updating) — menjaga OpenClaw tetap terbaru
- [Configuration](/id/gateway/configuration) — konfigurasi gateway setelah instalasi

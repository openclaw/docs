---
read_when:
    - Anda menginginkan gateway dalam container alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan onboarding OpenClaw berbasis Docker opsional
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:32:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan gateway dalam container atau ingin memvalidasi alur Docker.

## Apakah Docker cocok untuk saya?

- **Ya**: Anda menginginkan environment gateway yang terisolasi dan mudah dibuang atau ingin menjalankan OpenClaw pada host tanpa instalasi lokal.
- **Tidak**: Anda menjalankannya di mesin sendiri dan hanya menginginkan dev loop tercepat. Gunakan alur instalasi normal.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- Minimal RAM 2 GB untuk build image (`pnpm install` dapat dihentikan karena OOM pada host 1 GB dengan exit 137)
- Cukup ruang disk untuk image dan log
- Jika berjalan pada VPS/host publik, tinjau
  [Hardening keamanan untuk eksposur jaringan](/id/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam container

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan script setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image gateway secara lokal. Untuk menggunakan image yang sudah dibangun sebelumnya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image bawaan dipublikasikan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (misalnya `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Script setup menjalankan onboarding secara otomatis. Script akan:

    - meminta API key provider
    - membuat token gateway dan menuliskannya ke `.env`
    - memulai gateway melalui Docker Compose

    Selama setup, onboarding pra-start dan penulisan config dijalankan melalui
    `openclaw-gateway` secara langsung. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    container gateway sudah ada.

  </Step>

  <Step title="Buka Control UI">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan
    shared secret yang dikonfigurasi ke Settings. Script setup menulis token ke `.env` secara
    default; jika Anda mengganti config container ke auth password, gunakan
    password tersebut.

    Perlu URL lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan channel (opsional)">
    Gunakan container CLI untuk menambahkan channel pesan:

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

Jika Anda lebih memilih menjalankan setiap langkah sendiri alih-alih menggunakan script setup:

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
atau `OPENCLAW_HOME_VOLUME`, script setup menulis `docker-compose.extra.yml`;
sertakan dengan `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, itu adalah
tool pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan config waktu setup melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel environment

Script setup menerima variabel environment opsional berikut:

| Variabel                                   | Tujuan                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Gunakan image remote alih-alih membangun secara lokal           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instal paket apt tambahan saat build (dipisahkan spasi)         |
| `OPENCLAW_EXTENSIONS`                      | Pra-instal dependensi Plugin saat build (nama dipisahkan spasi) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host tambahan (dipisahkan koma `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Persistenkan `/home/node` dalam volume Docker bernama           |
| `OPENCLAW_SANDBOX`                         | Opt in ke bootstrap sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`                   | Timpa path socket Docker                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | Nonaktifkan advertising Bonjour/mDNS (default `1` untuk Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Nonaktifkan bundled plugin source bind-mount overlays           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP khusus sinyal untuk trace, metric, atau log       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override protokol OTLP. Saat ini hanya `http/protobuf` yang didukung |
| `OTEL_SERVICE_NAME`                        | Nama layanan yang digunakan untuk resource OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Opt in ke atribut semantik GenAI eksperimental terbaru          |
| `OPENCLAW_OTEL_PRELOADED`                  | Lewati memulai SDK OpenTelemetry kedua saat satu sudah dimuat   |

Maintainer dapat menguji source Plugin bawaan terhadap image yang dipaketkan dengan me-mount
satu direktori source Plugin di atas path source yang dipaketkan, misalnya
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Direktori source yang di-mount tersebut menimpa bundle terkompilasi
`/app/dist/extensions/synology-chat` yang cocok untuk ID Plugin yang sama.

### Observabilitas

Ekspor OpenTelemetry bersifat outbound dari container Gateway ke kolektor OTLP
Anda. Ini tidak memerlukan port Docker yang dipublikasikan. Jika Anda membangun image
secara lokal dan ingin exporter OpenTelemetry bawaan tersedia di dalam image,
sertakan dependensi runtime-nya:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Image rilis Docker resmi OpenClaw menyertakan source Plugin
`diagnostics-otel` bawaan. Tergantung pada image dan status cache, Gateway
mungkin masih men-stage dependensi runtime OpenTelemetry lokal Plugin saat
Plugin diaktifkan pertama kali, jadi izinkan boot pertama itu menjangkau registry paket
atau prewarm image di lane rilis Anda. Untuk mengaktifkan ekspor, izinkan dan
aktifkan Plugin `diagnostics-otel` di config, lalu atur
`diagnostics.otel.enabled=true` atau gunakan contoh config di
[Ekspor OpenTelemetry](/id/gateway/opentelemetry). Header auth kolektor
dikonfigurasi melalui `diagnostics.otel.headers`, bukan melalui variabel
environment Docker.

Metric Prometheus menggunakan port Gateway yang sudah dipublikasikan. Aktifkan
Plugin `diagnostics-prometheus`, lalu scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rute ini dilindungi oleh autentikasi Gateway. Jangan mengekspos port `/metrics`
publik terpisah atau path reverse-proxy tanpa autentikasi. Lihat
[Metric Prometheus](/id/gateway/prometheus).

### Pemeriksaan health

Endpoint probe container (tidak memerlukan auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker menyertakan `HEALTHCHECK` bawaan yang melakukan ping ke `/healthz`.
Jika pemeriksaan terus gagal, Docker menandai container sebagai `unhealthy` dan
sistem orkestrasi dapat me-restart atau menggantinya.

Snapshot deep health yang diautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` secara default menggunakan `OPENCLAW_GATEWAY_BIND=lan` sehingga akses host ke
`http://127.0.0.1:18789` berfungsi dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat menjangkau port gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan container yang dapat menjangkau
  gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Bonjour / mDNS

Docker bridge networking biasanya tidak meneruskan multicast Bonjour/mDNS
(`224.0.0.251:5353`) secara andal. Oleh karena itu, penyiapan Compose bawaan secara default menggunakan
`OPENCLAW_DISABLE_BONJOUR=1` agar Gateway tidak crash-loop atau berulang kali
memulai ulang advertising saat bridge membuang trafik multicast.

Gunakan URL Gateway yang dipublikasikan, Tailscale, atau DNS-SD wide-area untuk host Docker.
Atur `OPENCLAW_DISABLE_BONJOUR=0` hanya saat berjalan dengan host networking, macvlan,
atau jaringan lain tempat mDNS multicast diketahui berfungsi.

Untuk gotcha dan pemecahan masalah, lihat [Penemuan Bonjour](/id/gateway/bonjour).

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
tetap bertahan setelah penggantian container.

Direktori config yang di-mount itulah tempat OpenClaw menyimpan:

- `openclaw.json` untuk config perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk auth OAuth/API-key provider yang disimpan
- `.env` untuk secret runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Untuk detail persistensi lengkap pada deployment VM, lihat
[Docker VM Runtime - Apa yang persisten dan lokasinya](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** pantau `media/`, file JSONL sesi, `cron/runs/*.jsonl`,
dan rolling file log di bawah `/tmp/openclaw/`.

### Helper shell (opsional)

Untuk memudahkan pengelolaan Docker sehari-hari, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agent untuk gateway Docker">
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
    setup sandbox tidak dapat diselesaikan, script mereset `agents.defaults.sandbox.mode`
    menjadi `off`.

  </Accordion>

  <Accordion title="Otomatisasi / CI (noninteraktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` sehingga
    perintah CLI dapat menjangkau gateway melalui `127.0.0.1`. Perlakukan ini sebagai
    batas kepercayaan bersama. Config compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
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

  <Accordion title="Opsi container untuk power user">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk container yang
    lebih kaya fitur:

    1. **Persistenkan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bake dependensi sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistenkan unduhan browser**: atur
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, wizard akan membuka URL browser. Dalam
    penyiapan Docker atau headless, salin URL redirect lengkap tempat Anda mendarat lalu tempelkan
    kembali ke wizard untuk menyelesaikan auth.
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
termasuk binary baking, persistensi, dan pembaruan.

## Agent Sandbox

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, gateway
menjalankan eksekusi tool agent (shell, baca/tulis file, dll.) di dalam container Docker
yang terisolasi sementara gateway itu sendiri tetap berada di host. Ini memberi Anda batas keras
di sekitar sesi agent yang tidak tepercaya atau multi-tenant tanpa meng-container-kan seluruh
gateway.

Cakupan sandbox dapat per-agent (default), per-session, atau shared. Setiap cakupan
mendapat workspace sendiri yang di-mount di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan allow/deny tool, isolasi jaringan, batas resource, dan
container browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agent, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke container sandbox
- [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agent

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

Bangun image sandbox default:

```bash
scripts/sandbox-setup.sh
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image hilang atau container sandbox tidak mulai">
    Bangun image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    atau atur `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Container dibuat otomatis per sesi sesuai kebutuhan.
  </Accordion>

  <Accordion title="Error izin di sandbox">
    Atur `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang di-mount,
    atau lakukan chown pada folder workspace.
  </Accordion>

  <Accordion title="Tool kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang me-source
    `/etc/profile` dan dapat mereset PATH. Atur `docker.env.PATH` untuk menambahkan
    path tool kustom Anda di depan, atau tambahkan script di bawah `/etc/profile.d/` di Dockerfile Anda.
  </Accordion>

  <Accordion title="Terkena OOM saat build image (exit 137)">
    VM memerlukan setidaknya 2 GB RAM. Gunakan kelas mesin yang lebih besar lalu coba lagi.
  </Accordion>

  <Accordion title="Unauthorized atau pairing required di Control UI">
    Ambil link dashboard baru dan setujui perangkat browser:

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

- [Install Overview](/id/install) — semua metode instalasi
- [Podman](/id/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/id/install/clawdock) — penyiapan komunitas Docker Compose
- [Updating](/id/install/updating) — menjaga OpenClaw tetap terbaru
- [Configuration](/id/gateway/configuration) — konfigurasi gateway setelah instalasi

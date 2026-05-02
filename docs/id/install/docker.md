---
read_when:
    - Anda menginginkan Gateway berbasis container alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan orientasi awal opsional berbasis Docker untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T09:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan Gateway berbasis kontainer atau ingin memvalidasi alur Docker.

## Apakah Docker tepat untuk saya?

- **Ya**: Anda menginginkan lingkungan Gateway yang terisolasi dan sekali pakai, atau ingin menjalankan OpenClaw di host tanpa instalasi lokal.
- **Tidak**: Anda menjalankannya di mesin sendiri dan hanya menginginkan loop pengembangan tercepat. Gunakan alur instalasi normal sebagai gantinya.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh Gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- RAM minimal 2 GB untuk build image (`pnpm install` dapat dihentikan karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Pengerasan keamanan untuk paparan jaringan](/id/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway berbasis kontainer

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image Gateway secara lokal. Untuk menggunakan image pra-build sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image pra-build diterbitkan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (mis. `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip setup menjalankan onboarding secara otomatis. Skrip tersebut akan:

    - meminta kunci API penyedia
    - menghasilkan token Gateway dan menuliskannya ke `.env`
    - memulai Gateway melalui Docker Compose

    Selama setup, onboarding pra-start dan penulisan konfigurasi berjalan langsung melalui
    `openclaw-gateway`. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    kontainer Gateway sudah ada.

  </Step>

  <Step title="Buka UI Kontrol">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempel secret bersama yang telah dikonfigurasi
    ke Settings. Skrip setup menulis token ke `.env` secara default; jika Anda mengganti konfigurasi
    kontainer ke autentikasi kata sandi, gunakan kata sandi tersebut sebagai gantinya.

    Perlu URL-nya lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasi channel (opsional)">
    Gunakan kontainer CLI untuk menambahkan channel pesan:

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

Jika Anda lebih suka menjalankan setiap langkah sendiri daripada menggunakan skrip setup:

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
atau `OPENCLAW_HOME_VOLUME`, skrip setup menulis `docker-compose.extra.yml`;
sertakan dengan `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, alat ini adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat setup melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel lingkungan

Skrip setup menerima variabel lingkungan opsional berikut:

| Variabel                                   | Tujuan                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Gunakan image jarak jauh alih-alih membangun secara lokal       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Instal paket apt tambahan selama build (dipisahkan spasi)       |
| `OPENCLAW_EXTENSIONS`                      | Sertakan helper Plugin bundel terpilih saat build               |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host tambahan (dipisahkan koma `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Pertahankan `/home/node` dalam volume Docker bernama            |
| `OPENCLAW_SANDBOX`                         | Ikut serta dalam bootstrap sandbox (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_SKIP_ONBOARDING`                 | Lewati langkah onboarding interaktif (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Timpa path socket Docker                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | Nonaktifkan iklan Bonjour/mDNS (default ke `1` untuk Docker)    |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Nonaktifkan overlay bind-mount source Plugin bundel             |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP khusus sinyal untuk trace, metrik, atau log       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override protokol OTLP. Hanya `http/protobuf` yang didukung saat ini |
| `OTEL_SERVICE_NAME`                        | Nama layanan yang digunakan untuk resource OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Ikut serta dalam atribut semantik GenAI eksperimental terbaru   |
| `OPENCLAW_OTEL_PRELOADED`                  | Lewati memulai SDK OpenTelemetry kedua saat satu SDK sudah dipra-muat |

Maintainer dapat menguji source Plugin bundel terhadap image terpaketkan dengan memasang
satu direktori source Plugin di atas path source terpaketkannya, misalnya
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Direktori source yang dipasang tersebut menimpa bundle
`/app/dist/extensions/synology-chat` terkompilasi yang cocok untuk id Plugin yang sama.

### Observabilitas

Ekspor OpenTelemetry bersifat outbound dari kontainer Gateway ke kolektor OTLP
Anda. Ini tidak memerlukan port Docker yang diterbitkan. Jika Anda membangun image
secara lokal dan ingin eksportir OpenTelemetry bundel tersedia di dalam image,
sertakan dependensi runtime-nya:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instal Plugin resmi `@openclaw/diagnostics-otel` dalam instalasi Docker terpaketkan
sebelum mengaktifkan ekspor. Image kustom yang dibangun dari source tetap dapat menyertakan
source Plugin lokal dengan `OPENCLAW_EXTENSIONS=diagnostics-otel`. Untuk mengaktifkan
ekspor, izinkan dan aktifkan Plugin `diagnostics-otel` di konfigurasi, lalu setel
`diagnostics.otel.enabled=true` atau gunakan contoh konfigurasi di [ekspor OpenTelemetry](/id/gateway/opentelemetry).
Header autentikasi kolektor dikonfigurasi melalui
`diagnostics.otel.headers`, bukan melalui variabel lingkungan Docker.

Metrik Prometheus menggunakan port Gateway yang sudah diterbitkan. Aktifkan
Plugin `diagnostics-prometheus`, lalu scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rute ini dilindungi oleh autentikasi Gateway. Jangan mengekspos port `/metrics`
publik terpisah atau path reverse-proxy tanpa autentikasi. Lihat
[Metrik Prometheus](/id/gateway/prometheus).

### Pemeriksaan kesehatan

Endpoint probe kontainer (tidak memerlukan autentikasi):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker menyertakan `HEALTHCHECK` bawaan yang melakukan ping ke `/healthz`.
Jika pemeriksaan terus gagal, Docker menandai kontainer sebagai `unhealthy` dan
sistem orkestrasi dapat memulai ulang atau menggantinya.

Snapshot kesehatan mendalam yang terautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` menetapkan default `OPENCLAW_GATEWAY_BIND=lan` sehingga akses host ke
`http://127.0.0.1:18789` berfungsi dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat menjangkau port Gateway yang diterbitkan.
- `loopback`: hanya proses di dalam namespace jaringan kontainer yang dapat menjangkau
  Gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Penyedia Lokal Host

Saat OpenClaw berjalan di Docker, `127.0.0.1` di dalam kontainer adalah kontainer
itu sendiri, bukan mesin host Anda. Gunakan `host.docker.internal` untuk penyedia AI yang
berjalan di host:

| Penyedia  | URL default host         | URL setup Docker                   |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Setup Docker bundel menggunakan URL host tersebut sebagai default onboarding
LM Studio dan Ollama, dan `docker-compose.yml` memetakan `host.docker.internal` ke
Gateway host Docker untuk Docker Engine Linux. Docker Desktop sudah menyediakan
nama host yang sama di macOS dan Windows.

Layanan host juga harus mendengarkan pada alamat yang dapat dijangkau dari Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jika Anda menggunakan file Compose sendiri atau perintah `docker run`, tambahkan mapping host
yang sama sendiri, misalnya
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Jaringan bridge Docker biasanya tidak meneruskan multicast Bonjour/mDNS
(`224.0.0.251:5353`) secara andal. Karena itu, setup Compose bundel menetapkan default
`OPENCLAW_DISABLE_BONJOUR=1` agar Gateway tidak mengalami crash-loop atau berulang kali
memulai ulang iklan saat bridge membuang traffic multicast.

Gunakan URL Gateway yang diterbitkan, Tailscale, atau DNS-SD wide-area untuk host Docker.
Setel `OPENCLAW_DISABLE_BONJOUR=0` hanya saat berjalan dengan jaringan host, macvlan,
atau jaringan lain tempat multicast mDNS diketahui berfungsi.

Untuk kendala umum dan pemecahan masalah, lihat [penemuan Bonjour](/id/gateway/bonjour).

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
bertahan setelah penggantian kontainer. Saat salah satu variabel tidak disetel, file
`docker-compose.yml` bundel fallback ke `${HOME}/.openclaw` (dan
`${HOME}/.openclaw/workspace` untuk mount workspace), atau `/tmp/.openclaw`
saat `HOME` sendiri juga tidak ada. Ini mencegah `docker compose up`
menghasilkan spesifikasi volume dengan source kosong pada lingkungan bare.

Direktori konfigurasi yang dipasang tersebut adalah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/kunci API penyedia yang disimpan
- `.env` untuk secret runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Plugin unduhan yang terinstal menyimpan status paketnya di bawah home OpenClaw
yang dipasang, sehingga catatan instalasi Plugin dan root paket bertahan setelah
penggantian kontainer. Startup Gateway tidak menghasilkan pohon dependensi Plugin bundel.

Untuk detail persistensi lengkap pada deployment VM, lihat
[Docker VM Runtime - Apa yang bertahan di mana](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** pantau `media/`, file JSONL sesi,
`cron/runs/*.jsonl`, root paket plugin terinstal, dan log file bergulir
di bawah `/tmp/openclaw/`.

### Pembantu shell (opsional)

Untuk pengelolaan Docker harian yang lebih mudah, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file pembantu lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dan seterusnya. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan pembantu lengkap.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Path soket kustom (mis. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrip memasang `docker.sock` hanya setelah prasyarat sandbox lolos. Jika
    penyiapan sandbox tidak dapat selesai, skrip mereset `agents.defaults.sandbox.mode`
    ke `off`.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` agar perintah
    CLI dapat menjangkau Gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas
    kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat kesalahan izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    Urutkan Dockerfile Anda agar layer dependensi tersimpan dalam cache. Ini menghindari menjalankan ulang
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

  <Accordion title="Power-user container options">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk container yang lebih
    lengkap fiturnya:

    1. **Pertahankan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Masukkan dependensi sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Pertahankan unduhan browser**: tetapkan
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, itu membuka URL browser. Dalam
    Docker atau penyiapan headless, salin URL redirect lengkap tempat Anda mendarat dan tempelkan
    kembali ke wizard untuk menyelesaikan auth.
  </Accordion>

  <Accordion title="Base image metadata">
    Image runtime Docker utama menggunakan `node:24-bookworm-slim` dan menerbitkan anotasi
    base-image OCI termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Digest basis Node
    disegarkan melalui PR base-image Docker Dependabot; build rilis tidak menjalankan
    layer peningkatan distro. Lihat
    [anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Berjalan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Docker VM Runtime](/id/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk pembuatan biner di dalam image, persistensi, dan pembaruan.

## Sandbox agen

Ketika `agents.defaults.sandbox` diaktifkan dengan backend Docker, Gateway
menjalankan eksekusi tool agen (shell, baca/tulis file, dll.) di dalam container Docker
terisolasi sementara Gateway itu sendiri tetap berada di host. Ini memberi Anda dinding keras
di sekitar sesi agen yang tidak tepercaya atau multi-tenant tanpa mengontainerkan seluruh
Gateway.

Cakupan sandbox dapat berupa per-agen (default), per-sesi, atau bersama. Setiap cakupan
mendapatkan workspace sendiri yang dipasang di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan tool allow/deny, isolasi jaringan, batas sumber daya, dan container
browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke container sandbox
- [Multi-Agent Sandbox and Tools](/id/tools/multi-agent-sandbox-tools) -- override per-agen

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

Build image sandbox default (dari checkout sumber):

```bash
scripts/sandbox-setup.sh
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` inline.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Build image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout sumber) atau perintah `docker build` inline dari [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) (instalasi npm),
    atau tetapkan `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Container dibuat otomatis per sesi sesuai kebutuhan.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Tetapkan `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang Anda mount,
    atau chown folder workspace.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (shell login), yang memuat
    `/etc/profile` dan dapat mereset PATH. Tetapkan `docker.env.PATH` untuk menambahkan
    path tool kustom Anda di awal, atau tambahkan skrip di bawah `/etc/profile.d/` dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM membutuhkan RAM minimal 2 GB. Gunakan kelas mesin yang lebih besar dan coba lagi.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Ambil tautan dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail selengkapnya: [Dashboard](/id/web/dashboard), [Perangkat](/id/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Reset mode dan bind Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan Instalasi](/id/install) — semua metode instalasi
- [Podman](/id/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/id/install/clawdock) — penyiapan komunitas Docker Compose
- [Pembaruan](/id/install/updating) — menjaga OpenClaw tetap mutakhir
- [Konfigurasi](/id/gateway/configuration) — konfigurasi Gateway setelah instalasi

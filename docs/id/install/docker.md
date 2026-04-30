---
read_when:
    - Anda menginginkan Gateway terkontainerisasi alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan orientasi awal berbasis Docker opsional untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-30T09:55:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan Gateway dalam kontainer atau ingin memvalidasi alur Docker.

## Apakah Docker tepat untuk saya?

- **Ya**: Anda menginginkan lingkungan Gateway yang terisolasi dan sekali pakai, atau ingin menjalankan OpenClaw di host tanpa instalasi lokal.
- **Tidak**: Anda menjalankan di mesin sendiri dan hanya menginginkan loop pengembangan tercepat. Gunakan alur instalasi normal sebagai gantinya.
- **Catatan sandboxing**: backend sandbox bawaan menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh Gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- Minimal 2 GB RAM untuk build image (`pnpm install` dapat dihentikan karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Penguatan keamanan untuk paparan jaringan](/id/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam kontainer

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini mem-build image Gateway secara lokal. Untuk menggunakan image yang sudah dibuat sebelumnya sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image yang sudah dibuat sebelumnya dipublikasikan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (misalnya `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip setup menjalankan onboarding secara otomatis. Skrip ini akan:

    - meminta kunci API provider
    - membuat token Gateway dan menulisnya ke `.env`
    - memulai Gateway melalui Docker Compose

    Selama setup, onboarding pra-start dan penulisan konfigurasi dijalankan
    langsung melalui `openclaw-gateway`. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    kontainer Gateway sudah ada.

  </Step>

  <Step title="Buka UI Kontrol">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan
    rahasia bersama yang dikonfigurasi ke Settings. Skrip setup menulis token ke `.env` secara
    default; jika Anda mengganti konfigurasi kontainer ke autentikasi sandi, gunakan
    sandi tersebut sebagai gantinya.

    Perlu URL-nya lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan channel (opsional)">
    Gunakan kontainer CLI untuk menambahkan channel pesan:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Docs: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

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
Karena `openclaw-cli` berbagi namespace jaringan `openclaw-gateway`, ini adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat setup melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel lingkungan

Skrip setup menerima variabel lingkungan opsional berikut:

| Variabel                                   | Tujuan                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Menggunakan image jarak jauh alih-alih mem-build secara lokal   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Menginstal paket apt tambahan selama build (dipisahkan spasi)   |
| `OPENCLAW_EXTENSIONS`                      | Pra-instal dependensi Plugin saat build (nama dipisahkan spasi) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host tambahan (`source:target[:opts]` dipisahkan koma) |
| `OPENCLAW_HOME_VOLUME`                     | Mempertahankan `/home/node` dalam volume Docker bernama         |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Path kontainer untuk dependensi dan mirror Plugin bundel yang dihasilkan |
| `OPENCLAW_SANDBOX`                         | Ikut serta dalam bootstrap sandbox (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_SKIP_ONBOARDING`                 | Melewati langkah onboarding interaktif (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Menimpa path soket Docker                                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | Menonaktifkan iklan Bonjour/mDNS (default ke `1` untuk Docker)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Menonaktifkan overlay bind-mount sumber Plugin bundel           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP khusus sinyal untuk trace, metrik, atau log       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override protokol OTLP. Hanya `http/protobuf` yang didukung saat ini |
| `OTEL_SERVICE_NAME`                        | Nama layanan yang digunakan untuk resource OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Ikut serta dalam atribut semantik GenAI eksperimental terbaru   |
| `OPENCLAW_OTEL_PRELOADED`                  | Melewati pemulaian SDK OpenTelemetry kedua saat sudah ada yang dimuat sebelumnya |

Maintainer dapat menguji sumber Plugin bundel terhadap image paket dengan me-mount
satu direktori sumber Plugin di atas path sumber paketnya, misalnya
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Direktori sumber yang di-mount tersebut menimpa bundel
`/app/dist/extensions/synology-chat` terkompilasi yang sesuai untuk id Plugin yang sama.

### Observabilitas

Ekspor OpenTelemetry bersifat keluar dari kontainer Gateway ke kolektor OTLP
Anda. Ini tidak memerlukan port Docker yang dipublikasikan. Jika Anda mem-build image
secara lokal dan ingin eksportir OpenTelemetry bundel tersedia di dalam image,
sertakan dependensi runtime-nya:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Image rilis Docker OpenClaw resmi menyertakan sumber Plugin
`diagnostics-otel` bundel. Bergantung pada image dan status cache,
Gateway mungkin masih melakukan stage dependensi runtime OpenTelemetry lokal Plugin
saat pertama kali Plugin diaktifkan, jadi izinkan boot pertama itu menjangkau registry
paket atau prewarm image di lane rilis Anda. Untuk mengaktifkan ekspor, izinkan dan
aktifkan Plugin `diagnostics-otel` di konfigurasi, lalu set
`diagnostics.otel.enabled=true` atau gunakan contoh konfigurasi di
[Ekspor OpenTelemetry](/id/gateway/opentelemetry). Header autentikasi kolektor
dikonfigurasi melalui `diagnostics.otel.headers`, bukan melalui variabel lingkungan
Docker.

Metrik Prometheus menggunakan port Gateway yang sudah dipublikasikan. Aktifkan
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

Snapshot kesehatan mendalam terautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` menetapkan default `OPENCLAW_GATEWAY_BIND=lan` sehingga akses host ke
`http://127.0.0.1:18789` berfungsi dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat menjangkau port Gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan kontainer yang dapat menjangkau
  Gateway secara langsung.

<Note>
Gunakan nilai mode bind di `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Provider Lokal Host

Saat OpenClaw berjalan di Docker, `127.0.0.1` di dalam kontainer adalah kontainer
itu sendiri, bukan mesin host Anda. Gunakan `host.docker.internal` untuk provider AI yang
berjalan di host:

| Provider  | URL default host         | URL setup Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Setup Docker bundel menggunakan URL host tersebut sebagai default onboarding
LM Studio dan Ollama, dan `docker-compose.yml` memetakan `host.docker.internal` ke
Gateway host Docker untuk Linux Docker Engine. Docker Desktop sudah menyediakan
hostname yang sama di macOS dan Windows.

Layanan host juga harus mendengarkan di alamat yang dapat dijangkau dari Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jika Anda menggunakan file Compose sendiri atau perintah `docker run`, tambahkan sendiri
mapping host yang sama, misalnya
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Jaringan bridge Docker biasanya tidak meneruskan multicast Bonjour/mDNS
(`224.0.0.251:5353`) secara andal. Karena itu, setup Compose bundel menetapkan default
`OPENCLAW_DISABLE_BONJOUR=1` agar Gateway tidak crash-loop atau berulang kali
memulai ulang iklan saat bridge menjatuhkan lalu lintas multicast.

Gunakan URL Gateway yang dipublikasikan, Tailscale, atau DNS-SD area luas untuk host Docker.
Set `OPENCLAW_DISABLE_BONJOUR=0` hanya saat berjalan dengan jaringan host, macvlan,
atau jaringan lain tempat multicast mDNS diketahui berfungsi.

Untuk gotcha dan pemecahan masalah, lihat [Penemuan Bonjour](/id/gateway/bonjour).

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw` dan
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, sehingga path tersebut
bertahan saat kontainer diganti. Saat salah satu variabel tidak diset, file
`docker-compose.yml` bundel kembali ke `${HOME}/.openclaw` (dan
`${HOME}/.openclaw/workspace` untuk mount workspace), atau `/tmp/.openclaw`
saat `HOME` sendiri juga hilang. Ini mencegah `docker compose up`
mengeluarkan spesifikasi volume sumber kosong di lingkungan dasar.

Direktori konfigurasi yang di-mount tersebut adalah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/kunci API provider yang tersimpan
- `.env` untuk rahasia runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Dependensi runtime Plugin bawaan dan berkas runtime yang dicerminkan adalah state
yang dihasilkan, bukan konfigurasi pengguna. Compose menyimpannya di volume Docker
bernama `openclaw-plugin-runtime-deps` yang dipasang di
`/var/lib/openclaw/plugin-runtime-deps`. Menjaga tree dengan perubahan tinggi itu di luar
bind mount konfigurasi host menghindari operasi berkas Docker Desktop/WSL yang lambat dan handle
Windows yang usang selama startup dingin Gateway.

Berkas Compose default menetapkan `OPENCLAW_PLUGIN_STAGE_DIR` ke path tersebut untuk
`openclaw-gateway` dan `openclaw-cli`, sehingga `openclaw doctor --fix`, perintah
login/setup channel, dan startup Gateway semuanya menggunakan volume runtime
yang dihasilkan yang sama.

Untuk detail persistensi lengkap pada deployment VM, lihat
[Docker VM Runtime - Apa yang bertahan di mana](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** pantau `media/`, berkas JSONL sesi, `cron/runs/*.jsonl`,
volume Docker `openclaw-plugin-runtime-deps`, dan log berkas bergulir di bawah
`/tmp/openclaw/`.

### Helper shell (opsional)

Untuk pengelolaan Docker harian yang lebih mudah, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan kembali perintah instalasi di atas agar berkas helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agen untuk Gateway Docker">
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

    Skrip memasang `docker.sock` hanya setelah prasyarat sandbox lulus. Jika
    setup sandbox tidak dapat diselesaikan, skrip mereset `agents.defaults.sandbox.mode`
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
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` sehingga perintah
    CLI dapat menjangkau Gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas
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

  <Accordion title="Rebuild lebih cepat">
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

  <Accordion title="Opsi kontainer pengguna mahir">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk kontainer yang lebih
    berfitur lengkap:

    1. **Persistenkan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bake dependensi sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Instal browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistenkan unduhan browser**: tetapkan
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` dan gunakan
       `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, itu akan membuka URL browser. Dalam
    Docker atau setup headless, salin URL pengalihan lengkap tempat Anda tiba dan tempelkan
    kembali ke wizard untuk menyelesaikan autentikasi.
  </Accordion>

  <Accordion title="Metadata image dasar">
    Image runtime Docker utama menggunakan `node:24-bookworm-slim` dan menerbitkan anotasi OCI
    base-image termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Digest dasar Node
    diperbarui melalui PR Dependabot Docker base-image; build rilis tidak menjalankan
    layer upgrade distro. Lihat
    [Anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Berjalan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Docker VM Runtime](/id/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk binary baking, persistensi, dan pembaruan.

## Sandbox agen

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, Gateway
menjalankan eksekusi tool agen (shell, baca/tulis berkas, dll.) di dalam kontainer Docker
terisolasi sementara Gateway itu sendiri tetap berada di host. Ini memberi Anda dinding keras
di sekitar sesi agen tidak tepercaya atau multi-tenant tanpa memasukkan seluruh
Gateway ke dalam kontainer.

Cakupan sandbox dapat per-agen (default), per-sesi, atau bersama. Setiap cakupan
mendapat workspace-nya sendiri yang dipasang di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan allow/deny tool, isolasi jaringan, batas sumber daya, dan kontainer
browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke kontainer sandbox
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

Build image sandbox default:

```bash
scripts/sandbox-setup.sh
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image hilang atau kontainer sandbox tidak dimulai">
    Build image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    atau tetapkan `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Kontainer dibuat otomatis per sesi sesuai permintaan.
  </Accordion>

  <Accordion title="Error izin di sandbox">
    Tetapkan `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang Anda mount,
    atau chown folder workspace.
  </Accordion>

  <Accordion title="Tool kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang mengambil sumber
    `/etc/profile` dan dapat mereset PATH. Tetapkan `docker.env.PATH` untuk menambahkan path
    tool kustom Anda di depan, atau tambahkan skrip di bawah `/etc/profile.d/` di Dockerfile Anda.
  </Accordion>

  <Accordion title="OOM-killed selama build image (exit 137)">
    VM memerlukan RAM setidaknya 2 GB. Gunakan kelas mesin yang lebih besar dan coba lagi.
  </Accordion>

  <Accordion title="Tidak terotorisasi atau pairing diperlukan di Control UI">
    Ambil link dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail selengkapnya: [Dashboard](/id/web/dashboard), [Devices](/id/cli/devices).

  </Accordion>

  <Accordion title="Target Gateway menampilkan ws://172.x.x.x atau error pairing dari Docker CLI">
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
- [ClawDock](/id/install/clawdock) — setup komunitas Docker Compose
- [Memperbarui](/id/install/updating) — menjaga OpenClaw tetap mutakhir
- [Konfigurasi](/id/gateway/configuration) — konfigurasi Gateway setelah instalasi

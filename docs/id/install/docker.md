---
read_when:
    - Anda menginginkan Gateway berbasis kontainer alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan orientasi awal berbasis Docker opsional untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan Gateway berbasis kontainer atau ingin memvalidasi alur Docker.

## Apakah Docker tepat untuk saya?

- **Ya**: Anda menginginkan lingkungan Gateway yang terisolasi dan sekali pakai, atau ingin menjalankan OpenClaw pada host tanpa instalasi lokal.
- **Tidak**: Anda menjalankan di mesin sendiri dan hanya menginginkan loop pengembangan tercepat. Gunakan alur instalasi normal sebagai gantinya.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker saat sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh Gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- RAM minimal 2 GB untuk build image (`pnpm install` dapat dihentikan karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Pengerasan keamanan untuk eksposur jaringan](/id/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway berbasis kontainer

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip setup:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image Gateway secara lokal. Untuk menggunakan image yang sudah dibuat sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image yang sudah dibuat diterbitkan di
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag umum: `main`, `latest`, `<version>` (mis. `2026.2.26`).

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip setup menjalankan onboarding secara otomatis. Skrip ini akan:

    - meminta kunci API penyedia
    - menghasilkan token Gateway dan menulisnya ke `.env`
    - membuat direktori kunci rahasia auth-profile
    - memulai Gateway melalui Docker Compose

    Selama setup, onboarding pra-start dan penulisan konfigurasi berjalan langsung melalui
    `openclaw-gateway`. `openclaw-cli` digunakan untuk perintah yang Anda jalankan setelah
    kontainer Gateway sudah ada.

  </Step>

  <Step title="Buka UI Kontrol">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempelkan rahasia bersama yang dikonfigurasi
    ke Settings. Skrip setup menulis token ke `.env` secara default; jika Anda mengganti konfigurasi
    kontainer ke autentikasi kata sandi, gunakan kata sandi tersebut sebagai gantinya.

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

    Dokumen: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

  </Step>
</Steps>

### Alur manual

Jika Anda lebih memilih menjalankan setiap langkah sendiri alih-alih menggunakan skrip setup:

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
| `OPENCLAW_IMAGE`                           | Menggunakan image jarak jauh alih-alih membangun secara lokal   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Menginstal paket apt tambahan selama build (dipisahkan spasi)   |
| `OPENCLAW_EXTENSIONS`                      | Menyertakan pembantu plugin bawaan tertentu saat build          |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host tambahan (`source:target[:opts]` dipisahkan koma) |
| `OPENCLAW_HOME_VOLUME`                     | Mempertahankan `/home/node` dalam volume Docker bernama         |
| `OPENCLAW_SANDBOX`                         | Mengaktifkan bootstrap sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | Melewati langkah onboarding interaktif (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Mengganti path soket Docker                                    |
| `OPENCLAW_DISABLE_BONJOUR`                 | Menonaktifkan iklan Bonjour/mDNS (default `1` untuk Docker)     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Menonaktifkan overlay bind-mount sumber plugin bawaan           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP spesifik sinyal untuk trace, metrik, atau log     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override protokol OTLP. Saat ini hanya `http/protobuf` yang didukung |
| `OTEL_SERVICE_NAME`                        | Nama layanan yang digunakan untuk resource OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Mengaktifkan atribut semantik GenAI eksperimental terbaru       |
| `OPENCLAW_OTEL_PRELOADED`                  | Melewati pemulaian SDK OpenTelemetry kedua saat sudah dipramuat |

Maintainer dapat menguji sumber plugin bawaan terhadap image terpaket dengan memasang
satu direktori sumber plugin di atas path sumber terpaketnya, misalnya
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Direktori sumber yang dipasang tersebut menggantikan bundle terkompilasi
`/app/dist/extensions/synology-chat` yang cocok untuk id plugin yang sama.

### Observabilitas

Ekspor OpenTelemetry bersifat outbound dari kontainer Gateway ke kolektor OTLP
Anda. Ini tidak memerlukan port Docker yang dipublikasikan. Jika Anda membangun image
secara lokal dan ingin eksportir OpenTelemetry bawaan tersedia di dalam image,
sertakan dependensi runtime-nya:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instal plugin resmi `@openclaw/diagnostics-otel` dari ClawHub dalam
instalasi Docker terpaket sebelum mengaktifkan ekspor. Image kustom yang dibuat dari sumber
tetap dapat menyertakan sumber plugin lokal dengan
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Untuk mengaktifkan ekspor, izinkan dan aktifkan
plugin `diagnostics-otel` dalam konfigurasi, lalu setel
`diagnostics.otel.enabled=true` atau gunakan contoh konfigurasi di [Ekspor OpenTelemetry](/id/gateway/opentelemetry).
Header autentikasi kolektor dikonfigurasi melalui
`diagnostics.otel.headers`, bukan melalui variabel lingkungan Docker.

Metrik Prometheus menggunakan port Gateway yang sudah dipublikasikan. Instal
`clawhub:@openclaw/diagnostics-prometheus`, aktifkan plugin
`diagnostics-prometheus`, lalu scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rute ini dilindungi oleh autentikasi Gateway. Jangan mengekspos port publik
`/metrics` terpisah atau path reverse-proxy tanpa autentikasi. Lihat
[Metrik Prometheus](/id/gateway/prometheus).

### Pemeriksaan kesehatan

Endpoint probe kontainer (tanpa autentikasi):

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

- `lan` (default): browser host dan CLI host dapat menjangkau port Gateway yang dipublikasikan.
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

| Penyedia  | URL default host         | URL setup Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Setup Docker bawaan menggunakan URL host tersebut sebagai default onboarding LM Studio dan Ollama,
dan `docker-compose.yml` memetakan `host.docker.internal` ke
Gateway host Docker untuk Docker Engine Linux. Docker Desktop sudah menyediakan
hostname yang sama di macOS dan Windows.

Layanan host juga harus mendengarkan pada alamat yang dapat dijangkau dari Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jika Anda menggunakan file Compose atau perintah `docker run` sendiri, tambahkan mapping host
yang sama sendiri, misalnya
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Jaringan bridge Docker biasanya tidak meneruskan multicast Bonjour/mDNS
(`224.0.0.251:5353`) secara andal. Karena itu, setup Compose bawaan menetapkan default
`OPENCLAW_DISABLE_BONJOUR=1` sehingga Gateway tidak crash-loop atau berulang kali
memulai ulang iklan saat bridge menjatuhkan lalu lintas multicast.

Gunakan URL Gateway yang dipublikasikan, Tailscale, atau DNS-SD area luas untuk host Docker.
Setel `OPENCLAW_DISABLE_BONJOUR=0` hanya saat berjalan dengan jaringan host, macvlan,
atau jaringan lain tempat multicast mDNS diketahui berfungsi.

Untuk hal-hal yang perlu diperhatikan dan pemecahan masalah, lihat [Penemuan Bonjour](/id/gateway/bonjour).

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, dan
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ke `/home/node/.config/openclaw`, sehingga path tersebut
bertahan setelah penggantian kontainer. Saat variabel apa pun tidak disetel, file
`docker-compose.yml` bawaan melakukan fallback ke bawah `${HOME}`, atau `/tmp` saat `HOME` sendiri
juga tidak ada. Ini mencegah `docker compose up` memancarkan spesifikasi volume
dengan sumber kosong pada lingkungan polos.

Direktori konfigurasi yang dipasang itu adalah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/kunci API penyedia yang tersimpan
- `.env` untuk rahasia runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Direktori kunci rahasia auth-profile menyimpan kunci enkripsi lokal yang digunakan untuk
material token profil autentikasi berbasis OAuth. Simpan bersama status host Docker Anda,
tetapi pisahkan dari `OPENCLAW_CONFIG_DIR`.

Plugin unduhan yang terinstal menyimpan status paketnya di bawah home
OpenClaw yang dipasang, sehingga catatan instalasi plugin dan akar paket tetap
bertahan setelah penggantian kontainer. Startup Gateway tidak menghasilkan pohon
dependensi plugin bawaan.

Untuk detail persistensi lengkap pada deployment VM, lihat
[Runtime VM Docker - Apa yang tetap ada di mana](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** pantau `media/`, file JSONL sesi,
`cron/runs/*.jsonl`, akar paket plugin yang terinstal, dan log file bergulir
di bawah `/tmp/openclaw/`.

### Pembantu shell (opsional)

Untuk manajemen Docker sehari-hari yang lebih mudah, instal `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    Skrip hanya memasang `docker.sock` setelah prasyarat sandbox lolos. Jika
    penyiapan sandbox tidak dapat selesai, skrip mereset `agents.defaults.sandbox.mode`
    ke `off`. Giliran mode kode Codex tetap dibatasi ke Codex
    `workspace-write` saat sandbox OpenClaw aktif; jangan pasang
    socket Docker host ke dalam kontainer sandbox agent.

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
    CLI dapat menjangkau gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas
    kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-gateway` dan `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Beberapa penyiapan Docker Desktop gagal melakukan lookup DNS dari sidecar
    `openclaw-cli` jaringan bersama setelah `NET_RAW` dihapus, yang muncul sebagai
    `EAI_AGAIN` selama perintah berbasis npm seperti `openclaw plugins install`.
    Pertahankan file compose terkeras default untuk operasi gateway normal. Override
    lokal di bawah ini melonggarkan postur keamanan kontainer CLI dengan
    memulihkan kapabilitas default Docker, jadi gunakan hanya untuk perintah CLI
    sekali pakai yang membutuhkan akses registry paket, bukan sebagai invocation
    Compose default Anda:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jika Anda sudah membuat kontainer `openclaw-cli` yang berjalan lama, buat ulang
    dengan override yang sama. `docker compose exec` dan `docker exec` tidak dapat
    mengubah kapabilitas Linux pada kontainer yang sudah dibuat.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat error izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ketidakcocokan yang sama dapat muncul sebagai peringatan plugin seperti
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    diikuti oleh `plugin present but blocked`. Itu berarti uid proses dan pemilik
    direktori plugin yang dipasang tidak cocok. Utamakan menjalankan kontainer sebagai
    uid default 1000 dan memperbaiki kepemilikan bind mount. Hanya chown
    `/path/to/openclaw-config/npm` ke `root:root` jika Anda sengaja menjalankan
    OpenClaw sebagai root untuk jangka panjang.

  </Accordion>

  <Accordion title="Faster rebuilds">
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

  <Accordion title="Power-user container options">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk kontainer yang lebih
    lengkap fiturnya:

    1. **Persistenkan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Paketkan deps sistem**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Paketkan Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Atau instal browser Playwright ke volume persisten**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Persistenkan unduhan browser**: gunakan `OPENCLAW_HOME_VOLUME` atau
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw mendeteksi otomatis Chromium yang dikelola
       Playwright dari image Docker di Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, URL browser akan dibuka. Dalam
    penyiapan Docker atau headless, salin URL redirect lengkap tempat Anda berakhir dan tempelkan
    kembali ke wizard untuk menyelesaikan auth.
  </Accordion>

  <Accordion title="Base image metadata">
    Image runtime Docker utama menggunakan `node:24-bookworm-slim` dan menyertakan `tini` sebagai proses init entrypoint (PID 1) untuk memastikan proses zombie dipanen dan sinyal ditangani dengan benar dalam kontainer yang berjalan lama. Image ini menerbitkan anotasi base-image OCI termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Digest base Node
    diperbarui melalui PR base-image Docker Dependabot; build rilis tidak menjalankan
    layer upgrade distro. Lihat
    [Anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Berjalan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Runtime VM Docker](/id/install/docker-vm-runtime) untuk langkah deployment VM bersama
termasuk pemaketan binary, persistensi, dan pembaruan.

## Sandbox agent

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, gateway
menjalankan eksekusi alat agent (shell, baca/tulis file, dll.) di dalam kontainer Docker
terisolasi sementara gateway itu sendiri tetap berada di host. Ini memberi Anda dinding keras
di sekitar sesi agent yang tidak tepercaya atau multi-tenant tanpa mengontainerisasi seluruh
gateway.

Cakupan sandbox dapat per-agent (default), per-session, atau bersama. Setiap cakupan
mendapat workspace sendiri yang dipasang di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan allow/deny alat, isolasi jaringan, batas sumber daya, dan kontainer
browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agent, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke kontainer sandbox
- [Sandbox dan Alat Multi-Agent](/id/tools/multi-agent-sandbox-tools) -- override per-agent

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
    (checkout sumber) atau perintah `docker build` inline dari [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) (instal npm),
    atau set `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Kontainer dibuat otomatis per sesi sesuai permintaan.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Set `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang dipasang,
    atau chown folder workspace.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (shell login), yang mengambil sumber
    `/etc/profile` dan dapat mereset PATH. Set `docker.env.PATH` untuk menambahkan path
    alat kustom Anda di awal, atau tambahkan skrip di bawah `/etc/profile.d/` dalam Dockerfile Anda.
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
    Reset mode gateway dan bind:

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
- [Memperbarui](/id/install/updating) — menjaga OpenClaw tetap terbaru
- [Konfigurasi](/id/gateway/configuration) — konfigurasi gateway setelah instalasi

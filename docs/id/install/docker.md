---
read_when:
    - Anda menginginkan gateway dalam kontainer alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Pengaturan dan onboarding berbasis Docker opsional untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker bersifat **opsional**. Gunakan hanya jika Anda menginginkan Gateway dalam kontainer atau ingin memvalidasi alur Docker.

## Apakah Docker tepat untuk saya?

- **Ya**: Anda menginginkan lingkungan Gateway yang terisolasi dan sekali pakai, atau ingin menjalankan OpenClaw di host tanpa instalasi lokal.
- **Tidak**: Anda menjalankan di mesin sendiri dan hanya menginginkan loop pengembangan tercepat. Gunakan alur instalasi normal sebagai gantinya.
- **Catatan sandboxing**: backend sandbox default menggunakan Docker ketika sandboxing diaktifkan, tetapi sandboxing nonaktif secara default dan **tidak** mengharuskan seluruh Gateway berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia. Lihat [Sandboxing](/id/gateway/sandboxing).

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- RAM minimal 2 GB untuk build image (`pnpm install` dapat dihentikan karena OOM pada host 1 GB dengan exit 137)
- Ruang disk yang cukup untuk image dan log
- Jika berjalan di VPS/host publik, tinjau
  [Penguatan keamanan untuk paparan jaringan](/id/gateway/security),
  terutama kebijakan firewall Docker `DOCKER-USER`.

## Gateway dalam kontainer

<Steps>
  <Step title="Build image">
    Dari root repo, jalankan skrip penyiapan:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini mem-build image Gateway secara lokal. Untuk menggunakan image pra-build sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image pra-build pertama kali diterbitkan ke
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR adalah registry utama untuk otomasi rilis, deployment yang dipin,
    dan pemeriksaan provenance. Workflow rilis yang sama juga menerbitkan mirror
    Docker Hub resmi di `openclaw/openclaw` untuk host yang lebih memilih Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gunakan `ghcr.io/openclaw/openclaw` atau `openclaw/openclaw`. Hindari mirror
    Docker Hub komunitas karena OpenClaw tidak mengontrol waktu rilis,
    rebuild, atau kebijakan retensinya. Tag resmi umum: `main`, `latest`,
    `<version>` (mis. `2026.2.26`), dan versi beta seperti
    `2026.2.26-beta.1`. Tag beta tidak memindahkan `latest` atau `main`.

  </Step>

  <Step title="Jalankan ulang airgapped">
    Pada host offline, transfer dan muat image terlebih dahulu:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` memverifikasi bahwa `OPENCLAW_IMAGE` sudah ada secara lokal,
    menonaktifkan pull dan build Compose implisit, lalu menjalankan alur penyiapan
    normal seperti sinkronisasi `.env`, perbaikan izin, onboarding, sinkronisasi
    konfigurasi Gateway, dan startup Compose.

    Jika `OPENCLAW_SANDBOX=1`, penyiapan offline juga memeriksa image sandbox
    default yang dikonfigurasi dan image sandbox per-agent aktif pada daemon di balik
    `OPENCLAW_DOCKER_SOCKET`. Image browser berbasis Docker juga harus membawa
    label kontrak browser OpenClaw saat ini. Ketika image yang diperlukan hilang atau
    tidak kompatibel, penyiapan keluar tanpa mengubah konfigurasi sandbox alih-alih
    melaporkan sukses dengan sandbox yang tidak dapat digunakan.

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip penyiapan menjalankan onboarding secara otomatis. Skrip akan:

    - meminta kunci API provider
    - membuat token Gateway dan menulisnya ke `.env`
    - membuat direktori kunci rahasia auth-profile
    - memulai Gateway melalui Docker Compose

    Selama penyiapan, onboarding pra-start dan penulisan konfigurasi berjalan langsung
    melalui `openclaw-gateway`. `openclaw-cli` digunakan untuk perintah yang Anda jalankan
    setelah kontainer Gateway sudah ada.

  </Step>

  <Step title="Buka Control UI">
    Buka `http://127.0.0.1:18789/` di browser Anda dan tempel rahasia bersama yang
    dikonfigurasi ke Settings. Skrip penyiapan menulis token ke `.env` secara
    default; jika Anda mengalihkan konfigurasi kontainer ke autentikasi password, gunakan
    password tersebut sebagai gantinya.

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

    Dokumentasi: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord)

  </Step>
</Steps>

### Alur manual

Jika Anda lebih suka menjalankan setiap langkah sendiri alih-alih menggunakan skrip penyiapan:

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
atau `OPENCLAW_HOME_VOLUME`, skrip penyiapan menulis `docker-compose.extra.yml`;
sertakan file tersebut setelah file override standar apa pun, misalnya
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
ketika kedua file override ada.
</Note>

<Note>
Karena `openclaw-cli` berbagi namespace jaringan milik `openclaw-gateway`, alat ini adalah
alat pasca-start. Sebelum `docker compose up -d openclaw-gateway`, jalankan onboarding
dan penulisan konfigurasi saat penyiapan melalui `openclaw-gateway` dengan
`--no-deps --entrypoint node`.
</Note>

### Variabel lingkungan

Skrip penyiapan menerima variabel lingkungan opsional berikut:

| Variabel                                        | Tujuan                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Menggunakan image jarak jauh alih-alih mem-build secara lokal         |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Menginstal paket apt tambahan selama build (dipisahkan spasi)         |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Menginstal paket Python tambahan selama build (dipisahkan spasi)      |
| `OPENCLAW_EXTENSIONS`                           | Menginstal dependensi Plugin saat build (nama dipisahkan spasi)       |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Menimpa opsi Node build sumber lokal                                  |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Menimpa heap tsdown build sumber lokal dalam MB                       |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Melewati output deklarasi selama build image lokal khusus runtime     |
| `OPENCLAW_EXTRA_MOUNTS`                         | Bind mount host tambahan (`source:target[:opts]` dipisahkan koma)     |
| `OPENCLAW_HOME_VOLUME`                          | Mempertahankan `/home/node` dalam volume Docker bernama               |
| `OPENCLAW_SANDBOX`                              | Ikut serta dalam bootstrap sandbox (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                      | Melewati langkah onboarding interaktif (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                        | Menimpa jalur socket Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | Menonaktifkan iklan Bonjour/mDNS (default ke `1` untuk Docker)        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Menonaktifkan overlay bind-mount sumber Plugin bawaan                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry        |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoint OTLP khusus sinyal untuk trace, metrik, atau log             |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Override protokol OTLP. Saat ini hanya `http/protobuf` yang didukung  |
| `OTEL_SERVICE_NAME`                             | Nama layanan yang digunakan untuk resource OpenTelemetry              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Ikut serta dalam atribut semantik GenAI eksperimental terbaru         |
| `OPENCLAW_OTEL_PRELOADED`                       | Melewati startup SDK OpenTelemetry kedua ketika satu sudah dipreload  |

Image Docker resmi tidak menyertakan Homebrew. Selama onboarding, OpenClaw
menyembunyikan installer dependensi skill khusus brew ketika berjalan dalam
kontainer Linux tanpa `brew`; dependensi tersebut harus disediakan oleh image kustom
atau diinstal secara manual. Untuk dependensi yang tersedia dari paket Debian, gunakan
`OPENCLAW_IMAGE_APT_PACKAGES` selama build image. Nama lama
`OPENCLAW_DOCKER_APT_PACKAGES` masih diterima.
Untuk dependensi Python, gunakan `OPENCLAW_IMAGE_PIP_PACKAGES`. Ini menjalankan
`python3 -m pip install --break-system-packages` selama build image, jadi pin
versi paket dan gunakan hanya indeks paket yang Anda percaya.
Build sumber menetapkan default `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` ke
`--max-old-space-size=8192` dan membiarkan
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` tidak disetel agar wrapper tsdown dapat
menghormati batas memori kontainer. Build tersebut juga menetapkan default
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` karena image runtime memangkas file deklarasi
setelah build. Jika Docker melaporkan `ResourceExhausted`, `cannot allocate
memory`, atau berhenti selama `tsdown`, tingkatkan batas memori builder Docker atau
coba ulang dengan heap eksplisit yang lebih kecil, misalnya
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainer dapat menguji sumber Plugin bawaan terhadap image terpaket dengan memasang
satu direktori sumber Plugin di atas jalur sumber terpaketnya, misalnya
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Direktori sumber yang dipasang tersebut menggantikan bundle terkompilasi
`/app/dist/extensions/synology-chat` yang cocok untuk id Plugin yang sama.

### Observability

Ekspor OpenTelemetry bersifat outbound dari kontainer Gateway ke kolektor OTLP
Anda. Ini tidak memerlukan port Docker yang dipublikasikan. Jika Anda mem-build image
secara lokal dan ingin exporter OpenTelemetry bawaan tersedia di dalam image,
sertakan dependensi runtime-nya:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Instal Plugin resmi `@openclaw/diagnostics-otel` dari ClawHub dalam instalasi Docker
terpaket sebelum mengaktifkan ekspor. Image kustom yang dibuild dari sumber masih dapat
menyertakan sumber Plugin lokal dengan
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Untuk mengaktifkan ekspor, izinkan dan aktifkan
Plugin `diagnostics-otel` dalam konfigurasi, lalu setel
`diagnostics.otel.enabled=true` atau gunakan contoh konfigurasi di [Ekspor OpenTelemetry
](/id/gateway/opentelemetry). Header auth kolektor dikonfigurasi melalui
`diagnostics.otel.headers`, bukan melalui variabel lingkungan Docker.

Metrik Prometheus menggunakan port Gateway yang sudah dipublikasikan. Instal
`clawhub:@openclaw/diagnostics-prometheus`, aktifkan Plugin
`diagnostics-prometheus`, lalu scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route dilindungi oleh autentikasi Gateway. Jangan mengekspos port `/metrics`
publik terpisah atau jalur reverse-proxy tanpa autentikasi. Lihat
[Metrik Prometheus](/id/gateway/prometheus).

### Health check

Endpoint probe kontainer (tidak perlu auth):

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
`http://127.0.0.1:18789` berfungsi dengan penerbitan port Docker.

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

| Penyedia  | URL default host         | URL penyiapan Docker                |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Penyiapan Docker bawaan menggunakan URL host tersebut sebagai default onboarding
LM Studio dan Ollama, dan `docker-compose.yml` memetakan `host.docker.internal` ke
Gateway host Docker untuk Docker Engine Linux. Docker Desktop sudah menyediakan
nama host yang sama di macOS dan Windows.

Layanan host juga harus mendengarkan pada alamat yang dapat dijangkau dari Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Jika Anda menggunakan file Compose atau perintah `docker run` sendiri, tambahkan
pemetaan host yang sama sendiri, misalnya
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI di Docker

Image Docker resmi OpenClaw tidak memasang Claude Code sebelumnya. Pasang dan
masuk ke Claude Code di dalam pengguna kontainer yang menjalankan OpenClaw, lalu persistensikan
home kontainer tersebut agar peningkatan image tidak menghapus biner atau status auth Claude.

Untuk instalasi Docker baru, aktifkan volume `/home/node` yang persisten sebelum menjalankan
penyiapan:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Untuk instalasi Docker yang sudah ada, hentikan stack terlebih dahulu dan muat ulang nilai
Docker `.env` saat ini sebelum menjalankan ulang penyiapan. Skrip penyiapan tidak membaca
`.env` sendiri; skrip tersebut menulis ulang `.env` dari shell saat ini dan default. Untuk
`.env` yang dihasilkan, jalankan:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jika `.env` Anda berisi nilai yang tidak dapat di-source oleh shell Anda, ekspor ulang secara manual
nilai yang sudah ada dan Anda andalkan terlebih dahulu, seperti `OPENCLAW_IMAGE`, port, mode bind,
path khusus, `OPENCLAW_EXTRA_MOUNTS`, sandbox, dan pengaturan lewati-onboarding.
Overlay yang dihasilkan memasang volume home untuk `openclaw-gateway` dan
`openclaw-cli`.

Jalankan perintah berikutnya dengan overlay Compose yang dihasilkan agar kedua layanan
memasang home yang dipersistensikan. Jika penyiapan Anda juga menggunakan `docker-compose.override.yml`,
sertakan sebelum `docker-compose.extra.yml`.

Pasang Claude Code di home yang dipersistensikan tersebut:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Installer native menulis biner `claude` di bawah
`/home/node/.local/bin/claude`. Beri tahu OpenClaw untuk menggunakan path kontainer tersebut:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Masuk dan verifikasi dari dalam home kontainer persisten yang sama:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Setelah itu, Anda dapat menggunakan backend `claude-cli` bawaan:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` mempertahankan instalasi Claude Code native di bawah
`/home/node/.local/bin` dan `/home/node/.local/share/claude`, ditambah pengaturan
Claude Code dan status auth di bawah `/home/node/.claude` dan `/home/node/.claude.json`.
Mempertahankan hanya `/home/node/.openclaw` tidak cukup untuk penggunaan ulang Claude CLI. Jika
Anda menggunakan `OPENCLAW_EXTRA_MOUNTS` alih-alih volume home, pasang semua path
Claude tersebut ke kedua layanan Docker.

<Note>
Untuk otomatisasi produksi bersama atau penagihan Anthropic yang dapat diprediksi, pilih jalur
kunci API Anthropic. Penggunaan ulang Claude CLI mengikuti versi terpasang Claude Code,
login akun, penagihan, dan perilaku pembaruan.
</Note>

### Bonjour / mDNS

Jaringan bridge Docker biasanya tidak meneruskan multicast Bonjour/mDNS
(`224.0.0.251:5353`) secara andal. Karena itu, penyiapan Compose bawaan menetapkan default
`OPENCLAW_DISABLE_BONJOUR=1` agar Gateway tidak mengalami crash-loop atau berulang kali
memulai ulang iklan saat bridge menjatuhkan lalu lintas multicast.

Gunakan URL Gateway yang diterbitkan, Tailscale, atau DNS-SD area luas untuk host Docker.
Tetapkan `OPENCLAW_DISABLE_BONJOUR=0` hanya saat berjalan dengan jaringan host, macvlan,
atau jaringan lain tempat multicast mDNS diketahui berfungsi.

Untuk hal-hal yang perlu diperhatikan dan pemecahan masalah, lihat [penemuan Bonjour](/id/gateway/bonjour).

### Penyimpanan dan persistensi

Docker Compose melakukan bind-mount `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, dan
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ke `/home/node/.config/openclaw`, sehingga path tersebut
tetap ada setelah kontainer diganti. Saat variabel apa pun tidak disetel, `docker-compose.yml`
bawaan melakukan fallback di bawah `${HOME}`, atau `/tmp` saat `HOME` sendiri juga
tidak ada. Ini mencegah `docker compose up` memunculkan spesifikasi volume sumber kosong
di lingkungan bare.

Direktori konfigurasi yang dipasang tersebut adalah tempat OpenClaw menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk auth OAuth/kunci API penyedia yang disimpan
- `.env` untuk rahasia runtime berbasis env seperti `OPENCLAW_GATEWAY_TOKEN`

Direktori kunci rahasia profil auth menyimpan kunci enkripsi lokal yang digunakan untuk
material token profil auth berbasis OAuth. Simpan bersama status host Docker Anda,
tetapi pisahkan dari `OPENCLAW_CONFIG_DIR`.

Plugin unduhan yang dipasang menyimpan status paketnya di bawah home OpenClaw yang dipasang,
sehingga catatan instalasi Plugin dan root paket tetap ada setelah kontainer diganti.
Startup Gateway tidak menghasilkan pohon dependensi Plugin bawaan.

Untuk detail persistensi lengkap pada deployment VM, lihat
[Runtime VM Docker - Apa yang bertahan di mana](/id/install/docker-vm-runtime#what-persists-where).

**Hotspot pertumbuhan disk:** pantau `media/`, file JSONL sesi, database status
SQLite bersama, root paket Plugin yang dipasang, dan log file bergulir
di bawah `/tmp/openclaw/`.

### Helper shell (opsional)

Untuk pengelolaan Docker sehari-hari yang lebih mudah, pasang `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda memasang ClawDock dari path raw lama `scripts/shell-helpers/clawdock-helpers.sh`, jalankan ulang perintah instalasi di atas agar file helper lokal Anda mengikuti lokasi baru.

Lalu gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dll. Jalankan
`clawdock-help` untuk semua perintah.
Lihat [ClawDock](/id/install/clawdock) untuk panduan helper lengkap.

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agent untuk Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Path soket khusus (mis. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrip memasang `docker.sock` hanya setelah prasyarat sandbox lolos. Jika
    penyiapan sandbox tidak dapat selesai, skrip mereset `agents.defaults.sandbox.mode`
    ke `off`. Giliran mode kode Codex tetap dibatasi ke `workspace-write` Codex
    saat sandbox OpenClaw aktif; jangan pasang soket Docker host ke dalam
    kontainer sandbox agent.

  </Accordion>

  <Accordion title="Otomatisasi / CI (noninteraktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` agar perintah CLI
    dapat menjangkau Gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas
    kepercayaan bersama. Konfigurasi compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan
    `no-new-privileges` pada `openclaw-gateway` dan `openclaw-cli`.
  </Accordion>

  <Accordion title="Kegagalan DNS Docker Desktop di openclaw-cli">
    Beberapa penyiapan Docker Desktop gagal melakukan lookup DNS dari sidecar jaringan bersama
    `openclaw-cli` setelah `NET_RAW` dihapus, yang muncul sebagai
    `EAI_AGAIN` selama perintah berbasis npm seperti `openclaw plugins install`.
    Pertahankan file compose default yang diperkeras untuk operasi Gateway normal. Override
    lokal di bawah ini melonggarkan postur keamanan kontainer CLI dengan
    memulihkan kapabilitas default Docker, jadi gunakan hanya untuk perintah CLI sekali jalan
    yang membutuhkan akses registry paket, bukan sebagai pemanggilan Compose default Anda:

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

  <Accordion title="Izin dan EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat error izin pada
    `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ketidakcocokan yang sama dapat muncul sebagai peringatan Plugin seperti
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    diikuti oleh `plugin present but blocked`. Itu berarti uid proses dan pemilik
    direktori Plugin yang dipasang tidak sesuai. Pilih menjalankan kontainer sebagai
    uid default 1000 dan memperbaiki kepemilikan bind mount. Hanya chown
    `/path/to/openclaw-config/npm` ke `root:root` jika Anda sengaja menjalankan
    OpenClaw sebagai root dalam jangka panjang.

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
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk
    kontainer yang lebih lengkap fiturnya:

    1. **Pertahankan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Tanam dependensi sistem**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Tanam dependensi Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Tanam Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Atau instal browser Playwright ke volume yang dipertahankan**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Pertahankan unduhan browser**: gunakan `OPENCLAW_HOME_VOLUME` atau
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw mendeteksi otomatis Chromium yang dikelola
       Playwright milik image Docker di Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Jika Anda memilih OpenAI Codex OAuth di wizard, itu akan membuka URL browser. Dalam
    penyiapan Docker atau headless, salin URL pengalihan lengkap tempat Anda berakhir dan tempelkan
    kembali ke wizard untuk menyelesaikan autentikasi.
  </Accordion>

  <Accordion title="Metadata image dasar">
    Image runtime Docker utama menggunakan `node:24-bookworm-slim` dan menyertakan `tini` sebagai proses init entrypoint (PID 1) untuk memastikan proses zombi dipungut dan sinyal ditangani dengan benar dalam kontainer yang berjalan lama. Ini menerbitkan anotasi image dasar OCI termasuk `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, dan lainnya. Digest dasar Node
    disegarkan melalui PR image dasar Docker Dependabot; build rilis tidak menjalankan
    lapisan upgrade distro. Lihat
    [anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Menjalankan di VPS?

Lihat [Hetzner (Docker VPS)](/id/install/hetzner) dan
[Runtime VM Docker](/id/install/docker-vm-runtime) untuk langkah penerapan VM bersama
termasuk penanaman biner, persistensi, dan pembaruan.

## Sandbox agen

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, Gateway
menjalankan eksekusi alat agen (shell, baca/tulis file, dll.) di dalam kontainer Docker
terisolasi sementara Gateway itu sendiri tetap berada di host. Ini memberi Anda dinding keras
di sekitar sesi agen tidak tepercaya atau multi-tenant tanpa mengontainerkan seluruh
Gateway.

Cakupan sandbox dapat berupa per-agen (default), per-sesi, atau bersama. Setiap cakupan
mendapat workspace sendiri yang dipasang di `/workspace`. Anda juga dapat mengonfigurasi
kebijakan alat izinkan/tolak, isolasi jaringan, batas sumber daya, dan kontainer
browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multi-agen, lihat:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke kontainer sandbox
- [Sandbox dan Alat Multi-Agen](/id/tools/multi-agent-sandbox-tools) -- penggantian per-agen

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
  <Accordion title="Image hilang atau kontainer sandbox tidak mulai">
    Build image sandbox dengan
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout sumber) atau perintah `docker build` inline dari [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) (instalasi npm),
    atau atur `agents.defaults.sandbox.docker.image` ke image kustom Anda.
    Kontainer dibuat otomatis per sesi sesuai permintaan.
  </Accordion>

  <Accordion title="Kesalahan izin di sandbox">
    Atur `docker.user` ke UID:GID yang cocok dengan kepemilikan workspace yang Anda pasang,
    atau chown folder workspace.
  </Accordion>

  <Accordion title="Alat kustom tidak ditemukan di sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (login shell), yang memuat
    `/etc/profile` dan dapat mengatur ulang PATH. Atur `docker.env.PATH` untuk menambahkan
    path alat kustom Anda di awal, atau tambahkan skrip di bawah `/etc/profile.d/` dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="Terbunuh OOM saat build image (exit 137)">
    VM membutuhkan setidaknya RAM 2 GB. Gunakan kelas mesin yang lebih besar dan coba lagi.
  </Accordion>

  <Accordion title="Tidak terotorisasi atau perlu pairing di Control UI">
    Ambil tautan dashboard baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail lebih lanjut: [Dashboard](/id/web/dashboard), [Perangkat](/id/cli/devices).

  </Accordion>

  <Accordion title="Target Gateway menampilkan ws://172.x.x.x atau kesalahan pairing dari Docker CLI">
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
- [Memperbarui](/id/install/updating) — menjaga OpenClaw tetap terbaru
- [Konfigurasi](/id/gateway/configuration) — konfigurasi Gateway setelah instalasi

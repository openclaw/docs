---
read_when:
    - Anda menginginkan Gateway dalam kontainer alih-alih instalasi lokal
    - Anda sedang memvalidasi alur Docker
summary: Penyiapan dan orientasi opsional berbasis Docker untuk OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-16T18:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker bersifat **opsional**. Gunakan untuk lingkungan Gateway yang terisolasi dan sekali pakai atau host tanpa instalasi lokal. Jika Anda sudah melakukan pengembangan di mesin sendiri, gunakan alur instalasi normal sebagai gantinya.

Backend sandbox default menggunakan Docker saat `agents.defaults.sandbox` diaktifkan, tetapi sandbox dinonaktifkan secara default dan tidak mengharuskan Gateway itu sendiri berjalan di Docker. Backend sandbox SSH dan OpenShell juga tersedia; lihat [Sandboxing](/id/gateway/sandboxing).

Meng-host beberapa pengguna? Lihat [Hosting multi-tenant](/id/gateway/multi-tenant-hosting) untuk model satu sel per tenant.

## Prasyarat

- Docker Desktop (atau Docker Engine) + Docker Compose v2
- RAM minimal 2 GB untuk membangun image (`pnpm install` dapat dihentikan karena OOM pada host dengan RAM 1 GB dan keluar dengan kode 137)
- Ruang disk yang cukup untuk image dan log
- Pada VPS/host publik, tinjau [Penguatan keamanan untuk paparan jaringan](/id/gateway/security), khususnya rantai firewall Docker `DOCKER-USER`

## Gateway dalam kontainer

<Steps>
  <Step title="Bangun image">
    Dari root repo:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Ini membangun image Gateway secara lokal sebagai `openclaw:local`. Untuk menggunakan image siap pakai sebagai gantinya:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image siap pakai pertama-tama dipublikasikan ke [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR adalah registry utama untuk otomatisasi rilis, deployment yang dipatok, dan pemeriksaan asal-usul. Rilis yang sama memublikasikan mirror Docker Hub di `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gunakan `ghcr.io/openclaw/openclaw` atau `openclaw/openclaw` dan hindari mirror tidak resmi, yang tidak menggunakan waktu rilis atau kebijakan retensi OpenClaw yang sama. Tag resmi: `main`, `latest`, `<version>` (misalnya `2026.2.26`), dan tag beta seperti `2026.2.26-beta.1` (beta tidak pernah memindahkan `latest`/`main`). Image default `main`/`latest`/`<version>` menyertakan plugin `codex` dan `diagnostics-otel`. Varian `-browser` (misalnya `latest-browser`) juga dikirimkan dengan Chromium yang sudah tertanam, berguna untuk alat [browser dalam sandbox](/id/gateway/sandboxing#sandboxed-browser) tanpa instalasi Playwright saat pertama kali dijalankan.

  </Step>

  <Step title="Jalankan ulang tanpa koneksi jaringan">
    Pada host luring, transfer dan muat image terlebih dahulu:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` memverifikasi bahwa `OPENCLAW_IMAGE` sudah tersedia secara lokal, menonaktifkan pull/build Compose implisit, lalu menjalankan alur normal: sinkronisasi `.env`, perbaikan izin, onboarding, sinkronisasi konfigurasi Gateway, dan startup Compose.

    Jika `OPENCLAW_SANDBOX=1`, penyiapan luring juga memeriksa image sandbox default dan per agen yang dikonfigurasi pada daemon di balik `OPENCLAW_DOCKER_SOCKET`, termasuk label kontrak browser pada image browser berbasis Docker. Jika image yang diperlukan tidak tersedia atau sudah usang, penyiapan berhenti tanpa mengubah konfigurasi sandbox, alih-alih melaporkan keberhasilan yang sebenarnya rusak.

  </Step>

  <Step title="Selesaikan onboarding">
    Skrip penyiapan menjalankan onboarding secara otomatis:

    - meminta kunci API penyedia
    - menghasilkan token Gateway dan menuliskannya ke `.env`
    - membuat direktori kunci rahasia profil autentikasi
    - memulai Gateway melalui Docker Compose

    Onboarding dan penulisan konfigurasi sebelum startup dijalankan langsung melalui `openclaw-gateway` (dengan `--no-deps --entrypoint node`), karena `openclaw-cli` menggunakan namespace jaringan Gateway yang sama dan hanya berfungsi setelah kontainer Gateway tersedia.

  </Step>

  <Step title="Buka UI Kontrol">
    Buka `http://127.0.0.1:18789/` dan tempelkan token yang ditulis ke `.env` ke Settings. Jika Anda mengalihkan kontainer ke autentikasi kata sandi, gunakan kata sandi tersebut sebagai gantinya.

    Memerlukan URL-nya lagi?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Konfigurasikan kanal (opsional)">
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Konteks Docker mengecualikan `.git`. Teruskan identitas sumber sebagai argumen build
seperti ditunjukkan di atas agar layar Tentang pada image melaporkan commit yang di-checkout dan
satu stempel waktu build. `scripts/docker/setup.sh` menentukan dan meneruskan kedua nilai tersebut
secara otomatis.

<Note>
Jalankan `docker compose` dari root repo. Jika Anda mengaktifkan `OPENCLAW_EXTRA_MOUNTS` atau `OPENCLAW_HOME_VOLUME`, skrip penyiapan menulis `docker-compose.extra.yml`; sertakan setelah setiap `docker-compose.override.yml` yang Anda kelola sendiri, misalnya `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Meningkatkan versi image kontainer

Saat Anda mengganti image OpenClaw tetapi mempertahankan state/konfigurasi terpasang yang sama,
Gateway baru menjalankan migrasi peningkatan versi yang aman saat startup dan konvergensi plugin sebelum
siap. Peningkatan versi image rutin seharusnya tidak memerlukan proses
`openclaw doctor --fix` terpisah.

Jika startup tidak dapat menyelesaikan perbaikan tersebut dengan aman, Gateway akan berhenti alih-alih
melaporkan status sehat. Dengan kebijakan restart, Docker, Podman, atau Kubernetes mungkin menampilkan
kontainer Gateway yang terus dimulai ulang. Pertahankan volume state yang terpasang, lalu jalankan
image yang sama sekali dengan `openclaw doctor --fix` sebagai perintah kontainer, menggunakan
mount state/konfigurasi yang sama dengan yang digunakan Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Setelah doctor selesai, mulai ulang kontainer Gateway dengan perintah default-nya.
Di Kubernetes, jalankan perintah yang sama dalam Job sekali jalan atau pod debug yang dipasang ke
PVC yang sama, lalu mulai ulang Deployment atau StatefulSet.

### Variabel lingkungan

Variabel opsional yang diterima oleh `scripts/docker/setup.sh` (dan, untuk kontainer Gateway, langsung oleh `docker-compose.yml`):

| Variabel                                        | Tujuan                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Gunakan image jarak jauh alih-alih membangunnya secara lokal                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Instal paket apt tambahan selama build (dipisahkan spasi). Alias lama: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Instal paket Python tambahan selama build (dipisahkan spasi)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Kompilasi/kemas plugin terpilih yang didukung dan instal dependensi runtime-nya (id dipisahkan koma atau spasi) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Timpa opsi Node build sumber lokal (default `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Timpa heap tsdown build sumber lokal dalam MB                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Lewati keluaran deklarasi selama build image lokal khusus runtime (default `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Tanamkan Chromium + Xvfb ke dalam image pada waktu build                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Bind mount host tambahan (`source:target[:opts]` dipisahkan koma)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Pertahankan `/home/node` dalam volume Docker bernama                                                                     |
| `OPENCLAW_SANDBOX`                              | Ikut serta dalam bootstrap sandbox (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Lewati langkah onboarding interaktif (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Timpa jalur soket Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Paksa pengiklanan Bonjour/mDNS aktif (`0`) atau nonaktif (`1`); lihat [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Nonaktifkan overlay bind mount sumber plugin bawaan                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint kolektor OTLP/HTTP bersama untuk ekspor OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoint OTLP khusus sinyal untuk trace, metrik, atau log                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Penimpaan protokol OTLP. Saat ini hanya `http/protobuf` yang didukung                                                   |
| `OTEL_SERVICE_NAME`                             | Nama layanan yang digunakan untuk resource OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Ikut serta dalam atribut semantik GenAI eksperimental terbaru                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Lewati memulai SDK OpenTelemetry kedua saat salah satunya telah dimuat sebelumnya                                                    |

Image resmi tidak menyertakan Homebrew. Selama onboarding, OpenClaw menyembunyikan penginstal dependensi skill khusus brew dalam kontainer Linux tanpa `brew`; sediakan dependensi tersebut melalui image khusus atau instal secara manual. Gunakan `OPENCLAW_IMAGE_APT_PACKAGES` untuk dependensi yang dikemas Debian dan `OPENCLAW_IMAGE_PIP_PACKAGES` untuk dependensi Python (menjalankan `python3 -m pip install --break-system-packages` pada waktu build, jadi patok versinya dan hanya gunakan indeks yang Anda percayai).

Jika Docker melaporkan `ResourceExhausted`, `cannot allocate memory`, atau berhenti selama `tsdown`, tingkatkan batas memori builder Docker atau coba lagi dengan heap eksplisit yang lebih kecil:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Image yang dibangun dari sumber dengan plugin terpilih

`OPENCLAW_EXTENSIONS` memilih id manifes plugin dari checkout sumber;
nama direktori sumber yang ada juga diterima jika berbeda. Build Docker
menetapkan pilihan ke direktori sumber satu kali, menginstal dependensi
produksi, dan, ketika plugin yang dipilih diterbitkan secara terpisah dengan
`openclaw.build.bundledDist: false`, mengompilasi runtime-nya ke dalam dist gabungan
root. Pengemasan khusus Docker ini tidak mengubah kontrak artefak npm atau ClawHub
plugin tersebut. Id yang tidak dikenal, tidak valid, atau ambigu menyebabkan build image gagal.
Id khusus dependensi/sumber yang dikenal mempertahankan staging sumber dan dependensi
yang ada tanpa memperoleh entri dist root terkompilasi. Plugin terpilih dengan
entri build terpadu harus berhasil dikompilasi; sumber dan output runtime plugin
eksternal yang tidak dipilih dipangkas.

Misalnya, perintah berikut membuat image gateway mandiri FakeCo
multi-arsitektur yang terpisah untuk ClickClack, Slack, dan Microsoft Teams. ClawRouter
sudah menjadi bagian dari runtime root OpenClaw, sehingga image ClickClack hanya memilih
`clickclack`. Argumen browser kosong yang eksplisit menjaga image default tetap bebas
dari Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Gunakan `--platform linux/arm64 --load` atau `--platform linux/amd64 --load` untuk
satu build lokal native. Output multiplatform serta SBOM/provenance terlampir
memerlukan registry atau output Buildx lain yang mempertahankan atestasi. Setelah
melakukan push, periksa manifes dan terapkan digest yang tidak dapat diubah alih-alih
tag SHA sumber yang dapat diubah:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Terapkan: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Image ini ditujukan untuk gateway mandiri berbasis OCI dan pengguna Docker umum.
Gateway yang dikelola Crabhelm tidak menggunakannya: jalur pengiriman tersebut membuat
arsip appliance x86_64 terpisah yang berisi tarball npm OpenClaw dan mengunci
digest Node, arsip, serta manifes. Build appliance tersebut secara terpisah
dari sumber OpenClaw yang sama yang telah digabungkan.

Untuk menguji sumber plugin gabungan terhadap image terkemas, pasang satu direktori sumber plugin di atas jalur sumber terkemasnya, misalnya `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Ini menggantikan bundle `/app/dist/extensions/synology-chat` terkompilasi yang cocok untuk id plugin yang sama.

### Observabilitas

Ekspor OpenTelemetry bersifat keluar dari kontainer Gateway menuju kolektor OTLP Anda; ini tidak memerlukan port Docker yang dipublikasikan. Untuk menyertakan eksportir gabungan dalam image yang dibuat secara lokal:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Image bawaan resmi sudah menyertakan `diagnostics-otel`; instal sendiri `clawhub:@openclaw/diagnostics-otel` hanya jika Anda menghapusnya. Untuk mengaktifkan ekspor, izinkan dan aktifkan plugin `diagnostics-otel` dalam konfigurasi, lalu tetapkan `diagnostics.otel.enabled=true` (lihat contoh lengkap di [Ekspor OpenTelemetry](/id/gateway/opentelemetry)). Header autentikasi kolektor diteruskan melalui `diagnostics.otel.headers`, bukan variabel lingkungan Docker.

Metrik Prometheus menggunakan kembali port Gateway yang sudah dipublikasikan. Instal `clawhub:@openclaw/diagnostics-prometheus`, aktifkan plugin `diagnostics-prometheus`, lalu lakukan scraping:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rute tersebut dilindungi oleh autentikasi Gateway; jangan ekspos port publik `/metrics` terpisah atau jalur reverse proxy tanpa autentikasi. Lihat [Metrik Prometheus](/id/gateway/prometheus).

### Pemeriksaan kesehatan

Endpoint probe kontainer (tidak memerlukan autentikasi):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # keaktifan
curl -fsS http://127.0.0.1:18789/readyz     # kesiapan
```

`HEALTHCHECK` bawaan image melakukan ping ke `/healthz`; kegagalan berulang menandai kontainer sebagai `unhealthy` agar orkestrator dapat memulai ulang atau menggantinya.

Snapshot kesehatan mendalam yang diautentikasi:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` menetapkan `OPENCLAW_GATEWAY_BIND=lan` secara default agar `http://127.0.0.1:18789` pada host berfungsi dengan publikasi port Docker.

- `lan` (default): browser host dan CLI host dapat mengakses port gateway yang dipublikasikan.
- `loopback`: hanya proses di dalam namespace jaringan kontainer yang dapat mengakses gateway secara langsung.

<Note>
Gunakan nilai mode bind dalam `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), bukan alias host seperti `0.0.0.0` atau `127.0.0.1`.
</Note>

### Penyedia lokal host

Di dalam kontainer, `127.0.0.1` adalah kontainer itu sendiri, bukan host. Gunakan `host.docker.internal` untuk penyedia yang berjalan pada host:

| Penyedia  | URL default host         | URL penyiapan Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Penyiapan gabungan menggunakan URL tersebut sebagai default onboarding LM Studio/Ollama, dan `docker-compose.yml` memetakan `host.docker.internal` ke gateway host pada Docker Engine Linux (Docker Desktop menyediakan alias yang sama pada macOS/Windows). Layanan host harus mendengarkan pada alamat yang dapat dijangkau Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Menggunakan file Compose Anda sendiri atau `docker run`? Tambahkan sendiri pemetaan yang sama, misalnya `--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI di Docker

Image resmi tidak menginstal Claude Code sebelumnya. Instal dan masuk di dalam pengguna `node` kontainer, lalu persistensikan home kontainer tersebut agar peningkatan image tidak menghapus biner atau status autentikasi.

Untuk instalasi baru, aktifkan volume `/home/node` persisten sebelum menjalankan penyiapan:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Untuk instalasi yang sudah ada, hentikan stack dan muat ulang nilai `.env` saat ini terlebih dahulu — skrip penyiapan selalu menulis ulang `.env` dari shell dan default saat ini, skrip tersebut tidak membaca file itu sendiri:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Jika `.env` berisi nilai yang tidak dapat dimuat oleh shell Anda, ekspor ulang secara manual terlebih dahulu nilai yang Anda andalkan (`OPENCLAW_IMAGE`, port, mode bind, jalur khusus, `OPENCLAW_EXTRA_MOUNTS`, sandbox, lewati onboarding). Overlay yang dihasilkan memasang volume home untuk `openclaw-gateway` dan `openclaw-cli`; jalankan perintah yang tersisa dengan overlay tersebut (dan `docker-compose.override.yml` terlebih dahulu, jika Anda menggunakannya):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Penginstal native menulis `claude` ke `/home/node/.local/bin/claude`. Arahkan OpenClaw ke jalur tersebut:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Masuk dan verifikasi dari home persisten yang sama:

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

Kemudian gunakan backend `claude-cli` gabungan:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Sampaikan salam dari Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` mempertahankan instalasi native di bawah `/home/node/.local/bin` dan `/home/node/.local/share/claude`, serta pengaturan/autentikasi Claude Code di bawah `/home/node/.claude` dan `/home/node/.claude.json`. Mempertahankan hanya `/home/node/.openclaw` tidaklah cukup; jika Anda menggunakan `OPENCLAW_EXTRA_MOUNTS` alih-alih volume home, pasang semua jalur Claude tersebut ke kedua layanan.

<Note>
Untuk otomatisasi produksi bersama atau penagihan Anthropic yang dapat diprediksi, utamakan jalur kunci API Anthropic. Penggunaan ulang Claude CLI mengikuti versi terinstal, login akun, penagihan, dan perilaku pembaruan Claude Code.
</Note>

### Bonjour / mDNS

Jaringan bridge Docker biasanya tidak meneruskan multicast Bonjour/mDNS (`224.0.0.251:5353`) secara andal. Ketika `OPENCLAW_DISABLE_BONJOUR` tidak ditetapkan, plugin Bonjour gabungan otomatis menonaktifkan iklan LAN setelah mendeteksi bahwa plugin berjalan dalam kontainer, sehingga tidak akan mengalami crash loop saat berulang kali mencoba multicast yang dibuang bridge. Tetapkan `OPENCLAW_DISABLE_BONJOUR=1` untuk memaksanya nonaktif terlepas dari hasil deteksi, atau `0` untuk memaksanya aktif (hanya pada jaringan host, macvlan, atau jaringan lain yang diketahui mendukung multicast mDNS).

Jika tidak, gunakan URL Gateway yang dipublikasikan, Tailscale, atau DNS-SD area luas untuk host Docker. Lihat [Penemuan Bonjour](/id/gateway/bonjour) untuk kendala dan pemecahan masalah.

### Penyimpanan dan persistensi

Docker Compose memasang secara bind `OPENCLAW_CONFIG_DIR` ke `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` ke `/home/node/.openclaw/workspace`, dan `OPENCLAW_AUTH_PROFILE_SECRET_DIR` ke `/home/node/.config/openclaw`, sehingga jalur tersebut tetap bertahan setelah penggantian kontainer. Ketika suatu variabel tidak ditetapkan, `docker-compose.yml` kembali menggunakan lokasi di bawah `${HOME}`, atau `/tmp` jika `HOME` sendiri tidak ada, sehingga `docker compose up` tidak pernah menghasilkan spesifikasi volume dengan sumber kosong pada lingkungan dasar.

Direktori konfigurasi yang dipasang tersebut menyimpan:

- `openclaw.json` untuk konfigurasi perilaku
- `agents/<agentId>/agent/auth-profiles.json` untuk autentikasi OAuth/kunci API penyedia yang tersimpan
- `.env` untuk rahasia runtime yang didukung env seperti `OPENCLAW_GATEWAY_TOKEN`

Direktori rahasia profil autentikasi menyimpan kunci enkripsi lokal untuk materi token profil autentikasi berbasis OAuth. Simpan bersama status host Docker Anda, tetapi pisahkan dari `OPENCLAW_CONFIG_DIR`.

Plugin unduhan yang diinstal menyimpan status paket di bawah home OpenClaw yang dipasang, sehingga catatan instalasi dan root paket tetap bertahan setelah penggantian kontainer; startup gateway tidak membuat ulang pohon dependensi plugin gabungan.

Untuk detail lengkap persistensi VM, lihat [Runtime VM Docker - Apa yang dipertahankan di mana](/id/install/docker-vm-runtime#what-persists-where).

**Titik utama pertumbuhan disk:** `media/`, database SQLite per agen, transkrip JSONL sesi lama, database status SQLite bersama, root paket plugin yang diinstal, dan log file bergulir di bawah `/tmp/openclaw/`.

### Pembantu shell (opsional)

Untuk perintah harian yang lebih singkat, instal [ClawDock](/id/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jika Anda menginstal dari jalur `scripts/shell-helpers/clawdock-helpers.sh` yang lama, jalankan kembali perintah di atas agar helper lokal Anda mengikuti lokasi saat ini. Kemudian gunakan `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, dan seterusnya (jalankan `clawdock-help` untuk daftar lengkap).

<AccordionGroup>
  <Accordion title="Aktifkan sandbox agen untuk Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Jalur soket khusus (misalnya Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrip memasang `docker.sock` hanya setelah prasyarat sandbox terpenuhi. Jika penyiapan sandbox tidak dapat diselesaikan, skrip mengatur ulang `agents.defaults.sandbox.mode` ke `off`. Mode kode Codex dinonaktifkan untuk giliran saat sandbox OpenClaw aktif (lihat [Sandboxing § Backend Docker](/id/gateway/sandboxing#docker-backend)); jangan pernah memasang soket Docker host ke dalam kontainer sandbox agen.

  </Accordion>

  <Accordion title="Otomatisasi / CI (noninteraktif)">
    Nonaktifkan alokasi pseudo-TTY Compose dengan `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Catatan keamanan jaringan bersama">
    `openclaw-cli` menggunakan `network_mode: "service:openclaw-gateway"` agar perintah CLI dapat menjangkau Gateway melalui `127.0.0.1`. Perlakukan ini sebagai batas kepercayaan bersama. Konfigurasi Compose menghapus `NET_RAW`/`NET_ADMIN` dan mengaktifkan `no-new-privileges` pada `openclaw-gateway` maupun `openclaw-cli`.
  </Accordion>

  <Accordion title="Kegagalan DNS Docker Desktop di openclaw-cli">
    Beberapa penyiapan Docker Desktop gagal melakukan pencarian DNS dari sidecar jaringan bersama `openclaw-cli` setelah `NET_RAW` dihapus, yang muncul sebagai `EAI_AGAIN` selama perintah berbasis npm seperti `openclaw plugins install`. Pertahankan berkas Compose yang diperkeras secara default untuk operasi normal. Override di bawah memulihkan kapabilitas default hanya untuk kontainer `openclaw-cli` — gunakan untuk perintah satu kali yang memerlukan akses registry, bukan sebagai pemanggilan default Anda:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Jika Anda telah membuat kontainer `openclaw-cli` yang berjalan lama, buat ulang dengan override yang sama — `docker compose exec`/`docker exec` tidak dapat mengubah kapabilitas Linux pada kontainer yang sudah dibuat.

  </Accordion>

  <Accordion title="Izin dan EACCES">
    Image berjalan sebagai `node` (uid 1000). Jika Anda melihat kesalahan izin pada `/home/node/.openclaw`, pastikan bind mount host Anda dimiliki oleh uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Ketidakcocokan yang sama dapat muncul sebagai `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` diikuti oleh `plugin present but blocked` — uid proses dan pemilik direktori Plugin yang dipasang tidak cocok. Sebaiknya jalankan sebagai uid default 1000 dan perbaiki kepemilikan bind mount. Ubah kepemilikan `/path/to/openclaw-config/npm` menjadi `root:root` hanya jika Anda sengaja menjalankan OpenClaw sebagai root dalam jangka panjang.

  </Accordion>

  <Accordion title="Build ulang yang lebih cepat">
    Susun Dockerfile agar lapisan dependensi di-cache, sehingga tidak perlu menjalankan ulang `pnpm install` kecuali lockfile berubah:

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

  <Accordion title="Opsi kontainer untuk pengguna mahir">
    Image default mengutamakan keamanan dan berjalan sebagai `node` non-root. Untuk kontainer dengan fitur lebih lengkap:

    1. **Persistenkan `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sertakan dependensi sistem dalam image**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Sertakan dependensi Python dalam image**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Sertakan Playwright Chromium dalam image**: `export OPENCLAW_INSTALL_BROWSER=1`, atau gunakan tag image resmi `-browser`
    5. **Atau instal browser Playwright ke volume persisten**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persistenkan unduhan browser**: gunakan `OPENCLAW_HOME_VOLUME` atau `OPENCLAW_EXTRA_MOUNTS`. OpenClaw secara otomatis mendeteksi Chromium yang dikelola Playwright milik image di Linux.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Jika Anda memilih OAuth OpenAI Codex di wizard, wizard akan membuka URL browser. Dalam Docker atau penyiapan headless, salin URL pengalihan lengkap yang Anda tuju lalu tempelkan kembali ke wizard untuk menyelesaikan autentikasi.
  </Accordion>

  <Accordion title="Metadata image dasar">
    Image runtime menggunakan `node:24-bookworm-slim` dan menjalankan `tini` sebagai PID 1 agar proses zombie dibersihkan dan sinyal ditangani dengan benar dalam kontainer yang berjalan lama. Image tersebut memublikasikan anotasi image dasar OCI, termasuk `org.opencontainers.image.base.name` dan `org.opencontainers.image.source`. Dependabot memperbarui digest dasar Node yang disematkan; build rilis tidak menjalankan lapisan peningkatan distro terpisah. Lihat [anotasi image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Berjalan di VPS?

Lihat [Hetzner (VPS Docker)](/id/install/hetzner) dan [Runtime VM Docker](/id/install/docker-vm-runtime) untuk langkah penerapan VM bersama, termasuk penyertaan biner dalam image, persistensi, dan pembaruan.

## Sandbox agen

Saat `agents.defaults.sandbox` diaktifkan dengan backend Docker, Gateway menjalankan eksekusi alat agen (shell, baca/tulis berkas, dan sebagainya) di dalam kontainer Docker terisolasi sementara Gateway itu sendiri tetap berada di host — batas tegas di sekitar sesi agen yang tidak tepercaya atau multitenan tanpa memasukkan seluruh Gateway ke dalam kontainer.

Cakupan sandbox dapat berupa per agen (default), per sesi, atau bersama; setiap cakupan mendapatkan ruang kerja sendiri yang dipasang di `/workspace`. Anda juga dapat mengonfigurasi kebijakan alat izinkan/tolak, isolasi jaringan, batas sumber daya, dan kontainer browser.

Untuk konfigurasi lengkap, image, catatan keamanan, dan profil multiagen:

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap
- [OpenShell](/id/gateway/openshell) -- akses shell interaktif ke kontainer sandbox
- [Sandbox dan Alat Multiagen](/id/tools/multi-agent-sandbox-tools) -- override per agen

### Aktivasi cepat

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // nonaktif | non-main | semua
        scope: "agent", // sesi | agen | bersama
      },
    },
  },
}
```

Build image sandbox default (dari checkout sumber):

```bash
scripts/sandbox-setup.sh
```

Untuk instalasi npm tanpa checkout sumber, lihat [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) untuk perintah `docker build` sebaris.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Image tidak tersedia atau kontainer sandbox tidak dimulai">
    Build image sandbox dengan [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (checkout sumber) atau perintah `docker build` sebaris dari [Sandboxing § Image dan penyiapan](/id/gateway/sandboxing#images-and-setup) (instalasi npm), atau atur `agents.defaults.sandbox.docker.image` ke image khusus Anda. Kontainer dibuat secara otomatis per sesi sesuai kebutuhan.
  </Accordion>

  <Accordion title="Kesalahan izin dalam sandbox">
    Atur `docker.user` ke UID:GID yang cocok dengan kepemilikan ruang kerja yang dipasang, atau ubah kepemilikan folder ruang kerja.
  </Accordion>

  <Accordion title="Alat khusus tidak ditemukan dalam sandbox">
    OpenClaw menjalankan perintah dengan `sh -lc` (shell login), yang memuat `/etc/profile` dan dapat mengatur ulang PATH. Atur `docker.env.PATH` untuk menambahkan jalur alat khusus Anda di awal, atau tambahkan skrip di bawah `/etc/profile.d/` dalam Dockerfile Anda.
  </Accordion>

  <Accordion title="Dihentikan OOM selama build image (exit 137)">
    VM memerlukan RAM minimal 2 GB. Gunakan kelas mesin yang lebih besar dan coba lagi.
  </Accordion>

  <Accordion title="Tidak diotorisasi atau pemasangan diperlukan di UI Kontrol">
    Ambil tautan dasbor baru dan setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Detail selengkapnya: [Dasbor](/id/web/dashboard), [Perangkat](/id/cli/devices).

  </Accordion>

  <Accordion title="Target Gateway menampilkan ws://172.x.x.x atau kesalahan pemasangan dari CLI Docker">
    Atur ulang mode dan bind Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar Instalasi](/id/install) — semua metode instalasi
- [Podman](/id/install/podman) — alternatif Podman untuk Docker
- [ClawDock](/id/install/clawdock) — penyiapan Docker Compose komunitas
- [Pembaruan](/id/install/updating) — menjaga OpenClaw tetap mutakhir
- [Konfigurasi](/id/gateway/configuration) — konfigurasi Gateway setelah instalasi

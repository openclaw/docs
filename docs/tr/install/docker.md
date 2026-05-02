---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk kullanım süreci
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:47:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca containerized Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmayan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox backend'i, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox backend'leri de mevcuttur. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Image build için en az 2 GB RAM (`pnpm install`, 1 GB host'larda çıkış 137 ile OOM-killed olabilir)
- Image'lar ve günlükler için yeterli disk alanı
- Bir VPS/public host üzerinde çalıştırıyorsanız,
  [ağ erişimi için güvenlik sertleştirmesini](/tr/gateway/security),
  özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Containerized Gateway

<Steps>
  <Step title="Build the image">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway image'ını yerelde oluşturur. Bunun yerine önceden oluşturulmuş bir image kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden oluşturulmuş image'lar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - provider API anahtarlarını ister
    - bir Gateway token'ı üretir ve `.env` içine yazar
    - Gateway'i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve config yazma işlemleri doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway container'ı zaten
    mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Open the Control UI">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan secret'ı Settings içine yapıştırın. Kurulum betiği varsayılan olarak
    `.env` içine bir token yazar; container config'ini password auth'a geçirirseniz
    bunun yerine o password'ü kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Mesajlaşma kanalları eklemek için CLI container'ını kullanın:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord)

  </Step>
</Steps>

### Manuel akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ederseniz:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` komutunu repo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml`
yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway`'in ağ namespace'ini paylaştığı için bir
başlatma sonrası aracıdır. `docker compose up -d openclaw-gateway` öncesinde,
onboarding ve kurulum zamanı config yazma işlemlerini `--no-deps --entrypoint node`
ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerelde oluşturmak yerine uzaktaki bir image kullan             |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Build sırasında ek apt paketleri kur (boşlukla ayrılmış)        |
| `OPENCLAW_EXTENSIONS`                      | Build zamanında seçili bundled Plugin yardımcılarını dahil et   |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı hale getir |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap'a katıl (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atla (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu override et                                |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırak (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bundled Plugin kaynak bind-mount overlay'lerini devre dışı bırak |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry export için paylaşılan OTLP/HTTP collector endpoint'i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Trace, metric veya loglar için sinyale özel OTLP endpoint'leri  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol override'ı. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resource'ları için kullanılan servis adı          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI semantik özniteliklerine katıl           |
| `OPENCLAW_OTEL_PRELOADED`                  | Biri önceden yüklüyse ikinci bir OpenTelemetry SDK başlatmayı atla |

Maintainer'lar, bir Plugin kaynak dizinini packaged kaynak yolunun üzerine mount ederek
bundled Plugin kaynağını packaged image'a karşı test edebilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu mount edilmiş kaynak dizini, aynı Plugin id'si için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` bundle'ını override eder.

### Gözlemlenebilirlik

OpenTelemetry export, Gateway container'ından OTLP collector'ınıza dışa doğrudur.
Yayımlanmış bir Docker portu gerektirmez. Image'ı yerelde oluşturuyorsanız ve
bundled OpenTelemetry exporter'ın image içinde kullanılabilir olmasını istiyorsanız,
runtime bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Export'u etkinleştirmeden önce packaged Docker kurulumlarında ClawHub'dan resmi
`@openclaw/diagnostics-otel` Plugin'ini kurun. Özel source-built image'lar yine de
yerel Plugin kaynağını `OPENCLAW_EXTENSIONS=diagnostics-otel` ile dahil edebilir.
Export'u etkinleştirmek için config içinde `diagnostics-otel` Plugin'ine izin verip
etkinleştirin, ardından `diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry export](/tr/gateway/opentelemetry) içindeki config örneğini kullanın.
Collector auth header'ları Docker ortam değişkenleri üzerinden değil,
`diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metric'leri zaten yayımlanmış Gateway portunu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route, Gateway authentication ile korunur. Ayrı bir public `/metrics` portu veya
kimliği doğrulanmamış reverse-proxy yolu açmayın. Bkz.
[Prometheus metric'leri](/tr/gateway/prometheus).

### Health check'ler

Container probe endpoint'leri (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image, `/healthz` ping'leyen yerleşik bir `HEALTHCHECK` içerir.
Check'ler başarısız olmaya devam ederse Docker container'ı `unhealthy` olarak işaretler ve
orchestration sistemleri onu yeniden başlatabilir veya değiştirebilir.

Authenticated derin health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh`, `http://127.0.0.1:18789` adresine host erişiminin
Docker port publishing ile çalışması için varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway portuna erişebilir.
- `loopback`: Gateway'e yalnızca container ağ namespace'i içindeki süreçler doğrudan erişebilir.

<Note>
Host alias'ları olan `0.0.0.0` veya `127.0.0.1` yerine `gateway.bind` içindeki
bind mode değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın.
</Note>

### Host Local Provider'lar

OpenClaw Docker içinde çalıştığında, container içindeki `127.0.0.1` host
makineniz değil, container'ın kendisidir. Host üzerinde çalışan AI provider'ları
için `host.docker.internal` kullanın:

| Provider  | Host varsayılan URL'si   | Docker kurulum URL'si              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Bundled Docker kurulumu, LM Studio ve Ollama onboarding varsayılanları olarak
bu host URL'lerini kullanır ve `docker-compose.yml`, Linux Docker Engine için
`host.docker.internal` adresini Docker'ın host gateway'ine eşler. Docker Desktop,
macOS ve Windows üzerinde aynı hostname'i zaten sağlar.

Host servisleri Docker'dan erişilebilir bir adreste de dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı host
eşlemesini kendiniz ekleyin; örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast'ini
(`224.0.0.251:5353`) güvenilir şekilde iletmez. Bu nedenle bundled Compose kurulumu
varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; böylece Gateway, bridge
multicast trafiğini düşürdüğünde crash-loop'a girmez veya duyuruyu tekrar tekrar
yeniden başlatmaz.

Docker host'ları için yayımlanmış Gateway URL'sini, Tailscale'i veya wide-area
DNS-SD kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking,
macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ ile çalıştırırken ayarlayın.

Dikkat edilmesi gerekenler ve sorun giderme için bkz. [Bonjour discovery](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` yolunu `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` yolunu `/home/node/.openclaw/workspace` yoluna bind-mount eder;
böylece bu yollar container değişiminden sağ çıkar. Değişkenlerden biri ayarlı değilse
bundled `docker-compose.yml`, `${HOME}/.openclaw` değerine (workspace mount için
`${HOME}/.openclaw/workspace` değerine) veya `HOME` de eksikse `/tmp/.openclaw`
değerine geri döner. Bu, çıplak ortamlarda `docker compose up` komutunun boş kaynaklı
volume spec yaymasını engeller.

Bu mount edilmiş config dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış config'i için `openclaw.json`
- saklanan provider OAuth/API-key auth için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env-backed runtime secret'ları için `.env`

Kurulan indirilebilir Plugin'ler package state'lerini mount edilmiş OpenClaw home altında
depolar; böylece Plugin kurulum kayıtları ve package kökleri container değişiminden
sağ çıkar. Gateway başlangıcı bundled-Plugin dependency tree'leri üretmez.

VM deployment'larında tam kalıcılık ayrıntıları için bkz.
[Docker VM Runtime - Nerede ne kalıcıdır](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyüme sıcak noktaları:** `/tmp/openclaw/` altındaki `media/`, oturum JSONL dosyaları,
`cron/runs/*.jsonl`, kurulu plugin paket kökleri ve dönen dosya günlüklerini
izleyin.

### Shell yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) sayfasına bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için agent sandbox'ı etkinleştir">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel socket yolu (örn. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik `docker.sock` dosyasını yalnızca sandbox önkoşulları geçtikten sonra bağlar. Sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmasını `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden gateway'e erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven
    sınırı olarak değerlendirin. Compose yapılandırması `NET_RAW`/`NET_ADMIN` izinlerini kaldırır ve
    `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000 tarafından sahiplenildiğinden emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile dosyanızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmedikçe
    `pnpm install` komutunun yeniden çalıştırılmasını önler:

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

  <Accordion title="İleri düzey kullanıcı container seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha
    tam özellikli bir container için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarlayın ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz, bir tarayıcı URL'si açar. Docker veya headless kurulumlarda, vardığınız tam yönlendirme URL'sini kopyalayıp kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj ek açıklamalarını yayımlar. Node temel özeti
    Dependabot Docker temel imaj PR'ları üzerinden yenilenir; yayın derlemeleri bir dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj ek açıklamaları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosyayı imaja ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için
[Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Agent sandbox

`agents.defaults.sandbox`, Docker backend ile etkinleştirildiğinde gateway,
gateway'in kendisi ana makinede kalırken agent araç yürütmesini (shell, dosya okuma/yazma vb.) yalıtılmış Docker
container'ları içinde çalıştırır. Bu, tüm gateway'i container'a almadan güvenilmeyen veya çok kiracılı agent oturumlarının etrafına sağlam bir duvar koyar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca izin ver/reddet araç politikaları, ağ yalıtımı, kaynak sınırları ve tarayıcı
container'ları yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çoklu agent profilleri için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox container'larına etkileşimli shell erişimi
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar

### Hızlı etkinleştirme

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

Varsayılan sandbox imajını derleyin (kaynak checkout'tan):

```bash
scripts/sandbox-setup.sh
```

Kaynak checkout olmadan npm kurulumları için, satır içi `docker build` komutları için [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox container başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout) ile ya da [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin
    veya `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Container'lar gerektiğinde oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlı çalışma alanı sahipliğinizle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini chown ile değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu
    `/etc/profile` dosyasını kaynak olarak alır ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın
    veya Dockerfile içinde `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (çıkış 137)">
    VM'nin en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde yetkisiz veya eşleştirme gerekli">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Devices](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan eşleştirme hataları geliyor">
    Gateway modunu ve bind ayarını sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Install Overview](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Updating](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Configuration](/tr/gateway/configuration) — kurulum sonrası gateway yapılandırması

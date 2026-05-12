---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk yapılandırma
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca container içinde çalışan bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmadan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox backend'i, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox backend'leri de kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Görüntü derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB host'larda çıkış 137 ile OOM nedeniyle sonlandırılabilir)
- Görüntüler ve loglar için yeterli disk alanı
- Bir VPS/herkese açık host üzerinde çalıştırıyorsanız,
  [ağ erişimi için güvenlik sertleştirmesi](/tr/gateway/security) bölümünü,
  özellikle Docker `DOCKER-USER` firewall politikasını inceleyin.

## Container içinde Gateway

<Steps>
  <Step title="Görüntüyü derleyin">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway görüntüsünü yerel olarak derler. Bunun yerine önceden derlenmiş bir görüntü kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş görüntüler
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="Onboarding'i tamamlayın">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - provider API anahtarlarını sorar
    - bir Gateway token'ı oluşturur ve `.env` dosyasına yazar
    - auth-profile gizli anahtar dizinini oluşturur
    - Gateway'i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve config yazma işlemleri
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway
    container'ı zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'ı açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan secret'ı Settings içine yapıştırın. Kurulum betiği varsayılan
    olarak `.env` dosyasına bir token yazar; container config'ini parola
    auth'una geçirirseniz bunun yerine o parolayı kullanın.

    URL tekrar mı gerekiyor?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml`
yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway`'in ağ namespace'ini paylaştığı için
başlatma sonrası bir araçtır. `docker compose up -d openclaw-gateway` öncesinde,
onboarding ve kurulum zamanı config yazma işlemlerini `openclaw-gateway`
üzerinden `--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerel olarak derlemek yerine uzak bir görüntü kullanır          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında seçili birlikte gelen Plugin yardımcılarını dahil eder |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı yapar |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap'a katılır (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu override eder                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Birlikte gelen Plugin kaynak bind-mount overlay'lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector endpoint'i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Trace, metric veya loglar için sinyale özel OTLP endpoint'leri  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol override'ı. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resource'ları için kullanılan servis adı          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI semantik attribute'larına katılır        |
| `OPENCLAW_OTEL_PRELOADED`                  | Bir tane önceden yüklenmişse ikinci OpenTelemetry SDK'sının başlatılmasını atlar |

Maintainer'lar, paketlenmiş bir görüntüye karşı birlikte gelen Plugin kaynağını,
örneğin `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ile bir Plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine mount ederek test edebilir.
Bu mount edilmiş kaynak dizini, aynı Plugin id'si için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` bundle'ını override eder.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway container'ından OTLP collector'ınıza doğru
dışa yönlüdür. Yayımlanmış bir Docker port'u gerektirmez. Görüntüyü yerel olarak
derliyorsanız ve birlikte gelen OpenTelemetry exporter'ın görüntü içinde
kullanılabilir olmasını istiyorsanız, runtime bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce resmi
`@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun. Özel kaynak derlemeli
görüntüler yerel Plugin kaynağını yine
`OPENCLAW_EXTENSIONS=diagnostics-otel` ile dahil edebilir. Dışa aktarımı
etkinleştirmek için config içinde `diagnostics-otel` Plugin'ine izin verin ve
onu etkinleştirin, ardından `diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) içindeki config örneğini kullanın.
Collector auth header'ları Docker ortam değişkenleriyle değil,
`diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metric'leri zaten yayımlanmış Gateway port'unu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route, Gateway kimlik doğrulamasıyla korunur. Ayrı bir herkese açık `/metrics`
port'u veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metric'leri](/tr/gateway/prometheus).

### Health check'ler

Container probe endpoint'leri (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker görüntüsü, `/healthz` endpoint'ine ping atan yerleşik bir `HEALTHCHECK`
içerir. Check'ler sürekli başarısız olursa Docker container'ı `unhealthy`
olarak işaretler ve orchestration sistemleri onu yeniden başlatabilir veya
değiştirebilir.

Kimlik doğrulamalı ayrıntılı health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, `http://127.0.0.1:18789` adresine host erişimi Docker
port yayımlama ile çalışsın diye varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan`
ayarlar.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway port'una erişebilir.
- `loopback`: yalnızca container ağ namespace'i içindeki process'ler Gateway'e
  doğrudan erişebilir.

<Note>
Host alias'ları olan `0.0.0.0` veya `127.0.0.1` yerine `gateway.bind` içindeki
bind modu değerlerini (`lan` / `loopback` / `custom` / `tailnet` / `auto`) kullanın.
</Note>

### Host Yerel Provider'lar

OpenClaw Docker içinde çalıştığında, container içindeki `127.0.0.1` host
makineniz değil, container'ın kendisidir. Host üzerinde çalışan AI provider'ları
için `host.docker.internal` kullanın:

| Provider  | Host varsayılan URL'si    | Docker kurulum URL'si              |
| --------- | ------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

Birlikte gelen Docker kurulumu, LM Studio ve Ollama onboarding varsayılanları
olarak bu host URL'lerini kullanır ve `docker-compose.yml`,
`host.docker.internal` adını Linux Docker Engine için Docker'ın host gateway'ine
eşler. Docker Desktop zaten macOS ve Windows'ta aynı hostname'i sağlar.

Host servisleri ayrıca Docker'dan erişilebilir bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız, aynı host
eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge networking genellikle Bonjour/mDNS multicast'i
(`224.0.0.251:5353`) güvenilir biçimde iletmez. Bu nedenle birlikte gelen
Compose kurulumu varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; böylece
Gateway crash-loop'a girmez veya bridge multicast trafiğini düşürdüğünde
duyuru yapmayı tekrar tekrar yeniden başlatmaz.

Docker host'ları için yayımlanmış Gateway URL'sini, Tailscale'i veya wide-area
DNS-SD'yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host
networking, macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ ile
çalıştırırken ayarlayın.

İpuçları ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` yoluna,
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` yoluna ve
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` değerini `/home/node/.config/openclaw` yoluna
bind-mount eder; böylece bu yollar container değiştirildiğinde de korunur.
Herhangi bir değişken ayarlı değilse, birlikte gelen `docker-compose.yml`
`${HOME}` altına, `HOME` de yoksa `/tmp` altına fallback yapar. Bu, çıplak
ortamlarda `docker compose up` komutunun boş kaynaklı volume spec'i üretmesini
engeller.

Bu mount edilmiş config dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış config'i için `openclaw.json`
- saklanan provider OAuth/API-key auth için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli runtime secret'ları için `.env`

Auth-profile gizli anahtar dizini, OAuth destekli auth profile token materyali
için kullanılan yerel şifreleme anahtarını saklar. Bunu Docker host durumunuzla
birlikte, ancak `OPENCLAW_CONFIG_DIR` dizininden ayrı tutun.

İndirilebilir yüklü plugin'ler paket durumlarını bağlanan OpenClaw home altında saklar; böylece plugin kurulum kayıtları ve paket kökleri container değişiminden sonra da korunur. Gateway başlangıcı, paketlenmiş plugin bağımlılık ağaçları oluşturmaz.

VM dağıtımlarında kalıcılık ayrıntılarının tamamı için bkz.
[Docker VM Runtime - Nerede ne kalıcıdır](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi yoğun noktaları:** `media/`, oturum JSONL dosyaları,
`cron/runs/*.jsonl`, yüklü plugin paket kökleri ve `/tmp/openclaw/`
altındaki dönen dosya loglarını izleyin.

### Shell yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` yükleyin:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan yüklediyseniz, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için bkz. [ClawDock](/tr/install/clawdock).

<AccordionGroup>
  <Accordion title="Docker Gateway için ajan sandbox'ını etkinleştir">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel soket yolu (ör. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik `docker.sock` dosyasını yalnızca sandbox önkoşulları geçtikten sonra bağlar. Sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar. OpenClaw sandbox'ı etkinken Codex kod modu turları hâlâ Codex
    `workspace-write` ile sınırlıdır; ana makine Docker soketini ajan sandbox container'larına bağlamayın.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose pseudo-TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının Gateway'e `127.0.0.1` üzerinden ulaşabilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak ele alın. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini düşürür ve hem `openclaw-gateway` hem de `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içinde Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumlarında, `NET_RAW` düşürüldükten sonra paylaşılan ağdaki `openclaw-cli` sidecar'ından DNS sorguları başarısız olur; bu da `openclaw plugins install` gibi npm destekli komutlar sırasında `EAI_AGAIN` olarak görünür. Normal Gateway çalışması için varsayılan sertleştirilmiş Compose dosyasını koruyun. Aşağıdaki yerel geçersiz kılma, Docker'ın varsayılan yeteneklerini geri yükleyerek CLI container'ının güvenlik duruşunu gevşetir; bu nedenle bunu varsayılan Compose çağrınız olarak değil, yalnızca paket kayıt defteri erişimi gerektiren tek seferlik CLI komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Zaten uzun süre çalışan bir `openclaw-cli` container'ı oluşturduysanız, aynı geçersiz kılmayla yeniden oluşturun. `docker compose exec` ve `docker exec`, zaten oluşturulmuş bir container üzerinde Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    Görüntü `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` gibi bir plugin uyarısı ve ardından `plugin present but blocked` olarak da görünebilir. Bu, süreç uid'si ile bağlanan plugin dizini sahibinin uyuşmadığı anlamına gelir. Container'ı varsayılan uid 1000 ile çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. Yalnızca OpenClaw'u uzun vadede kasıtlı olarak root olarak çalıştırıyorsanız `/path/to/openclaw-config/npm` için `root:root` ile chown yapın.

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmedikçe `pnpm install` komutunun yeniden çalışmasını önler:

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
    Varsayılan görüntü güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha tam özellikli bir container için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını görüntüye ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium'u görüntüye ekleyin**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Veya Playwright tarayıcılarını kalıcı bir volume içine yükleyin**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Tarayıcı indirmelerini kalıcı yapın**: `OPENCLAW_HOME_VOLUME` veya
       `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux'ta Docker görüntüsünün Playwright tarafından yönetilen Chromium'unu otomatik olarak algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz, bir tarayıcı URL'si açılır. Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayıp kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel görüntü metadata'sı">
    Ana Docker runtime görüntüsü `node:24-bookworm-slim` kullanır ve uzun süre çalışan container'larda zombie süreçlerin toplanmasını ve sinyallerin doğru işlenmesini sağlamak için giriş noktası init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil olmak üzere OCI temel görüntü notlarını yayımlar. Node temel özeti, Dependabot Docker temel görüntü PR'leri üzerinden yenilenir; release derlemeleri bir distro yükseltme katmanı çalıştırmaz. Bkz.
    [OCI görüntü notları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosyayı görüntüye ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için bkz. [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime).

## Ajan sandbox'ı

`agents.defaults.sandbox` Docker backend'iyle etkinleştirildiğinde Gateway,
ajan araç yürütmesini (shell, dosya okuma/yazma vb.) izole Docker container'ları içinde çalıştırırken Gateway'in kendisi ana makinede kalır. Bu, Gateway'in tamamını container'laştırmadan güvenilmeyen veya çok kiracılı ajan oturumlarının etrafında güçlü bir duvar sağlar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam, `/workspace` konumuna bağlanan kendi workspace'ini alır. Ayrıca izin verme/reddetme araç politikaları, ağ izolasyonu, kaynak limitleri ve tarayıcı container'ları yapılandırabilirsiniz.

Tam yapılandırma, görüntüler, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- eksiksiz sandbox referansı
- [OpenShell](/tr/gateway/openshell) -- sandbox container'larına etkileşimli shell erişimi
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar

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

Varsayılan sandbox görüntüsünü derleyin (kaynak checkout'undan):

```bash
scripts/sandbox-setup.sh
```

Kaynak checkout'u olmadan npm kurulumları için satır içi `docker build` komutları hakkında bkz. [Sandboxing § Görüntüler ve kurulum](/tr/gateway/sandboxing#images-and-setup).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Görüntü eksik veya sandbox container'ı başlamıyor">
    Sandbox görüntüsünü
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout'u) ile veya [Sandboxing § Görüntüler ve kurulum](/tr/gateway/sandboxing#images-and-setup) içindeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel görüntünüze ayarlayın.
    Container'lar talep üzerine oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan workspace sahipliğinizle eşleşen bir UID:GID olarak ayarlayın veya workspace klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu da
    `/etc/profile` dosyasını kaynak olarak alır ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` değerini ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="Görüntü derlemesi sırasında OOM-killed (çıkış 137)">
    VM'nin en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanıp yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI'da yetkisiz veya eşleştirme gerekli">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan eşleştirme hataları geliyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker alternatifi Podman
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'u güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması

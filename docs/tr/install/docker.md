---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk kullanıma hazırlık
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılaştırılmış bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsunuz veya OpenClaw'u yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalıştırıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandbox notu**: varsayılan sandbox arka ucu, sandbox etkinleştirildiğinde Docker kullanır; ancak sandbox varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde çıkış 137 ile OOM nedeniyle sonlandırılabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede çalıştırıyorsanız,
  [ağ erişimine açma için güvenlik sıkılaştırmasını](/tr/gateway/security),
  özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını gözden geçirin.

## Kapsayıcılaştırılmış Gateway

<Steps>
  <Step title="İmajı derleyin">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway imajını yerel olarak derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="İlk yapılandırmayı tamamlayın">
    Kurulum betiği ilk yapılandırmayı otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway token'ı oluşturur ve `.env` dosyasına yazar
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlatma öncesi ilk yapılandırma ve yapılandırma yazımları
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway
    kapsayıcısı zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'ı açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan sırrı Settings'e yapıştırın. Kurulum betiği varsayılan olarak
    `.env` dosyasına bir token yazar; kapsayıcı yapılandırmasını parola
    kimlik doğrulamasına geçirirseniz bunun yerine o parolayı kullanın.

    URL'ye tekrar mı ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI kapsayıcısını kullanın:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord)

  </Step>
</Steps>

### Manuel akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ediyorsanız:

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği
`docker-compose.extra.yml` dosyasını yazar; bunu
`-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway`'in ağ ad alanını paylaştığı için bir
başlatma sonrası aracıdır. `docker compose up -d openclaw-gateway` öncesinde
ilk yapılandırmayı ve kurulum zamanı yapılandırma yazımlarını
`--no-deps --entrypoint node` ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                  | Amaç                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Yerel olarak derlemek yerine uzak bir imaj kullan              |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Derleme sırasında ek apt paketleri kur (boşlukla ayrılmış)     |
| `OPENCLAW_EXTENSIONS`                     | Derleme zamanında seçilmiş paketli Plugin yardımcılarını dahil et |
| `OPENCLAW_EXTRA_MOUNTS`                   | Ek ana makine bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı tut |
| `OPENCLAW_SANDBOX`                        | Sandbox bootstrap'a katıl (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_SKIP_ONBOARDING`                | Etkileşimli ilk yapılandırma adımını atla (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                  | Docker socket yolunu geçersiz kıl                              |
| `OPENCLAW_DISABLE_BONJOUR`                | Bonjour/mDNS duyurusunu devre dışı bırak (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketli Plugin kaynak bind-mount overlay'lerini devre dışı bırak |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector endpoint'i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | İzler, metrikler veya günlükler için sinyale özgü OTLP endpoint'leri |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                       | OpenTelemetry kaynakları için kullanılan servis adı            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | En yeni deneysel GenAI semantik özniteliklerine katıl          |
| `OPENCLAW_OTEL_PRELOADED`                 | Biri önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atla |

Bakımcılar, paketlenmiş bir imaja karşı paketli Plugin kaynağını test etmek için
bir Plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine bağlayabilir;
örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanan kaynak dizini, aynı Plugin kimliği için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway kapsayıcısından OTLP collector'ınıza
dışa doğrudur. Yayımlanmış bir Docker portu gerektirmez. İmajı yerel olarak
derliyorsanız ve paketli OpenTelemetry dışa aktarıcısının imaj içinde
kullanılabilir olmasını istiyorsanız çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Dışa aktarımı etkinleştirmeden önce paketlenmiş Docker kurulumlarında resmi
`@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun. Özel kaynak derlemeli
imajlar yine de yerel Plugin kaynağını `OPENCLAW_EXTENSIONS=diagnostics-otel`
ile dahil edebilir. Dışa aktarımı etkinleştirmek için yapılandırmada
`diagnostics-otel` Plugin'ine izin verin ve onu etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
içindeki yapılandırma örneğini kullanın. Collector kimlik doğrulama üstbilgileri
Docker ortam değişkenleriyle değil, `diagnostics.otel.headers` üzerinden
yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway portunu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel `/metrics` portu
veya kimlik doğrulamasız ters proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık kontrolleri

Kapsayıcı probe endpoint'leri (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Kontroller başarısız olmaya devam ederse Docker kapsayıcıyı `unhealthy` olarak
işaretler ve orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlama ile
`http://127.0.0.1:18789` üzerinden ana makine erişiminin çalışması için
varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'ı yayımlanmış Gateway portuna erişebilir.
- `loopback`: yalnızca kapsayıcı ağ ad alanı içindeki süreçler Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bind modu değerlerini kullanın (`lan` / `loopback` /
`custom` / `tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi ana makine
takma adlarını kullanmayın.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında kapsayıcı içindeki `127.0.0.1`, ana
makineniz değil kapsayıcının kendisidir. Ana makinede çalışan AI sağlayıcıları
için `host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si              |
| --------- | ---------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Paketli Docker kurulumu, LM Studio ve Ollama ilk yapılandırma varsayılanları
olarak bu ana makine URL'lerini kullanır ve `docker-compose.yml`, Linux Docker
Engine için `host.docker.internal` adını Docker'ın ana makine Gateway'ine eşler.
Docker Desktop, macOS ve Windows'ta aynı ana makine adını zaten sağlar.

Ana makine servisleri Docker'dan erişilebilir bir adreste de dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı ana
makine eşlemesini kendiniz ekleyin; örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast'i (`224.0.0.251:5353`)
güvenilir biçimde iletmez. Bu nedenle paketli Compose kurulumu varsayılan
olarak `OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece bridge multicast trafiğini
düşürdüğünde Gateway crash-loop'a girmez veya duyuruyu tekrar tekrar yeniden
başlatmaz.

Docker ana makineleri için yayımlanmış Gateway URL'sini, Tailscale'i veya geniş
alan DNS-SD'yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host
networking, macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ ile
çalıştırırken ayarlayın.

Dikkat edilmesi gerekenler ve sorun giderme için bkz.
[Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değişkenini `/home/node/.openclaw`
dizinine ve `OPENCLAW_WORKSPACE_DIR` değişkenini
`/home/node/.openclaw/workspace` dizinine bind-mount eder; böylece bu yollar
kapsayıcı değiştirildiğinde korunur. Değişkenlerden biri ayarlanmamışsa paketli
`docker-compose.yml`, `${HOME}/.openclaw` dizinine (workspace mount için
`${HOME}/.openclaw/workspace` dizinine) veya `HOME` kendisi de yoksa
`/tmp/.openclaw` dizinine geri döner. Bu, `docker compose up` komutunun yalın
ortamlarda boş kaynaklı bir volume belirtimi üretmesini engeller.

Bu bağlanan yapılandırma dizini, OpenClaw'un şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- depolanmış sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı sırları için `.env`

Kurulan indirilebilir Plugin'ler paket durumlarını bağlanan OpenClaw ana dizini
altında saklar; böylece Plugin kurulum kayıtları ve paket kökleri kapsayıcı
değiştirildiğinde korunur. Gateway başlangıcı paketli Plugin bağımlılık ağaçları
oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Çalışma Zamanı - Ne nerede kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyüme yoğun noktaları:** `media/`, oturum JSONL dosyalarını,
`cron/runs/*.jsonl`, kurulu Plugin paket köklerini ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` yükleyin:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` raw yolundan yüklediyseniz, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki yükleme komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için ajan korumalı alanını etkinleştir">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel socket yolu (ör. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik, `docker.sock` bağlamasını yalnızca sandbox önkoşulları geçtikten sonra yapar. Sandbox kurulumu tamamlanamazsa, betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar. OpenClaw sandbox etkin durumdayken Codex kod modu dönüşleri hâlâ Codex
    `workspace-write` ile sınırlıdır; ana makinenin Docker socket'ini ajan sandbox kapsayıcılarına bağlamayın.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının gateway'e `127.0.0.1` üzerinden erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak değerlendirin. Compose yapılandırması hem `openclaw-gateway` hem de `openclaw-cli` üzerinde `NET_RAW`/`NET_ADMIN` kaldırır ve `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içinde Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumlarında `NET_RAW` kaldırıldıktan sonra paylaşılan ağdaki
    `openclaw-cli` sidecar'ından DNS sorguları başarısız olur; bu, `openclaw plugins install` gibi npm destekli komutlar sırasında
    `EAI_AGAIN` olarak görünür.
    Normal gateway çalışması için varsayılan güçlendirilmiş compose dosyasını koruyun. Aşağıdaki yerel override, Docker'ın varsayılan yeteneklerini geri yükleyerek CLI kapsayıcısının güvenlik duruşunu gevşetir; bu nedenle bunu varsayılan Compose çağrınız olarak değil, yalnızca paket kayıt defteri erişimi gerektiren tek seferlik CLI komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Zaten uzun süre çalışan bir `openclaw-cli` kapsayıcısı oluşturduysanız, aynı override ile yeniden oluşturun. `docker compose exec` ve `docker exec`, önceden oluşturulmuş bir kapsayıcıda Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` olarak çalışır (uid 1000). `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000 tarafından sahiplenildiğinden emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ardından `plugin present but blocked` gibi bir Plugin uyarısı olarak da görünebilir. Bu, süreç uid'si ile bağlanan Plugin dizini sahibinin uyuşmadığı anlamına gelir. Kapsayıcıyı varsayılan uid 1000 ile çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. Yalnızca OpenClaw'u uzun vadede root olarak çalıştırmayı özellikle amaçlıyorsanız
    `/path/to/openclaw-config/npm` sahipliğini `root:root` yapın.

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmedikçe
    `pnpm install` komutunun yeniden çalışmasını önler:

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

  <Accordion title="İleri düzey kullanıcı kapsayıcı seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha tam özellikli bir kapsayıcı için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium'u imaja ekleyin**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Veya Playwright tarayıcılarını kalıcı bir birime yükleyin**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Tarayıcı indirmelerini kalıcı yapın**: `OPENCLAW_HOME_VOLUME` veya
       `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux üzerinde Docker imajının Playwright tarafından yönetilen Chromium'unu otomatik algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz, bir tarayıcı URL'si açar. Docker veya headless kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayıp kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve uzun süre çalışan kapsayıcılarda zombi süreçlerin temizlenmesini ve sinyallerin doğru işlenmesini sağlamak için giriş noktası init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerlerini içeren OCI temel imaj anotasyonlarını yayımlar. Node temel özeti, Dependabot Docker temel imaj PR'ları aracılığıyla yenilenir; sürüm derlemeleri dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj anotasyonları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya imaja ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) bölümlerine bakın.

## Ajan sandbox'ı

`agents.defaults.sandbox` Docker backend ile etkinleştirildiğinde, gateway, kendisi ana makinede kalırken ajan araç yürütmesini (kabuk, dosya okuma/yazma vb.) yalıtılmış Docker kapsayıcıları içinde çalıştırır. Bu, tüm gateway'i kapsayıcılaştırmadan güvenilmeyen veya çok kiracılı ajan oturumlarının etrafında sağlam bir duvar sağlar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsamın `/workspace` konumuna bağlanan kendi çalışma alanı olur. Ayrıca izin ver/reddet araç politikalarını, ağ yalıtımını, kaynak sınırlarını ve tarayıcı kapsayıcılarını yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çoklu ajan profilleri için bkz.:

- [Korumalı alana alma](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli kabuk erişimi
- [Çoklu Ajan Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına override'lar

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

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları için [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox kapsayıcısı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout) ile veya [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm install) derleyin
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar gerektiğinde oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw, komutları `sh -lc` (login shell) ile çalıştırır; bu
    `/etc/profile` dosyasını kaynak olarak okur ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınıza `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (exit 137)">
    VM'nin en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde yetkisiz veya eşleştirme gerekli">
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
- [Yapılandırma](/tr/gateway/configuration) — kurulum sonrası gateway yapılandırması

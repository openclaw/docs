---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk katılım
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: izole, geçici bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalıştırıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox arka ucu, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde çıkış 137 ile OOM nedeniyle sonlandırılabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede çalıştırıyorsanız,
  [Ağ erişimi için güvenlik sağlamlaştırması](/tr/gateway/security)
  bölümünü, özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini gözden geçirin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="İmajı derle">
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
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="Onboarding'i tamamla">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway belirteci oluşturur ve `.env` içine yazar
    - Gateway'i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve yapılandırma yazma işlemleri doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway konteyneri zaten
    mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'ı aç">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan sırrı Settings içine yapıştırın. Kurulum betiği varsayılan olarak
    `.env` içine bir belirteç yazar; konteyner yapılandırmasını parola kimlik doğrulamasına geçirirseniz,
    bunun yerine o parolayı kullanın.

    URL tekrar mı gerekiyor?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandır (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI konteynerini kullanın:

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
`openclaw-cli`, `openclaw-gateway`'in ağ ad alanını paylaştığı için başlatma sonrası
bir araçtır. `docker compose up -d openclaw-gateway` öncesinde onboarding'i
ve kurulum zamanı yapılandırma yazma işlemlerini `openclaw-gateway` üzerinden
`--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerel olarak derlemek yerine uzak bir imaj kullanır             |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında seçili paketlenmiş Plugin yardımcılarını dahil eder |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek ana makine bağlama noktaları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı tutar |
| `OPENCLAW_SANDBOX`                         | Sandbox önyüklemesine katılır (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker soket yolunu geçersiz kılar                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketlenmiş Plugin kaynak bind-mount overlay'lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector uç noktası |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | İzler, metrikler veya günlükler için sinyale özel OTLP uç noktaları |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan hizmet adı             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En son deneysel GenAI semantik özniteliklerine katılır          |
| `OPENCLAW_OTEL_PRELOADED`                  | Biri önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atlar |

Bakımcılar, paketlenmiş bir imaja karşı paketlenmiş Plugin kaynağını test etmek için
bir Plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine bağlayabilir, örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanmış kaynak dizini, aynı Plugin id için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway konteynerinden OTLP collector'ınıza doğru
çıkış yönündedir. Yayımlanmış bir Docker portu gerektirmez. İmajı yerel olarak derliyorsanız
ve paketlenmiş OpenTelemetry exporter'ın imaj içinde kullanılabilir olmasını istiyorsanız,
çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce resmi
`@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun. Özel kaynak derlemeli
imajlar yerel Plugin kaynağını yine
`OPENCLAW_EXTENSIONS=diagnostics-otel` ile dahil edebilir. Dışa aktarımı etkinleştirmek için,
yapılandırmada `diagnostics-otel` Plugin'ine izin verip etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry
dışa aktarımı](/tr/gateway/opentelemetry) içindeki yapılandırma örneğini kullanın. Collector kimlik doğrulama
başlıkları Docker ortam değişkenleriyle değil, `diagnostics.otel.headers`
üzerinden yapılandırılır.

Prometheus metrikleri, zaten yayımlanmış Gateway portunu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel
`/metrics` portu veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık denetimleri

Konteyner probe uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` ping atan yerleşik bir `HEALTHCHECK` içerir.
Denetimler başarısız olmaya devam ederse Docker konteyneri `unhealthy` olarak işaretler ve
orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış ayrıntılı sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlamasıyla ana makine erişiminin
`http://127.0.0.1:18789` üzerinden çalışması için varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'ı yayımlanmış Gateway portuna erişebilir.
- `loopback`: yalnızca konteyner ağ ad alanı içindeki süreçler Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bağlama modu değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi ana makine alias'larını değil.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında, konteyner içindeki `127.0.0.1` ana makineniz değil,
konteynerin kendisidir. Ana makinede çalışan AI sağlayıcıları için `host.docker.internal`
kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si              |
| --------- | ---------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Paketlenmiş Docker kurulumu, bu ana makine URL'lerini LM Studio ve Ollama
onboarding varsayılanları olarak kullanır ve `docker-compose.yml`, Linux Docker Engine için
`host.docker.internal` adını Docker'ın ana makine Gateway'ine eşler. Docker Desktop,
macOS ve Windows'ta aynı ana makine adını zaten sağlar.

Ana makine hizmetleri Docker'dan erişilebilir bir adreste de dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız, aynı ana makine
eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast'i (`224.0.0.251:5353`)
güvenilir biçimde iletmez. Bu nedenle paketlenmiş Compose kurulumu varsayılan olarak
`OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece bridge multicast trafiğini düşürdüğünde
Gateway çökme döngüsüne girmez veya duyuruyu tekrar tekrar yeniden başlatmaz.

Docker ana makineleri için yayımlanmış Gateway URL'sini, Tailscale'i veya wide-area DNS-SD'yi kullanın.
`OPENCLAW_DISABLE_BONJOUR=0` ayarını yalnızca host networking, macvlan
veya mDNS multicast'in çalıştığı bilinen başka bir ağla çalıştırırken kullanın.

Dikkat edilmesi gerekenler ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` yoluna bind-mount eder;
bu nedenle bu yollar konteyner değişiminden sonra korunur. Değişkenlerden biri ayarlanmamışsa,
paketlenmiş `docker-compose.yml`, `${HOME}/.openclaw` değerine (ve workspace bağlama noktası için
`${HOME}/.openclaw/workspace` değerine) veya `HOME` da eksikse `/tmp/.openclaw`
değerine geri döner. Bu, yalın ortamlarda `docker compose up` komutunun
boş kaynaklı bir volume belirtimi yaymasını önler.

OpenClaw, şu öğeleri bu bağlanmış yapılandırma dizininde tutar:

- davranış yapılandırması için `openclaw.json`
- depolanmış sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı sırları için `.env`

Kurulan indirilebilir Plugin'ler paket durumlarını bağlanmış OpenClaw home altında depolar;
bu nedenle Plugin kurulum kayıtları ve paket kökleri konteyner değişiminden sonra korunur.
Gateway başlatma, paketlenmiş Plugin bağımlılık ağaçları oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Çalışma Zamanı - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi sıcak noktaları:** `/tmp/openclaw/` altındaki `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`, kurulu Plugin paket kökleri ve dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için agent sandbox'ı etkinleştirin">
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

    Betik, `docker.sock` dosyasını yalnızca sandbox önkoşulları geçtikten sonra bağlar. Sandbox
    kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının gateway'e `127.0.0.1` üzerinden erişebilmesi için
    `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir
    güven sınırı olarak ele alın. Compose yapılandırması, hem `openclaw-gateway` hem de `openclaw-cli` üzerinde
    `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve `no-new-privileges`
    etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde
    izin hataları görürseniz, host bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, şuna benzer bir Plugin uyarısı olarak görünebilir:
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ardından `plugin present but blocked`. Bu, işlem uid'si ile
    bağlanan Plugin dizini sahibinin uyuşmadığı anlamına gelir. Konteyneri
    varsayılan uid 1000 olarak çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. Yalnızca OpenClaw'ı uzun vadede root olarak çalıştırmayı özellikle istiyorsanız
    `/path/to/openclaw-config/npm` için sahipliği `root:root` yapın.

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmediği sürece
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

  <Accordion title="İleri düzey kullanıcı konteyner seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha
    kapsamlı özelliklere sahip bir konteyner için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarını yapın ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açar. Docker veya headless kurulumlarda, ulaştığınız tam redirect URL'sini kopyalayın ve
    kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerlerini içeren OCI temel imaj anotasyonlarını yayımlar. Node temel digest'i
    Dependabot Docker temel imaj PR'ları aracılığıyla yenilenir; sürüm derlemeleri
    bir dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj anotasyonları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Bir VPS üzerinde mi çalıştırıyorsunuz?

İkiliyi imaja ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için
[Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) bölümlerine bakın.

## Agent sandbox

`agents.defaults.sandbox`, Docker backend ile etkinleştirildiğinde gateway,
agent araç yürütmeyi (kabuk, dosya okuma/yazma vb.) yalıtılmış Docker
konteynerleri içinde çalıştırırken gateway'in kendisi host üzerinde kalır. Bu, tüm
gateway'i konteynerleştirmeden güvenilmeyen veya çok kiracılı agent oturumlarının
etrafına sert bir sınır koyar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca
izin ver/reddet araç politikalarını, ağ yalıtımını, kaynak sınırlarını ve tarayıcı
konteynerlerini yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çoklu agent profilleri için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox konteynerlerine etkileşimli kabuk erişimi
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

Varsayılan sandbox imajını derleyin (bir kaynak checkout'undan):

```bash
scripts/sandbox-setup.sh
```

Kaynak checkout'u olmayan npm kurulumları için satır içi `docker build` komutları amacıyla [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox konteyneri başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout'u) ile veya [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Konteynerler istek üzerine oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini, bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu, `/etc/profile`
    kaynağını yükler ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için
    `docker.env.PATH` ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM nedeniyle sonlandırıldı (çıkış 137)">
    VM'in en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde yetkisiz veya eşleştirme gerekli">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Devices](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi Docker CLI'dan ws://172.x.x.x veya eşleştirme hataları gösteriyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra gateway yapılandırması

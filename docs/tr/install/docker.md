---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve kullanıma başlama
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca containerized Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsunuz veya OpenClaw’ı yerel kurulumlar olmadan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalıştırıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox backend’i, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway’in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox backend’leri de kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB host’larda çıkış 137 ile OOM-killed olabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/public host üzerinde çalıştırıyorsanız,
  [Ağ erişimi için güvenlik sıkılaştırması](/tr/gateway/security)
  belgesini, özellikle Docker `DOCKER-USER` firewall politikasını inceleyin.

## Containerized Gateway

<Steps>
  <Step title="İmajı derleyin">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway imajını yerelde derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    üzerinde yayımlanır. Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="Onboarding’i tamamlayın">
    Kurulum betiği onboarding’i otomatik olarak çalıştırır. Şunları yapar:

    - provider API anahtarlarını sorar
    - bir Gateway token’ı oluşturur ve `.env` dosyasına yazar
    - Gateway’i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve config yazımları doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway container’ı
    zaten mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI’ı açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    shared secret’ı Settings içine yapıştırın. Kurulum betiği varsayılan olarak
    `.env` dosyasına bir token yazar; container config’ini parola auth’a geçirirseniz
    bunun yerine o parolayı kullanın.

    URL’ye tekrar mı ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI container’ını kullanın:

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml`
dosyasını yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ile aynı ağ namespace’ini paylaştığı için
başlatma sonrası bir araçtır. `docker compose up -d openclaw-gateway` öncesinde
onboarding’i ve kurulum zamanı config yazımlarını `--no-deps --entrypoint node`
ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerelde derlemek yerine uzak bir imaj kullanır                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında seçili paketle gelen Plugin yardımcılarını dahil eder |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek host bind mount’ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı yapar |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap’a dahil olur (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu override eder                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS reklamını devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketle gelen Plugin kaynak bind-mount overlay’lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry export için paylaşılan OTLP/HTTP collector endpoint’i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Trace, metric veya log için sinyale özgü OTLP endpoint’leri     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protocol override’ı. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resource’ları için kullanılan service name        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI semantic attribute’larına dahil olur     |
| `OPENCLAW_OTEL_PRELOADED`                  | Bir OpenTelemetry SDK önceden yüklenmişse ikinciyi başlatmayı atlar |

Maintainer’lar, paketlenmiş bir imaja karşı paketle gelen Plugin kaynağını test etmek için
tek bir Plugin kaynak dizinini paketlenmiş kaynak yolu üzerine mount edebilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu mount edilen kaynak dizini, aynı Plugin id’si için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` bundle’ını override eder.

### Observability

OpenTelemetry export, Gateway container’ından OTLP collector’ınıza doğru outbound’dur.
Yayımlanmış bir Docker port’u gerektirmez. İmajı yerelde derliyorsanız ve paketle gelen
OpenTelemetry exporter’ın imaj içinde kullanılabilir olmasını istiyorsanız runtime bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Export’u etkinleştirmeden önce paketlenmiş Docker kurulumlarında resmi
`@openclaw/diagnostics-otel` Plugin’ini ClawHub’dan kurun. Özel source-built imajlar
yerel Plugin kaynağını yine `OPENCLAW_EXTENSIONS=diagnostics-otel` ile dahil edebilir.
Export’u etkinleştirmek için config içinde `diagnostics-otel` Plugin’ine izin verip
etkinleştirin, ardından `diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry export](/tr/gateway/opentelemetry) içindeki config örneğini kullanın.
Collector auth header’ları Docker ortam değişkenleriyle değil,
`diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metric’leri zaten yayımlanmış Gateway port’unu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus` Plugin’ini
etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route, Gateway authentication ile korunur. Ayrı bir public `/metrics` port’u
veya unauthenticated reverse-proxy path’i açmayın. Bkz.
[Prometheus metric’leri](/tr/gateway/prometheus).

### Health check’ler

Container probe endpoint’leri (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Check’ler başarısız olmaya devam ederse Docker container’ı `unhealthy` olarak işaretler
ve orchestration sistemleri onu yeniden başlatabilir veya değiştirebilir.

Authenticated deep health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port publishing ile host’un
`http://127.0.0.1:18789` erişiminin çalışması için varsayılan olarak
`OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway port’una erişebilir.
- `loopback`: Gateway’e doğrudan yalnızca container network namespace’i içindeki process’ler erişebilir.

<Note>
`gateway.bind` içinde bind mode değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi host alias’larını kullanmayın.
</Note>

### Host Local Providers

OpenClaw Docker içinde çalıştığında, container içindeki `127.0.0.1` host makineniz
değil, container’ın kendisidir. Host üzerinde çalışan AI provider’ları için
`host.docker.internal` kullanın:

| Provider  | Host varsayılan URL’si   | Docker kurulum URL’si              |
| --------- | ------------------------ | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Paketle gelen Docker kurulumu, LM Studio ve Ollama onboarding varsayılanları olarak
bu host URL’lerini kullanır ve `docker-compose.yml`, Linux Docker Engine için
`host.docker.internal` adını Docker’ın host Gateway’ine eşler. Docker Desktop,
macOS ve Windows üzerinde zaten aynı hostname’i sağlar.

Host servisleri Docker’dan erişilebilir bir adreste de dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı host
eşlemesini kendiniz ekleyin; örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge networking genellikle Bonjour/mDNS multicast’i
(`224.0.0.251:5353`) güvenilir biçimde iletmez. Bu nedenle paketle gelen Compose
kurulumu varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; böylece bridge
multicast trafiğini düşürdüğünde Gateway crash-loop’a girmez veya reklamı tekrar
tekrar yeniden başlatmaz.

Docker host’ları için yayımlanmış Gateway URL’sini, Tailscale’i veya wide-area DNS-SD’yi kullanın.
`OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan veya
mDNS multicast’in çalıştığı bilinen başka bir ağ ile çalıştırırken ayarlayın.

Dikkat edilmesi gereken noktalar ve sorun giderme için bkz. [Bonjour discovery](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` yolunu `/home/node/.openclaw` konumuna ve
`OPENCLAW_WORKSPACE_DIR` yolunu `/home/node/.openclaw/workspace` konumuna bind-mount eder;
bu nedenle bu yollar container değiştirilse de korunur. Değişkenlerden biri ayarlanmamışsa
paketle gelen `docker-compose.yml`, `${HOME}/.openclaw` konumuna (workspace mount için
`${HOME}/.openclaw/workspace` konumuna) veya `HOME` da eksikse `/tmp/.openclaw`
konumuna geri döner. Bu, yalın ortamlarda `docker compose up` komutunun boş kaynaklı
volume spec üretmesini engeller.

Bu mount edilen config dizini, OpenClaw’ın şunları tuttuğu yerdir:

- davranış config’i için `openclaw.json`
- saklanan provider OAuth/API-key auth için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env-backed runtime secret’lar için `.env`

Kurulan indirilebilir Plugin’ler paket durumlarını mount edilmiş OpenClaw home altında
saklar; bu nedenle Plugin kurulum kayıtları ve paket kökleri container değiştirilse de
korunur. Gateway başlatma, paketle gelen Plugin dependency tree’leri oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Runtime - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyüme sıcak noktaları:** `media/`, oturum JSONL dosyaları,
`cron/runs/*.jsonl`, kurulu Plugin paket kökleri ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

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
  <Accordion title="Docker gateway için agent sandbox'ını etkinleştir">
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

    Betik `docker.sock` dosyasını yalnızca sandbox ön koşulları geçtikten sonra bağlar. Sandbox
    kurulumu tamamlanamazsa, betik `agents.defaults.sandbox.mode` değerini
    `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının gateway'e `127.0.0.1` üzerinden ulaşabilmesi için
    `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir
    güven sınırı olarak ele alın. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini düşürür ve
    hem `openclaw-gateway` hem de `openclaw-cli` üzerinde
    `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde
    izin hataları görürseniz, host bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar
    değişmedikçe `pnpm install` komutunun yeniden çalışmasını önler:

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

  <Accordion title="Gelişmiş kullanıcı container seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha
    tam özellikli bir container için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**:
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarlayın ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz, bir tarayıcı URL'si açar. Docker veya
    headless kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayın ve kimlik doğrulamayı tamamlamak için
    sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj açıklamalarını yayımlar. Node temel özeti,
    Dependabot Docker temel imaj PR'leri üzerinden yenilenir; release derlemeleri
    distro yükseltme katmanı çalıştırmaz. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya imaja ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için
[Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Agent sandbox

`agents.defaults.sandbox`, Docker backend ile etkinleştirildiğinde, gateway
agent araç yürütmesini (kabuk, dosya okuma/yazma vb.) izole Docker
container'ları içinde çalıştırırken gateway'in kendisi host üzerinde kalır. Bu, tüm
gateway'i container içine almadan güvenilmeyen veya çok kiracılı agent oturumlarının
etrafına sert bir duvar sağlar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca
izin ver/reddet araç ilkelerini, ağ yalıtımını, kaynak sınırlarını ve tarayıcı
container'larını yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çoklu agent profilleri için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox container'larına etkileşimli kabuk erişimi
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

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları hakkında [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox container başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout) ile veya [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Container'lar oturum başına ihtiyaç anında otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlı çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu
    `/etc/profile` kaynağını yükler ve PATH'i sıfırlayabilir. Özel
    araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda
    `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (exit 137)">
    VM'in en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI'de yetkisiz veya eşleme gerekli">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Devices](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan eşleme hataları geliyor">
    Gateway modunu ve bind ayarını sıfırlayın:

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
- [Güncelleme](/tr/install/updating) — OpenClaw'u güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra gateway yapılandırması

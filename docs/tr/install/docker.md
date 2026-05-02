---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve başlangıç yönlendirmesi
title: Docker
x-i18n:
    generated_at: "2026-05-02T08:59:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, geçici bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Kum havuzu notu**: varsayılan kum havuzu arka ucu, kum havuzu etkinleştirildiğinde Docker kullanır; ancak kum havuzu varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell kum havuzu arka uçları da kullanılabilir. Bkz. [Kum havuzu](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde çıkış 137 ile OOM-killed olabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede çalıştırıyorsanız,
  [ağ erişimi için güvenlik sertleştirmesini](/tr/gateway/security),
  özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="İmajı derleyin">
    Depo kökünden kurulum betiğini çalıştırın:

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

  <Step title="İlk kurulumu tamamlayın">
    Kurulum betiği ilk kurulumu otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway token'ı oluşturur ve `.env` dosyasına yazar
    - Docker Compose üzerinden Gateway'i başlatır

    Kurulum sırasında, başlatma öncesi ilk kurulum ve yapılandırma yazımları
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway
    konteyneri zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Kontrol kullanıcı arayüzünü açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan sırrı Ayarlar'a yapıştırın. Kurulum betiği varsayılan olarak
    `.env` dosyasına bir token yazar; konteyner yapılandırmasını parola kimlik
    doğrulamasına geçirirseniz bunun yerine o parolayı kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI konteynerini kullanın:

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
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml`
dosyasını yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ağ ad alanını paylaştığı için başlatma sonrası
bir araçtır. `docker compose up -d openclaw-gateway` öncesinde, ilk kurulumu ve
kurulum zamanı yapılandırma yazımlarını `--no-deps --entrypoint node` ile
`openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerel olarak derlemek yerine uzak bir imaj kullanır             |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında seçili paketli Plugin yardımcılarını dahil eder |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek ana makine bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı kılar |
| `OPENCLAW_SANDBOX`                         | Kum havuzu bootstrap'ine katılır (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli ilk kurulum adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu geçersiz kılar                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketli Plugin kaynak bind-mount overlay'lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector uç noktası |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | İzler, metrikler veya günlükler için sinyale özgü OTLP uç noktaları |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan hizmet adı             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En son deneysel GenAI semantik özniteliklerine katılır          |
| `OPENCLAW_OTEL_PRELOADED`                  | Bir OpenTelemetry SDK önceden yüklenmişse ikincisini başlatmayı atlar |

Bakımcılar, bir Plugin kaynak dizinini paketlenmiş kaynak yolu üzerine bağlayarak
paketli bir imaja karşı paketli Plugin kaynağını test edebilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanan kaynak dizini, aynı Plugin id için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` bundle'ını geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway konteynerinden OTLP collector'ınıza
giden yöndedir. Yayımlanmış bir Docker portu gerektirmez. İmajı yerel olarak
derliyorsanız ve paketli OpenTelemetry dışa aktarıcısının imaj içinde kullanılabilir
olmasını istiyorsanız çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Dışa aktarımı etkinleştirmeden önce paketli Docker kurulumlarında resmi
`@openclaw/diagnostics-otel` Plugin'ini kurun. Özel kaynak derlemeli imajlar,
yerel Plugin kaynağını `OPENCLAW_EXTENSIONS=diagnostics-otel` ile yine de
dahil edebilir. Dışa aktarımı etkinleştirmek için yapılandırmada
`diagnostics-otel` Plugin'ine izin verip etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
içindeki yapılandırma örneğini kullanın. Collector kimlik doğrulama başlıkları
Docker ortam değişkenleriyle değil, `diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway portunu kullanır.
`diagnostics-prometheus` Plugin'ini etkinleştirin, ardından şunu scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel `/metrics` portu
veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık kontrolleri

Konteyner probe uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Kontroller başarısız olmaya devam ederse Docker konteyneri `unhealthy` olarak
işaretler ve orchestration sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlamayla ana makinenin
`http://127.0.0.1:18789` erişiminin çalışması için varsayılan olarak
`OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI yayımlanmış Gateway portuna erişebilir.
- `loopback`: Gateway'e doğrudan yalnızca konteyner ağ ad alanı içindeki süreçler erişebilir.

<Note>
`gateway.bind` içinde bağlama modu değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın; `0.0.0.0` veya `127.0.0.1` gibi ana makine alias'larını kullanmayın.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında, konteyner içindeki `127.0.0.1` ana
makineniz değil, konteynerin kendisidir. Ana makinede çalışan AI sağlayıcıları
için `host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si             |
| --------- | ---------------------------- | --------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Paketli Docker kurulumu, LM Studio ve Ollama ilk kurulum varsayılanları olarak
bu ana makine URL'lerini kullanır ve `docker-compose.yml`, Linux Docker Engine
için `host.docker.internal` adını Docker'ın ana makine Gateway'ine eşler.
Docker Desktop macOS ve Windows üzerinde aynı ana makine adını zaten sağlar.

Ana makine hizmetleri Docker'dan erişilebilir bir adreste de dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı ana
makine eşlemesini kendiniz ekleyin; örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast'ini (`224.0.0.251:5353`)
güvenilir biçimde iletmez. Bu nedenle paketli Compose kurulumu varsayılan
olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; böylece bridge multicast trafiğini
düşürdüğünde Gateway crash-loop'a girmez veya duyuruyu sürekli yeniden başlatmaz.

Docker ana makineleri için yayımlanmış Gateway URL'sini, Tailscale'i veya
wide-area DNS-SD kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host
networking, macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ ile
çalıştırırken ayarlayın.

Tuzaklar ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` yolunu `/home/node/.openclaw` konumuna ve
`OPENCLAW_WORKSPACE_DIR` yolunu `/home/node/.openclaw/workspace` konumuna bind-mount
eder; böylece bu yollar konteyner değişiminden sonra da kalır. Değişkenlerden
biri ayarlanmamışsa paketli `docker-compose.yml`, `${HOME}/.openclaw` yoluna
(çalışma alanı mount'u için `${HOME}/.openclaw/workspace` yoluna) ya da `HOME`
kendisi de yoksa `/tmp/.openclaw` yoluna geri döner. Bu, çıplak ortamlarda
`docker compose up` komutunun boş kaynaklı bir volume spec üretmesini engeller.

Bu bağlanan yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi ortam destekli çalışma zamanı sırları için `.env`

Kurulu indirilebilir Plugin'ler paket durumlarını bağlanan OpenClaw home altında
saklar; böylece Plugin kurulum kayıtları ve paket kökleri konteyner değişiminden
sonra da kalır. Gateway başlangıcı paketli Plugin bağımlılık ağaçları oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Çalışma Zamanı - Neler nerede kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyüme odakları:** `media/`, oturum JSONL dosyaları,
`cron/runs/*.jsonl`, kurulu Plugin paket kökleri ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock’u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) sayfasına bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için ajan sandbox'ını etkinleştirme">
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

    Betik, `docker.sock` öğesini yalnızca sandbox önkoşulları geçtikten sonra bağlar. Sandbox
    kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode` değerini
    `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmasını `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden gateway'e ulaşabilmesi için
    `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir
    güven sınırı olarak ele alın. Compose yapılandırması `NET_RAW`/`NET_ADMIN`
    yetkilerini kaldırır ve `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde
    izin hataları görürseniz, ana makine bind mount'larınızın uid 1000 tarafından sahiplenildiğinden emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmediği sürece
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

  <Accordion title="İleri düzey kullanıcı konteyner seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha
    tam özellikli bir konteyner için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**:
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarlayın ve
       `OPENCLAW_HOME_VOLUME` ya da `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz, bir tarayıcı URL'si açar. Docker
    veya başsız kurulumlarda, vardığınız tam yönlendirme URL'sini kopyalayıp
    kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj metaverisi">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve
    `org.opencontainers.image.base.name`, `org.opencontainers.image.source`
    ve diğerlerini içeren OCI temel imaj ek açıklamaları yayımlar. Node temel digest'i
    Dependabot Docker temel imaj PR'larıyla yenilenir; sürüm derlemeleri
    dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj ek açıklamaları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

Paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime) sayfalarına bakın;
ikili dosya imaja ekleme, kalıcılık ve güncellemeler dahildir.

## Ajan sandbox'ı

`agents.defaults.sandbox`, Docker arka ucu ile etkinleştirildiğinde gateway,
ajan araç yürütmesini (kabuk, dosya okuma/yazma vb.) yalıtılmış Docker
konteynerleri içinde çalıştırırken gateway'in kendisi ana makinede kalır. Bu, tüm
gateway'i konteynerleştirmeden güvenilmeyen veya çok kiracılı ajan oturumlarının
etrafına sağlam bir duvar koyar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca
izin ver/reddet araç politikaları, ağ yalıtımı, kaynak sınırları ve tarayıcı
konteynerleri yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Sandbox kullanımı](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox konteynerlerine etkileşimli kabuk erişimi
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar

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

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları adına [Sandbox kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox konteyneri başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout) ile veya [Sandbox kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Konteynerler istek üzerine oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahibini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (oturum açma kabuğu) ile çalıştırır; bu,
    `/etc/profile` dosyasını kaynak olarak alır ve PATH'i sıfırlayabilir. Özel
    araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda
    `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (çıkış 137)">
    VM için en az 2 GB RAM gerekir. Daha büyük bir makine sınıfı kullanıp yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde yetkisiz veya eşleme gerekli">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Pano](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi Docker CLI'dan ws://172.x.x.x gösteriyor veya eşleme hataları veriyor">
    Gateway modunu ve bağlanma ayarını sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum Genel Bakışı](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker için Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra gateway yapılandırması

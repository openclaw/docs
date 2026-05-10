---
read_when:
    - Yerel kurulumlar yerine kapsayıcılaştırılmış bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk yapılandırma
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:42:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, geçici bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalıştırıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Korumalı alan notu**: varsayılan korumalı alan arka ucu, korumalı alan etkinleştirildiğinde Docker kullanır; ancak korumalı alan varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell korumalı alan arka uçları da kullanılabilir. Bkz. [Korumalı alan](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Görüntü derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde çıkış 137 ile OOM-killed olabilir)
- Görüntüler ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede çalıştırıyorsanız,
  [ağ erişimi için güvenlik sıkılaştırmasını](/tr/gateway/security),
  özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini gözden geçirin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="Görüntüyü derleyin">
    Depo kökünden kurulum betiğini çalıştırın:

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
    Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="Başlangıç kurulumunu tamamlayın">
    Kurulum betiği başlangıç kurulumunu otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway belirteci oluşturur ve `.env` içine yazar
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlangıç öncesi başlangıç kurulumu ve yapılandırma yazımları doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway konteyneri zaten
    mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Kontrol arayüzünü açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan sırrı Ayarlar'a yapıştırın. Kurulum betiği varsayılan olarak `.env` içine
    bir belirteç yazar; konteyner yapılandırmasını parola kimlik doğrulamasına geçirirseniz
    bunun yerine o parolayı kullanın.

    URL'ye tekrar mı ihtiyacınız var?

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
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml`
dosyasını yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ağ ad alanını paylaştığı için bir
başlangıç sonrası aracıdır. `docker compose up -d openclaw-gateway` öncesinde,
başlangıç kurulumu ve kurulum zamanı yapılandırma yazımlarını `openclaw-gateway`
üzerinden `--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerel derlemek yerine uzak bir görüntü kullanır                 |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında seçili pakete dahil Plugin yardımcılarını dahil eder |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek ana makine bağlama noktaları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker biriminde kalıcı hale getirir |
| `OPENCLAW_SANDBOX`                         | Korumalı alan önyüklemesine katılır (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli başlangıç kurulumu adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker soket yolunu geçersiz kılar                              |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Pakete dahil Plugin kaynak bağlama kaplamalarını devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP toplayıcı uç noktası |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | İzler, metrikler veya günlükler için sinyale özel OTLP uç noktaları |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan hizmet adı             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI semantik özniteliklerine katılır         |
| `OPENCLAW_OTEL_PRELOADED`                  | Bir tane önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atlar |

Bakımcılar, paketlenmiş bir görüntüye karşı pakete dahil Plugin kaynağını test etmek için
bir Plugin kaynak dizinini paketlenmiş kaynak yolu üzerine bağlayabilir, örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanmış kaynak dizini, aynı Plugin kimliği için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway konteynerinden OTLP toplayıcınıza giden
çıkış yönlüdür. Yayımlanmış bir Docker bağlantı noktası gerektirmez. Görüntüyü
yerel olarak derliyorsanız ve pakete dahil OpenTelemetry dışa aktarıcısının görüntü
içinde kullanılabilir olmasını istiyorsanız, çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce resmi
`@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun. Özel kaynak derlemeli
görüntüler yerel Plugin kaynağını yine de `OPENCLAW_EXTENSIONS=diagnostics-otel`
ile dahil edebilir. Dışa aktarımı etkinleştirmek için yapılandırmada
`diagnostics-otel` Plugin'ine izin verip etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
içindeki yapılandırma örneğini kullanın. Toplayıcı kimlik doğrulama başlıkları
Docker ortam değişkenleriyle değil, `diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway bağlantı noktasını kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından tarayın:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota, Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel `/metrics` bağlantı
noktası veya kimliği doğrulanmamış ters proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık denetimleri

Konteyner yoklama uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker görüntüsü, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Denetimler başarısız olmaya devam ederse Docker konteyneri `unhealthy` olarak
işaretler ve orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker bağlantı noktası yayımlamasıyla
`http://127.0.0.1:18789` adresine ana makine erişimi çalışsın diye varsayılan olarak
`OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI yayımlanmış Gateway bağlantı noktasına erişebilir.
- `loopback`: yalnızca konteyner ağ ad alanı içindeki süreçler Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bağlama modu değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını kullanmayın.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında, konteyner içindeki `127.0.0.1` ana makineniz
değil, konteynerin kendisidir. Ana makinede çalışan AI sağlayıcıları için
`host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si              |
| --------- | ---------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Pakete dahil Docker kurulumu, LM Studio ve Ollama başlangıç kurulumu varsayılanları
olarak bu ana makine URL'lerini kullanır ve `docker-compose.yml`, Linux Docker Engine
için `host.docker.internal` adresini Docker'ın ana makine Gateway'ine eşler.
Docker Desktop, macOS ve Windows üzerinde aynı ana makine adını zaten sağlar.

Ana makine hizmetleri de Docker'dan erişilebilir bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız, aynı ana
makine eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker köprü ağı genellikle Bonjour/mDNS çok noktaya yayınını
(`224.0.0.251:5353`) güvenilir biçimde iletmez. Bu nedenle pakete dahil Compose
kurulumu varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarlar; böylece köprü
çok noktaya yayın trafiğini düşürdüğünde Gateway çökme döngüsüne girmez veya
duyurmayı tekrar tekrar yeniden başlatmaz.

Docker ana makineleri için yayımlanmış Gateway URL'sini, Tailscale'i veya geniş
alan DNS-SD'yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca ana makine
ağı, macvlan veya mDNS çok noktaya yayınının çalıştığı bilinen başka bir ağ ile
çalıştırırken ayarlayın.

Püf noktaları ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` yolunu `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` yolunu `/home/node/.openclaw/workspace` yoluna bind-mount
eder; böylece bu yollar konteyner değişiminden sonra korunur. Değişkenlerden biri
ayarlanmamışsa, pakete dahil `docker-compose.yml` `${HOME}/.openclaw` değerine
(ve çalışma alanı bağlaması için `${HOME}/.openclaw/workspace` değerine) veya
`HOME` kendisi de eksikse `/tmp/.openclaw` değerine geri döner. Bu, çıplak
ortamlarda `docker compose up` komutunun boş kaynaklı birim belirtimi üretmesini
önler.

Bu bağlanmış yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- depolanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi ortam destekli çalışma zamanı sırları için `.env`

Kurulu indirilebilir Plugin'ler paket durumlarını bağlanmış OpenClaw ana dizini
altında saklar; böylece Plugin kurulum kayıtları ve paket kökleri konteyner
değişiminden sonra korunur. Gateway başlangıcı, pakete dahil Plugin bağımlılık
ağaçları oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Çalışma Zamanı - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi sıcak noktaları:** `media/`, oturum JSONL dosyalarını,
`cron/runs/*.jsonl`, yüklü Plugin paket köklerini ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` yükleyin:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` raw yolundan yüklediyseniz, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için ajan sandbox'ını etkinleştir">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel soket yolu (örn. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik, `docker.sock` dosyasını yalnızca sandbox ön koşulları geçtikten sonra bağlar. Sandbox kurulumu tamamlanamazsa, betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşımlı ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden gateway'e ulaşabilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak değerlendirin. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini düşürür ve hem `openclaw-gateway` hem de `openclaw-cli` üzerinde
    `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içinde Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumları, `NET_RAW` düşürüldükten sonra paylaşımlı ağdaki
    `openclaw-cli` sidecar'ından DNS aramalarında başarısız olur; bu durum
    `openclaw plugins install` gibi npm destekli komutlar sırasında `EAI_AGAIN`
    olarak görünür. Normal gateway çalışması için varsayılan sertleştirilmiş compose dosyasını koruyun. Aşağıdaki yerel geçersiz kılma, Docker'ın varsayılan yeteneklerini geri yükleyerek CLI container'ının güvenlik duruşunu gevşetir; bu nedenle bunu varsayılan Compose çağrınız olarak değil, yalnızca paket kayıt erişimi gerektiren tek seferlik CLI komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Zaten uzun süre çalışan bir `openclaw-cli` container'ı oluşturduysanız, aynı geçersiz kılma ile yeniden oluşturun. `docker compose exec` ve `docker exec`, önceden oluşturulmuş bir container üzerinde Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    gibi bir Plugin uyarısı ve ardından `plugin present but blocked` olarak da görünebilir. Bu, işlem uid'si ile bağlanan Plugin dizininin sahibinin uyuşmadığı anlamına gelir. Container'ı varsayılan uid 1000 ile çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. `/path/to/openclaw-config/npm` için yalnızca OpenClaw'u uzun vadede kasıtlı olarak root olarak çalıştırıyorsanız `root:root` chown yapın.

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

  <Accordion title="İleri düzey kullanıcı container seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha kapsamlı özelliklere sahip bir container için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja dahil edin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını yükleyin**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**: `OPENCLAW_HOME_VOLUME` veya
       `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux üzerinde Docker imajının
       Playwright tarafından yönetilen Chromium'unu otomatik olarak algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz, bir tarayıcı URL'si açılır. Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayın ve kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve uzun süre çalışan container'larda zombi süreçlerin toplanmasını ve sinyallerin doğru işlenmesini sağlamak için giriş noktası init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj anotasyonlarını yayımlar. Node temel özeti,
    Dependabot Docker temel imaj PR'leri aracılığıyla yenilenir; sürüm derlemeleri bir dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj anotasyonları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Bir VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya gömme, kalıcılık ve güncellemeler dahil paylaşımlı VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) bölümlerine bakın.

## Ajan sandbox'ı

`agents.defaults.sandbox` Docker arka ucu ile etkinleştirildiğinde, gateway
ajan araç yürütmesini (kabuk, dosya okuma/yazma vb.) izole Docker
container'ları içinde çalıştırırken gateway'in kendisi ana makinede kalır. Bu, tüm
gateway'i container'laştırmadan güvenilmeyen veya çok kiracılı ajan oturumlarının
etrafına sert bir duvar koyar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca izin ver/reddet araç ilkelerini, ağ izolasyonunu, kaynak sınırlarını ve tarayıcı
container'larını yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox container'larına etkileşimli kabuk erişimi
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

Kaynak checkout olmadan npm kurulumları için satır içi `docker build` komutları için [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox container'ı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout) ile veya [Sandboxing § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Container'lar gerektiğinde oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörüne chown uygulayın.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamadı">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu,
    `/etc/profile` dosyasını kaynaklar ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (exit 137)">
    VM'in en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
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
    Gateway modunu ve bind değerini sıfırlayın:

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

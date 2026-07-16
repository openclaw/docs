---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk yapılandırma
title: Docker
x-i18n:
    generated_at: "2026-07-16T17:12:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalıtılmış, tek kullanımlık bir gateway ortamı veya yerel kurulumların bulunmadığı bir ana makine için kullanın. Zaten kendi makinenizde geliştirme yapıyorsanız bunun yerine normal kurulum akışını kullanın.

Varsayılan korumalı alan arka ucu, `agents.defaults.sandbox` etkinleştirildiğinde Docker kullanır; ancak korumalı alan varsayılan olarak kapalıdır ve gateway'in kendisinin Docker'da çalışmasını gerektirmez. SSH ve OpenShell korumalı alan arka uçları da kullanılabilir; bkz. [Korumalı alan](/tr/gateway/sandboxing).

Birden fazla kullanıcı mı barındırıyorsunuz? Kiracı başına bir hücre modeli için [Çok kiracılı barındırma](/tr/gateway/multi-tenant-hosting) bölümüne bakın.

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj oluşturma için en az 2 GB RAM (`pnpm install`, 1 GB'lık ana makinelerde 137 çıkış koduyla OOM nedeniyle sonlandırılabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede, özellikle Docker `DOCKER-USER` güvenlik duvarı zinciri olmak üzere [Ağ erişimi için güvenlik sıkılaştırması](/tr/gateway/security) bölümünü inceleyin

## Konteynerleştirilmiş gateway

<Steps>
  <Step title="İmajı oluşturun">
    Depo kökünden:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, gateway imajını yerel olarak `openclaw:local` adıyla oluşturur. Bunun yerine önceden oluşturulmuş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden oluşturulmuş imajlar ilk olarak [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır. GHCR; sürüm otomasyonu, sabitlenmiş dağıtımlar ve kaynak doğrulama kontrolleri için birincil kayıt deposudur. Aynı sürüm, Docker Hub yansısını `openclaw/openclaw` adresinde yayımlar:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` veya `openclaw/openclaw` kullanın ve OpenClaw'ın sürüm zamanlamasını ya da saklama politikasını paylaşmayan resmî olmayan yansılardan kaçının. Resmî etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`) ve `2026.2.26-beta.1` gibi beta etiketleri (betalar `latest`/`main` etiketlerini hiçbir zaman ilerletmez). Varsayılan `main`/`latest`/`<version>` imajı, `codex` ve `diagnostics-otel` pluginlerini içerir. Bir `-browser` varyantı (ör. `latest-browser`) da Chromium yerleşik olarak gelir; bu, ilk çalıştırmada Playwright kurulumu gerektirmeden [korumalı alan tarayıcısı](/tr/gateway/sandboxing#sandboxed-browser) aracı için kullanışlıdır.

  </Step>

  <Step title="İnternet bağlantısı olmadan yeniden çalıştırın">
    Çevrimdışı ana makinelerde önce imajı aktarın ve yükleyin:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`, `OPENCLAW_IMAGE` öğesinin yerel olarak zaten mevcut olduğunu doğrular, örtük Compose çekme/oluşturma işlemlerini devre dışı bırakır ve ardından normal akışı çalıştırır: `.env` eşitlemesi, izin düzeltmeleri, ilk yapılandırma, gateway yapılandırma eşitlemesi ve Compose başlatma.

    `OPENCLAW_SANDBOX=1` ise çevrimdışı kurulum, Docker destekli tarayıcı imajlarındaki tarayıcı sözleşmesi etiketi de dâhil olmak üzere `OPENCLAW_DOCKER_SOCKET` arkasındaki daemon üzerinde yapılandırılmış varsayılan ve aracı başına korumalı alan imajlarını da denetler. Gerekli bir imaj eksik veya eskiyse kurulum, hatalı bir başarı bildirmek yerine korumalı alan yapılandırmasını değiştirmeden çıkar.

  </Step>

  <Step title="İlk yapılandırmayı tamamlayın">
    Kurulum betiği ilk yapılandırmayı otomatik olarak çalıştırır:

    - sağlayıcı API anahtarlarını ister
    - bir gateway belirteci oluşturur ve bunu `.env` konumuna yazar
    - kimlik doğrulama profili gizli anahtar dizinini oluşturur
    - gateway'i Docker Compose aracılığıyla başlatır

    Başlatma öncesi ilk yapılandırma ve yapılandırma yazma işlemleri doğrudan `openclaw-gateway` üzerinden (`--no-deps --entrypoint node` ile) çalışır; çünkü `openclaw-cli`, gateway'in ağ ad alanını paylaşır ve yalnızca gateway konteyneri mevcut olduktan sonra çalışır.

  </Step>

  <Step title="Control UI'ı açın">
    `http://127.0.0.1:18789/` adresini açın ve `.env` konumuna yazılan belirteci Settings alanına yapıştırın. Konteyneri parola kimlik doğrulamasına geçirdiyseniz bunun yerine o parolayı kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
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

Docker bağlamı `.git` öğesini hariç tutar. İmajın About ekranında kullanıma alınmış commit'i ve tek bir oluşturma zaman damgasını bildirmesi için kaynak kimliğini yukarıda gösterildiği gibi oluşturma bağımsız değişkenleri olarak iletin. `scripts/docker/setup.sh`, her iki değeri de otomatik olarak çözümler ve iletir.

<Note>
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS` veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml` dosyasını yazar; bunu kendi yönettiğiniz herhangi bir `docker-compose.override.yml` sonrasına ekleyin; ör. `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Konteyner imajlarını yükseltme

OpenClaw imajını değiştirip bağlı durumu/yapılandırmayı aynı tuttuğunuzda yeni gateway, hazır duruma geçmeden önce başlangıç için güvenli yükseltme geçişlerini ve plugin yakınsamasını çalıştırır. Rutin imaj yükseltmeleri ayrı bir `openclaw doctor --fix` geçişi gerektirmemelidir.

Başlangıç bu onarımları güvenle tamamlayamazsa gateway sağlıklı olduğunu bildirmek yerine çıkar. Bir yeniden başlatma politikası kullanıldığında Docker, Podman veya Kubernetes gateway konteynerinin yeniden başlatıldığını gösterebilir. Bağlı durum birimini koruyun, ardından aynı imajı gateway'in kullandığı aynı durum/yapılandırma bağlamalarıyla, konteyner komutu olarak `openclaw doctor --fix` kullanarak bir kez çalıştırın:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Doctor tamamlandıktan sonra gateway konteynerini varsayılan komutuyla yeniden başlatın. Kubernetes'te aynı komutu, aynı PVC'nin bağlandığı tek seferlik bir Job veya hata ayıklama pod'unda çalıştırın; ardından Deployment veya StatefulSet'i yeniden başlatın.

### Ortam değişkenleri

`scripts/docker/setup.sh` tarafından (ve gateway konteyneri için doğrudan `docker-compose.yml` tarafından) kabul edilen isteğe bağlı değişkenler:

| Değişken                                        | Amaç                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Yerel olarak oluşturmak yerine uzak bir imaj kullanır                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Oluşturma sırasında ek apt paketleri yükler (boşlukla ayrılmış). Eski diğer ad: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Oluşturma sırasında ek Python paketleri yükler (boşlukla ayrılmış)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Desteklenen seçili pluginleri derler/paketler ve çalışma zamanı bağımlılıklarını yükler (virgül veya boşlukla ayrılmış kimlikler) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Yerel kaynak oluşturma Node seçeneklerini geçersiz kılar (varsayılan `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Yerel kaynak oluşturma tsdown yığın belleğini MB cinsinden geçersiz kılar                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Yalnızca çalışma zamanına yönelik yerel imaj oluşturmalarında bildirim çıktısını atlar (varsayılan `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Oluşturma sırasında Chromium + Xvfb'yi imaja yerleştirir                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Ek ana makine bağlama noktaları (virgülle ayrılmış `source:target[:opts]`)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` öğesini adlandırılmış bir Docker biriminde kalıcı hâle getirir                                                                     |
| `OPENCLAW_SANDBOX`                              | Korumalı alan önyüklemesini etkinleştirir (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Etkileşimli ilk yapılandırma adımını atlar (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker soket yolunu geçersiz kılar                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS duyurusunu açık (`0`) veya kapalı (`1`) olmaya zorlar; bkz. [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Paketlenmiş plugin kaynak bağlama katmanlarını devre dışı bırakır                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP toplayıcı uç noktası                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | İzler, metrikler veya günlükler için sinyale özgü OTLP uç noktaları                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP protokolünü geçersiz kılar. Günümüzde yalnızca `http/protobuf` desteklenmektedir                                                   |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry kaynakları için kullanılan hizmet adı                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | En yeni deneysel GenAI anlamsal özniteliklerini etkinleştirir                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Önceden yüklenmiş bir OpenTelemetry SDK varsa ikincisinin başlatılmasını atlar                                                    |

Resmî imaj Homebrew içermez. İlk yapılandırma sırasında OpenClaw, `brew` bulunmayan bir Linux konteynerinde yalnızca brew ile kullanılabilen skill bağımlılığı yükleyicilerini gizler; bu bağımlılıkları özel bir imaj aracılığıyla sağlayın veya manuel olarak yükleyin. Debian ile paketlenmiş bağımlılıklar için `OPENCLAW_IMAGE_APT_PACKAGES`, Python bağımlılıkları için `OPENCLAW_IMAGE_PIP_PACKAGES` kullanın (oluşturma sırasında `python3 -m pip install --break-system-packages` çalıştırır; bu nedenle sürümleri sabitleyin ve yalnızca güvendiğiniz dizinleri kullanın).

Docker `ResourceExhausted`, `cannot allocate memory` bildirirse veya `tsdown` sırasında işlemi iptal ederse Docker oluşturucu bellek sınırını artırın ya da daha küçük ve açıkça belirtilmiş yığın bellekleriyle yeniden deneyin:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Seçili pluginlere sahip kaynaktan oluşturulmuş imajlar

`OPENCLAW_EXTENSIONS`, kaynak çalışma kopyasından plugin manifest kimliklerini seçer;
farklı olduklarında mevcut kaynak dizini adları da kabul edilir. Docker
derlemesi, seçimi bir kez kaynak dizinlerine çözümler, üretim
bağımlılıklarını yükler ve seçilen bir plugin `openclaw.build.bundledDist: false` ile
ayrı olarak yayımlanıyorsa çalışma zamanını kök paketlenmiş dist içine
derler. Yalnızca Docker'a özgü bu paketleme, plugin'in npm veya ClawHub
artefakt sözleşmesini değiştirmez. Bilinmeyen, geçersiz veya belirsiz kimlikler
imaj derlemesini başarısız kılar. Bilinen yalnızca bağımlılık/kaynak kimlikleri,
derlenmiş bir kök dist girdisi kazanmadan mevcut kaynak ve bağımlılık
hazırlama düzenini korur. Birleşik derleme girdilerine sahip seçili bir plugin
başarıyla derlenmelidir; seçilmemiş harici plugin kaynağı ve çalışma zamanı
çıktısı budanır.

Örneğin bu komutlar ClickClack, Slack ve Microsoft Teams için ayrı, çok
mimarili, bağımsız FakeCo gateway imajları derler. ClawRouter zaten kök
OpenClaw çalışma zamanının bir parçasıdır; bu nedenle ClickClack imajı yalnızca
`clickclack` öğesini seçer. Açıkça boş bırakılan tarayıcı bağımsız
değişkeni, varsayılan imajı Chromium içermeyecek şekilde tutar:

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

Tek bir yerel yerel derleme için `--platform linux/arm64 --load` veya
`--platform linux/amd64 --load` kullanın. Çok platformlu çıktı ve eklenmiş SBOM/kaynak
kökeni, tasdikleri koruyan bir kayıt defteri veya başka bir Buildx çıktısı
gerektirir. Gönderdikten sonra manifesti inceleyin ve değiştirilebilir
kaynak-SHA etiketi yerine değişmez özeti dağıtın:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Dağıt: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Bu imajlar bağımsız OCI tabanlı gateway'ler ve genel Docker kullanıcıları
içindir. Crabhelm tarafından yönetilen gateway'ler bunları kullanmaz: bu
dağıtım yolu, bir OpenClaw npm tarball'ı içeren ayrı bir x86_64 cihaz arşivi
derler ve Node, arşiv ve manifest özetlerini sabitler. Bu cihazı aynı
birleştirilmiş OpenClaw kaynağından bağımsız olarak derleyin.

Paketlenmiş bir imaja karşı paketlenmiş plugin kaynağını test etmek için bir plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine bağlayın; örneğin `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Bu, aynı plugin kimliği için eşleşen derlenmiş `/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway konteynerinden OTLP toplayıcınıza giden yöndedir; yayımlanmış bir Docker bağlantı noktası gerektirmez. Paketlenmiş dışa aktarıcıyı yerel olarak derlenen bir imaja dahil etmek için:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Resmî önceden derlenmiş imajlar zaten `diagnostics-otel` öğesini paketler; yalnızca kaldırdıysanız `clawhub:@openclaw/diagnostics-otel` öğesini kendiniz yükleyin. Dışa aktarımı etkinleştirmek için yapılandırmada `diagnostics-otel` plugin'ine izin verip etkinleştirin, ardından `diagnostics.otel.enabled=true` değerini ayarlayın (tam örnek için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümüne bakın). Toplayıcı kimlik doğrulama başlıkları Docker ortam değişkenlerinden değil, `diagnostics.otel.headers` üzerinden iletilir.

Prometheus metrikleri, zaten yayımlanmış Gateway bağlantı noktasını yeniden kullanır. `clawhub:@openclaw/diagnostics-prometheus` öğesini yükleyin, `diagnostics-prometheus` plugin'ini etkinleştirin, ardından şuradan kazıyın:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur; ayrı bir herkese açık `/metrics` bağlantı noktasını veya kimliği doğrulanmamış bir ters proxy yolunu açığa çıkarmayın. [Prometheus metrikleri](/tr/gateway/prometheus) bölümüne bakın.

### Sistem durumu denetimleri

Konteyner yoklama uç noktaları (kimlik doğrulaması gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # canlılık
curl -fsS http://127.0.0.1:18789/readyz     # hazır olma durumu
```

İmajın yerleşik `HEALTHCHECK` öğesi `/healthz` öğesine ping gönderir; tekrarlanan hatalar konteyneri `unhealthy` olarak işaretler, böylece orkestratörler onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış ayrıntılı sistem durumu anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve geri döngü

`scripts/docker/setup.sh`, varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` değerini kullanır; böylece ana makinedeki `http://127.0.0.1:18789`, Docker bağlantı noktası yayımlamasıyla çalışır.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'si yayımlanmış gateway bağlantı noktasına erişebilir.
- `loopback`: gateway'e yalnızca konteyner ağ ad alanı içindeki işlemler doğrudan erişebilir.

<Note>
`gateway.bind` içinde `0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını değil, bağlama modu değerlerini (`lan` / `loopback` / `custom` / `tailnet` / `auto`) kullanın.
</Note>

### Ana makinedeki yerel sağlayıcılar

Konteyner içinde `127.0.0.1`, ana makineyi değil konteynerin kendisini ifade eder. Ana makinede çalışan sağlayıcılar için `host.docker.internal` kullanın:

| Sağlayıcı  | Ana makinenin varsayılan URL'si | Docker kurulum URL'si               |
| ---------- | -------------------------------- | ------------------------------------ |
| LM Studio  | `http://127.0.0.1:1234`               | `http://host.docker.internal:1234`                   |
| Ollama     | `http://127.0.0.1:11434`               | `http://host.docker.internal:11434`                   |

Paketlenmiş kurulum bu URL'leri LM Studio/Ollama ilk katılım varsayılanları olarak kullanır ve `docker-compose.yml`, Linux Docker Engine'de `host.docker.internal` öğesini ana makine gateway'ine eşler (Docker Desktop, macOS/Windows'ta aynı takma adı sağlar). Ana makine hizmetleri, Docker'ın erişebileceği bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` öğesini mi kullanıyorsunuz? Aynı eşlemeyi kendiniz ekleyin; örneğin `--add-host=host.docker.internal:host-gateway`.

### Docker'da Claude CLI arka ucu

Resmî imaj Claude Code'u önceden yüklemez. Konteynerin `node` kullanıcısı içinde yükleyip oturum açın, ardından imaj yükseltmelerinin ikili dosyayı veya kimlik doğrulama durumunu silmemesi için bu konteyner ana dizinini kalıcı hâle getirin.

Yeni bir kurulumda, kurulumu çalıştırmadan önce kalıcı bir `/home/node` birimini etkinleştirin:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Mevcut bir kurulumda önce yığını durdurun ve geçerli `.env` değerlerini yeniden yükleyin — kurulum betiği `.env` dosyasını her zaman geçerli kabuk ve varsayılanlardan yeniden yazar; dosyayı kendi başına okumaz:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env`, kabuğunuzun kaynak olarak yükleyemeyeceği değerler içeriyorsa önce kullandığınız değerleri elle yeniden dışa aktarın (`OPENCLAW_IMAGE`, bağlantı noktaları, bağlama modu, özel yollar, `OPENCLAW_EXTRA_MOUNTS`, korumalı alan, ilk katılımı atlama). Oluşturulan katman, ana dizin birimini hem `openclaw-gateway` hem de `openclaw-cli` için bağlar; kalan komutları bu katmanla (kullanıyorsanız önce `docker-compose.override.yml` ile) çalıştırın:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Yerel yükleyici `claude` öğesini `/home/node/.local/bin/claude` konumuna yazar. OpenClaw'ı bu yola yönlendirin:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Aynı kalıcı ana dizinden oturum açın ve doğrulayın:

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

Ardından paketlenmiş `claude-cli` arka ucunu kullanın:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Docker Claude CLI'den merhaba de"
```

`OPENCLAW_HOME_VOLUME`, yerel kurulumu `/home/node/.local/bin` ve `/home/node/.local/share/claude` altında, Claude Code ayarlarını/kimlik doğrulamasını ise `/home/node/.claude` ve `/home/node/.claude.json` altında kalıcı hâle getirir. Yalnızca `/home/node/.openclaw` öğesini kalıcı hâle getirmek yeterli değildir; ana dizin birimi yerine `OPENCLAW_EXTRA_MOUNTS` kullanıyorsanız bu Claude yollarının tümünü her iki hizmete de bağlayın.

<Note>
Paylaşımlı üretim otomasyonu veya öngörülebilir Anthropic faturalandırması için Anthropic API anahtarı yolunu tercih edin. Claude CLI'nin yeniden kullanımı, Claude Code'un yüklü sürümünü, hesap oturumunu, faturalandırmasını ve güncelleme davranışını izler.
</Note>

### Bonjour / mDNS

Docker köprü ağı genellikle Bonjour/mDNS çok noktaya yayınını (`224.0.0.251:5353`) güvenilir biçimde iletmez. `OPENCLAW_DISABLE_BONJOUR` ayarlanmamışsa paketlenmiş Bonjour plugin'i, bir konteynerde çalıştığını algıladığında LAN duyurusunu otomatik olarak devre dışı bırakır; böylece köprünün düşürdüğü çok noktaya yayını yeniden denemeye çalışırken çökme döngüsüne girmez. Algılamadan bağımsız olarak kapatmaya zorlamak için `OPENCLAW_DISABLE_BONJOUR=1`, açmaya zorlamak için `0` olarak ayarlayın (yalnızca ana makine ağı, macvlan veya mDNS çok noktaya yayınının çalıştığı bilinen başka bir ağda).

Aksi durumda Docker ana makineleri için yayımlanmış Gateway URL'sini, Tailscale'i veya geniş alan DNS-SD'yi kullanın. Dikkat edilmesi gereken noktalar ve sorun giderme için [Bonjour keşfi](/tr/gateway/bonjour) bölümüne bakın.

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` öğesini `/home/node/.openclaw` konumuna, `OPENCLAW_WORKSPACE_DIR` öğesini `/home/node/.openclaw/workspace` konumuna ve `OPENCLAW_AUTH_PROFILE_SECRET_DIR` öğesini `/home/node/.config/openclaw` konumuna bağlama yoluyla bağlar; böylece bu yollar konteyner değiştirildikten sonra da korunur. Bir değişken ayarlanmamışsa `docker-compose.yml`, `${HOME}` altına veya `HOME` öğesinin kendisi yoksa `/tmp` altına geri döner; böylece `docker compose up` yalın ortamlarda hiçbir zaman boş kaynaklı birim belirtimi üretmez.

Bağlanan yapılandırma dizini şunları içerir:

- `openclaw.json`: davranış yapılandırması
- `agents/<agentId>/agent/auth-profiles.json`: saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması
- `.env`: `OPENCLAW_GATEWAY_TOKEN` gibi ortam destekli çalışma zamanı gizli bilgileri

Kimlik doğrulama profili gizli bilgi dizini, OAuth destekli kimlik doğrulama profili token malzemesine ait yerel şifreleme anahtarını saklar. Bunu Docker ana makine durumunuzla birlikte, ancak `OPENCLAW_CONFIG_DIR` öğesinden ayrı tutun.

Yüklenmiş indirilebilir plugin'ler paket durumunu bağlanmış OpenClaw ana dizini altında saklar; böylece yükleme kayıtları ve paket kökleri konteyner değiştirildikten sonra da korunur. Gateway başlangıcı, paketlenmiş plugin bağımlılık ağaçlarını yeniden oluşturmaz.

Tam sanal makine kalıcılığı ayrıntıları için [Docker VM Çalışma Zamanı - Nelerin nerede kalıcı olduğu](/tr/install/docker-vm-runtime#what-persists-where) bölümüne bakın.

**Disk büyümesinin yoğun olduğu noktalar:** `media/`, ajan başına SQLite veritabanları, eski oturum JSONL transkriptleri, paylaşılan SQLite durum veritabanı, yüklenmiş plugin paket kökleri ve `/tmp/openclaw/` altındaki dönen dosya günlükleri.

### Kabuk yardımcıları (isteğe bağlı)

Günlük komutları kısaltmak için [ClawDock](/tr/install/clawdock) yükleyin:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Eski `scripts/shell-helpers/clawdock-helpers.sh` yolundan kurulum yaptıysanız, yerel yardımcınızın güncel konumu izlemesi için yukarıdaki komutu yeniden çalıştırın. Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın (tam liste için `clawdock-help` komutunu çalıştırın).

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

    Betik, `docker.sock` bağlamasını yalnızca sandbox ön koşulları karşılandıktan sonra yapar. Sandbox kurulumu tamamlanamazsa `agents.defaults.sandbox.mode` değerini `off` olarak sıfırlar. OpenClaw sandbox'ının etkin olduğu turlarda Codex kod modu devre dışı bırakılır (bkz. [Sandbox Kullanımı § Docker arka ucu](/tr/gateway/sandboxing#docker-backend)); ana makinenin Docker soketini asla ajan sandbox konteynerlerine bağlamayın.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY tahsisini `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden gateway'e erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak değerlendirin. Compose yapılandırması, hem `openclaw-gateway` hem de `openclaw-cli` üzerinde `NET_RAW`/`NET_ADMIN` yeteneklerini kaldırır ve `no-new-privileges` seçeneğini etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içindeki Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumlarında `NET_RAW` kaldırıldıktan sonra paylaşılan ağdaki `openclaw-cli` yardımcı konteynerinden yapılan DNS sorguları başarısız olur; bu durum `openclaw plugins install` gibi npm destekli komutlar sırasında `EAI_AGAIN` olarak görünür. Normal kullanım için varsayılan olarak güçlendirilmiş Compose dosyasını koruyun. Aşağıdaki geçersiz kılma yalnızca `openclaw-cli` konteynerinin varsayılan yeteneklerini geri yükler; bunu varsayılan çalıştırma biçiminiz olarak değil, kayıt defteri erişimi gerektiren tek seferlik komut için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Uzun süre çalışan bir `openclaw-cli` konteyneri zaten oluşturduysanız aynı geçersiz kılmayla yeniden oluşturun; `docker compose exec`/`docker exec`, önceden oluşturulmuş bir konteynerin Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin hataları görürseniz ana makine bağlama noktalarınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyuşmazlık, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` ve ardından `plugin present but blocked` olarak da görülebilir; işlem uid'si ile bağlanan plugin dizininin sahibi uyuşmuyordur. Varsayılan uid 1000 ile çalıştırmayı ve bağlama noktası sahipliğini düzeltmeyi tercih edin. Yalnızca OpenClaw'ı uzun vadede kasıtlı olarak root kullanıcısı altında çalıştırıyorsanız `/path/to/openclaw-config/npm` sahipliğini `root:root` olarak değiştirin.

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Kilit dosyaları değişmediği sürece `pnpm install` komutunun yeniden çalıştırılmasını önlemek üzere bağımlılık katmanları önbelleğe alınacak şekilde Dockerfile'ınızı sıralayın:

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

  <Accordion title="İleri düzey kullanıcılar için konteyner seçenekleri">
    Varsayılan imaj güvenliği ön planda tutar ve root olmayan `node` olarak çalışır. Daha kapsamlı özelliklere sahip bir konteyner için:

    1. **`/home/node` kalıcı hâle getirme**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleme**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python bağımlılıklarını imaja ekleme**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium'u imaja ekleme**: `export OPENCLAW_INSTALL_BROWSER=1` veya resmî `-browser` imaj etiketini kullanın
    5. **Ya da Playwright tarayıcılarını kalıcı bir birime yükleme**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Tarayıcı indirmelerini kalıcı hâle getirme**: `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, imajın Playwright tarafından yönetilen Chromium'unu Linux'ta otomatik olarak algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz bir tarayıcı URL'si açılır. Docker veya başsız kurulumlarda ulaştığınız yönlendirme URL'sinin tamamını kopyalayıp kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve zombi işlemlerin temizlenmesi ve uzun süre çalışan konteynerlerde sinyallerin doğru şekilde işlenmesi için `tini` öğesini PID 1 olarak çalıştırır. `org.opencontainers.image.base.name` ve `org.opencontainers.image.source` dâhil olmak üzere OCI temel imaj ek açıklamalarını yayımlar. Dependabot, sabitlenmiş Node temel imaj özetini yeniler; sürüm derlemeleri ayrı bir dağıtım yükseltme katmanı çalıştırmaz. Bkz. [OCI imaj ek açıklamaları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Bir VPS üzerinde mi çalıştırıyorsunuz?

İkili dosyaların imaja eklenmesi, kalıcılık ve güncellemeler dâhil paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve [Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Ajan sandbox'ı

Docker arka ucuyla `agents.defaults.sandbox` etkinleştirildiğinde gateway, kendisi ana makinede kalırken ajan araçlarının yürütülmesini (kabuk, dosya okuma/yazma vb.) yalıtılmış Docker konteynerleri içinde çalıştırır; bu, gateway'in tamamını konteynerleştirmeden güvenilmeyen veya çok kiracılı ajan oturumlarının çevresinde sert bir sınır oluşturur.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşılan olabilir; her kapsam, `/workspace` konumuna bağlanan kendi çalışma alanına sahip olur. Ayrıca izin verilen/reddedilen araç politikalarını, ağ yalıtımını, kaynak sınırlarını ve tarayıcı konteynerlerini yapılandırabilirsiniz.

Eksiksiz yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için:

- [Sandbox Kullanımı](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox konteynerlerine etkileşimli kabuk erişimi
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar

### Hızlı etkinleştirme

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // kapalı | ana olmayan | tümü
        scope: "agent", // oturum | ajan | paylaşılan
      },
    },
  },
}
```

Varsayılan sandbox imajını derleyin (kaynak kod çıkışından):

```bash
scripts/sandbox-setup.sh
```

Kaynak kod çıkışı olmadan yapılan npm kurulumları için satır içi `docker build` komutlarına yönelik [Sandbox Kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox konteyneri başlamıyor">
    Sandbox imajını [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) ile (kaynak kod çıkışı) ya da [Sandbox Kullanımı § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin veya `agents.defaults.sandbox.docker.image` değerini özel imajınız olarak ayarlayın. Konteynerler, gerektiğinde oturum başına otomatik olarak oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içindeki izin hataları">
    `docker.user` değerini bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (oturum açma kabuğu) ile çalıştırır; bu kabuk `/etc/profile` kaynağını yükler ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` değerini ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM nedeniyle sonlandırıldı (çıkış 137)">
    VM en az 2 GB RAM gerektirir. Daha büyük bir makine sınıfı kullanıp yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI'da yetkisiz erişim veya eşleştirme gerekiyor">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Pano](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan eşleştirme hataları alınıyor">
    Gateway modunu ve bağlamasını sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kuruluma Genel Bakış](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — topluluk tarafından sağlanan Docker Compose kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulum sonrası gateway yapılandırması

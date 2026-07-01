---
read_when:
    - Kapsayıcılaştırılmış bir gateway istiyorsunuz; yerel kurulumlar yerine
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve başlangıç yapılandırması
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılı bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için uygun mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsunuz veya OpenClaw'u yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Korumalı alan notu**: varsayılan korumalı alan arka ucu, korumalı alan etkinleştirildiğinde Docker kullanır; ancak korumalı alan varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell korumalı alan arka uçları da kullanılabilir. Bkz. [Korumalı alan](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Görüntü derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde 137 çıkışıyla OOM nedeniyle sonlandırılabilir)
- Görüntüler ve günlükler için yeterli disk alanı
- Bir VPS/genel ana makinede çalıştırıyorsanız,
  [Ağ erişimine açma için güvenlik sıkılaştırması](/tr/gateway/security)
  bölümünü, özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Kapsayıcılı Gateway

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

    Önceden derlenmiş görüntüler önce
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    üzerinde yayımlanır. GHCR; sürüm otomasyonu, sabitlenmiş dağıtımlar
    ve kaynak doğrulama kontrolleri için birincil kayıt deposudur. Aynı sürüm iş akışı,
    Docker Hub'ı tercih eden ana makineler için `openclaw/openclaw` adresinde resmi
    bir Docker Hub aynası da yayımlar:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` veya `openclaw/openclaw` kullanın. Topluluk
    Docker Hub aynalarından kaçının; çünkü OpenClaw bunların sürüm zamanlamasını,
    yeniden derlemelerini veya saklama politikasını kontrol etmez. Yaygın resmi etiketler: `main`, `latest`,
    `<version>` (örn. `2026.2.26`) ve
    `2026.2.26-beta.1` gibi beta sürümleri. Beta etiketleri `latest` veya `main` etiketlerini taşımaz.

  </Step>

  <Step title="İnternete kapalı ortamda yeniden çalıştırma">
    Çevrimdışı ana makinelerde önce görüntüyü aktarın ve yükleyin:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`, `OPENCLAW_IMAGE` değerinin yerelde zaten mevcut olduğunu doğrular,
    örtük Compose çekmelerini ve derlemelerini devre dışı bırakır, ardından
    `.env` eşitlemesi, izin düzeltmeleri, ilk kurulum, Gateway yapılandırma eşitlemesi
    ve Compose başlatma gibi normal kurulum akışını çalıştırır.

    `OPENCLAW_SANDBOX=1` ise çevrimdışı kurulum ayrıca
    `OPENCLAW_DOCKER_SOCKET` arkasındaki daemon üzerinde yapılandırılmış varsayılan
    ve etkin ajan başına korumalı alan görüntülerini kontrol eder. Docker destekli tarayıcı görüntüleri
    güncel OpenClaw tarayıcı sözleşmesi etiketini de taşımalıdır. Gerekli bir görüntü eksik
    veya uyumsuz olduğunda kurulum, kullanılamaz bir korumalı alanla başarı bildirmek yerine
    korumalı alan yapılandırmasını değiştirmeden çıkar.

  </Step>

  <Step title="İlk kurulumu tamamlayın">
    Kurulum betiği ilk kurulumu otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway belirteci oluşturur ve bunu `.env` dosyasına yazar
    - auth-profile gizli anahtar dizinini oluşturur
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlatma öncesi ilk kurulum ve yapılandırma yazma işlemleri doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway kapsayıcısı zaten var olduktan sonra
    çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'ı açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli anahtarı Ayarlar'a yapıştırın. Kurulum betiği varsayılan olarak `.env` dosyasına
    bir belirteç yazar; kapsayıcı yapılandırmasını parola kimlik doğrulamasına geçirirseniz bunun yerine
    o parolayı kullanın.

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml` yazar;
bunu standart override dosyalarından sonra dahil edin; örneğin iki override dosyası da mevcutsa
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
kullanın.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ile aynı ağ ad alanını paylaştığı için
başlatma sonrası bir araçtır. `docker compose up -d openclaw-gateway` komutundan önce
ilk kurulumu ve kurulum zamanı yapılandırma yazma işlemlerini
`--no-deps --entrypoint node` ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                        | Amaç                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Yerelde derlemek yerine uzak bir görüntü kullanır                     |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)          |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Derleme sırasında ek Python paketleri kurar (boşlukla ayrılmış)       |
| `OPENCLAW_EXTENSIONS`                           | Derleme zamanında Plugin bağımlılıklarını önceden kurar (boşlukla ayrılmış adlar) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Yerel kaynak derlemesi Node seçeneklerini geçersiz kılar              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Yerel kaynak derlemesi tsdown yığınını MB cinsinden geçersiz kılar    |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Yalnızca çalışma zamanı yerel görüntü derlemelerinde bildirim çıktısını atlar |
| `OPENCLAW_EXTRA_MOUNTS`                         | Ek ana makine bind bağlamaları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı yapar |
| `OPENCLAW_SANDBOX`                              | Korumalı alan önyüklemesine katılır (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_SKIP_ONBOARDING`                      | Etkileşimli ilk kurulum adımını atlar (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker socket yolunu geçersiz kılar                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Paketlenmiş Plugin kaynak bind-mount overlay'lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP toplayıcı uç noktası |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | İzler, metrikler veya günlükler için sinyale özgü OTLP uç noktaları   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP protokolünü geçersiz kılar. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry kaynakları için kullanılan hizmet adı                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | En son deneysel GenAI semantik özniteliklerine katılır                |
| `OPENCLAW_OTEL_PRELOADED`                       | Bir OpenTelemetry SDK zaten önceden yüklenmişse ikinci bir SDK başlatmayı atlar |

Resmi Docker görüntüsü Homebrew içermez. İlk kurulum sırasında OpenClaw,
`brew` olmadan bir Linux kapsayıcısında çalıştığında yalnızca brew ile kullanılabilen skill bağımlılığı kurucularını
gizler; bu bağımlılıklar özel bir görüntüyle sağlanmalı
veya manuel olarak kurulmalıdır. Debian paketlerinden edinilebilen bağımlılıklar için
görüntü derlemesi sırasında `OPENCLAW_IMAGE_APT_PACKAGES` kullanın. Eski
`OPENCLAW_DOCKER_APT_PACKAGES` adı hâlâ kabul edilir.
Python bağımlılıkları için `OPENCLAW_IMAGE_PIP_PACKAGES` kullanın. Bu, görüntü derlemesi sırasında
`python3 -m pip install --break-system-packages` çalıştırır; bu nedenle
paket sürümlerini sabitleyin ve yalnızca güvendiğiniz paket indekslerini kullanın.
Kaynak derlemeleri varsayılan olarak `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` değerini
`--max-old-space-size=8192` yapar ve tsdown sarmalayıcısının kapsayıcı bellek sınırlarına
uyabilmesi için `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` değerini ayarlanmamış bırakır.
Ayrıca çalışma zamanı görüntüleri derlemeden sonra bildirim dosyalarını budadığı için
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` varsayılanını kullanırlar. Docker `ResourceExhausted`,
`cannot allocate memory` bildirirse veya `tsdown` sırasında işlemi durdurursa,
Docker derleyici bellek sınırını artırın ya da daha küçük açık yığınlarla yeniden deneyin; örneğin
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Bakımcılar, bir Plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine bağlayarak
paketlenmiş bir görüntüye karşı paketlenmiş Plugin kaynağını test edebilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanmış kaynak dizini, aynı Plugin kimliği için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı Gateway kapsayıcısından OTLP toplayıcınıza giden yöndedir.
Yayımlanmış bir Docker portu gerektirmez. Görüntüyü yerelde derliyorsanız ve paketlenmiş
OpenTelemetry dışa aktarıcısının görüntü içinde kullanılabilir olmasını istiyorsanız
çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce
resmi `@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun.
Özel kaynak derlemeli görüntüler yerel Plugin kaynağını
`OPENCLAW_EXTENSIONS=diagnostics-otel` ile hâlâ dahil edebilir. Dışa aktarımı etkinleştirmek için
yapılandırmada `diagnostics-otel` Plugin'ine izin verin ve etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
bölümündeki yapılandırma örneğini kullanın. Toplayıcı kimlik doğrulama başlıkları
Docker ortam değişkenleriyle değil, `diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway portunu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun,
`diagnostics-prometheus` Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel
`/metrics` portu veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık kontrolleri

Kapsayıcı probe uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker görüntüsü, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Kontroller başarısız olmaya devam ederse Docker kapsayıcıyı `unhealthy` olarak işaretler ve
orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ile loopback

`scripts/docker/setup.sh` varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` kullanır; böylece
`http://127.0.0.1:18789` adresine ana makineden erişim Docker bağlantı noktası yayımlama ile çalışır.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI yayımlanan gateway bağlantı noktasına erişebilir.
- `loopback`: yalnızca kapsayıcı ağ ad alanı içindeki süreçler
  gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bağlama modu değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını kullanmayın.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında, kapsayıcı içindeki `127.0.0.1` ana makineniz değil,
kapsayıcının kendisidir. Ana makinede çalışan yapay zeka sağlayıcıları için
`host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Paketli Docker kurulumu, bu ana makine URL'lerini LM Studio ve Ollama
ilk kurulum varsayılanları olarak kullanır ve `docker-compose.yml`, Linux Docker Engine için
`host.docker.internal` adını Docker'ın ana makine ağ geçidine eşler. Docker Desktop,
macOS ve Windows üzerinde aynı ana makine adını zaten sağlar.

Ana makine hizmetleri ayrıca Docker'dan erişilebilen bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız, aynı ana makine
eşlemesini kendiniz ekleyin; örneğin
`--add-host=host.docker.internal:host-gateway`.

### Docker içinde Claude CLI arka ucu

Resmi OpenClaw Docker görüntüsü Claude Code'u önceden yüklemez. Claude Code'u
OpenClaw'u çalıştıran kapsayıcı kullanıcısının içinde yükleyip oturum açın, ardından
görüntü yükseltmeleri ikili dosyayı veya Claude kimlik doğrulama
durumunu silmesin diye bu kapsayıcı home dizinini kalıcı hale getirin.

Yeni Docker kurulumları için, kurulumu çalıştırmadan önce kalıcı bir `/home/node` birimini etkinleştirin:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Mevcut bir Docker kurulumu için önce yığını durdurun ve kurulumu yeniden çalıştırmadan önce geçerli
Docker `.env` değerlerini yeniden yükleyin. Kurulum betiği `.env` dosyasını kendi başına okumaz;
`.env` dosyasını geçerli kabuktan ve varsayılanlardan yeniden yazar. Oluşturulan `.env` için şunu çalıştırın:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` dosyanız kabuğunuzun kaynak olarak yükleyemeyeceği değerler içeriyorsa, önce
dayandığınız mevcut değerleri elle yeniden dışa aktarın; örneğin `OPENCLAW_IMAGE`, bağlantı noktaları,
bağlama modu, özel yollar, `OPENCLAW_EXTRA_MOUNTS`, sandbox ve ilk kurulumu atlama ayarları.
Oluşturulan overlay, home birimini hem `openclaw-gateway` hem de
`openclaw-cli` için bağlar.

Kalan komutları oluşturulan Compose overlay'i ile çalıştırın; böylece her iki hizmet de
kalıcı home dizinini bağlar. Kurulumunuz ayrıca `docker-compose.override.yml` kullanıyorsa,
onu `docker-compose.extra.yml` dosyasından önce dahil edin.

Claude Code'u bu kalıcı home dizinine yükleyin:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Yerel yükleyici `claude` ikili dosyasını
`/home/node/.local/bin/claude` altına yazar. OpenClaw'a bu kapsayıcı yolunu kullanmasını söyleyin:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Aynı kalıcı kapsayıcı home dizini içinden oturum açın ve doğrulayın:

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

Bundan sonra, paketli `claude-cli` arka ucunu kullanabilirsiniz:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME`, yerel Claude Code kurulumunu
`/home/node/.local/bin` ve `/home/node/.local/share/claude` altında, ayrıca Claude Code
ayarlarını ve kimlik doğrulama durumunu `/home/node/.claude` ve `/home/node/.claude.json`
altında kalıcı hale getirir. Yalnızca `/home/node/.openclaw` dizinini kalıcı hale getirmek,
Claude CLI yeniden kullanımı için yeterli değildir. Home birimi yerine
`OPENCLAW_EXTRA_MOUNTS` kullanıyorsanız, bu Claude yollarının tamamını
her iki Docker hizmetine bağlayın.

<Note>
Paylaşımlı üretim otomasyonu veya öngörülebilir Anthropic faturalaması için
Anthropic API anahtarı yolunu tercih edin. Claude CLI yeniden kullanımı Claude Code'un yüklü
sürümünü, hesap oturumunu, faturalamasını ve güncelleme davranışını izler.
</Note>

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast
(`224.0.0.251:5353`) trafiğini güvenilir şekilde iletmez. Bu nedenle paketli Compose kurulumu
varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece bridge multicast trafiğini düşürdüğünde
Gateway crash-loop'a girmez veya reklam yayınlamayı tekrar tekrar yeniden başlatmaz.

Docker ana makineleri için yayımlanan Gateway URL'sini, Tailscale'i veya geniş alan DNS-SD kullanın.
`OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan
veya mDNS multicast'in çalıştığı bilinen başka bir ağla çalışırken ayarlayın.

Dikkat edilmesi gereken noktalar ve sorun giderme için [Bonjour keşfi](/tr/gateway/bonjour) bölümüne bakın.

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` konumuna,
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` konumuna ve
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` değerini `/home/node/.config/openclaw` konumuna bind-mount yapar;
böylece bu yollar kapsayıcı değişiminden sonra da korunur. Herhangi bir değişken ayarlanmamışsa, paketli
`docker-compose.yml` `${HOME}` altına, `HOME` değerinin kendisi de eksikse
`/tmp` altına geri döner. Bu, yalın ortamlarda `docker compose up` komutunun boş kaynaklı
bir birim belirtimi yaymasını engeller.

Bu bağlanan yapılandırma dizini, OpenClaw'un şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı gizli değerleri için `.env`

Kimlik doğrulama profili gizli anahtar dizini, OAuth destekli kimlik doğrulama profili token
malzemesi için kullanılan yerel şifreleme anahtarını saklar. Bunu Docker ana makine durumunuzla birlikte,
ancak `OPENCLAW_CONFIG_DIR` dizininden ayrı tutun.

Yüklenen indirilebilir plugin'ler paket durumlarını bağlanan OpenClaw home dizini altında saklar;
böylece plugin yükleme kayıtları ve paket kökleri kapsayıcı değişiminden sonra korunur.
Gateway başlangıcı paketli plugin bağımlılık ağaçları oluşturmaz.

VM dağıtımlarında kalıcılık ayrıntılarının tamamı için
[Docker VM Çalışma Zamanı - Nerede ne kalıcıdır](/tr/install/docker-vm-runtime#what-persists-where) bölümüne bakın.

**Disk büyümesi sıcak noktaları:** `media/`, oturum JSONL dosyaları, paylaşılan
SQLite durum veritabanı, yüklü plugin paket kökleri ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` yükleyin:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` raw yolundan yüklediyseniz, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki yükleme komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. komutları kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) bölümüne bakın.

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

    Betik `docker.sock` dosyasını yalnızca sandbox ön koşulları geçtikten sonra bağlar. Sandbox kurulumu
    tamamlanamazsa betik `agents.defaults.sandbox.mode` değerini
    `off` olarak sıfırlar. OpenClaw sandbox'ı etkin olduğu sürece Codex kod modu turları yine Codex
    `workspace-write` ile sınırlıdır; ana makine Docker soketini
    agent sandbox kapsayıcılarına bağlamayın.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde TTY ayırmasını `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşımlı ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden gateway'e erişebilmesi için
    `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşımlı bir
    güven sınırı olarak ele alın. Compose yapılandırması hem `openclaw-gateway` hem de
    `openclaw-cli` üzerinde `NET_RAW`/`NET_ADMIN` özelliklerini kaldırır ve
    `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içinde Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumları, `NET_RAW` kaldırıldıktan sonra paylaşımlı ağdaki
    `openclaw-cli` yan kapsayıcısından DNS sorgularında başarısız olur; bu da
    `openclaw plugins install` gibi npm destekli komutlar sırasında
    `EAI_AGAIN` olarak görünür. Normal gateway çalışması için varsayılan sıkılaştırılmış compose dosyasını
    koruyun. Aşağıdaki yerel override, Docker'ın varsayılan yeteneklerini geri yükleyerek
    CLI kapsayıcısının güvenlik duruşunu gevşetir; bu yüzden bunu varsayılan Compose
    çağrınız olarak değil, yalnızca paket kayıt defteri erişimi gerektiren tek seferlik CLI
    komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Zaten uzun süre çalışan bir `openclaw-cli` kapsayıcısı oluşturduysanız, onu
    aynı override ile yeniden oluşturun. `docker compose exec` ve `docker exec`,
    önceden oluşturulmuş bir kapsayıcıda Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    Görüntü `node` olarak çalışır (uid 1000). `/home/node/.openclaw` üzerinde
    izin hataları görürseniz, ana makine bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, şu tür bir plugin uyarısı olarak da görünebilir:
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ve ardından `plugin present but blocked`. Bu, süreç uid'si ile
    bağlanan plugin dizini sahibinin uyuşmadığı anlamına gelir. Kapsayıcıyı
    varsayılan uid 1000 olarak çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. Yalnızca
    OpenClaw'u uzun vadede kasıtlı olarak root olarak çalıştırıyorsanız
    `/path/to/openclaw-config/npm` dizinini `root:root` olarak chown yapın.

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
    Varsayılan image güvenliği önceler ve root olmayan `node` olarak çalışır. Daha
    kapsamlı özelliklere sahip bir container için:

    1. **`/home/node` dizinini kalıcı yapın**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja gömün**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python bağımlılıklarını imaja gömün**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium'u imaja gömün**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Veya Playwright tarayıcılarını kalıcı bir volume içine kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Tarayıcı indirmelerini kalıcı yapın**: `OPENCLAW_HOME_VOLUME` veya
       `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux'ta Docker image'ın
       Playwright tarafından yönetilen Chromium'unu otomatik algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz bir tarayıcı URL'si açılır.
    Docker veya headless kurulumlarda, ulaştığınız tam yönlendirme URL'sini
    kopyalayın ve kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel image meta verileri">
    Ana Docker runtime image'ı `node:24-bookworm-slim` kullanır ve uzun süre çalışan container'larda zombi süreçlerin temizlenmesini ve sinyallerin doğru işlenmesini sağlamak için entrypoint init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel image
    anotasyonlarını yayımlar. Node temel özeti Dependabot Docker temel image
    PR'leriyle yenilenir; release build'leri bir dağıtım yükseltme katmanı
    çalıştırmaz. Bkz.
    [OCI image anotasyonları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde çalıştırıyor musunuz?

İkiliyi imaja gömme, kalıcılık ve güncellemeler dahil paylaşımlı VM dağıtım
adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Ajan korumalı alanı

`agents.defaults.sandbox` Docker backend ile etkinleştirildiğinde Gateway,
ajan araç yürütmesini (shell, dosya okuma/yazma vb.) yalıtılmış Docker
container'ları içinde çalıştırırken Gateway'in kendisi host üzerinde kalır. Bu,
Gateway'in tamamını container içine almadan güvenilmeyen veya çok kiracılı ajan
oturumlarının etrafında sağlam bir duvar sağlar.

Korumalı alan kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı
olabilir. Her kapsam kendi çalışma alanını `/workspace` konumuna mount edilmiş
olarak alır. Ayrıca izin verme/reddetme araç ilkelerini, ağ yalıtımını, kaynak
sınırlarını ve tarayıcı container'larını yapılandırabilirsiniz.

Tam yapılandırma, image'lar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Korumalı alan](/tr/gateway/sandboxing) -- eksiksiz korumalı alan referansı
- [OpenShell](/tr/gateway/openshell) -- korumalı alan container'larına etkileşimli shell erişimi
- [Çok Ajanlı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar

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

Varsayılan korumalı alan image'ını oluşturun (bir kaynak çalışma kopyasından):

```bash
scripts/sandbox-setup.sh
```

Kaynak çalışma kopyası olmadan npm kurulumları için satır içi `docker build` komutları hakkında [Korumalı alan § Image'lar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Image eksik veya korumalı alan container'ı başlamıyor">
    Korumalı alan image'ını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak çalışma kopyası) ile veya [Korumalı alan § Image'lar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) oluşturun
    ya da `agents.defaults.sandbox.docker.image` değerini özel image'ınıza ayarlayın.
    Container'lar ihtiyaç halinde oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Korumalı alanda izin hataları">
    `docker.user` değerini mount edilmiş çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar korumalı alanda bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu da
    `/etc/profile` dosyasını kaynak olarak kullanır ve PATH'i sıfırlayabilir. Özel
    araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda
    `/etc/profile.d/` altına bir script ekleyin.
  </Accordion>

  <Accordion title="Image build sırasında OOM nedeniyle öldürüldü (exit 137)">
    VM için en az 2 GB RAM gerekir. Daha büyük bir makine sınıfı kullanın ve tekrar deneyin.
  </Accordion>

  <Accordion title="Control UI'de yetkisiz veya eşleştirme gerekli">
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
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması

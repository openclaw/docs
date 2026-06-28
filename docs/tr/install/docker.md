---
read_when:
    - Yerel kurulumlar yerine kapsayıcılı bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk yapılandırma
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker bana uygun mu?

- **Evet**: yalıtılmış, tek kullanımlık bir Gateway ortamı istiyorsanız veya OpenClaw'ı yerel kurulumlar olmadan bir ana makinede çalıştırmak istiyorsanız.
- **Hayır**: kendi makinenizde çalışıyorsanız ve yalnızca en hızlı geliştirme döngüsünü istiyorsanız. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox arka ucu, sandboxing etkinleştirildiğinde Docker kullanır, ancak sandboxing varsayılan olarak kapalıdır ve Gateway'in tamamının Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- Görüntü derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde çıkış 137 ile OOM nedeniyle sonlandırılabilir)
- Görüntüler ve günlükler için yeterli disk alanı
- VPS/genel ana makinede çalıştırıyorsanız,
  [Ağ erişimi için güvenlik sertleştirmesi](/tr/gateway/security) bölümünü,
  özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="Build the image">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway görüntüsünü yerelde derler. Bunun yerine önceden derlenmiş bir görüntü kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş görüntüler önce
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    GHCR, sürüm otomasyonu, sabitlenmiş dağıtımlar
    ve kaynak doğrulama kontrolleri için birincil kayıt deposudur. Aynı sürüm iş akışı, Docker Hub'ı tercih eden ana makineler için `openclaw/openclaw` adresinde resmi bir
    Docker Hub yansısı da yayımlar:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` veya `openclaw/openclaw` kullanın. Topluluk
    Docker Hub yansılarını kullanmaktan kaçının; çünkü OpenClaw bunların sürüm zamanlamasını,
    yeniden derlemelerini veya saklama politikasını kontrol etmez. Yaygın resmi etiketler: `main`, `latest`,
    `<version>` (örn. `2026.2.26`) ve
    `2026.2.26-beta.1` gibi beta sürümler. Beta etiketleri `latest` veya `main` değerlerini taşımaz.

  </Step>

  <Step title="Airgapped rerun">
    Çevrimdışı ana makinelerde önce görüntüyü aktarın ve yükleyin:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`, `OPENCLAW_IMAGE` değerinin yerelde zaten var olduğunu doğrular,
    örtük Compose çekmelerini ve derlemelerini devre dışı bırakır, ardından
    `.env` eşitlemesi, izin düzeltmeleri, ilk katılım, Gateway yapılandırma eşitlemesi
    ve Compose başlatması gibi normal kurulum akışını çalıştırır.

    `OPENCLAW_SANDBOX=1` ise çevrimdışı kurulum, `OPENCLAW_DOCKER_SOCKET` arkasındaki daemon üzerinde yapılandırılmış varsayılanı
    ve ajan başına etkin sandbox görüntülerini de denetler. Docker destekli tarayıcı görüntüleri de
    geçerli OpenClaw tarayıcı sözleşmesi etiketini taşımalıdır. Gerekli bir görüntü eksik veya
    uyumsuz olduğunda kurulum, kullanılamaz bir sandbox ile başarı bildirmek yerine
    sandbox yapılandırmasını değiştirmeden çıkar.

  </Step>

  <Step title="Complete onboarding">
    Kurulum betiği ilk katılımı otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway belirteci üretir ve `.env` dosyasına yazar
    - auth-profile gizli anahtar dizinini oluşturur
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlatma öncesi ilk katılım ve yapılandırma yazımları doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway konteyneri zaten var olduktan sonra
    çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Open the Control UI">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli anahtarı Ayarlar'a yapıştırın. Kurulum betiği varsayılan olarak `.env` dosyasına bir belirteç yazar;
    konteyner yapılandırmasını parola kimlik doğrulamasına geçirirseniz bunun yerine o
    parolayı kullanın.

    URL yine mi gerekiyor?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml` yazar;
bunu herhangi bir standart override dosyasından sonra ekleyin; örneğin her iki override dosyası da varsa
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
kullanın.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ağ ad alanını paylaştığı için
başlatma sonrası kullanılan bir araçtır. `docker compose up -d openclaw-gateway` öncesinde,
ilk katılımı ve kurulum zamanı yapılandırma yazımlarını `--no-deps --entrypoint node` ile
`openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerelde derlemek yerine uzak bir görüntü kullanır                     |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)          |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Derleme sırasında ek Python paketleri kurar (boşlukla ayrılmış)       |
| `OPENCLAW_EXTENSIONS`                      | Plugin bağımlılıklarını derleme zamanında önceden kurar (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek ana makine bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı yapar |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap için katılım (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli ilk katılım adımını atlar (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu geçersiz kılar                                   |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketli Plugin kaynak bind-mount overlay'lerini devre dışı bırakır    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector endpoint'i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | İzler, metrikler veya günlükler için sinyale özgü OTLP endpoint'leri  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan hizmet adı                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En son deneysel GenAI semantik özniteliklerine katılım                |
| `OPENCLAW_OTEL_PRELOADED`                  | Biri önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atlar |

Resmi Docker görüntüsü Homebrew içermez. İlk katılım sırasında OpenClaw,
`brew` olmayan bir Linux konteynerinde çalışıyorsa yalnızca brew ile kurulabilen skill bağımlılığı yükleyicilerini gizler;
bu bağımlılıklar özel bir görüntü tarafından sağlanmalı
veya elle kurulmalıdır. Debian paketlerinden edinilebilen bağımlılıklar için
görüntü derlemesi sırasında `OPENCLAW_IMAGE_APT_PACKAGES` kullanın. Eski
`OPENCLAW_DOCKER_APT_PACKAGES` adı hâlâ kabul edilir.
Python bağımlılıkları için `OPENCLAW_IMAGE_PIP_PACKAGES` kullanın. Bu, görüntü derlemesi sırasında
`python3 -m pip install --break-system-packages` çalıştırır; bu yüzden paket sürümlerini sabitleyin
ve yalnızca güvendiğiniz paket indekslerini kullanın.

Bakımcılar, paketlenmiş bir görüntüye bir Plugin kaynak dizinini paketlenmiş kaynak yolu üzerine bağlayarak
paketli Plugin kaynağını test edebilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanan kaynak dizini, aynı Plugin id'si için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı Gateway konteynerinden OTLP
collector'ınıza doğru giden yöndedir. Yayınlanmış bir Docker portu gerektirmez. Görüntüyü
yerelde derliyorsanız ve paketli OpenTelemetry exporter'ın görüntü içinde kullanılabilir olmasını istiyorsanız,
çalışma zamanı bağımlılıklarını ekleyin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce ClawHub'dan resmi
`@openclaw/diagnostics-otel` Plugin'ini kurun. Özel kaynak derlemeli görüntüler,
`OPENCLAW_EXTENSIONS=diagnostics-otel` ile yerel Plugin kaynağını hâlâ içerebilir.
Dışa aktarımı etkinleştirmek için yapılandırmada `diagnostics-otel` Plugin'ine izin verip etkinleştirin,
ardından `diagnostics.otel.enabled=true` ayarlayın veya [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry)
bölümündeki yapılandırma örneğini kullanın. Collector auth başlıkları Docker ortam değişkenleriyle değil,
`diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway portunu kullanır. `clawhub:@openclaw/diagnostics-prometheus`
kurun, `diagnostics-prometheus` Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel
`/metrics` portu veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık kontrolleri

Konteyner probe endpoint'leri (kimlik doğrulaması gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker görüntüsü, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Kontroller başarısız olmaya devam ederse Docker konteyneri `unhealthy` olarak işaretler ve
orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayınıyla ana makine erişiminin
`http://127.0.0.1:18789` adresine çalışması için varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'ı yayımlanan Gateway portuna erişebilir.
- `loopback`: yalnızca konteyner ağ ad alanı içindeki süreçler
  Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bind modu değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın; `0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını kullanmayın.
</Note>

### Ana Makinedeki Yerel Sağlayıcılar

OpenClaw Docker içinde çalıştığında konteyner içindeki `127.0.0.1`, ana makineniz değil
konteynerin kendisidir. Ana makinede çalışan AI sağlayıcıları için `host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL'si | Docker kurulum URL'si              |
| --------- | ---------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Paketle gelen Docker kurulumu, bu ana makine URL'lerini LM Studio ve Ollama
onboarding varsayılanları olarak kullanır ve `docker-compose.yml`,
`host.docker.internal` adresini Linux Docker Engine için Docker'ın ana makine
Gateway'ine eşler. Docker Desktop, macOS ve Windows'ta aynı ana makine adını
zaten sağlar.

Ana makine hizmetleri de Docker'dan erişilebilen bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı ana
makine eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Docker'da Claude CLI arka ucu

Resmi OpenClaw Docker imajı Claude Code'u önceden yüklemez. Claude Code'u,
OpenClaw'ı çalıştıran konteyner kullanıcısı içinde kurup oturum açın, ardından
imaj yükseltmelerinin ikili dosyayı veya Claude kimlik doğrulama durumunu
silmemesi için bu konteyner ana dizinini kalıcı hale getirin.

Yeni Docker kurulumları için kurulumu çalıştırmadan önce kalıcı bir `/home/node`
birimi etkinleştirin:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Mevcut bir Docker kurulumu için önce yığını durdurun ve kurulumu yeniden
çalıştırmadan önce geçerli Docker `.env` değerlerini yeniden yükleyin. Kurulum
betiği `.env` dosyasını kendiliğinden okumaz; `.env` dosyasını geçerli kabuktan
ve varsayılanlardan yeniden yazar. Üretilen `.env` için şunu çalıştırın:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` dosyanız kabuğunuzun kaynak olarak yükleyemeyeceği değerler içeriyorsa,
önce güvendiğiniz mevcut değerleri manuel olarak yeniden dışa aktarın; örneğin
`OPENCLAW_IMAGE`, bağlantı noktaları, bağlama modu, özel yollar,
`OPENCLAW_EXTRA_MOUNTS`, sandbox ve onboarding'i atlama ayarları. Üretilen
overlay, ana dizin birimini hem `openclaw-gateway` hem de `openclaw-cli` için
bağlar.

Kalan komutları üretilen Compose overlay'iyle çalıştırın; böylece her iki hizmet
de kalıcı ana dizini bağlar. Kurulumunuz ayrıca `docker-compose.override.yml`
kullanıyorsa, bunu `docker-compose.extra.yml` dosyasından önce dahil edin.

Claude Code'u bu kalıcı ana dizine kurun:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Yerel kurucu, `claude` ikili dosyasını
`/home/node/.local/bin/claude` altına yazar. OpenClaw'a bu konteyner yolunu
kullanmasını söyleyin:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Aynı kalıcı konteyner ana dizininin içinden oturum açın ve doğrulayın:

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

Bundan sonra paketle gelen `claude-cli` arka ucunu kullanabilirsiniz:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME`, yerel Claude Code kurulumunu
`/home/node/.local/bin` ve `/home/node/.local/share/claude` altında, ayrıca
Claude Code ayarlarını ve kimlik doğrulama durumunu `/home/node/.claude` ve
`/home/node/.claude.json` altında kalıcı hale getirir. Claude CLI yeniden
kullanımı için yalnızca `/home/node/.openclaw` dizinini kalıcı hale getirmek
yeterli değildir. Ana dizin birimi yerine `OPENCLAW_EXTRA_MOUNTS`
kullanıyorsanız, bu Claude yollarının tamamını her iki Docker hizmetine de
bağlayın.

<Note>
Paylaşılan üretim otomasyonu veya öngörülebilir Anthropic faturalandırması için
Anthropic API anahtarı yolunu tercih edin. Claude CLI yeniden kullanımı,
Claude Code'un yüklü sürümünü, hesap oturumunu, faturalandırmasını ve güncelleme
davranışını izler.
</Note>

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast trafiğini
(`224.0.0.251:5353`) güvenilir şekilde iletmez. Bu nedenle paketle gelen Compose
kurulumu varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece
bridge multicast trafiğini düşürdüğünde Gateway crash-loop'a girmez veya reklamı
tekrar tekrar yeniden başlatmaz.

Docker ana makineleri için yayımlanan Gateway URL'sini, Tailscale'i veya
geniş alan DNS-SD'yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca
host networking, macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ
ile çalışırken ayarlayın.

Püf noktaları ve sorun giderme için [Bonjour keşfi](/tr/gateway/bonjour) bölümüne
bakın.

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` dizinini `/home/node/.openclaw` konumuna,
`OPENCLAW_WORKSPACE_DIR` dizinini `/home/node/.openclaw/workspace` konumuna ve
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` dizinini `/home/node/.config/openclaw`
konumuna bind-mount eder; böylece bu yollar konteyner değişiminden sağ çıkar.
Herhangi bir değişken ayarlanmamışsa paketle gelen `docker-compose.yml`,
`${HOME}` altına, `HOME` de yoksa `/tmp` altına geri döner. Bu, yalın
ortamlarda `docker compose up` komutunun boş kaynaklı birim tanımı yaymasını
engeller.

Bu bağlı yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- depolanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi ortam destekli çalışma zamanı sırları için `.env`

Kimlik doğrulama profili gizli anahtar dizini, OAuth destekli kimlik doğrulama
profili token materyali için kullanılan yerel şifreleme anahtarını depolar. Bunu
Docker ana makine durumunuzla birlikte, ancak `OPENCLAW_CONFIG_DIR` dizininden
ayrı tutun.

Kurulu indirilebilir Plugin'ler paket durumlarını bağlı OpenClaw ana dizini
altında saklar; böylece Plugin kurulum kayıtları ve paket kökleri konteyner
değişiminden sağ çıkar. Gateway başlangıcı, paketle gelen Plugin bağımlılık
ağaçları oluşturmaz.

VM dağıtımlarında kalıcılıkla ilgili tüm ayrıntılar için
[Docker VM Çalışma Zamanı - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
bölümüne bakın.

**Disk büyümesi odak noktaları:** `media/`, oturum JSONL dosyaları, paylaşılan
SQLite durum veritabanı, kurulu Plugin paket kökleri ve `/tmp/openclaw/`
altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` raw yolundan
kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki
kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuz için [ClawDock](/tr/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    Betik `docker.sock` dosyasını yalnızca sandbox önkoşulları geçtikten sonra
    bağlar. Sandbox kurulumu tamamlanamazsa betik
    `agents.defaults.sandbox.mode` değerini `off` olarak sıfırlar. OpenClaw
    sandbox'ı etkin durumdayken Codex kod modu dönüşleri yine Codex
    `workspace-write` ile sınırlandırılır; ana makine Docker soketini ajan
    sandbox konteynerlerine bağlamayın.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Compose pseudo-TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli`, CLI komutlarının Gateway'e `127.0.0.1` üzerinden
    erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu
    paylaşılan bir güven sınırı olarak ele alın. Compose yapılandırması
    `NET_RAW`/`NET_ADMIN` yetkilerini düşürür ve hem `openclaw-gateway` hem de
    `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Bazı Docker Desktop kurulumları, `NET_RAW` düşürüldükten sonra paylaşılan
    ağdaki `openclaw-cli` sidecar'ından DNS aramalarında başarısız olur; bu da
    `openclaw plugins install` gibi npm destekli komutlar sırasında `EAI_AGAIN`
    olarak görünür. Normal Gateway çalışması için varsayılan sertleştirilmiş
    compose dosyasını koruyun. Aşağıdaki yerel override, Docker'ın varsayılan
    yeteneklerini geri yükleyerek CLI konteynerinin güvenlik duruşunu gevşetir;
    bu nedenle bunu varsayılan Compose çağrınız olarak değil, yalnızca paket
    kayıt defteri erişimi gerektiren tek seferlik CLI komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Uzun süre çalışan bir `openclaw-cli` konteynerini zaten oluşturduysanız, aynı
    override ile yeniden oluşturun. `docker compose exec` ve `docker exec`, zaten
    oluşturulmuş bir konteynerde Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin
    hataları görürseniz, ana makine bind mount'larınızın uid 1000 tarafından
    sahiplenildiğinden emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyuşmazlık, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ve ardından `plugin present but blocked` gibi bir Plugin uyarısı olarak da
    görünebilir. Bu, işlem uid'si ile bağlı Plugin dizini sahibinin uyuşmadığı
    anlamına gelir. Konteyneri varsayılan uid 1000 ile çalıştırmayı ve bind
    mount sahipliğini düzeltmeyi tercih edin. `/path/to/openclaw-config/npm`
    dizinini yalnızca OpenClaw'ı uzun vadede bilinçli olarak root olarak
    çalıştırıyorsanız `root:root` yapın.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın.
    Bu, lockfile'lar değişmedikçe `pnpm install` komutunun yeniden çalışmasını
    önler:

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

  <Accordion title="Power-user container options">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır.
    Daha tam özellikli bir konteyner için:

    1. **`/home/node` dizinini kalıcı yapın**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python bağımlılıklarını imaja ekleyin**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium’u imaja ekleyin**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Veya Playwright tarayıcılarını kalıcı bir birime yükleyin**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Tarayıcı indirmelerini kalıcı yapın**: `OPENCLAW_HOME_VOLUME` veya
       `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux’ta Docker imajının
       Playwright tarafından yönetilen Chromium’unu otomatik algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth’u seçerseniz bir tarayıcı URL’si açılır.
    Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL’sini kopyalayıp
    kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve uzun süre çalışan kapsayıcılarda zombi süreçlerin temizlenmesini ve sinyallerin doğru işlenmesini sağlamak için giriş noktası init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj anotasyonları yayımlar. Node temel özeti
    Dependabot Docker temel imaj PR’ları üzerinden yenilenir; sürüm derlemeleri
    bir dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Bir VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya imaja ekleme, kalıcılık ve güncellemeler dahil paylaşımlı VM dağıtım adımları için
[Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Agent sandbox

`agents.defaults.sandbox`, Docker arka ucu ile etkinleştirildiğinde Gateway,
agent araç yürütmesini (kabuk, dosya okuma/yazma vb.) izole Docker
kapsayıcıları içinde çalıştırırken Gateway’in kendisi ana makinede kalır. Bu, tüm
Gateway’i kapsayıcılaştırmadan güvenilmeyen veya çok kiracılı agent oturumlarının
etrafında sağlam bir sınır sağlar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam,
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca
izin ver/reddet araç ilkeleri, ağ izolasyonu, kaynak sınırları ve tarayıcı
kapsayıcıları yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok agent’lı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- eksiksiz sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli kabuk erişimi
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

Varsayılan sandbox imajını derleyin (bir kaynak checkout’undan):

```bash
scripts/sandbox-setup.sh
```

Kaynak checkout’u olmayan npm kurulumları için satır içi `docker build` komutları konusunda [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox kapsayıcısı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout’u) veya [Sandboxing § Images and setup](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar, ihtiyaç oldukça oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanınızın sahipliğiyle eşleşen bir UID:GID’ye ayarlayın
    veya çalışma alanı klasörünün sahibini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (oturum açma kabuğu) ile çalıştırır; bu da
    `/etc/profile` dosyasını kaynak olarak alır ve PATH’i sıfırlayabilir. Özel
    araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile’ınızda
    `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (çıkış 137)">
    VM’nin en az 2 GB RAM’e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanıp yeniden deneyin.
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

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI’dan eşleştirme hataları geliyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Install Overview](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker’a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Updating](/tr/install/updating) — OpenClaw’ı güncel tutma
- [Configuration](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması

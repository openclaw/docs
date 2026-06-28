---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: İsteğe bağlı Docker tabanlı kurulum ve OpenClaw’a katılım
title: Docker
x-i18n:
    generated_at: "2026-06-28T00:43:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca container'lı bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için uygun mu?

- **Evet**: yalıtılmış, atılabilir bir Gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulumlar olmadan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalıştırıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox arka ucu, sandboxing etkinleştirildiğinde Docker kullanır; ancak sandboxing varsayılan olarak kapalıdır ve tüm Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB host'larda çıkış 137 ile OOM nedeniyle sonlandırılabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/public host üzerinde çalıştırıyorsanız,
  [Ağ erişimi için güvenlik sıkılaştırması](/tr/gateway/security) bölümünü,
  özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Container'lı Gateway

<Steps>
  <Step title="Build the image">
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
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="Airgapped rerun">
    Çevrimdışı host'larda önce imajı aktarın ve yükleyin:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline`, `OPENCLAW_IMAGE` öğesinin yerelde zaten bulunduğunu doğrular,
    örtük Compose pull ve derleme işlemlerini devre dışı bırakır, ardından
    `.env` eşitleme, izin düzeltmeleri, onboarding, Gateway yapılandırma eşitlemesi
    ve Compose başlatma gibi normal kurulum akışını çalıştırır.

    `OPENCLAW_SANDBOX=1` ise çevrimdışı kurulum,
    `OPENCLAW_DOCKER_SOCKET` arkasındaki daemon üzerinde yapılandırılmış varsayılan
    ve etkin ajan başına sandbox imajlarını da denetler. Docker destekli tarayıcı
    imajları ayrıca geçerli OpenClaw tarayıcı sözleşmesi etiketini de taşımalıdır.
    Gerekli bir imaj eksik veya uyumsuz olduğunda kurulum, kullanılamaz bir
    sandbox ile başarı bildirmek yerine sandbox yapılandırmasını değiştirmeden çıkar.

  </Step>

  <Step title="Complete onboarding">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - provider API anahtarlarını ister
    - bir Gateway token'ı üretir ve `.env` dosyasına yazar
    - auth-profile gizli anahtar dizinini oluşturur
    - Gateway'i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve yapılandırma yazma işlemleri
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway
    container'ı zaten mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Open the Control UI">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli değeri Settings içine yapıştırın. Kurulum betiği varsayılan
    olarak `.env` dosyasına bir token yazar; container yapılandırmasını parola
    kimlik doğrulamasına geçirirseniz bunun yerine o parolayı kullanın.

    URL'ye tekrar mı ihtiyacınız var?

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği
`docker-compose.extra.yml` yazar; bunu standart override dosyalarından sonra
ekleyin, örneğin her iki override dosyası da varsa
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
kullanın.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ile aynı ağ ad alanını paylaştığı için
başlatma sonrası aracıdır. `docker compose up -d openclaw-gateway` öncesinde
onboarding ve kurulum zamanı yapılandırma yazma işlemlerini
`--no-deps --entrypoint node` ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerelde derlemek yerine uzak bir imaj kullan                          |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Derleme sırasında ek apt paketleri kur (boşlukla ayrılmış)            |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Derleme sırasında ek Python paketleri kur (boşlukla ayrılmış)         |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında Plugin bağımlılıklarını önceden kur (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`)    |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` öğesini adlandırılmış bir Docker volume içinde kalıcılaştır |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap'a katıl (`1`, `true`, `yes`, `on`)                  |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atla (`1`, `true`, `yes`, `on`)        |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu geçersiz kıl                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırak (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketli Plugin kaynak bind-mount overlay'lerini devre dışı bırak      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector endpoint'i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Trace, metric veya log'lar için sinyale özgü OTLP endpoint'leri       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan servis adı                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI semantik özniteliklerine katıl                 |
| `OPENCLAW_OTEL_PRELOADED`                  | Biri önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atla |

Resmi Docker imajı Homebrew ile gelmez. Onboarding sırasında OpenClaw,
`brew` bulunmayan bir Linux container içinde çalışıyorsa yalnızca brew'e bağlı
skill bağımlılık kurucularını gizler; bu bağımlılıklar özel bir imajla sağlanmalı
veya manuel olarak kurulmalıdır. Debian paketlerinden sağlanabilen bağımlılıklar
için imaj derlemesi sırasında `OPENCLAW_IMAGE_APT_PACKAGES` kullanın. Eski
`OPENCLAW_DOCKER_APT_PACKAGES` adı hâlâ kabul edilir.
Python bağımlılıkları için `OPENCLAW_IMAGE_PIP_PACKAGES` kullanın. Bu işlem,
imaj derlemesi sırasında `python3 -m pip install --break-system-packages`
çalıştırır; bu nedenle paket sürümlerini sabitleyin ve yalnızca güvendiğiniz
paket indekslerini kullanın.

Maintainer'lar, paketlenmiş bir imaj üzerinde paketli Plugin kaynağını test etmek
için bir Plugin kaynak dizinini paketli kaynak yolunun üzerine mount edebilir,
örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu mount edilen kaynak dizini, aynı Plugin id için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway container'ından OTLP collector'ınıza giden
yönde yapılır. Yayımlanmış bir Docker portu gerektirmez. İmajı yerelde derliyor
ve paketli OpenTelemetry exporter'ın imaj içinde kullanılabilir olmasını
istiyorsanız çalışma zamanı bağımlılıklarını ekleyin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Paketlenmiş Docker kurulumlarında dışa aktarımı etkinleştirmeden önce resmi
`@openclaw/diagnostics-otel` Plugin'ini ClawHub'dan kurun. Özel kaynak derlemeli
imajlar yerel Plugin kaynağını
`OPENCLAW_EXTENSIONS=diagnostics-otel` ile yine de içerebilir. Dışa aktarımı
etkinleştirmek için yapılandırmada `diagnostics-otel` Plugin'ine izin verin ve
onu etkinleştirin, ardından `diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümündeki yapılandırma
örneğini kullanın. Collector kimlik doğrulama başlıkları Docker ortam değişkenleri
üzerinden değil, `diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metric'leri zaten yayımlanmış Gateway portunu kullanır.
`clawhub:@openclaw/diagnostics-prometheus` kurun, `diagnostics-prometheus`
Plugin'ini etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route, Gateway kimlik doğrulamasıyla korunur. Ayrı bir public `/metrics` portu
veya kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metric'leri](/tr/gateway/prometheus).

### Health check'ler

Container probe endpoint'leri (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` ping'leyen yerleşik bir `HEALTHCHECK` içerir.
Denetimler başarısız olmaya devam ederse Docker container'ı `unhealthy` olarak
işaretler ve orchestration sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback karşılaştırması

`scripts/docker/setup.sh`, Docker port yayımlama ile
`http://127.0.0.1:18789` host erişiminin çalışması için varsayılan olarak
`OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): host tarayıcısı ve host CLI yayımlanmış Gateway portuna erişebilir.
- `loopback`: yalnızca container ağ ad alanı içindeki süreçler Gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bind mode değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi host alias'ları kullanmayın.
</Note>

### Host Yerel Provider'lar

OpenClaw Docker içinde çalıştığında container içindeki `127.0.0.1`, host
makineniz değil container'ın kendisidir. Host üzerinde çalışan AI provider'ları
için `host.docker.internal` kullanın:

| Provider  | Host varsayılan URL'si  | Docker kurulum URL'si              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Paketli Docker kurulumu, bu host URL'lerini LM Studio ve Ollama onboarding
varsayılanları olarak kullanır ve `docker-compose.yml`, Linux Docker Engine için
`host.docker.internal` öğesini Docker'ın host Gateway'ine eşler. Docker Desktop,
macOS ve Windows üzerinde aynı hostname'i zaten sağlar.

Host servisleri ayrıca Docker'dan erişilebilen bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız, aynı ana makine
eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Docker'da Claude CLI arka ucu

Resmi OpenClaw Docker imajı Claude Code'u önceden yüklemez. OpenClaw'u çalıştıran
container kullanıcısı içinde Claude Code'u kurup oturum açın, ardından imaj
yükseltmeleri ikili dosyayı veya Claude kimlik doğrulama durumunu silmesin diye
o container ana dizinini kalıcı hale getirin.

Yeni Docker kurulumları için, kurulumu çalıştırmadan önce kalıcı bir `/home/node`
birimini etkinleştirin:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Mevcut bir Docker kurulumu için önce stack'i durdurun ve kurulumu yeniden
çalıştırmadan önce geçerli Docker `.env` değerlerini yeniden yükleyin. Kurulum
betiği `.env` dosyasını kendiliğinden okumaz; `.env` dosyasını geçerli shell ve
varsayılanlardan yeniden yazar. Oluşturulan `.env` için şunu çalıştırın:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

`.env` dosyanız shell'inizin kaynak olarak okuyamayacağı değerler içeriyorsa,
önce güvendiğiniz mevcut değerleri elle yeniden export edin; örneğin
`OPENCLAW_IMAGE`, portlar, bind modu, özel yollar, `OPENCLAW_EXTRA_MOUNTS`,
sandbox ve onboarding atlama ayarları. Oluşturulan overlay, ana dizin birimini
hem `openclaw-gateway` hem de `openclaw-cli` için bağlar.

Kalan komutları oluşturulan Compose overlay'iyle çalıştırın; böylece iki servis
de kalıcı ana dizini bağlar. Kurulumunuz `docker-compose.override.yml` de
kullanıyorsa, bunu `docker-compose.extra.yml` dosyasından önce ekleyin.

Claude Code'u bu kalıcı ana dizine kurun:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Yerel kurucu, `claude` ikili dosyasını
`/home/node/.local/bin/claude` altına yazar. OpenClaw'a bu container yolunu
kullanmasını söyleyin:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Aynı kalıcı container ana dizininin içinden oturum açın ve doğrulayın:

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

Bundan sonra, paketle gelen `claude-cli` arka ucunu kullanabilirsiniz:

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
`/home/node/.claude.json` altında kalıcı hale getirir. Yalnızca
`/home/node/.openclaw` dizinini kalıcı hale getirmek Claude CLI yeniden kullanımı
için yeterli değildir. Ana dizin birimi yerine `OPENCLAW_EXTRA_MOUNTS`
kullanıyorsanız, bu Claude yollarının tümünü iki Docker servisine de bağlayın.

<Note>
Paylaşılan production otomasyonu veya öngörülebilir Anthropic faturalaması için
Anthropic API anahtarı yolunu tercih edin. Claude CLI yeniden kullanımı Claude
Code'un kurulu sürümünü, hesap oturumunu, faturalamasını ve güncelleme davranışını
izler.
</Note>

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast
(`224.0.0.251:5353`) trafiğini güvenilir biçimde iletmez. Bu nedenle paketle
gelen Compose kurulumu varsayılan olarak `OPENCLAW_DISABLE_BONJOUR=1` ayarını
kullanır; böylece bridge multicast trafiğini düşürdüğünde Gateway crash-loop'a
girmez veya reklamı tekrar tekrar yeniden başlatmaz.

Docker ana makineleri için yayımlanan Gateway URL'sini, Tailscale'i veya geniş
alan DNS-SD'yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host
networking, macvlan veya mDNS multicast'in çalıştığı bilinen başka bir ağ ile
çalıştırırken ayarlayın.

Dikkat edilmesi gereken noktalar ve sorun giderme için bkz.
[Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değişkenini `/home/node/.openclaw`
dizinine, `OPENCLAW_WORKSPACE_DIR` değişkenini `/home/node/.openclaw/workspace`
dizinine ve `OPENCLAW_AUTH_PROFILE_SECRET_DIR` değişkenini
`/home/node/.config/openclaw` dizinine bind-mount yapar; böylece bu yollar
container değişiminden sonra da korunur. Herhangi bir değişken ayarlanmamışsa,
paketle gelen `docker-compose.yml` `${HOME}` altına, `HOME` da eksikse `/tmp`
altına geri döner. Bu, yalın ortamlarda `docker compose up` komutunun boş
kaynaklı bir volume spec üretmesini engeller.

Bu bağlanan yapılandırma dizini, OpenClaw'un şunları tuttuğu yerdir:

- Davranış yapılandırması için `openclaw.json`
- Depolanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı sırları için `.env`

Kimlik doğrulama profili gizli anahtar dizini, OAuth destekli kimlik doğrulama
profili token materyali için kullanılan yerel şifreleme anahtarını saklar. Bunu
Docker ana makine durumunuzla birlikte, ancak `OPENCLAW_CONFIG_DIR` dizininden
ayrı tutun.

Kurulan indirilebilir plugin'ler, paket durumlarını bağlanan OpenClaw ana dizini
altında saklar; böylece plugin kurulum kayıtları ve paket kökleri container
değişiminden sonra da korunur. Gateway başlangıcı, paketle gelen plugin bağımlılık
ağaçları oluşturmaz.

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Runtime - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

  **Disk büyümesi sıcak noktaları:** `media/`, oturum JSONL dosyalarını, paylaşılan SQLite durum veritabanını, yüklü plugin paket köklerini ve `/tmp/openclaw/` altındaki dönen dosya günlüklerini izleyin.

  ### Shell yardımcıları (isteğe bağlı)

  Günlük Docker yönetimini kolaylaştırmak için `ClawDock` yükleyin:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan yüklediyseniz, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki yükleme komutunu yeniden çalıştırın.

  Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. komutları kullanın. Tüm komutlar için `clawdock-help` çalıştırın.
  Tam yardımcı kılavuzu için [ClawDock](/tr/install/clawdock) sayfasına bakın.

  <AccordionGroup>
  <Accordion title="Docker Gateway için ajan korumalı alanını etkinleştir">
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

    Betik, `docker.sock` dosyasını yalnızca korumalı alan önkoşulları geçtikten sonra bağlar. Korumalı alan kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode` değerini `off` olarak sıfırlar. OpenClaw korumalı alanı etkin durumdayken Codex code-mode dönüşleri hâlâ Codex `workspace-write` ile sınırlıdır; ana makine Docker soketini ajan korumalı alan kapsayıcılarına bağlamayın.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose pseudo-TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI komutlarının `127.0.0.1` üzerinden Gateway'e erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak ele alın. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve hem `openclaw-gateway` hem de `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="openclaw-cli içinde Docker Desktop DNS hataları">
    Bazı Docker Desktop kurulumlarında, `NET_RAW` kaldırıldıktan sonra paylaşılan ağdaki `openclaw-cli` sidecar'ından DNS sorguları başarısız olur; bu, `openclaw plugins install` gibi npm destekli komutlarda `EAI_AGAIN` olarak görünür. Normal Gateway çalışması için varsayılan sağlamlaştırılmış Compose dosyasını koruyun. Aşağıdaki yerel override, Docker'ın varsayılan yeteneklerini geri yükleyerek CLI kapsayıcısının güvenlik duruşunu gevşetir; bu nedenle bunu varsayılan Compose çağrınız olarak değil, yalnızca paket kayıt defteri erişimi gerektiren tek seferlik CLI komutu için kullanın:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Zaten uzun süre çalışan bir `openclaw-cli` kapsayıcısı oluşturduysanız, aynı override ile yeniden oluşturun. `docker compose exec` ve `docker exec`, zaten oluşturulmuş bir kapsayıcıda Linux yeteneklerini değiştiremez.

  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` olarak çalışır (uid 1000). `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000 tarafından sahiplenildiğinden emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Aynı uyumsuzluk, `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` gibi bir plugin uyarısı ve ardından `plugin present but blocked` olarak da görünebilir. Bu, işlem uid'si ile bağlanan plugin dizininin sahibinin uyuşmadığı anlamına gelir. Kapsayıcıyı varsayılan uid 1000 ile çalıştırmayı ve bind mount sahipliğini düzeltmeyi tercih edin. `/path/to/openclaw-config/npm` yolunu yalnızca OpenClaw'ı uzun vadede bilerek root olarak çalıştırıyorsanız `root:root` yapın.

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, kilit dosyaları değişmedikçe `pnpm install` komutunun yeniden çalıştırılmasını önler:

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

  <Accordion title="Uzman kullanıcı kapsayıcı seçenekleri">
    Varsayılan imaj güvenliği önceleyen bir yapıdadır ve root olmayan `node` olarak çalışır. Daha tam özellikli bir kapsayıcı için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja dahil edin**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python bağımlılıklarını imaja dahil edin**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium'u imaja dahil edin**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Veya Playwright tarayıcılarını kalıcı bir birime yükleyin**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Tarayıcı indirmelerini kalıcı tutun**: `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın. OpenClaw, Linux'ta Docker imajının Playwright tarafından yönetilen Chromium'unu otomatik algılar.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açar. Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayıp kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve uzun süre çalışan kapsayıcılarda zombi süreçlerin temizlenmesini ve sinyallerin doğru şekilde işlenmesini sağlamak için giriş noktası init süreci (PID 1) olarak `tini` içerir. `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil olmak üzere OCI temel imaj ek açıklamalarını yayımlar. Node temel özeti,
    Dependabot Docker temel imaj PR'ları aracılığıyla yenilenir; sürüm derlemeleri
    bir dağıtım yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj ek açıklamaları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkiliyi imaja gömme, kalıcılık ve güncellemeler dahil paylaşımlı VM dağıtım adımları için
[Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Ajan korumalı alanı

Docker arka ucu ile `agents.defaults.sandbox` etkinleştirildiğinde, Gateway
ajan araç yürütmesini (kabuk, dosya okuma/yazma vb.) yalıtılmış Docker
kapsayıcıları içinde çalıştırırken Gateway'in kendisi ana makinede kalır. Bu,
Gateway'in tamamını kapsayıcıya almadan güvenilmeyen veya çok kiracılı ajan
oturumlarının etrafına sert bir duvar koyar.

Korumalı alan kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam,
`/workspace` konumuna bağlanan kendi çalışma alanını alır. Ayrıca
araç izin/verme politikalarını, ağ yalıtımını, kaynak sınırlarını ve tarayıcı
kapsayıcılarını yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Korumalı Alan](/tr/gateway/sandboxing) -- eksiksiz korumalı alan başvurusu
- [OpenShell](/tr/gateway/openshell) -- korumalı alan kapsayıcılarına etkileşimli kabuk erişimi
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

Varsayılan korumalı alan imajını derleyin (bir kaynak checkout'ından):

```bash
scripts/sandbox-setup.sh
```

Kaynak checkout'ı olmadan npm kurulumları için satır içi `docker build` komutları hakkında [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümüne bakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya korumalı alan kapsayıcısı başlamıyor">
    Korumalı alan imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (kaynak checkout'ı) ile veya [Korumalı Alan § İmajlar ve kurulum](/tr/gateway/sandboxing#images-and-setup) bölümündeki satır içi `docker build` komutuyla (npm kurulumu) derleyin,
    ya da `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar, ihtiyaç duyulduğunda oturum başına otomatik olarak oluşturulur.
  </Accordion>

  <Accordion title="Korumalı alanda izin hataları">
    `docker.user` değerini bağladığınız çalışma alanının sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini chown ile değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar korumalı alanda bulunamıyor">
    OpenClaw komutları `sh -lc` (oturum açma kabuğu) ile çalıştırır; bu,
    `/etc/profile` dosyasını kaynak olarak yükler ve PATH değerini sıfırlayabilir. Özel araç yollarınızı başa eklemek için
    `docker.env.PATH` ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM nedeniyle sonlandırıldı (çıkış 137)">
    VM için en az 2 GB RAM gerekir. Daha büyük bir makine sınıfı kullanıp tekrar deneyin.
  </Accordion>

  <Accordion title="Kontrol Arayüzü'nde yetkisiz veya eşleştirme gerekiyor">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Pano](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

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
- [Podman](/tr/install/podman) — Docker için Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması
